import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  overviewRoute?: string;  // parent navigates here when clicked
  children?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidenav',
  standalone: false,
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent {
  userName: string | null;

  navItems: NavItem[] = [
    {
      label: 'Vahan',
      icon: '🚗',
      overviewRoute: '/dashboard/vahan',
      expanded: false,
      children: [
        { label: 'Vahan 01', icon: '', route: '/dashboard/vahan/01' },
        { label: 'Vahan 02', icon: '', route: '/dashboard/vahan/02' },
        { label: 'Vahan 03', icon: '', route: '/dashboard/vahan/03' },
        { label: 'Vahan 04', icon: '', route: '/dashboard/vahan/04' },
        { label: 'Vahan 05', icon: '', route: '/dashboard/vahan/05' },
        { label: 'Vahan 06', icon: '', route: '/dashboard/vahan/06' }
      ]
    },
    { label: 'Sarathi',   icon: '📋', route: '/dashboard/sarathi' },
    { label: 'FASTag',   icon: '🏷️', route: '/dashboard/fastag' },
    { label: 'FOIS',      icon: '🚂', route: '/dashboard/fois' },
    { label: 'E-Way Bill',icon: '📄', route: '/dashboard/ewaybill' },
    {
      label: 'ICE GATE',
      icon: '⚓',
      overviewRoute: '/dashboard/icegate',
      expanded: false,
      children: [
        { label: 'ICE GATE 01', icon: '', route: '/dashboard/icegate/01' },
        { label: 'ICE GATE 02', icon: '', route: '/dashboard/icegate/02' },
        { label: 'ICE GATE 03', icon: '', route: '/dashboard/icegate/03' },
        { label: 'ICE GATE 04', icon: '', route: '/dashboard/icegate/04' },
        { label: 'ICE GATE 05', icon: '', route: '/dashboard/icegate/05' },
        { label: 'ICE GATE 06', icon: '', route: '/dashboard/icegate/06' },
        { label: 'ICE GATE 07', icon: '', route: '/dashboard/icegate/07' },
        { label: 'ICE GATE 08', icon: '', route: '/dashboard/icegate/08' },
        { label: 'ICE GATE 09', icon: '', route: '/dashboard/icegate/09' },
        { label: 'ICE GATE 10', icon: '', route: '/dashboard/icegate/10' },
        { label: 'ICE GATE 11', icon: '', route: '/dashboard/icegate/11' },
        { label: 'ICE GATE 12', icon: '', route: '/dashboard/icegate/12' },
        { label: 'ICE GATE 13', icon: '', route: '/dashboard/icegate/13' }
      ]
    }
  ];

  constructor(private authService: AuthService, private router: Router) {
    this.userName = this.authService.getUser();
  }

  toggleExpand(item: NavItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
      // also navigate to the overview page
      if (item.overviewRoute) {
        this.router.navigate([item.overviewRoute]);
      }
    }
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  isParentActive(item: NavItem): boolean {
    if (!item.children) return false;
    const url = this.router.url;
    return item.children.some(c => c.route === url)
      || (!!item.overviewRoute && url === item.overviewRoute);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
