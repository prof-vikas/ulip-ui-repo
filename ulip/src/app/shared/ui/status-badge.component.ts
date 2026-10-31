import { Component, Input } from '@angular/core';

const TONES: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'primary'> = {
  APPROVED: 'success', ACTIVE: 'success', SUCCESS: 'success', LIVE: 'success',
  PENDING: 'warning',
  REJECTED: 'error', REVOKED: 'error', DISABLED: 'error', INACTIVE: 'error',
  CANCELLED: 'neutral', EXPIRED: 'neutral',
  SANDBOX: 'primary', PRODUCTION: 'success'
};

/** Pill for statuses and environments; the colour follows the value. */
@Component({
  selector: 'app-status-badge',
  standalone: false,
  template: `<span class="sb" [attr.data-tone]="tone">{{ label || (value | titlecase) }}</span>`,
  styles: [`
    .sb { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; padding: 3px 10px;
          border-radius: var(--radius-pill); border: 1px solid transparent; white-space: nowrap; letter-spacing: 0.2px; }
    .sb::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .sb[data-tone='success'] { color: var(--color-success); background: var(--color-success-bg); border-color: var(--color-success-border); }
    .sb[data-tone='warning'] { color: var(--color-warning); background: var(--color-warning-bg); border-color: var(--color-warning-border); }
    .sb[data-tone='error'] { color: var(--color-error); background: var(--color-error-bg); border-color: var(--color-error-border); }
    .sb[data-tone='primary'] { color: var(--color-primary); background: var(--color-primary-light); }
    .sb[data-tone='neutral'] { color: var(--color-text-muted); background: var(--color-surface-alt); border-color: var(--color-border); }
  `]
})
export class StatusBadgeComponent {
  @Input() value: string | undefined | null = '';
  @Input() label = '';

  get tone(): string {
    return TONES[(this.value ?? '').toUpperCase()] ?? 'neutral';
  }
}
