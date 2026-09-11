import { Injectable } from '@angular/core';
import { Product, CartItem } from '../models/models';

export interface CheckoutOrderDetails {
  orderId: string;
  items: CartItem[];
  itemsTotal: number;
  deliveryCharge: number;
  grandTotal: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
}

@Injectable({ providedIn: 'root' })
export class WhatsappService {
  // Store admin number: already given for this project (8897626612, India +91).
  private readonly phoneNumber = '918897626612';

  sendSingleProductOrder(product: Product, quantity: number): void {
    let message = `New Order:\n\n`;
    message += `${product.name} x${quantity} - \u20B9${product.price * quantity}\n\n`;
    message += `Total: \u20B9${product.price * quantity}`;
    this.openWhatsApp(message);
  }

  sendCartOrder(items: CartItem[]): void {
    let message = `New Order:\n\n`;
    let total = 0;
    items.forEach((item, index) => {
      const lineTotal = item.price * item.quantity;
      total += lineTotal;
      message += `${index + 1}. ${item.name} x${item.quantity} - \u20B9${lineTotal}\n`;
    });
    message += `\nTotal: \u20B9${total}`;
    this.openWhatsApp(message);
  }

  /**
   * Full order notification sent to admin right after a successful checkout.
   * Matches the image-2 "New Food Order Received!" model — customer taps send,
   * and the order lands on the admin WhatsApp (8897626612).
   */
  sendCheckoutOrder(details: CheckoutOrderDetails): void {
    const a = details.shippingAddress;
    const id = details.orderId ? '#' + details.orderId.slice(-8).toUpperCase() : '#NEW';
    const lines = details.items
      .map(i => `${i.quantity}x ${i.name}${(i as any).weight ? ' (' + (i as any).weight + ')' : ''}`)
      .join('\n');
    const message =
      `🔔 New Food Order Received!\n\n` +
      `Order ID: ${id}\n` +
      `Customer: ${a.fullName}\n` +
      `Phone: ${a.phone}\n\n` +
      `Items:\n${lines}\n\n` +
      `Total: Rs.${Number(details.grandTotal).toFixed(2)}\n` +
      `Payment: ${details.paymentMethod}\n\n` +
      `Please check the admin panel for complete order details.`;
    this.openWhatsApp(message);
  }

  private openWhatsApp(message: string): void {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${this.phoneNumber}?text=${encodedMessage}`;
    window.open(url, '_blank');
  }
}
