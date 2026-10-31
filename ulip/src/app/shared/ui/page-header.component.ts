import { Component, Input } from '@angular/core';

/** Title block used at the top of every portal page; actions go in the projected slot. */
@Component({
  selector: 'app-page-header',
  standalone: false,
  template: `
    <header class="ph">
      <div class="ph-text">
        <div class="ph-eyebrow" *ngIf="eyebrow">{{ eyebrow }}</div>
        <h1 class="ph-title">{{ title }}</h1>
        <p class="ph-desc" *ngIf="description">{{ description }}</p>
      </div>
      <div class="ph-actions"><ng-content></ng-content></div>
    </header>
  `,
  styles: [`
    .ph { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .ph-eyebrow { font-size: 12px; color: var(--color-text-faint); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .ph-title { font-size: 22px; font-weight: 800; color: var(--color-text); margin: 0 0 6px; letter-spacing: -0.2px; }
    .ph-desc { font-size: 14px; color: var(--color-text-muted); margin: 0; max-width: 640px; line-height: 1.55; }
    .ph-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .ph-actions:empty { display: none; }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() eyebrow = '';
  @Input() description = '';
}
