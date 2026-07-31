import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/http/api.service';

@Injectable({ providedIn: 'root' })
export class AdendaService {
  private api = inject(ApiService);
  private base = (proyectoId: number) => `/api/proyectos/${proyectoId}/adendas`;

  listar(proyectoId: number) {
    return this.api.get<any[]>(this.base(proyectoId));
  }
  crear(proyectoId: number, body: any) {
    return this.api.post<any>(this.base(proyectoId), body);
  }
  aprobar(proyectoId: number, id: number, body: any) {
    return this.api.post<any>(`${this.base(proyectoId)}/${id}/aprobar`, body);
  }
}
