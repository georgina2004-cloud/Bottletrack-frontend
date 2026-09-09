/**
 * Contrato de tipos para el módulo de Proveedores de BottleTrack
 */

export interface Proveedor {
  id: number;
  ruc: string;
  razon_social: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProveedorPayload {
  ruc: string;
  razon_social: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo?: boolean;
}

export interface ProveedoresPaginadosResponse {
  data: Proveedor[];
  current_page: number;
  last_page: number;
  total: number;
  per_page?: number;
  from?: number;
  to?: number;
}

export interface ProveedorFiltros {
  busqueda?: string;
  page?: number;
}
