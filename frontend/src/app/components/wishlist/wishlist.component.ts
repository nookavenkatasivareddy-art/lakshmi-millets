import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../core/models/models';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {

  wishlist: Product[] = [];

  constructor(
    private wishlistService: WishlistService,
    private cart: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.wishlistService.wishlist$.subscribe(items => {
      this.wishlist = items;
    });
  }

  removeFromWishlist(productId: string): void {
    this.wishlistService.remove(productId);
  }

  addToCart(product: Product): void {
    this.cart.addToCart(product, 1);
    this.router.navigate(['/cart']);
  }

  openProduct(product: Product): void {
    this.router.navigate(['/product', product.slug]);
  }
}