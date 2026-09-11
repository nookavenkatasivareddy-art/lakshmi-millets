import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Category, Product } from '../../core/models/models';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  popularProducts: Product[] = [];

  

  recipes = [
    { name: 'Millet Pongal', image: 'millet-pongal.jpg' },
    { name: 'Millet Dosa', image: 'millet-dosa.jpg' },
    { name: 'Millet Upma', image: 'millet-upma.jpg' },
    { name: 'Millet Salad', image: 'millet-salad.jpg' }
  ];

  
  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private cart: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: cats => (this.categories = cats),
      error: () => (this.categories = [])
    });
    this.productService.getProducts({ popular: true }).subscribe({
      next: prods => (this.popularProducts = prods),
      error: () => (this.popularProducts = [])
    });
  }

  goToCategory(slug: string) {
    this.router.navigate(['/products/category', slug]);
  }

  goToProduct(slug: string) {
    this.router.navigate(['/product', slug]);
  }

  addToCart(product: Product, event: Event) {
    event.stopPropagation();
    if (product.stock <= 0) return;
    this.cart.addToCart(product, 1);
  }
}
