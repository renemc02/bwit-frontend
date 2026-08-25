import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/http/api.service';
import { TopbarComponent } from '../../../core/layout/topbar/topbar.component';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { BadgePipe } from '../../../shared/pipes/badge.pipe';

@Component({
  selector: 'bwit-cobranza-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TopbarComponent, UiLoadingComponent, BadgePipe],
  templateUrl: './cobranza-cliente.component.html',
  styleUrl: './cobranza-cliente.component.scss',
})
export class CobranzaClienteComponent implements OnInit {
  private api = inject(ApiService);
  readonly Math = Math;

  loading = signal(true);
  clientes = signal<any[]>([]);
  detalle = signal<any[]>([]);
  expandido = signal<number | null>(null);
  detalleCargando = signal(false);
  busqueda = '';
  soloPendientes = signal(true); // filtro: true = solo pendientes/parcial, false = todas las facturas

  // Pestaña: 'cliente' (agrupado, con aging) | 'facturas' (plano, paginado, sin agrupar)
  vista = signal<'cliente' | 'facturas'>('cliente');

  // ── Vista "Todas las facturas" (paginada) ──
  facturasLista   = signal<any[]>([]);
  facturasTotal   = signal(0);
  facturasPagina  = signal(1);
  facturasCargando = signal(false);
  facturasPageSize = 50;
  private busquedaTimer: any;

  ngOnInit() { this.load(); }

  cambiarVista(v: 'cliente' | 'facturas') {
    if (this.vista() === v) return;
    this.vista.set(v);
    if (v === 'facturas' && !this.facturasLista().length) this.loadFacturas();
  }

  onBusquedaChange() {
    clearTimeout(this.busquedaTimer);
    this.busquedaTimer = setTimeout(() => {
      if (this.vista() === 'facturas') { this.facturasPagina.set(1); this.loadFacturas(); }
    }, 350);
  }

  loadFacturas() {
    this.facturasCargando.set(true);
    const params = new URLSearchParams({
      soloPendientes: String(this.soloPendientes()),
      busqueda: this.busqueda || '',
      pagina: String(this.facturasPagina()),
      tamanoPagina: String(this.facturasPageSize),
    });
    this.api.get<any>(`/api/finanzas/bi/cobranza-facturas?${params.toString()}`).subscribe({
      next: (r: any) => {
        const arr = r ?? [];
        this.facturasLista.set(arr);
        this.facturasTotal.set(arr.length ? arr[0].TotalRegistros : 0);
        this.facturasCargando.set(false);
      },
      error: () => { this.facturasLista.set([]); this.facturasTotal.set(0); this.facturasCargando.set(false); }
    });
  }

  facturasTotalPaginas = computed(() => Math.max(1, Math.ceil(this.facturasTotal() / this.facturasPageSize)));

  irAPagina(p: number) {
    if (p < 1 || p > this.facturasTotalPaginas()) return;
    this.facturasPagina.set(p);
    this.loadFacturas();
  }

  load() {
    this.loading.set(true);
    this.expandido.set(null);
    this.detalle.set([]);
    this.api.get<any>(`/api/finanzas/bi/cobranza-cliente?soloPendientes=${this.soloPendientes()}`).subscribe({
      next: (r: any) => { this.clientes.set(r ?? []); this.loading.set(false); },
      error: () => { this.clientes.set([]); this.loading.set(false); }
    });
  }

  cambiarFiltro(valor: boolean) {
    if (this.soloPendientes() === valor) return;
    this.soloPendientes.set(valor);
    if (this.vista() === 'facturas') {
      this.facturasPagina.set(1);
      this.loadFacturas();
    } else {
      this.load();
    }
  }

  clientesFiltrados = computed(() => {
    const q = this.busqueda.trim().toLowerCase();
    const arr = this.clientes();
    if (!q) return arr;
    return arr.filter((c: any) => (c.Cliente || '').toLowerCase().includes(q));
  });

