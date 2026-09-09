/**
 * Tipos e interfaces de datos para el Dashboard de BottleTrack
 */

export interface MetricItem {
  id: string;
  title: string;
  value: string | number;
  change?: number; // Porcentaje de cambio (+12.5 o -3.2)
  changeType?: "positive" | "negative" | "neutral";
  period?: string; // Ej: "vs mes anterior", "vs ayer"
  iconName?: "dollar" | "calendar-dollar" | "package" | "alert-triangle" | "shopping-cart" | "trending-up";
  secondaryText?: string; // Subtítulo o detalle contextual
  isAlert?: boolean;
}

export interface PuntoTendencia {
  fecha: string; // Ej: "2026-08-20"
  ventas: number;
  compras: number;
}

export interface SalesTrendDataPoint {
  date: string;
  ventas: number;
  compras: number;
  pedidos?: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  stock: number;
}

export interface CategorySales {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface RecentSale {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerType: "particular" | "restaurante" | "mayorista" | "evento";
  itemsCount: number;
  total: number;
  paymentMethod: "efectivo" | "tarjeta" | "transferencia";
  status: "completada" | "pendiente" | "cancelada";
  date: string;
  time: string;
}

export interface LowStockAlert {
  id: string;
  productName: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  severity: "critical" | "warning";
}

/**
 * Contrato de respuesta para GET /api/dashboard/resumen-inventario
 */
export interface ProductoStockBajo {
  id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
}

export interface CategoriaInventario {
  categoria: string;
  total: number;
}

export interface ResumenInventario {
  total_productos: number;
  productos_stock_bajo: number;
  productos_por_categoria: CategoriaInventario[];
  productos_stock_bajo_detalle: ProductoStockBajo[];
}

/**
 * Contrato de respuesta para GET /api/dashboard/resumen-ventas-compras
 */
export interface TopProductoDashboard {
  nombre: string;
  total_vendido: number;
}

export interface UltimaVentaUsuarioDashboard {
  name: string;
}

export interface UltimaVentaDashboard {
  id: number;
  numero_factura: string;
  cliente_nombre: string | null;
  fecha: string;
  total: string;
  usuario: UltimaVentaUsuarioDashboard;
}

export interface ResumenVentasCompras {
  ventas_hoy: number;
  ventas_mes: number;
  compras_mes: number;
  utilidad_estimada: number;
  top_productos: TopProductoDashboard[];
  ultimas_ventas: UltimaVentaDashboard[];
}

export interface VentaPorCategoria {
  categoria: string;
  total: number;
}


