import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-admin-orders',
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.css']
})
export class AdminOrdersComponent implements OnInit {
  orders: any[] = [];
  loading = true;
  errorMsg = '';
  updatingId = '';

  // Order Details modal (image-1 flow)
  selected: any = null;
  selectedStatus = 'PLACED';
  updatingModal = false;
  modalMsg = '';
  modalOk = false;

  statuses = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'CLOSED'];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.orderService.getAllOrders().subscribe({
      next: o => { this.orders = o || []; this.loading = false; },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Failed to load orders (admin only)';
      }
    });
  }

  orderId(order: any): string {
    return String(order?.id || order?._id || '');
  }

  orderLabel(order: any): string {
    const raw = this.orderId(order);
    return raw ? raw.slice(-8).toUpperCase() : '';
  }

  customerName(order: any): string {
    return order?.userId?.name || order?.shippingAddress?.fullName || 'Customer';
  }

  itemsSubtotal(order: any): number {
    return (order?.items || []).reduce(
      (s: number, i: any) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0
    );
  }

  /** Open the Order Details modal for one order. */
  openDetails(order: any): void {
    this.selected = order;
    this.selectedStatus = order.orderStatus || 'PLACED';
    this.modalMsg = '';
    this.modalOk = false;
  }

  closeDetails(): void {
    this.selected = null;
    this.modalMsg = '';
  }

  /** Update Status button — pending -> confirmed etc. On first CONFIRMED the
   *  customer WhatsApp confirmation fires (automatic via Wati, otherwise the
   *  pre-filled wa.me link from the backend opens with one click). */
  updateStatus(): void {
    if (!this.selected) return;
    const id = this.orderId(this.selected);
    if (!id) return;
    this.updatingModal = true;
    this.modalMsg = '';
    this.orderService.updateOrderStatus(id, this.selectedStatus).subscribe({
      next: (updated) => {
        this.updatingModal = false;
        const idx = this.orders.findIndex(o => this.orderId(o) === id);
        if (idx >= 0) this.orders[idx] = updated;
        this.selected = updated;
        if (updated.orderStatus === 'CONFIRMED') {
          if (updated.whatsappSent) {
            this.modalOk = true;
            this.modalMsg = 'Order confirmed. WhatsApp confirmation sent to the customer.';
          } else if (updated.whatsappUrl) {
            window.open(updated.whatsappUrl, '_blank');
            this.modalOk = true;
            this.modalMsg = 'Order confirmed. Opening WhatsApp — press send to notify the customer.';
          } else {
            this.modalOk = true;
            this.modalMsg = 'Order confirmed.';
          }
        } else {
          this.modalOk = true;
          this.modalMsg = 'Status updated to ' + updated.orderStatus + '.';
        }
      },
      error: (err) => {
        this.updatingModal = false;
        this.modalOk = false;
        this.modalMsg = err.error?.message || 'Failed to update status';
      }
    });
  }

  /** Simple printable invoice (View Invoice button in the modal). */
  printInvoice(): void {
    if (!this.selected) return;
    const o = this.selected;
    const a = o.shippingAddress || {};
    const rows = (o.items || []).map((i: any) =>
      `<tr><td>${i.name || ''}</td><td>${i.weight || '-'}</td><td>${i.quantity}</td>` +
      `<td>Rs.${Number(i.price || 0).toFixed(2)}</td>` +
      `<td>Rs.${((Number(i.price) || 0) * (Number(i.quantity) || 0)).toFixed(2)}</td></tr>`
    ).join('');
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;
    w.document.write(
      `<html><head><title>Invoice #${this.orderLabel(o)}</title>` +
      `<style>body{font-family:Arial,sans-serif;padding:24px;color:#222}` +
      `table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:14px}` +
      `th{background:#f6f8f6}h1{font-size:20px;color:#2e7d32}td.r,th.r{text-align:right}</style></head><body>` +
      `<h1>🌾 Lakshmi Millets — Invoice #${this.orderLabel(o)}</h1>` +
      `<p>Date: ${o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}<br>` +
      `<b>Customer:</b> ${this.customerName(o)}<br>` +
      `<b>Phone:</b> ${a.phone || '-'}<br>` +
      `<b>Address:</b> ${[a.line1, a.line2, a.city, a.state].filter(Boolean).join(', ')}${a.pincode ? ' - ' + a.pincode : ''}</p>` +
      `<table><thead><tr><th>Product</th><th>Grams</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Subtotal</th></tr></thead>` +
      `<tbody>${rows}</tbody>` +
      `<tfoot>` +
      `<tr><td colspan="4" class="r">Subtotal</td><td class="r">Rs.${this.itemsSubtotal(o).toFixed(2)}</td></tr>` +
      `<tr><td colspan="4" class="r">GST</td><td class="r">Rs.${Number(o.gstAmount || 0).toFixed(2)}</td></tr>` +
      `<tr><td colspan="4" class="r">Shipping</td><td class="r">Rs.${Number(o.deliveryCharge || 0).toFixed(2)}</td></tr>` +
      `<tr><td colspan="4" class="r"><b>Grand Total</b></td><td class="r"><b>Rs.${Number(o.grandTotal || 0).toFixed(2)}</b></td></tr>` +
      `</tfoot></table>` +
      `<p>Payment: ${o.paymentMethod || '-'} / ${o.paymentStatus || '-'}${o.paymentId ? ' · Txn ID: ' + o.paymentId : ''}</p>` +
      `<p>Thank you for ordering with Lakshmi Millets!</p>` +
      `</body></html>`
    );
    w.document.close();
    w.focus();
    w.print();
  }

  openCustomerWhatsApp(order: any) {
    const phone = String(order?.shippingAddress?.phone || '').replace(/\D/g, '');
    if (!phone) return;
    const msg = `Hi ${this.customerName(order)}, this is Lakshmi Millets. Your order #${this.orderLabel(order)} is now ${order.orderStatus}.`;
    window.open(`https://wa.me/91${phone.slice(-10)}?text=${encodeURIComponent(msg)}`, '_blank');
  }
}
