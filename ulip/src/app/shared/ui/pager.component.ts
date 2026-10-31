import { Component, EventEmitter, Input, Output } from '@angular/core';

/** "1–20 of 134" with previous/next, for the server-paged admin lists. */
@Component({
  selector: 'app-pager',
  standalone: false,
  template: `
    <div class="pager" *ngIf="total > 0">
      <span>{{ page * size + 1 }}–{{ min((page + 1) * size, total) }} of {{ total }}</span>
      <button type="button" class="btn btn-ghost btn-sm" [disabled]="page === 0" (click)="pageChange.emit(page - 1)" aria-label="Previous page">
        <app-icon name="chevron-left" [size]="16"></app-icon>
      </button>
      <button type="button" class="btn btn-ghost btn-sm" [disabled]="(page + 1) * size >= total" (click)="pageChange.emit(page + 1)" aria-label="Next page">
        <app-icon name="chevron-right" [size]="16"></app-icon>
      </button>
    </div>
  `,
  styles: [`.pager { display: flex; align-items: center; justify-content: flex-end; gap: 6px; padding: 12px 16px; font-size: 13px; color: var(--color-text-muted); border-top: 1px solid var(--color-border-subtle); }`]
})
export class PagerComponent {
  @Input() page = 0;
  @Input() size = 20;
  @Input() total = 0;
  @Output() pageChange = new EventEmitter<number>();

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
