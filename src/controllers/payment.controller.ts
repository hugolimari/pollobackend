import { Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const paymentService = new PaymentService();

export class PaymentController {
  static async processPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.user!.usuario_id;
      const result = await paymentService.processPayment(usuarioId, req.body);

      return res.status(201).json({
        success: true,
        mensaje: 'Cobro registrado exitosamente',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReceipt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pedidoId = parseInt(req.params.pedido_id, 10);
      const ticket = await paymentService.generateReceipt(pedidoId);

      return res.json({
        success: true,
        recibo: ticket
      });
    } catch (error) {
      next(error);
    }
  }
}
