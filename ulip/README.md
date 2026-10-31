# Ulip

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.10.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Menu configuration (build time)

Which modules the sidebar exposes is decided at build time by `menuModules` in the
environment file used by that build (`src/environments/environment*.ts`):

```ts
menuModules: 'all',                        // Vahan, Sarathi, FASTag, FOIS, E-Way Bill, ICE GATE
menuModules: ['icegate'],                  // ICE GATE only
menuModules: ['icegate', 'ewaybill'],      // ICE GATE + E-Way Bill
```

Rules:

- `'all'` (or leaving the key out) shows every module.
- An array shows only the listed modules, **in the order written** — the first
  entry is also the landing page after login (`/dashboard` redirects to it).
- Entries are case-insensitive and tolerate separators: `'ice-gate'`, `'ICE GATE'`
  and `'icegate'` are equivalent (same for `e-waybill` / `ewaybill`).
- An unrecognised value falls back to `'all'` rather than rendering an empty menu.
- When exactly one module is enabled, its sub-menu is expanded by default.

Example: build the ICE GATE–only portal

```bash
# set menuModules: ['icegate'] in src/environments/environment.prod.ts
ng build --configuration production
```

## Build a WAR and deploy to Tomcat

Production packaging targets a servlet container: `npm run build:war` compiles the
portal with `--configuration production` (so `environment.prod.ts` is baked in) and
writes `dist/ulip.war`; `npm run deploy:tomcat` copies it into Tomcat and starts the
server.

```bash
npm run build:war       # -> dist/ulip.war (base href /ulip/)
npm run deploy:tomcat   # stop, deploy, start, smoke-test
```

### What the WAR contains

| Path | Purpose |
| --- | --- |
| `index.html`, `main-*.js`, `styles-*.css`, `*.ico` | the compiled SPA at the archive root |
| `WEB-INF/web.xml` | welcome file, SPA 404 fallback, MIME types |
| `WEB-INF/rewrite.config` | Tomcat `RewriteValve` rules: client routes answer 200 on refresh |
| `META-INF/context.xml` | registers that valve for this webapp only |
| `WEB-INF/build-info.properties` | build time, context path, baked API base URL |

Angular environment values are compile-time, not runtime: the WAR always contains
the values from the environment file selected by the configuration
(`environment.prod.ts` for `production`). Rebuild and redeploy to change the API
base URL or `menuModules`.

### Context path

The default context is `/ulip`; the WAR is written as `dist/ulip.war` and the build
gets `--base-href /ulip/`:

```bash
npm run build:war -- --context-path /portal   # -> dist/portal.war, base href /portal/
npm run deploy:tomcat -- --context-path /portal
```

`--context-path /` produces `ROOT.war`. `ULIP_CONTEXT_PATH` is accepted as well.

### Deploy behaviour

`deploy:tomcat` looks for Tomcat in `CATALINA_HOME`, then the default Windows
install path, reads the HTTP port from `conf/server.xml`, and:

1. stops the instance it started before (`dist/tomcat.pid`) - no service rights needed,
2. backs up the previous WAR to `dist/backup/`,
3. replaces `webapps/<context>.war` and removes the stale exploded directory,
4. starts Tomcat with production JVM settings (`-Xms512m -Xmx1024m`,
   `-Dfile.encoding=UTF-8`, `-Duser.country=IN`, `ULIP_ENV=production`) and writes
   stdout/stderr to `dist/logs/`,
5. waits for `http://localhost:<port>/<context>/` to answer 200 and checks a deep link.

Useful flags: `--tomcat-home <dir>`, `--port <n>`, `--war <file>`, `--no-start`,
`--dry-run`, `--stop`.

### Routing and the API

Requests to `/api/...` are never rewritten, so a backend or reverse proxy can own
that prefix; this WAR serves the UI only. Missing static assets return 404, while
unknown client routes return `index.html` with 200 so a refresh on
`/ulip/dashboard/vahan` works.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
