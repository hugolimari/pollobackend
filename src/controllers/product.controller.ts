import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.js';

const productService = new ProductService();

export class ProductController {
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await productService.getCategories();
      return res.json({
        success: true,
        categorias: categories
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const sucursal_id = req.query.sucursal_id ? parseInt(String(req.query.sucursal_id), 10) : undefined;
      const categoria_id = req.query.categoria_id ? parseInt(String(req.query.categoria_id), 10) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;
      const soloDisponibles = req.query.disponibles === 'true';

      const products = await productService.getProducts({
        sucursal_id,
        categoria_id,
        search,
        soloDisponibles
      });

      return res.json({
        success: true,
        productos: products
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGrouped(req: Request, res: Response, next: NextFunction) {
    try {
      const sucursal_id = req.query.sucursal_id ? parseInt(String(req.query.sucursal_id), 10) : undefined;
      const menu = await productService.getProductsGroupedByCategory(sucursal_id);

      return res.json({
        success: true,
        menu
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const productoId = parseInt(req.params.id, 10);
      const product = await productService.getProductById(productoId);
      return res.json({
        success: true,
        producto: product
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.createProduct(req.body);
      return res.status(201).json({
        success: true,
        mensaje: 'Producto creado exitosamente en el catálogo',
        producto: product
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const productoId = parseInt(req.params.id, 10);
      const updated = await productService.updateProduct(productoId, req.body);
      return res.json({
        success: true,
        mensaje: 'Producto actualizado exitosamente',
        producto: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleAgotado(req: Request, res: Response, next: NextFunction) {
    try {
      const productoId = parseInt(req.params.id, 10);
      const { disponible } = req.body;

      const result = await productService.toggleAgotado(productoId, Boolean(disponible));
      return res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}
