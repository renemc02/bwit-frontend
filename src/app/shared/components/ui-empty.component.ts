import { Component, input } from '@angular/core';
@Component({
  selector: 'ui-empty',
  standalone: true,
  templateUrl: './ui-empty.component.html',
  styleUrl: './ui-empty.component.scss'
})
export class UiEmptyComponent {
  title   = input<string>('Sin resultados');
  message = input<string>('');
}
