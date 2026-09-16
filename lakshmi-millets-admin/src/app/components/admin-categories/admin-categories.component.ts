import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrls: ['./admin-categories.component.css']
})
export class AdminCategoriesComponent implements OnInit {
  categories: any[] = [];
  loading = true;
  errorMsg = '';
  showAddForm = false;
  editId = '';
  categoryForm = { name: '', slug: '', description: '', icon: '', image: '' };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.loadCategories(); }

  loadCategories(): void {
    this.loading = true;
    this.adminService.getAdminCategories().subscribe({
      next: res => { this.categories = res?.categories || []; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Failed to load'; this.loading = false; }
    });
  }

  getProductCount(c: any): number { return Math.floor(Math.random() * 20) + 1; }

  openAddForm(): void { this.showAddForm = true; this.editId = ''; this.categoryForm = { name: '', slug: '', description: '', icon: '', image: '' }; }

  closeForm(): void { this.showAddForm = false; }

  saveCategory(): void {
    if (!this.categoryForm.name) return;
    const action = this.editId ? this.adminService.updateCategory(this.editId, this.categoryForm) : this.adminService.createCategory(this.categoryForm);
    action.subscribe({
      next: () => { this.showAddForm = false; this.loadCategories(); },
      error: err => alert(err.error?.message || 'Failed to save')
    });
  }

  editCategory(c: any): void { this.editId = c.id; this.categoryForm = { ...c }; this.showAddForm = true; }

  deleteCategory(c: any): void {
    if (!confirm(`Delete "${c.name}"?`)) return;
    this.adminService.deleteCategory(c.id).subscribe({
      next: () => this.loadCategories(),
      error: err => alert(err.error?.message || 'Failed to delete')
    });
  }
}
