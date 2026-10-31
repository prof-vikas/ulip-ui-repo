#!/usr/bin/env node
/**
 * Deploys the packaged WAR to an Apache Tomcat installation and (by default)
 * starts Tomcat with production runtime settings.
 *
 *   npm run build:war
 *   npm run deploy:tomcat
 *   npm run deploy:tomcat -- --tomcat-home "D:\servers\tomcat" --context-path /ulip
 *   npm run deploy:tomcat -- --stop          # stop the instance this script started
 *
 * Why the JVM is launched directly instead of bin\startup.bat:
 *   - the script can record the real PID and stop the instance later without
 *     Windows service rights, and
 *   - production JVM settings are applied explicitly instead of depending on a
 *     machine-wide bin\setenv.bat.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
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

const hasFlag = (name) => process.argv.includes(`--${name}`);
const normaliseContextPath = (value) =>
  `/${String(value || '').trim().replace(/^\/+|\/+$/g, '')}`;

const contextPath = normaliseContextPath(
  readArg('context-path', process.env.ULIP_CONTEXT_PATH || '/ulip'),
);
const contextName = contextPath === '/' ? 'ROOT' : contextPath.slice(1);
const warFile = path.resolve(projectRoot, readArg('war', path.join('dist', `${contextName}.war`)));
const pidFile = path.join(projectRoot, 'dist', 'tomcat.pid');
const logDir = path.join(projectRoot, 'dist', 'logs');

function log(message) {
  process.stdout.write(`[deploy:tomcat] ${message}\n`);
}

function fail(message) {
  process.stderr.write(`[deploy:tomcat] ERROR: ${message}\n`);
  process.exit(1);
}

/* -------------------------------------------------------- Tomcat discovery */

function findTomcatHome() {
  const explicit = readArg('tomcat-home', process.env.CATALINA_HOME);
  const candidates = [explicit, 'C:\\Program Files\\Apache Software Foundation\\Tomcat 9.0', 'C:\\opt\\tomcat\\latest']
    .filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'conf', 'server.xml'))) return path.resolve(candidate);
  }
  fail(
    'Tomcat not found. Pass --tomcat-home <dir> or set CATALINA_HOME.\n' +
      `Checked: ${candidates.join(', ')}`,
  );
}

function findPort(tomcatHome) {
  const explicit = readArg('port');
  if (explicit) return Number(explicit);
  const serverXml = fs.readFileSync(path.join(tomcatHome, 'conf', 'server.xml'), 'utf8');
  const match = /<Connector[^>]*protocol="HTTP\/1\.1"[^>]*port="(\d+)"/.exec(serverXml)
    || /<Connector[^>]*port="(\d+)"[^>]*protocol="HTTP\/1\.1"/.exec(serverXml);
  return match ? Number(match[1]) : 8080;
}

function findJavaHome(tomcatHome) {
  const explicit = readArg('java-home', process.env.JAVA_HOME);
  if (explicit && fs.existsSync(path.join(explicit, 'bin', 'java.exe'))) return explicit;
  const jdkRoot = 'C:\\Program Files\\Java';
  if (fs.existsSync(jdkRoot)) {
    const jdks = fs
      .readdirSync(jdkRoot)
      .filter((name) => name.startsWith('jdk-') && fs.existsSync(path.join(jdkRoot, name, 'bin', 'java.exe')))
      .sort()
      .reverse();
    if (jdks.length) return path.join(jdkRoot, jdks[0]);
  }
  const javac = spawnSync('where.exe', ['java.exe'], { encoding: 'utf8' });
  if (javac.status === 0 && javac.stdout.trim()) {
    return path.dirname(path.dirname(javac.stdout.trim().split(/\r?\n/)[0]));
  }
  fail('No JDK/JRE found. Set JAVA_HOME or pass --java-home.');
}

/* ------------------------------------------------------------ HTTP probes */

function request(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', () => resolve(null));
  });
}

