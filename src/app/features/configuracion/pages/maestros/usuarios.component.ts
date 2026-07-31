import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/http/api.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';

@Component({
  selector: 'bwit-cfg-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class CfgUsuariosComponent implements OnInit {
  private api     = inject(ApiService);
  private confirm = inject(ConfirmService);

  items    = signal<any[]>([]);
  roles    = signal<any[]>([]);
  empresas = signal<any[]>([]);
  loading  = signal(true);

  modal    = signal(false);
  editId   = signal<number | null>(null);
  guardando = signal(false);
  error    = signal('');
  verPass  = signal(false);

  form: any = { Nombre: '', Email: '', Password: '', RolId: null, Activo: true, DebeCambiarPassword: true, empresasSel: [] as number[], empresaDefault: null };

  ngOnInit() { this.load(); this.cargarRoles(); this.cargarEmpresas(); }

  cargarEmpresas() {
    this.api.get<any>('/api/empresas?PageSize=100').subscribe({
      next: (r: any) => this.empresas.set(r?.data ?? r ?? []),
      error: () => {},
    });
  }

  toggleEmpresa(id: number) {
    const arr = [...this.form.empresasSel];
    const i = arr.indexOf(id);
    if (i >= 0) { arr.splice(i, 1); if (this.form.empresaDefault === id) this.form.empresaDefault = arr[0] ?? null; }
    else { arr.push(id); if (!this.form.empresaDefault) this.form.empresaDefault = id; }
    this.form.empresasSel = arr;
  }

  load() {
    this.loading.set(true);
    this.api.get<any>('/api/usuarios-login?PageSize=100').subscribe({
      next: (r: any) => { this.items.set(r?.data ?? r ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  cargarRoles() {
    this.api.get<any>('/api/roles?PageSize=50').subscribe({
      next: (r: any) => this.roles.set(r?.data ?? r ?? []),
      error: () => {},
    });
  }

  nuevo() {
    this.editId.set(null);
    this.form = { Nombre: '', Email: '', Password: '', RolId: this.roles()[0]?.Id ?? null, Activo: true, DebeCambiarPassword: true, empresasSel: [], empresaDefault: null };
    this.error.set('');
    this.verPass.set(false);
    this.modal.set(true);
  }

  editar(u: any) {
    this.editId.set(u.Id);
    this.form = { Nombre: u.Nombre, Email: u.Email, Password: '', RolId: u.RolId, Activo: u.Activo, DebeCambiarPassword: false, empresasSel: [], empresaDefault: u.EmpresaDefaultId ?? null };
    this.error.set('');
    this.verPass.set(false);
    this.modal.set(true);
    // Cargar empresas asignadas
    this.api.get<any>(`/api/usuarios-login/${u.Id}/empresas`).subscribe({
      next: (r: any) => {
        const list = r?.data ?? r ?? [];
        this.form.empresasSel = list.map((e: any) => e.EmpresaId);
        const def = list.find((e: any) => e.EsDefault);
        if (def) this.form.empresaDefault = def.EmpresaId;
      },
      error: () => {},
    });
  }

  cerrar() { this.modal.set(false); }

  guardar() {
    if (!this.form.Nombre?.trim()) { this.error.set('El nombre es obligatorio.'); return; }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(this.form.Email?.trim() || '')) { this.error.set('Email no válido.'); return; }
    if (!this.form.RolId) { this.error.set('Selecciona un rol.'); return; }

    const esNuevo = this.editId() === null;
    if (esNuevo && (!this.form.Password || this.form.Password.length < 6)) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.'); return;
    }
    if (!esNuevo && this.form.Password && this.form.Password.length < 6) {
      this.error.set('La nueva contraseña debe tener al menos 6 caracteres.'); return;
    }

    this.guardando.set(true);
    const body: any = {
      Nombre: this.form.Nombre.trim(),
      Email: this.form.Email.trim(),
      RolId: Number(this.form.RolId),
      Activo: !!this.form.Activo,
      Empresas: this.form.empresasSel ?? [],
      EmpresaDefaultId: this.form.empresaDefault ?? null,
    };
    if (this.form.Password) body.Password = this.form.Password;
    if (this.editId() === null) body.DebeCambiarPassword = !!this.form.DebeCambiarPassword;

    const req$ = esNuevo
      ? this.api.post<any>('/api/usuarios-login', body)
      : this.api.put<any>(`/api/usuarios-login/${this.editId()}`, body);

    req$.subscribe({
      next: () => { this.guardando.set(false); this.modal.set(false); this.load(); },
      error: (err: any) => {
        this.guardando.set(false);
        const msg: string = err?.error?.errors?.[0] ?? err?.error?.message ?? '';
        this.error.set(msg.includes('email') || msg.includes('Email')
          ? 'Ya existe un usuario con ese email.'
          : 'No se pudo guardar. Verifica los datos.');
      },
    });
  }

  eliminar(u: any) {
    this.confirm.eliminar(`al usuario "${u.Nombre}"`).then(ok => {
      if (!ok) return;
      this.api.delete<any>(`/api/usuarios-login/${u.Id}`).subscribe({
        next: () => this.load(), error: () => {},
      });
    });
  }

  rolNombre(id: number): string {
    return this.roles().find(r => r.Id === id)?.Nombre ?? '—';
  }
}
