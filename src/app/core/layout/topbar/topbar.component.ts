import { Component, input, inject, ViewChild, ElementRef, AfterViewInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmpresaSwitcherComponent } from './empresa-switcher.component';
import { ThemeService } from '../../services/theme.service';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { ConfigPanelService } from '../../../features/configuracion/services/config-panel.service';
import { LayoutService } from '../../services/layout.service';

const ICON_SUN  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const ICON_MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
const ICON_SETTINGS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`;
const ICON_BELL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`;

@Component({
  selector: 'bwit-topbar',
  standalone: true,
  imports: [RouterLink, EmpresaSwitcherComponent, SafeHtmlPipe],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements AfterViewInit {
  title      = input.required<string>();
  crumb      = input<string>('');
  crumbRoute = input<string>('/');
  notifCount = input<number>(5);   // número de notificaciones (badge)

  readonly theme  = inject(ThemeService);
  readonly layout = inject(LayoutService);
  private readonly configPanel = inject(ConfigPanelService);

  readonly sunIcon      = ICON_SUN;
  readonly moonIcon     = ICON_MOON;
  readonly settingsIcon = ICON_SETTINGS;
  readonly bellIcon     = ICON_BELL;

  @ViewChild('toolbar') toolbarRef?: ElementRef<HTMLElement>;
  empty = signal(false);

  ngAfterViewInit() {
    const el = this.toolbarRef?.nativeElement;
    if (!el) return;
    const check = () => { this.empty.set(el.children.length === 0 && (el.textContent?.trim() ?? '') === ''); };
    // Diferir el primer check para no chocar con el ciclo de detección actual (NG0100)
    queueMicrotask(check);
    // Re-evaluar si el contenido proyectado cambia (datos async, @if, etc.)
    const obs = new MutationObserver(() => queueMicrotask(check));
    obs.observe(el, { childList: true, subtree: true, characterData: true });
  }

  abrirConfig() { this.configPanel.abrir('empresas'); }
}
