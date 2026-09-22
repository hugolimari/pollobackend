export type RolNombre = 'admin' | 'cajero' | 'cocina';

export interface Sucursal {
  sucursal_id: number;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  activa: boolean;
  creado_en: Date;
}

export interface Rol {
  rol_id: number;
  nombre: RolNombre;
}

export interface Usuario {
  usuario_id: number;
  sucursal_id: number;
  rol_id: number;
  rol_nombre?: RolNombre;
  nombre_completo: string;
  nombre_usuario: string;
  password_hash: string;
  pin_rapido?: string | null;
  correo?: string | null;
  telefono?: string | null;
  activo: boolean;
  creado_en: Date;
}

export interface RecuperacionPassword {
  recuperacion_id: number;
  usuario_id: number;
  codigo: string;
  expira_en: Date;
  usado: boolean;
  creado_en: Date;
}

export interface Categoria {
  categoria_id: number;
  nombre: string;
  orden: number;
}

export interface Producto {
  producto_id: number;
  sucursal_id: number;
  categoria_id: number;
  categoria_nombre?: string;
  nombre: string;
  descripcion?: string | null;
  precio: number | string;
  disponible: boolean;
  imagen_emoji?: string | null;
  creado_en: Date;
  actualizado_en: Date;
}

export interface Turno {
  turno_id: number;
  sucursal_id: number;
  usuario_id: number;
  cajero_nombre?: string;
  fondo_inicial: number | string;
  abierto_en: Date;
  cerrado_en?: Date | null;
  efectivo_esperado?: number | string | null;
  efectivo_contado?: number | string | null;
  diferencia?: number | string | null;
  estado: 'abierto' | 'cerrado';
}

export interface Mesa {
  mesa_id: number;
  sucursal_id: number;
  numero: number;
}

export interface Descuento {
  descuento_id: number;
  codigo: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: number | string;
  activo: boolean;
  valido_desde?: Date | null;
  valido_hasta?: Date | null;
  creado_en: Date;
}

export type TipoEntrega = 'mesa' | 'para_llevar';
export type EstadoPedido = 'en_cocina' | 'listo' | 'entregado' | 'cancelado';
export type EstadoPago = 'pendiente' | 'pagado' | 'cancelado';

export interface Pedido {
  pedido_id: number;
  sucursal_id: number;
  turno_id: number;
  usuario_id: number;
  mesa_id?: number | null;
  numero_mesa?: number | null;
  numero_orden: number;
  tipo_entrega: TipoEntrega;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  subtotal: number | string;
  descuento_id?: number | null;
  codigo_descuento?: string | null;
  monto_descuento: number | string;
  total: number | string;
  motivo_cancelacion?: string | null;
  creado_en: Date;
  listo_en?: Date | null;
  entregado_en?: Date | null;
  cancelado_en?: Date | null;
  detalles?: PedidoDetalle[];
}

export interface PedidoDetalle {
  detalle_id: number;
  pedido_id: number;
  producto_id: number;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
  notas?: string | null;
}

export type MetodoPago = 'efectivo' | 'tarjeta' | 'qr' | 'mixto';

export interface Pago {
  pago_id: number;
  pedido_id: number;
  turno_id: number;
  metodo_pago: MetodoPago;
  monto: number | string;
  monto_recibido: number | string;
  vuelto: number | string;
  referencia?: string | null;
  creado_en: Date;
}
