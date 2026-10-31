import { Component, OnInit } from '@angular/core';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { MenuRow, Permission } from '../../core/api/rbac.models';
import { NotifyService } from '../../shared/ui/notify.service';

type MenuForm = Omit<Partial<MenuRow>, 'parentId' | 'permissionCode'> & { parentId: number | null; permissionCode: string | null };

interface MenuLine {
  menu: MenuRow;
  depth: number;
}

const ICONS = ['home', 'apps', 'inbox', 'key', 'chart', 'user', 'users', 'shield', 'check', 'coins', 'sliders', 'lock', 'menu',
  'history', 'car', 'id-card', 'tag', 'train', 'file', 'anchor', 'sparkle', 'mail'];

@Component({
  selector: 'app-menus',
  standalone: false,
  template: `
    <div class="page">
      <app-page-header title="Menus" eyebrow="Administration"
        description="The sidebar is built from these entries. An entry shows when the user's role holds its permission; a group shows when any child shows.">
        <button class="btn btn-primary" (click)="edit(null)"><app-icon name="plus" [size]="16"></app-icon> New menu</button>
      </app-page-header>

      <div class="panel">
        <app-empty-state *ngIf="loading" [loading]="true"></app-empty-state>
        <app-empty-state *ngIf="!loading && error" [error]="true" title="Couldn't load menus" [text]="error"></app-empty-state>
        <div class="table-wrap" *ngIf="!loading && !error">
          <table class="table">
            <thead><tr><th>Label</th><th>Path</th><th>Permission</th><th class="num">Order</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let line of lines">
                <td>
                  <div class="label-cell" [style.padding-left.px]="line.depth * 26">
                    <span class="m-icon" [class.child]="line.depth > 0"><app-icon [name]="line.menu.icon || 'dot'" [size]="15"></app-icon></span>
                    <div><div class="cell-main">{{ line.menu.label }}</div><div class="cell-sub mono">{{ line.menu.code }}</div></div>
                  </div>
                </td>
                <td class="mono">{{ line.menu.path || '(group)' }}</td>
                <td class="mono muted">{{ line.menu.permissionCode || 'Everyone' }}</td>
                <td class="num">{{ line.menu.sortOrder }}</td>
                <td><app-status-badge [value]="line.menu.active ? 'ACTIVE' : 'INACTIVE'" [label]="line.menu.active ? 'Shown' : 'Hidden'"></app-status-badge></td>
                <td class="actions">
                  <button class="btn btn-ghost btn-sm" (click)="edit(line.menu)"><app-icon name="edit" [size]="14"></app-icon> Edit</button>
                  <button class="btn btn-ghost btn-sm danger" (click)="remove(line.menu)" aria-label="Delete"><app-icon name="trash" [size]="14"></app-icon></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <app-dialog variant="drawer" [open]="editing" [title]="form.id ? 'Edit menu' : 'New menu'" (close)="editing = false">
      <label class="field">
        <span class="field-label">Code <span class="req">*</span></span>
        <input class="input mono" [(ngModel)]="form.code" [disabled]="!!form.id" maxlength="60" placeholder="REPORTS" />
        <span class="field-hint">UPPER_SNAKE_CASE, unique. Cannot be changed later.</span>
      </label>
      <label class="field"><span class="field-label">Label <span class="req">*</span></span><input class="input" [(ngModel)]="form.label" maxlength="100" /></label>
      <label class="field">
        <span class="field-label">Path</span>
        <input class="input mono" [(ngModel)]="form.path" maxlength="200" placeholder="/reports" />
        <span class="field-hint">Relative to the portal, e.g. /vahan/01. Leave empty for a group heading.</span>
      </label>
      <div class="field">
        <span class="field-label">Icon</span>
        <div class="icons">
          <button type="button" *ngFor="let i of icons" class="icon-pick" [class.on]="form.icon === i" (click)="form.icon = i" [title]="i">
            <app-icon [name]="i" [size]="16"></app-icon>
          </button>
        </div>
      </div>
      <label class="field">
        <span class="field-label">Parent</span>
        <select class="select" [(ngModel)]="form.parentId">
          <option [ngValue]="null">— Top level —</option>
          <option *ngFor="let m of parents" [ngValue]="m.id">{{ m.label }}</option>
        </select>
      </label>
      <label class="field">
        <span class="field-label">Permission</span>
        <select class="select" [(ngModel)]="form.permissionCode">
          <option [ngValue]="null">Everyone (no permission needed)</option>
          <option *ngFor="let p of permissions" [ngValue]="p.code">{{ p.code }} — {{ p.name }}</option>
        </select>
      </label>
      <label class="field"><span class="field-label">Sort order</span><input class="input" type="number" [(ngModel)]="form.sortOrder" /></label>
      <label class="check"><input type="checkbox" [(ngModel)]="form.active" /> Shown in the sidebar</label>
      <div dialog-footer>
        <button class="btn btn-ghost" (click)="editing = false">Cancel</button>
        <button class="btn btn-primary" [disabled]="!form.code || !form.label || saving" (click)="save()">
          <span class="btn-spinner" *ngIf="saving"></span> Save
        </button>
      </div>
    </app-dialog>
  `,
  styles: [`
    .label-cell { display: flex; align-items: center; gap: 10px; }
    .m-icon { width: 30px; height: 30px; border-radius: 8px; background: var(--color-primary-light); color: var(--color-primary);
              display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .m-icon.child { background: var(--color-surface-alt); color: var(--color-text-faint); }
    .danger { color: var(--color-error); }
    .icons { display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); gap: 6px; }
    .icon-pick { height: 36px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-surface);
                 color: var(--color-text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .icon-pick.on { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-light); }
  `]
})
export class MenusComponent implements OnInit {
  readonly icons = ICONS;
  menus: MenuRow[] = [];
  lines: MenuLine[] = [];
  permissions: Permission[] = [];
  loading = true;
  saving = false;
  error = '';
  editing = false;
  form: MenuForm = this.blank();

