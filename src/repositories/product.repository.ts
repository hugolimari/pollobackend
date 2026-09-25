import { query } from '../config/db.js';
import { Producto, Categoria } from '../types/models.js';
import { CrearProductoDto, ActualizarProductoDto } from '../types/dtos.js';

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

  async create(data: CrearProductoDto): Promise<Producto> {
    const res = await query<Producto>(
      `INSERT INTO productos (sucursal_id, categoria_id, nombre, descripcion, precio, disponible, imagen_url, imagen_emoji)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.sucursal_id || 1,
        data.categoria_id,
        data.nombre,
        data.descripcion || null,
        data.precio,
        data.disponible !== undefined ? data.disponible : true,
        data.imagen_url || null,
        data.imagen_emoji || null
      ]
    );
    return res.rows[0];
  }

  async update(producto_id: number, data: ActualizarProductoDto): Promise<Producto | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.categoria_id !== undefined) {
      params.push(data.categoria_id);
      fields.push(`categoria_id = $${params.length}`);
    }
    if (data.nombre !== undefined) {
      params.push(data.nombre);
      fields.push(`nombre = $${params.length}`);
    }
    if (data.descripcion !== undefined) {
      params.push(data.descripcion);
      fields.push(`descripcion = $${params.length}`);
    }
    if (data.precio !== undefined) {
      params.push(data.precio);
      fields.push(`precio = $${params.length}`);
    }
    if (data.disponible !== undefined) {
      params.push(data.disponible);
      fields.push(`disponible = $${params.length}`);
    }
    if (data.imagen_url !== undefined) {
      params.push(data.imagen_url);
      fields.push(`imagen_url = $${params.length}`);
    }
    if (data.imagen_emoji !== undefined) {
      params.push(data.imagen_emoji);
      fields.push(`imagen_emoji = $${params.length}`);
    }

    if (fields.length === 0) {
      return this.findById(producto_id);
    }

    fields.push(`actualizado_en = now()`);
    params.push(producto_id);

    const sql = `UPDATE productos SET ${fields.join(', ')} WHERE producto_id = $${params.length} RETURNING *`;
    const res = await query<Producto>(sql, params);
    return res.rows[0] || null;
  }
}
