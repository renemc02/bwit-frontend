import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'moneda', standalone: true })
export class MonedaPipe implements PipeTransform {
  transform(moneda: string | null | undefined): string {
    switch (moneda) {
      case 'USD': return 'US$';
      case 'EUR': return '€';
      default: return 'S/';
    }
  }
}
