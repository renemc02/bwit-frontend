import { Component, signal, inject, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { TopbarComponent } from '../../../core/layout/topbar/topbar.component';
import { UiEmptyComponent } from '../../../shared/components/ui-empty.component';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { BadgePipe } from '../../../shared/pipes/badge.pipe';
import { FacturaService } from '../services/factura.service';

const ESTADOS = [
  { l: 'Todos', v: '' }, { l: 'Pendiente', v: 'Pendiente' },
  { l: 'Parcial', v: 'Parcial' }, { l: 'Pagada', v: 'Pagada' }, { l: 'Vencida', v: 'Vencida' }
];

@Component({
  selector: 'bwit-facturas',
  standalone: true,
  imports: [DecimalPipe, DatePipe, TopbarComponent, UiEmptyComponent, UiLoadingComponent, BadgePipe],
  templateUrl: './facturas.component.html'
})
export class FacturasComponent implements OnInit {
  private readonly svc = inject(FacturaService);
  items   = signal<any[]>([]);
  loading = signal(true);
  filtro  = signal('');
  readonly estados = ESTADOS;
  ngOnInit() { this.load(); }
  setFiltro(v: string) { this.filtro.set(v); this.load(); }
  load() { this.loading.set(true); this.svc.listar({ estado: this.filtro() || undefined }).subscribe({ next: d => { this.items.set(d.data); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
