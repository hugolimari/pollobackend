import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// RF05: Categorías de productos (Acceso para toda la app)
router.get('/categorias', ProductController.getCategories);

// RF05, RF07: Catálogo de productos y búsqueda
router.get('/', ProductController.getProducts);

// RF05: Menú agrupado por categorías para la pantalla táctil de ventas
router.get('/menu', ProductController.getGrouped);

// Obtener producto por ID
router.get('/:id', ProductController.getById);

// RF06: Marcar producto como agotado o disponible (Cajeros y Administradores en turno)
router.patch(
  '/:id/disponibilidad',
  authenticateJwt,
  requireRole(['admin', 'cajero']),
  ProductController.toggleAgotado
);

// Gestión de catálogo: Crear nuevo producto (Solo Administrador)
router.post(
  '/',
  authenticateJwt,
  requireRole(['admin']),
  ProductController.create
);

// Gestión de catálogo: Modificar datos de producto (Solo Administrador)
router.put(
  '/:id',
  authenticateJwt,
  requireRole(['admin']),
  ProductController.update
);

export default router;
