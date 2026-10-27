import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { VahanComponent } from './features/vahan/vahan.component';
import { VahanOverviewComponent } from './features/vahan/vahan-overview.component';
import { SarathiComponent } from './features/sarathi/sarathi.component';
import { FastagComponent } from './features/fastag/fastag.component';
import { FoisComponent } from './features/fois/fois.component';
import { EwaybillComponent } from './features/ewaybill/ewaybill.component';
import { IceGateOverviewComponent } from './features/icegate/icegate-overview.component';
import { IceGateComponent } from './features/icegate/icegate.component';
import { AuthGuard } from './core/auth/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '',           redirectTo: 'vahan',     pathMatch: 'full' },
      { path: 'vahan',      component: VahanOverviewComponent },
      { path: 'vahan/:id',  component: VahanComponent },
      { path: 'sarathi',   component: SarathiComponent },
      { path: 'fastag',    component: FastagComponent },
      { path: 'fois',      component: FoisComponent },
      { path: 'ewaybill',  component: EwaybillComponent },
      { path: 'icegate',     component: IceGateOverviewComponent },
      { path: 'icegate/:id', component: IceGateComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
