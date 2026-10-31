import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { RbacApiService } from '../api/rbac-api.service';
import { NotificationItem, Notifications } from '../api/rbac.models';
import { AuthService } from '../auth/auth.service';

const POLL_MS = 60_000;
const MIN_GAP_MS = 10_000;

/**
 * Pending-notification state for the signed-in user (GET /me/notifications): requests to approve for
 * approvers, and the state of their own requests for requesters.
 *
 * The badge counts what needs attention: every request waiting for the user's decision, plus decisions on
 * the user's own requests that they have not opened the bell for yet. "Seen" is remembered per user on
 * this browser.
 */
@Injectable({ providedIn: 'root' })
export class InboxService implements OnDestroy {
  readonly data = signal<Notifications | null>(null);
  private readonly seen = signal<Set<string>>(new Set());

  readonly items = computed<NotificationItem[]>(() => this.data()?.items ?? []);
  readonly approvalsPending = computed(() => this.data()?.approvalsPending ?? 0);
  readonly myPending = computed(() => this.data()?.myPending ?? 0);
  readonly unseenDecisions = computed(() =>
    this.items().filter(i => i.kind === 'DECISION' && !this.seen().has(i.id)).length);
  readonly badge = computed(() => this.approvalsPending() + this.unseenDecisions());

  private timer?: ReturnType<typeof setInterval>;
  private routerSub?: Subscription;
  private lastLoad = 0;
  private owner: number | null = null;
  private readonly onFocus = () => this.refresh();

  constructor(private api: RbacApiService, private auth: AuthService, private router: Router) {}

  /** Called by the logged-in shell: polls while it is open. */
  start(): void {
    this.stop();
    this.refresh(true);
    this.timer = setInterval(() => this.refresh(true), POLL_MS);
    this.routerSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.refresh());
    window.addEventListener('focus', this.onFocus);
  }

  stop(): void {
    clearInterval(this.timer);
    this.routerSub?.unsubscribe();
    window.removeEventListener('focus', this.onFocus);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  /** Reloads now (force) or at most every 10 s (navigation, focus). */
  refresh(force = false): void {
    if (!this.auth.isLoggedIn()) {
      this.data.set(null);
      return;
    }
    if (!force && Date.now() - this.lastLoad < MIN_GAP_MS) {
      return;
    }
    this.lastLoad = Date.now();
    this.loadSeen();
    this.api.notifications().subscribe({ next: n => this.data.set(n), error: () => undefined });
  }

  isUnseenDecision(n: NotificationItem): boolean {
    return n.kind === 'DECISION' && !this.seen().has(n.id);
  }

  /** Opening the bell marks the current decisions as seen; approvals stay counted until decided. */
  markSeen(): void {
    const ids = new Set(this.seen());
    this.items().filter(i => i.kind === 'DECISION').forEach(i => ids.add(i.id));
    this.seen.set(ids);
    try {
      localStorage.setItem(this.seenKey(), JSON.stringify([...ids].slice(-200)));
    } catch {
      // storage unavailable: the badge just reappears after a reload
    }
  }

  private loadSeen(): void {
    const user = this.auth.user()?.userId ?? null;
    if (user === this.owner) {
      return;
    }
    this.owner = user;
    try {
      this.seen.set(new Set(JSON.parse(localStorage.getItem(this.seenKey()) ?? '[]')));
    } catch {
      this.seen.set(new Set());
    }
  }

  private seenKey(): string {
    return `gativra_seen_notifications_${this.auth.user()?.userId ?? 'anon'}`;
  }
}
