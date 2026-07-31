import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'soles', standalone: true })
export class SolesPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return 'S/ 0';
    return 'S/ ' + new Intl.NumberFormat('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }
}
