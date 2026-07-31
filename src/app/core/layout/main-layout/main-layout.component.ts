import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'bwit-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  readonly layout = inject(LayoutService);

  constructor() {
    // Cerrar el sidebar móvil al navegar
    const router = inject(Router);
    router.events.subscribe(e => {
      if (e instanceof NavigationEnd) this.layout.closeMobile();
    });
  }
}
