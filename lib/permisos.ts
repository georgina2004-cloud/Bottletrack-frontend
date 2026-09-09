/**
 * Sistema centralizado de permisos y control de acceso basado en roles (RBAC)
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

export const PERMISOS_POR_ROL: Record<
  string,
  Record<ModuloSistema, NivelAcceso>
> = {
  Administrador: {
    dashboard: "completo",
    productos: "completo",
    categorias: "completo",
    proveedores: "completo",
    compras: "completo",
    ventas: "completo",
    reportes: "completo",
    usuarios: "completo",
    roles: "completo",
    configuracion: "completo",
    respaldos: "completo",
  },
  admin: {
    dashboard: "completo",
    productos: "completo",
    categorias: "completo",
    proveedores: "completo",
    compras: "completo",
    ventas: "completo",
    reportes: "completo",
    usuarios: "completo",
    roles: "completo",
    configuracion: "completo",
    respaldos: "completo",
  },
  "Gerente de Bodega": {
    dashboard: "completo",
    productos: "completo",
    categorias: "completo",
    proveedores: "completo",
    compras: "completo",
    ventas: "completo",
    reportes: "completo",
    usuarios: "completo",
    roles: "completo",
    configuracion: "completo",
    respaldos: "completo",
  },
  "Encargado de Ventas": {
    dashboard: "lectura",
    productos: "lectura",
    categorias: "ninguno",
    proveedores: "ninguno",
    compras: "ninguno",
    ventas: "completo",
    reportes: "ninguno",
    usuarios: "ninguno",
    roles: "ninguno",
    configuracion: "ninguno",
    respaldos: "ninguno",
  },
  Auditor: {
    dashboard: "lectura",
    productos: "lectura",
    categorias: "lectura",
    proveedores: "lectura",
    compras: "lectura",
    ventas: "lectura",
    reportes: "completo",
    usuarios: "ninguno",
    roles: "ninguno",
    configuracion: "ninguno",
    respaldos: "ninguno",
  },
};

/**
 * Determina si un rol tiene acceso (lectura o completo) a un módulo del sistema.
 * @param rol Nombre del rol tal como lo devuelve el backend Laravel
 * @param modulo Identificador del módulo a consultar
 */
export function tieneAcceso(
  rol: string | null | undefined,
  modulo: ModuloSistema
): boolean {
  if (!rol || !PERMISOS_POR_ROL[rol]) {
    return false;
  }
  const nivel = PERMISOS_POR_ROL[rol][modulo];
  return nivel === "completo" || nivel === "lectura";
}

/**
 * Determina si un rol tiene permisos de escritura/modificación ('completo') en un módulo.
 * @param rol Nombre del rol tal como lo devuelve el backend Laravel
 * @param modulo Identificador del módulo a consultar
 */
export function puedeEditar(
  rol: string | null | undefined,
  modulo: ModuloSistema
): boolean {
  if (!rol || !PERMISOS_POR_ROL[rol]) {
    return false;
  }
  const nivel = PERMISOS_POR_ROL[rol][modulo];
  return nivel === "completo";
}

/**
 * Retorna el nivel de acceso explícito ('completo' | 'lectura' | 'ninguno') de un rol.
 */
export function obtenerNivelAcceso(
  rol: string | null | undefined,
  modulo: ModuloSistema
): NivelAcceso {
  if (!rol || !PERMISOS_POR_ROL[rol]) {
    return "ninguno";
  }
  return PERMISOS_POR_ROL[rol][modulo] || "ninguno";
}
