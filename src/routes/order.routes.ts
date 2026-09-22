import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateJwt);

// RF08 - RF11: Crear nuevo pedido
router.post('/', OrderController.create);

// RF12: Visualizar pedidos en curso (filtros por estado, turno, sucursal)
router.get('/', OrderController.getOrders);

// Obtener detalle de un pedido
router.get('/:id', OrderController.getById);

// RF13: Actualizar estado de preparación y entrega
router.patch('/:id/estado', OrderController.updateStatus);

// RF14: Cancelar pedido con registro de motivo
router.post('/:id/cancelar', OrderController.cancel);

export default router;
