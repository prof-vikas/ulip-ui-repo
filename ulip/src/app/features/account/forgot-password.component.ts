import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { PASSWORD_HINT, PASSWORD_PATTERN, matchPassword } from './signup.component';

/** Two steps on one page: e-mail a code, then set a new password with it. */
@Component({
  selector: 'app-forgot-password',
  standalone: false,
  styleUrls: ['../login/login.component.css'],
  template: `
    <div class="login-page">
      <div class="login-right">
        <div class="login-card">
          <div class="card-header">
            <h2>{{ step === 1 ? 'Reset password' : 'Set a new password' }}</h2>
            <p *ngIf="step === 1">Enter your account e-mail and we'll send you a reset code.</p>
            <p *ngIf="step === 2">If <b>{{ emailForm.value.email }}</b> has an account, a code is on its way.</p>
          </div>

          <form *ngIf="step === 1" [formGroup]="emailForm" (ngSubmit)="sendCode()" novalidate>
            <div class="form-group">
              <label for="email">E-mail <span class="required">*</span></label>
              <input id="email" type="email" formControlName="email" autocomplete="email"
                     [class.field-invalid]="emailForm.invalid && emailForm.get('email')?.touched" />
            </div>
            <div class="alert-error" *ngIf="error" role="alert"><app-icon name="alert" [size]="15"></app-icon> {{ error }}</div>
            <button type="submit" class="btn-login" [disabled]="loading">
              <span *ngIf="!loading">Send reset code</span>
              <span *ngIf="loading" class="spinner"></span>
            </button>
          </form>

          <form *ngIf="step === 2" [formGroup]="resetForm" (ngSubmit)="reset()" novalidate>
            <div class="form-group">
              <label for="otp">Reset code <span class="required">*</span></label>
              <input id="otp" class="otp-input" formControlName="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="••••••" />
            </div>
            <div class="form-group">
              <label for="np">New password <span class="required">*</span></label>
              <input id="np" type="password" formControlName="newPassword" autocomplete="new-password" maxlength="72"
                     [class.field-invalid]="resetForm.get('newPassword')?.invalid && resetForm.get('newPassword')?.touched" />
              <span class="hint">{{ hint }}</span>
            </div>
            <div class="form-group">
              <label for="cp">Confirm new password <span class="required">*</span></label>
              <input id="cp" type="password" formControlName="confirm" autocomplete="new-password" maxlength="72" />
              <span class="error-text" *ngIf="resetForm.hasError('mismatch') && resetForm.get('confirm')?.touched">Passwords do not match</span>
            </div>
            <div class="alert-error" *ngIf="error" role="alert"><app-icon name="alert" [size]="15"></app-icon> {{ error }}</div>
            <button type="submit" class="btn-login" [disabled]="loading">
              <span *ngIf="!loading">Update password</span>
              <span *ngIf="loading" class="spinner"></span>
            </button>
            <p class="switch-auth"><button type="button" class="link-btn" (click)="step = 1; error = ''">Use a different e-mail</button></p>
          </form>

          <p class="switch-auth">Remembered it? <a routerLink="/login">Back to sign in</a></p>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  readonly hint = PASSWORD_HINT;
  step: 1 | 2 = 1;
  loading = false;
  error = '';
  emailForm: FormGroup;
  resetForm: FormGroup;

  constructor(fb: FormBuilder, private api: RbacApiService, private router: Router) {
    this.emailForm = fb.group({ email: ['', [Validators.required, Validators.email]] });
    this.resetForm = fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{4,8}$/)]],
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirm: ['', Validators.required]
    }, { validators: matchPassword('newPassword', 'confirm') });
  }

  sendCode(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    this.api.forgotPassword(this.emailForm.value.email.trim()).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => (this.step = 2),
      error: err => (this.error = errorMessage(err))
    });
  }

  reset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    const email = this.emailForm.value.email.trim();
    const { otp, newPassword } = this.resetForm.value;
    this.loading = true;
    this.error = '';
    this.api.resetPassword(email, otp.trim(), newPassword).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => this.router.navigate(['/login'], { queryParams: { reset: 1, email } }),
      error: err => (this.error = errorMessage(err, 'That code is not valid or has expired.'))
    });
  }
}
