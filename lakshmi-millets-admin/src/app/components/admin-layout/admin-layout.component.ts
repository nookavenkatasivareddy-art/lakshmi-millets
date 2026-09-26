import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  unreadNotifications = 0;
  unreadMessages = 0;
  sidebarOpen = false;
  activeRoute = 'dashboard';
  private sub!: Subscription;

  navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'orders', label: 'Orders', icon: '🛒' },
    { key: 'products', label: 'Products', icon: '📦' },
    { key: 'categories', label: 'Categories', icon: '🏷️' },
    { key: 'invoices', label: 'Invoices', icon: '🧾' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'messages', label: 'Messages', icon: '✉️', badge: 'unreadMessages' },
    { key: 'notifications', label: 'Notifications', icon: '🔔', badge: 'unreadNotifications' },
    { key: 'reviews', label: 'Reviews', icon: '⭐' },
    { key: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  constructor(
    private auth: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.currentUser;
    this.auth.currentUser$.subscribe(u => { this.currentUser = u; });

    this.sub = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        const path = e.urlAfterRedirects;
        const parts = path.split('/');
        this.activeRoute = parts[2] || 'dashboard';
        this.sidebarOpen = false;
        this.loadBadges();
      }
    });

    this.loadBadges();
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  loadBadges(): void {
    this.adminService.getUnreadNotificationsCount().subscribe({
      next: res => { this.unreadNotifications = res?.unreadCount || 0; },
      error: () => {}
    });
    this.adminService.getUnreadMessagesCount().subscribe({
      next: res => { this.unreadMessages = res?.unreadCount || 0; },
      error: () => {}
    });
  }

  isActive(key: string): boolean {
    return this.activeRoute === key;
  }

  navigateTo(key: string): void {
  this.router.navigate([key]);
}

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
  this.auth.logout();
  window.location.href = '/admin/login';
}
}
