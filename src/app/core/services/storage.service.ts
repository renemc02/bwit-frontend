import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string): T | null { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; } }
  set<T>(key: string, v: T): void { try { localStorage.setItem(key, JSON.stringify(v)); } catch { console.warn(`[Storage] No se pudo guardar: ${key}`); } }
  remove(key: string): void { localStorage.removeItem(key); }
  has(key: string): boolean { return localStorage.getItem(key) !== null; }
  getString(key: string): string | null { return localStorage.getItem(key); }
  setString(key: string, v: string): void { localStorage.setItem(key, v); }
}
