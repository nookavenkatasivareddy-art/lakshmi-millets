import { Routes } from '@angular/router';

import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminOrdersComponent } from './components/admin-orders/admin-orders.component';
import { AdminProductsComponent } from './components/admin-products/admin-products.component';
import { AdminCategoriesComponent } from './components/admin-categories/admin-categories.component';
import { AdminInvoicesComponent } from './components/admin-invoices/admin-invoices.component';
import { AdminUsersComponent } from './components/admin-users/admin-users.component';
import { AdminMessagesComponent } from './components/admin-messages/admin-messages.component';
import { AdminNotificationsComponent } from './components/admin-notifications/admin-notifications.component';
import { AdminReviewsComponent } from './components/admin-reviews/admin-reviews.component';
import { AdminSettingsComponent } from './components/admin-settings/admin-settings.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // /admin/ -> /admin/login
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },

  // Login page - NOT protected
  {
    path: 'login',
    component: AdminLoginComponent
  },

  // Protected admin area
  {
    path: '',
    component: AdminLayoutComponent,
    canMatch: [AuthGuard],
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],

    children: [
      {
        path: 'dashboard',
        component: DashboardOverviewComponent
      },
      {
        path: 'orders',
        component: AdminOrdersComponent
      },
      {
        path: 'products',
        component: AdminProductsComponent
      },
      {
        path: 'categories',
        component: AdminCategoriesComponent
      },
      {
        path: 'invoices',
        component: AdminInvoicesComponent
      },
      {
        path: 'users',
        component: AdminUsersComponent
      },
      {
        path: 'messages',
        component: AdminMessagesComponent
      },
      {
        path: 'notifications',
        component: AdminNotificationsComponent
      },
      {
        path: 'reviews',
        component: AdminReviewsComponent
      },
      {
        path: 'settings',
        component: AdminSettingsComponent
      }
    ]
  }
];
