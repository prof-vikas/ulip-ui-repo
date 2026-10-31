import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';
import { VahanComponent } from './features/vahan/vahan.component';
import { VahanOverviewComponent } from './features/vahan/vahan-overview.component';
import { SarathiComponent } from './features/sarathi/sarathi.component';
import { FastagComponent } from './features/fastag/fastag.component';
import { FoisComponent } from './features/fois/fois.component';
import { EwaybillComponent } from './features/ewaybill/ewaybill.component';
import { IceGateOverviewComponent } from './features/icegate/icegate-overview.component';
import { IceGateComponent } from './features/icegate/icegate.component';
import { AuthGuard, PermissionGuard } from './core/auth/auth.guard';
import { MenuHomeComponent } from './core/menu/menu-home.component';
import { ModuleOverviewComponent } from './core/menu/module-overview.component';

const DATA = 'Data APIs';

// Every child of /dashboard is checked by PermissionGuard against `data.permission` (role) and
// `data.module` (the build's menuModules). Paths match ulip-rbac menu paths ('/vahan/01' etc.).
const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    canActivateChild: [PermissionGuard],
    children: [
      { path: '', pathMatch: 'full', component: MenuHomeComponent },
      { path: 'home', component: HomeComponent, data: { permission: 'PROFILE_VIEW', title: 'Dashboard', section: 'Overview' } },
      { path: 'vahan', component: VahanOverviewComponent, data: { module: 'vahan', permission: 'MODULE_VAHAN', title: 'Vahan', section: DATA } },
      { path: 'vahan/:id', component: VahanComponent, data: { module: 'vahan', permission: 'MODULE_VAHAN', title: 'Vahan', section: DATA } },
      { path: 'sarathi', component: SarathiComponent, data: { module: 'sarathi', permission: 'MODULE_SARATHI', title: 'Sarathi', section: DATA } },
      { path: 'fastag', component: ModuleOverviewComponent, data: { module: 'fastag', permission: 'MODULE_FASTAG', overviewPath: '/fastag', title: 'FASTag', section: DATA } },
      { path: 'fastag/:id', component: FastagComponent, data: { module: 'fastag', permission: 'MODULE_FASTAG', title: 'FASTag', section: DATA } },
      { path: 'fois', component: ModuleOverviewComponent, data: { module: 'fois', permission: 'MODULE_FOIS', overviewPath: '/fois', title: 'FOIS', section: DATA } },
      { path: 'fois/:id', component: FoisComponent, data: { module: 'fois', permission: 'MODULE_FOIS', title: 'FOIS', section: DATA } },
      { path: 'ewaybill', component: EwaybillComponent, data: { module: 'ewaybill', permission: 'MODULE_EWAYBILL', title: 'E-Way Bill', section: DATA } },
      { path: 'icegate', component: IceGateOverviewComponent, data: { module: 'icegate', permission: 'MODULE_ICEGATE', title: 'ICE GATE', section: DATA } },
      { path: 'icegate/:id', component: IceGateComponent, data: { module: 'icegate', permission: 'MODULE_ICEGATE', title: 'ICE GATE', section: DATA } },
      { path: 'admin', loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule) },
      // catalog, access, keys, usage, profile
      { path: '', loadChildren: () => import('./features/portal/portal.module').then(m => m.PortalModule) }
    ]
  },
  // Signed-out site: landing, APIs, documentation, about, sign-in and sign-up
  { path: '', loadChildren: () => import('./features/public/public.module').then(m => m.PublicModule) },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
