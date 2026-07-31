import { Component, signal, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TopbarComponent } from '../../../core/layout/topbar/topbar.component';
import { UiEmptyComponent } from '../../../shared/components/ui-empty.component';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { PipelineService } from '../services/pipeline.service';

@Component({
  selector: 'bwit-pipeline',
  standalone: true,
  imports: [DecimalPipe, TopbarComponent, UiEmptyComponent, UiLoadingComponent],
  templateUrl: './pipeline.component.html'
})
export class PipelineComponent implements OnInit {
  private readonly svc = inject(PipelineService);
  loading  = signal(true);
  error    = signal(false);
  columnas = signal<any[]>([]);

  ngOnInit() {
    this.svc.listar().subscribe({
      next: d => {
        const map = new Map<string, any>();
        (d.data ?? []).forEach((o: any) => {
          if (!map.has(o.Etapa)) map.set(o.Etapa, { etapa: o.Etapa, color: o.Color, items: [], total: 0 });
          const col = map.get(o.Etapa);
          col.items.push(o); col.total += o.MontoEstimado;
        });
        this.columnas.set(Array.from(map.values()));
        this.loading.set(false);
      },
      error: () => { this.error.set(true); this.loading.set(false); }
    });
  }
}
