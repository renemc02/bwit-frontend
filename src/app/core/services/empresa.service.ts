// ════════════════════════════════════════════════
// core/services/empresa.service.ts
// Carga empresas reales desde /api/empresas + gestiona empresa activa
// ════════════════════════════════════════════════
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { StorageService } from './storage.service';

export interface EmpresaItem {
  EmpresaId:     number;
  EmpresaNombre: string;   // NombreComercial o RazonSocial
  RazonSocial:   string;
  Ruc?:          string;
  Principal?:    boolean;
  Color?:        string;
}

const KEY_ACTIVA = 'bwit_empresa_activa';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly storage = inject(StorageService);
  private readonly http    = inject(HttpClient);
  private readonly router  = inject(Router);

  private _empresas = signal<EmpresaItem[]>([]);
  private _activa   = signal<EmpresaItem | null>(null);

  readonly empresas           = this._empresas.asReadonly();
  readonly activa             = this._activa.asReadonly();
  readonly todasSeleccionadas = computed(() => this._activa() === null);

  /** Id de la empresa activa (null = todas/consolidado) */
  readonly empresaIdActiva = computed(() => this._activa()?.EmpresaId ?? null);

  readonly displayNombre = computed(() =>
    this._activa()?.EmpresaNombre ?? 'Todas las empresas'
  );
  readonly displayRuc = computed(() => {
    const a = this._activa();
    if (a?.Ruc) return 'RUC ' + a.Ruc;
    const n = this._empresas().length;
    return `${n} ${n === 1 ? 'razón social' : 'razones sociales'}`;
  });
  readonly initials = computed(() => {
    const n = this._activa()?.EmpresaNombre ?? 'Todas';
    return n.split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase();
  });
  readonly colorActiva = computed(() => this._activa()?.Color ?? null);

  /** Cargar empresas desde el API. Llamar tras login o al iniciar. */
  cargar(): void {
    this.http.get<any>('/api/empresas').pipe(
      map(r => (r?.Data ?? []) as any[])
    ).subscribe({
      next: data => {
        const lista: EmpresaItem[] = data.map(e => ({
          EmpresaId:     e.Id,
          EmpresaNombre: e.NombreComercial || e.RazonSocial,
          RazonSocial:   e.RazonSocial,
          Ruc:           e.Ruc,
          Principal:     e.EsPrincipal,
          Color:         e.ColorHex,
        }));
        this._empresas.set(lista);

        // Restaurar empresa activa guardada (validando que aún exista)
        const guardada = this.storage.get<EmpresaItem>(KEY_ACTIVA);
        if (guardada && lista.some(e => e.EmpresaId === guardada.EmpresaId)) {
          this._activa.set(lista.find(e => e.EmpresaId === guardada.EmpresaId)!);
        } else {
          this._activa.set(null); // por defecto: todas
        }
      },
      error: () => { this._empresas.set([]); }
    });
  }

  seleccionar(empresa: EmpresaItem | null): void {
    this._activa.set(empresa);
    if (empresa) this.storage.set(KEY_ACTIVA, empresa);
    else         this.storage.remove(KEY_ACTIVA);
    // Recargar la vista actual para que los datos se filtren por la nueva empresa
    this.recargarRutaActual();
  }

  private recargarRutaActual(): void {
    const url = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true })
      .then(() => this.router.navigateByUrl(url));
  }

  clear(): void {
    this._empresas.set([]);
    this._activa.set(null);
    this.storage.remove(KEY_ACTIVA);
  }
}
