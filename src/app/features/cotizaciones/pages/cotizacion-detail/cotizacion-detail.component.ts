import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopbarComponent } from '../../../../core/layout/topbar/topbar.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading.component';
import { BadgePipe } from '../../../../shared/pipes/badge.pipe';
import { CotizacionService } from '../../services/cotizacion.service';
import { ClienteService } from '../../../clientes/services/cliente.service';
import { MaestroService } from '../../../configuracion/services/maestro.service';
import { AdjuntosComponent } from '../../../../shared/components/adjuntos.component';
import { AdjuntoService } from '../../../../core/services/adjunto.service';
import { ApiService } from '../../../../core/http/api.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';

@Component({
  selector: 'bwit-cotizacion-detail',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, TopbarComponent, UiLoadingComponent, BadgePipe, AdjuntosComponent],
  templateUrl: './cotizacion-detail.component.html',
  styleUrl: './cotizacion-detail.component.scss'
})
export class CotizacionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc   = inject(CotizacionService);
  private clienteSvc = inject(ClienteService);
  private maestroSvc = inject(MaestroService);
  private confirm    = inject(ConfirmService);
  private adjuntoSvc = inject(AdjuntoService);
  private api        = inject(ApiService);

  // ── Descuento ──
  modalDescuento = signal(false);
  descForm: any  = { tipo: 'Monto', valor: 0 };

  abrirDescuento() {
    this.descForm = { tipo: this.c()?.TipoDescuento || 'Monto', valor: this.c()?.DescuentoGlobal || 0 };
    this.modalDescuento.set(true);
  }
  cerrarDescuento() { this.modalDescuento.set(false); }

  aplicarDescuento() {
    const id = this.c()?.Id;
    if (!id || !this.descForm.valor) return;
    this.api.post<any>(`/api/cotizaciones/${id}/descuento`, {
      TipoDescuento: this.descForm.tipo,
      DescuentoValor: Number(this.descForm.valor),
    }).subscribe({
      next: () => { this.modalDescuento.set(false); this.recargar(); },
      error: () => {}
    });
  }

  // ── Perfiles de personal ──
  modalPerfil  = signal(false);
  perfiles     = signal<any[]>([]);
  pfError      = signal('');
  pfForm: any  = { perfil: '', cantidad: 1, tipoContrato: 'Planilla', tarifaMes: null,
                   tarifaHora: null, horasMes: null, dedicacionPct: 100, meses: 1, notas: '' };

  totalPerfiles = computed(() =>
    this.perfiles().reduce((s: number, p: any) => s + (Number(p.CostoEstimado) || 0), 0)
  );

  costoPerfilEstimado = computed(() => {
    const f = this.pfForm;
    if (f.tipoContrato === 'Recibo x H')
      return (Number(f.tarifaHora)||0) * (Number(f.horasMes)||0) * (Number(f.cantidad)||1) * (Number(f.meses)||1);
    return (Number(f.tarifaMes)||0) * (Number(f.dedicacionPct)||100)/100 * (Number(f.cantidad)||1) * (Number(f.meses)||1);
  });

  abrirPerfil() {
    const id = this.c()?.Id;
    if (!id) return;
    this.pfForm = { perfil: '', cantidad: 1, tipoContrato: 'Planilla', tarifaMes: null,
                    tarifaHora: null, horasMes: null, dedicacionPct: 100, meses: 1, notas: '' };
    this.pfError.set('');
    this.api.get<any>(`/api/cotizaciones/${id}/perfiles`).subscribe({
      next: (r: any) => this.perfiles.set(r?.data ?? r ?? []), error: () => {}
    });
    this.modalPerfil.set(true);
  }
  cerrarPerfil() { this.modalPerfil.set(false); }

  agregarPerfil() {
    const id = this.c()?.Id;
    if (!id || !this.pfForm.perfil.trim()) { this.pfError.set('Ingresa el perfil.'); return; }
    const body = {
      Perfil: this.pfForm.perfil,
      Cantidad: Number(this.pfForm.cantidad) || 1,
      TipoContrato: this.pfForm.tipoContrato,
      TarifaMes: this.pfForm.tarifaMes ? Number(this.pfForm.tarifaMes) : null,
      TarifaHora: this.pfForm.tarifaHora ? Number(this.pfForm.tarifaHora) : null,
      HorasMes: this.pfForm.horasMes ? Number(this.pfForm.horasMes) : null,
      DedicacionPct: Number(this.pfForm.dedicacionPct) || 100,
      Meses: Number(this.pfForm.meses) || 1,
      Notas: this.pfForm.notas || null,
    };
    this.api.post<any>(`/api/cotizaciones/${id}/perfiles`, body).subscribe({
      next: () => {
        this.pfError.set('');
        this.pfForm = { perfil: '', cantidad: 1, tipoContrato: 'Planilla', tarifaMes: null,
                        tarifaHora: null, horasMes: null, dedicacionPct: 100, meses: 1, notas: '' };
        this.api.get<any>(`/api/cotizaciones/${id}/perfiles`).subscribe({
          next: (r: any) => this.perfiles.set(r?.data ?? r ?? [])
        });
      },
      error: () => { this.pfError.set('No se pudo agregar.'); }
    });
  }

  eliminarPerfil(pf: any) {
    const id = this.c()?.Id;
    if (!id) return;
    this.confirm.eliminar(pf.Perfil).then(ok => {
      if (!ok) return;
      this.api.delete<any>(`/api/cotizaciones/${id}/perfiles/${pf.Id}`).subscribe({
        next: () => this.api.get<any>(`/api/cotizaciones/${id}/perfiles`).subscribe({
          next: (r: any) => this.perfiles.set(r?.data ?? r ?? [])
        })
      });
    });
  }


  // ── Modal rechazo cotización ──
  modalRechazo  = signal(false);
  motivoRechazo = '';

  c            = signal<any>(null);
  loading      = signal(true);
  responsables = signal<any[]>([]);

  // Símbolo de moneda dinámico
  cur = computed(() => this.c()?.Moneda === 'USD' ? 'US$' : 'S/');

  // Catálogos para el modal de edición
  clientes        = signal<any[]>([]);
  personal        = signal<any[]>([]);
  efContactos     = signal<any[]>([]);
  efResponsables  = signal<{id:number; nombre:string}[]>([]);
  efResponsableTmp: any = null;

  // ── Modal edición ──
  modalEdit     = signal(false);
  editError     = signal('');
  guardandoEdit = signal(false);
  ef: { clienteId: any; contactoId: any; titulo: string; tipo: string; fechaEmision: string; validezDias: number; moneda: string; condiciones: string; items: any[] } =
    { clienteId: null, contactoId: null, titulo: '', tipo: 'General', fechaEmision: '', validezDias: 30, moneda: 'PEN', condiciones: '', items: [] };

  subtotalEdit(): number {
    return (this.ef.items ?? []).reduce((s, i) => s + (Number(i.Cantidad) || 0) * (Number(i.PrecioUnitario) || 0), 0);
  }
  igvEdit(): number   { return this.subtotalEdit() * 0.18; }
  totalEdit(): number { return this.subtotalEdit() + this.igvEdit(); }

  readonly pasos = [
    { n: 1, label: 'Cotización' },
    { n: 2, label: 'Aceptación cliente' },
    { n: 3, label: 'Proyecto creado' },
  ];

  pasoActual = computed(() => {
    const e = this.c()?.Estado;
    if (this.c()?.ProyectoId) return 3;
    if (e === 'Aprobada') return 2;
    return 1;
  });

  private fmt(d: any): string {
    if (!d) return '—';
    try { return new DatePipe('es').transform(d, 'dd MMM') ?? '—'; } catch { return '—'; }
  }

  // Línea de tiempo real basada en estado y fechas
  timeline = computed(() => {
    const c = this.c();
    if (!c) return [] as any[];
    const ev: { fecha: string; titulo: string; sub?: string; estado: 'done' | 'active' | 'pending' }[] = [];
    const estado = c.Estado;

    // 1. Creada (siempre)
    ev.push({ fecha: this.fmt(c.FechaEmision), titulo: 'Cotización creada', estado: 'done' });

    // 2. Enviada
    if (['Enviada', 'En revision', 'Aprobada', 'Rechazada'].includes(estado)) {
      ev.push({ fecha: this.fmt(c.FechaEmision), titulo: 'Enviada al cliente', sub: c.ContactoEmail ? `Email: ${c.ContactoEmail}` : undefined, estado: 'done' });
    } else if (estado === 'Borrador') {
      ev.push({ fecha: '—', titulo: 'Pendiente de enviar', estado: 'active' });
      return ev;
    }

    // 3. Resolución
    if (estado === 'Aprobada') {
      ev.push({ fecha: this.fmt(c.FechaAceptacion), titulo: 'Aceptada por el cliente', estado: 'done' });
      if (c.ProyectoId) ev.push({ fecha: '—', titulo: 'Proyecto creado', estado: 'done' });
    } else if (estado === 'Rechazada') {
      ev.push({ fecha: this.fmt(c.FechaRechazo), titulo: 'Rechazada por el cliente', sub: c.MotivoRechazo || undefined, estado: 'done' });
    } else {
      ev.push({ fecha: '—', titulo: 'Esperando respuesta', estado: 'active' });
    }
    return ev;
  });

  recargar() {
    const id = this.c()?.Id;
    if (!id) return;
    this.svc.getById(id).subscribe({ next: d => this.c.set(d), error: () => {} });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getById(id).subscribe({
      next: d => {
        this.c.set(d);
        this.responsables.set(d?.Responsables ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  inicial(nombre: string): string {
    return (nombre || '').split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase();
  }

  private cambiar(estado: string, motivo?: string) {
    const id = this.c()?.Id;
    this.svc.cambiarEstado(id, { Estado: estado, Motivo: motivo ?? null }).subscribe({
      next: () => { this.c.update(v => ({ ...v, Estado: estado })); },
      error: () => {}
    });
  }

  marcarAceptada() {
    this.confirm.aprobar(this.c()?.Codigo ?? 'esta cotización',
      'La cotización pasará a estado Aprobada y podrás convertirla en proyecto.').then(ok => {
      if (!ok) return;
      this.cambiar('Aprobada');
    });
  }

  enviar() {
    this.confirm.open({
      tipo: 'guardar',
      titulo: 'Enviar cotización',
      mensaje: `¿Enviar la cotización <strong>${this.c()?.Codigo}</strong> al cliente?`,
      detalle: 'Pasará a estado "Enviada" y quedará pendiente de respuesta del cliente.',
      btnConfirmar: '✈ Enviar cotización',
      btnCancelar: 'Cancelar',
    }).then(ok => { if (!ok) return; this.cambiar('Enviada'); });
  }

  rechazar() {
    this.motivoRechazo = '';
    this.modalRechazo.set(true);
  }

  confirmarRechazo() {
    this.modalRechazo.set(false);
    this.cambiar('Rechazada', this.motivoRechazo || undefined);
  }

  editar() {
    const d = this.c();
    if (!d) return;
    this.ef = {
      clienteId:    d.ClienteId ?? null,
      contactoId:   d.ContactoId ?? null,
      titulo:       d.Titulo ?? '',
      tipo:         d.Tipo ?? 'General',
      fechaEmision: (d.FechaEmision ?? '').toString().split('T')[0],
      validezDias:  d.ValidezDias ?? 30,
      moneda:       d.Moneda ?? 'PEN',
      condiciones:  d.CondicionesComerciales ?? '',
      items: (d.Items ?? []).map((i: any) => ({
        Descripcion: i.Descripcion, Unidad: i.Unidad ?? '',
        Cantidad: i.Cantidad ?? 1, PrecioUnitario: i.PrecioUnitario ?? 0, Descuento: i.Descuento ?? 0,
      })),
    };
    if (!this.ef.items.length) this.addItem();

    // Precargar responsables actuales (UsuarioId = PersonalId)
    this.efResponsables.set((d.Responsables ?? []).map((r: any) => ({ id: r.UsuarioId ?? r.id, nombre: r.Nombre ?? r.nombre })));

    // Cargar catálogos
    if (!this.clientes().length) {
      this.clienteSvc.listar({ PageSize: 100 }).subscribe({ next: r => this.clientes.set(r.data ?? []), error: () => {} });
    }
    if (!this.personal().length) {
      this.svc.responsablesDisponibles().subscribe({ next: r => this.personal.set(r ?? []), error: () => {} });
    }
    if (this.ef.clienteId) this.cargarContactos(this.ef.clienteId);

    this.editError.set('');
    this.modalEdit.set(true);
  }

  onEfClienteChange() {
    this.ef.contactoId = null;
    this.efContactos.set([]);
    if (this.ef.clienteId) this.cargarContactos(this.ef.clienteId);
  }

  private cargarContactos(clienteId: number) {
    this.maestroSvc.listar<any>(`clientes/${clienteId}/contactos`).subscribe({
      next: r => this.efContactos.set(r.data ?? []),
      error: () => this.efContactos.set([])
    });
  }

  efAddResponsable() {
    const id = this.efResponsableTmp;
    if (!id) return;
    const p = this.personal().find(x => x.Id === id);
    if (p && !this.efResponsables().some(r => r.id === id)) {
      this.efResponsables.update(list => [...list, { id, nombre: p.Nombre }]);
    }
    this.efResponsableTmp = null;
  }

  efQuitarResponsable(id: number) {
    this.efResponsables.update(list => list.filter(r => r.id !== id));
  }

  cerrarEdit() { this.modalEdit.set(false); }
  addItem() { this.ef.items.push({ Descripcion: '', Unidad: '', Cantidad: 1, PrecioUnitario: 0, Descuento: 0 }); }
  removeItem(i: number) { this.ef.items.splice(i, 1); }
  recalc() { /* trigger CD; computed se recalculan solos */ this.ef = { ...this.ef }; }

  guardarEdit() {
    if (!this.ef.clienteId) { this.editError.set('Selecciona el cliente.'); return; }
    if (!this.ef.titulo.trim()) { this.editError.set('Ingresa el título.'); return; }
    if (!this.ef.items.length || this.ef.items.every(i => !i.Descripcion.trim())) {
      this.editError.set('Agrega al menos un item.'); return;
    }
    this.guardandoEdit.set(true);
    const body = {
      Titulo: this.ef.titulo,
      Tipo: this.ef.tipo,
      ClienteId: Number(this.ef.clienteId),
      ContactoId: this.ef.contactoId ? Number(this.ef.contactoId) : null,
      Responsables: this.efResponsables().map(r => r.id),
      ServicioId: this.c().ServicioId ?? null,
      OportunidadId: null,
      FechaEmision: this.ef.fechaEmision,
      ValidezDias: Number(this.ef.validezDias),
      Moneda: this.ef.moneda,
      CondicionesComerciales: this.ef.condiciones || null,
      Notas: this.c().Notas ?? null,
      Items: this.ef.items
        .filter(i => i.Descripcion.trim())
        .map(i => ({
          Descripcion: i.Descripcion, Unidad: i.Unidad || null,
          Cantidad: Number(i.Cantidad), PrecioUnitario: Number(i.PrecioUnitario), Descuento: Number(i.Descuento) || 0,
        })),
    };
    this.svc.actualizar(this.c().Id, body).subscribe({
      next: () => {
        this.guardandoEdit.set(false);
        this.modalEdit.set(false);
        this.svc.getById(this.c().Id).subscribe({ next: d => { this.c.set(d); this.responsables.set(d?.Responsables ?? []); } });
      },
      error: () => { this.guardandoEdit.set(false); this.editError.set('No se pudo guardar. Intenta de nuevo.'); }
    });
  }

  // ── Conversión a proyecto ──
  modalConvertir = signal(false);
  convirtiendo   = signal(false);
  convError      = signal('');
  contratoFile   = signal<File | null>(null);
  cv: { tipoProyecto: string; fechaInicio: string; fechaFin: string } = { tipoProyecto: '', fechaInicio: '', fechaFin: '' };

  convertir() {
    const d = this.c();
    if (!d) return;
    this.cv = {
      tipoProyecto: d.Tipo ?? 'General',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: '',
    };
    this.contratoFile.set(null);
    this.convError.set('');
    this.modalConvertir.set(true);
  }

  cerrarConvertir() { this.modalConvertir.set(false); }

  onContratoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.contratoFile.set(file);
  }

  quitarContrato() {
    this.contratoFile.set(null);
  }

  confirmarConvertir() {
    const id = this.c()?.Id;
    if (!id) return;
    if (!this.cv.fechaInicio) { this.convError.set('Selecciona la fecha de inicio.'); return; }
    if (!this.cv.fechaFin) { this.convError.set('Selecciona la fecha de fin.'); return; }
    if (this.cv.fechaFin <= this.cv.fechaInicio) { this.convError.set('La fecha de fin debe ser posterior a la de inicio.'); return; }
    this.convirtiendo.set(true);
    const body = {
      TipoProyecto: this.cv.tipoProyecto || 'General',
      FechaInicio: this.cv.fechaInicio,
      FechaFin: this.cv.fechaFin,
    };
    this.confirm.open({
      tipo: 'aprobar',
      titulo: 'Crear proyecto',
      mensaje: `¿Crear un proyecto a partir de la cotización <strong>${this.c()?.Codigo}</strong>?`,
      detalle: `Monto del proyecto: ${this.cur()} ${Number(this.c()?.Total ?? 0).toFixed(2)}. Una vez creado, el proyecto quedará vinculado a esta cotización.`,
      btnConfirmar: 'Crear proyecto',
      btnCancelar: 'Cancelar',
    }).then(ok => {
      if (!ok) { this.convirtiendo.set(false); return; }
      this.svc.convertir(id, body).subscribe({
        next: (r: any) => {
          const proyectoId = r?.proyectoId ?? r?.ProyectoId ?? r?.id ?? r?.Id ?? r?.NewId;
          // Subir contrato si se seleccionó
          const file = this.contratoFile();
          if (file && proyectoId) {
            this.adjuntoSvc.subir('Proyecto', proyectoId, file, 'Contrato firmado').subscribe({
              next: () => {
                this.convirtiendo.set(false);
                this.modalConvertir.set(false);
                this.recargar(); // Refrescar cotización
                this.router.navigate(['/proyectos', proyectoId]);
              },
              error: () => {
                // Proyecto se creó OK pero el archivo falló — navegar de todos modos
                this.convirtiendo.set(false);
                this.modalConvertir.set(false);
                this.recargar();
                this.router.navigate(['/proyectos', proyectoId]);
              }
            });
          } else {
            this.convirtiendo.set(false);
            this.modalConvertir.set(false);
            this.recargar(); // Refrescar cotización
            if (proyectoId) this.router.navigate(['/proyectos', proyectoId]);
          }
        },
        error: () => { this.convirtiendo.set(false); this.convError.set('No se pudo crear el proyecto. Intenta de nuevo.'); }
      });
    });
  }

  irAProyecto() {
    const pid = this.c()?.ProyectoId;
    if (pid) this.router.navigate(['/proyectos', pid]);
  }

  descargarPdf() {
  }
}
