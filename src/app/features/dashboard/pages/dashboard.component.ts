import { Component, signal, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TopbarComponent } from '../../../core/layout/topbar/topbar.component';
import { UiEmptyComponent } from '../../../shared/components/ui-empty.component';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { DashboardService } from '../services/dashboard.service';
import { ProyectoService } from '../../proyectos/services/proyecto.service';

@Component({
  selector: 'bwit-dashboard',
  standalone: true,
  imports: [DecimalPipe, RouterLink, TopbarComponent, UiEmptyComponent, UiLoadingComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly dashSvc = inject(DashboardService);
  private readonly proySvc = inject(ProyectoService);

  kpis             = signal<any>(null);
  kpisError        = signal(false);
  proyectos        = signal<any[]>([]);
  loadingKpis      = signal(true);
  loadingProyectos = signal(true);

  readonly kpiLabels = ['Monto Contratado', 'Facturado', 'Cobrado', 'Margen'];

  ngOnInit(): void {
    // KPIs
    this.dashSvc.getKpis().subscribe({
      next:  d => { this.kpis.set(d); this.loadingKpis.set(false); },
      error: () => { this.kpisError.set(true); this.loadingKpis.set(false); }
    });

    // Proyectos activos — sin PageSize ni PageNumber (el SP no los acepta)
    this.proySvc.listar({ estado: 'Activo' }).subscribe({
      next:  d => { this.proyectos.set((d.data ?? []).slice(0, 10)); this.loadingProyectos.set(false); },
      error: () => { this.proyectos.set([]); this.loadingProyectos.set(false); }
    });
  }

  pct(num: number, den: number): string {
    if (!den) return '0';
    return ((num / den) * 100).toFixed(0);
  }
}
