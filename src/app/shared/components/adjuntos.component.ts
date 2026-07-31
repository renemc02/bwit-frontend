import { Component, input, signal, inject, effect } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { AdjuntoService, Adjunto, EntidadTipo } from '../../core/services/adjunto.service';
import { ConfirmService } from '../services/confirm.service';

@Component({
  selector: 'bwit-adjuntos',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  templateUrl: './adjuntos.component.html',
  styleUrl: './adjuntos.component.scss',
})
export class AdjuntosComponent {
  // Inputs requeridos: a qué entidad pertenecen los adjuntos
  entidadTipo = input.required<EntidadTipo>();
  entidadId   = input.required<number>();
  categoria   = input<string>('');         // opcional: clasificación
  titulo      = input<string>('Adjuntos'); // título de la card

  private confirm = inject(ConfirmService);
  private svc     = inject(AdjuntoService);

  adjuntos  = signal<Adjunto[]>([]);
  cargando  = signal(false);
  subiendo  = signal(false);
  dragOver  = signal(false);
  error     = signal('');

  constructor() {
    // Recargar si cambia la entidad
    effect(() => { this.entidadId(); this.entidadTipo(); this.cargar(); });
  }

  cargar() {
    const id = this.entidadId();
    if (!id) return;
    this.cargando.set(true);
    const cat = this.categoria();
    this.svc.listar(this.entidadTipo(), id).subscribe({
      next: a => {
        // Si se especificó categoría, mostrar solo los de esa categoría
        const lista = cat ? (a ?? []).filter(x => x.Categoria === cat) : (a ?? []);
        this.adjuntos.set(lista);
        this.cargando.set(false);
      },
      error: () => { this.adjuntos.set([]); this.cargando.set(false); }
    });
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(false);
    const files = e.dataTransfer?.files;
    if (files?.length) this.subirArchivos(files);
  }

  onFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) this.subirArchivos(input.files);
    input.value = '';
  }

  private subirArchivos(files: FileList) {
    this.error.set('');
    const MAX = 20 * 1024 * 1024;
    const lista = Array.from(files);
    if (lista.some(f => f.size > MAX)) { this.error.set('Algún archivo supera los 20 MB.'); return; }

    this.subiendo.set(true);
    let pendientes = lista.length;
    lista.forEach(file => {
      this.svc.subir(this.entidadTipo(), this.entidadId(), file, this.categoria() || undefined).subscribe({
        next: () => { if (--pendientes === 0) { this.subiendo.set(false); this.cargar(); } },
        error: () => { if (--pendientes === 0) { this.subiendo.set(false); this.cargar(); } this.error.set('Error al subir algún archivo.'); }
      });
    });
  }

  descargar(a: Adjunto) { this.svc.descargar(a); }

  eliminar(a: Adjunto) {
    this.confirm.eliminar(a.NombreArchivo).then(ok => {
      if (!ok) return;
      this.svc.eliminar(a.Id).subscribe({ next: () => this.cargar(), error: () => {} });
    });
  }

  iconoTipo(ct: string): string {
    if (ct.includes('pdf')) return 'PDF';
    if (ct.includes('image')) return 'IMG';
    if (ct.includes('sheet') || ct.includes('excel')) return 'XLS';
    if (ct.includes('word') || ct.includes('document')) return 'DOC';
    if (ct.includes('zip') || ct.includes('compressed')) return 'ZIP';
    return 'FILE';
  }

  kb(bytes: number): number { return bytes / 1024; }
}
