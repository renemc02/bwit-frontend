import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

const SILENT = ['/api/dashboard'];

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  if (SILENT.some(s => req.url.includes(s))) return next(req);
  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));
};
