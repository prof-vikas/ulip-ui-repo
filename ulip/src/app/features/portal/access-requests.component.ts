import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { AccessRequest } from '../../core/api/rbac.models';
import { NotifyService } from '../../shared/ui/notify.service';
import { InboxService } from '../../core/inbox/inbox.service';

@Component({
  selector: 'app-access-requests',
  standalone: false,
  template: `
    <div class="page">
      <app-page-header title="My Access Requests" eyebrow="Developer"
        description="Sandbox requests are usually approved instantly. Production requests are reviewed by an administrator.">
        <a class="btn btn-primary" routerLink="/dashboard/catalog" *appHasPermission="'CATALOG_VIEW'">
          <app-icon name="plus" [size]="16"></app-icon> New request
        </a>
      </app-page-header>

      <div class="panel">
        <div class="panel-head">
          <div class="tabs" role="tablist">
            <button class="tab" *ngFor="let t of tabs" [class.active]="tab === t.value" (click)="tab = t.value" role="tab">
              {{ t.label }} <span class="count">{{ count(t.value) }}</span>
            </button>
          </div>
          <button class="btn btn-ghost btn-sm" (click)="load()" [disabled]="loading"><app-icon name="refresh" [size]="15"></app-icon> Refresh</button>
        </div>

        <app-empty-state *ngIf="loading" [loading]="true"></app-empty-state>
        <app-empty-state *ngIf="!loading && error" [error]="true" title="Couldn't load your requests" [text]="error"></app-empty-state>
        <app-empty-state *ngIf="!loading && !error && !visible.length" icon="inbox" title="No requests yet"
          text="Open the API catalog and request sandbox access to get started."></app-empty-state>

        <div class="table-wrap" *ngIf="!loading && visible.length">
          <table class="table">
            <thead>
              <tr><th>API</th><th>Environment</th><th>Status</th><th class="num">Quota</th><th>Valid until</th><th>Requested</th><th></th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of visible">
                <td>
                  <div class="cell-main">{{ r.apiName }}</div>
                  <div class="cell-sub" *ngIf="r.decisionNote" [title]="r.decisionNote">“{{ r.decisionNote }}”</div>
                </td>
                <td><app-status-badge [value]="r.environment"></app-status-badge></td>
                <td><app-status-badge [value]="r.status"></app-status-badge></td>
                <td class="num">{{ (r.approvedQuota ?? r.requestedQuota) | number }}</td>
                <td>{{ r.validUntil ? (r.validUntil | date: 'd MMM y') : '—' }}</td>
                <td class="muted">{{ r.createdAt | date: 'd MMM y, h:mm a' }}</td>
                <td class="actions">
                  <button class="btn btn-ghost btn-sm" *ngIf="r.status === 'PENDING'" (click)="cancel(r)">Cancel</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .count { font-size: 11px; color: var(--color-text-faint); margin-left: 4px; }
    .cell-sub { max-width: 360px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `]
})
export class AccessRequestsComponent implements OnInit {
  readonly tabs = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Closed', value: 'CLOSED' }
  ];
  tab = '';
  requests: AccessRequest[] = [];
  loading = true;
  error = '';

  constructor(private api: RbacApiService, private notify: NotifyService, private inbox: InboxService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.myAccessRequests().pipe(finalize(() => (this.loading = false))).subscribe({
      next: r => (this.requests = r),
      error: err => (this.error = errorMessage(err))
    });
  }

  private matches(r: AccessRequest, tab: string): boolean {
    if (!tab) {
      return true;
    }
    if (tab === 'CLOSED') {
      return r.status !== 'PENDING' && r.status !== 'APPROVED';
    }
    return r.status === tab;
  }

  count(tab: string): number {
    return this.requests.filter(r => this.matches(r, tab)).length;
  }

  get visible(): AccessRequest[] {
    return this.requests.filter(r => this.matches(r, this.tab));
  }

  async cancel(r: AccessRequest): Promise<void> {
    const { ok } = await this.notify.confirm({
      title: 'Cancel request?',
      text: `Your ${r.environment.toLowerCase()} request for ${r.apiName} will be withdrawn.`,
      confirmLabel: 'Cancel request',
      danger: true
    });
    if (!ok) {
      return;
    }
    this.api.cancelAccessRequest(r.id).subscribe({
      next: () => {
        this.notify.success('Request cancelled.');
        this.inbox.refresh(true);
        this.load();
      },
      error: err => this.notify.error(errorMessage(err))
    });
  }
}
