import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { AccessRequest, AccessRequestHistory, Environment, RequestStatus } from '../../core/api/rbac.models';
import { NotifyService } from '../../shared/ui/notify.service';
import { InboxService } from '../../core/inbox/inbox.service';

@Component({
  selector: 'app-approvals',
  standalone: false,
  template: `
    <div class="page">
      <app-page-header title="Access Approvals" eyebrow="Administration"
        description="Approving production access writes the API mapping and quota that ulip-rest enforces.">
      </app-page-header>

      <div class="panel">
        <div class="panel-head">
          <div class="tabs" role="tablist">
            <button class="tab" *ngFor="let s of statuses" [class.active]="status === s.value" (click)="setStatus(s.value)" role="tab">{{ s.label }}</button>
          </div>
          <div class="toolbar">
            <select class="select sel" [(ngModel)]="environment" (ngModelChange)="load(0)" aria-label="Environment">
              <option value="">All environments</option>
              <option value="PRODUCTION">Production</option>
              <option value="SANDBOX">Sandbox</option>
            </select>
            <button class="btn btn-ghost btn-sm" (click)="load(page)" [disabled]="loading"><app-icon name="refresh" [size]="15"></app-icon></button>
          </div>
        </div>

        <app-empty-state *ngIf="loading" [loading]="true"></app-empty-state>
        <app-empty-state *ngIf="!loading && error" [error]="true" title="Couldn't load requests" [text]="error"></app-empty-state>
        <app-empty-state *ngIf="!loading && !error && !rows.length" icon="check-circle"
          [title]="status === 'PENDING' ? 'All caught up' : 'No requests'" text="New requests show up here."></app-empty-state>

        <div class="table-wrap" *ngIf="!loading && rows.length">
          <table class="table">
            <thead><tr><th>Requester</th><th>API</th><th>Environment</th><th>Status</th><th class="num">Quota</th><th>Requested</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let r of rows" class="clickable" (click)="open(r)">
                <td><div class="cell-main">{{ r.username }}</div><div class="cell-sub">{{ r.organisation || '—' }}</div></td>
                <td>{{ r.apiName }}</td>
                <td><app-status-badge [value]="r.environment"></app-status-badge></td>
                <td><app-status-badge [value]="r.status"></app-status-badge></td>
                <td class="num">{{ (r.approvedQuota ?? r.requestedQuota) | number }}</td>
                <td class="muted">{{ r.createdAt | date: 'd MMM y, h:mm a' }}</td>
                <td class="actions" (click)="$event.stopPropagation()">
                  <ng-container *ngIf="r.status === 'PENDING'">
                    <button class="btn btn-sm" (click)="reject(r)">Reject</button>
                    <button class="btn btn-primary btn-sm" (click)="startApprove(r)">Approve</button>
                  </ng-container>
                  <button class="btn btn-ghost btn-sm" *ngIf="r.status === 'APPROVED'" (click)="revoke(r)">Revoke</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-pager [page]="page" [size]="size" [total]="total" (pageChange)="load($event)"></app-pager>
      </div>
    </div>

    <app-dialog variant="drawer" [open]="!!selected" [title]="selected?.apiName || ''" [subtitle]="'Request #' + selected?.id" (close)="selected = null">
      <ng-container *ngIf="selected as r">
        <dl class="kv">
          <dt>Requester</dt><dd>{{ r.username }}</dd>
          <dt>Organisation</dt><dd>{{ r.organisation || '—' }}</dd>
          <dt>Environment</dt><dd><app-status-badge [value]="r.environment"></app-status-badge></dd>
          <dt>Status</dt><dd><app-status-badge [value]="r.status"></app-status-badge></dd>
          <dt>Requested quota</dt><dd>{{ (r.requestedQuota | number) || '—' }}</dd>
          <dt>Approved quota</dt><dd>{{ (r.approvedQuota | number) || '—' }}</dd>
          <dt>Valid until</dt><dd>{{ r.validUntil ? (r.validUntil | date: 'd MMM y') : '—' }}</dd>
          <dt>Decision note</dt><dd>{{ r.decisionNote || '—' }}</dd>
        </dl>
        <h4 class="sub-h">Use case</h4>
        <p class="usecase">{{ r.useCase || 'Not provided.' }}</p>
        <h4 class="sub-h">History</h4>
        <ol class="timeline">
          <li *ngFor="let h of history">
            <span class="t-dot"></span>
            <div>
              <div class="t-title">{{ h.fromStatus ? (h.fromStatus | titlecase) + ' → ' : '' }}{{ h.toStatus | titlecase }}</div>
              <div class="t-sub">{{ h.createdAt | date: 'd MMM y, h:mm a' }}<ng-container *ngIf="h.note"> · {{ h.note }}</ng-container></div>
            </div>
          </li>
          <li *ngIf="!history.length" class="muted">No history.</li>
        </ol>
      </ng-container>
      <div dialog-footer *ngIf="selected?.status === 'PENDING'">
        <button class="btn" (click)="reject(selected!)">Reject</button>
        <button class="btn btn-primary" (click)="startApprove(selected!)">Approve</button>
      </div>
    </app-dialog>

    <app-dialog [open]="!!approving" title="Approve request" [subtitle]="(approving?.username || '') + ' · ' + (approving?.apiName || '')" (close)="approving = null">
      <ng-container *ngIf="approving as r">
        <label class="field" *ngIf="r.environment === 'PRODUCTION'">
          <span class="field-label">Quota (calls)</span>
          <input class="input" type="number" min="1" [(ngModel)]="form.quota" [placeholder]="r.requestedQuota ? r.requestedQuota + ' requested' : 'Catalog default'" />
        </label>
        <label class="field" *ngIf="r.environment === 'SANDBOX'">
          <span class="field-label">Sandbox credits</span>
          <input class="input" type="number" min="1" [(ngModel)]="form.credits" placeholder="Catalog default" />
        </label>
        <label class="field">
          <span class="field-label">Valid until</span>
          <input class="input" type="date" [(ngModel)]="form.validUntil" />
          <span class="field-hint">Access is revoked automatically after this date. Leave empty for no end date.</span>
        </label>
        <label class="field">
          <span class="field-label">Note to the developer</span>
          <textarea class="input" rows="3" maxlength="500" [(ngModel)]="form.note"></textarea>
        </label>
      </ng-container>
      <div dialog-footer>
        <button class="btn btn-ghost" (click)="approving = null">Cancel</button>
        <button class="btn btn-primary" [disabled]="saving" (click)="approve()"><span class="btn-spinner" *ngIf="saving"></span> Approve</button>
      </div>
    </app-dialog>
  `,
  styles: [`
    .sel { width: 180px; height: 34px; }
    .clickable { cursor: pointer; }
    .sub-h { margin: 22px 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-faint); }
    .usecase { margin: 0; font-size: 14px; line-height: 1.6; color: var(--color-text); white-space: pre-wrap; background: var(--color-surface-alt);
               padding: 12px 14px; border-radius: var(--radius-sm); }
    .timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .timeline li { display: flex; gap: 10px; }
    .t-dot { width: 9px; height: 9px; margin-top: 5px; border-radius: 50%; background: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); flex-shrink: 0; }
    .t-title { font-size: 13.5px; font-weight: 600; color: var(--color-text); }
    .t-sub { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
  `]
})
export class ApprovalsComponent implements OnInit {
  readonly statuses: { label: string; value: RequestStatus | '' }[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Revoked', value: 'REVOKED' },
    { label: 'All', value: '' }
  ];
  status: RequestStatus | '' = 'PENDING';
  environment: Environment | '' = '';
  rows: AccessRequest[] = [];
  page = 0;
  readonly size = 20;
  total = 0;
  loading = true;
  error = '';

