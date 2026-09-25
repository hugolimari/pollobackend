import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateJwt);

// RF08 - RF11: Crear nuevo pedido (Cajeros y Administradores)
router.post(
  '/',
  requireRole(['admin', 'cajero']),
  OrderController.create
);

// RF12: Visualizar pedidos en curso (Monitor de Cocina KDS y Punto de Venta)
router.get(
  '/',
  requireRole(['admin', 'cajero', 'cocina']),
  OrderController.getOrders
);

// Obtener detalle completo de un pedido con sus notas de cocina
router.get(
  '/:id',
  requireRole(['admin', 'cajero', 'cocina']),
  OrderController.getById
);

// RF13: Actualizar estado de preparación (en_cocina -> listo -> entregado)
router.patch(
  '/:id/estado',
  requireRole(['admin', 'cajero', 'cocina']),
  OrderController.updateStatus
);

// RF14: Cancelar pedido con registro de motivo (Solo Cajero y Administrador)
router.post(
  '/:id/cancelar',
  requireRole(['admin', 'cajero']),
  OrderController.cancel
);

export default router;
