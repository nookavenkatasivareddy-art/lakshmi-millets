#!/bin/bash
# Run INSIDE lakshmi-millets-frontend on EC2. Fixes CRLF-corrupted + stale files.
set -e
echo "--- patching delivery.service.ts (remove stray brace) ---"
cat > src/app/core/services/delivery.service.ts <<'EOF'
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from './config';
import { DeliveryLocation } from '../models/models';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  locations: DeliveryLocation[] = [];

  constructor(private http: HttpClient) {}

  getLocations(): Observable<DeliveryLocation[]> {
    return this.http
      .get<DeliveryLocation[]>(`${API_BASE_URL}/delivery-locations`)
      .pipe(tap((locs) => { this.locations = locs; }));
  }
}
EOF
echo "--- patching models.ts (id optional + _id fallback) ---"
cat > src/app/core/models/models.ts <<'EOF'
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: Category | string;
  description: string;
  image: string;
  price: number;
  mrp: number;
  weight: string;
  stock: number;
  isPopular: boolean;
}

export interface DeliveryLocation {
  id?: string;
  _id?: string;
  city: string;
  state: string;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  estimatedDays: string;
}

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Address {
  id?: string;
  _id?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  addresses: Address[];
}
EOF
echo "--- patching order.service.ts (deliveryLocationId optional) ---"
cat > src/app/core/services/order.service.ts <<'EOF'
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './config';
import { CartItem, ShippingAddress } from '../models/models';

export interface PlaceOrderPayload {
  items: CartItem[];
  deliveryLocationId?: string;
  shippingAddress: ShippingAddress;
  paymentMethod: 'COD' | 'CARD' | 'UPI' | 'NETBANKING';
  paymentId?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  placeOrder(payload: PlaceOrderPayload): Observable<any> {
    return this.http.post(`${API_BASE_URL}/orders`, payload);
  }

  getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/orders/my`);
  }
}
EOF
echo "--- fixing app.module.ts line 43: replace literal backtick-r-backtick-n with real newlines ---"
perl -i -pe "s/\`r\`n/\n/g" src/app/app.module.ts
echo "app.module.ts line 40-50 after fix:"
sed -n '40,50p' src/app/app.module.ts
echo "--- verify delivery.service.ts tail (must be 18 lines, single closing brace) ---"
wc -l src/app/core/services/delivery.service.ts
tail -5 src/app/core/services/delivery.service.ts
echo ""
echo "NEXT: copy remaining fixed component files from Windows frontend/src over EC2:"
echo "  - src/app/components/checkout/checkout.component.ts (addressId helper, id||_id, || undefined)"
echo "  - src/app/components/checkout/checkout.component.html (addr.id || addr._id)"
echo "  - src/app/components/navbar/navbar.component.ts + .html (firstName)"
echo "  - src/app/components/home/home.component.ts + .html (goToProduct, no routerLink on div)"
echo "  - src/app/components/product-detail/product-detail.component.html (*ngIf=product as p)"
echo "  - src/app/components/orders/orders.component.ts + .html (orderLabel)"
echo "Then: rm -rf dist && npm ci && npx ng build --configuration production"
echo "--- patching checkout.component.ts ---"
cat > src/app/components/checkout/checkout.component.ts <<'CHECKOUT_TS_EOF'
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { DeliveryLocation, Address } from '../../core/models/models';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  addressForm: FormGroup;
  savedAddresses: Address[] = [];
  selectedAddressId = '';
  showNewAddressForm = false;
  defaultLocationId = '';
  paymentMethod: 'COD' | 'CARD' | 'UPI' | 'NETBANKING' = 'COD';
  placing = false;
  errorMsg = '';

  selectedUpiApp = '';
  showPaymentLinkModal = false;

  upiApps = [
    { id: 'paytm', name: 'Paytm', short: 'P', color: '#00baf2' },
    { id: 'amazonpay', name: 'Amazon Pay', short: 'a', color: '#232f3e' },
    { id: 'bhim', name: 'BHIM App', short: 'B', color: '#ee6723' },
    { id: 'cred', name: 'CRED UPI', short: 'C', color: '#0b0b0b' },
    { id: 'kiwi', name: 'Kiwi UPI', short: 'K', color: '#6fce44' },
    { id: 'other', name: 'Other UPI Apps', short: 'X', color: '#f0a500' },
    { id: 'supermoney', name: 'Super Money', short: 'S', color: '#4d3df7' },
    { id: 'airtel', name: 'Airtel Payments Bank UPI', short: 'A', color: '#e40000' },
    { id: 'pop', name: 'POP UPI', short: 'pop', color: '#111111' },
    { id: 'navi', name: 'Navi UPI', short: 'n', color: '#3c1f8b' },
    { id: 'fampay', name: 'FamPay', short: 'F', color: '#ff8a00' }
  ];

  constructor(
    private fb: FormBuilder,
    private cart: CartService,
    private deliveryService: DeliveryService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private auth: AuthService,
    private router: Router
  ) {
    this.addressForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      line1: ['', Validators.required],
      line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });
  }

  ngOnInit(): void {
    if (this.cart.items.length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    this.auth.getMe().subscribe({
      next: (res) => {
        const user = res.user;
        this.savedAddresses = user?.addresses || [];
        if (this.savedAddresses.length > 0) {
          const def = this.savedAddresses.find((a) => a.isDefault) || this.savedAddresses[0];
          this.selectedAddressId = this.addressId(def);
        } else {
          this.showNewAddressForm = true;
        }
      },
      error: () => {
        this.savedAddresses = [];
        this.showNewAddressForm = true;
      }
    });

    this.deliveryService.getLocations().subscribe({
      next: locs => {
        if (locs.length) this.defaultLocationId = locs[0].id || locs[0]._id || '';
      }
    });
  }

  get itemsTotal(): number {
    return this.cart.itemsTotal;
  }

  get deliveryCharge(): number {
    if (!this.defaultLocationId) return 0;
    const locs = this.deliveryService.locations;
    if (!locs) return 0;
    const found = locs.find((l: DeliveryLocation) => (l.id || l._id) === this.defaultLocationId);
    if (!found) return 0;
    return this.itemsTotal >= found.freeDeliveryAbove ? 0 : found.deliveryCharge;
  }

  get grandTotal(): number {
    return this.itemsTotal + this.deliveryCharge;
  }

