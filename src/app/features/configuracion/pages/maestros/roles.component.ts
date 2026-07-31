import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/http/api.service';

interface ModuloPerm { modulo: string; label: string; ver: boolean; editar: boolean; }

@Component({
  selector: 'bwit-cfg-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class CfgRolesComponent implements OnInit {
  private api = inject(ApiService);

  roles      = signal<any[]>([]);
  loading    = signal(true);
  rolSel     = signal<any | null>(null);
  guardando  = signal(false);
  guardado   = signal(false);

  // Catálogo de módulos del sistema
  readonly MODULOS: { modulo: string; label: string }[] = [
    { modulo: 'dashboard',     label: 'Dashboard' },
    { modulo: 'pipeline',      label: 'Pipeline' },
    { modulo: 'cotizaciones',  label: 'Cotizaciones' },
    { modulo: 'clientes',      label: 'Clientes' },
    { modulo: 'proyectos',     label: 'Proyectos' },
    { modulo: 'equipo',        label: 'Equipo' },
    { modulo: 'certificaciones', label: 'Certificaciones' },
    { modulo: 'facturacion',   label: 'Facturación' },
    { modulo: 'pagos',         label: 'Pagos / Compras / Cobros' },
    { modulo: 'reportes',      label: 'Reportes BI' },
    { modulo: 'configuracion', label: 'Configuración' },
  ];

  permisos = signal<ModuloPerm[]>([]);

  ngOnInit() { this.cargarRoles(); }

  cargarRoles() {
    this.loading.set(true);
    this.api.get<any>('/api/roles?PageSize=50').subscribe({
      next: (r: any) => { this.roles.set(r?.data ?? r ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  seleccionar(rol: any) {
    this.rolSel.set(rol);
    this.guardado.set(false);
    // Base: todos en falso
    const base: ModuloPerm[] = this.MODULOS.map(m => ({ modulo: m.modulo, label: m.label, ver: false, editar: false }));
    this.permisos.set(base);
    // Cargar los guardados
    this.api.get<any>(`/api/roles/${rol.Id}/permisos`).subscribe({
      next: (r: any) => {
        const guardados = r?.data ?? r ?? [];
        const merged = base.map(b => {
          const g = guardados.find((x: any) => x.Modulo === b.modulo);
          return g ? { ...b, ver: !!g.PuedeVer, editar: !!g.PuedeEditar } : b;
        });
        this.permisos.set(merged);
      },
      error: () => {},
    });
  }

  toggleVer(p: ModuloPerm) {
    this.permisos.update(list => list.map(x => {
      if (x.modulo !== p.modulo) return x;
      const ver = !x.ver;
      return { ...x, ver, editar: ver ? x.editar : false }; // sin ver no puede editar
    }));
  }

  toggleEditar(p: ModuloPerm) {
    this.permisos.update(list => list.map(x => {
      if (x.modulo !== p.modulo) return x;
      const editar = !x.editar;
      return { ...x, editar, ver: editar ? true : x.ver }; // editar implica ver
    }));
  }

  marcarTodo(nivel: 'ver' | 'editar' | 'ninguno') {
    this.permisos.update(list => list.map(x => {
      if (nivel === 'ninguno') return { ...x, ver: false, editar: false };
      if (nivel === 'ver')     return { ...x, ver: true, editar: false };
      return { ...x, ver: true, editar: true };
    }));
  }

  guardar() {
    const rol = this.rolSel();
    if (!rol) return;
    this.guardando.set(true);
    const body = {
      Permisos: this.permisos()
        .filter(p => p.ver || p.editar)
        .map(p => ({ Modulo: p.modulo, PuedeVer: p.ver, PuedeEditar: p.editar })),
    };
    this.api.put<any>(`/api/roles/${rol.Id}/permisos`, body).subscribe({
      next: () => { this.guardando.set(false); this.guardado.set(true); setTimeout(() => this.guardado.set(false), 2500); },
      error: () => this.guardando.set(false),
    });
  }
}
