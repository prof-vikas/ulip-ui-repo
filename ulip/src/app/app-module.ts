import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { SharedModule } from './shared/shared.module';

import { JwtInterceptor } from './core/interceptors/jwt.interceptor';

import { MenuHomeComponent } from './core/menu/menu-home.component';
import { ModuleOverviewComponent } from './core/menu/module-overview.component';
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
import { SidenavComponent } from './shared/sidenav/sidenav.component';
import { TopbarComponent } from './shared/topbar/topbar.component';
import { NotificationBellComponent } from './shared/topbar/notification-bell.component';
import { ApiAccessBarComponent } from './shared/api-access-bar/api-access-bar.component';
import { BackButtonComponent } from './shared/back-button/back-button.component';

@NgModule({
  declarations: [
    App,
    DashboardComponent,
    HomeComponent,
    VahanComponent,
    VahanOverviewComponent,
    SarathiComponent,
    FastagComponent,
    FoisComponent,
    EwaybillComponent,
    IceGateOverviewComponent,
    IceGateComponent,
    SidenavComponent,
    TopbarComponent,
    NotificationBellComponent,
    ApiAccessBarComponent,
    BackButtonComponent,
    MenuHomeComponent,
    ModuleOverviewComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    HttpClientModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }
  ],
  bootstrap: [App]
})
export class AppModule {}
