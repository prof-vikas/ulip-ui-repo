#!/usr/bin/env node
/**
 * Builds the ULIP Angular front end with the production environment and packages
 * the result as a deployable WAR for Apache Tomcat.
 *
 *   npm run build:war
 *   npm run build:war -- --context-path /ulip --configuration production
 *
 * Output: dist/ulip.war
 *
 * The WAR contains the compiled browser bundle at the root plus:
 *   WEB-INF/web.xml            Servlet descriptor (welcome file, SPA 404 fallback, MIME types)
 *   WEB-INF/rewrite.config     Tomcat RewriteValve rules -> deep links answer 200, not 404
 *   META-INF/context.xml       Registers the RewriteValve for this webapp only
 *   WEB-INF/build-info.properties  What was built, when, against which API base URL
 *
 * No third-party packaging dependency is used: the archive is written with Node's
 * zlib plus a small ZIP writer, so `npm ci` stays lean and the build is portable.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ args */

function readArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--')) {
    return process.argv[index + 1];
  }
  const inline = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function normaliseContextPath(value) {
  const trimmed = String(value || '').trim().replace(/^\/+|\/+$/g, '');
  return `/${trimmed}`;
}

const configuration = readArg('configuration', 'production');
const contextPath = normaliseContextPath(
  readArg('context-path', process.env.ULIP_CONTEXT_PATH || '/ulip'),
);
const contextName = contextPath === '/' ? 'ROOT' : contextPath.slice(1);
const baseHref = `${contextPath === '/' ? '' : contextPath}/`;
const distRoot = path.join(projectRoot, 'dist');
const ngOutput = path.join(distRoot, 'ulip');
const browserDir = path.join(ngOutput, 'browser');
const stageDir = path.join(distRoot, 'war');
const warFile = path.join(distRoot, `${contextName}.war`);

/* --------------------------------------------------------------- helpers */

function log(message) {
  process.stdout.write(`[build:war] ${message}\n`);
}

function fail(message) {
  process.stderr.write(`[build:war] ERROR: ${message}\n`);
  process.exit(1);
}

function walk(dir, relative = '') {
  const entries = [];
  for (const name of fs.readdirSync(path.join(dir, relative)).sort()) {
    const rel = relative ? `${relative}/${name}` : name;
    const stat = fs.statSync(path.join(dir, rel));
    if (stat.isDirectory()) {
      entries.push(...walk(dir, rel));
    } else {
      entries.push({ rel, stat });
    }
  }
  return entries;
}

/* ------------------------------------------------------------ ZIP writer */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function dosDateTime(date) {
  return {
    time:
      ((date.getHours() & 0x1f) << 11) |
      ((date.getMinutes() & 0x3f) << 5) |
      ((date.getSeconds() / 2) & 0x1f),
    date:
      (((date.getFullYear() - 1980) & 0x7f) << 9) |
      (((date.getMonth() + 1) & 0x0f) << 5) |
      (date.getDate() & 0x1f),
  };
}

/** Minimal ZIP (deflate/stored) writer with forward-slash entry names. */
function writeZip(target, files, timestamp) {
  const { time, date } = dosDateTime(timestamp);
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.rel, 'utf8');
    const data = fs.readFileSync(file.path);
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < data.length;
    const payload = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed to extract
    local.writeUInt16LE(0x0800, 6); // UTF-8 file names
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // extra field length

    chunks.push(local, name, payload);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4); // version made by
    header.writeUInt16LE(20, 6); // version needed
    header.writeUInt16LE(0x0800, 8);
    header.writeUInt16LE(method, 10);
    header.writeUInt16LE(time, 12);
    header.writeUInt16LE(date, 14);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(payload.length, 20);
    header.writeUInt32LE(data.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt16LE(0, 30); // extra
    header.writeUInt16LE(0, 32); // comment
    header.writeUInt16LE(0, 34); // disk number
    header.writeUInt16LE(0, 36); // internal attrs
    header.writeUInt32LE((0o100644 << 16) >>> 0, 38); // -rw-r--r--
    header.writeUInt32LE(offset, 42);
    central.push(header, name);

    offset += local.length + name.length + payload.length;
  }

  const centralBuffer = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  fs.writeFileSync(target, Buffer.concat([...chunks, centralBuffer, end]));
}

/* ----------------------------------------------------------- descriptors */

function webXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">

  <display-name>ULIP</display-name>

  <welcome-file-list>
    <welcome-file>index.html</welcome-file>
  </welcome-file-list>

  <!-- Safety net for servers where META-INF/context.xml is not applied: unknown
       paths are served by the Angular router instead of Tomcat's 404 page. -->
  <error-page>
    <error-code>404</error-code>
    <location>/index.html</location>
  </error-page>

  <mime-mapping>
    <extension>js</extension>
    <mime-type>text/javascript</mime-type>
  </mime-mapping>
  <mime-mapping>
    <extension>mjs</extension>
    <mime-type>text/javascript</mime-type>
  </mime-mapping>
  <mime-mapping>
    <extension>json</extension>
    <mime-type>application/json</mime-type>
  </mime-mapping>
  <mime-mapping>
    <extension>css</extension>
    <mime-type>text/css</mime-type>
  </mime-mapping>
  <mime-mapping>
    <extension>svg</extension>
    <mime-type>image/svg+xml</mime-type>
  </mime-mapping>
  <mime-mapping>
    <extension>woff2</extension>
    <mime-type>font/woff2</mime-type>
  </mime-mapping>
  <mime-mapping>
    <extension>ico</extension>
    <mime-type>image/x-icon</mime-type>
  </mime-mapping>
