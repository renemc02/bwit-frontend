import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/http/api.service';
import { API } from '../../../core/http/endpoints';
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private api = inject(ApiService);
  listar(p?: any)                   { return this.api.getPaged<any[]>(API.clientes.base, p); }
  getById(id: number)               { return this.api.get<any>(API.clientes.byId(id)); }
  crear(body: any)                  { return this.api.post<any>(API.clientes.base, body); }
  actualizar(id: number, body: any) { return this.api.put<any>(API.clientes.byId(id), body); }
  eliminar(id: number)              { return this.api.delete<any>(API.clientes.byId(id)); }
}
