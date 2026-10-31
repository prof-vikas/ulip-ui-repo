import { environment } from '../../../environments/environment';

/**
 * Build-time menu configuration.
 *
 * Set `menuModules` in the environment file that your build uses:
 *
 *   menuModules: 'all'                        // Vahan, Sarathi, FASTag, FOIS, E-Way Bill, ICE GATE
 *   menuModules: ['icegate']                  // ICE GATE only
 *   menuModules: ['icegate', 'ewaybill']      // ICE GATE + E-Way Bill
 *
 * Entries are case-insensitive and tolerant of separators, so 'ice-gate',
 * 'ICE GATE' and 'icegate' all mean the same module.
 */
export type MenuModule = 'vahan' | 'sarathi' | 'fastag' | 'fois' | 'ewaybill' | 'icegate';

/** Order used both for rendering and for picking the landing page. */
export const ALL_MODULES: MenuModule[] = ['vahan', 'sarathi', 'fastag', 'fois', 'ewaybill', 'icegate'];

function normalize(value: unknown): string {
  return String(value).toLowerCase().replace(/[\s_-]/g, '');
}

/** Modules enabled by the current build, in the order they were configured. */
export function enabledModules(): MenuModule[] {
  const configured: unknown = (environment as { menuModules?: unknown }).menuModules;

  if (configured === undefined || configured === null) {
    return [...ALL_MODULES];
  }

  const requested = (Array.isArray(configured) ? configured : [configured])
    .map(normalize)
    .filter(Boolean);

  if (requested.length === 0 || requested.includes('all')) {
    return [...ALL_MODULES];
  }

  const ordered: MenuModule[] = [];
  for (const key of requested) {
    const match = ALL_MODULES.find(module => module === key);
    if (match && !ordered.includes(match)) {
      ordered.push(match);
    }
  }

  // Never render an empty sidebar because of a typo in the environment file.
  return ordered.length > 0 ? ordered : [...ALL_MODULES];
}

export function isModuleEnabled(module: MenuModule): boolean {
  return enabledModules().includes(module);
}

/** Landing module: the first module listed in `menuModules`. */
export function landingModule(): MenuModule {
  return enabledModules()[0];
}

/**
 * RBAC link: each data module is a ulip-rbac menu (code) guarded by a permission. The sidebar shows a
 * module only when the user's role grants it AND this build's menuModules includes it.
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
