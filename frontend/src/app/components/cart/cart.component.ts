import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { CartItem } from '../../core/models/models';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];

  constructor(
    private cart: CartService,
    private router: Router,
    private whatsapp: WhatsappService
  ) {}

  ngOnInit(): void {
    this.cart.items$.subscribe(items => (this.items = items));
  }

  updateQty(item: CartItem, delta: number) {
    this.cart.updateQuantity(item.productId, item.quantity + delta);
  }

  remove(item: CartItem) {
    this.cart.removeFromCart(item.productId);
  }

  get total(): number {
    return this.cart.itemsTotal;
  }

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }

  buyNowWhatsApp() {
    if (this.items.length > 0) {
      this.whatsapp.sendCartOrder(this.items);
    }
  }
}