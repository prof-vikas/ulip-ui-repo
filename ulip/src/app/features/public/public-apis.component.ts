import { Component, OnInit, signal } from '@angular/core';
import { RbacApiService } from '../../core/api/rbac-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { CatalogItem } from '../../core/api/rbac.models';
import { DATA_SOURCES } from './public-content';
import { API_DOCS } from '../docs/api-docs';

const norm = (v: string) => v.toLowerCase().replace(/[^a-z]/g, '');

/** Public list of the published APIs (the catalog endpoint needs no sign-in). */
@Component({
  selector: 'app-public-apis',
  standalone: false,
  template: `
    <section class="page-hero">
      <div class="pub-wrap">
        <span class="eyebrow">APIs</span>
        <h1>APIs you can request today</h1>
        <p>Try any API in the sandbox with free credits, then request production access for your organisation.
          Pricing is in credits per call; production quotas are set when your request is approved.</p>
      </div>
    </section>

    <section class="section tight">
      <div class="pub-wrap">
        <div class="filters">
          <label class="input-search">
            <app-icon name="search" [size]="16"></app-icon>
            <input class="input" placeholder="Search APIs" [(ngModel)]="search" aria-label="Search APIs" />
          </label>
          <div class="chips" role="tablist" aria-label="Category">
            <button type="button" class="chip" [class.on]="!category" (click)="category = ''">All</button>
            <button type="button" class="chip" *ngFor="let c of categories" [class.on]="category === c" (click)="category = c">{{ c }}</button>
          </div>
        </div>

        <app-empty-state *ngIf="loading()" [loading]="true"></app-empty-state>

        <ng-container *ngIf="!loading()">
          <div class="api-grid" *ngIf="filtered.length; else none">
            <article class="api" *ngFor="let a of filtered">
              <div class="api-top">
                <span class="api-cat">{{ a.category || 'General' }}</span>
                <span class="api-sb" *ngIf="a.sandboxAvailable"><app-icon name="sparkle" [size]="12"></app-icon> Sandbox</span>
              </div>
              <h3>{{ a.name }}</h3>
              <p>{{ a.description || 'No description yet.' }}</p>
              <dl>
                <div><dt>Sandbox</dt><dd>{{ a.sandboxAvailable ? a.sandboxFreeCredits + ' free credits' : 'Not available' }}</dd></div>
                <div><dt>Cost</dt><dd>{{ a.creditCostPerCall }} credit{{ a.creditCostPerCall === 1 ? '' : 's' }}/call</dd></div>
                <div><dt>Production</dt><dd>{{ a.productionNeedsApproval ? 'Needs approval' : 'Instant' }}</dd></div>
              </dl>
              <div class="api-actions">
                <a *ngIf="docsLink(a) as d" class="btn btn-ghost btn-sm" [routerLink]="d"><app-icon name="book" [size]="13"></app-icon> Docs</a>
                <span class="spacer"></span>
                <a class="btn btn-primary btn-sm" [routerLink]="signedIn ? '/dashboard/catalog' : '/signup'">
                  {{ signedIn ? 'Request access' : 'Get access' }} <app-icon name="arrow-right" [size]="13"></app-icon>
                </a>
              </div>
            </article>
          </div>
          <ng-template #none>
            <app-empty-state icon="apps" title="No APIs match" text="Try a different search or category."></app-empty-state>
          </ng-template>
        </ng-container>

        <div class="note" *ngIf="offline()">
          <app-icon name="info" [size]="16"></app-icon>
          <span>The live catalog couldn't be reached, so this list shows the data sources only. Credits and quotas appear once it's back.</span>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./public-pages.css'],
  styles: [`
    .section.tight { padding-top: 36px; }
    .filters { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-bottom: 24px; }
    .filters .input-search { flex: 1; min-width: 220px; max-width: 380px; }
    .chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .chip { height: 34px; padding: 0 14px; border-radius: var(--radius-pill); border: 1px solid var(--color-border); background: var(--color-surface);
            color: var(--color-text-muted); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: all var(--transition-base); }
    .chip:hover { color: var(--color-text); border-color: var(--color-text-faint); }
    .chip.on { background: var(--color-primary-light); border-color: var(--color-primary); color: var(--color-primary); }
    .api-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
    .api { display: flex; flex-direction: column; gap: 10px; padding: 22px; background: var(--color-surface); border: 1px solid var(--color-border);
           border-radius: var(--radius-lg); transition: border-color var(--transition-base), box-shadow var(--transition-base); animation: fadeInUp 0.3s ease both; }
    .api:hover { border-color: var(--color-primary); box-shadow: var(--shadow-glow-soft); }
    .api-top { display: flex; justify-content: space-between; align-items: center; }
    .api-cat { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-primary);
               background: var(--color-primary-light); padding: 3px 9px; border-radius: var(--radius-pill); }
    .api-sb { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; color: var(--color-success); }
    .api h3 { margin: 2px 0 0; font-size: 16.5px; color: var(--color-text); }
    .api p { margin: 0; flex: 1; font-size: 13.5px; line-height: 1.55; color: var(--color-text-muted); }
    .api dl { margin: 4px 0 0; display: grid; gap: 6px; font-size: 12.5px; }
    .api dl div { display: flex; justify-content: space-between; gap: 8px; border-top: 1px dashed var(--color-border-subtle); padding-top: 6px; }
    .api dt { color: var(--color-text-faint); }
    .api dd { margin: 0; font-weight: 600; color: var(--color-text); }
    .api-actions { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    .spacer { flex: 1; }
    .note { display: flex; gap: 10px; align-items: flex-start; margin-top: 20px; padding: 12px 14px; border-radius: var(--radius-md);
            background: var(--color-surface-alt); color: var(--color-text-muted); font-size: 13.5px; }
    @media (max-width: 1000px) { .api-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .api-grid { grid-template-columns: 1fr; } }
  `]
})
export class PublicApisComponent implements OnInit {
  items: CatalogItem[] = [];
  search = '';
  category = '';
  readonly loading = signal(true);
  readonly offline = signal(false);

  constructor(private api: RbacApiService, private auth: AuthService) {}

  get signedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  ngOnInit(): void {
    this.api.catalog().subscribe({
      next: items => {
        this.items = items.map(a => this.describe(a));
        this.loading.set(false);
      },
      error: () => {
        // Without the backend, still show what the platform offers.
        this.items = DATA_SOURCES.map((s, i) => ({
          apiId: -1 - i, name: s.name, category: s.authority, description: s.text,
          docsUrl: s.docs ? `/docs/${s.docs}` : undefined,
          sandboxAvailable: true, sandboxFreeCredits: 0, creditCostPerCall: 1, productionNeedsApproval: true
        }));
        this.offline.set(true);
        this.loading.set(false);
      }
    });
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

  /** Catalog rows carry internal names (FAST_TAG); show the reference title and summary where we have them. */
  private describe(a: CatalogItem): CatalogItem {
    const doc = API_DOCS.find(d => d.apiId === a.apiId);
    const src = DATA_SOURCES.find(s => norm(a.name).startsWith(norm(s.name)));
    return {
      ...a,
      name: doc?.title ?? src?.name ?? a.name,
      category: a.category || doc?.category || src?.authority,
      description: a.description || doc?.summary || src?.text
    };
  }

  /** Built-in reference pages ('/docs/…') open on the public site; external links are left to the portal. */
  docsLink(a: CatalogItem): string | null {
    return a.docsUrl?.startsWith('/docs') ? a.docsUrl : null;
  }
}
