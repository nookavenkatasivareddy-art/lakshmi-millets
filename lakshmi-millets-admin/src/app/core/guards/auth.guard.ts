import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  CanMatch,
  Route,
  UrlSegment,
  Router,
  UrlTree
} from '@angular/router';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanMatch {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  private checkAuth(): boolean | UrlTree {

    const token = this.auth.getToken();
    const user = this.auth.currentUser;

    // No login
    if (!token) {
      return this.router.parseUrl('/admin/login');
    }

    // Logged in, but NOT an admin
    if (!user || user.role !== 'admin') {
      this.auth.logout();
      return this.router.parseUrl('/admin/login');
    }

    // Valid admin session
    return true;
  }

  canActivate(): boolean | UrlTree {
    return this.checkAuth();
  }

  canActivateChild(): boolean | UrlTree {
    return this.checkAuth();
  }

  canMatch(
    route: Route,
    segments: UrlSegment[]
  ): boolean | UrlTree {
    return this.checkAuth();
  }
}
