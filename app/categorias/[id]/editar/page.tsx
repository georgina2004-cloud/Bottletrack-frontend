"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CategoriaForm } from "@/components/categorias/CategoriaForm";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { obtenerCategoriaPorId, actualizarCategoria } from "@/lib/api";
import { Categoria, CategoriaPayload } from "@/types/producto";
import { Button } from "@/components/ui/Button";
import {
  ChevronRight,
  ArrowLeft,
  Edit3,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface EditarCategoriaPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarCategoriaPage({ params }: EditarCategoriaPageProps) {
  const router = useRouter();
  const { token } = useAuth();

  // Desenvolver params asíncrono en Next.js 15
  const resolvedParams = use(params);
  const categoriaId = resolvedParams.id;

  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar datos de la categoría al montar
  useEffect(() => {
    let isMounted = true;

    async function loadCategoria() {
      if (!categoriaId) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        // TODO: [Laravel Backend Integration]
        // Endpoint: GET /api/categorias/{id}
        // Headers: Authorization: Bearer <token>, Accept: application/json
        const data = await obtenerCategoriaPorId(categoriaId, token);
        if (isMounted) {
          setCategoria(data);
        }
      } catch (error: unknown) {
        if (!isMounted) return;
        console.error("Error al cargar categoría:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo obtener la información de la categoría."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCategoria();

    return () => {
      isMounted = false;
    };
  }, [categoriaId, token]);

  const handleActualizarCategoria = async (payload: CategoriaPayload) => {
    if (!categoriaId) return;

    // TODO: [Laravel Backend Integration]
    // Endpoint: PUT /api/categorias/{id}
    // Headers: Authorization: Bearer <token>, Content-Type: application/json
    await actualizarCategoria(categoriaId, payload, token);
    router.push("/categorias?updated=1");
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
              <span className="font-semibold text-brand truncate max-w-xs">
                {isLoading
                  ? "Cargando..."
                  : categoria
                  ? `Editar: ${categoria.nombre}`
                  : "Editar Categoría"}
              </span>
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
                    Editar Categoría
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-[#D17B00] border border-amber-200/60">
                    <Edit3 className="w-3 h-3" />
                    Edición
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modifica los datos de la categoría de productos seleccionada.
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
                Cargando información de la categoría...
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
                  No se pudo cargar la categoría
                </h3>
                <p className="text-xs text-slate-500">{errorMessage}</p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link href="/categorias">
                  <Button variant="outline" size="sm" className="text-xs">
                    Volver a Categorías
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
          {!isLoading && categoria && (
            <CategoriaForm
              initialData={categoria}
              isEditing={true}
              onSubmit={handleActualizarCategoria}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
