import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/http/api.service';
import { API } from '../../../core/http/endpoints';
@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private api = inject(ApiService);
  listar(p?: any)                     { return this.api.getPaged<any[]>(API.proyectos.base, p); }
  getById(id: number)                 { return this.api.get<any>(API.proyectos.byId(id)); }
  crear(body: any)                    { return this.api.post<any>(API.proyectos.base, body); }
  actualizar(id: number, body: any)   { return this.api.put<any>(API.proyectos.byId(id), body); }
  cambiarEstado(id: number, body: any){ return this.api.patch<any>(API.proyectos.estado(id), body); }
  actualizarProgreso(id: number, body: any){ return this.api.patch<any>(API.proyectos.progreso(id), body); }
}
