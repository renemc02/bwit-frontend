// ════════════════════════════════════════════════
// features/configuracion/services/maestro.service.ts
// Servicio CRUD genérico para todos los maestros
// ════════════════════════════════════════════════
import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/http/api.service';

@Injectable({ providedIn: 'root' })
export class MaestroService {
  private api = inject(ApiService);

  listar<T>(recurso: string, params?: any) {
    return this.api.getPaged<T[]>(`/api/${recurso}`, params);
  }
  getById<T>(recurso: string, id: number) {
    return this.api.get<T>(`/api/${recurso}/${id}`);
  }
  crear<T>(recurso: string, body: any) {
    return this.api.post<T>(`/api/${recurso}`, body);
  }
  actualizar<T>(recurso: string, id: number, body: any) {
    return this.api.put<T>(`/api/${recurso}/${id}`, body);
  }
  eliminar(recurso: string, id: number) {
    return this.api.delete<any>(`/api/${recurso}/${id}`);
  }
}
