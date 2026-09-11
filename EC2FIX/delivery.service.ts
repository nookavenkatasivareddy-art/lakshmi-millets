import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from './config';
import { DeliveryLocation } from '../models/models';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  locations: DeliveryLocation[] = [];

  constructor(private http: HttpClient) {}

  getLocations(): Observable<DeliveryLocation[]> {
    return this.http
      .get<DeliveryLocation[]>(`${API_BASE_URL}/delivery-locations`)
      .pipe(tap((locs) => { this.locations = locs; }));
  }
}
