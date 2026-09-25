import { ProductRepository } from '../repositories/product.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CrearProductoDto, ActualizarProductoDto } from '../types/dtos.js';

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

  async getProductById(producto_id: number) {
    const product = await this.productRepo.findById(producto_id);
    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }
    return product;
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

  async createProduct(dto: CrearProductoDto) {
    if (!dto.nombre || dto.nombre.trim() === '') {
      throw new AppError('El nombre del producto es requerido', 400);
    }
    if (dto.precio === undefined || dto.precio <= 0) {
      throw new AppError('El precio del producto debe ser mayor a 0', 400);
    }
    if (!dto.categoria_id) {
      throw new AppError('La categoría es requerida', 400);
    }

    return await this.productRepo.create(dto);
  }

  async updateProduct(producto_id: number, dto: ActualizarProductoDto) {
    const existing = await this.productRepo.findById(producto_id);
    if (!existing) {
      throw new AppError('Producto no encontrado', 404);
    }

    if (dto.precio !== undefined && dto.precio <= 0) {
      throw new AppError('El precio del producto debe ser mayor a 0', 400);
    }

    return await this.productRepo.update(producto_id, dto);
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
