import { MetodoPago, TipoEntrega, EstadoPedido, TipoMovimientoCaja } from './models.js';

export interface LoginDto {
  nombre_usuario?: string;
  usuario?: string;
  username?: string;
  password?: string;
  contrasena?: string;
  pin_rapido?: string;
  pin?: string;
}

export interface CrearProductoDto {
  sucursal_id?: number;
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  disponible?: boolean;
  imagen_url?: string;
  imagen_emoji?: string;
}

export interface ActualizarProductoDto {
  categoria_id?: number;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  disponible?: boolean;
  imagen_url?: string;
  imagen_emoji?: string;
}

export interface ResumenTurnoResponse {
  turno_id: number;
  sucursal_id: number;
  usuario_id: number;
  cajero_nombre: string;
  fondo_inicial: number;
  total_ventas: number;
  total_efectivo: number;
  total_tarjeta: number;
  total_qr: number;
  total_ingresos_extra: number;
  total_egresos_gastos: number;
  total_pedidos: number;
  efectivo_esperado: number;
  efectivo_contado?: number | null;
  diferencia?: number | null;
  estado: string;
  abierto_en: Date;
  cerrado_en?: Date | null;
}

export interface RequestResetDto {
  nombre_usuario_o_correo: string;
}

export interface ResetPasswordDto {
  usuario_id: number;
  codigo: string;
  nuevo_password: string;
}

export interface AdminResetPasswordDto {
  usuario_id: number;
  nuevo_password?: string;
  nuevo_pin?: string;
}

export interface AbrirTurnoDto {
  sucursal_id?: number;
  fondo_inicial: number;
}

export interface CerrarTurnoDto {
  efectivo_contado: number;
}

export interface RegistrarMovimientoDto {
  tipo: TipoMovimientoCaja;
  monto: number;
  concepto: string;
  turno_id?: number;
}

export interface ItemPedidoDto {
  producto_id: number;
  cantidad: number;
  notas?: string;
}

export interface CrearPedidoDto {
  sucursal_id?: number;
  turno_id?: number;
  mesa_id?: number;
  tipo_entrega: TipoEntrega;
  codigo_descuento?: string;
  descuento_porcentaje?: number;
  monto_descuento?: number;
  items: ItemPedidoDto[];
}

export interface ActualizarEstadoPedidoDto {
  estado: EstadoPedido;
}

export interface CancelarPedidoDto {
  motivo_cancelacion: string;
}

export interface RegistrarPagoDto {
  pedido_id: number;
  metodo_pago: MetodoPago;
  monto_recibido?: number;
  monto_efectivo?: number;
  monto_digital?: number;
  referencia?: string;
}

export interface TicketReciboResponse {
  pedido_id: number;
  numero_orden: number;
  sucursal: {
    nombre: string;
    direccion?: string | null;
    telefono?: string | null;
  };
  fecha_hora: string;
  cajero: string;
  tipo_entrega: TipoEntrega;
  mesa?: number | null;
  items: {
    producto: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    notas?: string | null;
  }[];
  subtotal: number;
  descuento: number;
  total: number;
  pago: {
    metodo: MetodoPago;
    monto_recibido: number;
    monto_efectivo: number;
    monto_digital: number;
    vuelto: number;
    referencia?: string | null;
  };
}

export interface CrearUsuarioDto {
  sucursal_id: number;
  rol_id: number;
  nombre_completo: string;
  nombre_usuario: string;
  password: string;
  pin_rapido?: string;
  correo?: string;
  telefono?: string;
}

export interface ActualizarUsuarioDto {
  sucursal_id?: number;
  rol_id?: number;
  nombre_completo?: string;
  nombre_usuario?: string;
  password?: string;
  pin_rapido?: string;
  correo?: string;
  telefono?: string;
  activo?: boolean;
}

export interface CrearSucursalDto {
  nombre: string;
  direccion?: string;
  telefono?: string;
  activa?: boolean;
}

export interface ActualizarSucursalDto {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  activa?: boolean;
}
