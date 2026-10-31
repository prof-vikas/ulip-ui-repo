import { Injectable, effect, signal } from '@angular/core';

/** Sidebar state: collapsed to icons on desktop (remembered), off-canvas on small screens. */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly KEY = 'sipl_sidenav_collapsed';

  readonly collapsed = signal<boolean>(this.readCollapsed());
  readonly mobileOpen = signal(false);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(this.KEY, this.collapsed() ? '1' : '0');
      } catch {
        // storage unavailable: the choice just isn't remembered
      }
    });
  }

  toggleCollapsed(): void {
    this.collapsed.update(v => !v);
  }

  toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  private readCollapsed(): boolean {
    try {
      return localStorage.getItem(this.KEY) === '1';
    } catch {
      return false;
    }
  }
}
