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

export const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardOverviewComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'categories', component: AdminCategoriesComponent },
      { path: 'invoices', component: AdminInvoicesComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'messages', component: AdminMessagesComponent },
      { path: 'notifications', component: AdminNotificationsComponent },
      { path: 'reviews', component: AdminReviewsComponent },
      { path: 'settings', component: AdminSettingsComponent }
    ]
  }
];