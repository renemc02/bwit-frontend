import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> { IsSuccess: boolean; Data: T; Message: string | null; Errors: string[]; Total: number | null; }
export interface PagedResult<T> { data: T; total: number; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected readonly http = inject(HttpClient);

  private buildParams(params?: Record<string, any>): HttpParams {
    let p = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v)); });
    return p;
  }

  get<T>(url: string, params?: Record<string, any>): Observable<T> {
    return this.http.get<ApiResponse<T>>(url, { params: this.buildParams(params) }).pipe(map(r => r.Data));
  }
  getPaged<T>(url: string, params?: Record<string, any>): Observable<PagedResult<T>> {
    return this.http.get<ApiResponse<T>>(url, { params: this.buildParams(params) }).pipe(map(r => ({ data: r.Data, total: r.Total ?? 0 })));
  }
  post<T>(url: string, body: any): Observable<T> { return this.http.post<ApiResponse<T>>(url, body).pipe(map(r => r.Data)); }
  put<T>(url: string, body: any): Observable<T>  { return this.http.put<ApiResponse<T>>(url, body).pipe(map(r => r.Data)); }
  patch<T>(url: string, body: any): Observable<T>{ return this.http.patch<ApiResponse<T>>(url, body).pipe(map(r => r.Data)); }
  delete<T>(url: string): Observable<T>           { return this.http.delete<ApiResponse<T>>(url).pipe(map(r => r.Data)); }
}
