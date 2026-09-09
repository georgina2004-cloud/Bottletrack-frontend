"use client";

import React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { ProductoMasivoForm } from "@/components/productos/ProductoMasivoForm";
import { ChevronRight, ArrowLeft, Layers } from "lucide-react";

export default function CargaMasivaProductosPage() {
  return (
    <ProtectedByRole modulo="productos" requiereEscritura={true}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
          {/* ========================================================================= */}
          {/* BREADCRUMB & ENCABEZADO                                                   */}
          {/* ========================================================================= */}
          <div className="space-y-2">
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
              <span className="font-semibold text-brand">Carga Masiva</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
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
                      Agregar Varios Productos
                    </h1>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--primary-brand)]/10 text-[var(--primary-brand)]">
                      <Layers className="w-3 h-3" />
                      Carga Masiva
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Registra múltiples licores y bebidas en una sola operación usando la tabla dinámica.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <ProductoMasivoForm />
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
