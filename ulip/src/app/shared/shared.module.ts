import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IconComponent } from './ui/icon.component';
import { PageHeaderComponent } from './ui/page-header.component';
import { StatusBadgeComponent } from './ui/status-badge.component';
import { EmptyStateComponent } from './ui/empty-state.component';
import { DialogComponent } from './ui/dialog.component';
import { NotifyHostComponent } from './ui/notify-host.component';
import { PagerComponent } from './ui/pager.component';
import { HasPermissionDirective } from './ui/has-permission.directive';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';

const SHARED = [
  IconComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
  EmptyStateComponent,
  DialogComponent,
  NotifyHostComponent,
  PagerComponent,
  HasPermissionDirective,
  ThemeToggleComponent
];

/** Building blocks for the portal pages; imported by the app and by each lazy feature module. */
@NgModule({
  declarations: SHARED,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  exports: [...SHARED, CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class SharedModule {}
