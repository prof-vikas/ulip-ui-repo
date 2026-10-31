import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { CatalogComponent } from './catalog.component';
import { AccessRequestsComponent } from './access-requests.component';
import { ApiKeysComponent } from './api-keys.component';
import { UsageComponent } from './usage.component';
import { ProfileComponent } from './profile.component';
import { ApiDocComponent } from '../docs/api-doc.component';
import { DocsModule } from '../docs/docs.module';

const DEV = 'Developer';

// Mounted under /dashboard; paths match the ulip-rbac menu paths. PermissionGuard (parent) checks `permission`.
const routes: Routes = [
  { path: 'catalog', component: CatalogComponent, data: { permission: 'CATALOG_VIEW', title: 'API Catalog', section: DEV } },
  { path: 'access', component: AccessRequestsComponent, data: { permission: 'ACCESS_REQUEST_CREATE', title: 'My Access Requests', section: DEV } },
  { path: 'keys', component: ApiKeysComponent, data: { permission: 'API_KEY_MANAGE', title: 'API Keys', section: DEV } },
  { path: 'usage', component: UsageComponent, data: { permission: 'USAGE_VIEW_OWN', title: 'Usage & Credits', section: DEV } },
  // API reference: open to every signed-in user
  { path: 'docs', component: ApiDocComponent, data: { title: 'API Documentation', section: DEV } },
  { path: 'docs/:slug', component: ApiDocComponent, data: { title: 'API Documentation', section: DEV } },
  { path: 'profile', component: ProfileComponent, data: { permission: 'PROFILE_EDIT', title: 'Profile', section: 'Account' } }
];

@NgModule({
  declarations: [CatalogComponent, AccessRequestsComponent, ApiKeysComponent, UsageComponent, ProfileComponent],
  imports: [SharedModule, DocsModule, RouterModule.forChild(routes)]
})
export class PortalModule {}
