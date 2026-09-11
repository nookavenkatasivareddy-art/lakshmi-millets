import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { HomeComponent } from './components/home/home.component';
import { ProductsComponent } from './components/products/products.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { CartComponent } from './components/cart/cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { OrdersComponent } from './components/orders/orders.component';
import { AdminOrdersComponent } from './components/admin-orders/admin-orders.component';

import { AuthComponent } from './components/auth/auth.component';
import { BenefitsComponent } from './components/benefits/benefits.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { FaqComponent } from './components/faq/faq.component';
import { TrackOrderComponent } from './components/track-order/track-order.component';
import { ShippingPolicyComponent } from './components/shipping-policy/shipping-policy.component';
import { ReturnPolicyComponent } from './components/return-policy/return-policy.component';
import { AuthInterceptor } from './core/services/auth.interceptor';
import { ImageUrlPipe } from './core/pipes/image-url.pipe';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    HomeComponent,
    ProductsComponent,
    ProductDetailComponent,
    CartComponent,
    CheckoutComponent,
    OrdersComponent,
    AdminOrdersComponent,
    AuthComponent,
    BenefitsComponent,
    AboutComponent,
    ContactComponent,
    FaqComponent,
    TrackOrderComponent,
    ShippingPolicyComponent,
    ReturnPolicyComponent,
    ImageUrlPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}