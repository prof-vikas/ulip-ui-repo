import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';

const LOGIN_TIMEOUT_MS = 20000;

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = this.loginForm.value;

    this.authService.login(payload)
      .pipe(
        timeout(LOGIN_TIMEOUT_MS),
        // Guarantees the spinner always clears, even on network errors,
        // CORS failures, or the request hanging — this was the source of
        // the "stuck on loading" bug on invalid credentials.
        finalize(() => { this.loading = false; })
      )
      .subscribe({
        next: (res) => {
          if (!res.error) {
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = res.message || 'Login failed. Please try again.';
          }
        },
        error: (err) => {
          if (err?.name === 'TimeoutError') {
            this.errorMessage = 'Request timed out. Please check your connection and try again.';
          } else if (err?.status === 0) {
            this.errorMessage = 'Unable to reach the server. Please check your connection.';
          } else {
            this.errorMessage = err?.error?.message || 'Invalid username or password.';
          }
        }
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
