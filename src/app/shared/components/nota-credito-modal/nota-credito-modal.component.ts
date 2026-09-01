import { Component, input, output, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService } from '../../../features/facturacion/services/factura.service';

interface MotivoSunat { codigo: string; label: string; }

const MOTIVOS_ANULACION: MotivoSunat[] = [
  { codigo: '01', label: '01 · Anulación de la operación' },
  { codigo: '02', label: '02 · Anulación por error en el RUC' },
  { codigo: '06', label: '06 · Devolución total' },
];

const MOTIVOS_DESCUENTO: MotivoSunat[] = [
  { codigo: '04', label: '04 · Descuento global' },
  { codigo: '05', label: '05 · Descuento por ítem' },
  { codigo: '07', label: '07 · Devolución por ítem' },
  { codigo: '08', label: '08 · Bonificación' },
  { codigo: '09', label: '09 · Disminución en el valor' },
  { codigo: '03', label: '03 · Corrección por error en la descripción' },
  { codigo: '10', label: '10 · Otros conceptos' },
];

interface ItemSeleccionable {
  Id: number;
  Descripcion: string;
  Cantidad: number;
  PrecioUnitario: number;
  UnidadMedida: string;
  CantidadDisponible: number;
  seleccionado: boolean;
  cantidadAcreditar: number;
}

@Component({
  selector: 'bwit-nota-credito-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nota-credito-modal.component.html',
  styleUrl: './nota-credito-modal.component.scss',
})
export class NotaCreditoModalComponent {
  private svc = inject(FacturaService);

  // Datos de la factura sobre la que se genera la NC
  facturaId       = input.required<number>();
  facturaCodigo   = input<string>('');
  facturaSubtotal = input<number>(0); // sin IGV — base para calcular el monto de la NC
  facturaSaldo    = input<number>(0);
  facturaMoneda   = input<string>('PEN');

  cerrar  = output<void>();
  creada  = output<{ Id: number; Codigo: string; Total: number }>();

  tipoNota = signal<'Anulacion' | 'Descuento'>('Anulacion');
  motivoCodigo = signal('01');
  motivoDescripcion = '';
  enviarSunat = true;
  emitidaPortalSunat = false;
  serieManual = '';
  numeroManual: number | null = null;

  items = signal<ItemSeleccionable[]>([]);
  cargandoItems = signal(false);

  guardando = signal(false);
  error = signal('');

  motivos = computed<MotivoSunat[]>(() => this.tipoNota() === 'Anulacion' ? MOTIVOS_ANULACION : MOTIVOS_DESCUENTO);
  cur = computed(() => this.facturaMoneda() === 'USD' ? '$' : 'S/');

  // Base sin IGV (coincide con el Subtotal que calcula el backend)
  montoBaseNC = computed(() => {
    if (this.tipoNota() === 'Anulacion') return this.facturaSubtotal();
    return this.items().reduce((s, it) => s + (it.seleccionado ? it.cantidadAcreditar * it.PrecioUnitario : 0), 0);
  });
  montoTotalNC = computed(() => {
    const sub = this.montoBaseNC();
    const igv = Math.round(sub * 0.18 * 100) / 100;
    return sub + igv;
  });

  constructor() {
    effect(() => {
      const id = this.facturaId();
      if (id) this.cargarItems(id);
    });
  }

  cargarItems(facturaId: number) {
    this.cargandoItems.set(true);
    this.svc.itemsCreditables(facturaId).subscribe({
      next: (r: any[]) => {
        this.items.set((r ?? []).map(it => ({
          ...it,
          seleccionado: false,
          cantidadAcreditar: it.CantidadDisponible,
        })));
        this.cargandoItems.set(false);
      },
      error: () => { this.items.set([]); this.cargandoItems.set(false); }
    });
  }

  cambiarTipo(t: 'Anulacion' | 'Descuento') {
    this.tipoNota.set(t);
    this.motivoCodigo.set(this.motivos()[0].codigo);
    this.error.set('');
  }

  toggleItem(it: ItemSeleccionable) {
    it.seleccionado = !it.seleccionado;
    this.items.set([...this.items()]);
  }

  ajustarCantidad(it: ItemSeleccionable, valor: number) {
    it.cantidadAcreditar = Math.max(0, Math.min(valor, it.CantidadDisponible));
    this.items.set([...this.items()]);
  }

  itemsSeleccionados = computed(() => this.items().filter(it => it.seleccionado && it.cantidadAcreditar > 0));

  confirmar() {
    if (this.tipoNota() === 'Descuento' && !this.itemsSeleccionados().length) {
      this.error.set('Selecciona al menos un item a acreditar.'); return;
    }
    if (this.emitidaPortalSunat && (!this.serieManual.trim() || !this.numeroManual)) {
      this.error.set('Ingresa la serie y el número de la NC emitida por el portal de SUNAT.'); return;
    }
    this.guardando.set(true);
    this.error.set('');
    this.svc.crearNotaCredito(this.facturaId(), {
      TipoNota: this.tipoNota(),
      MotivoCodigo: this.motivoCodigo(),
      MotivoDescripcion: this.motivoDescripcion || null,
      Items: this.tipoNota() === 'Descuento'
        ? this.itemsSeleccionados().map(it => ({ FacturaItemId: it.Id, Cantidad: it.cantidadAcreditar }))
        : null,
      EnviarSunat: this.enviarSunat,
      SerieManual: this.emitidaPortalSunat ? this.serieManual.trim() : null,
      NumeroManual: this.emitidaPortalSunat ? this.numeroManual : null,
    }).subscribe({
      next: (r: any) => {
        this.guardando.set(false);
        this.creada.emit(r);
      },
      error: (e: any) => {
        this.guardando.set(false);
        const raw = e?.error?.Message || e?.error?.Errors?.[0] || 'No se pudo generar la Nota de Crédito.';
        this.error.set(String(raw).replace(/^\[SqlException\]\s*/, ''));
      }
    });
  }
}
