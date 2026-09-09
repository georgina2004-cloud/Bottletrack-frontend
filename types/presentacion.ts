/**
 * Tipos e interfaces de datos para el módulo de Presentaciones de Venta de BottleTrack
 */

export interface Presentacion {
  id: number;
  producto_id: number;
  nombre: string;
  unidades_equivalentes: number;
  precio_venta: string | number;
  es_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrearPresentacionPayload {
  nombre: string;
  unidades_equivalentes: number;
  precio_venta: number;
  es_default?: boolean;
}

export interface ActualizarPresentacionPayload {
  nombre?: string;
  unidades_equivalentes?: number;
  precio_venta?: number;
  es_default?: boolean;
}
