import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-notifications',
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['admin-notifications.component.css']
})
export class AdminNotificationsComponent implements OnInit {
  notifications: any[] = [];
  loading = true;
  errorMsg = '';
  page = 1;
  totalPages = 1;
  total = 0;

  typeLabels: { [key: string]: string } = {
    new_order: 'New Order', new_customer: 'New Customer', new_message: 'New Message',
    new_review: 'New Review', low_stock: 'Low Stock', payment_received: 'Payment Received',
    order_cancelled: 'Order Cancelled', order_delivered: 'Order Delivered', info: 'Info'
  };

  typeIcons: { [key: string]: string } = {
    new_order: '🛒', new_customer: '👤', new_message: '✉️', new_review: '⭐',
    low_stock: '⚠️', payment_received: '💰', order_cancelled: '❌', order_delivered: '✅', info: 'ℹ️'
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.loadNotifications(); }

  loadNotifications(): void {
    this.loading = true;
    this.adminService.getAdminNotifications({ page: this.page }).subscribe({
      next: res => {
        this.notifications = res?.notifications || [];
        this.total = res?.total || 0;
        this.totalPages = res?.totalPages || 1;
        this.loading = false;
      },
      error: err => { this.errorMsg = err.error?.message || 'Failed to load'; this.loading = false; }
    });
  }

  goToPage(p: number): void { this.page = p; this.loadNotifications(); }

  markRead(id: string): void {
    this.adminService.markNotificationRead(id).subscribe({
      next: () => {
        const n = this.notifications.find(x => x.id === id);
        if (n) n.isRead = true;
      },
      error: () => {}
    });
  }

  markAllRead(): void {
    this.adminService.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
      },
      error: () => {}
    });
  }

  deleteNotification(id: string): void {
    if (!confirm('Delete this notification?')) return;
    this.adminService.deleteNotification(id).subscribe({
      next: () => this.loadNotifications(),
      error: () => {}
    });
  }
}
