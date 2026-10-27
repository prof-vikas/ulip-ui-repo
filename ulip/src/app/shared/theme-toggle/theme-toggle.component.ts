import { Component } from '@angular/core';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: false,
  template: `
    <button
      type="button"
      class="theme-toggle"
      [class.is-dark]="themeService.theme() === 'dark'"
      (click)="themeService.toggle()"
      [attr.aria-label]="themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      title="Toggle theme"
    >
      <span class="theme-toggle-track">
        <span class="theme-toggle-thumb">
          <svg *ngIf="themeService.theme() === 'dark'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <svg *ngIf="themeService.theme() === 'light'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
        </span>
      </span>
    </button>
  `,
  styles: [`
    .theme-toggle {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .theme-toggle-track {
      display: flex;
      align-items: center;
      width: 44px;
      height: 24px;
      border-radius: 999px;
      background: var(--color-surface-alt);
      border: 1px solid var(--color-border);
      padding: 2px;
      transition: background var(--transition-base), border-color var(--transition-base);
    }
    .theme-toggle.is-dark .theme-toggle-track {
      background: var(--color-primary-light);
      border-color: var(--color-primary);
    }
    .theme-toggle-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--color-surface);
      color: var(--color-primary);
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform var(--transition-base), background var(--transition-base), color var(--transition-base);
    }
    .theme-toggle.is-dark .theme-toggle-thumb {
      transform: translateX(20px);
      background: var(--color-primary);
      color: var(--color-primary-contrast);
    }
  `]
})
export class ThemeToggleComponent {
  constructor(public themeService: ThemeService) {}
}
