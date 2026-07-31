import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/http/api.service';
import { API } from '../../../core/http/endpoints';
@Injectable({ providedIn: 'root' })
export class PipelineService {
  private api = inject(ApiService);
  listar(p?: any)                    { return this.api.getPaged<any[]>(API.pipeline.base, p); }
  crear(body: any)                   { return this.api.post<any>(API.pipeline.base, body); }
  mover(id: number, body: any)       { return this.api.patch<any>(API.pipeline.mover(id), body); }
  actualizar(id: number, body: any)  { return this.api.put<any>(API.pipeline.byId(id), body); }
}
