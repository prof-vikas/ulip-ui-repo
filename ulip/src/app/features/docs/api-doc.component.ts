import { Component, HostBinding, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiDoc } from './doc.model';
import { API_DOCS } from './api-docs';
import { SARATHI_DOC } from './sarathi.doc';
import { FASTAG_01_DOC, FASTAG_02_DOC } from './fastag.doc';
import { FOIS_01_DOC, FOIS_02_DOC } from './fois.doc';
import { EWAYBILL_DOC } from './ewaybill.doc';

/** Public base URLs shown in the docs (production deployment). */
const PUBLIC_BASE = 'https://ulip.surajinformatics.in/ulip';
const TOKEN_URL = `${PUBLIC_BASE}/api/rbac/v1/oauth/token`;

const DOCS: Record<string, ApiDoc> = Object.fromEntries(
  [SARATHI_DOC, FASTAG_01_DOC, FASTAG_02_DOC, FOIS_01_DOC, FOIS_02_DOC, EWAYBILL_DOC].map(d => [d.slug, d])
);

type Lang = 'curl' | 'javascript' | 'python' | 'java';

@Component({
  selector: 'app-api-doc',
  standalone: false,
  templateUrl: './api-doc.component.html',
  styleUrls: ['./api-doc.component.css']
})
export class ApiDocComponent {
  readonly doc = signal<ApiDoc | null>(null);
  readonly lang = signal<Lang>('curl');
  readonly langs: { id: Lang; label: string }[] = [
    { id: 'curl', label: 'cURL' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'java', label: 'Java' }
  ];
  readonly toc = [
    { id: 'overview', label: 'Overview' },
    { id: 'auth', label: 'Authentication' },
    { id: 'request', label: 'Request' },
    { id: 'response', label: 'Response' },
    { id: 'fields', label: 'Field reference' },
    { id: 'codes', label: 'Status codes' },
    { id: 'notes', label: 'Quota, caching & data' },
    { id: 'samples', label: 'Code samples' }
  ];
  readonly tokenUrl = TOKEN_URL;
  readonly index = API_DOCS;
  /** True on /docs without a slug: show the list of references. */
  readonly listing = signal(false);
  copied = signal('');
  /** Public site (/docs, no sign-in needed) rather than the portal (/dashboard/docs). */
  @HostBinding('class.public-doc') readonly isPublic: boolean;
  readonly links: { docs: string; catalog: string; keys: string };

  readonly endpointUrl = computed(() => (this.doc() ? `${PUBLIC_BASE}${this.doc()!.path}` : ''));
  readonly requestJson = computed(() => JSON.stringify(this.doc()?.request.example ?? {}, null, 2));
  readonly responseJson = computed(() => JSON.stringify(this.doc()?.sampleResponse ?? {}, null, 2));
  readonly errorJson = computed(() => JSON.stringify(this.doc()?.errorSample ?? {}, null, 2));
  readonly sample = computed(() => this.buildSample(this.lang()));
  readonly canOpen = computed(() => {
    const d = this.doc();
    return !!d && !!d.portalPath && this.auth.menuAllows(`/dashboard${d.portalPath}`);
  });

  constructor(route: ActivatedRoute, private auth: AuthService) {
    this.isPublic = !!route.snapshot.data['public'];
    this.links = this.isPublic
      ? { docs: '/docs', catalog: '/catalog', keys: this.auth.isLoggedIn() ? '/dashboard/keys' : '/signup' }
      : { docs: '/dashboard/docs', catalog: '/dashboard/catalog', keys: '/dashboard/keys' };
    route.paramMap.subscribe(p => {
      const slug = p.get('slug');
      this.listing.set(!slug);
      this.doc.set(slug ? DOCS[slug] ?? null : null);
      this.lang.set('curl');
    });
  }

  get signedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  copy(text: string, key: string): void {
    navigator.clipboard?.writeText(text).then(() => {
      this.copied.set(key);
      setTimeout(() => this.copied.set(''), 1800);
    });
  }

