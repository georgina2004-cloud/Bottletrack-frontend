"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProductoForm } from "@/components/productos/ProductoForm";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { obtenerProductoPorId, actualizarProducto } from "@/lib/api";
import { Producto } from "@/types/producto";
import { Button } from "@/components/ui/Button";
import {
  ChevronRight,
  ArrowLeft,
  Edit3,
  PackageX,
} from "lucide-react";

interface EditarProductoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarProductoPage({ params }: EditarProductoPageProps) {
  const router = useRouter();
  const { token } = useAuth();

  // Desenvolver params en Next.js 15
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [producto, setProducto] = useState<Producto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar datos del producto al montar
  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!productId) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        // TODO: [Laravel Backend Integration]
        // Endpoint: GET /api/productos/{id}
        // Headers: Authorization: Bearer <token>, Accept: application/json
        const data = await obtenerProductoPorId(productId, token);
        if (isMounted) {
          setProducto(data);
        }
      } catch (error: unknown) {
        if (!isMounted) return;
        console.error("Error al cargar producto:", error);
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("No se pudo cargar la información del producto.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId, token]);

  const handleActualizarProducto = async (formData: FormData) => {
    await actualizarProducto(productId, formData, token);
    router.push("/productos?updated=1");
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
            <span className="font-semibold text-brand truncate max-w-[200px]">
              {producto ? `Editar: ${producto.nombre}` : `Producto #${productId}`}
            </span>
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
                  Editar Producto
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  <Edit3 className="w-3 h-3" />
                  ID #{productId}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Modifica los precios, existencias o datos generales del producto.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ESTADO: ERROR / 404 (PRODUCTO NO ENCONTRADO)                              */}
        {/* ========================================================================= */}
        {errorMessage && !isLoading && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <PackageX className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Producto no encontrado
              </h3>
              <p className="text-xs text-slate-500">{errorMessage}</p>
            </div>
            <Link href="/productos">
              <Button size="sm" className="text-xs mt-2">
                Volver al listado de productos
              </Button>
            </Link>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FORMULARIO DE EDICIÓN                                                     */}
        {/* ========================================================================= */}
        {(!errorMessage || isLoading) && (
          <ProductoForm
            initialData={producto}
            isEditing={true}
            onSubmit={handleActualizarProducto}
            isLoadingProduct={isLoading}
          />
        )}
      </div>
    </DashboardLayout>
  </ProtectedByRole>
  );
}

