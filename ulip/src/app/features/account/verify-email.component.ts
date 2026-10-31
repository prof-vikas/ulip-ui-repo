import { Component, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { RbacApiService, errorMessage } from '../../core/api/rbac-api.service';
import { AuthService } from '../../core/auth/auth.service';

const RESEND_COOLDOWN_S = 60;

@Component({
  selector: 'app-verify-email',
  standalone: false,
  styleUrls: ['../login/login.component.css'],
  template: `
    <div class="login-page">
      <div class="login-right">
        <div class="login-card">
          <div class="card-header">
            <h2>Verify your e-mail</h2>
            <p>Enter the code we sent to <b>{{ form.value.email || 'your e-mail' }}</b>. It expires in 10 minutes.</p>
          </div>

          <div class="alert-success" *ngIf="notice" role="status">{{ notice }}</div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="form-group" *ngIf="!emailFromLink">
              <label for="email">E-mail <span class="required">*</span></label>
              <input id="email" type="email" formControlName="email" autocomplete="email" />
            </div>
            <div class="form-group">
              <label for="otp">Verification code <span class="required">*</span></label>
              <input id="otp" class="otp-input" formControlName="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="8"
                     placeholder="••••••" [class.field-invalid]="form.get('otp')?.invalid && form.get('otp')?.touched" />
            </div>

            <div class="alert-error" *ngIf="error" role="alert"><app-icon name="alert" [size]="15"></app-icon> {{ error }}</div>

            <button type="submit" class="btn-login" [disabled]="loading">
              <span *ngIf="!loading">Verify and continue</span>
              <span *ngIf="loading" class="spinner"></span>
            </button>
          </form>

          <p class="switch-auth">
            Didn't get it?
            <button type="button" class="link-btn" [disabled]="cooldown() > 0 || !form.value.email" (click)="resend()">
              {{ cooldown() > 0 ? 'Resend in ' + cooldown() + 's' : 'Resend code' }}
            </button>
            &nbsp;·&nbsp; <a routerLink="/signup">Change details</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class VerifyEmailComponent implements OnDestroy {
  form: FormGroup;
  emailFromLink = false;
  loading = false;
  error = '';
  notice = '';
  // signal: updated from a timer, which does not trigger rendering in this zoneless app
  readonly cooldown = signal(RESEND_COOLDOWN_S);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    fb: FormBuilder,
    route: ActivatedRoute,
    private api: RbacApiService,
    private auth: AuthService,
    private router: Router
  ) {
    const email = route.snapshot.queryParamMap.get('email') ?? '';
    this.emailFromLink = !!email;
    this.form = fb.group({
      email: [email, [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.pattern(/^\d{4,8}$/)]]
    });
    this.startCooldown();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    const { email, otp } = this.form.value;
    this.api.verifyEmail(email.trim(), otp.trim()).pipe(finalize(() => (this.loading = false))).subscribe({
      next: res => {
        this.auth.start(res);
        this.router.navigate(['/dashboard']);
      },
      error: err => (this.error = errorMessage(err, 'That code is not valid. Check it and try again.'))
    });
  }

  resend(): void {
    this.error = '';
    this.api.resendOtp(this.form.value.email.trim()).subscribe({
      next: res => {
        this.notice = res.message;
        this.startCooldown();
      },
      error: err => (this.error = errorMessage(err))
    });
  }

  private startCooldown(): void {
    clearInterval(this.timer);
    this.cooldown.set(RESEND_COOLDOWN_S);
    this.timer = setInterval(() => {
      this.cooldown.update(v => v - 1);
      if (this.cooldown() <= 0) {
        clearInterval(this.timer);
      }
    }, 1000);
  }
}
