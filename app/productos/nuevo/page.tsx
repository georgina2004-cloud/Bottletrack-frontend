"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProductoForm } from "@/components/productos/ProductoForm";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { crearProducto } from "@/lib/api";
import { ChevronRight, ArrowLeft, PlusCircle } from "lucide-react";

export default function NuevoProductoPage() {
  const router = useRouter();
  const { token } = useAuth();

  const handleCrearProducto = async (formData: FormData) => {
    await crearProducto(formData, token);
    router.push("/productos?created=1");
  };

  return (
    <ProtectedByRole modulo="productos" requiereEscritura={true}>
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
              href="/productos"
              className="hover:text-slate-900 transition-colors"
            >
              Productos
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-brand">Nuevo Producto</span>
          </nav>

          {/* Header Title with Back button */}
          <div className="flex items-center gap-3 pt-1">
            <Link
              href="/productos"
              className="p-2 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:text-brand hover:border-brand/40 transition-all shadow-2xs cursor-pointer"
              title="Volver al catálogo"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                  Registrar Nuevo Producto
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                  <PlusCircle className="w-3 h-3" />
                  Nuevo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingresa los datos para dar de alta una nueva bebida o licor en el inventario.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FORMULARIO DE PRODUCTO                                                    */}
        {/* ========================================================================= */}
        <ProductoForm isEditing={false} onSubmit={handleCrearProducto} />
      </div>
    </DashboardLayout>
  </ProtectedByRole>
  );
}