  private buildSample(lang: Lang): string {
    const d = this.doc();
    if (!d) {
      return '';
    }
    const url = this.endpointUrl();
    const body = JSON.stringify(d.request.example);
    const pretty = JSON.stringify(d.request.example, null, 2);
    const js = (path: (string | number)[]) => path.map(p => (typeof p === 'number' ? `[${p}]` : `.${p}`)).join('');
    const py = (path: (string | number)[]) => path.map(p => (typeof p === 'number' ? `[${p}]` : `["${p}"]`)).join('');
    const pointer = (path: (string | number)[]) => '/' + path.join('/');
    switch (lang) {
      case 'curl':
        return [
          '# 1. Exchange your API key for a 15-minute token',
          `TOKEN=$(curl -s -X POST "${TOKEN_URL}" \\`,
          '  -H "X-API-Key: $GATIVRA_API_KEY" | jq -r .access_token)',
          '',
          `# 2. Call ${d.title.split(' —')[0]}`,
          `curl -s -X ${d.method} "${url}" \\`,
          '  -H "Authorization: Bearer $TOKEN" \\',
          '  -H "Content-Type: application/json" \\',
          `  -d '${body}'`
        ].join('\n');
      case 'javascript':
        return [
          '// Node 18+ (global fetch). Keep the API key on your server, never in a browser.',
          'async function getToken() {',
          `  const res = await fetch('${TOKEN_URL}', {`,
          "    method: 'POST',",
          '    headers: { \'X-API-Key\': process.env.GATIVRA_API_KEY }',
          '  });',
          '  if (!res.ok) throw new Error(`token: HTTP ${res.status}`);',
          '  return (await res.json()).access_token; // valid for 15 minutes; cache and reuse it',
          '}',
          '',
          `async function lookup(payload) {`,
          `  const res = await fetch('${url}', {`,
          `    method: '${d.method}',`,
          "    headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },",
          '    body: JSON.stringify(payload)',
          '  });',
          '  const data = await res.json();',
          "  if (data.error !== 'false' || data.code !== '200') {",
          '    throw new Error(`Gativra API ${data.code}: ${data.message}`); // errors come back with HTTP 200',
          '  }',
          `  return data${js(d.recordPath)};`,
          '}',
          '',
          `lookup(${pretty}).then(r => console.log(r${js(d.printField)}));`
        ].join('\n');
      case 'python':
        return [
          'import os, requests',
          '',
          `TOKEN_URL = "${TOKEN_URL}"`,
          `API_URL = "${url}"`,
          '',
          'def get_token():',
          '    r = requests.post(TOKEN_URL, headers={"X-API-Key": os.environ["GATIVRA_API_KEY"]}, timeout=15)',
          '    r.raise_for_status()',
          '    return r.json()["access_token"]  # valid for 15 minutes; cache and reuse it',
          '',
          'def lookup(payload):',
          '    r = requests.post(API_URL, json=payload, timeout=60,',
          '                      headers={"Authorization": f"Bearer {get_token()}"})',
          '    r.raise_for_status()',
          '    data = r.json()',
          '    if data.get("error") != "false" or data.get("code") != "200":',
          '        raise RuntimeError(f"Gativra API {data.get(\'code\')}: {data.get(\'message\')}")  # HTTP is 200 here',
          `    return data${py(d.recordPath)}`,
          '',
          `record = lookup(${body})`,
          `print(record${py(d.printField)})`
        ].join('\n');
      case 'java':
        return [
          '// Java 11+ java.net.http; use your JSON library (Jackson shown) to read the body.',
          'HttpClient http = HttpClient.newHttpClient();',
          'ObjectMapper json = new ObjectMapper();',
          '',
          `HttpRequest tokenReq = HttpRequest.newBuilder(URI.create("${TOKEN_URL}"))`,
          '    .header("X-API-Key", System.getenv("GATIVRA_API_KEY"))',
          '    .POST(HttpRequest.BodyPublishers.noBody()).build();',
          'String token = json.readTree(http.send(tokenReq, BodyHandlers.ofString()).body())',
          '    .get("access_token").asText();  // valid for 15 minutes; cache and reuse it',
          '',
          `HttpRequest req = HttpRequest.newBuilder(URI.create("${url}"))`,
          '    .header("Authorization", "Bearer " + token)',
          '    .header("Content-Type", "application/json")',
          `    .POST(HttpRequest.BodyPublishers.ofString(${JSON.stringify(body)}))`,
          '    .timeout(Duration.ofSeconds(60)).build();',
          '',
          'JsonNode data = json.readTree(http.send(req, BodyHandlers.ofString()).body());',
          'if (!"false".equals(data.path("error").asText()) || !"200".equals(data.path("code").asText())) {',
          '    throw new IllegalStateException("Gativra API " + data.path("code").asText() + ": " + data.path("message").asText());',
          '}',
          `JsonNode record = data.at("${pointer(d.recordPath)}");`,
          `System.out.println(record.at("${pointer(d.printField)}").asText());`
        ].join('\n');
    }
  }
}
