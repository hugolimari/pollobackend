import { OrderRepository } from '../repositories/order.repository.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { ShiftRepository } from '../repositories/shift.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CrearPedidoDto, ActualizarEstadoPedidoDto, CancelarPedidoDto } from '../types/dtos.js';
import { EstadoPedido } from '../types/models.js';

export class OrderService {
  private orderRepo: OrderRepository;
  private productRepo: ProductRepository;
  private shiftRepo: ShiftRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
    this.productRepo = new ProductRepository();
    this.shiftRepo = new ShiftRepository();
  }

  async createOrder(usuario_id: number, sucursal_id: number, dto: CrearPedidoDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new AppError('El pedido debe incluir al menos un producto', 400);
    }

    if (!['mesa', 'para_llevar'].includes(dto.tipo_entrega)) {
      throw new AppError('Tipo de entrega inválido. Debe ser "mesa" o "para_llevar"', 400);
    }

    // 1. Obtener o validar el turno activo del usuario
    let turnoId = dto.turno_id;
    if (!turnoId) {
      const activeShift = await this.shiftRepo.findActiveByUserId(usuario_id);
      if (!activeShift) {
        throw new AppError('Debes abrir un turno de caja antes de registrar pedidos', 400);
      }
      turnoId = activeShift.turno_id;
    }

    // 2. Validar productos, disponibilidad y calcular subtotales
    let subtotal = 0;
    const itemsProcesados: {
      producto_id: number;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
      notas?: string | null;
    }[] = [];

    for (const item of dto.items) {
      if (item.cantidad <= 0) {
        throw new AppError(`La cantidad del producto ID ${item.producto_id} debe ser mayor a 0`, 400);
      }

      const prod = await this.productRepo.findById(item.producto_id);
      if (!prod) {
        throw new AppError(`Producto con ID ${item.producto_id} no existe`, 404);
      }

      if (!prod.disponible) {
        throw new AppError(`El producto "${prod.nombre}" está agotado y no se puede pedir`, 400);
      }

      const precio = parseFloat(String(prod.precio));
      const itemSubtotal = parseFloat((precio * item.cantidad).toFixed(2));
      subtotal += itemSubtotal;

      itemsProcesados.push({
        producto_id: prod.producto_id,
        cantidad: item.cantidad,
        precio_unitario: precio,
        subtotal: itemSubtotal,
        notas: item.notas?.trim() || null
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));

    // 3. Validar código de descuento si fue provisto (RF10)
    let descuentoId: number | null = null;
    let montoDescuento = 0;

    if (dto.codigo_descuento && dto.codigo_descuento.trim() !== '') {
      const discount = await this.orderRepo.findDiscountByCode(dto.codigo_descuento.trim());
      if (!discount) {
        throw new AppError(`El código de descuento "${dto.codigo_descuento}" no es válido o expiró`, 400);
      }

      descuentoId = discount.descuento_id;
      const valor = parseFloat(String(discount.valor));

      if (discount.tipo === 'porcentaje') {
        montoDescuento = parseFloat(((subtotal * valor) / 100).toFixed(2));
      } else {
        montoDescuento = Math.min(valor, subtotal);
      }
    }

    const total = parseFloat((subtotal - montoDescuento).toFixed(2));

    // 4. Asignar número de orden correlativo para hoy (RF11)
    const numeroOrden = await this.orderRepo.getNextOrderNumber(sucursal_id);

    // 5. Guardar en base de datos con transacción
    return await this.orderRepo.createOrder(
      {
        sucursal_id,
        turno_id: turnoId,
        usuario_id,
        mesa_id: dto.mesa_id || null,
        numero_orden: numeroOrden,
        tipo_entrega: dto.tipo_entrega,
        subtotal,
        descuento_id: descuentoId,
        monto_descuento: montoDescuento,
        total
      },
      itemsProcesados
    );
  }

  async getOrders(options?: {
    sucursal_id?: number;
    estado?: EstadoPedido;
    turno_id?: number;
    fecha?: string;
  }) {
    return await this.orderRepo.getOrders(options);
  }

  async getOrderById(pedido_id: number) {
    const order = await this.orderRepo.findById(pedido_id);
    if (!order) {
      throw new AppError('Pedido no encontrado', 404);
    }
    return order;
  }

  async updateStatus(pedido_id: number, dto: ActualizarEstadoPedidoDto) {
    const validStates: EstadoPedido[] = ['en_cocina', 'listo', 'entregado', 'cancelado'];
    if (!validStates.includes(dto.estado)) {
      throw new AppError(`Estado inválido. Valores permitidos: ${validStates.join(', ')}`, 400);
    }

    const existing = await this.orderRepo.findById(pedido_id);
    if (!existing) {
      throw new AppError('Pedido no encontrado', 404);
    }

    if (existing.estado === 'cancelado') {
      throw new AppError('No se puede cambiar el estado de un pedido ya cancelado', 400);
    }

    return await this.orderRepo.updateStatus(pedido_id, dto.estado);
  }

  async cancelOrder(pedido_id: number, dto: CancelarPedidoDto) {
    if (!dto.motivo_cancelacion || dto.motivo_cancelacion.trim().length === 0) {
      throw new AppError('Debes especificar el motivo de la cancelación', 400);
    }

    const existing = await this.orderRepo.findById(pedido_id);
    if (!existing) {
      throw new AppError('Pedido no encontrado', 404);
    }

    if (existing.estado === 'cancelado') {
      throw new AppError('El pedido ya se encuentra cancelado', 400);
    }

    return await this.orderRepo.cancelOrder(pedido_id, dto.motivo_cancelacion.trim());
  }
}
