import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/http/api.service';
import { TopbarComponent } from '../../../core/layout/topbar/topbar.component';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { BadgePipe } from '../../../shared/pipes/badge.pipe';

@Component({
  selector: 'bwit-facturacion-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TopbarComponent, UiLoadingComponent, BadgePipe],
  templateUrl: './facturacion-cliente.component.html',
  styleUrl: './facturacion-cliente.component.scss',
})
export class FacturacionClienteComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  clientes = signal<any[]>([]);
  detalle = signal<any[]>([]);
  detalleAgrupado = signal<any[]>([]);
  expandido = signal<number | null>(null);
  detalleCargando = signal(false);

  // Filtros
  anioSel: number = new Date().getFullYear();
  mesSel: number | null = null;
  fechaDesde = '';
  fechaHasta = '';
  presetActivo = signal('anio');
  busqueda = '';

  anios: number[] = (() => { const y = new Date().getFullYear(); return [y, y - 1, y - 2, y - 3]; })();
  meses = [
    { v: 1, n: 'Ene' }, { v: 2, n: 'Feb' }, { v: 3, n: 'Mar' }, { v: 4, n: 'Abr' },
    { v: 5, n: 'May' }, { v: 6, n: 'Jun' }, { v: 7, n: 'Jul' }, { v: 8, n: 'Ago' },
    { v: 9, n: 'Sep' }, { v: 10, n: 'Oct' }, { v: 11, n: 'Nov' }, { v: 12, n: 'Dic' },
  ];

  private fmt(d: Date): string { return d.toISOString().split('T')[0]; }

  // KPIs
  totalPEN     = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.MontoFacturadoPEN || 0), 0));
  totalUSD     = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.MontoFacturadoUSD || 0), 0));
  facturasPEN  = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.FacturasPEN || 0), 0));
  facturasUSD  = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.FacturasUSD || 0), 0));
  cobradoPEN   = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.CobradoPEN || 0), 0));
  cobradoUSD   = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.CobradoUSD || 0), 0));
  factCobPEN   = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.FacturasCobPEN || 0), 0));
  factCobUSD   = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.FacturasCobUSD || 0), 0));
  porCobrarPEN = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.PorCobrarPEN || 0), 0));
  porCobrarUSD = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.PorCobrarUSD || 0), 0));
  factPendPEN  = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.FacturasPendPEN || 0), 0));
  factPendUSD  = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.FacturasPendUSD || 0), 0));
  totalCobrado = computed(() => this.cobradoPEN() + this.cobradoUSD());
  totalPorCobrar = computed(() => this.porCobrarPEN() + this.porCobrarUSD());
  totalFacturas  = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.CantidadFacturas || 0), 0));
  clientesConSaldo = computed(() => this.clientesFiltrados().filter(c => (c.MontoPorCobrar || 0) > 0).length);
  pctCobrado = computed(() => {
    const total = this.totalPEN() + this.totalUSD();
    return total > 0 ? Math.round(this.totalCobrado() / total * 100) : 0;
  });

  // Vencidas
  montoVencido      = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.MontoVencido || 0), 0));
  facturasVencidas  = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.FacturasVencidas || 0), 0));
  private diasVencidoSuma = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.DiasVencidoSuma || 0), 0));
  diasVencidoPromedio = computed(() => {
    const n = this.facturasVencidas();
    return n > 0 ? Math.round(this.diasVencidoSuma() / n) : 0;
  });

  // Por vencer (próximos 15 días)
  montoPorVencer15d     = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.MontoPorVencer15d || 0), 0));
  facturasPorVencer15d  = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.FacturasPorVencer15d || 0), 0));

  // Comparación vs periodo anterior
  periodoAnteriorMonto = signal<number | null>(null);
  variacionPct = computed(() => {
    const prev = this.periodoAnteriorMonto();
    if (prev === null || prev === 0) return null;
    const actual = this.totalPEN() + this.totalUSD();
    return Math.round(((actual - prev) / prev) * 1000) / 10;
  });

  // Filtro por búsqueda
  clientesFiltrados = computed(() => {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.clientes();
    return this.clientes().filter(c => c.Cliente.toLowerCase().includes(q));
  });

  // Barra de progreso por cliente
  maxMonto = computed(() => Math.max(...this.clientesFiltrados().map(c => c.MontoFacturadoTotal || 0), 1));

  ngOnInit() {
    this.aplicarPreset('anio');
  }

  aplicarPreset(p: string) {
    this.presetActivo.set(p);
    const hoy = new Date();
    const y = hoy.getFullYear(), m = hoy.getMonth();
    switch (p) {
      case 'mes':       this.fechaDesde = this.fmt(new Date(y, m, 1));       this.fechaHasta = this.fmt(new Date(y, m + 1, 0)); break;
      case 'trimestre': { const qm = Math.floor(m / 3) * 3;
                          this.fechaDesde = this.fmt(new Date(y, qm, 1));    this.fechaHasta = this.fmt(new Date(y, qm + 3, 0)); break; }
      case 'anio':      this.fechaDesde = this.fmt(new Date(y, 0, 1));       this.fechaHasta = this.fmt(new Date(y, 11, 31)); break;
      case '12m':       this.fechaDesde = this.fmt(new Date(y, m - 11, 1));  this.fechaHasta = this.fmt(new Date(y, m + 1, 0)); break;
      case 'todo':      this.fechaDesde = ''; this.fechaHasta = ''; break;
    }
    this.load();
  }

  aplicarAnioMes() {
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

  private qs(): string {
    const p: string[] = [];
    if (this.fechaDesde) p.push(`desde=${this.fechaDesde}`);
    if (this.fechaHasta) p.push(`hasta=${this.fechaHasta}`);
    return p.length ? '?' + p.join('&') : '';
  }

  load() {
    this.loading.set(true);
    this.expandido.set(null);
    this.detalle.set([]);
    this.api.get<any>(`/api/finanzas/bi/facturacion-cliente${this.qs()}`).subscribe({
      next: (r: any) => { this.clientes.set(r ?? []); this.loading.set(false); },
      error: () => { this.clientes.set([]); this.loading.set(false); }
    });
    this.cargarPeriodoAnterior();
  }

  private cargarPeriodoAnterior() {
    if (!this.fechaDesde || !this.fechaHasta) { this.periodoAnteriorMonto.set(null); return; }
    const d1 = new Date(this.fechaDesde);
    const d2 = new Date(this.fechaHasta);
    const dias = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
    const prevHasta = new Date(d1); prevHasta.setDate(prevHasta.getDate() - 1);
    const prevDesde = new Date(prevHasta); prevDesde.setDate(prevDesde.getDate() - dias + 1);
    const qs = `?desde=${this.fmt(prevDesde)}&hasta=${this.fmt(prevHasta)}`;
    this.api.get<any>(`/api/finanzas/bi/facturacion-cliente${qs}`).subscribe({
      next: (r: any) => {
        const arr = r ?? [];
        const total = arr.reduce((s: number, c: any) => s + (c.MontoFacturadoPEN || 0) + (c.MontoFacturadoUSD || 0), 0);
        this.periodoAnteriorMonto.set(total);
      },
      error: () => this.periodoAnteriorMonto.set(null)
    });
  }

  expandir(c: any) {
    if (this.expandido() === c.ClienteId) {
      this.expandido.set(null);
      this.detalle.set([]);
      this.detalleAgrupado.set([]);
      return;
    }
    this.expandido.set(c.ClienteId);
    this.detalleCargando.set(true);
    this.api.get<any>(`/api/finanzas/bi/facturacion-cliente/${c.ClienteId}${this.qs()}`).subscribe({
      next: (r: any) => {
        const items = r ?? [];
        this.detalle.set(items);
        this.detalleAgrupado.set(this.agruparPorProyecto(items));
        this.detalleCargando.set(false);
      },
      error: () => { this.detalle.set([]); this.detalleAgrupado.set([]); this.detalleCargando.set(false); }
    });
  }

  private agruparPorProyecto(items: any[]): any[] {
    const map = new Map<string, any>();
    for (const f of items) {
      const key = f.ProyectoCodigo || 'SIN-PRY';
      if (!map.has(key)) {
        map.set(key, {
          ProyectoCodigo: f.ProyectoCodigo,
          ProyectoNombre: f.ProyectoNombre,
          ProyectoTipo: f.ProyectoTipo,
          facturas: [],
          totalFacturado: 0,
          totalCobrado: 0,
          totalSaldo: 0,
        });
      }
      const g = map.get(key)!;
      g.facturas.push(f);
      g.totalFacturado += f.Total || 0;
      g.totalCobrado += f.Cobrado || 0;
      g.totalSaldo += f.Saldo || 0;
    }
    return Array.from(map.values()).sort((a, b) => b.totalFacturado - a.totalFacturado);
  }

  moneda(m: string) { return m === 'USD' ? 'US$' : 'S/'; }
}
