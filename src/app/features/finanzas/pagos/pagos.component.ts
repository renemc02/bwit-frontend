import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/http/api.service';
import { TopbarComponent } from '../../../core/layout/topbar/topbar.component';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';

@Component({
  selector: 'bwit-pagos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TopbarComponent, UiLoadingComponent],
  templateUrl: './pagos.component.html',
  styleUrl: './pagos.component.scss',
})
export class PagosComponent implements OnInit {
  private api    = inject(ApiService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  loading   = signal(true);
  tab       = signal<'terceros' | 'equipo' | 'cobros'>('terceros');
  filtro    = signal<string>('');   // '' = todos

  tercerizados = signal<any[]>([]);
  pagosEquipo  = signal<any[]>([]);
  cobros       = signal<any[]>([]);

  // KPIs cobros
  totalCobrado = computed(() => this.cobros().reduce((s, c) => s + Number(c.Monto || 0), 0));

  // Modal detalle
  modalDetalle = signal(false);
  detalleTipo: 'tercero' | 'equipo' | 'cobro' = 'tercero';
  detalle: any = null;

  verDetalle(row: any, tipo: 'tercero' | 'equipo' | 'cobro') {
    this.detalle = row;
    this.detalleTipo = tipo;
    this.modalDetalle.set(true);
  }

  // KPIs terceros
  totalTerceros   = computed(() => this.tercerizados().reduce((s, t) => s + Number(t.Costo || 0), 0));
  pagadoTerceros  = computed(() => this.tercerizados().reduce((s, t) => s + Number(t.TotalPagado || 0), 0));
  saldoTerceros   = computed(() => this.tercerizados().reduce((s, t) => s + Number(t.Saldo || 0), 0));

  // KPIs equipo
  totalEquipo     = computed(() => this.pagosEquipo().reduce((s, p) => s + Number(p.Monto || 0), 0));
  pagadoEquipo    = computed(() => this.pagosEquipo().filter(p => p.Pagado).reduce((s, p) => s + Number(p.Monto || 0), 0));
  pendienteEquipo = computed(() => this.pagosEquipo().filter(p => !p.Pagado).reduce((s, p) => s + Number(p.Monto || 0), 0));

  tercerizadosFiltrados = computed(() => {
    const f = this.filtro();
    if (!f) return this.tercerizados();
    if (f === 'Pagada')   return this.tercerizados().filter(t => t.Pagado);
    if (f === 'Parcial')  return this.tercerizados().filter(t => !t.Pagado && (t.TotalPagado ?? 0) > 0);
    if (f === 'PorPagar') return this.tercerizados().filter(t => !t.Pagado && (t.TotalPagado ?? 0) === 0);
    return this.tercerizados();
  });

  pagosEquipoFiltrados = computed(() => {
    const f = this.filtro();
    if (!f) return this.pagosEquipo();
    if (f === 'Pagado')     return this.pagosEquipo().filter(p => p.Pagado);
    if (f === 'Programado') return this.pagosEquipo().filter(p => !p.Pagado);
    return this.pagosEquipo();
  });

  ngOnInit() {
    // Tab desde la ruta: /pagos/terceros | /pagos/equipo | /pagos/cobros
    this.route.paramMap.subscribe(pm => {
      const t = pm.get('tab');
      if (t === 'terceros' || t === 'equipo' || t === 'cobros') this.tab.set(t);
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.get<any>('/api/finanzas/tercerizados').subscribe({
      next: (r: any) => { this.tercerizados.set(r?.data ?? r ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<any>('/api/finanzas/pagos-equipo').subscribe({
      next: (r: any) => this.pagosEquipo.set(r?.data ?? r ?? []),
      error: () => {},
    });
    this.api.get<any>('/api/finanzas/cobros').subscribe({
      next: (r: any) => this.cobros.set(r?.data ?? r ?? []),
      error: () => {},
    });
  }

  setTab(t: 'terceros' | 'equipo' | 'cobros') {
    this.tab.set(t);
    this.filtro.set('');
    this.router.navigate(['/pagos', t]);
  }
  setFiltro(f: string) { this.filtro.set(this.filtro() === f ? '' : f); }

  irAProyecto(row: any, tabDestino: string) {
    this.router.navigate(['/proyectos', row.ProyectoId], { queryParams: { tab: tabDestino } });
  }
}