  // KPIs generales (combinando PEN+USD como aproximación, igual que en Facturación x Cliente)
  totalPendientePEN = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.MontoPendientePEN || 0), 0));
  totalPendienteUSD = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.MontoPendienteUSD || 0), 0));
  totalFacturas     = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.CantidadFacturas || 0), 0));
  clientesConDeuda  = computed(() => this.clientesFiltrados().length);
  maxDiasVencido    = computed(() => this.clientesFiltrados().reduce((m, c) => Math.max(m, c.DiasVencidoMax || 0), 0));

  totalCorrientePEN  = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.Tramo0_30_PEN || 0), 0));
  totalCorrienteUSD  = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.Tramo0_30_USD || 0), 0));
  totalTramo1_30PEN  = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.Tramo1_30_PEN || 0), 0));
  totalTramo1_30USD  = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.Tramo1_30_USD || 0), 0));
  totalTramo31_60PEN = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.Tramo31_60_PEN || 0), 0));
  totalTramo31_60USD = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.Tramo31_60_USD || 0), 0));
  totalTramo61_90PEN = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.Tramo61_90_PEN || 0), 0));
  totalTramo61_90USD = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.Tramo61_90_USD || 0), 0));
  totalTramoMas90PEN = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.TramoMas90_PEN || 0), 0));
  totalTramoMas90USD = computed(() => this.clientesFiltrados().reduce((s, c) => s + (c.TramoMas90_USD || 0), 0));

  // Combinados solo para la barra de aging (proporción visual, mezclando monedas)
  totalPendienteComb = computed(() => this.totalPendientePEN() + this.totalPendienteUSD());
  totalCorrienteComb  = computed(() => this.totalCorrientePEN() + this.totalCorrienteUSD());
  totalTramo1_30Comb  = computed(() => this.totalTramo1_30PEN() + this.totalTramo1_30USD());
  totalTramo31_60Comb = computed(() => this.totalTramo31_60PEN() + this.totalTramo31_60USD());
  totalTramo61_90Comb = computed(() => this.totalTramo61_90PEN() + this.totalTramo61_90USD());
  totalTramoMas90Comb = computed(() => this.totalTramoMas90PEN() + this.totalTramoMas90USD());
  totalVencidoComb    = computed(() => this.totalTramo1_30Comb() + this.totalTramo31_60Comb() + this.totalTramo61_90Comb() + this.totalTramoMas90Comb());

  pctTramo(monto: number): number {
    const total = this.totalPendienteComb();
    return total > 0 ? Math.round((monto / total) * 100) : 0;
  }

  expandir(c: any) {
    if (this.expandido() === c.ClienteId) { this.expandido.set(null); return; }
    this.expandido.set(c.ClienteId);
    this.detalleCargando.set(true);
    this.api.get<any>(`/api/finanzas/bi/cobranza-cliente/${c.ClienteId}?soloPendientes=${this.soloPendientes()}`).subscribe({
      next: (r: any) => { this.detalle.set(r ?? []); this.detalleCargando.set(false); },
      error: () => { this.detalle.set([]); this.detalleCargando.set(false); }
    });
  }

  detalleOrdenado(): any[] {
    return [...this.detalle()].sort((a, b) => this.numeroFactura(b.Codigo) - this.numeroFactura(a.Codigo));
  }

  numeroFactura(codigo: string): number {
    const partes = (codigo || '').split('-');
    return Number(partes[partes.length - 1]) || 0;
  }

  formatoFactura(codigo: string): string {
    if (!codigo) return '';
    const idx = codigo.lastIndexOf('-');
    if (idx === -1) return codigo;
    const prefijo = codigo.substring(0, idx);
    const numero = codigo.substring(idx + 1);
    const numeroFormateado = numero.replace(/^\d+$/, (n) => n.padStart(7, '0'));
    return `${prefijo}-${numeroFormateado}`;
  }

  moneda(m: string): string { return m === 'USD' ? '$' : 'S/'; }

  tramoClase(dias: number): string {
    if (dias <= 0) return 'cb-txt-al-dia';
    if (dias <= 30) return 'tr-txt-30';
    if (dias <= 60) return 'tr-txt-60';
    if (dias <= 90) return 'tr-txt-90';
    return 'tr-txt-mas90';
  }
}