  constructor(private api: RbacApiService, private auth: AuthService, private notify: NotifyService) {}

  ngOnInit(): void {
    this.load();
  }

  get parents(): MenuRow[] {
    return this.menus.filter(m => !m.parentId && m.id !== this.form.id);
  }

  load(): void {
    this.loading = true;
    // The permission list needs ROLE_MANAGE; without it, offer the codes already used by menus.
    const perms: Observable<Permission[] | null> = this.auth.hasPermission('ROLE_MANAGE')
      ? this.api.permissions().pipe(catchError(() => of(null)))
      : of(null);
    forkJoin({ menus: this.api.menus(), perms })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: res => {
          this.menus = res.menus;
          this.lines = this.flatten(res.menus);
          this.permissions = res.perms ?? this.permissionsFromMenus(res.menus);
        },
        error: err => (this.error = errorMessage(err))
      });
  }

  edit(menu: MenuRow | null): void {
    this.form = menu
      ? { ...menu, parentId: menu.parentId ?? null, permissionCode: menu.permissionCode ?? null }
      : this.blank();
    this.editing = true;
  }

  save(): void {
    const body = {
      code: this.form.code?.trim(),
      label: this.form.label?.trim(),
      path: this.form.path?.trim() || undefined,
      icon: this.form.icon || undefined,
      parentId: this.form.parentId ?? undefined,
      sortOrder: this.form.sortOrder ?? 100,
      permissionCode: this.form.permissionCode ?? undefined,
      active: this.form.active ?? true
    } as Partial<MenuRow>;
    this.saving = true;
    const call = this.form.id ? this.api.updateMenu(this.form.id, body) : this.api.createMenu(body);
    call.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.editing = false;
        this.notify.success('Menu saved. It applies on each user\'s next sign-in or page load.');
        this.load();
        this.auth.loadSession().subscribe();
      },
      error: err => this.notify.error(errorMessage(err))
    });
  }

  async remove(menu: MenuRow): Promise<void> {
    const { ok } = await this.notify.confirm({
      title: `Delete “${menu.label}”?`,
      text: 'It disappears from everyone\'s sidebar. To hide it temporarily, edit it and untick “Shown” instead.',
      confirmLabel: 'Delete',
      danger: true
    });
    if (ok) {
      this.api.deleteMenu(menu.id).subscribe({
        next: () => {
          this.notify.success('Menu deleted.');
          this.load();
        },
        error: err => this.notify.error(errorMessage(err))
      });
    }
  }

  private blank(): MenuForm {
    return { code: '', label: '', path: '', icon: 'apps', parentId: null, sortOrder: 100, permissionCode: null, active: true };
  }

  private flatten(menus: MenuRow[]): MenuLine[] {
    const sorted = [...menus].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    const out: MenuLine[] = [];
    const walk = (parentId: number | null, depth: number) => {
      for (const m of sorted.filter(x => (x.parentId ?? null) === parentId)) {
        out.push({ menu: m, depth });
        if (depth < 4) {
          walk(m.id, depth + 1);
        }
      }
    };
    walk(null, 0);
    return out;
  }

  private permissionsFromMenus(menus: MenuRow[]): Permission[] {
    const codes = [...new Set(menus.map(m => m.permissionCode).filter((c): c is string => !!c))].sort();
    return codes.map(code => ({ code, name: code, module: '' }));
  }
}
