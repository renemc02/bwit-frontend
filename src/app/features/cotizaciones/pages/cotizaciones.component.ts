import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopbarComponent } from '../../../core/layout/topbar/topbar.component';
import { UiEmptyComponent } from '../../../shared/components/ui-empty.component';
import { UiLoadingComponent } from '../../../shared/components/ui-loading.component';
import { BadgePipe } from '../../../shared/pipes/badge.pipe';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { CotizacionService } from '../services/cotizacion.service';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { ClienteService } from '../../clientes/services/cliente.service';
import { MaestroService } from '../../configuracion/services/maestro.service';

interface ItemForm { descripcion: string; unidad: string; cantidad: number; precioUnitario: number; descuento: number; }

const ESTADOS_FILTER = [
  { label: 'Todas', value: '' },
  { label: 'Borrador', value: 'Borrador' },
  { label: 'En revisión cliente', value: 'En revision' },
  { label: 'Aceptada', value: 'Aprobada' },
  { label: 'Rechazada', value: 'Rechazada' },
];

const IGV = 0.18;

@Component({
  selector: 'bwit-cotizaciones',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, TopbarComponent,
            UiEmptyComponent, UiLoadingComponent, BadgePipe, SafeHtmlPipe],
  templateUrl: './cotizaciones.component.html',
  styleUrl: './cotizaciones.component.scss'
})
export class CotizacionesComponent implements OnInit {
  private readonly svc         = inject(CotizacionService);
  private readonly router      = inject(Router);
  private readonly clienteSvc  = inject(ClienteService);
  private readonly confirm     = inject(ConfirmService);
  private readonly maestroSvc  = inject(MaestroService);

  // ── Lista ──────────────────────────────────────────────────
  items        = signal<any[]>([]);
  loading      = signal(true);
  vista        = signal<'tabla'|'kanban'>('tabla');
  filtroEstado = signal('');
  readonly estadosFiltro = ESTADOS_FILTER;

  // ── Kanban computed ────────────────────────────────────────
  kanbanCols = computed(() => {
    const cols = [
      { estado: 'Borrador',    label: 'Borrador',         items: [] as any[], total: 0 },
      { estado: 'En revision', label: 'En revisión',      items: [] as any[], total: 0 },
      { estado: 'Aprobada',    label: 'Aceptada',         items: [] as any[], total: 0 },
      { estado: 'Rechazada',   label: 'Rechazada',        items: [] as any[], total: 0 },
    ];
    this.items().forEach(item => {
      const col = cols.find(c => c.estado === item.Estado);
      if (col) { col.items.push(item); col.total += item.Total; }
    });
    return cols;
  });

  // ── Modal ──────────────────────────────────────────────────
  modalAbierto = signal(false);
  clientes     = signal<any[]>([]);
  contactos    = signal<any[]>([]);
  contactoEmail = signal<string>('');
  personal     = signal<any[]>([]);
  servicios    = signal<any[]>([]);
  responsables = signal<{id:number; nombre:string}[]>([]);
  responsableTmp: any = null;
  guardando    = signal(false);
  formError    = signal('');

  form = {
    clienteId:             '' as any,
    clienteFacturacionId:  null as any,
    contactoId:            null as any,
    servicioId:            null as any,
    tipo:        'General',
    titulo:      '',
    fechaEmision: new Date().toISOString().split('T')[0],
    validezDias: 30,
    moneda:      'PEN',
    notas:       '',
  };

  formItems  = signal<ItemForm[]>([{ descripcion: '', unidad: '', cantidad: 1, precioUnitario: 0, descuento: 0 }]);
  subtotal   = signal(0);
  igvMonto   = signal(0);
  total      = signal(0);

  // ── Lifecycle ──────────────────────────────────────────────
  ngOnInit() { this.load(); }

  // ── Carga lista ────────────────────────────────────────────
  setEstado(v: string) { this.filtroEstado.set(v); this.load(); }
  buscar(e: Event)     {
    const q = (e.target as HTMLInputElement).value || undefined;
    this.svc.listar({ Busqueda: q, estado: this.filtroEstado() || undefined })
      .subscribe({ next: d => this.items.set(d.data ?? []), error: () => {} });
  }

