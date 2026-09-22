import { MetodoPago, TipoEntrega, EstadoPedido } from './models.js';

export interface LoginDto {
  nombre_usuario?: string;
  password?: string;
  pin_rapido?: string;
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
    vuelto: number;
    referencia?: string | null;
  };
}
