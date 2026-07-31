// ════════════════════════════════════════════════
// features/clientes/services/contacto.service.ts
// CRUD de contactos de un cliente
// ════════════════════════════════════════════════
import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/http/api.service';

const B = '/api/clientes';

export interface Contacto {
  Id: number;
  ClienteId: number;
  Nombre: string;
  Cargo?: string;
  Celular?: string;
  TelefonoFijo?: string;
  Email?: string;
  EsPrincipal: boolean;
  Notas?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactoService {
  private api = inject(ApiService);

  listar(clienteId: number) {
    return this.api.get<Contacto[]>(`${B}/${clienteId}/contactos`);
  }
  crear(clienteId: number, body: Partial<Contacto>) {
    return this.api.post<any>(`${B}/${clienteId}/contactos`, body);
  }
  actualizar(clienteId: number, id: number, body: Partial<Contacto>) {
    return this.api.put<any>(`${B}/${clienteId}/contactos/${id}`, body);
  }
  eliminar(clienteId: number, id: number) {
    return this.api.delete<any>(`${B}/${clienteId}/contactos/${id}`);
  }
}
