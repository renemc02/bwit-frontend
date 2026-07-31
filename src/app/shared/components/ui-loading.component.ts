import { Component, input } from '@angular/core';
@Component({
  selector: 'ui-loading',
  standalone: true,
  templateUrl: './ui-loading.component.html',
  styleUrl: './ui-loading.component.scss'
})
export class UiLoadingComponent {
  label = input<string>('Cargando…');
}
