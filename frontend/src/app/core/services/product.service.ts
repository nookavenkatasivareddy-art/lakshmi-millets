import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './config';
import { Product } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  // ---------------- Public (storefront) ----------------

  getProducts(params: { category?: string; popular?: boolean; search?: string; inStock?: boolean } = {}): Observable<Product[]> {
    let url = `${API_BASE_URL}/products?`;
    if (params.category) url += `category=${params.category}&`;
    if (params.popular) url += `popular=true&`;
    if (params.search) url += `search=${encodeURIComponent(params.search)}&`;
    if (params.inStock) url += `inStock=true&`;
    return this.http.get<Product[]>(url);
  }

  getProduct(slug: string): Observable<Product> {
    return this.http.get<Product>(`${API_BASE_URL}/products/${slug}`);
  }

  // ---------------- Admin (requires an admin-role JWT; AuthInterceptor attaches it) ----------------

  createProduct(data: Partial<Product> & { categoryId?: string; categorySlug?: string }): Observable<Product> {
    return this.http.post<Product>(`${API_BASE_URL}/products`, data);
  }

  updateProduct(id: string, data: Partial<Product> & { categoryId?: string; categorySlug?: string }): Observable<Product> {
    return this.http.put<Product>(`${API_BASE_URL}/products/${id}`, data);
  }

  deleteProduct(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${API_BASE_URL}/products/${id}`);
  }

  // Quick stock update: pass either an exact value ({ stock: 25 }) or an
  // adjustment ({ delta: -3 }).
  updateStock(id: string, change: { stock?: number; delta?: number }): Observable<{ id: string; stock: number; inStock: boolean }> {
    return this.http.patch<{ id: string; stock: number; inStock: boolean }>(`${API_BASE_URL}/products/${id}/stock`, change);
  }

  // Uploads an image file and returns the URL to save into product.image.
  uploadImage(file: File, type: 'products' | 'categories' = 'products'): Observable<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ url: string; filename: string }>(`${API_BASE_URL}/uploads/image?type=${type}`, formData);
  }
}
