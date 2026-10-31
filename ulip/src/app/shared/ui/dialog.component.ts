import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

/**
 * Modal dialog (`variant="modal"`) or slide-in side panel (`variant="drawer"`).
 * Content is projected; put buttons in an element with the `dialog-footer` attribute.
 */
@Component({
  selector: 'app-dialog',
  standalone: false,
  template: `
    <div class="dlg-backdrop" *ngIf="open" (click)="close.emit()"></div>
    <section class="dlg" *ngIf="open" [class.dlg-drawer]="variant === 'drawer'" [style.--dlg-width]="width"
             role="dialog" aria-modal="true" [attr.aria-label]="title">
      <header class="dlg-head">
        <div>
          <h2>{{ title }}</h2>
          <p *ngIf="subtitle">{{ subtitle }}</p>
        </div>
        <button type="button" class="dlg-x" (click)="close.emit()" aria-label="Close"><app-icon name="x"></app-icon></button>
      </header>
      <div class="dlg-body"><ng-content></ng-content></div>
      <footer class="dlg-foot"><ng-content select="[dialog-footer]"></ng-content></footer>
    </section>
  `,
  styles: [`
    .dlg-backdrop { position: fixed; inset: 0; background: rgba(10, 14, 28, 0.45); backdrop-filter: blur(2px);
                    z-index: 900; animation: fadeIn 0.15s ease both; }
    .dlg { position: fixed; z-index: 901; left: 50%; top: 50%; transform: translate(-50%, -50%);
           width: min(var(--dlg-width, 520px), calc(100vw - 32px)); max-height: calc(100vh - 48px);
           display: flex; flex-direction: column; background: var(--color-surface); border: 1px solid var(--color-border);
           border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); animation: dlgIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) both; }
    .dlg-drawer { left: auto; right: 0; top: 0; transform: none; height: 100vh; max-height: 100vh;
                  width: min(var(--dlg-width, 480px), 100vw); border-radius: var(--radius-lg) 0 0 var(--radius-lg);
                  animation: drawerIn 0.22s cubic-bezier(0.4, 0, 0.2, 1) both; }
    .dlg-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 20px 22px 14px;
                border-bottom: 1px solid var(--color-border-subtle); }
    .dlg-head h2 { margin: 0; font-size: 17px; font-weight: 800; color: var(--color-text); }
    .dlg-head p { margin: 4px 0 0; font-size: 13px; color: var(--color-text-muted); }
    .dlg-x { background: none; border: none; color: var(--color-text-faint); cursor: pointer; padding: 6px; border-radius: var(--radius-sm); display: flex; }
    .dlg-x:hover { background: var(--color-surface-alt); color: var(--color-text); }
    .dlg-body { padding: 18px 22px; overflow-y: auto; flex: 1; }
    .dlg-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 22px; border-top: 1px solid var(--color-border-subtle); }
    .dlg-foot:empty { display: none; }
    @keyframes dlgIn { from { opacity: 0; transform: translate(-50%, -46%); } to { opacity: 1; transform: translate(-50%, -50%); } }
    @keyframes drawerIn { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
  `]
})
export class DialogComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() variant: 'modal' | 'drawer' = 'modal';
  @Input() width = '';
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.close.emit();
    }
  }
}
