import { ApplicationRef, Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiAccessService } from '../api/api-access.service';
import { scheduleRender } from '../render';
import { environment } from '../../../environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private readonly rbacBase = (environment as { rbacApiUrl?: string }).rbacApiUrl ?? '/api/rbac/v1';

  constructor(
    private authService: AuthService,
    private apiAccess: ApiAccessService,
    private router: Router,
    private appRef: ApplicationRef
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    const isRbac = req.url.startsWith(this.rbacBase);
    // Public auth endpoints never need the token (and must not fail because of a stale one).
    const isPublicAuth = isRbac && req.url.startsWith(`${this.rbacBase}/auth/`);

    // Data API call while Sandbox is selected (top bar): same path on the sandbox server, sandbox token.
    // Never fall back to production silently — without a sandbox endpoint the call is refused.
    if (!isRbac && token && this.apiAccess.active() === 'SANDBOX') {
      if (!this.apiAccess.sandboxCallsEnabled) {
        scheduleRender(this.appRef);
        return throwError(() => new HttpErrorResponse({
          url: req.url,
          status: 503,
          statusText: 'Sandbox unavailable',
          error: { message: 'Sandbox is selected, but the sandbox endpoint is not available yet. Switch to Production in the top bar.' }
        }));
      }
      return this.apiAccess.sandboxTokenValue().pipe(
        switchMap(sandboxToken => next.handle(req.clone({
          url: this.toSandboxUrl(req.url),
          setHeaders: { Authorization: `Bearer ${sandboxToken}` }
        }))),
        finalize(() => this.afterDataCall())
      );
    }

    const outgoing = token && !isPublicAuth
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(outgoing).pipe(
      // Zoneless app: re-render after every response so components can set plain fields in subscribe().
      finalize(() => (isRbac ? scheduleRender(this.appRef) : this.afterDataCall())),
      catchError((err: HttpErrorResponse) => {
        // A rejected portal session (expired, user disabled) ends the login. Data APIs keep their
        // own error handling, since ulip-rest may also answer 401 for APIs the user is not mapped to.
        if (err.status === 401 && isRbac && !isPublicAuth && token) {
          this.authService.logout();
          this.apiAccess.clear();
          // Visitors on the public site stay where they are; only the dashboard needs a session
          // (AuthGuard also sends a rejected session to /login while entering the dashboard).
          if (this.router.url.startsWith('/dashboard')) {
            this.router.navigate(['/login'], { queryParams: { expired: 1 } });
          }
        }
        return throwError(() => err);
      })
    );
  }

  /** A data call may have used quota or credits: refresh the numbers shown above the page. */
  private afterDataCall(): void {
    this.apiAccess.refresh(true);
    scheduleRender(this.appRef);
  }

  private toSandboxUrl(url: string): string {
    const prodBase = environment.apiBaseUrl ?? '';
    const path = prodBase && url.startsWith(prodBase) ? url.slice(prodBase.length) : url;
    return `${this.apiAccess.sandboxBaseUrl}${path}`;
  }
}
