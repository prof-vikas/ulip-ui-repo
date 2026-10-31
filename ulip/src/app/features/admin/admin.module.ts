import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ApprovalsComponent } from './approvals.component';
import { UsersComponent } from './users.component';
import { RolesComponent } from './roles.component';
import { MenusComponent } from './menus.component';
import { CatalogConfigComponent } from './catalog-config.component';
import { CreditsComponent } from './credits.component';
import { AuditComponent } from './audit.component';

const ADMIN = 'Administration';

// Mounted at /dashboard/admin; paths match the ulip-rbac ADMIN_* menu paths.
const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/dashboard' },
  { path: 'approvals', component: ApprovalsComponent, data: { permission: 'ACCESS_APPROVE', title: 'Approvals', section: ADMIN } },
  { path: 'users', component: UsersComponent, data: { permission: 'USER_MANAGE', title: 'Users', section: ADMIN } },
  { path: 'roles', component: RolesComponent, data: { permission: 'ROLE_MANAGE', title: 'Roles & Permissions', section: ADMIN } },
  { path: 'menus', component: MenusComponent, data: { permission: 'MENU_MANAGE', title: 'Menus', section: ADMIN } },
  { path: 'catalog', component: CatalogConfigComponent, data: { permission: 'CATALOG_MANAGE', title: 'API Catalog Config', section: ADMIN } },
  { path: 'credits', component: CreditsComponent, data: { permission: 'CREDIT_MANAGE', title: 'Sandbox Credits', section: ADMIN } },
  { path: 'audit', component: AuditComponent, data: { permission: 'AUDIT_VIEW', title: 'Audit Log', section: ADMIN } }
];

@NgModule({
  declarations: [
    ApprovalsComponent, UsersComponent, RolesComponent, MenusComponent,
    CatalogConfigComponent, CreditsComponent, AuditComponent
  ],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class AdminModule {}
