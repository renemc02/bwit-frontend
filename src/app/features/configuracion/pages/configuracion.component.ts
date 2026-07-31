import { Component, inject } from '@angular/core';
import { TopbarComponent } from '../../../core/layout/topbar/topbar.component';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/auth/auth.service';
import { APP } from '../../../core/constants/app.constants';

@Component({
  selector: 'bwit-configuracion',
  standalone: true,
  imports: [TopbarComponent],
  templateUrl: './configuracion.component.html'
})
export class ConfiguracionComponent {
  readonly theme  = inject(ThemeService);
  readonly auth   = inject(AuthService);
  readonly appName = APP.NAME;
  readonly version = APP.VERSION;
  readonly year    = APP.YEAR;
}
