import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { LoginRequest, LoginResponse } from './models/auth.models';
import { TokenService } from './token.service';

const LOGIN_URL   = '/api/auth/login';
const REFRESH_URL = '/api/auth/refresh';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http       = inject(HttpClient);
  private readonly router     = inject(Router);
  private readonly tokens     = inject(TokenService);

  private _user = signal<LoginResponse | null>(this.tokens.getUser());
  readonly debeCambiarPassword = () => !!this._user()?.DebeCambiarPassword;
  readonly user            = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());
  readonly nombre          = computed(() => this._user()?.Nombre       ?? '');
  readonly email           = computed(() => this._user()?.Email        ?? '');
  readonly rol             = computed(() => this._user()?.Rol          ?? '');
  readonly empresaId       = computed(() => this._user()?.EmpresaId    ?? 0);
  readonly empresaNombre   = computed(() => this._user()?.EmpresaNombre ?? '');
  readonly initials        = computed(() =>
    this.nombre().split(' ').slice(0,2).map(p => p[0] ?? '').join('').toUpperCase()
  );

  constructor() {
    // No cargar nada aquí — se hace desde LoginComponent y SidebarComponent
    // para evitar dependencia circular con HttpClient/Interceptor
  }

  login(req: LoginRequest) {
    return this.http
      .post<{ IsSuccess: boolean; Data: LoginResponse }>(LOGIN_URL, req)
      .pipe(
        tap(res => {
          if (res.IsSuccess && res.Data) {
            this.tokens.save(res.Data);
            this._user.set(res.Data);
          }
        })
      );
  }

  logout(): void {
    this.tokens.clear();
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  refresh() {
    const rt = this.tokens.getRefreshToken();
    if (!rt) { this.logout(); return EMPTY; }
    return this.http
      .post<{ IsSuccess: boolean; Data: LoginResponse }>(REFRESH_URL, { RefreshToken: rt })
      .pipe(
        tap(res => {
          if (res.IsSuccess && res.Data) {
            this.tokens.save(res.Data); this._user.set(res.Data);
          } else { this.logout(); }
        }),
        catchError(() => { this.logout(); return EMPTY; })
      );
  }
}
