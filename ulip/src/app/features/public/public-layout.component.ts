import { Component, HostListener, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { CONTACT } from './public-content';

const TITLE = 'Gativra — Powering Smart Logistics';

/** Shell of the signed-out site: top navigation, page outlet and footer. */
@Component({
  selector: 'app-public-layout',
  standalone: false,
  template: `
    <header class="pub-header" [class.scrolled]="scrolled()">
      <div class="pub-wrap bar">
        <a class="logo" routerLink="/" aria-label="Gativra — home">
          <img class="light-only" src="brand/gativra-logo.svg" alt="Gativra — Powering Smart Logistics" />
          <img class="dark-only" src="brand/gativra-logo-dark.svg" alt="Gativra — Powering Smart Logistics" />
        </a>

        <nav class="links" [class.open]="menuOpen()" aria-label="Main">
          <a *ngFor="let l of nav" [routerLink]="l.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: l.exact }"
             (click)="menuOpen.set(false)">{{ l.label }}</a>
          <div class="mobile-actions">
            <ng-container *ngTemplateOutlet="actions"></ng-container>
          </div>
        </nav>

        <div class="right">
          <app-theme-toggle></app-theme-toggle>
          <div class="desk-actions"><ng-container *ngTemplateOutlet="actions"></ng-container></div>
          <button type="button" class="burger" (click)="menuOpen.set(!menuOpen())"
                  [attr.aria-expanded]="menuOpen()" aria-label="Menu">
            <app-icon [name]="menuOpen() ? 'x' : 'menu'" [size]="20"></app-icon>
          </button>
        </div>
      </div>
    </header>

    <ng-template #actions>
      <ng-container *ngIf="signedIn; else guest">
        <a class="btn btn-primary" routerLink="/dashboard" (click)="menuOpen.set(false)">
          Go to dashboard <app-icon name="arrow-right" [size]="15"></app-icon>
        </a>
      </ng-container>
      <ng-template #guest>
        <a class="btn btn-ghost" routerLink="/login" (click)="menuOpen.set(false)">Sign in</a>
        <a class="btn btn-primary" routerLink="/signup" (click)="menuOpen.set(false)">Get started</a>
      </ng-template>
    </ng-template>

    <main class="pub-main">
      <router-outlet></router-outlet>
    </main>

    <footer class="pub-footer">
      <div class="pub-wrap foot-grid">
        <div class="foot-brand">
          <img class="foot-logo" src="brand/gativra-logo-dark.svg" alt="Gativra — Powering Smart Logistics" />
          <p>The Gativra API Platform gives businesses secure, metered access to India's logistics data, with sandbox credits to start.</p>
          <p class="muted">A brand of Suraj Informatics Pvt. Ltd.</p>
        </div>
        <div>
          <h4>Platform</h4>
          <a routerLink="/catalog">APIs</a>
          <a routerLink="/docs">Documentation</a>
          <a routerLink="/signup">Create account</a>
          <a routerLink="/login">Sign in</a>
        </div>
        <div>
          <h4>Company</h4>
          <a routerLink="/about">About Gativra</a>
          <a [href]="contact.site" target="_blank" rel="noopener">gativra.com <app-icon name="external" [size]="12"></app-icon></a>
          <a href="https://surajinformatics.com" target="_blank" rel="noopener">Suraj Informatics <app-icon name="external" [size]="12"></app-icon></a>
        </div>
        <div>
          <h4>Contact</h4>
          <a [href]="'tel:' + contact.tollFree"><app-icon name="phone" [size]="13"></app-icon> {{ contact.tollFree }}</a>
          <a [href]="'tel:+912240309800'"><app-icon name="phone" [size]="13"></app-icon> {{ contact.phone }}</a>
          <span class="addr"><app-icon name="map-pin" [size]="13"></app-icon> {{ contact.address }}</span>
        </div>
      </div>
      <div class="pub-wrap foot-base">
        <span>© {{ year }} Suraj Informatics Pvt. Ltd. All rights reserved.</span>
        <span>Built in India</span>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; background: var(--color-bg); }
    .pub-wrap { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }
    .pub-header { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--color-bg) 82%, transparent);
                  backdrop-filter: saturate(1.4) blur(12px); -webkit-backdrop-filter: saturate(1.4) blur(12px);
                  border-bottom: 1px solid transparent; transition: border-color var(--transition-base), box-shadow var(--transition-base); }
    .pub-header.scrolled { border-bottom-color: var(--color-border); box-shadow: var(--shadow-sm); }
    .bar { display: flex; align-items: center; gap: 28px; height: 68px; }
    .logo { display: flex; align-items: center; flex-shrink: 0; }
    .logo img { height: 34px; width: auto; display: block; }
    .dark-only { display: none !important; }
    :host-context([data-theme='dark']) .light-only { display: none !important; }
    :host-context([data-theme='dark']) .dark-only { display: block !important; }
    .links { display: flex; align-items: center; gap: 4px; flex: 1; }
    .links > a { padding: 8px 12px; border-radius: var(--radius-sm); font-size: 14.5px; font-weight: 600; color: var(--color-text-muted);
                 text-decoration: none; transition: color var(--transition-base), background var(--transition-base); }
    .links > a:hover { color: var(--color-text); background: var(--color-surface-alt); }
    .links > a.active { color: var(--color-primary); }
    .right { display: flex; align-items: center; gap: 10px; }
    .desk-actions { display: flex; align-items: center; gap: 8px; }
    .mobile-actions { display: none; }
    .burger { display: none; width: 40px; height: 40px; border-radius: var(--radius-sm); border: 1px solid var(--color-border);
              background: var(--color-surface); color: var(--color-text); align-items: center; justify-content: center; cursor: pointer; }
    .btn app-icon { margin-left: 2px; }

    .pub-main { flex: 1; }

    .pub-footer { background: var(--brand-charcoal); color: #C9CBCF; }
    .foot-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1.3fr; gap: 32px; padding-top: 52px; padding-bottom: 36px; }
    .foot-logo { height: 34px; width: auto; margin-bottom: 14px; }
    .foot-brand p { margin: 0 0 10px; font-size: 13.5px; line-height: 1.6; max-width: 340px; }
    .foot-brand .muted { color: #8E9197; }
    .pub-footer h4 { margin: 4px 0 14px; color: #fff; font-size: 13px; letter-spacing: 0.6px; text-transform: uppercase; }
    .pub-footer a, .pub-footer .addr { display: flex; align-items: center; gap: 6px; color: #C9CBCF; text-decoration: none;
                                        font-size: 13.5px; margin-bottom: 10px; line-height: 1.45; }
    .pub-footer a:hover { color: var(--brand-orange); }
    .foot-base { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-top: 18px; padding-bottom: 22px;
                 border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 12.5px; color: #8E9197; }

    @media (max-width: 900px) {
      .bar { gap: 12px; }
      .desk-actions { display: none; }
      .burger { display: inline-flex; }
      .right { margin-left: auto; }
      .links { display: none; position: absolute; top: 68px; left: 0; right: 0; flex-direction: column; align-items: stretch; gap: 2px;
               padding: 12px 16px 18px; background: var(--color-surface); border-bottom: 1px solid var(--color-border); box-shadow: var(--shadow-lg); }
      .links.open { display: flex; animation: fadeInUp 0.18s ease both; }
      .links > a { padding: 12px; }
      .mobile-actions { display: flex; gap: 8px; margin-top: 10px; }
      .mobile-actions .btn { flex: 1; justify-content: center; }
      .foot-grid { grid-template-columns: 1fr 1fr; }
      .foot-brand { grid-column: 1 / -1; }
    }
    @media (max-width: 520px) {
      .pub-wrap { padding: 0 16px; }
      .logo img { height: 28px; }
      .foot-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PublicLayoutComponent {
  readonly nav = [
    { label: 'Home', path: '/', exact: true },
    { label: 'APIs', path: '/catalog', exact: false },
    { label: 'Documentation', path: '/docs', exact: false },
    { label: 'About', path: '/about', exact: false }
  ];
  readonly contact = CONTACT;
  readonly year = new Date().getFullYear();
  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);

  constructor(private auth: AuthService, router: Router) {
    router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.menuOpen.set(false);
      let route = router.routerState.snapshot.root;
      while (route.firstChild) {
        route = route.firstChild;
      }
      const title = route.data?.['title'];
      document.title = title ? `${title} · Gativra` : TITLE;
    });
  }

  get signedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }
}
