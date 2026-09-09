import { Role } from "./role";

/**
 * Contrato del modelo Usuario de BottleTrack
 * Endpoint: GET /api/usuarios
 */
export interface Usuario {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role: Role;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload para creación y actualización de usuarios
 * POST /api/usuarios, PUT /api/usuarios/{id}
 */
export interface UsuarioPayload {
  name: string;
  email: string;
  password?: string;
  role_id: number;
  estado?: boolean;
}

/**
 * Respuesta paginada estándar de Laravel para usuarios
 */
export interface UsuariosPaginadosResponse {
  data: Usuario[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

/**
 * Filtros para la consulta de usuarios
 */
export interface UsuarioFiltros {
  busqueda?: string;
  page?: number;
}
