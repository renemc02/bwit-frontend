import { Injectable, signal, inject } from '@angular/core';
import { StorageService } from './storage.service';
const KEY = 'bwit_theme';
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);
  readonly isDark = signal(false);
  init() {
    const saved = this.storage.getString(KEY);
    const prefer = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(saved === 'dark' || (!saved && prefer));
  }
  toggle() { this.apply(!this.isDark()); }
  setDark(dark: boolean) { this.apply(dark); }
  private apply(dark: boolean) {
    this.isDark.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    this.storage.setString(KEY, dark ? 'dark' : 'light');
  }
}
