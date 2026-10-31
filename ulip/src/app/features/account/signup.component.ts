import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';

/** Same rule as ulip-rbac: 10-72 characters with upper-case, lower-case and a digit. */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,72}$/;
export const PASSWORD_HINT = 'At least 10 characters with upper-case, lower-case and a digit.';

export function matchPassword(field: string, confirm: string) {
  return (group: AbstractControl): ValidationErrors | null =>
    group.get(field)?.value === group.get(confirm)?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: false,
  styleUrls: ['../login/login.component.css'],
  template: `
    <div class="login-page">

      <div class="login-left">
        <div class="welcome-text">
          <div class="eyebrow">Gativra API Platform</div>
          <h2>Build on Gativra</h2>
          <div class="divider"></div>
          <p class="sub">Create a developer account, try the APIs in the sandbox with free credits, then request production access for your organisation.</p>
          <ul class="trust">
            <li><span class="dot"></span>Free sandbox credits on every account</li>
            <li><span class="dot"></span>Production access approved by an administrator</li>
            <li><span class="dot"></span>Reference docs with samples in four languages</li>
          </ul>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card wide">
          <div class="card-header">
            <h2>Create account</h2>
            <p>We'll e-mail you a code to verify your address.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="form-row">
              <div class="form-group">
                <label for="name">Full name <span class="required">*</span></label>
                <input id="name" formControlName="name" autocomplete="name" maxlength="150" [class.field-invalid]="bad('name')" />
                <span class="error-text" *ngIf="bad('name')">Name is required</span>
              </div>
              <div class="form-group">
                <label for="phone">Phone</label>
                <input id="phone" formControlName="phone" autocomplete="tel" maxlength="20" placeholder="Optional" [class.field-invalid]="bad('phone')" />
                <span class="error-text" *ngIf="bad('phone')">Enter a valid phone number</span>
              </div>
            </div>

            <div class="form-group">
              <label for="email">Work e-mail <span class="required">*</span></label>
              <input id="email" type="email" formControlName="email" autocomplete="email" maxlength="150" [class.field-invalid]="bad('email')" />
              <span class="error-text" *ngIf="bad('email')">Enter a valid e-mail address</span>
            </div>

            <div class="form-group">
              <label for="organisation">Organisation <span class="required">*</span></label>
              <input id="organisation" formControlName="organisation" autocomplete="organization" maxlength="200" [class.field-invalid]="bad('organisation')" />
              <span class="error-text" *ngIf="bad('organisation')">Organisation is required</span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="password">Password <span class="required">*</span></label>
                <input id="password" type="password" formControlName="password" autocomplete="new-password" maxlength="72" [class.field-invalid]="bad('password')" />
              </div>
              <div class="form-group">
                <label for="confirm">Confirm password <span class="required">*</span></label>
                <input id="confirm" type="password" formControlName="confirm" autocomplete="new-password" maxlength="72"
                       [class.field-invalid]="form.hasError('mismatch') && form.get('confirm')?.touched" />
              </div>
            </div>
            <div class="form-group" style="margin-top: -12px">
              <span class="hint" [class.error-text]="bad('password')">{{ hint }}</span>
              <span class="error-text" *ngIf="form.hasError('mismatch') && form.get('confirm')?.touched">Passwords do not match</span>
            </div>

            <div class="form-group">
              <label class="check-row">
                <input type="checkbox" formControlName="acceptTerms" />
                <span>I accept the terms of use and confirm the data I access will be used for the stated purpose.</span>
              </label>
              <span class="error-text" *ngIf="bad('acceptTerms')">Please accept the terms</span>
            </div>

            <div class="alert-error" *ngIf="error" role="alert"><app-icon name="alert" [size]="15"></app-icon> {{ error }}</div>

            <button type="submit" class="btn-login" [disabled]="loading">
              <span *ngIf="!loading">Create account</span>
              <span *ngIf="loading" class="spinner"></span>
            </button>
          </form>

          <p class="switch-auth">Already have an account? <a routerLink="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `
})
export class SignupComponent {
  readonly hint = PASSWORD_HINT;
  form: FormGroup;
  loading = false;
  error = '';

  constructor(fb: FormBuilder, private api: RbacApiService, private router: Router) {
    this.form = fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      phone: ['', [Validators.pattern(/^[0-9+\- ]{7,20}$/)]],
      email: ['', [Validators.required, Validators.email]],
      organisation: ['', [Validators.required, Validators.maxLength(200)]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirm: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: matchPassword('password', 'confirm') });
  }

  bad(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    this.loading = true;
    this.error = '';
    this.api.signup({
      name: v.name.trim(),
      email: v.email.trim(),
      organisation: v.organisation.trim(),
      phone: v.phone?.trim() || undefined,
      password: v.password,
      acceptTerms: true
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => this.router.navigate(['/verify-email'], { queryParams: { email: v.email.trim() } }),
      error: err => (this.error = errorMessage(err))
    });
  }
}
