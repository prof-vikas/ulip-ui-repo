import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { UserRow } from '../../core/api/rbac.models';
import { NotifyService } from '../../shared/ui/notify.service';

@Component({
  selector: 'app-users',
  standalone: false,
  template: `
    <div class="page">
      <app-page-header title="Users" eyebrow="Administration"
        description="Each user has one role; the role decides which menus and actions they get. Changes apply on their next request.">
      </app-page-header>

      <div class="panel">
        <div class="panel-head">
          <label class="input-search search">
            <app-icon name="search" [size]="16"></app-icon>
            <input class="input" placeholder="Search name, username, e-mail or organisation" [ngModel]="search" (ngModelChange)="search$.next($event)" />
          </label>
          <span class="muted total">{{ total | number }} users</span>
        </div>

        <app-empty-state *ngIf="loading" [loading]="true"></app-empty-state>
        <app-empty-state *ngIf="!loading && error" [error]="true" title="Couldn't load users" [text]="error"></app-empty-state>
        <app-empty-state *ngIf="!loading && !error && !rows.length" icon="users" title="No users found"></app-empty-state>

        <div class="table-wrap" *ngIf="!loading && rows.length">
          <table class="table">
            <thead><tr><th>User</th><th>Organisation</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let u of rows">
                <td>
                  <div class="who">
                    <span class="avatar">{{ (u.name || u.username).charAt(0).toUpperCase() }}</span>
                    <div><div class="cell-main">{{ u.name || u.username }}</div><div class="cell-sub">{{ u.email || u.username }}</div></div>
                  </div>
                </td>
                <td>{{ u.organisation || '—' }}</td>
                <td>
                  <select class="select role-sel" [ngModel]="u.roleId" (ngModelChange)="changeRole(u, $event)" [disabled]="u.id === meId"
                          [title]="u.id === meId ? 'You cannot change your own role' : 'Change role'">
                    <option *ngFor="let r of roles" [ngValue]="r.id">{{ r.name }}</option>
                  </select>
                </td>
                <td><app-status-badge [value]="u.active ? 'ACTIVE' : 'DISABLED'" [label]="u.active ? 'Active' : 'Disabled'"></app-status-badge></td>
                <td class="actions">
                  <button class="btn btn-ghost btn-sm" *ngIf="u.id !== meId" (click)="toggleActive(u)">{{ u.active ? 'Disable' : 'Enable' }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-pager [page]="page" [size]="size" [total]="total" (pageChange)="load($event)"></app-pager>
      </div>
    </div>
  `,
  styles: [`
    .search { flex: 1; max-width: 440px; }
    .total { font-size: 13px; }
    .who { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary);
              font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .role-sel { width: 180px; height: 34px; font-size: 13px; }
  `]
})
export class UsersComponent implements OnInit, OnDestroy {
  rows: UserRow[] = [];
  roles: { id: number; name: string }[] = [];
  search = '';
  readonly search$ = new Subject<string>();
  page = 0;
  readonly size = 20;
  total = 0;
  loading = true;
  error = '';

  constructor(private api: RbacApiService, private auth: AuthService, private notify: NotifyService) {}

  get meId(): number | undefined {
    return this.auth.user()?.userId;
  }

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300)).subscribe(s => {
      this.search = s;
      this.load(0);
    });
    if (this.auth.hasPermission('ROLE_MANAGE')) {
      this.api.roles().subscribe({ next: r => (this.roles = r.map(x => ({ id: x.id, name: x.name }))), error: () => undefined });
    }
    this.load(0);
  }

  ngOnDestroy(): void {
    this.search$.complete();
  }

  load(page: number): void {
    this.loading = true;
    this.error = '';
    this.api.users(this.search.trim(), page, this.size).pipe(finalize(() => (this.loading = false))).subscribe({
      next: p => {
        this.rows = p.items;
        this.page = p.page;
        this.total = p.total;
        this.mergeRolesFromRows();
      },
      error: err => (this.error = errorMessage(err))
    });
  }

  async changeRole(u: UserRow, roleId: number): Promise<void> {
    const role = this.roles.find(r => r.id === roleId);
    const { ok } = await this.notify.confirm({
      title: 'Change role?',
      text: `${u.name || u.username} will become ${role?.name}. Their menu and permissions change on their next request.`,
      confirmLabel: 'Change role'
    });
    if (!ok) {
      // The <select> already shows the new choice; reload so it snaps back to the saved role.
      this.load(this.page);
      return;
    }
    this.api.changeUserRole(u.id, roleId).subscribe({
      next: updated => {
        Object.assign(u, updated);
        this.notify.success(`${u.name || u.username} is now ${updated.role}.`);
      },
      error: err => {
        this.notify.error(errorMessage(err));
        this.load(this.page);
      }
    });
  }

  async toggleActive(u: UserRow): Promise<void> {
    const enable = !u.active;
    const { ok } = await this.notify.confirm({
      title: enable ? 'Enable user?' : 'Disable user?',
      text: enable ? `${u.username} can sign in again.` : `${u.username} is signed out and cannot sign in or call APIs until enabled.`,
      confirmLabel: enable ? 'Enable' : 'Disable',
      danger: !enable
    });
    if (ok) {
      this.api.changeUserStatus(u.id, enable).subscribe({
        next: updated => {
          Object.assign(u, updated);
          this.notify.success(enable ? 'User enabled.' : 'User disabled.');
        },
        error: err => this.notify.error(errorMessage(err))
      });
    }
  }

  /** Without ROLE_MANAGE the role list can't be fetched; offer the roles seen on users instead. */
  private mergeRolesFromRows(): void {
    for (const u of this.rows) {
      if (u.roleId && !this.roles.some(r => r.id === u.roleId)) {
        this.roles = [...this.roles, { id: u.roleId, name: u.role }];
      }
    }
  }
}
