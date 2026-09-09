"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import { ModuloSistema } from "@/lib/permisos";
import { Loader2 } from "lucide-react";

interface ProtectedByRoleProps {
  modulo: ModuloSistema;
  /**
   * Si es true, requiere permiso de escritura/completo ('completo').
   * Si es false, basta con permiso de lectura o completo ('lectura' | 'completo').
   */
  requiereEscritura?: boolean;
  /**
   * Ruta personalizada de redirección si el usuario no tiene permisos suficientes.
   * Por defecto:
   * - Si requiereEscritura falla: redirige a /productos?denied=1
   * - Si tieneAcceso falla: redirige a /dashboard?unauthorized=1
   */
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * Componente wrapper para proteger páginas y rutas según el rol y módulo.
 */
export function ProtectedByRole({
  modulo,
  requiereEscritura = false,
  redirectTo,
  children,
}: ProtectedByRoleProps) {
  const router = useRouter();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { tieneAcceso, puedeEditar } = usePermisos();

  // Cálculo directo de autorización durante el ciclo de renderizado
  const isAuthorized = requiereEscritura
    ? puedeEditar(modulo)
    : tieneAcceso(modulo);

  useEffect(() => {
    // Esperar a que termine la verificación inicial de la sesión
    if (isLoadingAuth) return;

    // Si no hay usuario autenticado, redirigir al login
    if (!user) {
      router.replace("/login");
      return;
    }

    // Si no tiene los permisos requeridos, redirigir a la ruta correspondiente
    if (!isAuthorized) {
      const destination = requiereEscritura
        ? redirectTo || "/productos?denied=1"
        : redirectTo || "/dashboard?unauthorized=1";
      router.replace(destination);
    }
  }, [isLoadingAuth, user, isAuthorized, requiereEscritura, redirectTo, router]);

  // Pantalla de carga mientras se valida la sesión y credenciales
  if (isLoadingAuth) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#D17B00]" />
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Verificando permisos de acceso...
          </p>
        </div>
      </div>
    );
  }

  // Si la verificación falló y se está ejecutando la redirección, no renderizar nada
  if (!user || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
