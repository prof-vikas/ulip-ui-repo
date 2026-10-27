import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-back-button',
  standalone: false,
  template: `
    <button type="button" class="back-btn" (click)="goBack()" aria-label="Go back">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M5 12l7 7M5 12l7-7"/>
      </svg>
      <span>Back</span>
    </button>
  `,
  styles: [`
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted);
      font-size: 13px;
      font-weight: 500;
      padding: 6px 10px 6px 4px;
      margin-bottom: 12px;
      border-radius: var(--radius-sm);
      transition: background var(--transition-base), color var(--transition-base), transform var(--transition-base);
    }
    .back-btn:hover {
      background: var(--color-surface-alt);
      color: var(--color-primary);
      transform: translateX(-2px);
    }
    .back-btn svg { flex-shrink: 0; }
  `]
})
export class BackButtonComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
