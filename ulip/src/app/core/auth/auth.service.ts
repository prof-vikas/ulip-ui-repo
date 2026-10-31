import { Injectable, computed, signal } from '@angular/core';
import { Observable, forkJoin, map, of, tap, catchError } from 'rxjs';
import { RbacApiService } from '../api/rbac-api.service';
import { LoginResponse, Me, MenuNode } from '../api/rbac.models';

/**
 * Login session backed by ulip-rbac. The token it issues is signed with ulip-rest's key, so the same
 * token is sent to the data APIs (Vahan, ICE GATE, ...) and to ulip-rbac.
 *
 * The user (role + permission codes) and the menu tree are kept in signals and in localStorage so a
 * page refresh renders immediately; loadSession() refreshes both from the server.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'ulip_token';
  private readonly USER_KEY = 'ulip_me';
  private readonly NAV_KEY = 'ulip_nav';

  readonly user = signal<Me | null>(this.read<Me>(this.USER_KEY));
  readonly navigation = signal<MenuNode[]>(this.read<MenuNode[]>(this.NAV_KEY) ?? []);
  readonly permissions = computed(() => new Set(this.user()?.permissions ?? []));

  constructor(private api: RbacApiService) {
    // Drop the pre-RBAC session format (username string) so it cannot be mistaken for a profile.
    localStorage.removeItem('ulip_user');
  }

  login(username: string, password: string): Observable<Me> {
    return this.api.login(username.trim(), password).pipe(
      tap(res => this.start(res)),
      map(res => res.user)
    );
  }

  /** Signs in with a token from verify-email (new account) or another login response. */
  start(res: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    this.setUser(res.user);
  }

  /** Refreshes the profile and menu. Navigation failure keeps the cached menu rather than failing login. */
  loadSession(): Observable<boolean> {
    if (!this.isLoggedIn()) {
      return of(false);
    }
    return forkJoin({
      me: this.api.me(),
      nav: this.api.navigation().pipe(catchError(() => of(this.navigation())))
    }).pipe(
      tap(({ me, nav }) => {
        this.setUser(me);
        this.navigation.set(nav);
        localStorage.setItem(this.NAV_KEY, JSON.stringify(nav));
      }),
      map(() => true)
    );
  }

  setUser(me: Me): void {
    this.user.set(me);
    localStorage.setItem(this.USER_KEY, JSON.stringify(me));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.NAV_KEY);
    this.user.set(null);
    this.navigation.set([]);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasPermission(code: string | undefined | null): boolean {
    return !code || this.permissions().has(code);
  }

  /**
   * True when the user's menu (which the server builds from role permissions and approved API access)
   * contains this page: '/dashboard/vahan/04' is allowed when the menu has '/vahan/04' or its parent.
   */
  menuAllows(url: string): boolean {
    const target = url.split('?')[0].replace(/^\/dashboard/, '') || '/';
    const walk = (nodes: MenuNode[]): boolean =>
      nodes.some(n => (!!n.path && (n.path === target || target.startsWith(n.path + '/') && !(n.children?.length)))
        || walk(n.children ?? []));
    return walk(this.navigation());
  }

  hasAny(codes: string[]): boolean {
    return codes.some(c => this.permissions().has(c));
  }

  /** Logged in = a token that has not expired yet (read from the JWT's exp claim). */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    const exp = this.expiry(token);
    if (exp !== null && exp * 1000 <= Date.now()) {
      this.logout();
      return false;
    }
    return true;
  }

  private expiry(token: string): number | null {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const exp = JSON.parse(atob(payload)).exp;
      return typeof exp === 'number' ? exp : null;
    } catch {
      return null;
    }
  }

  private read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}
