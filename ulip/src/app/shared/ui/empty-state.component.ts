import { Component, Input } from '@angular/core';

/** Placeholder for empty lists, loading and load errors. */
@Component({
  selector: 'app-empty-state',
  standalone: false,
  template: `
    <div class="es" [class.es-error]="error">
      <span class="es-spinner" *ngIf="loading"></span>
      <span class="es-icon" *ngIf="!loading"><app-icon [name]="error ? 'alert' : icon" [size]="22"></app-icon></span>
      <div class="es-title">{{ loading ? 'Loading…' : title }}</div>
      <div class="es-text" *ngIf="!loading && text">{{ text }}</div>
      <div class="es-actions"><ng-content></ng-content></div>
    </div>
  `,
  styles: [`
    .es { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 48px 24px; color: var(--color-text-muted); }
    .es-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
               background: var(--color-primary-light); color: var(--color-primary); margin-bottom: 4px; }
    .es-error .es-icon { background: var(--color-error-bg); color: var(--color-error); }
    .es-title { font-weight: 700; color: var(--color-text); font-size: 15px; }
    .es-text { font-size: 13.5px; max-width: 420px; line-height: 1.55; }
    .es-actions:not(:empty) { margin-top: 10px; }
    .es-spinner { width: 26px; height: 26px; border-radius: 50%; border: 3px solid var(--color-border);
                  border-top-color: var(--color-primary); animation: spin 0.8s linear infinite; margin-bottom: 6px; }
  `]
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() text = '';
  @Input() icon = 'inbox';
  @Input() loading = false;
  @Input() error = false;
}