  load() {
    this.loading.set(true);
    const params: any = {};
    if (this.filtroEstado()) params.estado = this.filtroEstado();
    this.svc.listar(params).subscribe({
      next:  d => { this.items.set(d.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  verDetalle(item: any) {
    this.router.navigate(['/cotizaciones', item.Id]);
  }

  // ── Modal ──────────────────────────────────────────────────
  abrirModal() {
    this.resetForm();
    this.modalAbierto.set(true);
    if (!this.clientes().length) {
      this.clienteSvc.listar({ PageSize: 100 }).subscribe({
        next: d => this.clientes.set(d.data ?? []),
        error: () => {}
      });
    }
    // Cargar personal para responsables de seguimiento
    if (!this.personal().length) {
      this.svc.responsablesDisponibles().subscribe({
        next: d => this.personal.set(d ?? []),
        error: () => {}
      });
    }
    // Cargar servicios
    if (!this.servicios().length) {
      this.maestroSvc.listar<any>('servicios', { PageSize: 100 }).subscribe({
        next: d => this.servicios.set(d.data ?? []),
        error: () => {}
      });
    }
  }

  // Al cambiar cliente, cargar sus contactos
  onClienteChange() {
    this.form.contactoId = null;
    this.contactoEmail.set('');
    this.contactos.set([]);
    const id = Number(this.form.clienteId);
    if (!id) return;
    this.maestroSvc.listar<any>(`clientes/${id}/contactos`).subscribe({
      next: d => this.contactos.set(d.data ?? []),
      error: () => this.contactos.set([])
    });
  }

  onContactoChange() {
    const ct = this.contactos().find(c => c.Id === this.form.contactoId);
    this.contactoEmail.set(ct?.Email ?? '');
  }

  agregarResponsable() {
    const id = this.responsableTmp;
    if (!id) return;
    const p = this.personal().find(x => x.Id === id);
    if (p && !this.responsables().some(r => r.id === id)) {
      this.responsables.update(list => [...list, { id, nombre: p.Nombre }]);
    }
    this.responsableTmp = null;
  }

  quitarResponsable(id: number) {
    this.responsables.update(list => list.filter(r => r.id !== id));
  }

  cerrarModal() { this.resetForm(); this.modalAbierto.set(false); }

  agregarItem() {
    this.formItems.update(items => [
      ...items,
      { descripcion: '', unidad: '', cantidad: 1, precioUnitario: 0, descuento: 0 }
    ]);
  }

  quitarItem(idx: number) {
    this.formItems.update(items => items.filter((_, i) => i !== idx));
    this.recalcular();
  }

  recalcular() {
    const sub = this.formItems().reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
    const igv = sub * IGV;
    this.subtotal.set(sub);
    this.igvMonto.set(igv);
    this.total.set(sub + igv);
  }

  guardar(accionEstado: string) {
    // Validar
    if (!this.form.clienteId) { this.formError.set('Selecciona un cliente.'); return; }
    if (!this.form.titulo.trim()) { this.formError.set('Ingresa un título.'); return; }
    const itemsValidos = this.formItems().filter(i => i.descripcion.trim());
    if (!itemsValidos.length) { this.formError.set('Agrega al menos un ítem con descripción.'); return; }

    this.formError.set('');
    this.guardando.set(true);

      const body = {
        Titulo:     this.form.titulo,
        Tipo:       this.form.tipo,
        ClienteId:  Number(this.form.clienteId),
        ClienteFacturacionId: this.form.clienteFacturacionId ? Number(this.form.clienteFacturacionId) : null,
        ContactoId: this.form.contactoId ? Number(this.form.contactoId) : null,
        Responsables: this.responsables().map(r => r.id),
        ServicioId: this.form.servicioId ? Number(this.form.servicioId) : null,
        OportunidadId: null,
        FechaEmision: new Date(this.form.fechaEmision).toISOString(),
        ValidezDias: this.form.validezDias,
        Moneda:     this.form.moneda,
        CondicionesComerciales: this.form.notas || null,
        Notas:      null,
        Items: itemsValidos.map((it, i) => ({
          Descripcion:    it.descripcion,
          Unidad:         it.unidad || null,
          Cantidad:       it.cantidad,
          PrecioUnitario: it.precioUnitario,
          Descuento:      it.descuento,
        })),
      };

      this.svc.crear(body).subscribe({
        next: () => {
          this.guardando.set(false);
          this.resetForm();
          this.modalAbierto.set(false);
          this.load();
        },
        error: () => {
        this.guardando.set(false);
        this.formError.set('Error al guardar. Intenta nuevamente.');
      }
    });
  }

  private resetForm() {
    this.form = {
      clienteId:             '',
      clienteFacturacionId:  null,
      contactoId:            null,
      servicioId:            null,
      tipo:         'General',
      titulo:       '',
      fechaEmision: new Date().toISOString().split('T')[0],
      validezDias:  30,
      moneda:       'PEN',
      notas:        '',
    };
    this.contactos.set([]);
    this.contactoEmail.set('');
    this.responsables.set([]);
    this.responsableTmp = null;
    this.formItems.set([{ descripcion: '', unidad: '', cantidad: 1, precioUnitario: 0, descuento: 0 }]);
    this.subtotal.set(0); this.igvMonto.set(0); this.total.set(0);
    this.formError.set('');
    this.guardando.set(false);
  }

  nombreCliente(id: any): string {
    return this.clientes().find(c => c.Id == id)?.RazonSocial ?? '';
  }
}