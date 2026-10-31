import { Component, computed } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../../core/layout/layout.service';
import { InboxService } from '../../core/inbox/inbox.service';
import { MenuNode } from '../../core/api/rbac.models';
import { isModuleEnabled, menuPathToRoute, moduleForMenuCode } from '../../core/menu/menu-config';

interface NavItem {
  code: string;
  label: string;
  icon?: string;
  route: string | null;
  children: NavItem[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const SECTION_OF: Record<string, string> = {
  DASHBOARD: 'Overview',
  CATALOG: 'Developer',
  ACCESS: 'Developer',
  KEYS: 'Developer',
  USAGE: 'Developer',
  DOCS: 'Developer',
  PROFILE: 'Account'
};
const SECTION_ORDER = ['Overview', 'Data APIs', 'Developer', 'Account'];

/**
 * Sidebar built from the user's ulip-rbac menu (GET /me/navigation), so it follows the role.
 * Data modules are additionally limited by the build's menuModules.
 */
@Component({
  selector: 'app-sidenav',
  standalone: false,
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent {
  readonly sections = computed(() => this.buildSections(this.auth.navigation()));
  expanded = new Set<string>();
  url = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    public layout: LayoutService,
    private inbox: InboxService
  ) {
    this.url = this.router.url;
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.url = this.router.url.split('?')[0];
      this.layout.closeMobile();
      this.expandActive();
    });
    this.expandActive();
  }

  /** Pending counts on menu items: requests to review (approvers) and the user's own waiting requests. */
  badgeFor(code: string): number {
    if (code === 'ADMIN_APPROVALS') {
      return this.inbox.approvalsPending();
    }
    if (code === 'ACCESS') {
      return this.inbox.myPending();
    }
    return 0;
  }

  get user() {
    return this.auth.user;
  }

  toggle(item: NavItem): void {
    if (this.expanded.has(item.code)) {
      this.expanded.delete(item.code);
    } else {
      this.expanded.add(item.code);
    }
    if (item.route) {
      this.router.navigateByUrl(item.route);
    }
  }

  isActive(item: NavItem): boolean {
    return !!item.route && this.url === item.route;
  }

  isParentActive(item: NavItem): boolean {
    return item.children.some(c => this.isActive(c)) || this.isActive(item);
  }

  initials(): string {
    const name = this.user()?.name || this.user()?.username || 'U';
    return name.split(/\s+/).map(p => p.charAt(0)).join('').slice(0, 2).toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private expandActive(): void {
    for (const s of this.sections()) {
      for (const item of s.items) {
        if (item.children.length && this.isParentActive(item)) {
          this.expanded.add(item.code);
        }
      }
    }
  }

  private buildSections(nodes: MenuNode[]): NavSection[] {
    const sections = new Map<string, NavItem[]>();
    const add = (label: string, item: NavItem) => {
      sections.set(label, [...(sections.get(label) ?? []), item]);
    };
    for (const node of nodes) {
      const module = moduleForMenuCode(node.code);
      if (module && !isModuleEnabled(module)) {
        continue;
      }
      const item = this.toItem(node);
      if (module) {
        add('Data APIs', item);
      } else if (!node.path && item.children.length) {
        // A group without its own page (Administration) becomes its own section.
        sections.set(node.label, item.children);
      } else {
        add(SECTION_OF[node.code] ?? 'More', item);
      }
    }
    const ordered = [...sections.keys()].sort((a, b) => this.rank(a) - this.rank(b));
    return ordered.map(label => ({ label, items: sections.get(label)! }));
  }

  private rank(label: string): number {
    const i = SECTION_ORDER.indexOf(label);
    return i === -1 ? SECTION_ORDER.length + (label === 'More' ? 0 : 1) : i;
  }

  private toItem(node: MenuNode): NavItem {
    return {
      code: node.code,
      label: node.label,
      icon: node.icon,
      route: menuPathToRoute(node.path),
      children: (node.children ?? []).map(c => this.toItem(c))
    };
  }
}
