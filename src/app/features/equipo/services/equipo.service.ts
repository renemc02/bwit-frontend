import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/http/api.service';
import { API } from '../../../core/http/endpoints';
@Injectable({ providedIn: 'root' })
export class EquipoService {
  private api = inject(ApiService);
  listar(p?: any)                   { return this.api.getPaged<any[]>(API.equipo.base, p); }
  getById(id: number)               { return this.api.get<any>(API.equipo.byId(id)); }
  crear(body: any)                  { return this.api.post<any>(API.equipo.base, body); }
  actualizar(id: number, body: any) { return this.api.put<any>(API.equipo.byId(id), body); }
}
