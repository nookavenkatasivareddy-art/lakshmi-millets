import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { Product } from '../../core/models/models';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  quantity = 1;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cart: CartService,
    private whatsapp: WhatsappService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.productService.getProduct(slug).subscribe({
      next: p => { this.product = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  changeQty(delta: number) {
    const max = this.product ? this.product.stock : 999;
    this.quantity = Math.min(Math.max(1, this.quantity + delta), Math.max(1, max));
  }

  addToCart() {
    if (this.product && this.product.stock > 0) {
      this.cart.addToCart(this.product, this.quantity);
      this.router.navigate(['/checkout']);
    }
  }

  buyNow() {
    if (this.product && this.product.stock > 0) {
      this.cart.addToCart(this.product, this.quantity);
      this.router.navigate(['/checkout']);
    }
  }
}