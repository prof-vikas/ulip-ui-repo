import { Component } from '@angular/core';
import { NotifyService } from './notify.service';

@Component({
  selector: 'app-notify-host',
  standalone: false,
  template: `
    <div class="toasts" aria-live="polite">
      <div class="toast" *ngFor="let t of notify.toasts()" [attr.data-kind]="t.kind" (click)="notify.dismiss(t.id)">
        <app-icon [name]="t.kind === 'success' ? 'check-circle' : t.kind === 'error' ? 'alert' : 'info'"></app-icon>
        <span>{{ t.text }}</span>
      </div>
    </div>

    <ng-container *ngIf="notify.confirmRequest() as req">
      <app-dialog [open]="true" [title]="req.title" width="440px" (close)="req.resolve({ ok: false, value: '' })">
        <p class="confirm-text">{{ req.text }}</p>
        <label class="field" *ngIf="req.inputLabel">
          <span class="field-label">{{ req.inputLabel }}<span class="req" *ngIf="req.inputRequired"> *</span></span>
          <textarea class="input" rows="3" [(ngModel)]="value" maxlength="500"></textarea>
        </label>
        <div dialog-footer>
          <button type="button" class="btn btn-ghost" (click)="req.resolve({ ok: false, value: '' })">Cancel</button>
          <button type="button" class="btn" [class.btn-danger]="req.danger" [class.btn-primary]="!req.danger"
                  [disabled]="req.inputRequired && !value.trim()"
                  (click)="req.resolve({ ok: true, value: value.trim() }); value = ''">{{ req.confirmLabel }}</button>
        </div>
      </app-dialog>
    </ng-container>
  `,
  styles: [`
    .toasts { position: fixed; right: 20px; bottom: 20px; z-index: 1000; display: flex; flex-direction: column; gap: 8px; max-width: min(380px, calc(100vw - 40px)); }
    .toast { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: var(--radius-md); cursor: pointer;
             background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: var(--shadow-lg);
             font-size: 13.5px; color: var(--color-text); animation: fadeInUp 0.25s ease both; line-height: 1.45; }
    .toast[data-kind='success'] app-icon { color: var(--color-success); }
    .toast[data-kind='error'] { border-color: var(--color-error-border); }
    .toast[data-kind='error'] app-icon { color: var(--color-error); }
    .toast[data-kind='info'] app-icon { color: var(--color-primary); }
    .confirm-text { margin: 0 0 14px; color: var(--color-text-muted); font-size: 14px; line-height: 1.55; }
  `]
})
export class NotifyHostComponent {
  value = '';

  constructor(public notify: NotifyService) {}
}
