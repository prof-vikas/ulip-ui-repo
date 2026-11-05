/** The data modules of the portal. Which ones a user sees comes from ulip-rbac (role permissions
 * and approved API access), never from the build. */
export type MenuModule = 'vahan' | 'sarathi' | 'fastag' | 'fois' | 'ewaybill' | 'icegate';

/** Order used for rendering. */
export const ALL_MODULES: MenuModule[] = ['vahan', 'sarathi', 'fastag', 'fois', 'ewaybill', 'icegate'];

/**
 * RBAC link: each data module is a ulip-rbac menu (code) guarded by a permission. The sidebar shows a
 * module when the server's menu for the user contains it.
 */
export const MODULE_MENU_CODES: Record<MenuModule, string> = {
  vahan: 'VAHAN',
  sarathi: 'SARATHI',
  fastag: 'FASTAG',
  fois: 'FOIS',
  ewaybill: 'EWAYBILL',
  icegate: 'ICEGATE'
};

export const MODULE_PERMISSIONS: Record<MenuModule, string> = {
  vahan: 'MODULE_VAHAN',
  sarathi: 'MODULE_SARATHI',
  fastag: 'MODULE_FASTAG',
  fois: 'MODULE_FOIS',
  ewaybill: 'MODULE_EWAYBILL',
  icegate: 'MODULE_ICEGATE'
};

/** The data module a ulip-rbac menu code belongs to, if any. */
export function moduleForMenuCode(code: string): MenuModule | undefined {
  return ALL_MODULES.find(m => MODULE_MENU_CODES[m] === code);
}

/**
 * ulip-rbac menu paths are relative to the logged-in shell: '/vahan/01' -> '/dashboard/vahan/01'.
 * The 'Dashboard' entry ('/dashboard') is the home page.
 */
export function menuPathToRoute(path: string | undefined | null): string | null {
  if (!path) {
    return null;
  }
  if (path === '/dashboard' || path === '/') {
    return '/dashboard/home';
  }
  return path.startsWith('/dashboard/') ? path : `/dashboard${path}`;
}
