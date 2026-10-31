import { Component, computed, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ApiAccessService } from '../../core/api/api-access.service';
import { Environment } from '../../core/api/rbac.models';
import { API_DOCS } from '../../features/docs/api-docs';

/**
 * Shown above every data API page (Vahan 01, Sarathi, ...): which environment the page calls, how many
 * calls or credits are left there, and a link to the API's documentation.
 */
@Component({
  selector: 'app-api-access-bar',
  standalone: false,
  template: `
    <section class="bar" *ngIf="portalPath()" aria-label="API access">
      <ng-container *ngIf="access() as a; else noAccess">
        <!-- Status in both environments; the highlighted one is the global choice from the top bar -->
        <div class="envs" role="radiogroup" aria-label="Environment (applies to every data API)">
          <button type="button" class="env" role="radio" [class.on]="active() === 'PRODUCTION'" [attr.aria-checked]="active() === 'PRODUCTION'"
                  (click)="choose('PRODUCTION')" title="Use Production for every data API">
            <span class="dot prod"></span>
            <span class="env-text">
              <span class="env-name">Production</span>
              <span class="env-meta" *ngIf="prodAvailable(); else prodState">
                <ng-container *ngIf="a.productionQuotaRemaining != null; else noQuota">
                  <b>{{ a.productionQuotaRemaining | number }}</b> of {{ a.productionQuotaAssigned | number }} calls left
                </ng-container>
                <ng-template #noQuota>no quota on record</ng-template>
              </span>
              <ng-template #prodState><span class="env-meta">{{ stateText(a.productionStatus) }}</span></ng-template>
            </span>
          </button>

          <button type="button" class="env" role="radio" [class.on]="active() === 'SANDBOX'" [attr.aria-checked]="active() === 'SANDBOX'"
                  (click)="choose('SANDBOX')" title="Use Sandbox for every data API">
            <span class="dot sandbox"></span>
            <span class="env-text">
              <span class="env-name">Sandbox</span>
              <span class="env-meta" *ngIf="sandboxApproved(); else sbState">
                <b>{{ (a.sandboxCreditsLeft ?? 0) | number }}</b> credits left
              </span>
              <ng-template #sbState><span class="env-meta">{{ stateText(a.sandboxStatus) }}</span></ng-template>
            </span>
          </button>
        </div>

        <div class="meta">
          <span class="pill" *ngIf="active() === 'PRODUCTION' && prodAvailable() && a.productionValidUntil">
            <app-icon name="clock" [size]="13"></app-icon> Valid until {{ a.productionValidUntil | date: 'd MMM y' }}
          </span>
          <span class="pill warn" *ngIf="active() === 'PRODUCTION' && prodAvailable() && a.productionQuotaRemaining === 0">
            <app-icon name="alert" [size]="13"></app-icon> Quota used up — ask an administrator for more
          </span>
          <ng-container *ngTemplateOutlet="envWarnings"></ng-container>
        </div>
      </ng-container>

      <ng-template #noAccess>
        <div class="envs">
          <span class="env on static" *ngIf="active() === 'PRODUCTION'">
            <span class="dot prod"></span>
            <span class="env-text"><span class="env-name">Production</span><span class="env-meta">quota not tracked in the portal</span></span>
          </span>
          <span class="env on static" *ngIf="active() === 'SANDBOX'">
            <span class="dot sandbox"></span>
            <span class="env-text"><span class="env-name">Sandbox</span><span class="env-meta">not requested</span></span>
          </span>
        </div>
        <div class="meta"><ng-container *ngTemplateOutlet="envWarnings"></ng-container></div>
      </ng-template>

      <ng-template #envWarnings>
        <span class="pill warn" *ngIf="active() === 'SANDBOX' && !sandboxApproved()">
          <app-icon name="alert" [size]="13"></app-icon> No sandbox access to this API —
          <a routerLink="/dashboard/catalog">request it</a> or switch to Production
        </span>
        <span class="pill warn" *ngIf="active() === 'SANDBOX' && sandboxApproved() && !apiAccess.sandboxCallsEnabled">
          <app-icon name="info" [size]="13"></app-icon> Sandbox endpoint not available yet — switch to Production to make calls
        </span>
        <span class="pill warn" *ngIf="active() === 'PRODUCTION' && access() && !prodAvailable()">
          <app-icon name="alert" [size]="13"></app-icon> No production access to this API —
          <a routerLink="/dashboard/catalog">request it</a> or switch to Sandbox
        </span>
      </ng-template>

      <span class="spacer"></span>
      <a class="docs" *ngIf="docsRoute()" [routerLink]="docsRoute()">
        <app-icon name="file" [size]="15"></app-icon> API documentation
      </a>
    </section>
  `,
  styles: [`
    .bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 10px 12px; margin-bottom: 20px;
           background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
           animation: fadeInUp 0.3s ease both; }
    .envs { display: flex; gap: 6px; flex-wrap: wrap; }
    .env { display: flex; align-items: center; gap: 10px; padding: 7px 12px; border-radius: var(--radius-sm); border: 1px solid var(--color-border);
           background: var(--color-surface-alt); cursor: pointer; font: inherit; color: var(--color-text-muted); text-align: left;
           transition: border-color var(--transition-base), background var(--transition-base); }
    .env:hover:not(:disabled):not(.static) { border-color: var(--color-primary); }
    .env.on { border-color: var(--color-primary); background: var(--color-primary-light); color: var(--color-text); box-shadow: 0 0 0 3px var(--color-primary-light); }
    .env:disabled { cursor: not-allowed; opacity: 0.6; }
    .env.static { cursor: default; }
    .dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
    .dot.prod { background: var(--color-success); box-shadow: 0 0 0 3px var(--color-success-bg); }
    .dot.sandbox { background: var(--color-warning); box-shadow: 0 0 0 3px var(--color-warning-bg); }
    .env-text { display: flex; flex-direction: column; line-height: 1.25; }
    .env-name { font-size: 12.5px; font-weight: 700; color: var(--color-text); }
    .env-meta { font-size: 12px; }
    .env-meta b { color: var(--color-text); }
    .meta { display: flex; gap: 6px; flex-wrap: wrap; }
    .pill { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; padding: 4px 10px; border-radius: var(--radius-pill);
            background: var(--color-surface-alt); color: var(--color-text-muted); border: 1px solid var(--color-border-subtle); }
    .pill.warn { background: var(--color-warning-bg); color: var(--color-warning); border-color: var(--color-warning-border); }
    .pill a { color: inherit; font-weight: 700; }
    .spacer { flex: 1; }
    .docs { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--color-primary);
            text-decoration: none; padding: 7px 10px; border-radius: var(--radius-sm); }
    .docs:hover { background: var(--color-primary-light); }
  `]
})
export class ApiAccessBarComponent {
  /** '/sarathi', '/vahan/04' … for the current data API page, '' elsewhere. */
  readonly portalPath = signal('');
  readonly access = computed(() => (this.portalPath() ? this.apiAccess.accessFor(this.portalPath()) : undefined));
  readonly active = computed(() => this.apiAccess.active());
  readonly prodAvailable = computed(() => this.apiAccess.productionAvailable(this.access()));
  readonly sandboxApproved = computed(() => this.apiAccess.sandboxApproved(this.access()));
  readonly docsRoute = computed(() => {
    const doc = API_DOCS.find(d => d.portalPath === this.portalPath());
    return doc ? `/dashboard/docs/${doc.slug}` : null;
  });

  constructor(public apiAccess: ApiAccessService, private router: Router) {
    this.read();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.read());
  }

  choose(env: Environment): void {
    this.apiAccess.setEnvironment(env);
  }

  stateText(status: string | undefined): string {
    switch (status) {
      case 'PENDING': return 'awaiting approval';
      case 'REJECTED': return 'request rejected';
      case 'REVOKED': return 'access revoked';
      default: return 'not requested';
    }
  }

  /** Only API pages (a route with data.module and an id or a single-API module) get the bar. */
  private read(): void {
    let r = this.router.routerState.snapshot.root;
    while (r.firstChild) {
      r = r.firstChild;
    }
    const isDataPage = !!r.data['module'];
    const path = this.router.url.split('?')[0].replace(/^\/dashboard/, '');
    const isOverview = ['/vahan', '/icegate', '/fastag', '/fois'].includes(path);
    this.portalPath.set(isDataPage && !isOverview ? path : '');
    if (this.portalPath()) {
      this.apiAccess.refresh();
    }
  }
}
