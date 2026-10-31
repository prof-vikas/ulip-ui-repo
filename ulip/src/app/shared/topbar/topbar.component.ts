import { Component, HostListener, computed } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../../core/layout/layout.service';
import { ApiAccessService } from '../../core/api/api-access.service';
import { Environment } from '../../core/api/rbac.models';
import { MenuNode } from '../../core/api/rbac.models';
import { moduleForMenuCode } from '../../core/menu/menu-config';

const HOME = '/dashboard/home';

/**
 * Top bar of the logged-in shell: back, page title, the Production/Sandbox switch (applies to every data
 * API page), theme switch and the user menu.
 */
@Component({
  selector: 'app-topbar',
  standalone: false,
  template: `
    <header class="topbar">
      <button type="button" class="tb-icon menu-btn" (click)="layout.toggleMobile()" aria-label="Open menu">
        <app-icon name="menu"></app-icon>
      </button>
      <button type="button" class="tb-back" *ngIf="showBack" (click)="back()" title="Back" aria-label="Go back">
        <app-icon name="chevron-left" [size]="16"></app-icon><span>Back</span>
      </button>
      <span class="tb-divider" *ngIf="showBack"></span>
      <div class="tb-title">
        <span class="tb-section" *ngIf="section">{{ section }}</span>
        <app-icon name="chevron-right" [size]="14" *ngIf="section && title"></app-icon>
        <span class="tb-page">{{ title }}</span>
      </div>
      <div class="tb-right">
        <div class="env-switch" *ngIf="hasDataApis()" role="radiogroup" aria-label="Environment for all data APIs"
             [title]="'Every data API page calls ' + (apiAccess.active() === 'SANDBOX' ? 'the sandbox' : 'production')">
          <button type="button" role="radio" class="env-opt prod" [class.on]="apiAccess.active() === 'PRODUCTION'"
                  [attr.aria-checked]="apiAccess.active() === 'PRODUCTION'" (click)="setEnv('PRODUCTION')">
            <span class="env-dot"></span>Production
          </button>
          <button type="button" role="radio" class="env-opt sandbox" [class.on]="apiAccess.active() === 'SANDBOX'"
                  [attr.aria-checked]="apiAccess.active() === 'SANDBOX'" (click)="setEnv('SANDBOX')">
            <span class="env-dot"></span>Sandbox
          </button>
        </div>
        <app-notification-bell></app-notification-bell>
        <app-theme-toggle></app-theme-toggle>
        <div class="tb-user" (click)="$event.stopPropagation()">
          <button type="button" class="tb-user-btn" (click)="menuOpen = !menuOpen" [attr.aria-expanded]="menuOpen" aria-haspopup="menu">
            <span class="tb-avatar">{{ initials() }}</span>
            <span class="tb-user-text">
              <span class="tb-name">{{ auth.user()?.name || auth.user()?.username }}</span>
              <span class="tb-role">{{ (auth.user()?.role || '') | titlecase }}</span>
            </span>
            <app-icon name="chevron-down" [size]="14"></app-icon>
          </button>
          <div class="tb-menu" *ngIf="menuOpen" role="menu">
            <div class="tb-menu-head">
              <div class="tb-name">{{ auth.user()?.name }}</div>
              <div class="tb-email">{{ auth.user()?.email || auth.user()?.username }}</div>
              <div class="tb-org" *ngIf="auth.user()?.organisation">{{ auth.user()?.organisation }}</div>
            </div>
            <a *appHasPermission="'PROFILE_EDIT'" class="tb-menu-item" routerLink="/dashboard/profile" (click)="menuOpen = false" role="menuitem">
              <app-icon name="user" [size]="16"></app-icon> Profile &amp; password
            </a>
            <button type="button" class="tb-menu-item danger" (click)="logout()" role="menuitem">
              <app-icon name="logout" [size]="16"></app-icon> Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 14px; height: 60px; padding: 0 28px;
              background: color-mix(in srgb, var(--color-bg) 90%, transparent); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
              transform: translateZ(0); /* own layer: the blur is not repainted with the scrolling content */
              border-bottom: 1px solid var(--color-border-subtle); }
    .tb-icon { width: 36px; height: 36px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-surface);
               color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .menu-btn { display: none; }
    .tb-back { display: inline-flex; align-items: center; gap: 4px; height: 34px; padding: 0 12px 0 8px; border-radius: var(--radius-pill);
               border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-muted); font: inherit;
               font-size: 13px; font-weight: 600; cursor: pointer; flex-shrink: 0;
               transition: color var(--transition-base), border-color var(--transition-base), transform var(--transition-base); }
    .tb-back:hover { color: var(--color-primary); border-color: var(--color-primary); transform: translateX(-2px); }
    .tb-divider { width: 1px; height: 22px; background: var(--color-border); flex-shrink: 0; }
    .env-switch { display: inline-flex; padding: 3px; gap: 2px; border-radius: var(--radius-pill); background: var(--color-surface-alt);
                  border: 1px solid var(--color-border); }
    .env-opt { display: inline-flex; align-items: center; gap: 7px; height: 28px; padding: 0 12px; border: none; border-radius: var(--radius-pill);
               background: transparent; color: var(--color-text-muted); font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
               transition: background var(--transition-base), color var(--transition-base), box-shadow var(--transition-base); }
    .env-opt:hover:not(.on) { color: var(--color-text); }
    .env-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-text-faint); }
    .env-opt.on { background: var(--color-surface); color: var(--color-text); box-shadow: var(--shadow-sm); }
    .env-opt.prod.on .env-dot { background: var(--brand-green); box-shadow: 0 0 0 3px var(--color-success-bg); }
    .env-opt.sandbox.on .env-dot { background: var(--color-warning); box-shadow: 0 0 0 3px var(--color-warning-bg); }
    .tb-title { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; font-size: 14px; color: var(--color-text-faint); }
    .tb-section { white-space: nowrap; }
    .tb-page { font-weight: 700; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tb-right { display: flex; align-items: center; gap: 14px; }
    .tb-user { position: relative; }
    .tb-user-btn { display: flex; align-items: center; gap: 10px; padding: 4px 8px 4px 4px; border-radius: var(--radius-pill);
                   border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; color: var(--color-text-muted); font: inherit; }
    .tb-user-btn:hover { border-color: var(--color-primary); }
    .tb-avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--gradient-brand); color: #fff; font-size: 12px; font-weight: 700;
                 display: flex; align-items: center; justify-content: center; }
    .tb-user-text { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.2; max-width: 160px; }
    .tb-name { font-size: 13px; font-weight: 600; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .tb-role { font-size: 11px; color: var(--color-text-faint); }
    .tb-menu { position: absolute; right: 0; top: calc(100% + 8px); width: 250px; background: var(--color-surface); border: 1px solid var(--color-border);
               border-radius: var(--radius-md); box-shadow: var(--shadow-lg); padding: 6px; animation: fadeInUp 0.15s ease both; }
    .tb-menu-head { padding: 10px 10px 12px; border-bottom: 1px solid var(--color-border-subtle); margin-bottom: 6px; }
    .tb-email, .tb-org { font-size: 12px; color: var(--color-text-faint); margin-top: 2px; word-break: break-all; }
    .tb-menu-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; border: none; background: none; border-radius: var(--radius-sm);
                    font: inherit; font-size: 13.5px; color: var(--color-text); cursor: pointer; text-decoration: none; }
    .tb-menu-item:hover { background: var(--color-surface-alt); }
    .tb-menu-item.danger { color: var(--color-error); }
    .tb-menu-item.danger:hover { background: var(--color-error-bg); }
    @media (max-width: 900px) {
      .topbar { padding: 0 16px; }
      .menu-btn { display: flex; }
      .tb-user-text { display: none; }
      .tb-back span, .tb-divider { display: none; }
      .tb-back { padding: 0 8px; }
    }
    @media (max-width: 680px) { .env-opt { padding: 0 9px; font-size: 12px; } .env-dot { display: none; } }
    @media (max-width: 520px) { .tb-section, .tb-title app-icon { display: none; } }
  `]
})
export class TopbarComponent {
  title = '';
  section = '';
  menuOpen = false;
  showBack = false;

