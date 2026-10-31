import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ApiAccess, CatalogItem } from '../../core/api/rbac.models';
import { NotifyService } from '../../shared/ui/notify.service';
import { InboxService } from '../../core/inbox/inbox.service';

@Component({
  selector: 'app-catalog',
  standalone: false,
  template: `
    <div class="page">
      <app-page-header title="API Catalog" eyebrow="Developer"
        description="Try any API in the sandbox with free credits, then request production access for your organisation.">
      </app-page-header>

      <div class="toolbar filters">
        <label class="input-search">
          <app-icon name="search" [size]="16"></app-icon>
          <input class="input" placeholder="Search APIs" [(ngModel)]="search" aria-label="Search APIs" />
        </label>
        <select class="select" [(ngModel)]="category" aria-label="Category">
          <option value="">All categories</option>
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>
      </div>

      <app-empty-state *ngIf="loading" [loading]="true"></app-empty-state>
      <app-empty-state *ngIf="!loading && loadError" [error]="true" title="Couldn't load the catalog" [text]="loadError">
        <button class="btn" (click)="load()">Try again</button>
      </app-empty-state>
      <app-empty-state *ngIf="!loading && !loadError && !filtered.length" icon="apps" title="No APIs match"
        text="Published APIs appear here. Try a different search."></app-empty-state>

      <div class="grid grid-3">
        <article class="panel api" *ngFor="let api of filtered">
          <div class="api-top">
            <span class="api-cat">{{ api.category || 'General' }}</span>
            <app-status-badge *ngIf="statusOf(api, 'PRODUCTION') as s" [value]="s" [label]="'Prod: ' + (s | titlecase)"></app-status-badge>
          </div>
          <h3 class="api-name">{{ api.name }}</h3>
          <p class="api-desc">{{ api.description || 'No description yet.' }}</p>
          <dl class="api-facts">
            <div><dt>Sandbox</dt><dd>{{ api.sandboxAvailable ? api.sandboxFreeCredits + ' free credits' : 'Not available' }}</dd></div>
            <div><dt>Cost</dt><dd>{{ api.creditCostPerCall }} credit{{ api.creditCostPerCall === 1 ? '' : 's' }}/call</dd></div>
            <div><dt>Production</dt><dd>{{ api.productionNeedsApproval ? 'Needs approval' : 'Instant' }}</dd></div>
          </dl>
          <div class="api-actions">
            <ng-container *ngIf="api.docsUrl">
              <a *ngIf="api.docsUrl.startsWith('/'); else externalDocs" class="btn btn-ghost btn-sm" [routerLink]="'/dashboard' + api.docsUrl">
                <app-icon name="file" [size]="13"></app-icon> Docs
              </a>
              <ng-template #externalDocs>
                <a class="btn btn-ghost btn-sm" [href]="api.docsUrl" target="_blank" rel="noopener">Docs <app-icon name="external" [size]="13"></app-icon></a>
              </ng-template>
            </ng-container>
            <span class="spacer"></span>
            <a *ngIf="openRoute(api) as route" class="btn btn-sm open" [routerLink]="route">
              Open API <app-icon name="chevron-right" [size]="13"></app-icon>
            </a>
            <ng-container *ngIf="canRequest">
              <button class="btn btn-sm" *ngIf="api.sandboxAvailable" [disabled]="busy === api.apiId || !!statusOf(api, 'SANDBOX')"
                      (click)="requestSandbox(api)">
                {{ statusOf(api, 'SANDBOX') ? 'Sandbox ' + (statusOf(api, 'SANDBOX') | lowercase) : 'Try in sandbox' }}
              </button>
              <button class="btn btn-primary btn-sm" [disabled]="isProdBlocked(api)" (click)="openProd(api)">Request production</button>
            </ng-container>
          </div>
        </article>
      </div>
    </div>

    <app-dialog [open]="!!prodFor" [title]="'Production access: ' + (prodFor?.name || '')"
      subtitle="An administrator reviews production requests. Describe how you will use the data." (close)="prodFor = null">
      <label class="field">
        <span class="field-label">Use case <span class="req">*</span></span>
        <textarea class="input" rows="4" maxlength="2000" [(ngModel)]="useCase"
          placeholder="e.g. Verify vehicle registration during driver onboarding for our fleet app"></textarea>
        <span class="field-hint">At least 20 characters.</span>
      </label>
      <label class="field">
        <span class="field-label">Expected calls (quota)</span>
        <input class="input" type="number" min="1" [(ngModel)]="quota" placeholder="Optional" />
      </label>
      <div dialog-footer>
        <button class="btn btn-ghost" (click)="prodFor = null">Cancel</button>
        <button class="btn btn-primary" [disabled]="useCase.trim().length < 20 || busy !== null" (click)="submitProd()">
          <span class="btn-spinner" *ngIf="busy !== null"></span> Submit request
        </button>
      </div>
    </app-dialog>
  `,
  styles: [`
    .filters { margin-bottom: 18px; }
    .filters .input-search { flex: 1; min-width: 220px; max-width: 420px; }
    .filters .select { width: 200px; }
    .api { padding: 20px; display: flex; flex-direction: column; gap: 10px; animation: fadeInUp 0.24s ease both; }
    .api:hover { border-color: var(--color-primary); box-shadow: var(--shadow-glow-soft); }
    .api-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .api-cat { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-primary);
               background: var(--color-primary-light); padding: 3px 9px; border-radius: var(--radius-pill); }
    .api-name { margin: 2px 0 0; font-size: 16px; font-weight: 700; color: var(--color-text); }
    .api-desc { margin: 0; font-size: 13.5px; color: var(--color-text-muted); line-height: 1.55; flex: 1;
                display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .api-facts { margin: 4px 0 0; display: grid; gap: 6px; font-size: 12.5px; }
    .api-facts div { display: flex; justify-content: space-between; gap: 8px; border-top: 1px dashed var(--color-border-subtle); padding-top: 6px; }
    .api-facts dt { color: var(--color-text-faint); }
    .api-facts dd { margin: 0; color: var(--color-text); font-weight: 600; }
    .api-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
    .api-actions .spacer { flex: 1; }
    .open { border-color: var(--color-success-border); color: var(--color-success); }
  `]
})
export class CatalogComponent implements OnInit {
  items: CatalogItem[] = [];
  access = new Map<number, ApiAccess>();
  loading = true;
  loadError = '';
  search = '';
  category = '';
  busy: number | null = null;

