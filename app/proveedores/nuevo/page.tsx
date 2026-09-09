"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProveedorForm } from "@/components/proveedores/ProveedorForm";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { crearProveedor } from "@/lib/api";
import { ProveedorPayload } from "@/types/proveedor";
import { ChevronRight, ArrowLeft, PlusCircle } from "lucide-react";

export default function NuevoProveedorPage() {
  const router = useRouter();
  const { token } = useAuth();

  const handleCrearProveedor = async (payload: ProveedorPayload) => {
    // TODO: [Laravel Backend Integration]
    // Endpoint: POST /api/proveedores
    // Headers: Authorization: Bearer <token>, Content-Type: application/json
    await crearProveedor(payload, token);
    router.push("/proveedores?created=1");
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
              <span className="font-semibold text-brand">Nuevo Proveedor</span>
            </nav>

            {/* Header Title with Back button */}
            <div className="flex items-center gap-3 pt-1">
              <Link
                href="/proveedores"
                className="p-2 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:text-brand hover:border-brand/40 transition-all shadow-2xs cursor-pointer"
                title="Volver a proveedores"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                    Registrar Nuevo Proveedor
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D17B00]/10 text-[#D17B00]">
                    <PlusCircle className="w-3 h-3" />
                    Nuevo
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingresa los datos fiscales y de contacto de la casa comercial o distribuidor.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FORMULARIO DE PROVEEDOR                                                   */}
          {/* ========================================================================= */}
          <ProveedorForm
            isEditing={false}
            onSubmit={handleCrearProveedor}
          />
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
