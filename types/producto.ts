/**
 * Tipos e interfaces de datos para el módulo de Productos de BottleTrack
 */

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  productos_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaPayload {
  nombre: string;
  descripcion?: string | null;
}

export interface CategoriasPaginadasResponse {
  data: Categoria[];
  current_page: number;
  last_page: number;
  total: number;
  per_page?: number;
  from?: number;
  to?: number;
}

export interface CategoriaFiltros {
  busqueda?: string;
  page?: number;
  per_page?: number;
}

import { Presentacion } from "./presentacion";

export interface Producto {
  id: number;
  codigo_barras: string | null;
  nombre: string;
  marca: string | null;
  categoria_id: number;
  categoria: Categoria;
  precio_compra: string; // Decimal recibido como string desde Laravel (ej: "150.00")
  precio_venta: string;  // Decimal recibido como string desde Laravel (ej: "220.00")
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number | null;
  presentacion_ml: string | null;
  ubicacion: string | null;
  imagen_url: string | null; // URL absoluta de la imagen o null
  activo: boolean;
  presentaciones?: Presentacion[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductosPaginadosResponse {
  data: Producto[];
  current_page: number;
  last_page: number;
  total: number;
  per_page?: number;
  from?: number;
  to?: number;
}

export interface ProductoFiltros {
  busqueda?: string;
  categoria_id?: number | string;
  page?: number;
}

export interface ProductoPayload {
  codigo_barras?: string | null;
  nombre: string;
  marca?: string | null;
  categoria_id: number;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo?: number | null;
  presentacion_ml?: string | null;
  ubicacion?: string | null;
}

export interface ApiValidationErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
