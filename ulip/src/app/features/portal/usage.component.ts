import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ApiAccess, CreditLedger, Wallet } from '../../core/api/rbac.models';

@Component({
  selector: 'app-usage',
  standalone: false,
  template: `
    <div class="page">
      <app-page-header title="Usage & Credits" eyebrow="Developer"
        description="Sandbox calls spend credits per API. Production calls count against the quota your administrator approved.">
      </app-page-header>

      <h2 class="section-title">Sandbox credits</h2>
      <app-empty-state *ngIf="loadingWallets" [loading]="true"></app-empty-state>
      <app-empty-state *ngIf="!loadingWallets && error" [error]="true" title="Couldn't load credits" [text]="error"></app-empty-state>
      <div class="panel" *ngIf="!loadingWallets && !error && !wallets.length">
        <app-empty-state icon="coins" title="No sandbox credits yet" text="Credits are granted when a sandbox request is approved."></app-empty-state>
      </div>
      <div class="grid grid-3">
        <div class="panel panel-pad wallet" *ngFor="let w of wallets">
          <div class="w-name">{{ w.apiName }}</div>
          <div class="w-balance">{{ w.balance | number }} <span>/ {{ w.totalGranted | number }}</span></div>
          <div class="bar"><span [style.width.%]="pct(w.balance, w.totalGranted)" [class.low]="pct(w.balance, w.totalGranted) < 15"></span></div>
          <div class="w-foot">{{ pct(w.balance, w.totalGranted) | number: '1.0-0' }}% left</div>
        </div>
      </div>

      <ng-container *ngIf="prod.length">
        <h2 class="section-title">Production quota</h2>
        <div class="grid grid-3">
          <div class="panel panel-pad wallet" *ngFor="let a of prod">
            <div class="w-name">{{ a.apiName }}</div>
            <div class="w-balance">{{ (a.productionQuotaRemaining ?? 0) | number }} <span>/ {{ (a.productionQuotaAssigned ?? 0) | number }}</span></div>
            <div class="bar"><span [style.width.%]="pct(a.productionQuotaRemaining ?? 0, a.productionQuotaAssigned ?? 0)"></span></div>
            <div class="w-foot">{{ a.productionValidUntil ? 'Valid until ' + (a.productionValidUntil | date: 'd MMM y') : 'No end date' }}</div>
          </div>
        </div>
      </ng-container>

      <h2 class="section-title">Credit history</h2>
      <div class="panel">
        <app-empty-state *ngIf="loadingLedger" [loading]="true"></app-empty-state>
        <app-empty-state *ngIf="!loadingLedger && !ledger.length" icon="history" title="No credit activity yet"></app-empty-state>
        <div class="table-wrap" *ngIf="!loadingLedger && ledger.length">
          <table class="table">
            <thead><tr><th>When</th><th>API</th><th>Reason</th><th>Reference</th><th class="num">Change</th><th class="num">Balance</th></tr></thead>
            <tbody>
              <tr *ngFor="let l of ledger">
                <td class="muted">{{ l.createdAt | date: 'd MMM y, h:mm a' }}</td>
                <td>{{ apiName(l.apiId) }}</td>
                <td><app-status-badge [value]="l.reason" [label]="l.reason | titlecase"></app-status-badge></td>
                <td class="mono muted">{{ l.reference || '—' }}</td>
                <td class="num" [class.pos]="l.delta > 0" [class.neg]="l.delta < 0">{{ l.delta > 0 ? '+' : '' }}{{ l.delta | number }}</td>
                <td class="num">{{ l.balanceAfter | number }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-pager [page]="page" [size]="size" [total]="total" (pageChange)="loadLedger($event)"></app-pager>
      </div>
    </div>
  `,
  styles: [`
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--color-text-faint); margin: 26px 0 12px; }
    .section-title:first-of-type { margin-top: 0; }
    .w-name { font-weight: 700; color: var(--color-text); font-size: 14px; }
    .w-balance { font-size: 26px; font-weight: 800; color: var(--color-text); margin: 8px 0 10px; }
    .w-balance span { font-size: 14px; font-weight: 600; color: var(--color-text-faint); }
    .bar { height: 8px; border-radius: var(--radius-pill); background: var(--color-surface-alt); overflow: hidden; }
    .bar span { display: block; height: 100%; background: var(--gradient-brand); border-radius: inherit; transition: width var(--transition-slow); }
    .bar span.low { background: var(--color-error); }
    .w-foot { font-size: 12px; color: var(--color-text-muted); margin-top: 8px; }
    .pos { color: var(--color-success); font-weight: 600; }
    .neg { color: var(--color-error); font-weight: 600; }
  `]
})
export class UsageComponent implements OnInit {
  wallets: Wallet[] = [];
  prod: ApiAccess[] = [];
  ledger: CreditLedger[] = [];
  loadingWallets = true;
  loadingLedger = true;
  error = '';
  page = 0;
  readonly size = 20;
  total = 0;

  constructor(private api: RbacApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.api.wallets().pipe(finalize(() => (this.loadingWallets = false))).subscribe({
      next: w => (this.wallets = w),
      error: err => (this.error = errorMessage(err))
    });
    if (this.auth.hasPermission('PROFILE_VIEW')) {
      this.api.accountSummary().subscribe({
        next: s => (this.prod = s.apis.filter(a => a.productionStatus === 'APPROVED')),
        error: () => undefined
      });
    }
    this.loadLedger(0);
  }

  loadLedger(page: number): void {
    this.loadingLedger = true;
    this.api.ledger(page, this.size).pipe(finalize(() => (this.loadingLedger = false))).subscribe({
      next: p => {
        this.ledger = p.items;
        this.page = p.page;
        this.total = p.total;
      },
      error: () => (this.ledger = [])
    });
  }

  pct(value: number, of: number): number {
    return of > 0 ? Math.max(0, Math.min(100, (value / of) * 100)) : 0;
  }

  apiName(apiId: number): string {
    return this.wallets.find(w => w.apiId === apiId)?.apiName ?? `API ${apiId}`;
  }
}
