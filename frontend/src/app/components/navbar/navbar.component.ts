import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CategoryService } from '../../core/services/category.service';
import { Category, AuthUser } from '../../core/models/models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  categories: Category[] = [];
  cartCount = 0;
  currentUser: AuthUser | null = null;

  searchTerm = '';
  showSearch = false;
  showProductsMenu = false;
  showAccountMenu = false;
  mobileMenuOpen = false;

  showCategoryPicker = false;
  selectedCategoryName = 'All Categories';
  selectedCategorySlug: string | null = null;

  get categoryOptions(): string[] {
    return ['All Categories', ...this.categories.map(c => c.name)];
  }

  get firstName(): string {
    return (this.currentUser?.name || '').split(' ')[0] || '';
  }

  constructor(
    private auth: AuthService,
    private cart: CartService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: cats => (this.categories = cats),
      error: () => (this.categories = [])
    });
    this.cart.items$.subscribe(items => {
      this.cartCount = items.reduce((s, i) => s + i.quantity, 0);
    });
    this.auth.currentUser$.subscribe(u => (this.currentUser = u));
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.showCategoryPicker = false;
    }
  }

  pickCategory(name: string) {
    this.selectedCategoryName = name;
    if (name === 'All Categories') {
      this.selectedCategorySlug = null;
    } else {
      const match = this.categories.find(c => c.name === name);
      this.selectedCategorySlug = match ? match.slug : null;
    }
    this.showCategoryPicker = false;
  }

  onSearch() {
    const queryParams: any = {};
    if (this.searchTerm.trim()) {
      queryParams.search = this.searchTerm.trim();
    }
    if (this.selectedCategorySlug) {
      this.router.navigate(['/products/category', this.selectedCategorySlug], { queryParams });
    } else if (queryParams.search) {
      this.router.navigate(['/products'], { queryParams });
    } else {
      return;
    }
    this.showSearch = false;
    this.showCategoryPicker = false;
    this.mobileMenuOpen = false;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  logout() {
    this.auth.logout();
    this.showAccountMenu = false;
    this.router.navigate(['/']);
  }
}
