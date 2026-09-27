import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { WishlistService } from '../../core/services/wishlist.service';
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
    sortBy = '';
  showFilters = false;
  showSort = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private cart: CartService,
    private wishlist: WishlistService,
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

  this.productService.getProducts({
    category: this.activeCategory,
    search: this.searchTerm
  }).subscribe({
    next: p => {
      this.products = p;
      this.applySort();
      this.loading = false;
    },
    error: () => {
      this.products = [];
      this.loading = false;
    }
  });
}

  setSort(sort: string): void {
    this.sortBy = sort;
    this.showSort = false;
    this.applySort();
  }

  applySort(): void {
    if (this.sortBy === 'price-low') {
      this.products.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (this.sortBy === 'price-high') {
      this.products.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (this.sortBy === 'name-az') {
      this.products.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortBy === 'name-za') {
      this.products.sort((a, b) => b.name.localeCompare(a.name));
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    this.showSort = false;
  }

  toggleSort(): void {
    this.showSort = !this.showSort;
    this.showFilters = false;
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
  toggleWishlist(product: Product, event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  this.wishlist.toggle(product);
}

isInWishlist(product: Product): boolean {
  return this.wishlist.isInWishlist(product.id);
}

}
