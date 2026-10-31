import { Component, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { MenuNode } from '../api/rbac.models';
import { menuPathToRoute } from './menu-config';
import { MODULE_OVERVIEWS, ModuleOverviewInfo } from './module-overviews';

interface Card {
  code: string;
  title: string;
  desc: string;
  tag: string;
  example: string;
  route: string;
  docs?: string;
}

/**
 * Overview of a module with several APIs (FASTag, FOIS, and any future one): one card per API the user may
 * open, like the Vahan and ICE GATE overviews. Route data: { module, overviewPath: '/fastag' }.
 */
@Component({
  selector: 'app-module-overview',
  standalone: false,
  styleUrls: ['../../features/vahan/vahan-overview.component.css'],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="breadcrumb">{{ moduleLabel() }}</div>
        <h1 class="page-title">{{ info()?.title || moduleLabel() + ' APIs' }}</h1>
        <p class="page-desc">{{ info()?.desc || 'Select an API below to open it.' }}</p>
      </div>

      <div class="cards-grid" *ngIf="cards().length; else none">
        <div class="api-card card-available" *ngFor="let card of cards()">
          <div class="card-top">
            <div class="card-badge badge-live">Live</div>
            <div class="card-id">{{ card.title }}</div>
          </div>

          <p class="card-desc">{{ card.desc }}</p>

          <div class="card-input-info" *ngIf="card.tag">
            <span class="input-tag">{{ card.tag }}</span>
            <span class="input-example">{{ card.example }}</span>
          </div>

          <div class="card-footer footer-row">
            <a class="btn-open" [routerLink]="card.route">Open API &rarr;</a>
            <a class="docs-link" *ngIf="card.docs" [routerLink]="['/dashboard/docs', card.docs]">Docs</a>
          </div>
        </div>
      </div>

      <ng-template #none>
        <app-empty-state icon="lock" title="No APIs available" text="None of this module's APIs are open for your account. Request access in the API catalog."></app-empty-state>
      </ng-template>
    </div>
  `,
  styles: [`
    .footer-row { display: flex; align-items: center; justify-content: space-between; }
    .btn-open { text-decoration: none; }
    .docs-link { font-size: 12.5px; font-weight: 600; color: var(--color-text-muted); text-decoration: none; }
    .docs-link:hover { color: var(--color-primary); }
  `]
})
export class ModuleOverviewComponent {
  private readonly path = signal('');
  private readonly module = signal('');

  readonly node = computed(() => this.find(this.auth.navigation(), this.path()));
  /** Undefined for a module without descriptions yet: the page then uses generic text. */
  readonly info = computed<ModuleOverviewInfo | undefined>(() => MODULE_OVERVIEWS[this.module()]);
  readonly moduleLabel = computed(() => this.node()?.label ?? this.module().toUpperCase());
  readonly cards = computed<Card[]>(() => (this.node()?.children ?? [])
    .filter(c => !!c.path)
    .map(c => {
      const extra = this.info()?.cards[c.code];
      return {
        code: c.code,
        title: extra?.title ?? c.label,
        desc: extra?.desc ?? `Open ${c.label}.`,
        tag: extra?.tag ?? '',
        example: extra?.example ?? '',
        route: menuPathToRoute(c.path)!,
        docs: extra?.docs
      };
    }));

  constructor(route: ActivatedRoute, private auth: AuthService) {
    route.data.subscribe(d => {
      this.module.set(d['module'] ?? '');
      this.path.set(d['overviewPath'] ?? '');
    });
  }

  private find(nodes: MenuNode[], path: string): MenuNode | undefined {
    for (const n of nodes) {
      if (n.path === path) {
        return n;
      }
      const inner = this.find(n.children ?? [], path);
      if (inner) {
        return inner;
      }
    }
    return undefined;
  }
}
