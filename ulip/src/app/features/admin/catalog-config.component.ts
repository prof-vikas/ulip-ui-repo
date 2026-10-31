import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { CatalogConfig } from '../../core/api/rbac.models';
import { NotifyService } from '../../shared/ui/notify.service';

@Component({
  selector: 'app-catalog-config',
  standalone: false,
  template: `
    <div class="page">
      <app-page-header title="API Catalog Config" eyebrow="Administration"
        description="Every Gativra API has a row here. Publish it to show it in the developer catalog and set its sandbox and production defaults.">
      </app-page-header>

      <div class="panel">
        <div class="panel-head">
          <label class="input-search search">
            <app-icon name="search" [size]="16"></app-icon>
            <input class="input" placeholder="Search APIs" [(ngModel)]="search" />
          </label>
          <label class="check"><input type="checkbox" [(ngModel)]="onlyPublic" /> Published only</label>
        </div>

        <app-empty-state *ngIf="loading" [loading]="true"></app-empty-state>
        <app-empty-state *ngIf="!loading && error" [error]="true" title="Couldn't load the catalog" [text]="error"></app-empty-state>
        <app-empty-state *ngIf="!loading && !error && !filtered.length" icon="apps" title="No APIs match"></app-empty-state>

        <div class="table-wrap" *ngIf="!loading && filtered.length">
          <table class="table">
            <thead>
              <tr><th>API</th><th>Published</th><th>Sandbox</th><th class="num">Free credits</th><th class="num">Cost/call</th><th class="num">Prod quota</th><th></th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filtered">
                <td><div class="cell-main">{{ c.displayName }}</div><div class="cell-sub">#{{ c.apiId }}<ng-container *ngIf="c.category"> · {{ c.category }}</ng-container></div></td>
                <td>
                  <label class="switch" [title]="c.publicApi ? 'Unpublish' : 'Publish'">
                    <input type="checkbox" [checked]="c.publicApi" (change)="quickToggle(c)" />
                    <span></span>
                  </label>
                </td>
                <td><app-status-badge [value]="c.sandboxEnabled ? (c.sandboxAutoApprove ? 'ACTIVE' : 'PENDING') : 'INACTIVE'"
                      [label]="c.sandboxEnabled ? (c.sandboxAutoApprove ? 'Auto-approve' : 'Manual') : 'Off'"></app-status-badge></td>
                <td class="num">{{ c.sandboxDefaultCredits | number }}</td>
                <td class="num">{{ c.creditCost }}</td>
                <td class="num">{{ c.prodDefaultQuota | number }}</td>
                <td class="actions"><button class="btn btn-ghost btn-sm" (click)="edit(c)"><app-icon name="edit" [size]="14"></app-icon> Edit</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <app-dialog variant="drawer" [open]="!!form" [title]="form?.displayName || 'Edit API'" [subtitle]="'API #' + form?.apiId" (close)="form = null" width="520px">
      <ng-container *ngIf="form as f">
        <label class="field"><span class="field-label">Display name</span><input class="input" [(ngModel)]="f.displayName" maxlength="150" /></label>
        <label class="field"><span class="field-label">Category</span><input class="input" [(ngModel)]="f.category" maxlength="60" placeholder="e.g. Vehicle, Customs" /></label>
        <label class="field"><span class="field-label">Description</span><textarea class="input" rows="4" [(ngModel)]="f.description" maxlength="4000"></textarea></label>
        <label class="field">
          <span class="field-label">Docs URL</span>
          <input class="input" [(ngModel)]="f.docsUrl" maxlength="300" placeholder="https://… or /docs/sarathi" />
          <span class="field-hint">A path starting with / opens the portal's built-in reference page.</span>
        </label>
        <label class="field">
          <span class="field-label">Portal page</span>
          <input class="input mono" [(ngModel)]="f.portalPath" maxlength="200" placeholder="/sarathi" />
          <span class="field-hint">Page that calls this API. Developers approved for it see this page in their menu.</span>
        </label>
        <label class="check"><input type="checkbox" [(ngModel)]="f.publicApi" /> Published in the developer catalog</label>

        <h4 class="sub-h">Sandbox</h4>
        <label class="check"><input type="checkbox" [(ngModel)]="f.sandboxEnabled" /> Sandbox available</label>
        <label class="check"><input type="checkbox" [(ngModel)]="f.sandboxAutoApprove" [disabled]="!f.sandboxEnabled" /> Approve sandbox requests automatically</label>
        <div class="grid grid-2 tight">
          <label class="field"><span class="field-label">Free credits</span><input class="input" type="number" min="0" [(ngModel)]="f.sandboxDefaultCredits" /></label>
          <label class="field"><span class="field-label">Credits per call</span><input class="input" type="number" min="1" [(ngModel)]="f.creditCost" /></label>
        </div>

        <h4 class="sub-h">Production</h4>
        <label class="check"><input type="checkbox" [(ngModel)]="f.requiresProdApproval" /> Production access needs admin approval</label>
        <div class="grid grid-2 tight">
          <label class="field"><span class="field-label">Default quota</span><input class="input" type="number" min="0" [(ngModel)]="f.prodDefaultQuota" /></label>
          <label class="field"><span class="field-label">Sort order</span><input class="input" type="number" [(ngModel)]="f.sortOrder" /></label>
        </div>
      </ng-container>
      <div dialog-footer>
        <button class="btn btn-ghost" (click)="form = null">Cancel</button>
        <button class="btn btn-primary" [disabled]="saving" (click)="save()"><span class="btn-spinner" *ngIf="saving"></span> Save</button>
      </div>
    </app-dialog>
  `,
  styles: [`
    .search { flex: 1; max-width: 380px; }
    .sub-h { margin: 22px 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-faint); }
    .check { margin-bottom: 10px; }
    .tight { gap: 12px; margin-top: 4px; }
    .switch { position: relative; display: inline-block; width: 38px; height: 22px; cursor: pointer; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .switch span { position: absolute; inset: 0; border-radius: 22px; background: var(--color-border); transition: background var(--transition-base); }
    .switch span::after { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; top: 3px; border-radius: 50%; background: #fff;
                          box-shadow: var(--shadow-sm); transition: transform var(--transition-base); }
    .switch input:checked + span { background: var(--color-primary); }
    .switch input:checked + span::after { transform: translateX(16px); }
    .switch input:focus-visible + span { outline: 2px solid var(--color-primary); outline-offset: 2px; }
  `]
})
export class CatalogConfigComponent implements OnInit {
  rows: CatalogConfig[] = [];
  search = '';
  onlyPublic = false;
  loading = true;
  saving = false;
  error = '';
  form: CatalogConfig | null = null;

