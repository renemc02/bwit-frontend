import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ModulePermission { Modulo: string; PuedeVer: boolean; PuedeEditar: boolean; }

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private http = inject(HttpClient);
  private _permisos = signal<ModulePermission[]>([]);
  private _loaded = signal(false);
  private _isAdmin = signal(false);

  readonly loaded = this._loaded.asReadonly();
  readonly permisos = this._permisos.asReadonly();
  readonly isAdmin = this._isAdmin.asReadonly();

  cargar(rol?: string) {
    const r = (rol || '').toLowerCase();
    const esAdmin = r === 'administrador' || r === 'admin';
    this._isAdmin.set(esAdmin);
    if (esAdmin) {
      this._loaded.set(true);
      return;
    }
    this.http.get<any>('/api/mi/permisos').subscribe({
      next: (res: any) => {
        const data = res?.Data ?? res?.data ?? res ?? [];
        const perms: ModulePermission[] = Array.isArray(data) ? data : [];
        this._permisos.set(perms);
        this._loaded.set(true);
      },
      error: (err) => {
        this._permisos.set([]);
        this._loaded.set(true);
      }
    });
  }

  puedeVer(modulo: string): boolean {
    if (this._isAdmin()) return true;
    if (!this._loaded()) return true; // Aún no cargados — no bloquear
    const p = this._permisos().find(x => x.Modulo === modulo);
    return p?.PuedeVer ?? false;
  }

  puedeEditar(modulo: string): boolean {
    if (this._isAdmin()) return true;
    if (!this._loaded()) return false;
    const p = this._permisos().find(x => x.Modulo === modulo);
    return p?.PuedeEditar ?? false;
  }

  clear() {
    this._permisos.set([]);
    this._loaded.set(false);
    this._isAdmin.set(false);
  }
}
