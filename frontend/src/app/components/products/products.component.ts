import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CategoryService } from '../../core/services/category.service';
import { Product, Category } from '../../core/models/models';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  activeCategory = '';
  searchTerm = '';
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private cart: CartService
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({ next: c => (this.categories = c) });

    this.route.paramMap.subscribe(params => {
      this.activeCategory = params.get('slug') || '';
      this.load();
    });
    this.route.queryParamMap.subscribe(qp => {
      this.searchTerm = qp.get('search') || '';
      if (this.searchTerm) this.load();
    });
  }

  load() {
    this.loading = true;
    this.productService.getProducts({ category: this.activeCategory, search: this.searchTerm }).subscribe({
      next: p => { this.products = p; this.loading = false; },
      error: () => { this.products = []; this.loading = false; }
    });
  }

  filterByCategory(slug: string) {
    this.activeCategory = slug;
    this.searchTerm = '';
    this.load();
  }

  addToCart(product: Product) {
    if (product.stock <= 0) return;
    this.cart.addToCart(product, 1);
    this.router.navigate(['/checkout']);
  }
}
