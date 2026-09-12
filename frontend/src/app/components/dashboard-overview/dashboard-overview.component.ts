import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { AdminLayoutComponent } from '../admin-layout/admin-layout.component';

/** One day of sales data from GET /api/admin/sales (byDay entries). */
interface SalesDay {
  date: string;
  total: number;
  count: number;
}

@Component({
  selector: 'app-dashboard-overview',
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.css']
})
export class DashboardOverviewComponent implements OnInit {
  stats: any = {};
  salesData: any = {};
  recentOrders: any[] = [];
  topProducts: any[] = [];
  lowStockProducts: any[] = [];
  salesRange = 'month';
  loading = true;
  errorMsg = '';

  salesFilterOptions = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' }
  ];

  statusColors: { [key: string]: string } = {
    PLACED: '#e65100', CONFIRMED: '#2e7d32', SHIPPED: '#1565c0',
    DELIVERED: '#2e7d32', CANCELLED: '#c0392b', CLOSED: '#666'
  };

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.adminService.getDashboardStats().subscribe({
      next: res => {
        this.stats = res || {};
        this.lowStockProducts = this.stats.lowStockProducts || [];
      },
      error: err => { this.errorMsg = err.error?.message || 'Failed to load dashboard'; this.loading = false; }
    });
    this.loadSales();
    this.loadRecentOrders();
  }

  loadSales(): void {
    this.adminService.getSalesData(this.salesRange).subscribe({
      next: res => { this.salesData = res || {}; },
      error: () => {}
    });
  }

  loadRecentOrders(): void {
    this.adminService.getAdminOrders({ page: 1, limit: 5 }).subscribe({
      next: res => {
        this.recentOrders = (res?.orders || []).slice(0, 5);
        this.loading = false;
        this.loadTopProducts();
      },
      error: err => { this.errorMsg = err.error?.message || 'Failed to load orders'; this.loading = false; }
    });
  }

  loadTopProducts(): void {
    const productMap: { [key: string]: any } = {};
    this.recentOrders.forEach(order => {
      (order?.items || []).forEach((item: any) => {
        const key = item.name || 'Unknown';
        if (!productMap[key]) productMap[key] = { name: item.name || 'Unknown', image: item.image || '', units: 0, revenue: 0 };
        productMap[key].units += item.quantity || 0;
        productMap[key].revenue += (item.price || 0) * (item.quantity || 0);
      });
    });
    this.topProducts = Object.values(productMap).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);
  }

  onSalesRangeChange(range: string): void { this.salesRange = range; this.loadSales(); }

  orderLabel(order: any): string { const raw = String(order?.id || order?._id || ''); return raw ? raw.slice(-8).toUpperCase() : ''; }

  formatPrice(n: number): string { return '₹' + (Number(n) || 0).toLocaleString('en-IN'); }

  openOrder(order: any): void { const id = order?.id || order?._id; if (id) this.router.navigate(['/admin/orders'], { queryParams: { open: id } }); }

  getBarData(): { label: string; value: number }[] {
    const days: SalesDay[] = this.salesData?.byDay || [];
    if (this.salesRange === 'today') {
      return days.slice(-12).map((d: SalesDay) => ({ label: d.date ? d.date.slice(11, 16) : '', value: d.total || 0 }));
    }
    return days.slice(-7).map((d: SalesDay) => ({ label: d.date ? d.date.slice(5) : '', value: d.total || 0 }));
  }

  getMaxBarValue(): number { const data = this.getBarData(); return data.length ? Math.max(...data.map(d => d.value), 1) : 1; }
}
