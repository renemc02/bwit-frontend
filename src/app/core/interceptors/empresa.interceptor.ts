// ════════════════════════════════════════════════
// core/interceptors/empresa.interceptor.ts
// Añade header X-Empresa-Id con la empresa activa del switcher
// (el backend puede usarlo para filtrar; si no, lo ignora)
// ════════════════════════════════════════════════
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EmpresaService } from '../services/empresa.service';

export const empresaInterceptor: HttpInterceptorFn = (req, next) => {
  const empresaSvc = inject(EmpresaService);
  const id = empresaSvc.empresaIdActiva();

  // Solo para llamadas a la API propia y cuando hay empresa seleccionada
  if (id && req.url.includes('/api/')) {
    req = req.clone({ setHeaders: { 'X-Empresa-Id': String(id) } });
  }
  return next(req);
};
