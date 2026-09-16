import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL } from './config';
import { AuthUser } from '../models/models';

interface AuthResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(public http: HttpClient) {}

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem('lm_user');
    return raw ? JSON.parse(raw) : null;
  }

  register(name: string, email: string, phone: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register`, { name, email, phone, password })
      .pipe(tap(res => this.setSession(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, { email, password })
      .pipe(tap(res => this.setSession(res)));
  }

  getMe(): Observable<{ user: AuthUser }> {
    return this.http.get<{ user: AuthUser }>(`${API_BASE_URL}/auth/me`);
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem('lm_token', res.token);
    localStorage.setItem('lm_user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  logout() {
    localStorage.removeItem('lm_token');
    localStorage.removeItem('lm_user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('lm_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }
}
