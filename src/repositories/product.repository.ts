import { query } from '../config/db.js';
import { Producto, Categoria } from '../types/models.js';

export class ProductRepository {
  async getCategories(): Promise<Categoria[]> {
    const res = await query<Categoria>(
      `SELECT * FROM categorias ORDER BY orden ASC`
    );
    return res.rows;
  }

  async getAll(options?: {
    sucursal_id?: number;
    categoria_id?: number;
    search?: string;
    soloDisponibles?: boolean;
  }): Promise<Producto[]> {
    let sql = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.categoria_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.sucursal_id) {
      params.push(options.sucursal_id);
      sql += ` AND p.sucursal_id = $${params.length}`;
    }

    if (options?.categoria_id) {
      params.push(options.categoria_id);
      sql += ` AND p.categoria_id = $${params.length}`;
    }

    if (options?.search && options.search.trim() !== '') {
      params.push(`%${options.search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(p.nombre) LIKE $${params.length} OR LOWER(COALESCE(p.descripcion, '')) LIKE $${params.length})`;
    }

    if (options?.soloDisponibles) {
      sql += ` AND p.disponible = TRUE`;
    }

    sql += ` ORDER BY c.orden ASC, p.nombre ASC`;

    const res = await query<Producto>(sql, params);
    return res.rows;
  }

  async findById(producto_id: number): Promise<Producto | null> {
    const res = await query<Producto>(
      `SELECT p.*, c.nombre as categoria_nombre
       FROM productos p
       INNER JOIN categorias c ON p.categoria_id = c.categoria_id
       WHERE p.producto_id = $1`,
      [producto_id]
    );
    return res.rows[0] || null;
  }

  async setAvailability(producto_id: number, disponible: boolean): Promise<Producto | null> {
    const res = await query<Producto>(
      `UPDATE productos
       SET disponible = $1, actualizado_en = now()
       WHERE producto_id = $2
       RETURNING *`,
      [disponible, producto_id]
    );
    return res.rows[0] || null;
  }
}
