import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  /** Sidebar abierto como overlay en móvil (<768px) */
  readonly mobileOpen = signal(false);

  toggleMobile() { this.mobileOpen.set(!this.mobileOpen()); }
  closeMobile()  { this.mobileOpen.set(false); }
}
