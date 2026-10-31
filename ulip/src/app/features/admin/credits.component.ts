import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, debounceTime, switchMap, of, catchError } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { CatalogItem, UserRow, Wallet } from '../../core/api/rbac.models';
import { NotifyService } from '../../shared/ui/notify.service';

@Component({
  selector: 'app-credits',
  standalone: false,
  template: `
    <div class="page">
      <app-page-header title="Sandbox Credits" eyebrow="Administration"
        description="Look up a developer's sandbox wallets and top them up. Every top-up is recorded in their credit history and the audit log.">
      </app-page-header>

      <div class="grid grid-2 top">
        <section class="panel panel-pad">
          <h3 class="panel-title">Find a developer</h3>
          <ng-container *ngIf="canSearchUsers; else byId">
            <label class="input-search find">
              <app-icon name="search" [size]="16"></app-icon>
              <input class="input" placeholder="Name, e-mail or organisation" [ngModel]="query" (ngModelChange)="query$.next($event)" />
            </label>
            <ul class="results" *ngIf="results.length">
              <li *ngFor="let u of results">
                <button type="button" (click)="pick(u.id, u.name || u.username, u.organisation)" [class.on]="u.id === userId">
                  <span class="cell-main">{{ u.name || u.username }}</span>
                  <span class="cell-sub">{{ u.email || u.username }} · {{ u.organisation || '—' }}</span>
                </button>
              </li>
            </ul>
          </ng-container>
          <ng-template #byId>
            <div class="toolbar find">
              <input class="input" type="number" min="1" placeholder="User ID" [(ngModel)]="idInput" />
              <button class="btn" [disabled]="!idInput" (click)="pick(idInput!, 'User #' + idInput, '')">Look up</button>
            </div>
          </ng-template>
        </section>

        <section class="panel panel-pad" *ngIf="userId">
          <h3 class="panel-title">Top up</h3>
          <p class="panel-sub">{{ userLabel }}<ng-container *ngIf="userOrg"> · {{ userOrg }}</ng-container></p>
          <label class="field topup-first">
            <span class="field-label">API <span class="req">*</span></span>
            <select class="select" [(ngModel)]="topup.apiId">
              <option [ngValue]="null" disabled>Choose an API</option>
              <option *ngFor="let a of apiOptions" [ngValue]="a.id">{{ a.name }}</option>
            </select>
          </label>
          <div class="grid grid-2 tight">
            <label class="field"><span class="field-label">Credits <span class="req">*</span></span><input class="input" type="number" min="1" max="1000000" [(ngModel)]="topup.amount" /></label>
            <label class="field"><span class="field-label">Note</span><input class="input" maxlength="100" [(ngModel)]="topup.note" placeholder="Optional" /></label>
          </div>
          <button class="btn btn-primary" [disabled]="!topup.apiId || !topup.amount || topup.amount < 1 || saving" (click)="doTopUp()">
            <span class="btn-spinner" *ngIf="saving"></span> Add credits
          </button>
        </section>
      </div>

      <section class="panel wallets" *ngIf="userId">
        <div class="panel-head"><h3 class="panel-title">Wallets</h3></div>
        <app-empty-state *ngIf="loadingWallets" [loading]="true"></app-empty-state>
        <app-empty-state *ngIf="!loadingWallets && !wallets.length" icon="coins" title="No wallets yet" text="A wallet is created with the first sandbox approval or top-up."></app-empty-state>
        <div class="table-wrap" *ngIf="!loadingWallets && wallets.length">
          <table class="table">
            <thead><tr><th>API</th><th class="num">Balance</th><th class="num">Total granted</th><th>Updated</th></tr></thead>
            <tbody>
              <tr *ngFor="let w of wallets">
                <td class="cell-main">{{ w.apiName }}</td>
                <td class="num">{{ w.balance | number }}</td>
                <td class="num">{{ w.totalGranted | number }}</td>
                <td class="muted">{{ w.updatedAt | date: 'd MMM y, h:mm a' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .top { align-items: start; }
    .find { margin-top: 14px; }
    .results { list-style: none; margin: 10px 0 0; padding: 0; max-height: 280px; overflow-y: auto; }
    .results button { width: 100%; text-align: left; display: flex; flex-direction: column; padding: 9px 10px; border: none; background: none;
                      border-radius: var(--radius-sm); cursor: pointer; font: inherit; color: var(--color-text); }
    .results button:hover { background: var(--color-surface-alt); }
    .results button.on { background: var(--color-primary-light); }
    .topup-first { margin-top: 14px; }
    .tight { gap: 12px; }
    .wallets { margin-top: 16px; }
  `]
})
export class CreditsComponent implements OnInit, OnDestroy {
  readonly query$ = new Subject<string>();
  query = '';
  results: UserRow[] = [];
  idInput: number | null = null;

  userId: number | null = null;
  userLabel = '';
  userOrg = '';
  wallets: Wallet[] = [];
  loadingWallets = false;
  catalog: CatalogItem[] = [];

  topup: { apiId: number | null; amount: number | null; note: string } = { apiId: null, amount: 100, note: '' };
  saving = false;

  constructor(private api: RbacApiService, private auth: AuthService, private notify: NotifyService) {}

  get canSearchUsers(): boolean {
    return this.auth.hasPermission('USER_MANAGE');
  }

  ngOnInit(): void {
    this.api.catalog().subscribe({ next: c => (this.catalog = c), error: () => undefined });
    this.query$.pipe(
      debounceTime(300),
      switchMap(q => (q.trim().length < 2 ? of({ items: [] as UserRow[] }) : this.api.users(q.trim(), 0, 8).pipe(catchError(() => of({ items: [] as UserRow[] })))))
    ).subscribe(p => (this.results = p.items));
  }

  ngOnDestroy(): void {
    this.query$.complete();
  }

  /** APIs from the user's wallets plus every published API. */
  get apiOptions(): { id: number; name: string }[] {
    const map = new Map<number, string>();
    this.wallets.forEach(w => map.set(w.apiId, w.apiName));
    this.catalog.forEach(c => map.has(c.apiId) || map.set(c.apiId, c.name));
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }

  pick(id: number, label: string, org?: string): void {
    this.userId = id;
    this.userLabel = label;
    this.userOrg = org ?? '';
    this.topup = { apiId: null, amount: 100, note: '' };
    this.loadWallets();
  }

  doTopUp(): void {
    if (!this.userId || !this.topup.apiId || !this.topup.amount) {
      return;
    }
    this.saving = true;
    this.api.topUp({ userId: this.userId, apiId: this.topup.apiId, amount: this.topup.amount, note: this.topup.note.trim() || undefined })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.notify.success(`Added ${this.topup.amount} credits.`);
          this.topup.note = '';
          this.loadWallets();
        },
        error: err => this.notify.error(errorMessage(err))
      });
  }

  private loadWallets(): void {
    if (!this.userId) {
      return;
    }
    this.loadingWallets = true;
    this.api.userWallets(this.userId).pipe(finalize(() => (this.loadingWallets = false))).subscribe({
      next: w => (this.wallets = w),
      error: err => {
        this.wallets = [];
        this.notify.error(errorMessage(err));
      }
    });
  }
}
