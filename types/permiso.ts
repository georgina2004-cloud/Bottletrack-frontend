/**
 * Tipos y contratos para el módulo de Roles y Permisos (RBAC)
 * BottleTrack System
 */

export interface Permiso {
  id: number;
  clave: string; // ej. "productos.crear", "ventas.anular"
  nombre?: string;
  descripcion?: string | null;
  modulo?: string; // prefijo extraído de 'clave' (ej. "productos")
}

export interface PermisoModuloGrupo {
  modulo: string;
  nombreModulo: string;
  icono?: string;
  permisos: Permiso[];
}

export interface RolConPermisos {
  id: number;
  nombre: string;
  descripcion?: string | null;
  permisos: Permiso[];
  permission_ids?: number[];
}

export interface SyncPermisosRolPayload {
  permission_ids: number[];
}

export interface MatrizPermisosResponse {
  roles: RolConPermisos[];
  permisos: Permiso[];
}
