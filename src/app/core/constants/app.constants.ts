export const APP = { NAME: 'BWIT', TITLE: 'BWIT Service Ops', VERSION: '1.0.0', YEAR: '2026' } as const;
export const PAGINATION = { DEFAULT_PAGE: 1, DEFAULT_PAGE_SIZE: 20, PAGE_SIZE_OPTIONS: [10, 20, 50, 100] } as const;

export const ESTADOS_PROYECTO = [
  { label: 'Todos', value: '' }, { label: 'Activo', value: 'Activo' },
  { label: 'En pausa', value: 'En pausa' }, { label: 'Por cerrar', value: 'Por cerrar' }, { label: 'Cerrado', value: 'Cerrado' },
] as const;

export const BADGE_MAP: Record<string, string> = {
  Activo:'success', Aprobada:'success', Cobrada:'success', Pagada:'success',
  Enviada:'info', 'En revision':'info', Pendiente:'info',
  Observada:'warning', 'En pausa':'warning', Vencida:'warning', 'Por cerrar':'warning', Parcial:'warning',
  Rechazada:'danger', Anulada:'danger',
  Borrador:'neutral', Cerrado:'neutral', Cerrada:'neutral',
};
