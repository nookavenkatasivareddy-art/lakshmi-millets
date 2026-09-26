import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/models';

const STORAGE_KEY = 'lm_wishlist';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private wishlistSubject = new BehaviorSubject<Product[]>(
    this.loadWishlist()
  );

  wishlist$ = this.wishlistSubject.asObservable();

  private loadWishlist(): Product[] {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private persist(products: Product[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    this.wishlistSubject.next(products);
  }

  get items(): Product[] {
    return this.wishlistSubject.value;
  }

  isInWishlist(productId: string): boolean {
    return this.items.some(product => product.id === productId);
  }

  toggle(product: Product): void {
    if (this.isInWishlist(product.id)) {
      this.remove(product.id);
    } else {
      this.add(product);
    }
  }

  add(product: Product): void {
    if (this.isInWishlist(product.id)) {
      return;
    }

    this.persist([
      ...this.items,
      product
    ]);
  }

  remove(productId: string): void {
    this.persist(
      this.items.filter(product => product.id !== productId)
    );
  }

  clear(): void {
    this.persist([]);
  }

  get totalCount(): number {
    return this.items.length;
  }
}
