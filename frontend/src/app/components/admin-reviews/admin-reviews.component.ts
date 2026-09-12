import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-reviews',
  templateUrl: './admin-reviews.component.html',
  styleUrls: ['admin-reviews.component.css']
})
export class AdminReviewsComponent implements OnInit {
  reviews: any[] = [];
  loading = true;
  errorMsg = '';
  page = 1;
  totalPages = 1;
  total = 0;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.loadReviews(); }

  loadReviews(): void {
    this.loading = true;
    this.adminService.getAdminReviews({ page: this.page }).subscribe({
      next: res => {
        this.reviews = res?.reviews || [];
        this.total = res?.total || 0;
        this.totalPages = res?.totalPages || 1;
        this.loading = false;
      },
      error: err => { this.errorMsg = err.error?.message || 'Failed to load'; this.loading = false; }
    });
  }

  goToPage(p: number): void { this.page = p; this.loadReviews(); }

  approveReview(id: string): void {
    this.adminService.approveReview(id).subscribe({
      next: () => {
        const r = this.reviews.find(x => x.id === id);
        if (r) r.isApproved = true;
      },
      error: () => {}
    });
  }

  rejectReview(id: string): void {
    this.adminService.rejectReview(id).subscribe({
      next: () => {
        const r = this.reviews.find(x => x.id === id);
        if (r) r.isApproved = false;
      },
      error: () => {}
    });
  }

  deleteReview(id: string): void {
    if (!confirm('Delete this review?')) return;
    this.adminService.deleteReview(id).subscribe({
      next: () => this.loadReviews(),
      error: () => {}
    });
  }

  stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
