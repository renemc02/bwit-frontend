import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TopbarComponent } from '../../../../core/layout/topbar/topbar.component';
import { UiEmptyComponent } from '../../../../shared/components/ui-empty.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading.component';
import { BadgePipe } from '../../../../shared/pipes/badge.pipe';
import { ProyectoService } from '../../services/proyecto.service';
import { ESTADOS_PROYECTO } from '../../../../core/constants/app.constants';

@Component({
  selector: 'bwit-proyectos-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TopbarComponent, UiEmptyComponent, UiLoadingComponent, BadgePipe],
  templateUrl: './proyectos-list.component.html'
})
export class ProyectosListComponent implements OnInit {
  private readonly svc = inject(ProyectoService);

  items        = signal<any[]>([]);
  loading      = signal(true);
  filtroEstado = signal('');
  busqueda     = signal('');
  readonly estados = ESTADOS_PROYECTO;

  ngOnInit() { this.load(); }

  setEstado(v: string) { this.filtroEstado.set(v); this.load(); }
  buscar(e: Event)     { this.busqueda.set((e.target as HTMLInputElement).value); this.load(); }

  load() {
    this.loading.set(true);
    // Solo parámetros que acepta sp_ProyectoListar
    const params: Record<string, any> = {};
    if (this.filtroEstado()) params['estado']   = this.filtroEstado();
    if (this.busqueda())     params['Busqueda'] = this.busqueda();

    this.svc.listar(params).subscribe({
      next:  d => { this.items.set(d.data ?? []); this.loading.set(false); },
      error: () => { this.items.set([]); this.loading.set(false); }
    });
  }
}
