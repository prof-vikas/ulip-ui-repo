import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { landingModule } from './menu-config';

/**
 * Landing target for /dashboard: opens the first module enabled in the build
 * (Vahan when it is part of the menu, otherwise the first enabled module).
 */
@Component({
  selector: 'app-menu-home',
  standalone: false,
  template: ''
})
export class MenuHomeComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.navigateByUrl(`/dashboard/${landingModule()}`, { replaceUrl: true });
  }
}
