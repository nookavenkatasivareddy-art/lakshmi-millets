import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './config';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/admin/dashboard-stats`);
  }

  getSalesData(range: string): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/admin/sales?range=${range}`);
  }

  getUnreadNotificationsCount(): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/admin/notifications/unread-count`);
  }

  getUnreadMessagesCount(): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/admin/messages/unread-count`);
  }

  // Orders
  getAdminOrders(params: { page?: number; limit?: number; status?: string; search?: string } = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<any>(`${API_BASE_URL}/admin/orders`, { params: httpParams });
  }

  updateOrderStatus(id: string, orderStatus: string, paymentStatus?: string): Observable<any> {
    const body: any = { orderStatus };
    if (paymentStatus) body.paymentStatus = paymentStatus;
    return this.http.patch(`${API_BASE_URL}/orders/${id}/status`, body);
  }

  // Products
  getAdminProducts(params: { page?: number; limit?: number; search?: string; category?: string; status?: string } = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<any>(`${API_BASE_URL}/admin/products`, { params: httpParams });
  }

  createProduct(data: any): Observable<any> {
    return this.http.post(`${API_BASE_URL}/products`, data);
  }

  updateProduct(id: string, data: any): Observable<any> {
    return this.http.put(`${API_BASE_URL}/products/${id}`, data);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${API_BASE_URL}/products/${id}`);
  }

  // Categories
  getAdminCategories(): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/admin/categories`);
  }

  getBrands(): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/brands`);
  }

  getProductTypes(): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/product-types`);
  }

  createCategory(data: any): Observable<any> {
    return this.http.post(`${API_BASE_URL}/categories`, data);
  }

  updateCategory(id: string, data: any): Observable<any> {
    return this.http.put(`${API_BASE_URL}/categories/${id}`, data);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${API_BASE_URL}/categories/${id}`);
  }

  // Users
  getAdminUsers(params: { page?: number; limit?: number; search?: string } = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<any>(`${API_BASE_URL}/admin/users`, { params: httpParams });
  }

  getAdminUser(id: string): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/admin/users/${id}`);
  }

  updateUserStatus(id: string, data: any): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/admin/users/${id}/status`, data);
  }

  // Messages
  getAdminMessages(params: { page?: number; limit?: number; read?: string } = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.read !== undefined) httpParams = httpParams.set('read', String(params.read));
    return this.http.get<any>(`${API_BASE_URL}/admin/messages`, { params: httpParams });
  }

  markMessageRead(id: string): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/admin/messages/${id}/read`, {});
  }

  markMessageUnread(id: string): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/admin/messages/${id}/unread`, {});
  }

  deleteMessage(id: string): Observable<any> {
    return this.http.delete(`${API_BASE_URL}/admin/messages/${id}`);
  }

  // Notifications
  getAdminNotifications(params: { page?: number; limit?: number } = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<any>(`${API_BASE_URL}/admin/notifications`, { params: httpParams });
  }

  markNotificationRead(id: string): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/admin/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/admin/notifications/read-all`, {});
  }

  deleteNotification(id: string): Observable<any> {
    return this.http.delete(`${API_BASE_URL}/admin/notifications/${id}`);
  }

  // Reviews
  getAdminReviews(params: { page?: number; limit?: number; status?: string; search?: string } = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<any>(`${API_BASE_URL}/admin/reviews`, { params: httpParams });
  }

  approveReview(id: string): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/admin/reviews/${id}/approve`, {});
  }

  rejectReview(id: string): Observable<any> {
    return this.http.patch(`${API_BASE_URL}/admin/reviews/${id}/reject`, {});
  }

  deleteReview(id: string): Observable<any> {
    return this.http.delete(`${API_BASE_URL}/admin/reviews/${id}`);
  }

  // Invoices
  getAdminInvoices(params: { page?: number; limit?: number; search?: string } = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<any>(`${API_BASE_URL}/admin/invoices`, { params: httpParams });
  }

  // Settings
  getSettings(): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/admin/settings`);
  }

  saveSettings(key: string, value: any): Observable<any> {
    return this.http.put(`${API_BASE_URL}/admin/settings`, { key, value });
  }
}
