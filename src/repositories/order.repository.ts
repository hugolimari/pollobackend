import { pool, query } from '../config/db.js';
import { Pedido, PedidoDetalle, Descuento, EstadoPedido } from '../types/models.js';

export class OrderRepository {
  async getNextOrderNumber(sucursal_id: number): Promise<number> {
    // Número correlativo para hoy en la sucursal (ej. 1, 2, ... 231)
    const res = await query<{ max_orden: number }>(
      `SELECT COALESCE(MAX(numero_orden), 0) as max_orden 
       FROM pedidos 
       WHERE sucursal_id = $1 AND DATE(creado_en) = CURRENT_DATE`,
      [sucursal_id]
    );
    const lastNum = parseInt(String(res.rows[0]?.max_orden || 0), 10);
    return lastNum + 1;
  }

  async findDiscountByCode(codigo: string): Promise<Descuento | null> {
    const res = await query<Descuento>(
      `SELECT * FROM descuentos 
       WHERE UPPER(codigo) = UPPER($1) 
         AND activo = TRUE 
         AND (valido_desde IS NULL OR valido_desde <= now())
         AND (valido_hasta IS NULL OR valido_hasta >= now())`,
      [codigo]
    );
    return res.rows[0] || null;
  }

  async createOrder(
    orderData: {
      sucursal_id: number;
      turno_id: number;
      usuario_id: number;
      mesa_id?: number | null;
      numero_orden: number;
      tipo_entrega: 'mesa' | 'para_llevar';
      subtotal: number;
      descuento_id?: number | null;
      monto_descuento: number;
      total: number;
    },
    items: {
      producto_id: number;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
      notas?: string | null;
    }[]
  ): Promise<Pedido> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const orderSql = `
        INSERT INTO pedidos (
          sucursal_id, turno_id, usuario_id, mesa_id, numero_orden,
          tipo_entrega, estado, estado_pago, subtotal, descuento_id,
          monto_descuento, total
        ) VALUES ($1, $2, $3, $4, $5, $6, 'en_cocina', 'pendiente', $7, $8, $9, $10)
        RETURNING *
      `;
      const orderRes = await client.query<Pedido>(orderSql, [
        orderData.sucursal_id,
        orderData.turno_id,
        orderData.usuario_id,
        orderData.mesa_id || null,
        orderData.numero_orden,
        orderData.tipo_entrega,
        orderData.subtotal,
        orderData.descuento_id || null,
        orderData.monto_descuento,
        orderData.total
      ]);
      const createdOrder = orderRes.rows[0];

      const createdItems: PedidoDetalle[] = [];
      for (const item of items) {
        const itemSql = `
          INSERT INTO pedido_detalles (
            pedido_id, producto_id, cantidad, precio_unitario, subtotal, notas
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const itemRes = await client.query<PedidoDetalle>(itemSql, [
          createdOrder.pedido_id,
          item.producto_id,
          item.cantidad,
          item.precio_unitario,
          item.subtotal,
          item.notas || null
        ]);
        createdItems.push(itemRes.rows[0]);
      }

      await client.query('COMMIT');
      createdOrder.detalles = createdItems;
      return createdOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(pedido_id: number): Promise<Pedido | null> {
    const orderRes = await query<Pedido>(
      `SELECT p.*, m.numero as numero_mesa, d.codigo as codigo_descuento,
              u.nombre_completo as cajero_nombre, s.nombre as sucursal_nombre
       FROM pedidos p
       LEFT JOIN mesas m ON p.mesa_id = m.mesa_id
       LEFT JOIN descuentos d ON p.descuento_id = d.descuento_id
       INNER JOIN usuarios u ON p.usuario_id = u.usuario_id
       INNER JOIN sucursales s ON p.sucursal_id = s.sucursal_id
       WHERE p.pedido_id = $1`,
      [pedido_id]
    );

    if (orderRes.rows.length === 0) return null;
    const order = orderRes.rows[0];

    const itemsRes = await query<PedidoDetalle>(
      `SELECT d.*, pr.nombre as producto_nombre, pr.imagen_emoji
       FROM pedido_detalles d
       INNER JOIN productos pr ON d.producto_id = pr.producto_id
       WHERE d.pedido_id = $1`,
      [pedido_id]
    );

    order.detalles = itemsRes.rows;
    return order;
  }

  async getOrders(options?: {
    sucursal_id?: number;
    estado?: EstadoPedido;
    turno_id?: number;
    fecha?: string;
  }): Promise<Pedido[]> {
    let sql = `
      SELECT p.*, m.numero as numero_mesa, d.codigo as codigo_descuento
      FROM pedidos p
      LEFT JOIN mesas m ON p.mesa_id = m.mesa_id
      LEFT JOIN descuentos d ON p.descuento_id = d.descuento_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.sucursal_id) {
      params.push(options.sucursal_id);
      sql += ` AND p.sucursal_id = $${params.length}`;
    }

    if (options?.estado) {
      params.push(options.estado);
      sql += ` AND p.estado = $${params.length}`;
    }

    if (options?.turno_id) {
      params.push(options.turno_id);
      sql += ` AND p.turno_id = $${params.length}`;
    }

    if (options?.fecha) {
      params.push(options.fecha);
      sql += ` AND DATE(p.creado_en) = $${params.length}`;
    }

    sql += ` ORDER BY p.creado_en DESC`;

    const res = await query<Pedido>(sql, params);

    // Adjuntar detalles resumidos
    for (const order of res.rows) {
      const itemsRes = await query<PedidoDetalle>(
        `SELECT d.*, pr.nombre as producto_nombre
         FROM pedido_detalles d
         INNER JOIN productos pr ON d.producto_id = pr.producto_id
         WHERE d.pedido_id = $1`,
        [order.pedido_id]
      );
      order.detalles = itemsRes.rows;
    }

    return res.rows;
  }

  async updateStatus(pedido_id: number, estado: EstadoPedido): Promise<Pedido | null> {
    let timestampField = '';
    if (estado === 'listo') timestampField = ', listo_en = now()';
    else if (estado === 'entregado') timestampField = ', entregado_en = now()';

    const res = await query<Pedido>(
      `UPDATE pedidos
       SET estado = $1 ${timestampField}
       WHERE pedido_id = $2
       RETURNING *`,
      [estado, pedido_id]
    );

    return res.rows[0] || null;
  }

  async cancelOrder(pedido_id: number, motivo_cancelacion: string): Promise<Pedido | null> {
    const res = await query<Pedido>(
      `UPDATE pedidos
       SET estado = 'cancelado',
           estado_pago = 'cancelado',
           motivo_cancelacion = $1,
           cancelado_en = now()
       WHERE pedido_id = $2
       RETURNING *`,
      [motivo_cancelacion, pedido_id]
    );

    return res.rows[0] || null;
  }
}