  constructor(private api: RbacApiService, private notify: NotifyService) {}

  ngOnInit(): void {
    this.api.catalogConfig().pipe(finalize(() => (this.loading = false))).subscribe({
      next: r => (this.rows = r),
      error: err => (this.error = errorMessage(err))
    });
  }

  get filtered(): CatalogConfig[] {
    const q = this.search.trim().toLowerCase();
    return this.rows.filter(c =>
      (!this.onlyPublic || c.publicApi) &&
      (!q || `${c.displayName} ${c.category ?? ''} ${c.apiId}`.toLowerCase().includes(q)));
  }

  edit(c: CatalogConfig): void {
    this.form = { ...c };
  }

  quickToggle(c: CatalogConfig): void {
    const publicApi = !c.publicApi;
    this.api.updateCatalogConfig(c.apiId, { publicApi }).subscribe({
      next: updated => {
        Object.assign(c, updated);
        this.notify.success(`${c.displayName} ${publicApi ? 'published' : 'unpublished'}.`);
      },
      error: err => this.notify.error(errorMessage(err))
    });
  }

  save(): void {
    const f = this.form;
    if (!f) {
      return;
    }
    this.saving = true;
    const { apiId, updatedAt, ...body } = f;
    this.api.updateCatalogConfig(apiId, body).pipe(finalize(() => (this.saving = false))).subscribe({
      next: updated => {
        const row = this.rows.find(r => r.apiId === apiId);
        if (row) {
          Object.assign(row, updated);
        }
        this.form = null;
        this.notify.success('Catalog entry saved.');
      },
      error: err => this.notify.error(errorMessage(err))
    });
  }
}
