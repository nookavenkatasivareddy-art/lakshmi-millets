import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Product } from '../models/models';

const STORAGE_KEY = 'lm_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>(this.loadCart());
  items$ = this.itemsSubject.asObservable();

  private loadCart(): CartItem[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private persist(items: CartItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    this.itemsSubject.next(items);
  }

  get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  addToCart(product: Product, qty: number = 1) {
    const items = [...this.items];
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      items.push({
        productId: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: qty
      });
    }
    this.persist(items);
  }

  updateQuantity(productId: string, quantity: number) {
    let items = [...this.items];
    if (quantity <= 0) {
      items = items.filter(i => i.productId !== productId);
    } else {
      const item = items.find(i => i.productId === productId);
      if (item) item.quantity = quantity;
    }
    this.persist(items);
  }

  removeFromCart(productId: string) {
    this.persist(this.items.filter(i => i.productId !== productId));
  }

  clearCart() {
    this.persist([]);
  }

  get itemsTotal(): number {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  get totalCount(): number {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }
}
