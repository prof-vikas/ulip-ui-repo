import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { InboxService } from '../../core/inbox/inbox.service';
import { NotificationItem } from '../../core/api/rbac.models';
import { menuPathToRoute } from '../../core/menu/menu-config';

const TONE_ICON: Record<string, string> = {
  warning: 'inbox',
  success: 'check-circle',
  error: 'ban',
  info: 'clock'
};

/** Bell in the top bar: count of pending items and a list that links to where each is handled. */
@Component({
  selector: 'app-notification-bell',
  standalone: false,
  template: `
    <div class="bell-wrap" (click)="$event.stopPropagation()">
      <button type="button" class="bell" [class.has]="inbox.badge() > 0" (click)="toggle()"
              [attr.aria-label]="inbox.badge() ? inbox.badge() + ' pending notifications' : 'Notifications'"
              [attr.aria-expanded]="open" aria-haspopup="dialog" title="Notifications">
        <app-icon name="bell" [size]="18"></app-icon>
        <span class="badge" *ngIf="inbox.badge() > 0">{{ inbox.badge() > 99 ? '99+' : inbox.badge() }}</span>
      </button>

      <div class="panel" *ngIf="open" role="dialog" aria-label="Notifications">
        <div class="panel-head">
          <span class="ph-title">Notifications</span>
          <span class="ph-count" *ngIf="inbox.badge() > 0">{{ inbox.badge() }} pending</span>
        </div>

        <div class="list" *ngIf="inbox.items().length; else empty">
          <button type="button" class="item" *ngFor="let n of inbox.items()" [attr.data-tone]="n.tone" (click)="go(n)">
            <span class="item-icon"><app-icon [name]="icon(n)" [size]="16"></app-icon></span>
            <span class="item-body">
              <span class="item-title">{{ n.title }}</span>
              <span class="item-text" *ngIf="n.text">{{ n.text }}</span>
              <span class="item-time" *ngIf="n.createdAt || isNew(n)">
                <span class="new" *ngIf="isNew(n)">New</span>
                <ng-container *ngIf="n.createdAt">{{ n.kind === 'APPROVAL' ? 'Oldest waiting since ' : '' }}{{ ago(n.createdAt!) }}</ng-container>
              </span>
            </span>
            <app-icon class="item-go" name="chevron-right" [size]="14"></app-icon>
          </button>
        </div>

        <ng-template #empty>
          <div class="empty">
            <span class="empty-icon"><app-icon name="check-circle" [size]="22"></app-icon></span>
            <span class="empty-title">You're all caught up</span>
            <span class="empty-text">Approvals and updates on your requests show up here.</span>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .bell-wrap { position: relative; }
    .bell { position: relative; width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--color-border);
            background: var(--color-surface); color: var(--color-text-muted); display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: color var(--transition-base), border-color var(--transition-base); }
    .bell:hover { color: var(--color-primary); border-color: var(--color-primary); }
    .bell.has { color: var(--color-text); }
    .badge { position: absolute; top: -5px; right: -6px; min-width: 19px; height: 19px; padding: 0 5px; border-radius: 10px;
             background: var(--brand-orange); color: #fff; font-size: 11px; font-weight: 800; line-height: 19px; text-align: center;
             border: 2px solid var(--color-bg); box-sizing: content-box; animation: pop 0.25s ease both; }
    @keyframes pop { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .panel { position: absolute; right: 0; top: calc(100% + 10px); width: min(380px, calc(100vw - 32px)); max-height: 70vh; display: flex;
             flex-direction: column; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md);
             box-shadow: var(--shadow-lg); z-index: 60; animation: fadeInUp 0.15s ease both; overflow: hidden; }
    .panel-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--color-border-subtle); }
    .ph-title { font-weight: 700; font-size: 14px; color: var(--color-text); }
    .ph-count { font-size: 12px; font-weight: 600; color: var(--brand-orange); }
    .list { overflow-y: auto; overscroll-behavior: contain; padding: 6px; }
    .item { display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 10px; border: none; background: none; text-align: left;
            border-radius: var(--radius-sm); cursor: pointer; font: inherit; color: var(--color-text); }
    .item:hover { background: var(--color-surface-alt); }
    .item-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                 background: var(--color-surface-alt); color: var(--color-text-muted); }
    .item[data-tone='warning'] .item-icon { background: var(--color-warning-bg); color: var(--color-warning); }
    .item[data-tone='success'] .item-icon { background: var(--color-success-bg); color: var(--color-success); }
    .item[data-tone='error'] .item-icon { background: var(--color-error-bg); color: var(--color-error); }
    .item[data-tone='info'] .item-icon { background: var(--color-primary-light); color: var(--color-primary); }
    .item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .item-title { font-size: 13.5px; font-weight: 600; line-height: 1.35; }
    .item-text { font-size: 12.5px; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .item-time { font-size: 11.5px; color: var(--color-text-faint); }
    .item-go { color: var(--color-text-faint); margin-top: 8px; }
    .new { margin-right: 6px; font-size: 10px; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase; color: var(--brand-orange);
           background: var(--color-primary-light); padding: 1px 6px; border-radius: var(--radius-pill); vertical-align: middle; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 28px 18px; text-align: center; }
    .empty-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
                  background: var(--color-success-bg); color: var(--color-success); }
    .empty-title { font-weight: 700; color: var(--color-text); font-size: 14px; }
    .empty-text { font-size: 12.5px; color: var(--color-text-muted); }
  `]
})
export class NotificationBellComponent {
  open = false;
  /** Decisions that were unseen when the panel opened, so they keep their "New" label while it is open. */
  private freshIds = new Set<string>();

  constructor(public inbox: InboxService, private router: Router) {}

  @HostListener('document:click')
  close(): void {
    this.open = false;
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open) {
      this.inbox.refresh(true);
      this.freshIds = new Set(this.inbox.items().filter(i => this.inbox.isUnseenDecision(i)).map(i => i.id));
      this.inbox.markSeen();
    }
  }

  isNew(n: NotificationItem): boolean {
    return this.freshIds.has(n.id);
  }

  icon(n: NotificationItem): string {
    return TONE_ICON[n.tone] ?? 'bell';
  }

  go(n: NotificationItem): void {
    this.open = false;
    if (n.link) {
      this.router.navigateByUrl(menuPathToRoute(n.link) ?? '/dashboard');
    }
  }

  ago(iso: string): string {
    const t = Date.parse(iso);
    if (isNaN(t)) {
      return '';
    }
    const s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 60) return 'just now';
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} h ago`;
    const d = Math.round(h / 24);
    return d === 1 ? 'yesterday' : `${d} days ago`;
  }
}
