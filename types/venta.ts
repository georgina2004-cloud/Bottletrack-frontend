import { Producto } from "./producto";
import { Presentacion } from "./presentacion";

/**
 * Contrato de tipos e interfaces para el módulo de Ventas de BottleTrack.
 */

export interface DetalleVentaProducto {
  id?: number;
  nombre: string;
  codigo_barras?: string | null;
  precio_venta?: string;
  stock_actual?: number;
}

export interface DetalleVenta {
  id?: number;
  venta_id?: number;
  producto_id: number;
  presentacion_id?: number | null;
  cantidad: number;
  precio_unitario: string | number;
  subtotal: string | number;
  producto?: DetalleVentaProducto;
  presentacion?: Presentacion;
  created_at?: string;
  updated_at?: string;
}

export interface VentaUsuario {
  id?: number;
  name: string;
  email?: string;
}

export interface Venta {
  id: number;
  numero_factura: string;
  cliente_nombre: string | null;
  fecha: string;
  subtotal: string | number;
  impuesto: string | number;
  descuento: string | number;
  total: string | number;
  estado_activa: boolean;
  detalles?: DetalleVenta[];
  usuario?: VentaUsuario;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ItemVentaPayload {
  producto_id: number;
  presentacion_id: number;
  cantidad: number;
}

export interface CrearVentaPayload {
  cliente_nombre?: string;
  descuento?: number;
  productos: ItemVentaPayload[];
}

export interface CrearVentaResponse {
  message: string;
  venta: Venta;
}

export interface VentasPaginadasResponse {
  data: Venta[];
  current_page: number;
  last_page: number;
  total: number;
  per_page?: number;
  from?: number;
  to?: number;
}

export interface VentaFiltros {
  page?: number;
  busqueda?: string;
  desde?: string;
  hasta?: string;
}

export interface CarritoItem {
  producto: Producto;
  presentacion?: Presentacion;
  presentacion_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

