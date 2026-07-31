import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/http/api.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'bwit-cambiar-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './cambiar-password.component.html',
  styleUrl: './cambiar-password.component.scss',
})
export class CambiarPasswordComponent {
  private api    = inject(ApiService);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  nueva     = '';
  confirmar = '';
  verPass   = signal(false);
  guardando = signal(false);
  error     = signal('');

  guardar() {
    this.error.set('');
    if (this.nueva.length < 6) { this.error.set('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (this.nueva !== this.confirmar) { this.error.set('Las contraseñas no coinciden.'); return; }

    this.guardando.set(true);
    this.api.post<any>('/api/mi/cambiar-password', { PasswordNueva: this.nueva }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.notify.success('Contraseña actualizada', 'Ya puedes usar el sistema');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No se pudo actualizar la contraseña. Intenta de nuevo.');
      },
    });
  }
}
