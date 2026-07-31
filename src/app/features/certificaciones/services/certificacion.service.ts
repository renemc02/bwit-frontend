import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/http/api.service';
import { API } from '../../../core/http/endpoints';
@Injectable({ providedIn: 'root' })
export class CertificacionService {
  private api = inject(ApiService);
  listar(p?: any)                      { return this.api.getPaged<any[]>(API.certificaciones.base, p); }
  getById(id: number)                  { return this.api.get<any>(API.certificaciones.byId(id)); }
  crear(body: any)                     { return this.api.post<any>(API.certificaciones.base, body); }
  cambiarEstado(id: number, body: any) { return this.api.patch<any>(API.certificaciones.estado(id), body); }
  aprobar(id: number, body: any)       { return this.api.post<any>(API.certificaciones.aprobar(id), body); }
}
