import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';

const router = Router();

// RF05: Categorías de productos
router.get('/categorias', ProductController.getCategories);

// RF05, RF07: Listado general y búsqueda por nombre
router.get('/', ProductController.getProducts);

// RF05: Menú agrupado por categoría
router.get('/menu', ProductController.getGrouped);

// RF06: Marcar producto como agotado o disponible
router.patch('/:id/disponibilidad', authenticateJwt, ProductController.toggleAgotado);

export default router;
