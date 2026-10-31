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
