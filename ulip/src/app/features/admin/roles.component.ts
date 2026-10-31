import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { Permission, Role } from '../../core/api/rbac.models';
import { NotifyService } from '../../shared/ui/notify.service';

interface PermissionGroup {
  module: string;
  label: string;
  items: Permission[];
}

const GROUP_LABELS: Record<string, string> = {
  DATA: 'Data APIs (operator portal)',
  SELF: 'Developer self-service',
  ADMIN: 'Administration'
};

@Component({
  selector: 'app-roles',
  standalone: false,
  template: `
    <div class="page">
      <app-page-header title="Roles & Permissions" eyebrow="Administration"
        description="A role is a bundle of permissions. Menus and pages appear for users whose role holds the matching permission.">
        <button class="btn btn-primary" (click)="newRoleOpen = true"><app-icon name="plus" [size]="16"></app-icon> New role</button>
      </app-page-header>

      <app-empty-state *ngIf="loading" [loading]="true"></app-empty-state>
      <app-empty-state *ngIf="!loading && error" [error]="true" title="Couldn't load roles" [text]="error"></app-empty-state>

      <div class="layout" *ngIf="!loading && !error">
        <aside class="panel roles">
          <button type="button" class="role" *ngFor="let r of roles" [class.active]="r.id === selected?.id" (click)="select(r)">
            <span class="role-icon"><app-icon name="shield" [size]="16"></app-icon></span>
            <span class="role-text">
              <span class="role-name">{{ r.name }}</span>
              <span class="role-sub">{{ r.permissions.length }} permission{{ r.permissions.length === 1 ? '' : 's' }}</span>
            </span>
          </button>
        </aside>

        <section class="panel" *ngIf="selected as role">
          <div class="panel-head">
            <div>
              <h3 class="panel-title">{{ role.name }}</h3>
              <p class="panel-sub">{{ draft.size }} of {{ permissions.length }} permissions selected</p>
            </div>
            <div class="toolbar">
              <button class="btn btn-ghost btn-sm" [disabled]="!dirty" (click)="select(role)">Discard</button>
              <button class="btn btn-primary btn-sm" [disabled]="!dirty || saving" (click)="save()">
                <span class="btn-spinner" *ngIf="saving"></span> Save changes
              </button>
            </div>
          </div>

          <div class="alert alert-warning lock-note" *ngIf="isOwnRole(role)">
            <app-icon name="alert" [size]="16"></app-icon>
            <span>This is your own role. Removing ROLE_MANAGE would lock you out of this page.</span>
          </div>

          <div class="group" *ngFor="let g of groups">
            <div class="group-head">
              <span>{{ g.label }}</span>
              <button type="button" class="link" (click)="toggleGroup(g)">{{ allIn(g) ? 'Clear all' : 'Select all' }}</button>
            </div>
            <label class="perm" *ngFor="let p of g.items" [class.on]="draft.has(p.code)">
              <input type="checkbox" [checked]="draft.has(p.code)" (change)="toggle(p.code)" />
              <span class="perm-text">
                <span class="perm-name">{{ p.name }}</span>
                <span class="perm-code mono">{{ p.code }}</span>
                <span class="perm-desc" *ngIf="p.description">{{ p.description }}</span>
              </span>
            </label>
          </div>
        </section>
      </div>
    </div>

    <app-dialog [open]="newRoleOpen" title="New role" subtitle="Start empty, then tick the permissions it should have." (close)="newRoleOpen = false">
      <label class="field">
        <span class="field-label">Role name <span class="req">*</span></span>
        <input class="input mono" [(ngModel)]="newRoleName" placeholder="e.g. FIELD_OPERATOR" maxlength="41"
               (ngModelChange)="newRoleName = $event.toUpperCase().replace(' ', '_')" />
        <span class="field-hint">UPPER_SNAKE_CASE, 3–41 characters.</span>
      </label>
      <div dialog-footer>
        <button class="btn btn-ghost" (click)="newRoleOpen = false">Cancel</button>
        <button class="btn btn-primary" [disabled]="!validName || saving" (click)="createRole()">Create role</button>
      </div>
    </app-dialog>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 16px; align-items: start; }
    @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
    .roles { padding: 8px; display: flex; flex-direction: column; gap: 2px; position: sticky; top: 76px; }
    .role { display: flex; align-items: center; gap: 10px; padding: 10px; border: none; background: none; border-radius: var(--radius-sm);
            cursor: pointer; text-align: left; font: inherit; color: var(--color-text); }
    .role:hover { background: var(--color-surface-alt); }
    .role.active { background: var(--color-primary-light); color: var(--color-primary); }
    .role-icon { width: 30px; height: 30px; border-radius: 8px; background: var(--color-surface-alt); display: flex; align-items: center; justify-content: center; }
    .role.active .role-icon { background: var(--color-surface); }
    .role-text { display: flex; flex-direction: column; min-width: 0; }
    .role-name { font-weight: 600; font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; }
    .role-sub { font-size: 11.5px; color: var(--color-text-faint); }
    .lock-note { margin: 14px 20px 0; }
    .group { padding: 6px 20px 16px; }
    .group-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 0 8px; font-size: 12px; font-weight: 700;
                  text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-faint); }
    .link { background: none; border: none; color: var(--color-primary); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; text-transform: none; letter-spacing: 0; }
    .perm { display: flex; gap: 12px; align-items: flex-start; padding: 10px 12px; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm);
            margin-bottom: 6px; cursor: pointer; transition: border-color var(--transition-base), background var(--transition-base); }
    .perm:hover { border-color: var(--color-border); }
    .perm.on { border-color: var(--color-primary); background: var(--color-primary-light); }
    .perm input { margin-top: 3px; width: 16px; height: 16px; accent-color: var(--color-primary); flex-shrink: 0; }
    .perm-text { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; }
    .perm-name { font-weight: 600; font-size: 13.5px; color: var(--color-text); }
    .perm-code { font-size: 11px; color: var(--color-text-faint); }
    .perm-desc { flex-basis: 100%; font-size: 12.5px; color: var(--color-text-muted); }
  `]
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  permissions: Permission[] = [];
  groups: PermissionGroup[] = [];
  selected: Role | null = null;
  draft = new Set<string>();
  loading = true;
  saving = false;
  error = '';
  newRoleOpen = false;
  newRoleName = '';

  constructor(private api: RbacApiService, private auth: AuthService, private notify: NotifyService) {}

  ngOnInit(): void {
    forkJoin({ roles: this.api.roles(), permissions: this.api.permissions() })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ roles, permissions }) => {
          this.roles = roles;
          this.permissions = permissions;
          this.groups = this.group(permissions);
          const mine = roles.find(r => r.name === this.auth.user()?.role);
          this.select(mine ?? roles[0]);
        },
        error: err => (this.error = errorMessage(err))
      });
  }

  get dirty(): boolean {
    const current = new Set(this.selected?.permissions ?? []);
    return current.size !== this.draft.size || [...this.draft].some(p => !current.has(p));
  }

  get validName(): boolean {
    return /^[A-Z][A-Z0-9_]{2,40}$/.test(this.newRoleName);
  }

  isOwnRole(role: Role): boolean {
    return role.name === this.auth.user()?.role;
  }

  select(role: Role | undefined): void {
    if (!role) {
      return;
    }
    this.selected = role;
    this.draft = new Set(role.permissions);
  }

  toggle(code: string): void {
    this.draft.has(code) ? this.draft.delete(code) : this.draft.add(code);
  }

  allIn(g: PermissionGroup): boolean {
    return g.items.every(p => this.draft.has(p.code));
  }

  toggleGroup(g: PermissionGroup): void {
    const on = !this.allIn(g);
    g.items.forEach(p => (on ? this.draft.add(p.code) : this.draft.delete(p.code)));
  }

  save(): void {
    const role = this.selected;
    if (!role) {
      return;
    }
    this.saving = true;
    this.api.setRolePermissions(role.id, [...this.draft]).pipe(finalize(() => (this.saving = false))).subscribe({
      next: updated => {
        Object.assign(role, updated);
        this.select(role);
        this.notify.success(`${role.name} updated. Users with this role see the change on their next page load.`);
        if (this.isOwnRole(role)) {
          this.auth.loadSession().subscribe();
        }
      },
      error: err => this.notify.error(errorMessage(err))
    });
  }

  createRole(): void {
    this.saving = true;
    this.api.createRole(this.newRoleName).pipe(finalize(() => (this.saving = false))).subscribe({
      next: role => {
        this.roles = [...this.roles, role];
        this.newRoleOpen = false;
        this.newRoleName = '';
        this.select(role);
        this.notify.success(`Role ${role.name} created.`);
      },
      error: err => this.notify.error(errorMessage(err))
    });
  }

  private group(perms: Permission[]): PermissionGroup[] {
    const order = ['DATA', 'SELF', 'ADMIN'];
    const modules = [...new Set(perms.map(p => p.module))].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    });
    return modules.map(m => ({ module: m, label: GROUP_LABELS[m] ?? m, items: perms.filter(p => p.module === m) }));
  }
}
