import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  loading = true;
  errorMsg = '';

  constructor(private orderService: OrderService, private auth: AuthService) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.loading = false;
      this.errorMsg = 'Please log in to view your orders.';
      return;
    }
    this.orderService.getMyOrders().subscribe({
      next: o => { this.orders = o; this.loading = false; },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Failed to load orders';
      }
    });
  }

  orderLabel(order: any): string {
    const raw = String(order?.id || order?._id || '');
    return raw ? raw.slice(-8).toUpperCase() : '';
  }
}
