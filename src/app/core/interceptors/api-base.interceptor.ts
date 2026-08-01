import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Antepone la URL base del backend a las peticiones que empiezan con /api.
 * En desarrollo, environment.apiBaseUrl está vacío y el proxy (proxy.conf.json)
 * redirige /api a localhost. En producción (Azure), apiBaseUrl apunta al App Service.
 */
export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const base = environment.apiBaseUrl;

  // Solo reescribir rutas relativas que empiezan con /api y si hay base configurada
  if (base && req.url.startsWith('/api')) {
    const url = base.replace(/\/$/, '') + req.url;
    return next(req.clone({ url }));
  }

  return next(req);
};
