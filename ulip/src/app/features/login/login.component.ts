import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/api/rbac-api.service';

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
  infoMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    const q = route.snapshot.queryParamMap;
    if (q.get('expired')) {
      this.infoMessage = 'Your session has ended. Please sign in again.';
    } else if (q.get('reset')) {
      this.infoMessage = 'Password updated. Sign in with your new password.';
    }
    if (q.get('email')) {
      this.loginForm.patchValue({ userName: q.get('email') });
    }

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
    this.infoMessage = '';

    const { userName, password } = this.loginForm.value;

    this.authService.login(userName, password)
      .pipe(
        timeout(LOGIN_TIMEOUT_MS),
        // Guarantees the spinner always clears, even on network errors,
        // CORS failures, or the request hanging.
        finalize(() => { this.loading = false; })
      )
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          this.errorMessage = err?.status === 401
            ? 'Invalid username or password.'
            : errorMessage(err, 'Login failed. Please try again.');
        }
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
