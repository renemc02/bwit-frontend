const B = '/api';
export const API = {
  auth:            { login: `${B}/auth/login`, refresh: `${B}/auth/refresh` },
  dashboard:       { kpis: `${B}/dashboard/kpis`, pipeline: `${B}/dashboard/pipeline` },
  clientes:        { base: `${B}/clientes`, byId: (id: number) => `${B}/clientes/${id}` },
  proyectos:       { base: `${B}/proyectos`, byId: (id: number) => `${B}/proyectos/${id}`, estado: (id: number) => `${B}/proyectos/${id}/estado`, progreso: (id: number) => `${B}/proyectos/${id}/progreso` },
  cotizaciones:    { base: `${B}/cotizaciones`, byId: (id: number) => `${B}/cotizaciones/${id}`, estado: (id: number) => `${B}/cotizaciones/${id}/estado`, convertir: (id: number) => `${B}/cotizaciones/${id}/convertir`, update: (id: number) => `${B}/cotizaciones/${id}`, responsablesDisponibles: `${B}/cotizaciones/responsables-disponibles` },
  certificaciones: { base: `${B}/certificaciones`, byId: (id: number) => `${B}/certificaciones/${id}`, estado: (id: number) => `${B}/certificaciones/${id}/estado`, aprobar: (id: number) => `${B}/certificaciones/${id}/aprobar` },
  facturas:        { base: `${B}/facturas`, byId: (id: number) => `${B}/facturas/${id}`, anular: (id: number) => `${B}/facturas/${id}/anular`, pagos: `${B}/facturas/pagos`, aprobar: (id: number) => `${B}/facturas/${id}/aprobar`, historial: (id: number) => `${B}/facturas/${id}/historial` },
  equipo:          { base: `${B}/equipo`, byId: (id: number) => `${B}/equipo/${id}` },
  pipeline:        { base: `${B}/pipeline`, byId: (id: number) => `${B}/pipeline/${id}`, mover: (id: number) => `${B}/pipeline/${id}/mover` },
} as const;
