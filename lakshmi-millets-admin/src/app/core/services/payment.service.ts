import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './config';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  createPayment(amount: number, method: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/payment/create`, { amount, method });
  }

  verifyPayment(gatewayOrderId: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/payment/verify`, { gatewayOrderId });
  }
}
