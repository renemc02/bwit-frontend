import { Component, inject } from '@angular/core';
import { ConfirmService } from '../services/confirm.service';

@Component({
  selector: 'bwit-confirm',
  standalone: true,
  template: `
@if (svc.visible()) {
  <div class="confirm-overlay" (click)="svc.cancelar()">
    <div class="confirm-box" [attr.data-tipo]="svc.config()?.tipo" (click)="$event.stopPropagation()">

      <!-- Ícono según tipo -->
      <div class="confirm-icon">
        @switch (svc.config()?.tipo) {
          @case ('eliminar') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          }
          @case ('salir') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          }
          @case ('aprobar') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          }
          @case ('rechazar') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          }
          @case ('anular') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          }
          @default {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          }
        }
      </div>

      <!-- Contenido -->
      <div class="confirm-content">
        <h3 class="confirm-title">{{ svc.config()?.titulo }}</h3>
        <p class="confirm-msg" [innerHTML]="svc.config()?.mensaje"></p>
        @if (svc.config()?.detalle) {
          <p class="confirm-detail">{{ svc.config()?.detalle }}</p>
        }
      </div>

      <!-- Botones -->
      <div class="confirm-actions">
        @if (svc.config()?.btnCancelar) {
          <button class="confirm-btn cancel" (click)="svc.cancelar()">
            {{ svc.config()?.btnCancelar }}
          </button>
        }
        <button class="confirm-btn ok" [attr.data-tipo]="svc.config()?.tipo" (click)="svc.confirmar()">
          {{ svc.config()?.btnConfirmar }}
        </button>
      </div>

    </div>
  </div>
}
  `,
  styles: [`
    .confirm-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,.45);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      animation: fadeIn .15s ease;
    }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    @keyframes slideUp { from { opacity:0; transform:translateY(16px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }

    .confirm-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 28px 28px 24px;
      max-width: 400px; width: 100%;
      box-shadow: 0 24px 64px rgba(0,0,0,.22);
      display: flex; flex-direction: column; gap: 16px;
      animation: slideUp .2s cubic-bezier(.34,1.56,.64,1);
    }

    /* Ícono */
    .confirm-icon {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .confirm-icon svg { width: 26px; height: 26px; }

    .confirm-box[data-tipo="eliminar"] .confirm-icon { background:#fee2e2; color:#dc2626; }
    .confirm-box[data-tipo="salir"]   .confirm-icon { background:#fef3c7; color:#d97706; }
    .confirm-box[data-tipo="aprobar"] .confirm-icon { background:#dcfce7; color:#16a34a; }
    .confirm-box[data-tipo="rechazar"].confirm-icon { background:#fee2e2; color:#dc2626; }
    .confirm-box[data-tipo="anular"]  .confirm-icon { background:#f3f4f6; color:#6b7280; }
    .confirm-box[data-tipo="guardar"] .confirm-icon { background:#ede9fe; color:#7c3aed; }
    .confirm-box[data-tipo="warning"] .confirm-icon { background:#fef3c7; color:#d97706; }
    .confirm-box[data-tipo="info"]    .confirm-icon { background:#dbeafe; color:#2563eb; }

    /* Texto */
    .confirm-content { display:flex; flex-direction:column; gap:6px; }
    .confirm-title { font-size:16px; font-weight:700; margin:0; }
    .confirm-msg { font-size:14px; color:var(--text-muted); margin:0; line-height:1.5; }
    .confirm-msg strong { color:var(--text); font-weight:600; }
    .confirm-detail {
      font-size:12.5px; color:var(--text-faint);
      background:var(--surface-2); border-radius:8px;
      padding:8px 12px; margin:4px 0 0; border-left:3px solid var(--border);
    }

    /* Botones */
    .confirm-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:4px; }
    .confirm-btn {
      padding:9px 20px; border-radius:10px; font-size:14px; font-weight:600;
      cursor:pointer; border:none; transition:all .15s;
    }
    .confirm-btn.cancel {
      background:var(--surface-2); color:var(--text-muted);
      border:1px solid var(--border);
    }
    .confirm-btn.cancel:hover { background:var(--border); color:var(--text); }

    /* Botón OK: SIEMPRE con fondo visible — azul por defecto */
    .confirm-btn.ok { color:#fff; background:#2563eb; }
    .confirm-btn.ok:hover { filter:brightness(1.12); }
    .confirm-btn.ok[data-tipo="eliminar"],
    .confirm-btn.ok[data-tipo="rechazar"],
    .confirm-btn.ok[data-tipo="anular"]  { background:#dc2626; }
    .confirm-btn.ok[data-tipo="aprobar"] { background:#16a34a; }
    .confirm-btn.ok[data-tipo="salir"]   { background:#d97706; }
  `]
})
export class ConfirmComponent {
  svc = inject(ConfirmService);
}
