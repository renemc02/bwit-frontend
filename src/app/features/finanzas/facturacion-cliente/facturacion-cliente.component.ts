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
  totalCobrado = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.MontoCobrado || 0), 0));
  totalPorCobrar = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.MontoPorCobrar || 0), 0));
  totalFacturas  = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.CantidadFacturas || 0), 0));
  pctCobrado = computed(() => {
    const total = this.totalPEN() + this.totalUSD();
    return total > 0 ? Math.round(this.totalCobrado() / total * 100) : 0;
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
  }

  expandir(c: any) {
    if (this.expandido() === c.ClienteId) {
      this.expandido.set(null);
      this.detalle.set([]);
      return;
    }
    this.expandido.set(c.ClienteId);
    this.detalleCargando.set(true);
    this.api.get<any>(`/api/finanzas/bi/facturacion-cliente/${c.ClienteId}${this.qs()}`).subscribe({
      next: (r: any) => { this.detalle.set(r ?? []); this.detalleCargando.set(false); },
      error: () => { this.detalle.set([]); this.detalleCargando.set(false); }
    });
  }

  moneda(m: string) { return m === 'USD' ? 'US$' : 'S/'; }
}
