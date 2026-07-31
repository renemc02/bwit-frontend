import { Injectable, signal } from '@angular/core';

export interface ConfirmConfig {
  tipo: 'eliminar' | 'guardar' | 'salir' | 'aprobar' | 'rechazar' | 'anular' | 'warning' | 'info';
  titulo: string;
  mensaje: string;
  detalle?: string;
  btnConfirmar: string;
  btnCancelar?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  visible  = signal(false);
  config   = signal<ConfirmConfig | null>(null);

  private resolver?: (ok: boolean) => void;

  open(cfg: ConfirmConfig): Promise<boolean> {
    this.config.set(cfg);
    this.visible.set(true);
    return new Promise(resolve => { this.resolver = resolve; });
  }

  confirmar() { this.close(true);  }
  cancelar()  { this.close(false); }

  private close(ok: boolean) {
    this.visible.set(false);
    this.config.set(null);
    this.resolver?.(ok);
    this.resolver = undefined;
  }

  // ── Helpers de atajos ──────────────────────────────────
  eliminar(nombre: string): Promise<boolean> {
    return this.open({
      tipo: 'eliminar',
      titulo: 'Eliminar registro',
      mensaje: `¿Eliminar <strong>${nombre}</strong>?`,
      detalle: 'Esta acción no se puede deshacer.',
      btnConfirmar: 'Sí, eliminar',
      btnCancelar: 'Cancelar',
    });
  }

  salir(formulario = 'formulario'): Promise<boolean> {
    return this.open({
      tipo: 'salir',
      titulo: '¿Descartar cambios?',
      mensaje: `Tienes cambios sin guardar en el <strong>${formulario}</strong>.`,
      detalle: 'Si sales ahora, perderás los cambios realizados.',
      btnConfirmar: 'Sí, descartar',
      btnCancelar: 'Volver al formulario',
    });
  }

  guardar(accion = 'guardar los cambios'): Promise<boolean> {
    return this.open({
      tipo: 'guardar',
      titulo: 'Confirmar acción',
      mensaje: `¿Confirmas ${accion}?`,
      btnConfirmar: '✓ Confirmar',
      btnCancelar: 'Cancelar',
    });
  }

  aprobar(codigo: string, detalle?: string): Promise<boolean> {
    return this.open({
      tipo: 'aprobar',
      titulo: `Aprobar ${codigo}`,
      mensaje: `¿Confirmas la aprobación de <strong>${codigo}</strong>?`,
      detalle,
      btnConfirmar: '✓ Aprobar',
      btnCancelar: 'Cancelar',
    });
  }
}