  selected: AccessRequest | null = null;
  history: AccessRequestHistory[] = [];
  approving: AccessRequest | null = null;
  saving = false;
  form: { quota: number | null; credits: number | null; validUntil: string; note: string } = { quota: null, credits: null, validUntil: '', note: '' };

  constructor(private api: RbacApiService, private notify: NotifyService, private inbox: InboxService) {}

  ngOnInit(): void {
    this.load(0);
  }

  setStatus(s: RequestStatus | ''): void {
    this.status = s;
    this.load(0);
  }

  load(page: number): void {
    this.loading = true;
    this.error = '';
    this.api.adminAccessRequests({ status: this.status, environment: this.environment, page, size: this.size })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: p => {
          this.rows = p.items;
          this.page = p.page;
          this.total = p.total;
        },
        error: err => (this.error = errorMessage(err))
      });
  }

  open(r: AccessRequest): void {
    this.selected = r;
    this.history = [];
    this.api.accessRequestHistory(r.id).subscribe({ next: h => (this.history = h), error: () => undefined });
  }

  startApprove(r: AccessRequest): void {
    this.approving = r;
    this.form = { quota: r.requestedQuota ?? null, credits: null, validUntil: '', note: '' };
  }

  approve(): void {
    const r = this.approving;
    if (!r) {
      return;
    }
    this.saving = true;
    this.api.approveAccessRequest(r.id, {
      quota: this.form.quota ?? undefined,
      credits: this.form.credits ?? undefined,
      validUntil: this.form.validUntil ? `${this.form.validUntil}T23:59:59` : undefined,
      note: this.form.note.trim() || undefined
    }).pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => this.done(`Approved ${r.apiName} for ${r.username}.`),
      error: err => this.notify.error(errorMessage(err))
    });
  }

  async reject(r: AccessRequest): Promise<void> {
    const { ok, value } = await this.notify.confirm({
      title: 'Reject request',
      text: `${r.username} will be e-mailed the reason.`,
      confirmLabel: 'Reject',
      danger: true,
      inputLabel: 'Reason',
      inputRequired: true
    });
    if (ok) {
      this.api.rejectAccessRequest(r.id, value).subscribe({
        next: () => this.done('Request rejected.'),
        error: err => this.notify.error(errorMessage(err))
      });
    }
  }

  async revoke(r: AccessRequest): Promise<void> {
    const { ok, value } = await this.notify.confirm({
      title: 'Revoke access',
      text: `${r.username} loses ${r.environment.toLowerCase()} access to ${r.apiName} immediately.`,
      confirmLabel: 'Revoke',
      danger: true,
      inputLabel: 'Reason',
      inputRequired: true
    });
    if (ok) {
      this.api.revokeAccessRequest(r.id, value).subscribe({
        next: () => this.done('Access revoked.'),
        error: err => this.notify.error(errorMessage(err))
      });
    }
  }

  private done(message: string): void {
    this.notify.success(message);
    this.inbox.refresh(true);
    this.approving = null;
    this.selected = null;
    this.load(this.page);
  }
}
