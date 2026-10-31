import { ApplicationRef } from '@angular/core';

/**
 * The app runs zoneless (no zone.js), so plain fields set in HTTP callbacks, promises or timers do not
 * re-render by themselves. This marks the root views dirty, which schedules one change detection pass
 * for every (default-strategy) component. Safe to call often: the scheduler coalesces calls.
 */
export function scheduleRender(appRef: ApplicationRef): void {
  for (const c of appRef.components) {
    c.changeDetectorRef.markForCheck();
  }
}
