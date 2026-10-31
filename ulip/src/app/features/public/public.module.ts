import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DocsModule } from '../docs/docs.module';
import { ApiDocComponent } from '../docs/api-doc.component';
import { PublicLayoutComponent } from './public-layout.component';
import { LandingComponent } from './landing.component';
import { PublicApisComponent } from './public-apis.component';
import { AboutComponent } from './about.component';
import { GuestGuard } from './guest.guard';
import { LoginComponent } from '../login/login.component';
import { SignupComponent } from '../account/signup.component';
import { VerifyEmailComponent } from '../account/verify-email.component';
import { ForgotPasswordComponent } from '../account/forgot-password.component';

// The signed-out site: landing, API list, reference docs, about and the sign-in / sign-up pages. No dashboard here; signing in goes to /dashboard.
const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: LandingComponent, canActivate: [GuestGuard] },
      { path: 'catalog', component: PublicApisComponent, data: { title: 'APIs' } },
      { path: 'docs', component: ApiDocComponent, data: { public: true, title: 'Documentation' } },
      { path: 'docs/:slug', component: ApiDocComponent, data: { public: true, title: 'Documentation' } },
      { path: 'about', component: AboutComponent, data: { title: 'About' } },
      { path: 'login', component: LoginComponent, data: { title: 'Sign in' } },
      { path: 'signup', component: SignupComponent, data: { title: 'Create account' } },
      { path: 'verify-email', component: VerifyEmailComponent, data: { title: 'Verify e-mail' } },
      { path: 'forgot-password', component: ForgotPasswordComponent, data: { title: 'Reset password' } }
    ]
  }
];

@NgModule({
  declarations: [
    PublicLayoutComponent, LandingComponent, PublicApisComponent, AboutComponent,
    LoginComponent, SignupComponent, VerifyEmailComponent, ForgotPasswordComponent
  ],
  imports: [SharedModule, DocsModule, RouterModule.forChild(routes)]
})
export class PublicModule {}
