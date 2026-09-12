import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-invoices',
  templateUrl: './admin-invoices.component.html',
  styleUrls: ['./admin-invoices.component.css']
})
export class AdminInvoicesComponent implements OnInit {
  invoices: any[] = [];
  loading = true;
  errorMsg = '';
  search = '';
  page = 1;
  totalPages = 1;
  total = 0;

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void { this.loadInvoices(); }

  loadInvoices(): void {
    this.loading = true;
    this.adminService.getAdminInvoices({ page: this.page, search: this.search }).subscribe({
      next: res => {
        this.invoices = res?.invoices || [];
        this.total = res?.total || 0;
        this.totalPages = res?.totalPages || 1;
        this.loading = false;
      },
      error: err => { this.errorMsg = err.error?.message || 'Failed to load'; this.loading = false; }
    });
  }

  onSearch(): void { this.page = 1; this.loadInvoices(); }

  goToPage(p: number): void { this.page = p; this.loadInvoices(); }

  invoiceLabel(inv: any): string { return `INV-${String(inv?.id || inv?._id || '').slice(-8).toUpperCase()}`; }

  /** Last-8-char uppercase order id label (template helper — String() is not available in templates). */
  orderIdLabel(inv: any): string {
    const raw = String(inv?.id || inv?._id || '');
    return raw ? raw.slice(-8).toUpperCase() : '';
  }

  viewInvoice(inv: any): void {
    const o = inv;
    const rows = (o.items || []).map((i: any) =>
      `<tr><td>${i.name || ''}</td><td>${i.weight || '-'}</td><td>${i.quantity}</td>` +
      `<td>₹${(i.price || 0).toFixed(2)}</td>` +
      `<td>₹${((i.price || 0) * (i.quantity || 0)).toFixed(2)}</td></tr>`
    ).join('');
    const a = o.shippingAddress || {};
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;
    w.document.write(
      `<html><head><title>Invoice #${this.invoiceLabel(o)}</title>` +
      `<style>body{font-family:Arial,sans-serif;padding:24px;color:#222}` +
      `table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:14px}` +
      `th{background:#f6f8f6}h1{font-size:20px;color:#2e7d32}td.r,th.r{text-align:right}</style></head><body>` +
      `<h1>🌾 Lakshmi Millets — Invoice #${this.invoiceLabel(o)}</h1>` +
      `<p>Date: ${o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}<br>` +
      `<b>Customer:</b> ${o.userId?.name || a.fullName || '-'}<br>` +
      `<b>Phone:</b> ${a.phone || '-'}<br>` +
      `<b>Address:</b> ${[a.line1, a.line2, a.city, a.state].filter(Boolean).join(', ')}${a.pincode ? ' - ' + a.pincode : ''}</p>` +
      `<table><thead><tr><th>Product</th><th>Grams</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Subtotal</th></tr></thead>` +
      `<tbody>${rows}</tbody>` +
      `<tfoot>` +
      `<tr><td colspan="4" class="r">Subtotal</td><td class="r">₹${(o.itemsTotal || 0).toFixed(2)}</td></tr>` +
      `<tr><td colspan="4" class="r">GST</td><td class="r">₹${(o.gstAmount || 0).toFixed(2)}</td></tr>` +
      `<tr><td colspan="4" class="r">Shipping</td><td class="r">₹${(o.deliveryCharge || 0).toFixed(2)}</td></tr>` +
      `<tr class="grand"><td colspan="4" class="r"><b>Grand Total</b></td><td class="r"><b>₹${(o.grandTotal || 0).toFixed(2)}</b></td></tr>` +
      `</tfoot></table>` +
      `<p>Payment: ${o.paymentMethod || '-'} / ${o.paymentStatus || '-'}</p>` +
      `<p>Thank you for ordering with Lakshmi Millets!</p></body></html>`
    );
    w.document.close();
    w.focus();
    w.print();
  }
}
