import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { JwtInterceptor } from './core/interceptors/jwt.interceptor';

import { MenuHomeComponent } from './core/menu/menu-home.component';
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
import { SidenavComponent } from './shared/sidenav/sidenav.component';
import { ThemeToggleComponent } from './shared/theme-toggle/theme-toggle.component';
import { BackButtonComponent } from './shared/back-button/back-button.component';

@NgModule({
  declarations: [
    App,
    LoginComponent,
    DashboardComponent,
    VahanComponent,
    VahanOverviewComponent,
    SarathiComponent,
    FastagComponent,
    FoisComponent,
    EwaybillComponent,
    IceGateOverviewComponent,
    IceGateComponent,
    SidenavComponent,
    ThemeToggleComponent,
    BackButtonComponent,
    MenuHomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
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
