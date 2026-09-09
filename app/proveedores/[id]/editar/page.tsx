"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProveedorForm } from "@/components/proveedores/ProveedorForm";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { obtenerProveedorPorId, actualizarProveedor } from "@/lib/api";
import { Proveedor, ProveedorPayload } from "@/types/proveedor";
import { Button } from "@/components/ui/Button";
import {
  ChevronRight,
  ArrowLeft,
  Edit3,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface EditarProveedorPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarProveedorPage({ params }: EditarProveedorPageProps) {
  const router = useRouter();
  const { token } = useAuth();

  // Desenvolver params asíncrono en Next.js 15
  const resolvedParams = use(params);
  const proveedorId = resolvedParams.id;

  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar datos del proveedor al montar
  useEffect(() => {
    let isMounted = true;

    async function loadProveedor() {
      if (!proveedorId) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        // TODO: [Laravel Backend Integration]
        // Endpoint: GET /api/proveedores/{id}
        // Headers: Authorization: Bearer <token>, Accept: application/json
        const data = await obtenerProveedorPorId(proveedorId, token);
        if (isMounted) {
          setProveedor(data);
        }
      } catch (error: unknown) {
        if (!isMounted) return;
        console.error("Error al cargar proveedor:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo obtener la información del proveedor."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProveedor();

    return () => {
      isMounted = false;
    };
  }, [proveedorId, token]);

  const handleActualizarProveedor = async (payload: ProveedorPayload) => {
    if (!proveedorId) return;

    // TODO: [Laravel Backend Integration]
    // Endpoint: PUT /api/proveedores/{id}
    // Headers: Authorization: Bearer <token>, Content-Type: application/json
    await actualizarProveedor(proveedorId, payload, token);
    router.push("/proveedores?updated=1");
  };

  return (
    <ProtectedByRole modulo="proveedores" requiereEscritura={true}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* ========================================================================= */}
          {/* BREADCRUMBS & ENCABEZADO                                                  */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            {/* Breadcrumbs */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-slate-500"
            >
              <Link
                href="/dashboard"
                className="hover:text-slate-900 transition-colors"
              >
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link
                href="/proveedores"
                className="hover:text-slate-900 transition-colors"
              >
                Proveedores
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-brand truncate max-w-xs">
                {isLoading
                  ? "Cargando..."
                  : proveedor
                  ? `Editar: ${proveedor.razon_social}`
                  : "Editar Proveedor"}
              </span>
            </nav>

            {/* Header Title with Back button */}
            <div className="flex items-center gap-3 pt-1">
              <Link
                href="/proveedores"
                className="p-2 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:text-[#D17B00] hover:border-[#D17B00]/40 transition-all shadow-2xs cursor-pointer"
                title="Volver a proveedores"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                    Editar Proveedor
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-[#D17B00] border border-amber-200/60">
                    <Edit3 className="w-3 h-3" />
                    Edición
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Actualiza la información comercial, teléfonos de contacto o el estado de activación.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ESTADO: CARGANDO                                                          */}
          {/* ========================================================================= */}
          {isLoading && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#D17B00] mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Cargando información del proveedor...
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ESTADO: ERROR                                                             */}
          {/* ========================================================================= */}
          {!isLoading && errorMessage && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h3 className="text-sm font-bold text-slate-800">
                  No se pudo cargar el proveedor
                </h3>
                <p className="text-xs text-slate-500">{errorMessage}</p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link href="/proveedores">
                  <Button variant="outline" size="sm" className="text-xs">
                    Volver a Proveedores
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-xs"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMULARIO DE EDICIÓN                                                     */}
          {/* ========================================================================= */}
          {!isLoading && proveedor && (
            <ProveedorForm
              initialData={proveedor}
              isEditing={true}
              onSubmit={handleActualizarProveedor}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
