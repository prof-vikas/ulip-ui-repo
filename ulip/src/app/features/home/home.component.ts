import { Component, OnInit, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { RbacApiService } from '../../core/api/rbac-api.service';
import { AccountSummary, MenuNode } from '../../core/api/rbac.models';
import { isModuleEnabled, menuPathToRoute, moduleForMenuCode } from '../../core/menu/menu-config';

interface Shortcut {
  label: string;
  icon?: string;
  route: string;
  hint: string;
}

const MODULE_HINTS: Record<string, string> = {
  VAHAN: 'Vehicle registration details',
  SARATHI: 'Driving licence details',
  FASTAG: 'FASTag transactions and status',
  FOIS: 'Freight rake and wagon data',
  EWAYBILL: 'E-way bill lookup',
  ICEGATE: 'Customs shipping bills and BoE'
};

const TOOL_HINTS: Record<string, string> = {
  CATALOG: 'Browse APIs and request access',
  ACCESS: 'Track sandbox and production requests',
  KEYS: 'Create and rotate API keys',
  USAGE: 'Sandbox credits and usage history',
  ADMIN_APPROVALS: 'Review pending access requests',
  ADMIN_USERS: 'Roles and account status',
  ADMIN_ROLES: 'What each role can see and do',
  DOCS: 'Integration reference for each API'
};

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  readonly modules = computed(() => this.moduleShortcuts(this.auth.navigation()));
  readonly tools = computed(() => this.toolShortcuts(this.auth.navigation()));

  summary: AccountSummary | null = null;
  pendingApprovals: number | null = null;
  denied = false;
  greeting = '';

  constructor(public auth: AuthService, private api: RbacApiService, route: ActivatedRoute) {
    this.denied = route.snapshot.queryParamMap.has('denied');
    const h = new Date().getHours();
    this.greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  ngOnInit(): void {
    if (this.auth.hasAny(['ACCESS_REQUEST_CREATE', 'API_KEY_MANAGE', 'USAGE_VIEW_OWN'])) {
      this.api.accountSummary().subscribe({ next: s => (this.summary = s), error: () => (this.summary = null) });
    }
    if (this.auth.hasPermission('ACCESS_APPROVE')) {
      this.api.adminAccessRequests({ status: 'PENDING', page: 0, size: 1 })
        .subscribe({ next: p => (this.pendingApprovals = p.total), error: () => (this.pendingApprovals = null) });
    }
  }

  get user() {
    return this.auth.user;
  }

  get firstName(): string {
    const n = this.user()?.name || this.user()?.username || '';
    return n.split(/[\s@]/)[0];
  }

  get approvedApis(): number {
    return (this.summary?.apis ?? []).filter(a => a.sandboxStatus === 'APPROVED' || a.productionStatus === 'APPROVED').length;
  }

  get pendingRequests(): number {
    return (this.summary?.apis ?? []).filter(a => a.sandboxStatus === 'PENDING' || a.productionStatus === 'PENDING').length;
  }

  get sandboxCredits(): number {
    return (this.summary?.apis ?? []).reduce((sum, a) => sum + (a.sandboxCreditsLeft ?? 0), 0);
  }

  private moduleShortcuts(nodes: MenuNode[]): Shortcut[] {
    return nodes
      .filter(n => {
        const m = moduleForMenuCode(n.code);
        return !!m && isModuleEnabled(m);
      })
      .map(n => ({
        label: n.label,
        icon: n.icon,
        route: menuPathToRoute(n.path) ?? '/dashboard',
        hint: MODULE_HINTS[n.code] ?? ''
      }));
  }

  private toolShortcuts(nodes: MenuNode[]): Shortcut[] {
    const flat = nodes.flatMap(n => [n, ...(n.children ?? [])]);
    return flat
      .filter(n => TOOL_HINTS[n.code] && n.path)
      .map(n => ({ label: n.label, icon: n.icon, route: menuPathToRoute(n.path)!, hint: TOOL_HINTS[n.code] }));
  }
}
