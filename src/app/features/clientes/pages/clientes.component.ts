import { Component, signal, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopbarComponent } from '../../../core/layout/topbar/topbar.component';
import { UiEmptyComponent } from '../../../shared/components/ui-empty.component';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { ClienteService } from '../services/cliente.service';
import { ContactoService, Contacto } from '../services/contacto.service';

@Component({
  selector: 'bwit-clientes',
  standalone: true,
  imports: [DecimalPipe, FormsModule, TopbarComponent, UiEmptyComponent, UiLoadingComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {
  private readonly svc        = inject(ClienteService);
  private readonly contactoSvc = inject(ContactoService);
  private readonly confirm    = inject(ConfirmService);
  items   = signal<any[]>([]);
  loading = signal(true);

  modal      = signal(false);
  editId     = signal<number | null>(null);
  guardando  = signal(false);
  formError  = signal('');
  form: any = this.blank();

  // ── Contactos del cliente ──
  contactos         = signal<Contacto[]>([]);
  cargandoContactos = signal(false);
  contactoForm      = signal(false);
  cfId              = signal<number | null>(null);
  cf: any = this.blankContacto();

  ngOnInit() { this.load(); }

  buscar(e: Event) {
    this.svc.listar({ Busqueda: (e.target as HTMLInputElement).value || undefined })
      .subscribe({ next: d => this.items.set(d.data), error: () => {} });
  }

  load() {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: d => { this.items.set(d.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  private blank() {
    return {
      Codigo: '', RazonSocial: '', NombreCorto: '', Ruc: '', Sector: '',
      Direccion: '', Telefono: '', EmailGeneral: '', SitioWeb: '', TipoPago: 'Contado', Notas: '',
      ContactoNombre: '', ContactoCargo: '', ContactoEmail: '', ContactoTelefono: '',
    };
  }

  nuevo() {
    this.editId.set(null);
    this.form = this.blank();
    this.formError.set('');
    this.modal.set(true);
  }

  editar(item: any) {
    this.editId.set(item.Id);
    this.form = {
      Codigo: item.Codigo ?? '', RazonSocial: item.RazonSocial ?? '', NombreCorto: item.NombreCorto ?? '',
      Ruc: item.Ruc ?? '', Sector: item.Sector ?? '', Direccion: item.Direccion ?? '',
      Telefono: item.Telefono ?? '', EmailGeneral: item.EmailGeneral ?? '', SitioWeb: item.SitioWeb ?? '',
      TipoPago: item.TipoPago ?? 'Contado', Notas: item.Notas ?? '',
      ContactoNombre: '', ContactoCargo: '', ContactoEmail: '', ContactoTelefono: '',
    };
    this.formError.set('');
    this.modal.set(true);
    // Cargar contactos del cliente
    this.contactos.set([]);
    this.contactoForm.set(false);
    this.cargandoContactos.set(true);
    this.contactoSvc.listar(item.Id).subscribe({
      next: c => { this.contactos.set(c ?? []); this.cargandoContactos.set(false); },
      error: () => { this.contactos.set([]); this.cargandoContactos.set(false); }
    });
  }

  cerrar() { this.modal.set(false); }
  private cerrarTrasGuardar() { this.modal.set(false); }

  guardar() {
    if (!this.form.RazonSocial.trim()) { this.formError.set('Ingresa la razón social.'); return; }
    if (!this.form.Ruc.trim())         { this.formError.set('Ingresa el RUC.'); return; }
    if (!this.form.Codigo.trim())      { this.formError.set('Ingresa el código.'); return; }

    const id = this.editId();
    this.guardando.set(true);
    const req$ = id ? this.svc.actualizar(id, this.form) : this.svc.crear(this.form);
    req$.subscribe({
      next: () => { this.guardando.set(false); this.cerrarTrasGuardar(); this.load(); },
      error: () => { this.guardando.set(false); this.formError.set('No se pudo guardar. Intenta de nuevo.'); }
    });
  }

  // ── Gestión de contactos ──
  private blankContacto() {
    return { Nombre: '', Cargo: '', Email: '', Celular: '', TelefonoFijo: '', EsPrincipal: false, Notas: '' };
  }

  inicial(nombre: string): string {
    return (nombre || '').split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase();
  }

  nuevoContacto() {
    this.cfId.set(null);
    this.cf = this.blankContacto();
    this.contactoForm.set(true);
  }

  editarContacto(ct: Contacto) {
    this.cfId.set(ct.Id);
    this.cf = {
      Nombre: ct.Nombre ?? '', Cargo: ct.Cargo ?? '', Email: ct.Email ?? '',
      Celular: ct.Celular ?? '', TelefonoFijo: ct.TelefonoFijo ?? '',
      EsPrincipal: ct.EsPrincipal ?? false, Notas: ct.Notas ?? '',
    };
    this.contactoForm.set(true);
  }

  cancelarContacto() { this.contactoForm.set(false); }

  guardarContacto() {
    if (!this.cf.Nombre.trim()) return;
    const clienteId = this.editId();
    if (!clienteId) return;
    const id = this.cfId();
    const req$ = id
      ? this.contactoSvc.actualizar(clienteId, id, this.cf)
      : this.contactoSvc.crear(clienteId, this.cf);
    req$.subscribe({
      next: () => { this.contactoForm.set(false); this.recargarContactos(clienteId); },
      error: () => {}
    });
  }

  eliminarContacto(ct: Contacto) {
    const clienteId = this.editId();
    if (!clienteId) return;
    this.confirm.eliminar(ct.Nombre).then(ok => {
      if (!ok) return;
      this.contactoSvc.eliminar(clienteId, ct.Id).subscribe({
        next: () => this.recargarContactos(clienteId), error: () => {}
      });
    });
  }

  private recargarContactos(clienteId: number) {
    this.contactoSvc.listar(clienteId).subscribe({
      next: c => this.contactos.set(c ?? []), error: () => {}
    });
  }
}
