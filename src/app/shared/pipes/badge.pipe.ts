import { Pipe, PipeTransform } from '@angular/core';
import { BADGE_MAP } from '../../core/constants/app.constants';
@Pipe({ name: 'badge', standalone: true })
export class BadgePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return BADGE_MAP[value ?? ''] ?? 'neutral';
  }
}
