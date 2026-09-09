"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProductoForm } from "@/components/productos/ProductoForm";
import { ProductoMasivoForm } from "@/components/productos/ProductoMasivoForm";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { crearProducto } from "@/lib/api";
import {
  ChevronRight,
  ArrowLeft,
  PlusCircle,
  Package,
  Layers,
} from "lucide-react";

function NuevoProductoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const initialTab = searchParams.get("mode") === "masivo" ? "masivo" : "individual";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const handleCrearProducto = async (formData: FormData) => {
    await crearProducto(formData, token);
    router.push("/productos?created=1");
  };

  const isMasivo = activeTab === "masivo";

  return (
    <ProtectedByRole modulo="productos" requiereEscritura={true}>
      <DashboardLayout>
        <div className={`mx-auto space-y-6 ${isMasivo ? "max-w-7xl" : "max-w-4xl"}`}>
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
                href="/productos"
                className="hover:text-slate-900 transition-colors"
              >
                Productos
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-brand">
                {isMasivo ? "Agregar Varios Productos" : "Nuevo Producto"}
              </span>
            </nav>

            {/* Header Title with Back button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <Link
                  href="/productos"
                  className="p-2 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:text-brand hover:border-brand/40 transition-all shadow-2xs cursor-pointer shrink-0"
                  title="Volver al catálogo"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                      {isMasivo
                        ? "Agregar Varios Productos"
                        : "Registrar Nuevo Producto"}
                    </h1>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                      {isMasivo ? (
                        <>
                          <Layers className="w-3 h-3" />
                          Carga Masiva
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3 h-3" />
                          Individual
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isMasivo
                      ? "Registra múltiples licores y bebidas en una sola operación usando la tabla dinámica."
                      : "Ingresa los datos para dar de alta una nueva bebida o licor en el inventario."}
                  </p>
                </div>
              </div>

              {/* Selector de Modo (Tabs) en Header */}
              <div className="flex items-center">
                <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("individual")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      !isMasivo
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Un producto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("masivo")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isMasivo
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Agregar Varios</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONTENIDO DEL FORMULARIO SEGÚN MODO ACTIVO                                 */}
          {/* ========================================================================= */}
          {!isMasivo ? (
            <ProductoForm isEditing={false} onSubmit={handleCrearProducto} />
          ) : (
            <ProductoMasivoForm onSuccess={() => router.push("/productos?created=1")} />
          )}
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}

export default function NuevoProductoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NuevoProductoContent />
    </Suspense>
  );
}

