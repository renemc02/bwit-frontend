// ════════════════════════════════════════════════
// features/configuracion/services/config-panel.service.ts
// Controla el estado abierto/cerrado del drawer de configuración
// ════════════════════════════════════════════════
import { Injectable, signal } from '@angular/core';

export type ConfigSection =
  | 'empresas' | 'clientes' | 'personal' | 'proveedores' | 'servicios'
  | 'metodos-pago' | 'cuentas-bancarias' | 'bancos' | 'usuarios' | 'roles';

@Injectable({ providedIn: 'root' })
export class ConfigPanelService {
  readonly abierto = signal(false);
  readonly seccion = signal<ConfigSection>('empresas');

  abrir(seccion: ConfigSection = 'empresas') {
    this.seccion.set(seccion);
    this.abierto.set(true);
  }

  cerrar() { this.abierto.set(false); }

  ir(seccion: ConfigSection) { this.seccion.set(seccion); }
}
