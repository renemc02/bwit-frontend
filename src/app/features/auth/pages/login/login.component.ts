import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'bwit-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly perm   = inject(PermissionService);
  private readonly empSvc = inject(EmpresaService);

  email    = '';
  password = '';
  loading  = signal(false);
  error    = signal('');
  showPwd  = signal(false);

  togglePwd(): void { this.showPwd.set(!this.showPwd()); }

  submit(): void {
    if (!this.email || !this.password) { this.error.set('Completa todos los campos.'); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.login({ Email: this.email, Password: this.password }).subscribe({
      next:  () => {
        // Cargar empresas y permisos del rol
        this.empSvc.cargar();
        this.perm.cargar(this.auth.rol());
        this.loading.set(false);
        if (this.auth.debeCambiarPassword()) {
          this.router.navigate(['/cambiar-password']);
        } else {
          this.notify.success('Bienvenido', this.auth.nombre());
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: any) => {
        const msg: string = err?.error?.errors?.[0] ?? err?.error?.message ?? '';
        if (msg && (msg.toLowerCase().includes('empresa') || msg.toLowerCase().includes('acceso') || msg.toLowerCase().includes('bloquead') || msg.toLowerCase().includes('inactiv'))) {
          this.error.set(msg);
        } else {
          this.error.set('Credenciales incorrectas. Intenta nuevamente.');
        }
        this.loading.set(false);
      }
    });
  }
}
