import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';

@Injectable({ providedIn: 'root' })
export class HttpErrorService {
  private readonly notify = inject(NotificationService);

  handle(err: HttpErrorResponse, silent = false): string {
    const msg = this.parse(err);
    if (!silent) this.notify.error(msg);
    return msg;
  }

  parse(err: HttpErrorResponse): string {
    if (!navigator.onLine) return 'Sin conexión. Verifica tu internet.';
    if (err.error?.Errors?.length) return err.error.Errors.join(' ');
    if (err.error?.Message) return err.error.Message;
    const map: Record<number, string> = {
      400: 'Datos incorrectos. Revisa el formulario.',
      401: 'Sesión expirada. Inicia sesión nuevamente.',
      403: 'No tienes permisos para esta acción.',
      404: 'El recurso solicitado no existe.',
      409: 'Conflicto: el registro ya existe o está en uso.',
      500: 'Error interno del servidor. Intenta más tarde.',
      0:   'No se pudo conectar con el servidor.',
    };
    return map[err.status] ?? `Error inesperado (${err.status}).`;
  }
}
