import { Injectable, signal } from '@angular/core';
import { Observable, map, of, shareReplay, tap } from 'rxjs';
import { RbacApiService } from './rbac-api.service';
import { AccountSummary, ApiAccess, Environment } from './rbac.models';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

/**
 * What the user may call on each API page: approval per environment, production quota and sandbox
 * credits left (GET /me/account-summary), and which environment the page currently calls.
 *
 * Production calls use the login token (ulip-rest accepts it). Sandbox calls need a sandbox token
 * (POST /me/api-token) and go to `sandboxApiBaseUrl`; the JWT interceptor does the switch.
 */
const ENV_KEY = 'gativra_env';

@Injectable({ providedIn: 'root' })
export class ApiAccessService {
  readonly summary = signal<AccountSummary | null>(null);
  /**
   * Environment every data API page calls, chosen once in the top bar and remembered on this browser.
   * It is never switched automatically: a page that has no access in the chosen environment says so.
   */
  readonly active = signal<Environment>(this.readEnvironment());
  readonly sandboxBaseUrl: string = (environment as { sandboxApiBaseUrl?: string }).sandboxApiBaseUrl ?? '';

  private owner: string | null = null;
  private loadedAt = 0;
  private sandboxToken: { value: string; expiresAt: number } | null = null;
  private pendingToken$: Observable<string> | null = null;

  constructor(private api: RbacApiService, private auth: AuthService) {}

  get sandboxCallsEnabled(): boolean {
    return !!this.sandboxBaseUrl;
  }

  /** Loads the summary; cached for 20 s unless forced (e.g. after a call used up quota). */
  refresh(force = false): void {
    this.forgetOtherLogins();
    if (!this.auth.hasPermission('PROFILE_VIEW')) {
      return;
    }
    if (!force && Date.now() - this.loadedAt < 20_000) {
      return;
    }
    this.loadedAt = Date.now();
    this.api.accountSummary().subscribe({ next: s => this.summary.set(s), error: () => undefined });
  }

  /** Access entry for a portal page ('/sarathi', '/vahan/04'). */
  accessFor(portalPath: string): ApiAccess | undefined {
    return this.summary()?.apis.find(a => a.portalPath === portalPath);
  }

  sandboxApproved(a: ApiAccess | undefined): boolean {
    return a?.sandboxStatus === 'APPROVED';
  }

  /** Production works with an approved request, or a quota row assigned directly in ulip-rest. */
  productionAvailable(a: ApiAccess | undefined): boolean {
    return a?.productionStatus === 'APPROVED' || a?.productionQuotaAssigned != null;
  }

  setEnvironment(env: Environment): void {
    this.active.set(env);
    try {
      localStorage.setItem(ENV_KEY, env);
    } catch {
      // storage unavailable: the choice lasts for this tab only
    }
  }

  private readEnvironment(): Environment {
    try {
      return localStorage.getItem(ENV_KEY) === 'SANDBOX' ? 'SANDBOX' : 'PRODUCTION';
    } catch {
      return 'PRODUCTION';
    }
  }

  /** Cached sandbox token, renewed a minute before it expires. */
  sandboxTokenValue(): Observable<string> {
    this.forgetOtherLogins();
    if (this.sandboxToken && this.sandboxToken.expiresAt - 60_000 > Date.now()) {
      return of(this.sandboxToken.value);
    }
    if (!this.pendingToken$) {
      this.pendingToken$ = this.api.apiToken('SANDBOX').pipe(
        tap(t => {
          this.sandboxToken = { value: t.access_token, expiresAt: Date.now() + t.expires_in * 1000 };
          this.pendingToken$ = null;
        }),
        map(t => t.access_token),
        shareReplay(1)
      );
    }
    return this.pendingToken$;
  }

  clear(): void {
    this.summary.set(null);
    this.sandboxToken = null;
    this.pendingToken$ = null;
    this.loadedAt = 0;
  }

  /** Cached data belongs to one login; drop it when someone else signs in on this browser. */
  private forgetOtherLogins(): void {
    const login = this.auth.getToken();
    if (login !== this.owner) {
      this.clear();
      this.owner = login;
    }
  }
}
