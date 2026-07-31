// ════════════════════════════════════════════════
// core/services/adjunto.service.ts
// Gestión de archivos adjuntos (guardados en BD como VARBINARY)
// Sirve a Cotizaciones, Certificaciones y Proyectos.
// ════════════════════════════════════════════════
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type EntidadTipo = 'Cotizacion' | 'Certificacion' | 'Proyecto';

export interface Adjunto {
  Id: number;
  EntidadTipo: string;
  EntidadId: number;
  Categoria?: string;
  NombreArchivo: string;
  ContentType: string;
  TamanoBytes: number;
  FechaCreacion: string;
  UsuarioCreacion?: string;
}

const URL = '/api/adjuntos';

@Injectable({ providedIn: 'root' })
export class AdjuntoService {
  private http = inject(HttpClient);

  /** Listar adjuntos de una entidad */
  listar(entidadTipo: EntidadTipo, entidadId: number): Observable<Adjunto[]> {
    return this.http
      .get<any>(URL, { params: { entidadTipo, entidadId } })
      .pipe(map(r => (r?.Data ?? []) as Adjunto[]));
  }

  /** Subir un archivo (multipart/form-data) */
  subir(entidadTipo: EntidadTipo, entidadId: number, file: File, categoria?: string): Observable<any> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('entidadTipo', entidadTipo);
    form.append('entidadId', String(entidadId));
    if (categoria) form.append('categoria', categoria);
    return this.http.post<any>(URL, form);
  }

  /** Descargar: devuelve un Blob y dispara la descarga en el navegador */
  descargar(adj: Adjunto): void {
    this.http
      .get(`${URL}/${adj.Id}/descargar`, { responseType: 'blob' })
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = adj.NombreArchivo;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  /** Eliminar (lógico) */
  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${URL}/${id}`);
  }
}
