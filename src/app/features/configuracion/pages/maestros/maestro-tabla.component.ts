import { Component, signal, inject, input, effect } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaestroService } from '../../services/maestro.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading.component';
import { UiEmptyComponent } from '../../../../shared/components/ui-empty.component';

export interface ColDef {
  key: string;
  label: string;
  tipo?: 'text' | 'mono' | 'money' | 'date' | 'bool' | 'badge';
  align?: 'left' | 'right' | 'center';
}
export interface FieldDef {
  key: string;
  label: string;
  tipo?: 'text' | 'number' | 'select' | 'select-remote' | 'check' | 'textarea';
  opciones?: string[];
  required?: boolean;
  col?: 1 | 2;
  // Para select-remote: carga opciones desde otro recurso
  recursoOpciones?: string;   // ej. 'bancos'
  opcionValue?: string;       // ej. 'Id'
  opcionLabel?: string;       // ej. 'Nombre'
}
export interface MaestroConfig {
  recurso: string;
  titulo: string;
  subtitulo: string;
  nuevoLabel: string;
  cols: ColDef[];
  fields: FieldDef[];
  blank: Record<string, any>;
}

@Component({
  selector: 'bwit-maestro-tabla',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, UiLoadingComponent, UiEmptyComponent],
  templateUrl: './maestro-tabla.component.html',
  styleUrl: './maestro-tabla.component.scss'
})
export class MaestroTablaComponent {
  cfg = input.required<MaestroConfig>();
  private svc     = inject(MaestroService);
  private confirm = inject(ConfirmService);

  items = signal<any[]>([]);
  loading = signal(true);
  modal = signal(false);
  editId = signal<number | null>(null);
  guardando = signal(false);
  error = signal('');
  form: any = {};
  opcionesRemotas = signal<Record<string, {value:any; label:string}[]>>({});

  constructor() {
    // Recargar cuando cambia la config (cambio de sección)
    effect(() => { this.cfg(); this.load(); this.cargarOpcionesRemotas(); });
  }


  load() {
    this.loading.set(true);
    this.svc.listar<any>(this.cfg().recurso).subscribe({
      next: d => { this.items.set(d.data ?? []); this.loading.set(false); },
      error: () => { this.items.set([]); this.loading.set(false); }
    });
  }

  cargarOpcionesRemotas() {
    const remotos = this.cfg().fields.filter(f => f.tipo === 'select-remote' && f.recursoOpciones);
    remotos.forEach(f => {
      this.svc.listar<any>(f.recursoOpciones!).subscribe({
        next: d => {
          const opts = (d.data ?? []).map((o: any) => ({
            value: o[f.opcionValue || 'Id'],
            label: o[f.opcionLabel || 'Nombre'],
          }));
          this.opcionesRemotas.update(prev => ({ ...prev, [f.key]: opts }));
        },
        error: () => {}
      });
    });
  }

  nuevo() { this.form = { ...this.cfg().blank }; this.editId.set(null); this.error.set(''); this.modal.set(true); }
  editar(item: any) { this.form = { ...item }; this.editId.set(item.Id); this.error.set(''); this.modal.set(true); }
  cerrar() { this.modal.set(false); this.form = {}; }
  private cerrarTrasGuardar() { this.modal.set(false); this.form = {}; }

  guardar() {
    const reqFields = this.cfg().fields.filter(f => f.required);
    for (const f of reqFields) {
      if (!this.form[f.key]) { this.error.set(`${f.label} es obligatorio.`); return; }
    }
    // Módulo 7: validar formato de email si existe el campo
    if (this.form.Email && this.form.Email.trim()) {
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRx.test(this.form.Email.trim())) {
        this.error.set('El formato del email no es válido.'); return;
      }
    }
    this.guardando.set(true);
    const op = this.editId()
      ? this.svc.actualizar(this.cfg().recurso, this.editId()!, this.form)
      : this.svc.crear(this.cfg().recurso, this.form);
    op.subscribe({
      next: () => { this.guardando.set(false); this.cerrarTrasGuardar(); this.load(); },
      error: (err: any) => {
        this.guardando.set(false);
        const msg: string = err?.error?.errors?.[0] ?? err?.message ?? '';
        if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('duplicat') || msg.toLowerCase().includes('UQ_Personal')) {
          this.error.set('Ya existe un registro con ese email. Usa un email diferente.');
        } else {
          this.error.set('Error al guardar. Verifica los datos e intenta de nuevo.');
        }
      }
    });
  }

  eliminar(item: any) {
    const nombre = item.Nombre || item.RazonSocial || item.Banco || item.Codigo || 'este registro';
    this.confirm.eliminar(nombre).then(ok => {
      if (!ok) return;
      this.svc.eliminar(this.cfg().recurso, item.Id).subscribe({
        next: () => this.load(),
        error: () => {}
      });
    });
  }
}
