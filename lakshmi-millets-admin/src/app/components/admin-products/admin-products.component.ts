import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { AdminLayoutComponent } from '../admin-layout/admin-layout.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.css']
})
export class AdminProductsComponent implements OnInit {
  products: any[] = [];
  loading = true;
  errorMsg = '';
  search = '';
  page = 1;
  totalPages = 1;
  total = 0;
  showAddForm = false;
  isEditing = false;
  editId = '';
  categories: any[] = [];
  brands: any[] = [];
  productTypes: any[] = [];

  productForm = {
    name: '', slug: '', categoryId: '', brandId: '', productTypeId: '',
    price: null as any, mrp: null as any,
    weight: '', stock: 0, description: '', image: '',
    isPopular: false, isFeatured: false
  };

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadBrands();
    this.loadProductTypes();
    this.loadProducts();
  }

  getProductImage(p: any): string {
    if (p.image) {
      if (p.image.startsWith('/')) return p.image;
      return `/uploads/products/${p.image}`;
    }
    return 'assets/images/millet-bowl.png';
  }

  loadCategories(): void {
    this.adminService.getAdminCategories().subscribe({
      next: res => { this.categories = res?.categories || []; },
      error: () => { this.categories = []; }
    });
  }

  loadBrands(): void {
    this.adminService.getBrands().subscribe({
      next: res => {
        this.brands = res?.brands || res || [];
      },
      error: () => {
        this.brands = [];
      }
    });
  }

  loadProductTypes(): void {
    this.adminService.getProductTypes().subscribe({
      next: res => {
        this.productTypes = res?.productTypes || res || [];
      },
      error: () => {
        this.productTypes = [];
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.adminService.getAdminProducts({ page: this.page, search: this.search }).subscribe({
      next: res => {
        this.products = res?.products || [];
        this.total = res?.total || 0;
        this.totalPages = res?.totalPages || 1;
        this.loading = false;
      },
      error: err => { this.errorMsg = err.error?.message || 'Failed to load products'; this.loading = false; }
    });
  }

  onSearch(): void { this.page = 1; this.loadProducts(); }

  goToPage(p: number): void { this.page = p; this.loadProducts(); }

  openAddForm(): void {
    this.showAddForm = true;
    this.isEditing = false;
    this.productForm = {
      name: '', slug: '', categoryId: '', brandId: '', productTypeId: '',
      price: null, mrp: null, weight: '', stock: 0, description: '', image: '',
      isPopular: false, isFeatured: false
    };
  }

  closeAddForm(): void { this.showAddForm = false; }

  saveProduct(): void {
    if (!this.productForm.name || this.productForm.price == null || this.productForm.mrp == null) return;
    if (this.isEditing) {
      this.adminService.updateProduct(this.editId, this.productForm).subscribe({
        next: () => { this.showAddForm = false; this.loadProducts(); },
        error: err => alert(err.error?.message || 'Failed to update')
      });
    } else {
      this.adminService.createProduct(this.productForm).subscribe({
        next: () => { this.showAddForm = false; this.loadProducts(); },
        error: err => alert(err.error?.message || 'Failed to create')
      });
    }
  }

  editProduct(p: any): void {
    this.isEditing = true;
    this.editId = p.id;
    this.productForm = {
      ...p,
      categoryId: p.category?.id || p.categoryId || '',
      brandId: p.brandId || '',
      productTypeId: p.productTypeId || '',
      isFeatured: !!p.isFeatured
    };
    this.showAddForm = true;
  }

  deleteProduct(p: any): void {
    if (!confirm(`Delete "${p.name}"?`)) return;
    this.adminService.deleteProduct(p.id).subscribe({
      next: () => this.loadProducts(),
      error: err => alert(err.error?.message || 'Failed to delete')
    });
  }
}
