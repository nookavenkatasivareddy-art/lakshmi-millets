import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './config';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/admin/dashboard-stats`);
  }

  getSales(range: string): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/admin/sales?range=${range}`);
  }

  getRecentOrders(limit: number = 5): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/orders?limit=${limit}&admin=true`);
  }
}
