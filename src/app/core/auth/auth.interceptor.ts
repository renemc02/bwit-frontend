import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const auth   = inject(AuthService);
  const isPublic = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
  const token = tokens.getAccessToken();
  const authReq = token && !isPublic ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isPublic) {
        const r$ = auth.refresh();
        if (r$) return r$.pipe(switchMap(() => {
          const t = tokens.getAccessToken();
          return next(t ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : req);
        }));
      }
      return throwError(() => err);
    })
  );
};
