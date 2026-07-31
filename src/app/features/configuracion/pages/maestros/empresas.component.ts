import { Component, signal, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { MaestroService } from '../../services/maestro.service';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading.component';
import { UiEmptyComponent } from '../../../../shared/components/ui-empty.component';

@Component({
  selector: 'bwit-cfg-empresas',
  standalone: true,
  imports: [DecimalPipe, FormsModule, UiLoadingComponent, UiEmptyComponent],
  templateUrl: './empresas.component.html',
  styleUrl: './empresas.component.scss'
})
export class CfgEmpresasComponent implements OnInit {
  private svc     = inject(MaestroService);
  private confirm = inject(ConfirmService);
  items = signal<any[]>([]);
  loading = signal(true);
  modal = signal(false);
  editId = signal<number | null>(null);
  guardando = signal(false);
  error = signal('');

  form: any = this.blank();

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.listar<any>('empresas').subscribe({
      next: d => { this.items.set(d.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  siglas(n: string) { return (n||'').split(' ').slice(0,2).map(p=>p[0]??'').join('').toUpperCase(); }

  nuevo() { this.form = this.blank(); this.editId.set(null); this.error.set(''); this.modal.set(true); }
  editar(e: any) { this.form = { ...e }; this.editId.set(e.Id); this.error.set(''); this.modal.set(true); }
  cerrar() { this.modal.set(false); }

  guardar() {
    if (!this.form.Codigo || !this.form.RazonSocial || !this.form.Ruc) {
      this.error.set('Código, razón social y RUC son obligatorios.'); return;
    }
    this.guardando.set(true);
    const op = this.editId()
      ? this.svc.actualizar('empresas', this.editId()!, this.form)
      : this.svc.crear('empresas', this.form);
    op.subscribe({
      next: () => { this.guardando.set(false); this.cerrar(); this.load(); },
      error: () => { this.guardando.set(false); this.error.set('Error al guardar.'); }
    });
  }

  private blank() {
    return { Codigo:'', RazonSocial:'', NombreComercial:'', Ruc:'', Moneda:'PEN',
             RepLegal:'', Direccion:'', Telefono:'', Email:'', EsPrincipal:false, Activa:true, ColorHex:'#2563eb' };
  }
}