  prodFor: CatalogItem | null = null;
  useCase = '';
  quota: number | null = null;


  constructor(private api: RbacApiService, private auth: AuthService, private notify: NotifyService, private inbox: InboxService) {}

  get canRequest(): boolean {
    return this.auth.hasPermission('ACCESS_REQUEST_CREATE');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    this.api.catalog().pipe(finalize(() => (this.loading = false))).subscribe({
      next: items => (this.items = items),
      error: err => (this.loadError = errorMessage(err))
    });
    this.refreshAccess();
  }

  get categories(): string[] {
    return [...new Set(this.items.map(i => i.category).filter((c): c is string => !!c))].sort();
  }

  get filtered(): CatalogItem[] {
    const q = this.search.trim().toLowerCase();
    return this.items.filter(i =>
      (!this.category || i.category === this.category) &&
      (!q || `${i.name} ${i.description ?? ''} ${i.category ?? ''}`.toLowerCase().includes(q)));
  }

  statusOf(api: CatalogItem, env: 'SANDBOX' | 'PRODUCTION'): string | undefined {
    const a = this.access.get(api.apiId);
    const s = env === 'SANDBOX' ? a?.sandboxStatus : a?.productionStatus;
    // Only live states block a new request; rejected/cancelled can be requested again.
    return s === 'PENDING' || s === 'APPROVED' ? s : undefined;
  }

  /** Portal page for an API the user can already call (approved in either environment). */
  openRoute(api: CatalogItem): string | null {
    const route = api.portalPath ? `/dashboard${api.portalPath}` : null;
    const approved = this.statusOf(api, 'SANDBOX') === 'APPROVED' || this.statusOf(api, 'PRODUCTION') === 'APPROVED';
    return route && approved && this.auth.menuAllows(route) ? route : null;
  }

  isProdBlocked(api: CatalogItem): boolean {
    return this.busy === api.apiId || !!this.statusOf(api, 'PRODUCTION');
  }

  requestSandbox(api: CatalogItem): void {
    this.busy = api.apiId;
    this.api.createAccessRequest({ apiId: api.apiId, environment: 'SANDBOX' })
      .pipe(finalize(() => (this.busy = null)))
      .subscribe({
        next: r => {
          this.notify.success(r.status === 'APPROVED'
            ? `Sandbox access to ${api.name} is ready. Create a test key to start calling it.`
            : `Sandbox request for ${api.name} submitted.`);
          this.refreshAccess();
        },
        error: err => this.notify.error(errorMessage(err))
      });
  }

  openProd(api: CatalogItem): void {
    this.prodFor = api;
    this.useCase = '';
    this.quota = null;
  }

  submitProd(): void {
    const api = this.prodFor;
    if (!api) {
      return;
    }
    this.busy = api.apiId;
    this.api.createAccessRequest({
      apiId: api.apiId, environment: 'PRODUCTION', useCase: this.useCase.trim(), requestedQuota: this.quota ?? undefined
    }).pipe(finalize(() => (this.busy = null))).subscribe({
      next: () => {
        this.notify.success(`Production request for ${api.name} sent for approval.`);
        this.prodFor = null;
        this.refreshAccess();
      },
      error: err => this.notify.error(errorMessage(err))
    });
  }

  private refreshAccess(): void {
    this.inbox.refresh(true);
    // /me/account-summary is guarded by PROFILE_VIEW
    if (!this.auth.hasPermission('PROFILE_VIEW')) {
      return;
    }
    this.api.accountSummary().subscribe({
      next: s => (this.access = new Map(s.apis.map(a => [a.apiId, a]))),
      error: () => undefined
    });
  }
}
