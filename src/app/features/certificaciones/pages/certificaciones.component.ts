import { Component, signal, inject, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { TopbarComponent } from '../../../core/layout/topbar/topbar.component';
import { UiEmptyComponent } from '../../../shared/components/ui-empty.component';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { BadgePipe } from '../../../shared/pipes/badge.pipe';
import { CertificacionService } from '../services/certificacion.service';

@Component({
  selector: 'bwit-certificaciones',
  standalone: true,
  imports: [DecimalPipe, DatePipe, TopbarComponent, UiEmptyComponent, UiLoadingComponent, BadgePipe],
  templateUrl: './certificaciones.component.html'
})
export class CertificacionesComponent implements OnInit {
  private readonly svc = inject(CertificacionService);
  items   = signal<any[]>([]);
  loading = signal(true);
  ngOnInit() { this.load(); }
  load() { this.loading.set(true); this.svc.listar().subscribe({ next: d => { this.items.set(d.data); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
