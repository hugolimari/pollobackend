import { ProductRepository } from '../repositories/product.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export class ProductService {
  private productRepo: ProductRepository;

  constructor() {
    this.productRepo = new ProductRepository();
  }

  async getCategories() {
    return await this.productRepo.getCategories();
  }

  async getProducts(options?: {
    sucursal_id?: number;
    categoria_id?: number;
    search?: string;
    soloDisponibles?: boolean;
  }) {
    return await this.productRepo.getAll(options);
  }

  async getProductsGroupedByCategory(sucursal_id?: number) {
    const categories = await this.productRepo.getCategories();
    const products = await this.productRepo.getAll({ sucursal_id });

    return categories.map((cat) => ({
      categoria_id: cat.categoria_id,
      nombre: cat.nombre,
      orden: cat.orden,
      productos: products.filter((p) => p.categoria_id === cat.categoria_id)
    }));
  }

  async toggleAgotado(producto_id: number, disponible: boolean) {
    const product = await this.productRepo.findById(producto_id);
    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    const updated = await this.productRepo.setAvailability(producto_id, disponible);
    return {
      mensaje: disponible ? 'Producto marcado como disponible' : 'Producto marcado como agotado',
      producto: updated
    };
  }
}
