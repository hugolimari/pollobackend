import { PaymentRepository } from '../repositories/payment.repository.js';
import { OrderRepository } from '../repositories/order.repository.js';
import { ShiftRepository } from '../repositories/shift.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { RegistrarPagoDto, TicketReciboResponse } from '../types/dtos.js';
import { MetodoPago } from '../types/models.js';

export class PaymentService {
  private paymentRepo: PaymentRepository;
  private orderRepo: OrderRepository;
  private shiftRepo: ShiftRepository;

  constructor() {
    this.paymentRepo = new PaymentRepository();
    this.orderRepo = new OrderRepository();
    this.shiftRepo = new ShiftRepository();
  }

  async processPayment(usuario_id: number, dto: RegistrarPagoDto) {
    const validMethods: MetodoPago[] = ['efectivo', 'tarjeta', 'qr', 'mixto'];
    if (!validMethods.includes(dto.metodo_pago)) {
      throw new AppError(`Método de pago inválido. Permitidos: ${validMethods.join(', ')}`, 400);
    }

    const order = await this.orderRepo.findById(dto.pedido_id);
    if (!order) {
      throw new AppError('Pedido no encontrado', 404);
    }

    if (order.estado_pago === 'pagado') {
      throw new AppError('Este pedido ya se encuentra completamente pagado', 400);
    }

    if (order.estado === 'cancelado') {
      throw new AppError('No se puede cobrar un pedido cancelado', 400);
    }

    // Validar turno activo
    const activeShift = await this.shiftRepo.findActiveByUserId(usuario_id);
    if (!activeShift) {
      throw new AppError('Debes tener un turno de caja abierto para registrar cobros', 400);
    }

    const totalAPagar = parseFloat(String(order.total));
    let montoRecibido = dto.monto_recibido !== undefined ? dto.monto_recibido : totalAPagar;
    let vuelto = 0;

    if (dto.metodo_pago === 'efectivo') {
      if (montoRecibido < totalAPagar) {
        throw new AppError(
          `El monto recibido (Bs. ${montoRecibido.toFixed(2)}) es menor al total a cobrar (Bs. ${totalAPagar.toFixed(2)})`,
          400
        );
      }
      vuelto = parseFloat((montoRecibido - totalAPagar).toFixed(2));
    } else {
      montoRecibido = totalAPagar;
      vuelto = 0;
    }

    const pagoRegistrado = await this.paymentRepo.processPayment({
      pedido_id: order.pedido_id,
      turno_id: activeShift.turno_id,
      metodo_pago: dto.metodo_pago,
      monto: totalAPagar,
      monto_recibido: montoRecibido,
      vuelto,
      referencia: dto.referencia || null
    });

    const ticket = await this.generateReceipt(order.pedido_id);

    return {
      pago: pagoRegistrado,
      recibo: ticket
    };
  }

  async generateReceipt(pedido_id: number): Promise<TicketReciboResponse> {
    const order = await this.orderRepo.findById(pedido_id);
    if (!order) {
      throw new AppError('Pedido no encontrado para emitir recibo', 404);
    }

    const pagos = await this.paymentRepo.findByOrderId(pedido_id);
    const ultimoPago = pagos[0];

    return {
      pedido_id: order.pedido_id,
      numero_orden: order.numero_orden,
      sucursal: {
        nombre: (order as any).sucursal_nombre || 'PolloPOS - Sucursal Centro',
        direccion: 'Av. Principal #123',
        telefono: '+591 70012345'
      },
      fecha_hora: new Date(order.creado_en).toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
      cajero: (order as any).cajero_nombre || 'Cajero de Turno',
      tipo_entrega: order.tipo_entrega,
      mesa: order.numero_mesa || null,
      items: (order.detalles || []).map((d) => ({
        producto: d.producto_nombre || 'Producto',
        cantidad: d.cantidad,
        precio_unitario: parseFloat(String(d.precio_unitario)),
        subtotal: parseFloat(String(d.subtotal)),
        notas: d.notas || null
      })),
      subtotal: parseFloat(String(order.subtotal)),
      descuento: parseFloat(String(order.monto_descuento)),
      total: parseFloat(String(order.total)),
      pago: {
        metodo: ultimoPago?.metodo_pago || 'efectivo',
        monto_recibido: parseFloat(String(ultimoPago?.monto_recibido || order.total)),
        vuelto: parseFloat(String(ultimoPago?.vuelto || 0)),
        referencia: ultimoPago?.referencia || null
      }
    };
  }
}
