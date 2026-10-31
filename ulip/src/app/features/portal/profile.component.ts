import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotifyService } from '../../shared/ui/notify.service';
import { PASSWORD_HINT, PASSWORD_PATTERN, matchPassword } from '../account/signup.component';

@Component({
  selector: 'app-profile',
  standalone: false,
  template: `
    <div class="page narrow">
      <app-page-header title="Profile" eyebrow="Account" description="Your details and sign-in password."></app-page-header>

      <div class="grid grid-2">
        <section class="panel">
          <div class="panel-head"><div><h3 class="panel-title">Account</h3><p class="panel-sub">Managed by your organisation's administrator.</p></div></div>
          <dl class="kv panel-pad">
            <dt>Username</dt><dd>{{ auth.user()?.username }}</dd>
            <dt>E-mail</dt>
            <dd>
              {{ auth.user()?.email || '—' }}
              <app-status-badge *ngIf="auth.user()?.emailVerified" value="ACTIVE" label="Verified"></app-status-badge>
            </dd>
            <dt>Organisation</dt><dd>{{ auth.user()?.organisation || '—' }}</dd>
            <dt>Role</dt><dd>{{ (auth.user()?.role || '') | titlecase }}</dd>
            <dt>Permissions</dt>
            <dd class="perms"><span class="perm" *ngFor="let p of auth.user()?.permissions">{{ p }}</span></dd>
          </dl>
        </section>

        <div class="stack">
          <form class="panel" [formGroup]="profile" (ngSubmit)="saveProfile()">
            <div class="panel-head"><h3 class="panel-title">Personal details</h3></div>
            <div class="panel-pad">
              <label class="field"><span class="field-label">Full name</span><input class="input" formControlName="name" maxlength="150" /></label>
              <label class="field">
                <span class="field-label">Phone</span><input class="input" formControlName="phone" maxlength="20" />
                <span class="field-error" *ngIf="profile.get('phone')?.invalid">Enter a valid phone number</span>
              </label>
              <label class="field"><span class="field-label">Designation</span><input class="input" formControlName="designation" maxlength="100" /></label>
              <button class="btn btn-primary" type="submit" [disabled]="profile.invalid || profile.pristine || savingProfile">
                <span class="btn-spinner" *ngIf="savingProfile"></span> Save changes
              </button>
            </div>
          </form>

          <form class="panel" [formGroup]="password" (ngSubmit)="changePassword()">
            <div class="panel-head"><h3 class="panel-title">Change password</h3></div>
            <div class="panel-pad">
              <label class="field"><span class="field-label">Current password</span><input class="input" type="password" formControlName="currentPassword" autocomplete="current-password" /></label>
              <label class="field">
                <span class="field-label">New password</span>
                <input class="input" type="password" formControlName="newPassword" autocomplete="new-password" maxlength="72" />
                <span class="field-hint" [class.field-error]="password.get('newPassword')?.invalid && password.get('newPassword')?.touched">{{ hint }}</span>
              </label>
              <label class="field">
                <span class="field-label">Confirm new password</span>
                <input class="input" type="password" formControlName="confirm" autocomplete="new-password" maxlength="72" />
                <span class="field-error" *ngIf="password.hasError('mismatch') && password.get('confirm')?.touched">Passwords do not match</span>
              </label>
              <button class="btn btn-primary" type="submit" [disabled]="password.invalid || savingPassword">
                <span class="btn-spinner" *ngIf="savingPassword"></span> Update password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .narrow { max-width: 1040px; }
    .stack { display: flex; flex-direction: column; gap: 16px; }
    .perms { display: flex; flex-wrap: wrap; gap: 6px; }
    .perm { font-size: 11px; font-family: ui-monospace, Menlo, Consolas, monospace; padding: 2px 8px; border-radius: var(--radius-pill);
            background: var(--color-surface-alt); border: 1px solid var(--color-border); color: var(--color-text-muted); }
    .grid-2 { align-items: start; }
  `]
})
export class ProfileComponent {
  readonly hint = PASSWORD_HINT;
  profile: FormGroup;
  password: FormGroup;
  savingProfile = false;
  savingPassword = false;

  constructor(fb: FormBuilder, public auth: AuthService, private api: RbacApiService, private notify: NotifyService) {
    const me = auth.user();
    this.profile = fb.group({
      name: [me?.name ?? '', [Validators.maxLength(150)]],
      phone: [me?.phone ?? '', [Validators.pattern(/^[0-9+\- ]{7,20}$/)]],
      designation: ['', [Validators.maxLength(100)]]
    });
    this.password = fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirm: ['', Validators.required]
    }, { validators: matchPassword('newPassword', 'confirm') });
  }

  saveProfile(): void {
    const v = this.profile.value;
    this.savingProfile = true;
    this.api.updateProfile({
      name: v.name?.trim() || undefined,
      phone: v.phone?.trim() || undefined,
      designation: v.designation?.trim() || undefined
    }).pipe(finalize(() => (this.savingProfile = false))).subscribe({
      next: me => {
        this.auth.setUser(me);
        this.profile.markAsPristine();
        this.notify.success('Profile saved.');
      },
      error: err => this.notify.error(errorMessage(err))
    });
  }

  changePassword(): void {
    const v = this.password.value;
    this.savingPassword = true;
    this.api.changePassword(v.currentPassword, v.newPassword).pipe(finalize(() => (this.savingPassword = false))).subscribe({
      next: res => {
        this.password.reset();
        this.notify.success(res.message || 'Password updated.');
      },
      error: err => this.notify.error(errorMessage(err))
    });
  }
}