async function waitFor(label, predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await predicate();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return null;
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ stop */

function stopInstance() {
  if (!fs.existsSync(pidFile)) return false;
  const pid = Number(fs.readFileSync(pidFile, 'utf8').trim());
  if (!pid || !isProcessAlive(pid)) {
    fs.rmSync(pidFile, { force: true });
    return false;
  }
  log(`stopping Tomcat (pid ${pid})`);
  spawnSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
  const stopped = spawnSync('powershell.exe', [
    '-NoProfile',
    '-Command',
    `Wait-Process -Id ${pid} -Timeout 30 -ErrorAction SilentlyContinue`,
  ]);
  fs.rmSync(pidFile, { force: true });
  return stopped.status === 0 || !isProcessAlive(pid);
}

/* ------------------------------------------------------------------ main */

const tomcatHome = findTomcatHome();
const port = findPort(tomcatHome);
const javaHome = findJavaHome(tomcatHome);
const webapps = path.join(tomcatHome, 'webapps');
const siteUrl = `http://localhost:${port}${contextPath}/`;

if (hasFlag('stop')) {
  const stopped = stopInstance();
  log(stopped ? 'Tomcat stopped.' : 'No Tomcat process started by this script is running.');
  process.exit(0);
}

if (!fs.existsSync(warFile)) {
  fail(`WAR not found: ${warFile}\nRun "npm run build:war" first.`);
}
if (!fs.existsSync(webapps)) fail(`No webapps directory in ${tomcatHome}`);

if (hasFlag('dry-run')) {
  log(`tomcat home : ${tomcatHome}`);
  log(`port        : ${port}`);
  log(`war         : ${warFile}`);
  log(`target      : ${path.join(webapps, `${contextName}.war`)}`);
  log(`java        : ${path.join(javaHome, 'bin', 'java.exe')}`);
  log('dry run - nothing was changed.');
  process.exit(0);
}

// 1. Stop the instance this script owns (if any).
if (fs.existsSync(pidFile)) {
  stopInstance();
} else {
  const running = await request(siteUrl);
  if (running) {
    fail(
      `Something is already serving ${siteUrl}.\n` +
        'Stop that Tomcat (Windows service Tomcat9 or another process), then re-run.',
    );
  }
}

// 2. Keep the previous build, then replace the deployed context.
const backupDir = path.join(projectRoot, 'dist', 'backup');
fs.mkdirSync(backupDir, { recursive: true });
const deployedWar = path.join(webapps, `${contextName}.war`);
const deployedDir = path.join(webapps, contextName);
if (fs.existsSync(deployedWar)) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(deployedWar, path.join(backupDir, `${contextName}-${stamp}.war`));
  log(`previous WAR backed up to dist/backup/${contextName}-${stamp}.war`);
}
fs.rmSync(deployedDir, { recursive: true, force: true });
fs.copyFileSync(warFile, deployedWar);
log(`copied ${path.relative(projectRoot, warFile)} -> ${deployedWar}`);

// 3. Production runtime settings.
fs.mkdirSync(logDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const stdoutLog = path.join(logDir, `tomcat-${stamp}.out.log`);
const stderrLog = path.join(logDir, `tomcat-${stamp}.err.log`);
const out = fs.openSync(stdoutLog, 'a');
const err = fs.openSync(stderrLog, 'a');

const classpath = [path.join(tomcatHome, 'bin', 'bootstrap.jar'), path.join(tomcatHome, 'bin', 'tomcat-juli.jar')].join(';');
const jvmArgs = [
  `-Dcatalina.home=${tomcatHome}`,
  `-Dcatalina.base=${tomcatHome}`,
  `-Djava.io.tmpdir=${path.join(tomcatHome, 'temp')}`,
  `-Djava.util.logging.config.file=${path.join(tomcatHome, 'conf', 'logging.properties')}`,
  '-Djava.util.logging.manager=org.apache.juli.ClassLoaderLogManager',
  '-Dfile.encoding=UTF-8',
  '-Duser.language=en',
  '-Duser.country=IN',
  '-Xms512m',
  '-Xmx1024m',
  '-XX:+ExitOnOutOfMemoryError',
  '-classpath',
  classpath,
  'org.apache.catalina.startup.Bootstrap',
  'start',
];

if (hasFlag('no-start')) {
  log(`WAR deployed to ${deployedWar}; Tomcat not started (--no-start).`);
  process.exit(0);
}

const child = spawn(path.join(javaHome, 'bin', 'java.exe'), jvmArgs, {
  cwd: tomcatHome,
  detached: true,
  windowsHide: true,
  stdio: ['ignore', out, err],
  env: {
    ...process.env,
    JAVA_HOME: javaHome,
    CATALINA_HOME: tomcatHome,
    CATALINA_BASE: tomcatHome,
    ULIP_ENV: 'production',
    ULIP_CONTEXT_PATH: contextPath,
  },
});
child.unref();
fs.writeFileSync(pidFile, String(child.pid));
log(`started Tomcat pid ${child.pid} (JAVA_HOME=${javaHome})`);
log(`logs: ${path.relative(projectRoot, stdoutLog)}`);

// 4. Wait until the application answers.
const ready = await waitFor('ulip', () => request(siteUrl), 120000);
if (!ready) {
  fail(
    `Tomcat did not answer on ${siteUrl} within 120s.\n` +
      `Inspect ${stdoutLog} and ${stderrLog}.`,
  );
}
if (ready.status !== 200) fail(`Unexpected HTTP ${ready.status} from ${siteUrl}`);

// 5. Deep-link check: proves the SPA fallback works on refresh.
const deepLink = await request(`${siteUrl}dashboard/vahan`);
log(`root      ${siteUrl} -> HTTP ${ready.status}`);
log(`deep link ${siteUrl}dashboard/vahan -> HTTP ${deepLink ? deepLink.status : 'no response'}`);
log('deployment complete.');
