// ════════════════════════════════════════════════
// features/configuracion/config-drawer.component.ts
// Drawer deslizante de Configuración (overlay)
// ════════════════════════════════════════════════
import { Component, inject, computed } from '@angular/core';
import { ConfigPanelService, ConfigSection } from './services/config-panel.service';
import { CfgEmpresasComponent } from './pages/maestros/empresas.component';
import { CfgUsuariosComponent } from './pages/maestros/usuarios.component';
import { CfgRolesComponent } from './pages/maestros/roles.component';
import { MaestroTablaComponent } from './pages/maestros/maestro-tabla.component';
import { MAESTROS_CONFIG } from './pages/maestros/maestros.config';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';

interface NavItem { id: ConfigSection; label: string; icon: string; group: string; }

const ICONS: Record<string, string> = {
  empresas:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>`,
  clientes:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>`,
  personal:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
  proveedores: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  servicios:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>`,
  'metodos-pago': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  'cuentas-bancarias': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
  usuarios:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
  bancos:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
  roles:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  close:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

@Component({
  selector: 'bwit-config-drawer',
  standalone: true,
  imports: [CfgEmpresasComponent, CfgUsuariosComponent, CfgRolesComponent, MaestroTablaComponent, SafeHtmlPipe],
  templateUrl: './config-drawer.component.html',
  styleUrl: './config-drawer.component.scss'
})
export class ConfigDrawerComponent {
  readonly panel = inject(ConfigPanelService);
  readonly ICONS = ICONS;

  readonly grupos = ['Maestros', 'Finanzas', 'Seguridad'];

  navItems: NavItem[] = [
    { id: 'empresas',          label: 'Empresas',          icon: 'empresas',          group: 'Maestros' },
    { id: 'clientes',          label: 'Clientes',          icon: 'clientes',          group: 'Maestros' },
    { id: 'personal',          label: 'Personal',          icon: 'personal',          group: 'Maestros' },
    { id: 'proveedores',       label: 'Proveedores',       icon: 'proveedores',       group: 'Maestros' },
    { id: 'servicios',         label: 'Servicios',         icon: 'servicios',         group: 'Maestros' },
    { id: 'metodos-pago',      label: 'Métodos de pago',   icon: 'metodos-pago',      group: 'Finanzas' },
    { id: 'bancos',            label: 'Bancos',            icon: 'bancos',            group: 'Finanzas' },
    { id: 'cuentas-bancarias', label: 'Cuentas bancarias', icon: 'cuentas-bancarias', group: 'Finanzas' },
    { id: 'usuarios',          label: 'Usuarios',          icon: 'usuarios',          group: 'Seguridad' },
    { id: 'roles',             label: 'Roles y permisos',  icon: 'roles',             group: 'Seguridad' },
  ];

  navPorGrupo(grupo: string): NavItem[] {
    return this.navItems.filter(i => i.group === grupo);
  }

  tituloSeccion = computed(() => {
    return this.navItems.find(i => i.id === this.panel.seccion())?.label ?? '';
  });

  configActual = computed(() => MAESTROS_CONFIG[this.panel.seccion()]);
}
