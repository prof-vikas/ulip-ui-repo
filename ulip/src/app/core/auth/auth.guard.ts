import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';
import { MenuModule, isModuleEnabled } from '../menu/menu-config';

/** Logged-in shell: requires a valid token and refreshes the profile and menu once per login. */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private loadedFor: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> | boolean | UrlTree {
    if (!this.authService.isLoggedIn()) {
      return this.router.createUrlTree(['/login']);
    }
    const token = this.authService.getToken();
    if (this.loadedFor === token) {
      return true;
    }
    return this.authService.loadSession().pipe(
      map(() => {
        this.loadedFor = token;
        return true;
      }),
      // 401 is handled by the interceptor (logout + redirect); anything else keeps the cached session.
      catchError(err => of(err?.status === 401 ? this.router.createUrlTree(['/login']) : true))
    );
  }
}

/**
 * Per-route access: `data: { permission: 'USER_MANAGE' }` and, for data modules,
 * `data: { module: 'vahan' }` (also limited by the build's menuModules).
 * Denied routes go to the landing page instead of showing an empty screen.
 */
@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const permission = route.data['permission'] as string | undefined;
    const module = route.data['module'] as MenuModule | undefined;
    // Data API pages also open for developers whose access request for that API was approved: the
    // server then includes the page in their menu even without the module permission.
    const granted = this.authService.hasPermission(permission) || (!!module && this.authService.menuAllows(state.url));
    const allowed = granted && (!module || isModuleEnabled(module));
    return allowed ? true : this.router.createUrlTree(['/dashboard'], { queryParams: { denied: 1 } });
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.canActivate(route, state);
  }
}
