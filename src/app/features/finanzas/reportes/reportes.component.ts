import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/http/api.service';
import { TopbarComponent } from '../../../core/layout/topbar/topbar.component';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';

interface DonaSeg { label: string; valor: number; color: string; pct: number; dash: string; offset: number; }

@Component({
  selector: 'bwit-reportes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TopbarComponent, UiLoadingComponent],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent implements OnInit {
  private api    = inject(ApiService);
  private router = inject(Router);

  loading = signal(true);

  // ── Filtros de fecha (BI) ──
  presetActivo = signal<string>('12m');
  fechaDesde = '';   // yyyy-MM-dd
  fechaHasta = '';
  anioSel: number | null = null;
  mesSel: number | null = null;

  anios: number[] = (() => {
    const y = new Date().getFullYear();
    return [y, y-1, y-2, y-3];
  })();
  meses = [
    { v: 1, n: 'Enero' }, { v: 2, n: 'Febrero' }, { v: 3, n: 'Marzo' },
    { v: 4, n: 'Abril' }, { v: 5, n: 'Mayo' }, { v: 6, n: 'Junio' },
    { v: 7, n: 'Julio' }, { v: 8, n: 'Agosto' }, { v: 9, n: 'Septiembre' },
    { v: 10, n: 'Octubre' }, { v: 11, n: 'Noviembre' }, { v: 12, n: 'Diciembre' },
  ];

  private fmt(d: Date): string { return d.toISOString().split('T')[0]; }

  aplicarPreset(p: string) {
    this.presetActivo.set(p);
    this.anioSel = null; this.mesSel = null;
    const hoy = new Date();
    const y = hoy.getFullYear(), m = hoy.getMonth();
    switch (p) {
      case 'mes':       this.fechaDesde = this.fmt(new Date(y, m, 1));     this.fechaHasta = this.fmt(new Date(y, m + 1, 0)); break;
      case 'mesPasado': this.fechaDesde = this.fmt(new Date(y, m - 1, 1)); this.fechaHasta = this.fmt(new Date(y, m, 0)); break;
      case 'trimestre': { const qm = Math.floor(m / 3) * 3;
                          this.fechaDesde = this.fmt(new Date(y, qm, 1));  this.fechaHasta = this.fmt(new Date(y, qm + 3, 0)); break; }
      case 'anio':      this.fechaDesde = this.fmt(new Date(y, 0, 1));     this.fechaHasta = this.fmt(new Date(y, 11, 31)); break;
      case 'anioPasado':this.fechaDesde = this.fmt(new Date(y - 1, 0, 1)); this.fechaHasta = this.fmt(new Date(y - 1, 11, 31)); break;
      case '12m':       this.fechaDesde = this.fmt(new Date(y, m - 11, 1));this.fechaHasta = this.fmt(new Date(y, m + 1, 0)); break;
      case 'todo':      this.fechaDesde = ''; this.fechaHasta = ''; break;
    }
    this.load();
  }

  aplicarAnioMes() {
    if (!this.anioSel) return;
    this.presetActivo.set('custom');
    if (this.mesSel) {
      this.fechaDesde = this.fmt(new Date(this.anioSel, this.mesSel - 1, 1));
      this.fechaHasta = this.fmt(new Date(this.anioSel, this.mesSel, 0));
    } else {
      this.fechaDesde = this.fmt(new Date(this.anioSel, 0, 1));
      this.fechaHasta = this.fmt(new Date(this.anioSel, 11, 31));
    }
    this.load();
  }

  aplicarRango() {
    if (!this.fechaDesde && !this.fechaHasta) return;
    this.presetActivo.set('custom');
    this.anioSel = null; this.mesSel = null;
    this.load();
  }

  private qs(): string {
    const parts: string[] = [];
    if (this.fechaDesde) parts.push(`desde=${this.fechaDesde}`);
    if (this.fechaHasta) parts.push(`hasta=${this.fechaHasta}`);
    return parts.length ? '?' + parts.join('&') : '';
  }

  flujo        = signal<any[]>([]);
  proyectos    = signal<any[]>([]);
  cotizaciones = signal<any[]>([]);
  facturas     = signal<any[]>([]);

  // ── KPIs ──
  totalContratado = computed(() => this.proyectos().reduce((s, p) => s + Number(p.MontoTotal || 0), 0));
  totalCobrado    = computed(() => this.proyectos().reduce((s, p) => s + Number(p.Cobrado || 0), 0));
  totalCostos     = computed(() => this.proyectos().reduce((s, p) => s + Number(p.CostoEquipo || 0) + Number(p.CostoTerceros || 0), 0));
  totalUtilidad   = computed(() => this.proyectos().reduce((s, p) => s + Number(p.Utilidad || 0), 0));
  margenPct       = computed(() => {
    const c = this.totalContratado();
    return c > 0 ? ((this.totalUtilidad() / c) * 100).toFixed(1) : '0';
  });

  // ── Barras mensuales (cobros vs pagos) ──
  maxFlujo = computed(() => {
    const m = Math.max(...this.flujo().map(f => Math.max(Number(f.Cobros || 0), Number(f.Pagos || 0))), 1);
    return m;
  });
  barH(v: number): number {
    return Math.round((Number(v || 0) / this.maxFlujo()) * 140);
  }

  // ── Dona costos: equipo vs terceros ──
  donaCostos = computed<DonaSeg[]>(() => {
    const eq = this.proyectos().reduce((s, p) => s + Number(p.CostoEquipo || 0), 0);
    const tc = this.proyectos().reduce((s, p) => s + Number(p.CostoTerceros || 0), 0);
    return this.buildDona([
      { label: 'Equipo interno', valor: eq, color: '#2563eb' },
      { label: 'Terceros', valor: tc, color: '#f59e0b' },
    ]);
  });

  // ── Dona cotizaciones por estado ──
  coloresEstado: Record<string, string> = {
    'Aprobada': '#16a34a', 'Enviada': '#2563eb', 'Borrador': '#94a3b8',
    'Rechazada': '#dc2626', 'Vencida': '#f59e0b', 'En negociación': '#8b5cf6',
  };
  donaCotiz = computed<DonaSeg[]>(() =>
    this.buildDona(this.cotizaciones().map((c, i) => ({
      label: c.Estado, valor: Number(c.Monto || 0),
      color: this.coloresEstado[c.Estado] ?? ['#0ea5e9','#f97316','#84cc16'][i % 3],
    })))
  );

  // ── Dona facturas por estado ──
  coloresFactura: Record<string, string> = {
    'Pagada': '#16a34a', 'Parcial': '#2563eb', 'Pendiente': '#f59e0b',
    'Vencida': '#dc2626', 'Borrador': '#94a3b8', 'Anulada': '#64748b',
  };
  donaFacturas = computed<DonaSeg[]>(() =>
    this.buildDona(this.facturas().map((f, i) => ({
      label: f.Estado, valor: Number(f.Monto || 0),
      color: this.coloresFactura[f.Estado] ?? '#0ea5e9',
    })))
  );

  // ── Top proyectos por utilidad ──
  topProyectos = computed(() => {
    const arr = [...this.proyectos()].sort((a, b) => Number(b.Utilidad) - Number(a.Utilidad)).slice(0, 8);
    const max = Math.max(...arr.map(p => Math.abs(Number(p.Utilidad || 0))), 1);
    return arr.map(p => ({ ...p, barPct: Math.round((Math.abs(Number(p.Utilidad || 0)) / max) * 100) }));
  });

  private buildDona(items: { label: string; valor: number; color: string }[]): DonaSeg[] {
    const total = items.reduce((s, i) => s + i.valor, 0);
    if (total <= 0) return [];
    const C = 2 * Math.PI * 42; // circunferencia r=42
    let acc = 0;
    return items.filter(i => i.valor > 0).map(i => {
      const pct = i.valor / total;
      const seg: DonaSeg = {
        label: i.label, valor: i.valor, color: i.color,
        pct: Math.round(pct * 100),
        dash: `${(pct * C).toFixed(1)} ${(C - pct * C).toFixed(1)}`,
        offset: -acc * C,
      };
      acc += pct;
      return seg;
    });
  }

  ngOnInit() { this.aplicarPreset('12m'); }

  load() {
    this.loading.set(true);
    const q = this.qs();
    let pending = 5;
    const done = () => { if (--pending === 0) this.loading.set(false); };
    this.api.get<any>(`/api/finanzas/bi/flujo-mensual${q}`).subscribe({ next: (r: any) => { this.flujo.set(r?.data ?? r ?? []); done(); }, error: done });
    this.api.get<any>(`/api/finanzas/bi/proyectos${q}`).subscribe({ next: (r: any) => { this.proyectos.set(r?.data ?? r ?? []); done(); }, error: done });
    this.api.get<any>(`/api/finanzas/bi/cotizaciones${q}`).subscribe({ next: (r: any) => { this.cotizaciones.set(r?.data ?? r ?? []); done(); }, error: done });
    this.api.get<any>(`/api/finanzas/bi/facturas${q}`).subscribe({ next: (r: any) => { this.facturas.set(r?.data ?? r ?? []); done(); }, error: done });
    this.api.get<any>(`/api/finanzas/bi/facturacion-cliente${q}`).subscribe({ next: (r: any) => { this.facClientes.set(r ?? []); this.clienteExpandido.set(null); done(); }, error: done });
  }

  // ── Helpers para fila total ──
  sumCant    = (s: number, c: any) => s + (c.CantidadFacturas || 0);
  sumPEN     = (s: number, c: any) => s + (c.MontoFacturadoPEN || 0);
  sumUSD     = (s: number, c: any) => s + (c.MontoFacturadoUSD || 0);
  sumCobrar  = (s: number, c: any) => s + (c.MontoPorCobrar || 0);
  sumCobrado = (s: number, c: any) => s + (c.MontoCobrado || 0);

  // ── Facturación x Cliente ──
  facClientes     = signal<any[]>([]);
  facClienteDet   = signal<any[]>([]);
  clienteExpandido = signal<number | null>(null);
  clienteNombre    = signal('');

  expandirCliente(c: any) {
    if (this.clienteExpandido() === c.ClienteId) {
      this.clienteExpandido.set(null);
      this.facClienteDet.set([]);
      return;
    }
    this.clienteExpandido.set(c.ClienteId);
    this.clienteNombre.set(c.Cliente);
    const q = this.qs();
    const sep = q ? '&' : '?';
    this.api.get<any>(`/api/finanzas/bi/facturacion-cliente/${c.ClienteId}${q}`).subscribe({
      next: (r: any) => this.facClienteDet.set(r ?? []),
      error: () => this.facClienteDet.set([])
    });
  }

  irAProyecto(p: any) { this.router.navigate(['/proyectos', p.Id]); }
}
