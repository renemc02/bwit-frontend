import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from './permission.service';
import { AuthService } from './auth.service';

export function permGuard(modulo: string): CanActivateFn {
  return () => {
    const perm = inject(PermissionService);
    const auth = inject(AuthService);
    const rol = (auth.rol() || '').toLowerCase();
    // Admin siempre puede
    if (rol === 'administrador' || rol === 'admin') return true;
    // Dashboard siempre accesible (es la ruta de fallback)
    if (modulo === 'dashboard') return true;
    // Si permisos no han cargado aún, permitir (se filtra en el sidebar)
    if (!perm.loaded()) return true;
    if (perm.puedeVer(modulo)) return true;
    // Sin permiso → redirigir al dashboard
    return inject(Router).createUrlTree(['/dashboard']);
  };
}
