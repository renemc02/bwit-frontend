import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/http/api.service';
import { API } from '../../../core/http/endpoints';
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = inject(ApiService);
  getKpis()     { return this.api.get<any>(API.dashboard.kpis); }
  getPipeline() { return this.api.get<any[]>(API.dashboard.pipeline); }
}
