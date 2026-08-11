import { Component, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../services/theme.service';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { ConfigPanelService } from '../../../features/configuracion/services/config-panel.service';
import { PermissionService } from '../../auth/permission.service';
import { EmpresaService } from '../../services/empresa.service';

interface NavItem { label: string; route: string; icon: string; section?: string; badge?: number; modulo?: string; }

const I: Record<string, string> = {
  'layout-dashboard': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
  'git-branch':       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>`,
  'file-text':        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  'briefcase':        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>`,
  'clipboard-check':  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>`,
  'bar-chart':        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
  'pie-chart':        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
  'trending-up':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  'shopping-cart':    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>`,
  'wallet':           `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4z"/></svg>`,
  'receipt':          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/></svg>`,
  'users':            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  'user-check':       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`,
  'settings':         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  'chevron-left':     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  'chevron-right':    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  'sun':              `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  'moon':             `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`,
  'log-out':          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};

@Component({
  selector: 'bwit-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SafeHtmlPipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly auth     = inject(AuthService);
  readonly theme    = inject(ThemeService);
  readonly collapsed = signal(false);
  private readonly configPanel = inject(ConfigPanelService);
  readonly perm = inject(PermissionService);

  private readonly empresaSvc = inject(EmpresaService);

  abrirConfig() { this.configPanel.abrir('empresas'); }

  constructor() {
    // Al recargar página, cargar empresas y permisos si hay sesión activa
    if (this.auth.isAuthenticated()) {
      this.empresaSvc.cargar();
      if (!this.perm.loaded()) {
        this.perm.cargar(this.auth.rol());
      }
    }
  }

  private allNavItems: NavItem[] = [
    { label: 'Dashboard',      route: '/dashboard',       icon: 'layout-dashboard', section: 'Resumen', modulo: 'dashboard' },
    { label: 'Pipeline',       route: '/pipeline',        icon: 'git-branch',       section: 'Comercial', modulo: 'pipeline' },
    { label: 'Cotizaciones',   route: '/cotizaciones',    icon: 'file-text',        modulo: 'cotizaciones' },
    { label: 'Clientes',       route: '/clientes',        icon: 'users',            modulo: 'clientes' },
    { label: 'Proyectos',      route: '/proyectos',       icon: 'briefcase',        section: 'Operación', modulo: 'proyectos' },
    { label: 'Equipo',         route: '/equipo',          icon: 'user-check',       modulo: 'equipo' },
    { label: 'Certificaciones',route: '/certificaciones', icon: 'clipboard-check',  modulo: 'certificaciones' },
    { label: 'Facturación',    route: '/facturacion',     icon: 'receipt',          section: 'Finanzas', modulo: 'facturacion' },
    { label: 'Cobros',         route: '/pagos/cobros',    icon: 'trending-up',      modulo: 'pagos' },
    { label: 'Pagos',          route: '/pagos/equipo',    icon: 'wallet',           modulo: 'pagos' },
    { label: 'Compras terceros', route: '/pagos/terceros', icon: 'shopping-cart',   modulo: 'pagos' },
    { label: 'Reportes',       route: '/reportes',        icon: 'bar-chart',        modulo: 'reportes' },
    { label: 'Fact. x Cliente', route: '/facturacion-cliente', icon: 'pie-chart',   modulo: 'reportes' },
    { label: 'Configuración',  route: '/configuracion',   icon: 'settings',         section: 'Sistema', modulo: 'configuracion' },
  ];

  // Filtrar menú reactivamente según permisos
  navItems = computed(() => {
    // Leer señales explícitamente para que Angular detecte cambios
    const admin = this.perm.isAdmin();
    const perms = this.perm.permisos();
    const loaded = this.perm.loaded();
    
    // Mientras no se cargan los permisos, Admin ve todo, otros ven solo dashboard
    if (!loaded && !admin) {
      return this.allNavItems.filter(i => i.modulo === 'dashboard');
    }

    return this.allNavItems.filter(item => {
      if (!item.modulo) return true;
      if (admin) return true;
      const p = perms.find(x => x.Modulo === item.modulo);
      return p?.PuedeVer ?? false;
    });
  });

  icon(name: string): string { return I[name] ?? ''; }
  toggleCollapse(): void     { this.collapsed.set(!this.collapsed()); }
  
  cerrarSesion() {
    this.perm.clear();
    this.empresaSvc.clear();
    this.auth.logout();
  }
}
