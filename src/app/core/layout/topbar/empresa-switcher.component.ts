// ════════════════════════════════════════════════
// core/layout/topbar/empresa-switcher.component.ts
// Dropdown selector de empresa activa
// ════════════════════════════════════════════════
import { Component, signal, inject, HostListener } from '@angular/core';
import { EmpresaService, EmpresaItem } from '../../services/empresa.service';
import { ConfigPanelService } from '../../../features/configuracion/services/config-panel.service';

@Component({
  selector: 'bwit-empresa-switcher',
  standalone: true,
  imports: [],
  templateUrl: './empresa-switcher.component.html',
  styleUrl: './empresa-switcher.component.scss'
})
export class EmpresaSwitcherComponent {
  readonly empresa = inject(EmpresaService);
  private readonly configPanel = inject(ConfigPanelService);
  open = signal(false);

  toggle() { this.open.update(v => !v); }

  seleccionar(emp: EmpresaItem | null) {
    this.empresa.seleccionar(emp);
    this.open.set(false);
  }

  administrar() { this.open.set(false); this.configPanel.abrir('empresas'); }

  initial(nombre: string): string {
    return (nombre || '').split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase();
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('bwit-empresa-switcher')) this.open.set(false);
  }
}
