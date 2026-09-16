import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  loading = true;
  errorMsg = '';
  search = '';
  page = 1;
  totalPages = 1;
  total = 0;
  selectedUser: any = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.loadUsers(); }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getAdminUsers({ page: this.page, search: this.search }).subscribe({
      next: res => {
        this.users = res?.users || [];
        this.total = res?.total || 0;
        this.totalPages = res?.totalPages || 1;
        this.loading = false;
      },
      error: err => { this.errorMsg = err.error?.message || 'Failed to load'; this.loading = false; }
    });
  }

  onSearch(): void { this.page = 1; this.loadUsers(); }

  goToPage(p: number): void { this.page = p; this.loadUsers(); }

  openUser(u: any): void { this.selectedUser = u; }

  closeUser(): void { this.selectedUser = null; }

  formatPrice(n: number): string { return '₹' + (Number(n) || 0).toLocaleString('en-IN'); }

  /** Last-8-char uppercase order id label (template helper — String() is not available in templates). */
  orderLabel(o: any): string {
    const raw = String(o?.id || o?._id || '');
    return raw ? raw.slice(-8).toUpperCase() : '';
  }
}
