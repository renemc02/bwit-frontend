import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { HttpErrorService } from '../http/http-error.service';

/** URLs que muestran toast silencioso (el componente ya maneja el error visualmente) */
const SILENT_URLS = [
  '/api/dashboard',
  '/api/proyectos',
  '/api/pipeline',
  '/api/certificaciones',
  '/api/cotizaciones',
  '/api/facturas',
  '/api/clientes',
  '/api/equipo',
];

function isSilent(url: string): boolean {
  return SILENT_URLS.some(s => url.includes(s));
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const svc = inject(HttpErrorService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 lo maneja auth.interceptor; rutas silenciosas no muestran toast
      if (err.status !== 401 && !isSilent(req.url)) {
        svc.handle(err);
      }
      return throwError(() => err);
    })
  );
};
