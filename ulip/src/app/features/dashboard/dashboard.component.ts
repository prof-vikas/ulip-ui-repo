import { Component, DestroyRef, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, pairwise, startWith } from 'rxjs';
import { InboxService } from '../../core/inbox/inbox.service';

const TITLE = 'Gativra — Powering Smart Logistics';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  /** The shell scrolls inside .main (not the window), so the router's own scroll restoration does not reach it. */
  @ViewChild('scroller', { static: true }) scroller!: ElementRef<HTMLElement>;

  constructor() {
    // Pending notifications: poll while the signed-in shell is open, and show the count in the browser tab.
    const inbox = inject(InboxService);
    inbox.start();
    inject(DestroyRef).onDestroy(() => {
      inbox.stop();
      document.title = TITLE;
    });
    effect(() => {
      const n = inbox.badge();
      document.title = n > 0 ? `(${n}) ${TITLE}` : TITLE;
    });

    const router = inject(Router);
    router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects.split(/[?#]/)[0]),
      startWith(router.url.split(/[?#]/)[0]),
      pairwise(),
      filter(([before, after]) => before !== after),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe(() => {
      // New page: start at the top without animating (smooth scrolling is kept for in-page jumps).
      this.scroller?.nativeElement.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    });
  }
}
