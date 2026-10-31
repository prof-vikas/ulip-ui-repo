import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/** The landing page is for visitors; signed-in users go straight to their dashboard. */
@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    return this.auth.isLoggedIn() ? this.router.createUrlTree(['/dashboard']) : true;
  }
}
