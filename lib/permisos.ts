/**
 * Sistema centralizado de permisos y control de acceso basado en RBAC dinámico
 * para BottleTrack Frontend.
 */

export type NivelAcceso = "completo" | "lectura" | "ninguno";

export type ModuloSistema =
  | "dashboard"
  | "productos"
  | "categorias"
  | "proveedores"
  | "compras"
  | "ventas"
  | "reportes"
  | "usuarios"
  | "roles"
  | "configuracion"
  | "respaldos";

/**
 * Mapa estático conservado únicamente como REFERENCIA histórica.
 * La fuente de verdad oficial ahora es la base de datos a través de GET /api/mis-permisos.
 */
/*
export const PERMISOS_POR_ROL: Record<
  string,
  Record<ModuloSistema, NivelAcceso>
> = {
  Administrador: { ... },
  "Gerente de Bodega": { ... },
  "Encargado de Ventas": { ... },
  Auditor: { ... },
};
*/

/**
 * Determina si el usuario tiene acceso (al menos un permiso del módulo) a un módulo del sistema.
 * @param permisos Lista de claves de permisos del usuario autenticado (ej: ['productos.ver', 'ventas.crear'])
 * @param modulo Identificador del módulo a consultar
 */
export function tieneAcceso(
  permisos: string[] | null | undefined,
  modulo: ModuloSistema
): boolean {
  if (!permisos || !Array.isArray(permisos) || permisos.length === 0) {
    return false;
  }
  const prefix = `${modulo}.`;
  return permisos.some((p) => p.startsWith(prefix));
}

/**
 * Determina si el usuario tiene permisos de edición/escritura en un módulo.
 * @param permisos Lista de claves de permisos del usuario autenticado
 * @param modulo Identificador del módulo a consultar
 */
export function puedeEditar(
  permisos: string[] | null | undefined,
  modulo: ModuloSistema
): boolean {
  if (!permisos || !Array.isArray(permisos) || permisos.length === 0) {
    return false;
  }

  const clavesEscritura = [
    `${modulo}.crear`,
    `${modulo}.editar`,
    `${modulo}.eliminar`,
    `${modulo}.anular`,
    `${modulo}.exportar`,
    `${modulo}.generar`,
    `${modulo}.restaurar`,
  ];

  return permisos.some((p) => clavesEscritura.includes(p));
}

/**
 * Determina si el usuario tiene una clave de permiso específica.
 * @param permisos Lista de claves de permisos del usuario autenticado
 * @param clave Clave exacta del permiso (ej: 'ventas.ver_todas', 'respaldos.generar')
 */
export function tienePermiso(
  permisos: string[] | null | undefined,
  clave: string
): boolean {
  if (!permisos || !Array.isArray(permisos) || permisos.length === 0) {
    return false;
  }
  return permisos.includes(clave);
}

/**
 * Retorna el nivel de acceso ('completo' | 'lectura' | 'ninguno') de un usuario en un módulo.
 */
export function obtenerNivelAcceso(
  permisos: string[] | null | undefined,
  modulo: ModuloSistema
): NivelAcceso {
  if (puedeEditar(permisos, modulo)) {
    return "completo";
  }
  if (tieneAcceso(permisos, modulo)) {
    return "lectura";
  }
  return "ninguno";
}

