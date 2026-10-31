import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { MenuNode } from '../api/rbac.models';
import { menuPathToRoute, moduleForMenuCode, isModuleEnabled } from './menu-config';

/**
 * Landing target for /dashboard: the first page in the user's role-based menu (the home page when the
 * role has it, otherwise the first data module this build and role allow).
 */
@Component({
  selector: 'app-menu-home',
  standalone: false,
  template: `
    <div class="no-access" *ngIf="empty">
      <h2>No modules assigned</h2>
      <p>Your role ({{ role }}) has no pages yet. Ask an administrator to grant access.</p>
    </div>
  `,
  styles: [`
    .no-access { max-width: 520px; margin: 80px auto; text-align: center; color: var(--color-text-muted); }
    .no-access h2 { color: var(--color-text); font-size: 20px; margin: 0 0 8px; }
  `]
})
export class MenuHomeComponent implements OnInit {
  empty = false;
  role = '';

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    const target = this.firstRoute(this.auth.navigation());
    if (target) {
      // Keeps ?denied=1 from PermissionGuard so the landing page can explain the redirect.
      this.router.navigate([target], { replaceUrl: true, queryParamsHandling: 'preserve' });
    } else {
      this.role = this.auth.user()?.role ?? '';
      this.empty = true;
    }
  }

  private firstRoute(nodes: MenuNode[]): string | null {
    for (const n of nodes) {
      const module = moduleForMenuCode(n.code);
      if (module && !isModuleEnabled(module)) {
        continue;
      }
      // Groups without a page (e.g. Administration) open their first child.
      const own = menuPathToRoute(n.path);
      const route = own ?? this.firstRoute(n.children ?? []);
      if (route) {
        return route;
      }
    }
    return null;
  }
}
