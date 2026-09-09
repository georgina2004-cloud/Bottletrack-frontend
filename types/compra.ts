/**
 * Contrato de tipos e interfaces para el módulo de Compras de BottleTrack.
 */

export interface DetalleCompraProducto {
  id?: number;
  nombre: string;
  codigo_barras?: string | null;
  marca?: string | null;
  presentacion_ml?: string | null;
}

export interface DetalleCompra {
  id?: number;
  compra_id?: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: string | number;
  subtotal: string | number;
  producto?: DetalleCompraProducto;
  created_at?: string;
  updated_at?: string;
}

export interface CompraProveedor {
  id: number;
  razon_social: string;
  ruc?: string;
  telefono?: string | null;
  email?: string | null;
}

export interface CompraUsuario {
  id?: number;
  name: string;
  email?: string;
}

export interface Compra {
  id: number;
  numero_factura_proveedor: string | null;
  fecha: string;
  total: string | number;
  proveedor_id?: number;
  proveedor?: CompraProveedor;
  usuario?: CompraUsuario;
  user_id?: number;
  detalles?: DetalleCompra[];
  created_at?: string;
  updated_at?: string;
}

export interface ItemCompraPayload {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

export interface CrearCompraPayload {
  proveedor_id: number;
  numero_factura_proveedor?: string;
  productos: ItemCompraPayload[];
}

export interface CrearCompraResponse {
  message: string;
  compra: Compra;
}

export interface ComprasPaginadasResponse {
  data: Compra[];
  current_page: number;
  last_page: number;
  total: number;
  per_page?: number;
  from?: number;
  to?: number;
}

export interface CompraFiltros {
  page?: number;
  desde?: string;
  hasta?: string;
  busqueda?: string;
}

export interface LineaCompraForm {
  id: string;
  producto_id: number | "";
  producto_nombre: string;
  cantidad: number | "";
  precio_unitario: number | "";
  subtotal: number;
}
