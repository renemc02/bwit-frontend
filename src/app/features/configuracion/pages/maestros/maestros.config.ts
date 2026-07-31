// ════════════════════════════════════════════════
// Configuraciones de cada maestro tipo tabla
// ════════════════════════════════════════════════
import { MaestroConfig } from './maestro-tabla.component';

export const MAESTROS_CONFIG: Record<string, MaestroConfig> = {

  // ── CLIENTES ──────────────────────────────────────────
  'clientes': {
    recurso: 'clientes',
    titulo: 'Clientes',
    subtitulo: 'Empresas a las que prestamos servicios',
    nuevoLabel: '+ Nuevo cliente',
    cols: [
      { key: 'RazonSocial', label: 'Razón social' },
      { key: 'Ruc',         label: 'RUC', tipo: 'mono' },
      { key: 'Sector',      label: 'Sector', tipo: 'badge' },
      { key: 'Telefono',    label: 'Teléfono' },
      { key: 'EmailGeneral',label: 'Email' },
      { key: 'ClientePrincipal', label: 'Cliente principal' },
      { key: 'TotalProyectos',   label: 'Proyectos', align: 'center' },
    ],
    fields: [
      { key: 'Codigo',       label: 'Código', required: true },
      { key: 'Ruc',          label: 'RUC', required: true },
      { key: 'RazonSocial',  label: 'Razón social', required: true, col: 2 },
      { key: 'NombreCorto',  label: 'Nombre corto' },
      { key: 'Sector',       label: 'Sector' },
      { key: 'Direccion',    label: 'Dirección', col: 2 },
      { key: 'Telefono',     label: 'Teléfono' },
      { key: 'EmailGeneral', label: 'Email' },
      { key: 'EsSubcliente',      label: 'Es subcliente', tipo: 'check' },
    ],
    blank: { Codigo:'', RazonSocial:'', NombreCorto:'', Ruc:'', Sector:'', Direccion:'', Telefono:'', EmailGeneral:'', SitioWeb:'', TipoPago:'', Notas:'', EsSubcliente:false, ClientePrincipalId:null },
  },

  // ── PERSONAL ──────────────────────────────────────────
  'personal': {
    recurso: 'personal',
    titulo: 'Personal',
    subtitulo: 'Empleados internos de la empresa',
    nuevoLabel: '+ Nuevo empleado',
    cols: [
      { key: 'Codigo',       label: 'Código', tipo: 'mono' },
      { key: 'Nombres',      label: 'Nombres' },
      { key: 'Apellidos',    label: 'Apellidos' },
      { key: 'Cargo',        label: 'Cargo' },
      { key: 'TipoPersonal', label: 'Tipo', tipo: 'badge' },
      { key: 'Area',         label: 'Área', tipo: 'badge' },
      { key: 'Email',        label: 'Email' },
      { key: 'Activo',       label: 'Estado', tipo: 'bool', align: 'center' },
    ],
    fields: [
      { key: 'Codigo',       label: 'Código', required: true },
      { key: 'DocIdentidad', label: 'DNI / Doc.' },
      { key: 'Nombres',      label: 'Nombres', required: true },
      { key: 'Apellidos',    label: 'Apellidos', required: true },
      { key: 'Cargo',        label: 'Cargo' },
      { key: 'Area',         label: 'Área' },
      { key: 'Email',        label: 'Email' },
      { key: 'Telefono',     label: 'Teléfono' },
      { key: 'TipoContrato', label: 'Tipo contrato', tipo: 'select', opciones: ['Planilla','Recibo por honorarios','Tercero','Practicante'] },
      { key: 'TipoPersonal', label: 'Tipo de personal', tipo: 'select', opciones: ['Completo','Medio tiempo','Por horas'] },
      { key: 'SueldoActual', label: 'Sueldo actual (S/)', tipo: 'number' },
      { key: 'TarifaHora',   label: 'Tarifa por hora (S/)', tipo: 'number' },
      { key: 'FechaIngreso', label: 'Fecha de ingreso', tipo: 'text' },
      { key: 'Activo',       label: 'Activo', tipo: 'check' },
    ],
    blank: { Codigo:'', Nombres:'', Apellidos:'', DocIdentidad:'', Cargo:'', Area:'', Email:'', Telefono:'', TipoContrato:'Planilla', TipoPersonal:'Completo', SueldoActual:null, TarifaHora:null, FechaIngreso:'', Activo:true },
  },

  // ── PROVEEDORES ───────────────────────────────────────
  'proveedores': {
    recurso: 'proveedores',
    titulo: 'Proveedores',
    subtitulo: 'Proveedores de servicios y productos',
    nuevoLabel: '+ Nuevo proveedor',
    cols: [
      { key: 'Codigo',      label: 'Código', tipo: 'mono' },
      { key: 'RazonSocial', label: 'Razón social' },
      { key: 'Ruc',         label: 'RUC', tipo: 'mono' },
      { key: 'Categoria',   label: 'Categoría', tipo: 'badge' },
      { key: 'Contacto',    label: 'Contacto' },
      { key: 'Activo',      label: 'Estado', tipo: 'bool', align: 'center' },
    ],
    fields: [
      { key: 'Codigo',      label: 'Código', required: true },
      { key: 'Ruc',         label: 'RUC', required: true },
      { key: 'RazonSocial', label: 'Razón social', required: true, col: 2 },
      { key: 'NombreCorto', label: 'Nombre corto' },
      { key: 'Categoria',   label: 'Categoría' },
      { key: 'Contacto',    label: 'Contacto' },
      { key: 'Telefono',    label: 'Teléfono' },
      { key: 'Email',       label: 'Email' },
      { key: 'Direccion',   label: 'Dirección', col: 2 },
      { key: 'Activo',      label: 'Activo', tipo: 'check' },
    ],
    blank: { Codigo:'', RazonSocial:'', NombreCorto:'', Ruc:'', Categoria:'', Contacto:'', Telefono:'', Email:'', Direccion:'', Activo:true },
  },

  // ── SERVICIOS ─────────────────────────────────────────
  'servicios': {
    recurso: 'servicios',
    titulo: 'Catálogo de servicios',
    subtitulo: 'Servicios que ofrece la empresa',
    nuevoLabel: '+ Nuevo servicio',
    cols: [
      { key: 'Codigo',       label: 'Código', tipo: 'mono' },
      { key: 'Nombre',       label: 'Nombre' },
      { key: 'TipoServicio', label: 'Tipo', tipo: 'badge' },
      { key: 'Categoria',    label: 'Categoría', tipo: 'badge' },
      { key: 'UnidadMedida', label: 'Unidad' },
      { key: 'PrecioBase',   label: 'Precio base', tipo: 'money', align: 'right' },
      { key: 'Activo',       label: 'Estado', tipo: 'bool', align: 'center' },
    ],
    fields: [
      { key: 'Codigo',       label: 'Código', required: true },
      { key: 'Nombre',       label: 'Nombre', required: true },
      { key: 'TipoServicio', label: 'Tipo de servicio', tipo: 'select', opciones: ['Soporte','Proyecto'], required: true },
      { key: 'Categoria',    label: 'Categoría' },
      { key: 'UnidadMedida', label: 'Unidad de medida', tipo: 'select', opciones: ['Mes','Hora','Día','Bolsa','Proyecto','Unidad'] },
      { key: 'PrecioBase',   label: 'Precio base', tipo: 'number' },
      { key: 'Moneda',       label: 'Moneda', tipo: 'select', opciones: ['PEN','USD'] },
      { key: 'Descripcion',  label: 'Descripción', tipo: 'textarea', col: 2 },
      { key: 'Activo',       label: 'Activo', tipo: 'check' },
    ],
    blank: { Codigo:'', Nombre:'', TipoServicio:'Soporte', Categoria:'', Descripcion:'', UnidadMedida:'Mes', PrecioBase:0, Moneda:'PEN', Activo:true },
  },

  // ── MÉTODOS DE PAGO ───────────────────────────────────
  'metodos-pago': {
    recurso: 'metodos-pago',
    titulo: 'Métodos de pago',
    subtitulo: 'Formas de pago aceptadas y plazos de crédito',
    nuevoLabel: '+ Nuevo método',
    cols: [
      { key: 'Nombre',      label: 'Nombre' },
      { key: 'Tipo',        label: 'Tipo', tipo: 'badge' },
      { key: 'DiasCredito', label: 'Días crédito', align: 'center' },
      { key: 'Activo',      label: 'Estado', tipo: 'bool', align: 'center' },
    ],
    fields: [
      { key: 'Nombre',      label: 'Nombre', required: true, col: 2 },
      { key: 'Tipo',        label: 'Tipo', tipo: 'select', opciones: ['Transferencia','Crédito','Efectivo','Tarjeta','Cheque'] },
      { key: 'DiasCredito', label: 'Días de crédito', tipo: 'number' },
      { key: 'Activo',      label: 'Activo', tipo: 'check' },
    ],
    blank: { Nombre:'', Tipo:'Transferencia', DiasCredito:0, Activo:true },
  },

  // ── CUENTAS BANCARIAS ─────────────────────────────────
  'cuentas-bancarias': {
    recurso: 'cuentas-bancarias',
    titulo: 'Cuentas bancarias',
    subtitulo: 'Cuentas de la empresa para cobros y pagos',
    nuevoLabel: '+ Nueva cuenta',
    cols: [
      { key: 'Banco',        label: 'Banco' },
      { key: 'Alias',        label: 'Alias' },
      { key: 'NumeroCuenta', label: 'N° Cuenta', tipo: 'mono' },
      { key: 'Moneda',       label: 'Moneda', align: 'center' },
      { key: 'Tipo',         label: 'Tipo', tipo: 'badge' },
      { key: 'Activa',       label: 'Estado', tipo: 'bool', align: 'center' },
    ],
    fields: [
      { key: 'BancoId',      label: 'Banco', tipo: 'select-remote', required: true, col: 2,
        recursoOpciones: 'bancos', opcionValue: 'Id', opcionLabel: 'Nombre' },
      { key: 'Alias',        label: 'Alias' },
      { key: 'NumeroCuenta', label: 'N° de cuenta', required: true },
      { key: 'Cci',          label: 'CCI' },
      { key: 'Moneda',       label: 'Moneda', tipo: 'select', opciones: ['PEN','USD'] },
      { key: 'Tipo',         label: 'Tipo', tipo: 'select', opciones: ['Corriente','Ahorros','Detracciones'] },
      { key: 'Activa',       label: 'Activa', tipo: 'check' },
    ],
    blank: { BancoId:null, Alias:'', NumeroCuenta:'', Cci:'', Moneda:'PEN', Tipo:'Corriente', Activa:true },
  },

  // ── USUARIOS ──────────────────────────────────────────
  'usuarios': {
    recurso: 'usuarios',
    titulo: 'Usuarios',
    subtitulo: 'Usuarios con acceso al sistema',
    nuevoLabel: '+ Nuevo usuario',
    cols: [
      { key: 'Nombre',      label: 'Nombre' },
      { key: 'Email',       label: 'Email' },
      { key: 'RolNombre',   label: 'Rol', tipo: 'badge' },
      { key: 'UltimoAcceso',label: 'Último acceso', tipo: 'date' },
      { key: 'Activo',      label: 'Estado', tipo: 'bool', align: 'center' },
    ],
    fields: [
      { key: 'Nombre',    label: 'Nombre', required: true, col: 2 },
      { key: 'Email',     label: 'Email', required: true, col: 2 },
      { key: 'RolNombre', label: 'Rol', tipo: 'select', opciones: ['Administrador','Gerente','Project Manager','Ventas','Viewer'] },
      { key: 'Activo',    label: 'Activo', tipo: 'check' },
    ],
    blank: { Nombre:'', Email:'', RolId:null, RolNombre:'Viewer', Activo:true },
  },

  // ── ROLES ─────────────────────────────────────────────
  'roles': {
    recurso: 'roles',
    titulo: 'Roles y permisos',
    subtitulo: 'Perfiles de acceso del sistema',
    nuevoLabel: '+ Nuevo rol',
    cols: [
      { key: 'Nombre',      label: 'Nombre' },
      { key: 'Descripcion', label: 'Descripción' },
      { key: 'EsSistema',   label: 'Sistema', tipo: 'bool', align: 'center' },
      { key: 'Activo',      label: 'Estado', tipo: 'bool', align: 'center' },
    ],
    fields: [
      { key: 'Nombre',      label: 'Nombre', required: true },
      { key: 'Descripcion', label: 'Descripción', col: 2 },
      { key: 'Activo',      label: 'Activo', tipo: 'check' },
    ],
    blank: { Nombre:'', Descripcion:'', Permisos:'', EsSistema:false, Activo:true },
  },

  // ── BANCOS (catálogo global) ──────────────────────────
  'bancos': {
    recurso: 'bancos',
    titulo: 'Bancos',
    subtitulo: 'Catálogo global de bancos (compartido por todas las empresas)',
    nuevoLabel: '+ Nuevo banco',
    cols: [
      { key: 'Codigo',    label: 'Código', tipo: 'mono' },
      { key: 'Nombre',    label: 'Nombre' },
      { key: 'CodigoSbs', label: 'Cód. SBS', tipo: 'mono', align: 'center' },
      { key: 'Pais',      label: 'País', tipo: 'badge' },
      { key: 'Activo',    label: 'Estado', tipo: 'bool', align: 'center' },
    ],
    fields: [
      { key: 'Codigo',    label: 'Código', required: true },
      { key: 'CodigoSbs', label: 'Código SBS' },
      { key: 'Nombre',    label: 'Nombre', required: true, col: 2 },
      { key: 'Pais',      label: 'País' },
      { key: 'Activo',    label: 'Activo', tipo: 'check' },
    ],
    blank: { Codigo:'', Nombre:'', CodigoSbs:'', Pais:'Perú', Activo:true },
  },
};
