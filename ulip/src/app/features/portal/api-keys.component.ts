import { Component, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { ApiKey, ApiKeyCreated, Environment } from '../../core/api/rbac.models';
import { NotifyService } from '../../shared/ui/notify.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-api-keys',
  standalone: false,
  template: `
    <div class="page">
      <app-page-header title="API Keys" eyebrow="Developer"
        description="Exchange a key for a 15-minute token at /oauth/token, then call Gativra APIs with it. Keys are shown only once.">
        <button class="btn btn-primary" (click)="openCreate()"><app-icon name="plus" [size]="16"></app-icon> Create key</button>
      </app-page-header>

      <div class="panel">
        <app-empty-state *ngIf="loading" [loading]="true"></app-empty-state>
        <app-empty-state *ngIf="!loading && error" [error]="true" title="Couldn't load your keys" [text]="error"></app-empty-state>
        <app-empty-state *ngIf="!loading && !error && !keys.length" icon="key" title="No API keys yet"
          text="You need an approved access request for an environment before you can create a key for it.">
          <button class="btn btn-primary" (click)="openCreate()">Create your first key</button>
        </app-empty-state>

        <div class="table-wrap" *ngIf="!loading && keys.length">
          <table class="table">
            <thead>
              <tr><th>Name</th><th>Environment</th><th>Key</th><th>Status</th><th>Last used</th><th>Expires</th><th></th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let k of keys">
                <td>
                  <div class="cell-main">{{ k.name }}</div>
                  <div class="cell-sub">Created {{ k.createdAt | date: 'd MMM y' }}<ng-container *ngIf="k.ipAllowlist"> · IPs: {{ k.ipAllowlist }}</ng-container></div>
                </td>
                <td><app-status-badge [value]="k.environment"></app-status-badge></td>
                <td class="mono">{{ k.prefix }}_••••••••</td>
                <td><app-status-badge [value]="k.status"></app-status-badge></td>
                <td class="muted">{{ k.lastUsedAt ? (k.lastUsedAt | date: 'd MMM, h:mm a') : 'Never' }}</td>
                <td class="muted">{{ k.expiresAt ? (k.expiresAt | date: 'd MMM y') : 'No expiry' }}</td>
                <td class="actions">
                  <ng-container *ngIf="k.status === 'ACTIVE'">
                    <button class="btn btn-ghost btn-sm" (click)="rotate(k)" title="Issue a new secret and revoke this one"><app-icon name="refresh" [size]="14"></app-icon> Rotate</button>
                    <button class="btn btn-ghost btn-sm danger" (click)="revoke(k)"><app-icon name="ban" [size]="14"></app-icon> Revoke</button>
                  </ng-container>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel panel-pad howto">
        <h3 class="panel-title">Calling the APIs</h3>
        <p class="panel-sub">1. Exchange your key for a token &nbsp; 2. Send the token to the Gativra API as a Bearer header.</p>
        <pre class="code"><code>curl -X POST {{ tokenUrl }} \\
  -H "X-API-Key: gativra_test_xxxxxxxx_..."

# → {{ '{' }} "access_token": "eyJ...", "token_type": "Bearer", "expires_in": 900 {{ '}' }}

curl &lt;API URL&gt; -H "Authorization: Bearer eyJ..."</code></pre>
      </div>
    </div>

    <app-dialog [open]="createOpen" title="Create API key" subtitle="Use separate keys per app or server so you can revoke them independently." (close)="createOpen = false">
      <label class="field">
        <span class="field-label">Name <span class="req">*</span></span>
        <input class="input" [(ngModel)]="form.name" maxlength="100" placeholder="e.g. Fleet backend (staging)" />
      </label>
      <div class="field">
        <span class="field-label">Environment <span class="req">*</span></span>
        <div class="tabs">
          <button type="button" class="tab" [class.active]="form.environment === 'SANDBOX'" (click)="form.environment = 'SANDBOX'">Sandbox</button>
          <button type="button" class="tab" [class.active]="form.environment === 'PRODUCTION'" (click)="form.environment = 'PRODUCTION'">Production</button>
        </div>
      </div>
      <label class="field">
        <span class="field-label">Allowed IP addresses</span>
        <input class="input" [(ngModel)]="form.ipAllowlist" maxlength="500" placeholder="Optional, comma-separated" />
        <span class="field-hint">Leave empty to allow any IP.</span>
      </label>
      <label class="field">
        <span class="field-label">Expires on</span>
        <input class="input" type="date" [(ngModel)]="form.expiresOn" [min]="tomorrow" />
      </label>
      <div dialog-footer>
        <button class="btn btn-ghost" (click)="createOpen = false">Cancel</button>
        <button class="btn btn-primary" [disabled]="!form.name.trim() || saving" (click)="create()">
          <span class="btn-spinner" *ngIf="saving"></span> Create key
        </button>
      </div>
    </app-dialog>

    <app-dialog [open]="!!created" title="Copy your API key" subtitle="This is the only time the full key is shown." (close)="created = null">
      <div class="alert alert-warning"><app-icon name="alert" [size]="16"></app-icon><span>{{ created?.warning || 'Store it in a secret manager now. It cannot be shown again.' }}</span></div>
      <div class="secret">
        <code class="mono">{{ created?.apiKey }}</code>
        <button class="btn btn-sm" (click)="copy(created?.apiKey)"><app-icon name="copy" [size]="14"></app-icon> {{ copied() ? 'Copied' : 'Copy' }}</button>
      </div>
      <div dialog-footer><button class="btn btn-primary" (click)="created = null">I've saved it</button></div>
    </app-dialog>
  `,
  styles: [`
    .howto { margin-top: 18px; }
    .code { margin: 14px 0 0; padding: 14px 16px; border-radius: var(--radius-sm); background: var(--color-surface-alt); border: 1px solid var(--color-border);
            overflow-x: auto; font-size: 12.5px; line-height: 1.6; color: var(--color-text); }
    .secret { display: flex; gap: 10px; align-items: center; padding: 12px; border-radius: var(--radius-sm); border: 1px dashed var(--color-primary);
              background: var(--color-primary-light); }
    .secret code { flex: 1; word-break: break-all; color: var(--color-text); }
    .danger { color: var(--color-error); }
  `]
})
export class ApiKeysComponent implements OnInit {
  keys: ApiKey[] = [];
  loading = true;
  error = '';
  saving = false;
  createOpen = false;
  created: ApiKeyCreated | null = null;
  readonly copied = signal(false);
  form = { name: '', environment: 'SANDBOX' as Environment, ipAllowlist: '', expiresOn: '' };

