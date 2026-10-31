import { ApplicationRef, Injectable, inject, signal } from '@angular/core';
import { scheduleRender } from '../../core/render';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  text: string;
}

export interface ConfirmRequest {
  title: string;
  text: string;
  confirmLabel: string;
  danger: boolean;
  /** Optional free-text input (e.g. a rejection reason). */
  inputLabel?: string;
  inputRequired?: boolean;
  resolve: (result: { ok: boolean; value: string }) => void;
}

/** Toasts and the confirm dialog, rendered once by <app-notify-host> in the shell. */
@Injectable({ providedIn: 'root' })
export class NotifyService {
  readonly toasts = signal<Toast[]>([]);
  readonly confirmRequest = signal<ConfirmRequest | null>(null);
  private readonly appRef = inject(ApplicationRef);
  private seq = 0;

  success(text: string): void {
    this.push('success', text);
  }

  error(text: string): void {
    this.push('error', text, 6000);
  }

  info(text: string): void {
    this.push('info', text);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  confirm(opts: {
    title: string; text: string; confirmLabel?: string; danger?: boolean; inputLabel?: string; inputRequired?: boolean;
  }): Promise<{ ok: boolean; value: string }> {
    return new Promise(resolve => {
      this.confirmRequest.set({
        title: opts.title,
        text: opts.text,
        confirmLabel: opts.confirmLabel ?? 'Confirm',
        danger: opts.danger ?? false,
        inputLabel: opts.inputLabel,
        inputRequired: opts.inputRequired,
        resolve: result => {
          this.confirmRequest.set(null);
          resolve(result);
          // Zoneless: whatever the caller changes after `await confirm()` must still render.
          setTimeout(() => scheduleRender(this.appRef));
        }
      });
    });
  }

  private push(kind: Toast['kind'], text: string, ms = 3800): void {
    const id = ++this.seq;
    this.toasts.update(list => [...list.slice(-3), { id, kind, text }]);
    setTimeout(() => this.dismiss(id), ms);
  }
}
