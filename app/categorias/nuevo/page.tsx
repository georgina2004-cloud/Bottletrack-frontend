"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CategoriaForm } from "@/components/categorias/CategoriaForm";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { crearCategoria } from "@/lib/api";
import { CategoriaPayload } from "@/types/producto";
import { ChevronRight, ArrowLeft, PlusCircle } from "lucide-react";

export default function NuevaCategoriaPage() {
  const router = useRouter();
  const { token } = useAuth();

  const handleCrearCategoria = async (payload: CategoriaPayload) => {
    // TODO: [Laravel Backend Integration]
    // Endpoint: POST /api/categorias
    // Headers: Authorization: Bearer <token>, Content-Type: application/json
    await crearCategoria(payload, token);
    router.push("/categorias?created=1");
  };

  return (
    <ProtectedByRole modulo="categorias" requiereEscritura={true}>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
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
                href="/categorias"
                className="hover:text-slate-900 transition-colors"
              >
                Categorías
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-brand">Nueva Categoría</span>
            </nav>

            {/* Header Title with Back button */}
            <div className="flex items-center gap-3 pt-1">
              <Link
                href="/categorias"
                className="p-2 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:text-brand hover:border-brand/40 transition-all shadow-2xs cursor-pointer"
                title="Volver a categorías"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                    Registrar Nueva Categoría
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D17B00]/10 text-[#D17B00]">
                    <PlusCircle className="w-3 h-3" />
                    Nuevo
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Crea una nueva clasificación para organizar botellas y destilados en el inventario.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FORMULARIO DE CATEGORÍA                                                   */}
          {/* ========================================================================= */}
          <CategoriaForm
            isEditing={false}
            onSubmit={handleCrearCategoria}
          />
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
