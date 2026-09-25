import { query } from '../config/db.js';

export class ReportRepository {
  async getDailySales(sucursal_id?: number, fecha?: string): Promise<{
    fecha: string;
    total_ventas: number;
    cantidad_pedidos: number;
    ticket_promedio: number;
    ventas_efectivo: number;
    ventas_tarjeta: number;
    ventas_qr: number;
    ventas_por_metodo: { metodo_pago: string; total: number }[];
  }> {
    const dateClause = fecha ? `$1` : `CURRENT_DATE`;
    const params: any[] = fecha ? [fecha] : [];

    let sucursalClause = '';
    if (sucursal_id) {
      params.push(sucursal_id);
      sucursalClause = ` AND p.sucursal_id = $${params.length}`;
    }

    const totalsRes = await query<{
      total_ventas: string;
      cantidad_pedidos: string;
    }>(
      `SELECT 
         COALESCE(SUM(p.total), 0) as total_ventas,
         COUNT(p.pedido_id) as cantidad_pedidos
       FROM pedidos p
       WHERE p.estado_pago = 'pagado'
         AND DATE(p.creado_en) = ${dateClause}
         ${sucursalClause}`,
      params
    );

    const totalVentas = parseFloat(totalsRes.rows[0]?.total_ventas || '0');
    const cantidadPedidos = parseInt(totalsRes.rows[0]?.cantidad_pedidos || '0', 10);
    const ticketPromedio = cantidadPedidos > 0 ? totalVentas / cantidadPedidos : 0;

    // Desglose por método de pago y desglose contable estricto (efectivo vs digital)
    let paymentParams: any[] = fecha ? [fecha] : [];
    let paymentSucursal = '';
    if (sucursal_id) {
      paymentParams.push(sucursal_id);
      paymentSucursal = ` AND ped.sucursal_id = $${paymentParams.length}`;
    }

    const methodsRes = await query<{
      metodo_pago: string;
      total: string;
    }>(
      `SELECT 
         pg.metodo_pago,
         COALESCE(SUM(pg.monto), 0) as total
       FROM pagos pg
       INNER JOIN pedidos ped ON pg.pedido_id = ped.pedido_id
       WHERE ped.estado_pago = 'pagado'
         AND DATE(pg.creado_en) = ${dateClause}
         ${paymentSucursal}
       GROUP BY pg.metodo_pago`,
      paymentParams
    );

    // Sumatorias exactas de efectivo y digital
    const splitRes = await query<{
      ventas_efectivo: string;
      ventas_tarjeta: string;
      ventas_qr: string;
    }>(
      `SELECT 
         COALESCE(SUM(pg.monto_efectivo), 0) as ventas_efectivo,
         COALESCE(SUM(CASE WHEN pg.metodo_pago = 'tarjeta' THEN pg.monto ELSE 0 END), 0) as ventas_tarjeta,
         COALESCE(SUM(
           CASE 
             WHEN pg.metodo_pago = 'qr' THEN pg.monto 
             WHEN pg.metodo_pago = 'mixto' THEN pg.monto_digital 
             ELSE 0 
           END
         ), 0) as ventas_qr
       FROM pagos pg
       INNER JOIN pedidos ped ON pg.pedido_id = ped.pedido_id
       WHERE ped.estado_pago = 'pagado'
         AND DATE(pg.creado_en) = ${dateClause}
         ${paymentSucursal}`,
      paymentParams
    );

    const splitRow = splitRes.rows[0];

    return {
      fecha: fecha || new Date().toISOString().split('T')[0],
      total_ventas: totalVentas,
      cantidad_pedidos: cantidadPedidos,
      ticket_promedio: parseFloat(ticketPromedio.toFixed(2)),
      ventas_efectivo: parseFloat(String(splitRow?.ventas_efectivo || 0)),
      ventas_tarjeta: parseFloat(String(splitRow?.ventas_tarjeta || 0)),
      ventas_qr: parseFloat(String(splitRow?.ventas_qr || 0)),
      ventas_por_metodo: methodsRes.rows.map(r => ({
        metodo_pago: r.metodo_pago,
        total: parseFloat(r.total)
      }))
    };
  }

  async getBestSellers(options: {
    sucursal_id?: number;
    desde?: string;
    hasta?: string;
    limit?: number;
  }): Promise<{
    producto_id: number;
    nombre: string;
    categoria: string;
    cantidad_vendida: number;
    total_recaudado: number;
  }[]> {
    let sql = `
      SELECT 
        pr.producto_id,
        pr.nombre,
        c.nombre as categoria,
        COALESCE(SUM(d.cantidad), 0)::INTEGER as cantidad_vendida,
        COALESCE(SUM(d.subtotal), 0)::NUMERIC as total_recaudado
      FROM pedido_detalles d
      INNER JOIN pedidos p ON d.pedido_id = p.pedido_id
      INNER JOIN productos pr ON d.producto_id = pr.producto_id
      INNER JOIN categorias c ON pr.categoria_id = c.categoria_id
      WHERE p.estado_pago = 'pagado'
    `;
    const params: any[] = [];

    if (options.sucursal_id) {
      params.push(options.sucursal_id);
      sql += ` AND p.sucursal_id = $${params.length}`;
    }

    if (options.desde) {
      params.push(options.desde);
      sql += ` AND DATE(p.creado_en) >= $${params.length}`;
    }

    if (options.hasta) {
      params.push(options.hasta);
      sql += ` AND DATE(p.creado_en) <= $${params.length}`;
    }

    sql += ` GROUP BY pr.producto_id, pr.nombre, c.nombre
             ORDER BY cantidad_vendida DESC`;

    params.push(options.limit || 5);
    sql += ` LIMIT $${params.length}`;

    const res = await query(sql, params);
    return res.rows.map(r => ({
      producto_id: r.producto_id,
      nombre: r.nombre,
      categoria: r.categoria,
      cantidad_vendida: parseInt(r.cantidad_vendida, 10),
      total_recaudado: parseFloat(r.total_recaudado)
    }));
  }

  async getPeakHours(sucursal_id?: number, fecha?: string): Promise<{
    hora: string;
    hora_numero: number;
    cantidad_pedidos: number;
    total_ventas: number;
  }[]> {
    const params: any[] = [];
    let whereClause = `WHERE p.estado_pago = 'pagado'`;

    if (fecha) {
      params.push(fecha);
      whereClause += ` AND DATE(p.creado_en) = $${params.length}`;
    } else {
      whereClause += ` AND DATE(p.creado_en) = CURRENT_DATE`;
    }

    if (sucursal_id) {
      params.push(sucursal_id);
      whereClause += ` AND p.sucursal_id = $${params.length}`;
    }

    const sql = `
      SELECT 
        EXTRACT(HOUR FROM p.creado_en)::INTEGER as hora_numero,
        COUNT(p.pedido_id)::INTEGER as cantidad_pedidos,
        COALESCE(SUM(p.total), 0)::NUMERIC as total_ventas
      FROM pedidos p
      ${whereClause}
      GROUP BY hora_numero
      ORDER BY hora_numero ASC
    `;

    const res = await query(sql, params);
    return res.rows.map(r => ({
      hora: `${String(r.hora_numero).padStart(2, '0')}:00`,
      hora_numero: r.hora_numero,
      cantidad_pedidos: parseInt(r.cantidad_pedidos, 10),
      total_ventas: parseFloat(r.total_ventas)
    }));
  }
}
