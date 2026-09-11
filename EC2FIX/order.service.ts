import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './config';
import { CartItem, ShippingAddress } from '../models/models';

export interface PlaceOrderPayload {
  items: CartItem[];
  deliveryLocationId?: string;
  shippingAddress: ShippingAddress;
  paymentMethod: 'COD' | 'CARD' | 'UPI' | 'NETBANKING';
  paymentId?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  placeOrder(payload: PlaceOrderPayload): Observable<any> {
    return this.http.post(`${API_BASE_URL}/orders`, payload);
  }

  getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/orders/my`);
  }
}
