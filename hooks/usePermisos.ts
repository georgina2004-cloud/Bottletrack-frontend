"use client";

import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ModuloSistema,
  NivelAcceso,
  tieneAcceso as tieneAccesoHelper,
  puedeEditar as puedeEditarHelper,
  obtenerNivelAcceso,
} from "@/lib/permisos";

/**
 * Hook para consultar permisos del usuario autenticado en sesión actual.
 * Provee funciones precargadas con el rol actual para simplificar la verificación en componentes.
 *
 * Ejemplo de uso:
 * const { tieneAcceso, puedeEditar } = usePermisos();
 * if (tieneAcceso('productos')) { ... }
 */
export function usePermisos() {
  const { user, isLoading } = useAuth();
  const rol = user?.role;

  const tieneAcceso = useCallback(
    (modulo: ModuloSistema): boolean => {
      return tieneAccesoHelper(rol, modulo);
    },
    [rol]
  );

  const puedeEditar = useCallback(
    (modulo: ModuloSistema): boolean => {
      return puedeEditarHelper(rol, modulo);
    },
    [rol]
  );

  const nivelAcceso = useCallback(
    (modulo: ModuloSistema): NivelAcceso => {
      return obtenerNivelAcceso(rol, modulo);
    },
    [rol]
  );

  return {
    rol,
    isLoadingAuth: isLoading,
    tieneAcceso,
    puedeEditar,
    nivelAcceso,
  };
}
