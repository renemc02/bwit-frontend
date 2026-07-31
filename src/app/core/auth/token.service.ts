import { Injectable } from '@angular/core';
import { LoginResponse } from './models/auth.models';

const K = { ACCESS: 'bwit_access', REFRESH: 'bwit_refresh', USER: 'bwit_user' } as const;

@Injectable({ providedIn: 'root' })
export class TokenService {
  getAccessToken():  string | null  { return localStorage.getItem(K.ACCESS); }
  getRefreshToken(): string | null  { return localStorage.getItem(K.REFRESH); }
  getUser(): LoginResponse | null {
    try { const r = localStorage.getItem(K.USER); return r ? JSON.parse(r) : null; }
    catch { return null; }
  }
  save(d: LoginResponse): void {
    localStorage.setItem(K.ACCESS,  d.AccessToken);
    localStorage.setItem(K.REFRESH, d.RefreshToken);
    localStorage.setItem(K.USER,    JSON.stringify(d));
  }
  clear(): void { Object.values(K).forEach(k => localStorage.removeItem(k)); }
  hasToken(): boolean { return !!this.getAccessToken(); }
  isExpired(): boolean {
    const u = this.getUser();
    return !u?.ExpiresAt || new Date(u.ExpiresAt) <= new Date();
  }
}