  readonly tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  readonly tokenUrl = `${(environment as { rbacApiUrl?: string }).rbacApiUrl ?? '/api/rbac/v1'}/oauth/token`;

  constructor(private api: RbacApiService, private notify: NotifyService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.apiKeys().pipe(finalize(() => (this.loading = false))).subscribe({
      next: k => (this.keys = k),
      error: err => (this.error = errorMessage(err))
    });
  }

  openCreate(): void {
    this.form = { name: '', environment: 'SANDBOX', ipAllowlist: '', expiresOn: '' };
    this.createOpen = true;
  }

  create(): void {
    this.saving = true;
    this.api.createApiKey({
      name: this.form.name.trim(),
      environment: this.form.environment,
      ipAllowlist: this.form.ipAllowlist.trim() || undefined,
      expiresAt: this.form.expiresOn ? `${this.form.expiresOn}T23:59:59` : undefined
    }).pipe(finalize(() => (this.saving = false))).subscribe({
      next: res => {
        this.createOpen = false;
        this.show(res);
      },
      error: err => this.notify.error(errorMessage(err))
    });
  }

  async rotate(k: ApiKey): Promise<void> {
    const { ok } = await this.notify.confirm({
      title: `Rotate “${k.name}”?`,
      text: 'A new secret is issued and the current one stops working immediately. Update your app with the new key.',
      confirmLabel: 'Rotate key'
    });
    if (ok) {
      this.api.rotateApiKey(k.id).subscribe({ next: res => this.show(res), error: err => this.notify.error(errorMessage(err)) });
    }
  }

  async revoke(k: ApiKey): Promise<void> {
    const { ok } = await this.notify.confirm({
      title: `Revoke “${k.name}”?`,
      text: 'Apps using this key will stop working immediately. This cannot be undone.',
      confirmLabel: 'Revoke key',
      danger: true
    });
    if (ok) {
      this.api.revokeApiKey(k.id).subscribe({
        next: () => {
          this.notify.success('Key revoked.');
          this.load();
        },
        error: err => this.notify.error(errorMessage(err))
      });
    }
  }

  copy(value: string | undefined): void {
    if (!value) {
      return;
    }
    navigator.clipboard?.writeText(value).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  private show(res: ApiKeyCreated): void {
    this.created = res;
    this.copied.set(false);
    this.load();
  }
}
