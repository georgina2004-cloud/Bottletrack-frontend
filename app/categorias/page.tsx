"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import { obtenerCategorias, eliminarCategoria } from "@/lib/api";
import { Categoria } from "@/types/producto";
import { Button } from "@/components/ui/Button";
import { DetailDrawer } from "@/components/ui/DetailDrawer";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  FileText,
  Hash,
} from "lucide-react";

function CategoriasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { puedeEditar } = usePermisos();

  const tienePermisoEscritura = puedeEditar("categorias");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    lastPage: number;
    total: number;
  }>({ currentPage: 1, lastPage: 1, total: 0 });
  const [page, setPage] = useState<number>(1);
  const [busqueda, setBusqueda] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Toggle de vista: inicia en cuadrícula por defecto
  const [vista, setVista] = useState<ViewMode>("cuadricula");

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dismissedFlash, setDismissedFlash] = useState<boolean>(false);

  // Drawer state
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null);

  // Modal de eliminación
  const [categoriaParaEliminar, setCategoriaParaEliminar] = useState<Categoria | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const isCreated = searchParams.get("created") === "1";
  const isUpdated = searchParams.get("updated") === "1";
  const isDenied = searchParams.get("denied") === "1";

  const effectiveSuccessMessage =
    successMessage ||
    (!dismissedFlash
      ? isCreated
        ? "¡Categoría registrada exitosamente!"
        : isUpdated
        ? "¡Categoría actualizada correctamente!"
        : null
      : null);

  const effectiveErrorMessage =
    errorMessage || (!dismissedFlash && isDenied ? "No tienes permiso para esta acción." : null);

  const handleDismissSuccess = () => {
    setSuccessMessage(null);
    setDismissedFlash(true);
    if (isCreated || isUpdated) router.replace("/categorias");
  };

  const handleDismissError = () => {
    setErrorMessage(null);
    setDismissedFlash(true);
    if (isDenied) router.replace("/categorias");
  };

  const fetchCategorias = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorCarga(null);
      try {
        const res = await obtenerCategorias(
          {
            busqueda: busqueda.trim() || undefined,
            page,
          },
          token
        );
        setCategorias(res.data || []);
        setPagination({
          currentPage: res.current_page || 1,
          lastPage: res.last_page || 1,
          total: res.total ?? (res.data ? res.data.length : 0),
        });
      } catch (err: unknown) {
        console.error("Error al cargar categorías:", err);
        setErrorCarga(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las categorías del servidor."
        );
        setCategorias([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [busqueda, page, token]
  );

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  const handleManualRefresh = () => {
    fetchCategorias(true);
  };

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setPage(1);
  };

  const handleLimpiarBusqueda = () => {
    setBusqueda("");
    setPage(1);
  };

  const tieneColumnaConteo = useMemo(
    () => categorias.some((c) => typeof c.productos_count === "number"),
    [categorias]
  );

  const handleConfirmarEliminar = async () => {
    if (!categoriaParaEliminar) return;
    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await eliminarCategoria(categoriaParaEliminar.id, token);
      setSuccessMessage(
        `La categoría "${categoriaParaEliminar.nombre}" ha sido eliminada correctamente.`
      );
      if (categoriaSeleccionada?.id === categoriaParaEliminar.id) {
        setCategoriaSeleccionada(null);
      }
      setCategoriaParaEliminar(null);
      fetchCategorias();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "No se pudo eliminar la categoría."
      );
      setCategoriaParaEliminar(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedByRole modulo="categorias">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Encabezado */}
          <div>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-slate-500 mb-2"
            >
              <Link
                href="/dashboard"
                className="hover:text-slate-900 transition-colors"
              >
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-brand">Categorías</span>
            </nav>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                    Categorías
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Haz clic en una categoría para ver sus detalles y acciones.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isLoading || isRefreshing}
                  className="text-xs gap-1.5 shadow-2xs"
                  title="Recargar categorías"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-slate-500 ${
                      isRefreshing ? "animate-spin text-brand" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
                {tienePermisoEscritura && (
                  <Link href="/categorias/nuevo">
                    <Button
                      size="sm"
                      className="text-xs gap-1.5 shadow-sm shadow-brand/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nueva Categoría</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Banners */}
          {effectiveSuccessMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="font-medium">{effectiveSuccessMessage}</p>
              </div>
              <button
                type="button"
                onClick={handleDismissSuccess}
                className="text-emerald-500 hover:text-emerald-800 p-1 rounded-lg hover:bg-emerald-100/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {effectiveErrorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <p className="font-medium">{effectiveErrorMessage}</p>
              </div>
              <button
                type="button"
                onClick={handleDismissError}
                className="text-rose-400 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Buscador y Toggle */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={busqueda}
                onChange={handleBusquedaChange}
                placeholder="Buscar por nombre o descripción de categoría..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={handleLimpiarBusqueda}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Toggle de Vista Tabla / Cuadrícula */}
            <ViewToggle vista={vista} onCambiarVista={setVista} />

            {busqueda && (
              <span className="text-xs text-slate-500 shrink-0 font-medium">
                {pagination.total} resultado{pagination.total === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {/* Vistas: Tabla o Cuadrícula */}
          {vista === "tabla" ? (
            /* ═══════════════ VISTA TABLA ═══════════════ */
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4 sm:px-6">Nombre</th>
                        <th className="py-3.5 px-4">Descripción</th>
                        {tieneColumnaConteo && (
                          <th className="py-3.5 px-4 text-center">Productos</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, idx) => (
                          <tr key={idx} className="animate-pulse">
                            <td className="py-4 px-4 sm:px-6">
                              <div className="h-4 bg-slate-200 rounded w-36" />
                            </td>
                            <td className="py-4 px-4">
                              <div className="h-3.5 bg-slate-100 rounded w-56" />
                            </td>
                            {tieneColumnaConteo && (
                              <td className="py-4 px-4 text-center">
                                <div className="h-4 bg-slate-100 rounded-full w-10 mx-auto" />
                              </td>
                            )}
                          </tr>
                        ))
                      ) : errorCarga ? (
                        <tr>
                          <td
                            colSpan={tieneColumnaConteo ? 3 : 2}
                            className="py-12 text-center"
                          >
                            <div className="max-w-xs mx-auto flex flex-col items-center">
                              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-2.5">
                                <AlertTriangle className="w-5 h-5" />
                              </div>
                              <p className="text-xs font-bold text-slate-800">
                                Error al cargar categorías
                              </p>
                              <p className="text-xs text-slate-500 mt-1 mb-3">
                                {errorCarga}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleManualRefresh}
                                className="text-xs"
                              >
                                Intentar de nuevo
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : categorias.length === 0 ? (
                        <tr>
                          <td
                            colSpan={tieneColumnaConteo ? 3 : 2}
                            className="py-14 text-center"
                          >
                            <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                                <Layers className="w-6 h-6" />
                              </div>
                              <h3 className="text-sm font-bold text-slate-800">
                                No se encontraron categorías
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
                                {busqueda
                                  ? "No hay resultados para la búsqueda ingresada."
                                  : "Aún no has registrado categorías en el catálogo."}
                              </p>
                              {busqueda ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleLimpiarBusqueda}
                                  className="text-xs"
                                >
                                  Limpiar búsqueda
                                </Button>
                              ) : tienePermisoEscritura ? (
                                <Link href="/categorias/nuevo">
                                  <Button
                                    size="sm"
                                    className="text-xs gap-1.5 shadow-sm shadow-brand/20"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Registrar primera categoría</span>
                                  </Button>
                                </Link>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        categorias.map((cat) => {
                          const isSelected =
                            categoriaSeleccionada?.id === cat.id;
                          return (
                            <tr
                              key={cat.id}
                              className={`hover:bg-slate-50/80 transition-colors group ${
                                isSelected ? "bg-brand/5" : ""
                              }`}
                            >
                              {/* Nombre — clickeable */}
                              <td className="py-3.5 px-4 sm:px-6">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCategoriaSeleccionada(
                                      isSelected ? null : cat
                                    )
                                  }
                                  className="flex items-center gap-2.5 text-left cursor-pointer w-full"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-xs shrink-0">
                                    <Layers className="w-4 h-4" />
                                  </div>
                                  <span
                                    className={`font-semibold transition-colors ${
                                      isSelected
                                        ? "text-brand"
                                        : "text-slate-900 group-hover:text-brand"
                                    }`}
                                  >
                                    {cat.nombre}
                                  </span>
                                </button>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {cat.descripcion ? (
                                  <span className="line-clamp-2">
                                    {cat.descripcion}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">
                                    Sin descripción
                                  </span>
                                )}
                              </td>
                              {tieneColumnaConteo && (
                                <td className="py-3.5 px-4 text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                    {cat.productos_count ?? 0}
                                  </span>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación Tabla */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs py-3.5 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  {pagination.total > 0 ? (
                    <span>
                      Mostrando{" "}
                      <strong className="text-slate-800 font-bold">
                        {categorias.length}
                      </strong>{" "}
                      de{" "}
                      <strong className="text-slate-800 font-bold">
                        {pagination.total}
                      </strong>{" "}
                      categorías
                    </span>
                  ) : (
                    <span>Total: 0 categorías</span>
                  )}
                </div>
                {pagination.lastPage > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.currentPage <= 1 || isLoading}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      className="text-xs gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </Button>
                    <span className="text-xs text-slate-600 font-medium px-1">
                      Página {pagination.currentPage} de {pagination.lastPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        pagination.currentPage >= pagination.lastPage ||
                        isLoading
                      }
                      onClick={() =>
                        setPage((prev) =>
                          Math.min(pagination.lastPage, prev + 1)
                        )
                      }
                      className="text-xs gap-1"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ═══════════════ VISTA CUADRÍCULA ═══════════════ */
            <div className="space-y-6">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 animate-pulse flex flex-col h-full"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-slate-200" />
                        <div className="w-14 h-5 bg-slate-100 rounded-full" />
                      </div>
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-3.5 bg-slate-100 rounded w-full" />
                      <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : errorCarga ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-2.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Error al cargar categorías
                    </p>
                    <p className="text-xs text-slate-500 mt-1 mb-3">
                      {errorCarga}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManualRefresh}
                      className="text-xs"
                    >
                      Intentar de nuevo
                    </Button>
                  </div>
                </div>
              ) : categorias.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-14 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">
                      No se encontraron categorías
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
                      {busqueda
                        ? "No hay resultados para la búsqueda ingresada."
                        : "Aún no has registrado categorías en el catálogo."}
                    </p>
                    {busqueda ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLimpiarBusqueda}
                        className="text-xs"
                      >
                        Limpiar búsqueda
                      </Button>
                    ) : tienePermisoEscritura ? (
                      <Link href="/categorias/nuevo">
                        <Button
                          size="sm"
                          className="text-xs gap-1.5 shadow-sm shadow-brand/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Registrar primera categoría</span>
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {categorias.map((cat) => {
                    const isSelected = categoriaSeleccionada?.id === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() =>
                          setCategoriaSeleccionada(isSelected ? null : cat)
                        }
                        className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-5 flex flex-col h-full hover:shadow-md ${
                          isSelected
                            ? "ring-2 ring-[var(--primary-brand)] border-transparent shadow-md"
                            : "border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-start justify-between gap-2 mb-3.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                            style={{
                              backgroundColor:
                                "color-mix(in srgb, var(--primary-brand) 12%, transparent)",
                              color: "var(--primary-brand)",
                            }}
                          >
                            <Layers className="w-5 h-5" />
                          </div>

                          {cat.productos_count !== undefined && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                              <Package className="w-3 h-3 text-slate-400" />
                              <span>{cat.productos_count} productos</span>
                            </span>
                          )}
                        </div>

                        {/* Nombre y Descripción */}
                        <div className="flex-1 space-y-1.5">
                          <h3
                            className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-brand transition-colors"
                            style={
                              isSelected
                                ? { color: "var(--primary-brand)" }
                                : undefined
                            }
                          >
                            {cat.nombre}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {cat.descripcion || (
                              <span className="text-slate-400 italic">
                                Sin descripción
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Pie de tarjeta */}
                        <div className="pt-3.5 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Categoría de producto</span>
                          <span className="font-semibold text-brand group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            <span>Ver detalle</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Paginación Cuadrícula */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs py-3.5 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  {pagination.total > 0 ? (
                    <span>
                      Mostrando{" "}
                      <strong className="text-slate-800 font-bold">
                        {categorias.length}
                      </strong>{" "}
                      de{" "}
                      <strong className="text-slate-800 font-bold">
                        {pagination.total}
                      </strong>{" "}
                      categorías
                    </span>
                  ) : (
                    <span>Total: 0 categorías</span>
                  )}
                </div>
                {pagination.lastPage > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.currentPage <= 1 || isLoading}
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      className="text-xs gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </Button>
                    <span className="text-xs text-slate-600 font-medium px-1">
                      Página {pagination.currentPage} de {pagination.lastPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        pagination.currentPage >= pagination.lastPage ||
                        isLoading
                      }
                      onClick={() =>
                        setPage((prev) =>
                          Math.min(pagination.lastPage, prev + 1)
                        )
                      }
                      className="text-xs gap-1"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="py-3 px-4 sm:px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>Total: <strong className="text-slate-800 font-bold">{pagination.total}</strong> {pagination.total === 1 ? "categoría registrada" : "categorías registradas"}</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            DETAIL DRAWER — Categoría
            ═══════════════════════════════════════════════════════════════ */}
        <DetailDrawer
          isOpen={!!categoriaSeleccionada}
          onClose={() => setCategoriaSeleccionada(null)}
          title={categoriaSeleccionada?.nombre ?? "Detalle de Categoría"}
          subtitle="Categoría del catálogo"
          icon={<Layers className="w-4 h-4" />}
        >
          {categoriaSeleccionada && (
            <div className="p-5 space-y-5">
              {/* Icono principal */}
              <div className="flex justify-center py-4">
                <div className="w-20 h-20 rounded-3xl bg-brand/10 text-brand flex items-center justify-center shadow-inner">
                  <Layers className="w-10 h-10" />
                </div>
              </div>

              {/* Información */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Información</h3>
                <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 text-xs">
                  <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                      <Hash className="w-3.5 h-3.5" /><span>ID interno</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-700">{categoriaSeleccionada.id}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                      <Layers className="w-3.5 h-3.5" /><span>Nombre</span>
                    </div>
                    <span className="font-semibold text-slate-800">{categoriaSeleccionada.nombre}</span>
                  </div>
                  {tieneColumnaConteo && (
                    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <Package className="w-3.5 h-3.5" /><span>Productos asignados</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                        {categoriaSeleccionada.productos_count ?? 0}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</h3>
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-xs text-slate-700 leading-relaxed min-h-[60px]">
                  {categoriaSeleccionada.descripcion ? (
                    <div className="flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <p>{categoriaSeleccionada.descripcion}</p>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Esta categoría no tiene descripción registrada.</span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              {tienePermisoEscritura && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acciones</p>
                  <div className="flex flex-col gap-2">
                    <Link href={`/categorias/${categoriaSeleccionada.id}/editar`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full text-xs gap-2 justify-center">
                        <Edit className="w-3.5 h-3.5" /><span>Editar categoría</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCategoriaParaEliminar(categoriaSeleccionada)}
                      className="w-full text-xs gap-2 justify-center text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" /><span>Eliminar categoría</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DetailDrawer>

        {/* Modal de confirmación de eliminación */}
        {categoriaParaEliminar && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) setCategoriaParaEliminar(null);
            }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-eliminar-titulo"
          >
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto"><AlertTriangle className="w-6 h-6" /></div>
              <div className="text-center space-y-1.5">
                <h3 id="modal-eliminar-titulo" className="text-base font-bold text-slate-900">¿Eliminar categoría?</h3>
                <p className="text-xs text-slate-500">
                  Estás a punto de eliminar la categoría <strong className="text-slate-800 font-semibold">&ldquo;{categoriaParaEliminar.nombre}&rdquo;</strong>. Esta acción eliminará el registro de la base de datos.
                </p>
                <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2 mt-2 border border-amber-200/80">
                  Si esta categoría tiene productos asignados, el sistema no permitirá eliminarla.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="button" disabled={isDeleting} onClick={() => setCategoriaParaEliminar(null)} className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">Cancelar</button>
                <Button size="sm" isLoading={isDeleting} onClick={handleConfirmarEliminar} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-transparent text-xs py-2.5">
                  Confirmar Eliminación
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedByRole>
  );
}

export default function CategoriasPage() {
  return (
    <Suspense fallback={null}>
      <CategoriasContent />
    </Suspense>
  );
}

