import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './config';
import { Category } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private http: HttpClient) {}

  // ---------------- Public ----------------

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${API_BASE_URL}/categories`);
  }

  getCategory(slug: string): Observable<Category> {
    return this.http.get<Category>(`${API_BASE_URL}/categories/${slug}`);
  }

  // ---------------- Admin (requires an admin-role JWT) ----------------

  createCategory(data: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${API_BASE_URL}/categories`, data);
  }

  updateCategory(id: string, data: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${API_BASE_URL}/categories/${id}`, data);
  }

  deleteCategory(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${API_BASE_URL}/categories/${id}`);
  }
}