  readonly hasDataApis = computed(() => {
    const walk = (nodes: { code: string; children?: { code: string }[] }[]): boolean =>
      nodes.some(n => !!moduleForMenuCode(n.code) || walk(n.children ?? []));
    return walk(this.auth.navigation());
  });

  constructor(
    public auth: AuthService,
    public layout: LayoutService,
    public apiAccess: ApiAccessService,
    private router: Router
  ) {
    this.readTitle();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.menuOpen = false;
      this.readTitle();
    });
  }

  setEnv(env: Environment): void {
    this.apiAccess.setEnvironment(env);
  }

  /**
   * Back goes up the menu, not through browser history: an API page goes to its module's overview
   * (FOIS 02 → FOIS, Vahan 04 → Vahan, a docs page → API Documentation) and any top-level page goes to the
   * Dashboard. The parent is used only when it is a page in the user's menu.
   */
  back(): void {
    this.router.navigateByUrl(this.parentOf(this.router.url));
  }

  private parentOf(url: string): string {
    const path = url.split(/[?#]/)[0].replace(/^\/dashboard/, '');
    const parent = path.substring(0, path.lastIndexOf('/'));
    if (parent && this.menuHasPage(this.auth.navigation(), parent)) {
      return `/dashboard${parent}`;
    }
    return HOME;
  }

  private menuHasPage(nodes: MenuNode[], path: string): boolean {
    return nodes.some(n => n.path === path || this.menuHasPage(n.children ?? [], path));
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.menuOpen = false;
  }

  initials(): string {
    const name = this.auth.user()?.name || this.auth.user()?.username || 'U';
    return name.split(/\s+/).map(p => p.charAt(0)).join('').slice(0, 2).toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Title and section come from the deepest route's `data: { title, section }`. Read from the router's
   * state snapshot: during the first activation the child ActivatedRoutes have no snapshot yet.
   */
  private readTitle(): void {
    let r = this.router.routerState.snapshot.root;
    while (r.firstChild) {
      r = r.firstChild;
    }
    const data = r.data;
    const id = r.paramMap.get('id');
    const path = this.router.url.split(/[?#]/)[0];
    this.showBack = path !== '/dashboard' && path !== HOME;
    this.title = (data['title'] as string ?? '') + (id ? ` ${id}` : '');
    this.section = (data['section'] as string) ?? '';
  }
}
