import { Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { EstadoPedido } from '../types/models.js';

const orderService = new OrderService();

export class OrderController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user!.usuario_id;
      const sucursalId = req.body.sucursal_id || req.user!.sucursal_id;

      const order = await orderService.createOrder(usuarioId, sucursalId, req.body);
      return res.status(201).json({
        success: true,
        mensaje: `Pedido #${order.numero_orden} registrado exitosamente`,
        pedido: order
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sucursal_id = req.query.sucursal_id ? parseInt(String(req.query.sucursal_id), 10) : req.user?.sucursal_id;
      const estado = req.query.estado as EstadoPedido | undefined;
      const turno_id = req.query.turno_id ? parseInt(String(req.query.turno_id), 10) : undefined;
      const fecha = req.query.fecha ? String(req.query.fecha) : undefined;

      const orders = await orderService.getOrders({
        sucursal_id,
        estado,
        turno_id,
        fecha
      });

      return res.json({
        success: true,
        pedidos: orders
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pedidoId = parseInt(req.params.id, 10);
      const order = await orderService.getOrderById(pedidoId);

      return res.json({
        success: true,
        pedido: order
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pedidoId = parseInt(req.params.id, 10);
      const updated = await orderService.updateStatus(pedidoId, req.body);

      return res.json({
        success: true,
        mensaje: `Estado del pedido actualizado a '${req.body.estado}'`,
        pedido: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pedidoId = parseInt(req.params.id, 10);
      const canceled = await orderService.cancelOrder(pedidoId, req.body);

      return res.json({
        success: true,
        mensaje: 'Pedido cancelado correctamente',
        pedido: canceled
      });
    } catch (error) {
      next(error);
    }
  }
}
