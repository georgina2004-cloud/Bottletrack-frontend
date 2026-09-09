"use client";

import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ModuloSistema,
  NivelAcceso,
  tieneAcceso as tieneAccesoHelper,
  puedeEditar as puedeEditarHelper,
  obtenerNivelAcceso,
  tienePermiso as tienePermisoHelper,
} from "@/lib/permisos";

/**
 * Hook para consultar permisos del usuario autenticado en sesión actual.
 * Provee funciones dinámicas conectadas al array de permisos reales del usuario.
 *
 * Ejemplo de uso:
 * const { tieneAcceso, puedeEditar, tienePermiso } = usePermisos();
 * if (tieneAcceso('productos')) { ... }
 * if (tienePermiso('ventas.ver_todas')) { ... }
 */
export function usePermisos() {
  const { user, permisos, isLoading } = useAuth();
  const rol = user?.role;

  const tieneAcceso = useCallback(
    (modulo: ModuloSistema): boolean => {
      return tieneAccesoHelper(permisos, modulo);
    },
    [permisos]
  );

  const puedeEditar = useCallback(
    (modulo: ModuloSistema): boolean => {
      return puedeEditarHelper(permisos, modulo);
    },
    [permisos]
  );

  const tienePermiso = useCallback(
    (clave: string): boolean => {
      return tienePermisoHelper(permisos, clave);
    },
    [permisos]
  );

  const nivelAcceso = useCallback(
    (modulo: ModuloSistema): NivelAcceso => {
      return obtenerNivelAcceso(permisos, modulo);
    },
    [permisos]
  );

  return {
    rol,
    permisos,
    isLoadingAuth: isLoading,
    tieneAcceso,
    puedeEditar,
    tienePermiso,
    nivelAcceso,
  };
}