</web-app>
`;
}

function rewriteConfig() {
  return `# SPA fallback for Apache Tomcat's RewriteValve.
# Everything that is not a static asset or an API call is handed to index.html so
# Angular's router can resolve /dashboard/... on a hard refresh.
# REQUEST_URI always includes the context path, so this works at /ulip and at ROOT.
# Note: REQUEST_FILENAME is not usable here - Tomcat resolves it through
# request.getPathTranslated(), which is null before servlet mapping.
RewriteCond %{REQUEST_URI} !.*/api/.*
RewriteCond %{REQUEST_URI} !.*[.](?:js|mjs|css|map|json|txt|ico|png|jpe?g|gif|svg|webp|woff2?|ttf|eot)$ [NC]
RewriteRule ^(.*)$ /index.html [L]
`;
}

function contextXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Applies to this web application only; no change to Tomcat's conf/server.xml. -->
<Context>
  <Valve className="org.apache.catalina.valves.rewrite.RewriteValve" />
</Context>
`;
}

function readProdEnvironment() {
  const file = path.join(projectRoot, 'src', 'environments', 'environment.prod.ts');
  if (!fs.existsSync(file)) return {};
  const source = fs.readFileSync(file, 'utf8');
  const apiBaseUrl = /apiBaseUrl\s*:\s*['"]([^'"]*)['"]/.exec(source);
  const menuModules = /menuModules\s*:\s*('all'|\[[^\]]*\])/.exec(source);
  return {
    apiBaseUrl: apiBaseUrl ? apiBaseUrl[1] : 'unknown',
    menuModules: menuModules ? menuModules[1].replace(/\s+/g, ' ') : 'unknown',
  };
}

/* ----------------------------------------------------------------- build */

if (!hasFlag('skip-build')) {
  const ngCli = path.join(projectRoot, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
  if (!fs.existsSync(ngCli)) {
    fail('Angular CLI not found. Run `npm ci` (or `npm install`) first.');
  }
  log(`building with configuration "${configuration}" and base href "${baseHref}"`);
  const result = spawnSync(
    process.execPath,
    [ngCli, 'build', '--configuration', configuration, '--base-href', baseHref, '--output-path', 'dist/ulip'],
    { cwd: projectRoot, stdio: 'inherit' },
  );
  if (result.status !== 0) {
    fail(`Angular build failed with exit code ${result.status}`);
  }
}

if (!fs.existsSync(path.join(browserDir, 'index.html'))) {
  fail(`No build output at ${browserDir}. Run without --skip-build first.`);
}

log('staging WAR contents');
fs.rmSync(stageDir, { recursive: true, force: true });
fs.mkdirSync(path.join(stageDir, 'WEB-INF'), { recursive: true });
fs.mkdirSync(path.join(stageDir, 'META-INF'), { recursive: true });
fs.cpSync(browserDir, stageDir, { recursive: true });

const env = readProdEnvironment();
const builtAt = new Date();

fs.writeFileSync(path.join(stageDir, 'WEB-INF', 'web.xml'), webXml(), 'utf8');
fs.writeFileSync(path.join(stageDir, 'WEB-INF', 'rewrite.config'), rewriteConfig(), 'utf8');
fs.writeFileSync(path.join(stageDir, 'META-INF', 'context.xml'), contextXml(), 'utf8');
fs.writeFileSync(
  path.join(stageDir, 'WEB-INF', 'build-info.properties'),
  [
    `name=ulip`,
    `context-path=${contextPath}`,
    `configuration=${configuration}`,
    `environment-file=src/environments/environment.prod.ts`,
    `api-base-url=${env.apiBaseUrl}`,
    `menu-modules=${env.menuModules}`,
    `base-href=${baseHref}`,
    `built-at=${builtAt.toISOString()}`,
    '',
  ].join('\n'),
  'utf8',
);
fs.writeFileSync(
  path.join(stageDir, 'META-INF', 'MANIFEST.MF'),
  [
    'Manifest-Version: 1.0',
    'Implementation-Title: ULIP',
    `Implementation-Version: ${builtAt.toISOString().replace(/[-:T]/g, '').slice(0, 14)}`,
    'Created-By: npm run build:war',
    '',
  ].join('\r\n'),
  'utf8',
);

const files = walk(stageDir).map((entry) => ({ rel: entry.rel, path: path.join(stageDir, entry.rel) }));
writeZip(warFile, files, builtAt);

const sizeMb = (fs.statSync(warFile).size / (1024 * 1024)).toFixed(2);
log(`created ${path.relative(projectRoot, warFile)} (${sizeMb} MB, ${files.length} entries)`);
log(`context path : ${contextPath}`);
log(`api base URL : ${env.apiBaseUrl}  (baked from environment.prod.ts)`);
log(`menu modules : ${env.menuModules}`);
log(`deploy with  : npm run deploy:tomcat`);
