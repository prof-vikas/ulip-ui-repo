import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { AuditLog } from '../../core/api/rbac.models';

const ACTIONS = [
  'LOGIN', 'ACCOUNT_LOCKED', 'SIGNUP', 'PASSWORD_RESET', 'ACCESS_REQUEST', 'ACCESS_APPROVE', 'ACCESS_REJECT', 'ACCESS_REVOKE',
  'API_KEY_CREATE', 'API_KEY_ROTATE', 'API_KEY_REVOKE', 'CREDIT_TOP_UP', 'USER_ROLE_CHANGE', 'USER_STATUS_CHANGE',
  'ROLE_CREATE', 'ROLE_PERMISSIONS', 'MENU_CREATE', 'MENU_UPDATE', 'MENU_DELETE', 'CATALOG_UPDATE'
];

@Component({
  selector: 'app-audit',
  standalone: false,
  template: `
    <div class="page">
      <app-page-header title="Audit Log" eyebrow="Administration" description="Who did what, and when. Newest first."></app-page-header>

      <div class="panel">
        <div class="panel-head">
          <div class="toolbar">
            <input class="input action" list="audit-actions" placeholder="Filter by action" [(ngModel)]="action" (keyup.enter)="load(0)" />
            <datalist id="audit-actions"><option *ngFor="let a of actions" [value]="a"></option></datalist>
            <input class="input actor" type="number" min="1" placeholder="Actor user ID" [(ngModel)]="actor" (keyup.enter)="load(0)" />
            <button class="btn btn-sm" (click)="load(0)">Apply</button>
            <button class="btn btn-ghost btn-sm" *ngIf="action || actor" (click)="action = ''; actor = null; load(0)">Clear</button>
          </div>
        </div>

        <app-empty-state *ngIf="loading" [loading]="true"></app-empty-state>
        <app-empty-state *ngIf="!loading && error" [error]="true" title="Couldn't load the audit log" [text]="error"></app-empty-state>
        <app-empty-state *ngIf="!loading && !error && !rows.length" icon="history" title="No entries"></app-empty-state>

        <div class="table-wrap" *ngIf="!loading && rows.length">
          <table class="table">
            <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Detail</th><th>IP</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of rows">
                <td class="muted nowrap">{{ r.createdAt | date: 'd MMM y, h:mm:ss a' }}</td>
                <td><div class="cell-main">{{ r.actorName || 'system' }}</div><div class="cell-sub" *ngIf="r.actorUserId">#{{ r.actorUserId }}</div></td>
                <td><span class="action-tag mono">{{ r.action }}</span></td>
                <td class="mono muted">{{ r.entityType ? r.entityType + (r.entityId ? ' #' + r.entityId : '') : '—' }}</td>
                <td class="detail" [title]="r.detail || ''">{{ r.detail || '—' }}</td>
                <td class="mono muted">{{ r.ip || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-pager [page]="page" [size]="size" [total]="total" (pageChange)="load($event)"></app-pager>
      </div>
    </div>
  `,
  styles: [`
    .action { width: 220px; height: 34px; }
    .actor { width: 150px; height: 34px; }
    .nowrap { white-space: nowrap; }
    .action-tag { font-size: 11.5px; padding: 2px 8px; border-radius: var(--radius-pill); background: var(--color-primary-light); color: var(--color-primary); white-space: nowrap; }
    .detail { max-width: 340px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text-muted); }
  `]
})
export class AuditComponent implements OnInit {
  readonly actions = ACTIONS;
  rows: AuditLog[] = [];
  action = '';
  actor: number | null = null;
  page = 0;
  readonly size = 25;
  total = 0;
  loading = true;
  error = '';

  constructor(private api: RbacApiService) {}

  ngOnInit(): void {
    this.load(0);
  }

  load(page: number): void {
    this.loading = true;
    this.error = '';
    this.api.auditLogs({ action: this.action.trim() || undefined, actorUserId: this.actor ?? undefined, page, size: this.size })
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
}
