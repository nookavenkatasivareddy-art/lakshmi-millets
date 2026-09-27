import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { AuthComponent } from './components/auth/auth.component';
import { AdminOrdersComponent } from './components/admin-orders/admin-orders.component';
import { AdminSettingsComponent } from './components/admin-settings/admin-settings.component';
import { ProductsComponent } from './components/products/products.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { WishlistComponent } from './components/wishlist/wishlist.component';
import { CartComponent } from './components/cart/cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { OrdersComponent } from './components/orders/orders.component';
import { BenefitsComponent } from './components/benefits/benefits.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { FaqComponent } from './components/faq/faq.component';
import { TrackOrderComponent } from './components/track-order/track-order.component';
import { ShippingPolicyComponent } from './components/shipping-policy/shipping-policy.component';
import { ReturnPolicyComponent } from './components/return-policy/return-policy.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { AdminProductsComponent } from './components/admin-products/admin-products.component';
import { AdminCategoriesComponent } from './components/admin-categories/admin-categories.component';
import { AdminInvoicesComponent } from './components/admin-invoices/admin-invoices.component';
import { AdminUsersComponent } from './components/admin-users/admin-users.component';
import { AdminMessagesComponent } from './components/admin-messages/admin-messages.component';
import { AdminNotificationsComponent } from './components/admin-notifications/admin-notifications.component';
import { AdminReviewsComponent } from './components/admin-reviews/admin-reviews.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: AuthComponent, data: { mode: 'login' } },
  { path: 'register', component: AuthComponent, data: { mode: 'register' } },
  { path: 'benefits', component: BenefitsComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'track-order', component: TrackOrderComponent },
  { path: 'shipping-policy', component: ShippingPolicyComponent },
  { path: 'return-policy', component: ReturnPolicyComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'products/category/:slug', component: ProductsComponent },
  { path: 'product/:slug', component: ProductDetailComponent },
  { path: 'cart', component: CartComponent },
  {
  path: 'wishlist',
  component: WishlistComponent
},
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard] },
  { path: 'orders', component: OrdersComponent, canActivate: [AuthGuard] },

  // Admin routes with layout wrapper
  { path: 'admin', component: AdminLayoutComponent, canActivate: [AdminGuard], children: [
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
  ]},

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
