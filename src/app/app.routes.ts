import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'cambiar-password',
    loadComponent: () => import('./features/auth/pages/cambiar-password/cambiar-password.component').then(m => m.CambiarPasswordComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',      loadComponent: () => import('./features/dashboard/pages/dashboard.component').then(m => m.DashboardComponent),               title: 'Dashboard — BWIT' },
      { path: 'pipeline',       loadComponent: () => import('./features/pipeline/pages/pipeline.component').then(m => m.PipelineComponent),                 title: 'Pipeline — BWIT' },
      { path: 'cotizaciones',   loadComponent: () => import('./features/cotizaciones/pages/cotizaciones.component').then(m => m.CotizacionesComponent),     title: 'Cotizaciones — BWIT' },
      { path: 'cotizaciones/:id', loadComponent: () => import('./features/cotizaciones/pages/cotizacion-detail/cotizacion-detail.component').then(m => m.CotizacionDetailComponent), title: 'Cotización — BWIT' },
      { path: 'proyectos',      loadComponent: () => import('./features/proyectos/pages/proyectos-list/proyectos-list.component').then(m => m.ProyectosListComponent), title: 'Proyectos — BWIT' },
      { path: 'proyectos/:id',  loadComponent: () => import('./features/proyectos/pages/proyecto-detail/proyecto-detail.component').then(m => m.ProyectoDetailComponent), title: 'Proyecto — BWIT' },
      { path: 'certificaciones',loadComponent: () => import('./features/certificaciones/pages/certificaciones.component').then(m => m.CertificacionesComponent), title: 'Certificaciones — BWIT' },
      { path: 'facturacion',    loadComponent: () => import('./features/facturacion/pages/facturas.component').then(m => m.FacturasComponent),               title: 'Facturación — BWIT' },
      { path: 'pagos/:tab',     loadComponent: () => import('./features/finanzas/pagos/pagos.component').then(m => m.PagosComponent),                          title: 'Pagos — BWIT' },
      { path: 'pagos',          redirectTo: 'pagos/terceros' },
      { path: 'reportes',       loadComponent: () => import('./features/finanzas/reportes/reportes.component').then(m => m.ReportesComponent),                  title: 'Reportes — BWIT' },
      { path: 'facturacion-cliente', loadComponent: () => import('./features/finanzas/facturacion-cliente/facturacion-cliente.component').then(m => m.FacturacionClienteComponent), title: 'Facturación x Cliente — BWIT' },
      { path: 'clientes',       loadComponent: () => import('./features/clientes/pages/clientes.component').then(m => m.ClientesComponent),                 title: 'Clientes — BWIT' },
      { path: 'equipo',         loadComponent: () => import('./features/equipo/pages/equipo.component').then(m => m.EquipoComponent),                       title: 'Equipo — BWIT' },
      { path: 'configuracion',  loadComponent: () => import('./features/configuracion/pages/configuracion.component').then(m => m.ConfiguracionComponent),   title: 'Configuración — BWIT' },
    ]
  },
  { path: '**', redirectTo: '' }
];
