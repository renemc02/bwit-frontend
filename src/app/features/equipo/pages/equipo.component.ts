import { Component, signal, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TopbarComponent } from '../../../core/layout/topbar/topbar.component';
import { UiEmptyComponent } from '../../../shared/components/ui-empty.component';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { EquipoService } from '../services/equipo.service';

@Component({
  selector: 'bwit-equipo',
  standalone: true,
  imports: [DecimalPipe, TopbarComponent, UiEmptyComponent, UiLoadingComponent],
  templateUrl: './equipo.component.html'
})
export class EquipoComponent implements OnInit {
  private readonly svc = inject(EquipoService);
  items   = signal<any[]>([]);
  loading = signal(true);
  ngOnInit() { this.load(); }
  buscar(e: Event) { this.svc.listar({ Busqueda: (e.target as HTMLInputElement).value || undefined }).subscribe({ next: d => this.items.set(d.data), error: () => {} }); }
  load() { this.loading.set(true); this.svc.listar().subscribe({ next: d => { this.items.set(d.data); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
