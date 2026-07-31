import { Injectable, signal, computed } from '@angular/core';
export type NotifType = 'success' | 'error' | 'warning' | 'info';
export interface Notification { id: string; type: NotifType; title: string; message?: string; duration: number; }

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _items = signal<Notification[]>([]);
  readonly items  = this._items.asReadonly();
  readonly hasAny = computed(() => this._items().length > 0);

  success(title: string, message?: string, duration = 4000) { this.push({ type: 'success', title, message, duration }); }
  error  (title: string, message?: string, duration = 6000) { this.push({ type: 'error',   title, message, duration }); }
  warning(title: string, message?: string, duration = 5000) { this.push({ type: 'warning', title, message, duration }); }
  info   (title: string, message?: string, duration = 4000) { this.push({ type: 'info',    title, message, duration }); }
  dismiss(id: string) { this._items.update(l => l.filter(n => n.id !== id)); }
  clear() { this._items.set([]); }

  private push(p: Omit<Notification, 'id'>) {
    const id = crypto.randomUUID();
    this._items.update(l => [...l, { id, ...p }]);
    if (p.duration > 0) setTimeout(() => this.dismiss(id), p.duration);
  }
}
