import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/http/api.service';
import { API } from '../../../core/http/endpoints';
@Injectable({ providedIn: 'root' })
export class FacturaService {
  private api = inject(ApiService);
  listar(p?: any)                   { return this.api.getPaged<any[]>(API.facturas.base, p); }
  getById(id: number)               { return this.api.get<any>(API.facturas.byId(id)); }
  crear(body: any)                  { return this.api.post<any>(API.facturas.base, body); }
  anular(id: number, body: any)     { return this.api.patch<any>(API.facturas.anular(id), body); }
  registrarPago(body: any)          { return this.api.post<any>(API.facturas.pagos, body); }
  aprobar(id: number, body: any)    { return this.api.post<any>(API.facturas.aprobar(id), body); }
  historial(id: number)             { return this.api.get<any[]>(API.facturas.historial(id)); }
  listarNotasCredito(id: number)    { return this.api.get<any[]>(API.facturas.notasCredito(id)); }
  crearNotaCredito(id: number, body: any) { return this.api.post<any>(API.facturas.notasCredito(id), body); }
  itemsCreditables(id: number)      { return this.api.get<any[]>(API.facturas.itemsCreditables(id)); }
}
