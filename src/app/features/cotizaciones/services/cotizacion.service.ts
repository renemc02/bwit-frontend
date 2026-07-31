import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/http/api.service';
import { API } from '../../../core/http/endpoints';
@Injectable({ providedIn: 'root' })
export class CotizacionService {
  private api = inject(ApiService);
  listar(p?: any)                      { return this.api.getPaged<any[]>(API.cotizaciones.base, p); }
  getById(id: number)                  { return this.api.get<any>(API.cotizaciones.byId(id)); }
  crear(body: any)                     { return this.api.post<any>(API.cotizaciones.base, body); }
  cambiarEstado(id: number, body: any) { return this.api.patch<any>(API.cotizaciones.estado(id), body); }
  convertir(id: number, body: any)     { return this.api.post<any>(API.cotizaciones.convertir(id), body); }
  actualizar(id: number, body: any)    { return this.api.put<any>(API.cotizaciones.update(id), body); }
  responsablesDisponibles()            { return this.api.get<any[]>(API.cotizaciones.responsablesDisponibles); }
}
