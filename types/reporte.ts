/**
 * Tipos e interfaces para el Módulo de Reportes de BottleTrack
 */

export interface ReporteFiltrosFechas {
  desde?: string;
  hasta?: string;
}

export type TipoReporte =
  | "maestro-detalle-ventas"
  | "inventario-actual"
  | "stock-bajo"
  | "ventas-por-fechas"
  | "ventas-por-vendedor"
  | "compras-por-proveedor"
  | "movimientos-inventario";

export type FormatoReporte = "pdf" | "excel";

/**
 * Item de producto dentro del detalle de venta para reporte maestro-detalle
 */
export interface ReporteDetalleVentaProducto {
  id?: number;
  producto_id?: number;
  producto?: { nombre: string } | string;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
}

/**
 * 1. Respuesta para GET /api/reportes/maestro-detalle-ventas
 */
export interface ReporteMaestroDetalleVenta {
  id?: number;
  factura: string;
  numero_factura?: string;
  fecha: string;
  vendedor: string;
  cliente: string | null;
  producto?: string;
  cantidad?: number;
  precio_unitario?: number | string;
  subtotal_linea?: number | string;
  total_venta?: number | string;
  cliente_nombre?: string | null;
  usuario?: { name: string } | null;
  created_at?: string;
  estado_activa?: boolean | number;
  subtotal?: number | string;
  impuesto?: number | string;
  descuento?: number | string;
  total?: number | string;
  detalles?: ReporteDetalleVentaProducto[];
}

/**
 * 2. Respuesta para GET /api/reportes/inventario-actual
 */
export interface ReporteInventarioActual {
  id: number;
  nombre: string;
  marca?: string | null;
  categoria?: string | { nombre: string } | null;
  categoria_nombre?: string | null;
  precio_compra: number | string;
  precio_venta: number | string;
  stock_actual?: number;
  stock?: number;
  stock_minimo?: number;
  stock_min?: number;
  ubicacion?: string | null;
  presentacion_ml?: string | null;
  activo?: boolean;
}

/**
 * 3. Respuesta para GET /api/reportes/stock-bajo
 */
export interface ReporteStockBajo {
  id: number;
  nombre: string;
  stock_actual?: number;
  stock?: number;
  stock_minimo?: number;
  stock_min?: number;
  deficit?: number;
  categoria?: string | { nombre: string } | null;
  categoria_nombre?: string | null;
}

/**
 * 4. Respuesta para GET /api/reportes/ventas-por-fechas
 */
export interface ReporteVentaPorFecha {
  id: number;
  fecha: string;
  numero_factura: string;
  cliente_nombre?: string | null;
  cliente?: string | null;
  subtotal: number | string;
  impuesto: number | string;
  descuento: number | string;
  total: number | string;
}

/**
 * 5. Respuesta para GET /api/reportes/ventas-por-vendedor
 */
export interface ReporteVentasPorVendedor {
  vendedor: string;
  total_ventas: number;
  monto_total: number | string;
}

/**
 * 6. Respuesta para GET /api/reportes/compras-por-proveedor
 */
export interface ReporteComprasPorProveedor {
  proveedor: string;
  total_compras: number;
  monto_total: number | string;
}

/**
 * 7. Respuesta para GET /api/reportes/movimientos-inventario
 */
export interface ReporteMovimientoInventario {
  fecha: string;
  producto: string;
  tipo: "Entrada" | "Salida";
  cantidad: number;
  precio_unitario: number | string;
}
