import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopbarComponent } from '../../../../core/layout/topbar/topbar.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading.component';
import { BadgePipe } from '../../../../shared/pipes/badge.pipe';
import { AdjuntosComponent } from '../../../../shared/components/adjuntos.component';
import { CertificacionService } from '../../../certificaciones/services/certificacion.service';
import { ApiService } from '../../../../core/http/api.service';
import { FacturaService } from '../../../facturacion/services/factura.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { AdjuntoService } from '../../../../core/services/adjunto.service';
import { AdendaService } from '../../services/adenda.service';
import { ProyectoService } from '../../services/proyecto.service';

type Tab = 'resumen' | 'certificaciones' | 'ordenes' | 'facturas' | 'equipo' | 'tercerizados' | 'adjuntos' | 'adendas';

@Component({
  selector: 'bwit-proyecto-detail',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule, TopbarComponent, UiLoadingComponent, BadgePipe, AdjuntosComponent],
  templateUrl: './proyecto-detail.component.html',
  styleUrl: './proyecto-detail.component.scss'
})
export class ProyectoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc   = inject(ProyectoService);
  private certSvc = inject(CertificacionService);
  private facSvc  = inject(FacturaService);
  private api     = inject(ApiService);
  private adeSvc   = inject(AdendaService);
  private confirm  = inject(ConfirmService);
  private adjuntoSvc = inject(AdjuntoService);

  p       = signal<any>(null);
  loading = signal(true);
  tab     = signal<Tab>('resumen');
  facturas = signal<any[]>([]);
  facturasLoaded = signal(false);
  adendas = signal<any[]>([]);
  adendasLoaded = signal(false);

  readonly flujo = [
    { n: 1, label: 'Contrato firmado' },
    { n: 2, label: 'Trabajo realizado' },
    { n: 3, label: 'Certificación cliente' },
    { n: 4, label: 'Orden de compra' },
    { n: 5, label: 'Factura emitida' },
    { n: 6, label: 'Pago recibido' },
  ];

  // Símbolo de moneda dinámico
  cur = computed(() => this.p()?.Moneda === 'USD' ? 'US$' : 'S/');

  costos   = computed(() => (this.p()?.CostoEquipo ?? 0) + (this.p()?.CostoTerceros ?? 0));
  utilidad = computed(() => (this.p()?.MontoTotal ?? 0) - this.costos());
  margen   = computed(() => {
    const m = this.p()?.MontoTotal ?? 0;
    return m ? ((this.utilidad() / m) * 100).toFixed(1) : '0';
  });
  pasoActual = computed(() => {
    const est = this.p()?.Estado;
    if (est === 'Cerrado') return 7;
    if (est === 'Por cerrar') return 5;
    return 4; // Activo
  });

  ngOnInit() {
    this.recargar();
    // Deep-link: /proyectos/{id}?tab=tercerizados
    const tabQP = this.route.snapshot.queryParamMap.get('tab');
    if (tabQP) setTimeout(() => this.onTabChange(tabQP as Tab), 400);
  }

  onTabChange(t: Tab) {
    this.tab.set(t);
    if (t === 'facturas' && !this.facturasLoaded()) {
      this.facSvc.listar({ ProyectoId: this.p()?.Id, PageSize: 100 }).subscribe({
        next: d => { this.facturas.set(d.data ?? []); this.facturasLoaded.set(true); },
        error: () => {}
      });
    }
    if (t === 'adendas' && !this.adendasLoaded()) {
      this.cargarAdendas();
    }
    if (t === 'equipo' && !this.equipoPagosLoaded()) {
      this.cargarPagosEquipo();
    }
    if (t === 'tercerizados' && !this.terceriadosLoaded()) {
      this.cargarTercerizados();
    }
  }

  cargarAdendas() {
    const id = this.p()?.Id;
    if (!id) return;
    this.adeSvc.listar(id).subscribe({
      next: r => { this.adendas.set(r ?? []); this.adendasLoaded.set(true); },
      error: () => {}
    });
  }

  recargar() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getById(id).subscribe({
      next: d => { this.p.set(d); this.loading.set(false); this.facturasLoaded.set(false); this.cargarAdendas(); },
      error: () => { this.loading.set(false); }
    });
  }

  // ── Cuentas bancarias (para pagos) ──
  cuentasBancarias = signal<any[]>([]);

  cargarCuentas() {
    if (this.cuentasBancarias().length) return;
    this.api.get<any>('/api/cuentas-bancarias?PageSize=50').subscribe({
      next: (r: any) => this.cuentasBancarias.set(r?.data ?? r ?? []),
      error: () => {}
    });
  }

  // ── Tercerizados ──
  tercerizados       = signal<any[]>([]);
  proveedoresList    = signal<any[]>([]);
  terceriadosLoaded  = signal(false);
  modalTercerizado   = signal(false);
  tcError            = signal('');
  tcForm: any = { proveedor:'', servicio:'', periodo:'', costo:0, moneda:'PEN', facturaProveedor:'', fechaPago:'', notas:'' };

  // ── Equipo ──
  equipoPagos       = signal<any[]>([]);
  equipoPagosLoaded = signal(false);
  personalList      = signal<any[]>([]);

  // KPIs calculados
  // ── Progreso ──
  editandoProgreso  = signal(false);
  progresoPctEdit   = 0;

  abrirProgreso() {
    this.progresoPctEdit = this.p()?.ProgresoPct ?? 0;
    this.editandoProgreso.set(true);
  }

  cancelarProgreso() { this.editandoProgreso.set(false); }

  recalcularProgreso() {
    const certs = this.p()?.Certificaciones ?? [];
    const monto = this.p()?.MontoTotal ?? 0;
    const aprobado = certs
      .filter((c: any) => c.Estado === 'Aprobada')
      .reduce((s: number, c: any) => s + (Number(c.Monto) || 0), 0);
    this.progresoPctEdit = monto > 0 ? Math.round((aprobado / monto) * 100) : 0;
  }

  guardarProgreso() {
    const id = this.p()?.Id;
    if (!id) return;
    this.api.patch<any>(`/api/proyectos/${id}/progreso`, { ProgresoPct: this.progresoPctEdit }).subscribe({
      next: () => {
        this.editandoProgreso.set(false);
        this.p.update(v => ({ ...v, ProgresoPct: this.progresoPctEdit }));
      },
      error: () => {}
    });
  }

  costoTotalEquipo = computed(() =>
    (this.p()?.Asignaciones ?? []).reduce((s: number, a: any) => s + (Number(a.CostoMensual) || 0), 0)
  );
  totalPagadoEquipo = computed(() =>
    (this.p()?.Asignaciones ?? []).reduce((s: number, a: any) => s + (Number(a.TotalPagado) || 0), 0)
  );

  // ── Modal asignar persona ──
  modalAsignar = signal(false);
  asigError    = signal('');
  asigForm: any = {
    personalId: null, rolProyecto: '', tipoContrato: 'Planilla',
    dedicacionPct: 100, horasMes: null, tarifaMes: null, tarifaHora: null,
    fechaInicio: '', fechaFin: ''
  };

  costoEstimado = computed(() => {
    if (this.asigForm.tipoContrato === 'Recibo x H') {
      return (Number(this.asigForm.horasMes) || 0) * (Number(this.asigForm.tarifaHora) || 0);
    }
    return (Number(this.asigForm.tarifaMes) || 0) * (Number(this.asigForm.dedicacionPct) || 100) / 100;
  });

  // ── Modal registrar pago ──
  modalPago = signal(false);
  pagoAsig  = signal<any>(null);
  pagoError = signal('');
  pagoForm: any = { tipoPago: 'Planilla', periodo: '', concepto: '', monto: 0, fechaPago: '', pagado: false };

  // ── Modal nueva certificación ──
  modalCert  = signal(false);
  certError  = signal('');
  certFiles  = signal<File[]>([]);
  certForm: any = { periodo: '', tipo: 'Mensual', descripcion: '', montoSinIgv: 0, descuentoTipo: 'ninguno', descuentoValor: 0, fechaInicio: '', fechaFin: '' };
  certTotal  = signal(0);
  certDescuento = signal(0);
  certMontoNeto = signal(0);

  // ── Modal editar certificación ──
  modalCertEdit = signal(false);
  certEditando  = signal<any>(null);

  // ── Modal ver certificación ──
  modalCertVer = signal(false);
  certViendo   = signal<any>(null);

  // ── Modal aprobar certificación (registrar OC) ──
  modalAprobar = signal(false);
  certAprobar  = signal<any>(null);
  ocError      = signal('');
  ocForm: any = { numeroOC: '', numeroRecepcion: '', tipoOC: 'Por avance', fechaAprobacion: '' };

  // ── Modal emitir factura desde certificación ──
  modalFactura = signal(false);
  certFacturar = signal<any>(null);
  facError     = signal('');
  facturando   = signal(false);
  facItems     = signal<any[]>([]);
  facSubtotal  = signal(0);
  facIgv       = signal(0);
  facTotal     = signal(0);
  facForm: any = {
    tipoComprobante: 'Factura', serie: 'F001', correlativo: '00000',
    periodoServicio: '', fechaEmision: '', condicionPago: 'Crédito 30 días',
    moneda: 'PEN', enviarSunat: true, enviarEmail: true, aplicaDetraccion: false,
  };

  abrirCert() {
    this.certForm = { periodo: '', tipo: 'Mensual', descripcion: '', montoSinIgv: 0, descuentoTipo: 'ninguno', descuentoValor: 0, fechaInicio: '', fechaFin: '' };
    this.certTotal.set(0);
    this.certDescuento.set(0);
    this.certMontoNeto.set(0);
    this.certFiles.set([]);
    this.certError.set('');
    this.modalCert.set(true);
  }
  cerrarCert() { this.modalCert.set(false); }

  onCertFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.certFiles.set(Array.from(input.files));
  }
  quitarCertFile(i: number) { this.certFiles.update(f => f.filter((_, idx) => idx !== i)); }

  recalcCert() {
    const monto = Number(this.certForm.montoSinIgv) || 0;
    let descuento = 0;
    if (this.certForm.descuentoTipo === 'Porcentaje') {
      descuento = Math.round(monto * (Number(this.certForm.descuentoValor) || 0) / 100 * 100) / 100;
    } else if (this.certForm.descuentoTipo === 'MontoFijo') {
      descuento = Math.round((Number(this.certForm.descuentoValor) || 0) * 100) / 100;
    }
    const neto = monto - descuento;
    this.certDescuento.set(descuento);
    this.certMontoNeto.set(neto);
    this.certTotal.set(Math.round(neto * 1.18 * 100) / 100);
  }

  guardarCert(estado: string) {
    if (!this.certForm.periodo.trim()) { this.certError.set('Ingresa el periodo.'); return; }
    if (!this.certForm.montoSinIgv || this.certForm.montoSinIgv <= 0) { this.certError.set('Ingresa el monto a certificar.'); return; }
    const body: any = {
      ProyectoId: this.p()?.Id,
      Periodo: this.certForm.periodo,
      Descripcion: this.certForm.descripcion,
      Monto: Number(this.certForm.montoSinIgv),
      Archivo: null,
      Estado: estado === 'enviar' ? 'En revision' : 'Borrador',
      FechaInicio: this.certForm.fechaInicio || null,
      FechaFin: this.certForm.fechaFin || null,
    };
    if (this.certForm.descuentoTipo !== 'ninguno' && Number(this.certForm.descuentoValor) > 0) {
      body.DescuentoTipo = this.certForm.descuentoTipo;
      body.DescuentoValor = Number(this.certForm.descuentoValor);
    }
    this.certSvc.crear(body).subscribe({
      next: (r: any) => {
        const certId = r?.id ?? r?.Id ?? r?.NewId;
        // Subir adjuntos si hay
        const files = this.certFiles();
        if (files.length && certId) {
          let pending = files.length;
          files.forEach(f => {
            this.adjuntoSvc.subir('Certificacion', certId, f).subscribe({
              next: () => { if (--pending === 0) { this.cerrarCert(); this.recargar(); } },
              error: () => { if (--pending === 0) { this.cerrarCert(); this.recargar(); } }
            });
          });
        } else {
          this.cerrarCert(); this.recargar();
        }
      },
      error: () => { this.certError.set('No se pudo crear la certificación.'); }
    });
  }

  // ── Ver certificación ──
  verCert(c: any) {
    this.certViendo.set(c);
    this.modalCertVer.set(true);
  }
  cerrarCertVer() { this.modalCertVer.set(false); }

  // ── Editar certificación ──
  editarCert(c: any) {
    this.certEditando.set(c);
    this.certForm = {
      periodo: c.Periodo, tipo: c.Tipo ?? 'Mensual', descripcion: c.Descripcion ?? '',
      montoSinIgv: c.Subtotal ?? c.Monto, descuentoTipo: c.DescuentoTipo ?? 'ninguno',
      descuentoValor: c.DescuentoValor ?? 0, fechaInicio: c.FechaInicio ? new Date(c.FechaInicio).toISOString().split('T')[0] : '',
      fechaFin: c.FechaFin ? new Date(c.FechaFin).toISOString().split('T')[0] : '',
    };
    this.recalcCert();
    this.certError.set('');
    this.modalCertEdit.set(true);
  }
  cerrarCertEdit() { this.modalCertEdit.set(false); }

  guardarCertEdit() {
    const c = this.certEditando();
    if (!c) return;
    if (!this.certForm.periodo.trim()) { this.certError.set('Ingresa el periodo.'); return; }
    if (!this.certForm.montoSinIgv || this.certForm.montoSinIgv <= 0) { this.certError.set('Ingresa el monto.'); return; }
    const body: any = {
      Periodo: this.certForm.periodo,
      Descripcion: this.certForm.descripcion,
      Monto: Number(this.certForm.montoSinIgv),
      FechaInicio: this.certForm.fechaInicio || null,
      FechaFin: this.certForm.fechaFin || null,
    };
    if (this.certForm.descuentoTipo !== 'ninguno' && Number(this.certForm.descuentoValor) > 0) {
      body.DescuentoTipo = this.certForm.descuentoTipo;
      body.DescuentoValor = Number(this.certForm.descuentoValor);
    }
    this.certSvc.editar(c.Id, body).subscribe({
      next: () => { this.cerrarCertEdit(); this.recargar(); },
      error: () => { this.certError.set('No se pudo actualizar.'); }
    });
  }

  aprobarCert(c: any) {
    this.certAprobar.set(c);
    this.ocForm = { numeroOC: '', numeroRecepcion: '', tipoOC: 'Por avance', fechaAprobacion: new Date().toISOString().split('T')[0] };
    this.ocError.set('');
    this.modalAprobar.set(true);
  }

  cerrarAprobar() { this.modalAprobar.set(false); }

  confirmarAprobar() {
    const c = this.certAprobar();
    if (!c) return;
    if (!this.ocForm.numeroOC.trim()) { this.ocError.set('Ingresa el N° de orden de compra.'); return; }
    const body = {
      NumeroOC: this.ocForm.numeroOC,
      NumeroRecepcion: this.ocForm.numeroRecepcion || null,
      TipoOC: this.ocForm.tipoOC,
      FechaAprobacion: this.ocForm.fechaAprobacion,
      ArchivoOC: null,
    };
    this.certSvc.aprobar(c.Id, body).subscribe({
      next: () => { this.modalAprobar.set(false); this.recargar(); },
      error: () => { this.ocError.set('No se pudo aprobar. Intenta de nuevo.'); }
    });
  }

  motivoRechazo = '';
  certARechazar: any = null;
  modalRechazoCert = signal(false);

  rechazarCert(c: any) {
    this.certARechazar = c;
    this.motivoRechazo = '';
    this.modalRechazoCert.set(true);
  }

  confirmarRechazoCert() {
    const c = this.certARechazar;
    if (!c) return;
    this.certSvc.cambiarEstado(c.Id, { Estado: 'Rechazada', Motivo: this.motivoRechazo || null }).subscribe({
      next: () => { this.modalRechazoCert.set(false); this.recargar(); },
      error: () => {}
    });
  }

  enviarCert(c: any) {
    this.confirm.open({
      tipo: 'guardar',
      titulo: 'Enviar al cliente',
      mensaje: `¿Enviar la certificación <strong>${c.Codigo}</strong> al cliente para su revisión?`,
      detalle: 'El cliente recibirá la certificación y podrá aprobarla o rechazarla.',
      btnConfirmar: '✈ Enviar',
      btnCancelar: 'Cancelar',
    }).then(ok => {
      if (!ok) return;
      this.certSvc.cambiarEstado(c.Id, { Estado: 'En revision', Motivo: null }).subscribe({
        next: () => this.recargar(), error: () => {}
      });
    });
  }

  // ── Emitir factura desde certificación aprobada ──
  emitirFactura(c: any) {
    this.certFacturar.set(c);
    const hoy = new Date().toISOString().split('T')[0];
    this.facForm = {
      tipoComprobante: 'Factura', serie: 'F001', correlativo: '00000',
      periodoServicio: c.Periodo ?? '', fechaEmision: hoy,
      condicionPago: 'Crédito 30 días', moneda: this.p()?.Moneda ?? 'PEN',
      enviarSunat: true, enviarEmail: true, aplicaDetraccion: false,
      portalSunat: false, serieManual: '', numeroManual: null,
      descuentoTipo: 'ninguno', descuentoValor: 0,
    };
    // Items solo con el monto bruto (sin descuento)
    const subtotal = Number(c.Subtotal ?? c.Monto) || 0;
    this.facItems.set([{
      Descripcion: c.Descripcion || `Certificación ${c.Codigo} · ${c.Periodo}`,
      Cantidad: 1, PrecioUnitario: subtotal,
    }]);
    // Si la cert tiene descuento, pre-cargar el descuento global
    if (c.DescuentoTipo && Number(c.MontoDescuento) > 0) {
      this.facForm.descuentoTipo = c.DescuentoTipo;
      this.facForm.descuentoValor = Number(c.DescuentoValor) || 0;
    }
    this.calcFacTotales();
    this.facError.set('');
    this.modalFactura.set(true);
  }

  cerrarFactura() { this.modalFactura.set(false); }

  onTipoComprobanteChange() {
    this.facForm.serie = this.facForm.tipoComprobante === 'Boleta' ? 'B001' : 'F001';
  }

  addFacItem() {
    this.facItems.update(list => [...list, { Descripcion: '', Cantidad: 1, PrecioUnitario: 0 }]);
  }

  removeFacItem(i: number) {
    this.facItems.update(list => list.filter((_, idx) => idx !== i));
    this.calcFacTotales();
  }

  facDescuento = signal(0);

  calcFacTotales() {
    const sub = this.facItems().reduce((s, it) => s + (Number(it.Cantidad) || 0) * (Number(it.PrecioUnitario) || 0), 0);
    let descuento = 0;
    if (this.facForm.descuentoTipo === 'Porcentaje') {
      descuento = Math.round(sub * (Number(this.facForm.descuentoValor) || 0) / 100 * 100) / 100;
    } else if (this.facForm.descuentoTipo === 'MontoFijo') {
      descuento = Math.round((Number(this.facForm.descuentoValor) || 0) * 100) / 100;
    }
    const valorVenta = sub - descuento;
    this.facSubtotal.set(sub);
    this.facDescuento.set(descuento);
    this.facIgv.set(Math.round(valorVenta * 0.18 * 100) / 100);
    this.facTotal.set(Math.round(valorVenta * 1.18 * 100) / 100);
  }

  calcVencimiento() { /* trigger change detection */ }

  facVencimiento(): string {
    if (!this.facForm.fechaEmision) return '—';
    const dias = this.facForm.condicionPago === 'Contado' ? 0
      : Number((this.facForm.condicionPago || '').match(/\d+/)?.[0] || 30);
    const d = new Date(this.facForm.fechaEmision + 'T00:00:00');
    d.setDate(d.getDate() + dias);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  confirmarFactura(modo: string) {
    const c = this.certFacturar();
    const proyecto = this.p();
    if (!c || !proyecto) return;
    if (!this.facForm.fechaEmision) { this.facError.set('Selecciona la fecha de emisión.'); return; }
    if (this.facForm.portalSunat) {
      if (!(this.facForm.serieManual || '').trim()) { this.facError.set('Ingresa la serie (ej. F001) de la factura emitida por SUNAT.'); return; }
      if (!this.facForm.numeroManual) { this.facError.set('Ingresa el número correlativo de la factura emitida por SUNAT.'); return; }
    }
    if (!this.facItems().length || this.facItems().every((i: any) => !i.Descripcion.trim())) {
      this.facError.set('Agrega al menos un item con descripción.'); return;
    }
    this.facturando.set(true);
    const dias = this.facForm.condicionPago === 'Contado' ? 0
      : Number((this.facForm.condicionPago || '').match(/\d+/)?.[0] || 30);
    const body = {
      ProyectoId: proyecto.Id,
      ClienteId: proyecto.ClienteId,
      CertificacionId: c.Id,
      TipoComprobante: this.facForm.tipoComprobante,
      FechaEmision: this.facForm.fechaEmision,
      DiasVencimiento: dias,
      CondicionPago: this.facForm.condicionPago || null,
      PeriodoServicio: this.facForm.periodoServicio || null,
      Moneda: this.facForm.moneda,
      Estado: modo === 'borrador' ? 'Borrador' : 'Pendiente',
      SerieManual: this.facForm.portalSunat ? (this.facForm.serieManual || '').trim() : null,
      NumeroManual: this.facForm.portalSunat && this.facForm.numeroManual ? Number(this.facForm.numeroManual) : null,
      DescuentoTipo: this.facForm.descuentoTipo !== 'ninguno' && Number(this.facForm.descuentoValor) > 0 ? this.facForm.descuentoTipo : null,
      DescuentoValor: this.facForm.descuentoTipo !== 'ninguno' && Number(this.facForm.descuentoValor) > 0 ? Number(this.facForm.descuentoValor) : null,
      Items: this.facItems()
        .filter((i: any) => i.Descripcion.trim())
        .map((i: any) => ({
          Descripcion: i.Descripcion,
          Cantidad: Number(i.Cantidad) || 1,
          PrecioUnitario: Number(i.PrecioUnitario) || 0,
          UnidadMedida: 'Servicio',
        })),
    };
    this.facSvc.crear(body).subscribe({
      next: () => { this.facturando.set(false); this.modalFactura.set(false); this.recargar(); },
      error: () => { this.facturando.set(false); this.facError.set('No se pudo emitir la factura. Intenta de nuevo.'); }
    });
  }

  montoCobro = '';
  facturaACobrar: any = null;
  modalCobro = signal(false);
  cobroError = signal('');
  cobroForm: any = { metodoPagoId: null, cuentaBancariaId: null, referencia: '', notas: '', fechaPago: '' };
  metodosPago = signal<any[]>([]);

  // Modal historial de cobros
  modalCobros = signal(false);
  cobrosFactura = signal<any[]>([]);
  facturaCobros: any = null;

  verCobros(f: any) {
    this.facturaCobros = f;
    this.api.get<any>(`/api/facturas/${f.Id}/cobros`).subscribe({
      next: (r: any) => { this.cobrosFactura.set(r?.data ?? r ?? []); this.modalCobros.set(true); },
      error: () => {}
    });
  }

  // Editar cobro
  modalEditCobro = signal(false);
  cobroAEditar: any = null;
  editCobroForm: any = { monto: 0, fechaPago: '', cuentaBancariaId: null, referencia: '' };

  editarCobro(cb: any) {
    this.cobroAEditar = cb;
    this.editCobroForm = {
      monto: cb.Monto,
      fechaPago: cb.FechaPago ? String(cb.FechaPago).split('T')[0] : '',
      cuentaBancariaId: null,
      referencia: cb.Referencia || '',
    };
    this.cargarCuentas();
    this.modalEditCobro.set(true);
  }

  guardarEditCobro() {
    const cb = this.cobroAEditar;
    if (!cb || !this.editCobroForm.monto) return;
    const body = {
      Monto: Number(this.editCobroForm.monto),
      FechaPago: this.editCobroForm.fechaPago,
      CuentaBancariaId: this.editCobroForm.cuentaBancariaId ? Number(this.editCobroForm.cuentaBancariaId) : null,
      Referencia: this.editCobroForm.referencia || null,
      Notas: null,
    };
    this.api.put<any>(`/api/facturas/cobros/${cb.Id}`, body).subscribe({
      next: () => {
        this.modalEditCobro.set(false);
        this.verCobros(this.facturaCobros);
        this.facturasLoaded.set(false); this.onTabChange('facturas'); this.recargar();
      },
      error: () => {}
    });
  }

  eliminarCobro(cb: any) {
    this.confirm.eliminar(`el cobro de S/ ${Number(cb.Monto).toFixed(2)}`).then(ok => {
      if (!ok) return;
      this.api.delete<any>(`/api/facturas/cobros/${cb.Id}`).subscribe({
        next: () => {
          this.verCobros(this.facturaCobros);
          this.facturasLoaded.set(false); this.onTabChange('facturas'); this.recargar();
        },
        error: () => {}
      });
    });
  }

  // Pagos de un tercerizado
  modalPagosTc = signal(false);
  tcPagosDe: any = null;
  pagosTcList = signal<any[]>([]);

  verPagosTc(t: any) {
    this.tcPagosDe = t;
    const id = this.p()?.Id;
    if (!id) return;
    this.api.get<any>(`/api/proyectos/${id}/tercerizados/${t.Id}/pagos`).subscribe({
      next: (r: any) => { this.pagosTcList.set(r?.data ?? r ?? []); this.modalPagosTc.set(true); },
      error: () => {}
    });
  }

  eliminarPagoTc(pg: any) {
    const id = this.p()?.Id;
    if (!id) return;
    this.confirm.eliminar(`el pago de S/ ${Number(pg.Monto).toFixed(2)}`).then(ok => {
      if (!ok) return;
      this.api.delete<any>(`/api/proyectos/${id}/tercerizados/pagos/${pg.Id}`).subscribe({
        next: () => {
          this.modalPagosTc.set(false);
          this.terceriadosLoaded.set(false); this.cargarTercerizados(); this.recargar();
        },
        error: () => {}
      });
    });
  }

  cobrarFactura(f: any) {
    this.facturaACobrar = f;
    this.montoCobro = String(f.Saldo ?? f.Total ?? '');
    this.cobroForm = {
      metodoPagoId: null, cuentaBancariaId: null, referencia: '', notas: '',
      fechaPago: new Date().toISOString().split('T')[0],
    };
    this.cargarCuentas();
    this.cobroError.set('');
    this.modalCobro.set(true);
  }

  confirmarCobro() {
    const f = this.facturaACobrar;
    const monto = this.montoCobro;
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      this.cobroError.set('Ingresa un monto válido.'); return;
    }
    if (!this.cobroForm.cuentaBancariaId) {
      this.cobroError.set('Selecciona la cuenta bancaria de ingreso.'); return;
    }
    this.cobroError.set('');

    const body = {
      FacturaId: f.Id,
      FechaPago: this.cobroForm.fechaPago || new Date().toISOString().split('T')[0],
      Monto: Number(monto),
      MetodoPagoId: this.cobroForm.metodoPagoId ? Number(this.cobroForm.metodoPagoId) : 0,
      CuentaBancariaId: this.cobroForm.cuentaBancariaId ? Number(this.cobroForm.cuentaBancariaId) : null,
      Referencia: this.cobroForm.referencia?.trim() || null,
      Notas: this.cobroForm.notas?.trim() || null,
    };

    // Cuenta seleccionada para mostrarla en la confirmación
    const cuenta = this.cuentasBancarias().find((c: any) => c.Id === Number(this.cobroForm.cuentaBancariaId));
    const cuentaTxt = cuenta ? `${cuenta.Banco} · ${cuenta.Alias}` : '';

    // Cerrar el modal ANTES de confirmar (evita superposición de backdrops)
    this.modalCobro.set(false);

    this.confirm.open({
      tipo: 'guardar',
      titulo: 'Registrar cobro',
      mensaje: `¿Registrar el cobro de <strong>S/ ${Number(monto).toFixed(2)}</strong> para la factura <strong>${f.Codigo}</strong>?`,
      detalle: cuentaTxt ? `Ingreso a: ${cuentaTxt}` : undefined,
      btnConfirmar: '$ Registrar cobro',
      btnCancelar: 'Cancelar',
    }).then(ok => {
      if (!ok) { this.modalCobro.set(true); return; }  // reabrir modal si cancela
      this.facSvc.registrarPago(body).subscribe({
        next: () => { this.facturasLoaded.set(false); this.onTabChange('facturas'); this.recargar(); },
        error: () => { this.cobroError.set('No se pudo registrar el cobro. Intenta de nuevo.'); this.modalCobro.set(true); }
      });
    });
  }

  // ── Workflow de aprobación de factura ──
  accionFactura(f: any, accion: string) {
    const mensajes: Record<string, { titulo: string; msg: string; btn: string; tipo: any }> = {
      'Validada':        { tipo: 'guardar',  titulo: 'Validar factura',        msg: `¿Validar la factura <strong>${f.Codigo}</strong>?`, btn: 'Validar' },
      'Aprobada':        { tipo: 'aprobar',  titulo: 'Aprobar factura',        msg: `¿Aprobar la factura <strong>${f.Codigo}</strong>?`, btn: '✓ Aprobar' },
      'Enviada SUNAT':   { tipo: 'guardar',  titulo: 'Enviar a SUNAT',         msg: `¿Enviar la factura <strong>${f.Codigo}</strong> a SUNAT?`, btn: '📤 Enviar a SUNAT' },
      'Enviada cliente': { tipo: 'guardar',  titulo: 'Enviar al cliente',      msg: `¿Enviar la factura <strong>${f.Codigo}</strong> al cliente?`, btn: '✉ Enviar al cliente' },
      'Rechazada':       { tipo: 'rechazar', titulo: 'Rechazar factura',       msg: `¿Rechazar la factura <strong>${f.Codigo}</strong>?`, btn: '✕ Rechazar' },
    };
    const cfg = mensajes[accion];
    if (!cfg) return;
    this.confirm.open({
      tipo: cfg.tipo,
      titulo: cfg.titulo,
      mensaje: cfg.msg,
      btnConfirmar: cfg.btn,
      btnCancelar: 'Cancelar',
    }).then(ok => {
      if (!ok) return;
      let comentario = null;
      this.facSvc.aprobar(f.Id, { Accion: accion, Comentario: comentario }).subscribe({
        next: () => { this.facturasLoaded.set(false); this.onTabChange('facturas'); },
        error: () => {}
      });
    });
  }

  // ── Modal de trazabilidad / historial ──
  modalHistorial = signal(false);
  facHistorial   = signal<any[]>([]);
  facHistorialOf = signal<any>(null);

  verHistorialFactura(f: any) {
    this.facHistorialOf.set(f);
    this.facHistorial.set([]);
    this.modalHistorial.set(true);
    this.facSvc.historial(f.Id).subscribe({
      next: (r: any) => this.facHistorial.set(r ?? []),
      error: () => {}
    });
  }

  cerrarHistorial() { this.modalHistorial.set(false); }

  // ── Modal nueva adenda ──
  modalAdenda = signal(false);
  adendaError = signal('');
  adeForm: any = { tipo: 'Incremento monto', montoNuevo: null, fechaFinNueva: '', motivo: '' };

  abrirAdenda() {
    this.adeForm = {
      tipo: 'Incremento monto',
      montoNuevo: this.p()?.MontoTotal ?? null,
      fechaFinNueva: this.p()?.FechaFin ? new Date(this.p()!.FechaFin).toISOString().split('T')[0] : '',
      motivo: '',
    };
    this.adendaError.set('');
    this.modalAdenda.set(true);
  }

  cerrarAdenda() { this.modalAdenda.set(false); }

  guardarAdenda() {
    if (!this.adeForm.motivo.trim()) { this.adendaError.set('Ingresa el motivo de la adenda.'); return; }
    const tipo = this.adeForm.tipo;
    const body = {
      Tipo: tipo,
      MontoNuevo: (tipo === 'Incremento monto' || tipo === 'Ambos') ? Number(this.adeForm.montoNuevo) || null : null,
      FechaFinNueva: (tipo === 'Ampliación plazo' || tipo === 'Ambos') ? (this.adeForm.fechaFinNueva || null) : null,
      Motivo: this.adeForm.motivo,
    };
    const id = this.p()?.Id;
    if (!id) return;
    this.adeSvc.crear(id, body).subscribe({
      next: () => { this.modalAdenda.set(false); this.cargarAdendas(); },
      error: () => { this.adendaError.set('No se pudo registrar la adenda.'); }
    });
  }

  aprobarAdenda(a: any) {
    const id = this.p()?.Id;
    if (!id) return;
    // usar confirm moderno - el código continúa abajo con .then
    this.adeSvc.aprobar(id, a.Id, { FechaAprobacion: new Date().toISOString().split('T')[0] }).subscribe({
      next: () => { this.cargarAdendas(); this.recargar(); },
      error: () => {}
    });
  }

  inicial(nombre: string): string {
    return (nombre || '').split(' ').slice(0,2).map(p => p[0] ?? '').join('').toUpperCase();
  }

  // ── Métodos Equipo ────────────────────────────────────────

  abrirAsignar() {
    if (!this.personalList().length) {
      this.api.get<any[]>('/api/personal?PageSize=100').subscribe({
        next: (r: any) => this.personalList.set(r?.data ?? r ?? []), error: () => {}
      });
    }
    const p = this.p();
    this.asigForm = {
      personalId: null, rolProyecto: '', tipoContrato: 'Planilla',
      dedicacionPct: 100, horasMes: null, tarifaMes: null, tarifaHora: null,
      fechaInicio: p?.FechaInicio ? new Date(p.FechaInicio).toISOString().split('T')[0] : '',
      fechaFin: p?.FechaFin ? new Date(p.FechaFin).toISOString().split('T')[0] : '',
    };
    this.asigError.set('');
    this.modalAsignar.set(true);
  }

  cerrarAsignar() { this.modalAsignar.set(false); }

  onPersonalChange() {
    const p = this.personalList().find((x: any) => x.Id === this.asigForm.personalId);
    if (p) {
      this.asigForm.tarifaMes   = p.SueldoActual ?? null;
      this.asigForm.tarifaHora  = p.TarifaHora  ?? null;
      if (!this.asigForm.rolProyecto) this.asigForm.rolProyecto = p.Cargo ?? '';
    }
  }

  calcCosto() { /* trigger computed */ }

  confirmarAsignar() {
    if (!this.asigForm.personalId) { this.asigError.set('Selecciona una persona.'); return; }
    if (!this.asigForm.fechaInicio) { this.asigError.set('Ingresa la fecha de inicio.'); return; }
    const id = this.p()?.Id;
    if (!id) return;
    const body = {
      PersonalId: Number(this.asigForm.personalId),
      RolProyecto: this.asigForm.rolProyecto || null,
      TipoContrato: this.asigForm.tipoContrato,
      DedicacionPct: this.asigForm.tipoContrato !== 'Recibo x H' ? Number(this.asigForm.dedicacionPct) : null,
      HorasMes: this.asigForm.tipoContrato === 'Recibo x H' ? Number(this.asigForm.horasMes) : null,
      TarifaMes: this.asigForm.tipoContrato !== 'Recibo x H' ? Number(this.asigForm.tarifaMes) : null,
      TarifaHora: this.asigForm.tipoContrato === 'Recibo x H' ? Number(this.asigForm.tarifaHora) : null,
      FechaInicio: this.asigForm.fechaInicio,
      FechaFin: this.asigForm.fechaFin || null,
    };
    this.api.post<any>(`/api/proyectos/${id}/equipo`, body).subscribe({
      next: () => { this.modalAsignar.set(false); this.recargar(); this.cargarPagosEquipo(); },
      error: () => { this.asigError.set('No se pudo asignar. Intenta de nuevo.'); }
    });
  }

  quitarAsignacion(a: any) {
    const id = this.p()?.Id;
    if (!id) return;
    this.confirm.eliminar(`${a.Recurso} del equipo`).then(ok => {
      if (!ok) return;
      this.api.delete<any>(`/api/proyectos/${id}/equipo/${a.Id}`).subscribe({
        next: () => { this.recargar(); this.cargarPagosEquipo(); }, error: () => {}
      });
    });
  }

  cargarPagosEquipo() {
    const id = this.p()?.Id;
    if (!id) return;
    this.api.get<any[]>(`/api/proyectos/${id}/equipo/pagos`).subscribe({
      next: r => { this.equipoPagos.set((r as any)?.data ?? r ?? []); this.equipoPagosLoaded.set(true); },
      error: () => {}
    });
  }

  abrirPago(a: any) {
    this.pagoAsig.set(a);
    const hoy = new Date();
    const mes = hoy.toLocaleString('es', { month: 'long' });
    const anio = hoy.getFullYear();
    this.pagoForm = {
      tipoPago: a.TipoContrato || 'Planilla',
      periodo: `${mes.charAt(0).toUpperCase()+mes.slice(1)} ${anio}`,
      concepto: `Sueldo ${mes} ${anio} (${a.DedicacionPct ? a.DedicacionPct+'%' : a.HorasMes+'h'})`,
      monto: a.CostoMensual || 0,
      fechaPago: new Date(hoy.getFullYear(), hoy.getMonth()+1, 0).toISOString().split('T')[0], // último día del mes
      pagado: false,
    };
    this.pagoError.set('');
    this.modalPago.set(true);
  }

  cerrarPago() { this.modalPago.set(false); }

  confirmarPago() {
    const a = this.pagoAsig();
    const id = this.p()?.Id;
    if (!a || !id) return;
    if (!this.pagoForm.concepto.trim()) { this.pagoError.set('Ingresa el concepto del pago.'); return; }
    if (!this.pagoForm.monto || this.pagoForm.monto <= 0) { this.pagoError.set('Ingresa un monto válido.'); return; }
    const body = {
      AsignacionId: a.Id,
      Periodo: this.pagoForm.periodo,
      TipoPago: this.pagoForm.tipoPago,
      Concepto: this.pagoForm.concepto,
      Monto: Number(this.pagoForm.monto),
      FechaPago: this.pagoForm.fechaPago,
      Pagado: this.pagoForm.pagado,
    };
    this.api.post<any>(`/api/proyectos/${id}/equipo/pagos`, body).subscribe({
      next: () => { this.modalPago.set(false); this.cargarPagosEquipo(); this.recargar(); },
      error: () => { this.pagoError.set('No se pudo registrar el pago. Intenta de nuevo.'); }
    });
  }

  // Modal pagar equipo (con banco/cuenta)
  modalPagoEq  = signal(false);
  eqAPagar: any = null;
  pagoEqForm: any = { cuentaBancariaId: null, referencia: '' };

  pagarNow(pg: any) {
    this.eqAPagar = pg;
    this.pagoEqForm = { cuentaBancariaId: null, referencia: '' };
    this.cargarCuentas();
    this.modalPagoEq.set(true);
  }

  confirmarPagoEq() {
    const id = this.p()?.Id;
    const pg = this.eqAPagar;
    if (!id || !pg) return;
    const body = {
      CuentaBancariaId: this.pagoEqForm.cuentaBancariaId ? Number(this.pagoEqForm.cuentaBancariaId) : null,
      ReferenciaPago: this.pagoEqForm.referencia || null,
    };
    this.api.post<any>(`/api/proyectos/${id}/equipo/pagos/${pg.Id}/pagar`, body).subscribe({
      next: () => { this.modalPagoEq.set(false); this.cargarPagosEquipo(); },
      error: () => {}
    });
  }

  // ── Métodos Tercerizados ──────────────────────────────────

  cargarTercerizados() {
    const id = this.p()?.Id;
    if (!id) return;
    this.api.get<any>(`/api/proyectos/${id}/tercerizados`).subscribe({
      next: (r: any) => { this.tercerizados.set(r?.data ?? r ?? []); this.terceriadosLoaded.set(true); },
      error: () => {}
    });
  }

  // Certificación a vincular (desde lado 2) y lista de aprobadas (lado 1)
  certVinculada = signal<any | null>(null);
  certsAprobadas = signal<any[]>([]);

  abrirTercerizado(certPrefill?: any) {
    const hoy = new Date();
    const mes = hoy.toLocaleString('es', { month: 'long' });
    const periodoDefault = `${mes.charAt(0).toUpperCase()+mes.slice(1)} ${hoy.getFullYear()}`;
    this.certVinculada.set(certPrefill ?? null);
    this.tcForm = {
      proveedorId: null, proveedorNombre: '', servicio: '',
      // si viene de una certificación, copiar su periodo (el costo queda vacío)
      periodo: certPrefill?.Periodo || periodoDefault,
      costo: null, moneda: 'PEN', facturaProveedor: '', fechaPago: '', notas: '',
      certificacionId: certPrefill?.Id ?? null,
    };
    this.tcError.set('');
    if (!this.proveedoresList().length) {
      this.api.get<any>('/api/proveedores?PageSize=200').subscribe({
        next: (r: any) => this.proveedoresList.set(r?.data ?? r ?? []),
        error: () => {}
      });
    }
    // Cargar certificaciones aprobadas del proyecto para el selector (lado 1)
    const pid = this.p()?.Id;
    if (pid && !certPrefill) {
      this.api.get<any>(`/api/proyectos/${pid}/certificaciones-aprobadas`).subscribe({
        next: (r: any) => this.certsAprobadas.set(r?.data ?? r ?? []),
        error: () => {}
      });
    }
    this.modalTercerizado.set(true);
  }

  onProveedorChange() {
    const p = this.proveedoresList().find((x: any) => x.Id == this.tcForm.proveedorId);
    if (p) this.tcForm.proveedorNombre = p.RazonSocial;
  }

  cerrarTercerizado() {
    const volverACert = this.certVinculada();
    this.modalTercerizado.set(false);
    this.certVinculada.set(null);
    // Si venía del modal de certificación, reabrirlo
    if (volverACert) setTimeout(() => this.modalCertTerc.set(true), 150);
  }

  confirmarTercerizado() {
    const nombreProv = this.tcForm.proveedorNombre?.trim() || '';
    if (!nombreProv) { this.tcError.set('Selecciona o ingresa el proveedor.'); return; }
    if (!this.tcForm.servicio.trim()) { this.tcError.set('Ingresa el servicio.'); return; }
    if (!this.tcForm.costo || Number(this.tcForm.costo) <= 0) { this.tcError.set('Ingresa el costo.'); return; }
    const id = this.p()?.Id;
    if (!id) return;
    const body = {
      Proveedor: nombreProv,
      Servicio: this.tcForm.servicio,
      Periodo: this.tcForm.periodo,
      Costo: Number(this.tcForm.costo),
      Moneda: this.tcForm.moneda,
      FacturaProveedor: this.tcForm.facturaProveedor || null,
      FechaPago: this.tcForm.fechaPago || null,
      Notas: this.tcForm.notas || null,
      CertificacionId: this.tcForm.certificacionId ? Number(this.tcForm.certificacionId) : null,
    };
    this.modalTercerizado.set(false);
    this.api.post<any>(`/api/proyectos/${id}/tercerizados`, body).subscribe({
      next: () => {
        this.terceriadosLoaded.set(false); this.cargarTercerizados(); this.recargar();
        // Si venía vinculado a una certificación, refrescar y reabrir su modal
        if (this.certDetalle() && this.certVinculada()) {
          this.cargarCertTercerizados(this.certDetalle().Id);
          setTimeout(() => this.modalCertTerc.set(true), 150);
        }
        this.certVinculada.set(null);
      },
      error: () => { this.tcError.set('No se pudo registrar. Intenta de nuevo.'); this.modalTercerizado.set(true); }
    });
  }

  // ── Lado 2: tercerizados vinculados a una certificación ──
  certDetalle = signal<any | null>(null);
  certTercerizados = signal<any[]>([]);
  modalCertTerc = signal(false);

  abrirCertTercerizados(cert: any) {
    this.certDetalle.set(cert);
    this.certTercerizados.set([]);
    this.cargarCertTercerizados(cert.Id);
    this.modalCertTerc.set(true);
  }

  cargarCertTercerizados(certId: number) {
    this.api.get<any>(`/api/certificaciones/${certId}/tercerizados`).subscribe({
      next: (r: any) => this.certTercerizados.set(r?.data ?? r ?? []),
      error: () => this.certTercerizados.set([]),
    });
  }

  registrarTercerizadoDesdeCert(cert: any) {
    // Cerrar modal certificación primero (evita superposición de modales)
    this.modalCertTerc.set(false);
    // Pequeño delay para que el backdrop se cierre antes de abrir el nuevo
    setTimeout(() => this.abrirTercerizado(cert), 150);
  }

  desvincularTercerizado(t: any) {
    const pid = this.p()?.Id;
    if (!pid) return;
    this.confirm.eliminar(`el vínculo con ${t.Proveedor}`).then(ok => {
      if (!ok) return;
      this.api.put<any>(`/api/proyectos/${pid}/tercerizados/${t.Id}/certificacion`, { CertificacionId: null }).subscribe({
        next: () => {
          if (this.certDetalle()) this.cargarCertTercerizados(this.certDetalle().Id);
          this.terceriadosLoaded.set(false); this.cargarTercerizados();
        },
        error: () => {}
      });
    });
  }

  // Modal pagar tercerizado (con banco/cuenta)
  modalPagoTc  = signal(false);
  tcAPagar: any = null;
  pagoTcForm: any = { cuentaBancariaId: null, referencia: '', fechaPago: '' };

  pagarTercerizado(t: any) {
    this.tcAPagar = t;
    const saldo = t.Saldo ?? t.Costo;
    this.pagoTcForm = {
      monto: saldo,
      cuentaBancariaId: null,
      referencia: '',
      fechaPago: new Date().toISOString().split('T')[0],
    };
    this.cargarCuentas();
    this.modalPagoTc.set(true);
  }

  confirmarPagoTc() {
    const id = this.p()?.Id;
    const t = this.tcAPagar;
    if (!id || !t) return;
    const body = {
      Monto: this.pagoTcForm.monto ? Number(this.pagoTcForm.monto) : null,
      CuentaBancariaId: this.pagoTcForm.cuentaBancariaId ? Number(this.pagoTcForm.cuentaBancariaId) : null,
      ReferenciaPago: this.pagoTcForm.referencia || null,
      FechaPago: this.pagoTcForm.fechaPago || null,
    };
    this.api.post<any>(`/api/proyectos/${id}/tercerizados/${t.Id}/pagar`, body).subscribe({
      next: () => { this.modalPagoTc.set(false); this.terceriadosLoaded.set(false); this.cargarTercerizados(); this.recargar(); },
      error: () => {}
    });
  }

  eliminarTercerizado(t: any) {
    const id = this.p()?.Id;
    if (!id) return;
    this.confirm.eliminar(`${t.Proveedor} — ${t.Servicio}`).then(ok => {
      if (!ok) return;
      this.api.delete<any>(`/api/proyectos/${id}/tercerizados/${t.Id}`).subscribe({
        next: () => { this.terceriadosLoaded.set(false); this.cargarTercerizados(); this.recargar(); },
        error: () => {}
      });
    });
  }
}