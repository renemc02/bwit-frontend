export interface LoginRequest  { Email: string; Password: string; }
export interface LoginResponse {
  UsuarioId: number; Nombre: string; Email: string;
  Rol: string; EmpresaId: number; EmpresaNombre: string;
  AccessToken: string; RefreshToken: string; ExpiresAt: string;
  DebeCambiarPassword?: boolean;
}
export interface RefreshTokenRequest { RefreshToken: string; }
