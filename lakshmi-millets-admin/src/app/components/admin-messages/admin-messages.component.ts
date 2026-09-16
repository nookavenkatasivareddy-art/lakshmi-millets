import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-messages.component.html',
  styleUrls: ['./admin-messages.component.css']
})
export class AdminMessagesComponent implements OnInit {
  messages: any[] = [];
  loading = true;
  errorMsg = '';
  page = 1;
  totalPages = 1;
  total = 0;
  selectedMessage: any = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.loadMessages(); }

  loadMessages(): void {
    this.loading = true;
    this.adminService.getAdminMessages({ page: this.page }).subscribe({
      next: res => {
        this.messages = res?.messages || [];
        this.total = res?.total || 0;
        this.totalPages = res?.totalPages || 1;
        this.loading = false;
      },
      error: err => { this.errorMsg = err.error?.message || 'Failed to load'; this.loading = false; }
    });
  }

  goToPage(p: number): void { this.page = p; this.loadMessages(); }

  openMessage(m: any): void { this.selectedMessage = m; }

  closeMessage(): void { this.selectedMessage = null; }

  markRead(id: string): void {
    this.adminService.markMessageRead(id).subscribe({
      next: () => {
        if (this.selectedMessage?.id === id) this.selectedMessage.isRead = true;
        this.loadMessages();
      },
      error: () => {}
    });
  }

  markUnread(id: string): void {
    this.adminService.markMessageUnread(id).subscribe({
      next: () => {
        if (this.selectedMessage?.id === id) this.selectedMessage.isRead = false;
        this.loadMessages();
      },
      error: () => {}
    });
  }

  deleteMessage(id: string): void {
    if (!confirm('Delete this message?')) return;
    this.adminService.deleteMessage(id).subscribe({
      next: () => {
        if (this.selectedMessage?.id === id) this.selectedMessage = null;
        this.loadMessages();
      },
      error: () => {}
    });
  }

  stopClick(event: Event): void { event.stopPropagation(); }
}
