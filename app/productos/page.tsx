"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import JsBarcode from "jsbarcode";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DetailDrawer } from "@/components/ui/DetailDrawer";
import { ProductoImagenCard } from "@/components/ui/ProductoImagenCard";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import {
  obtenerProductos,
  obtenerCategorias,
  desactivarProducto,
} from "@/lib/api";
import { useMoneda, formatPresentacionMl } from "@/lib/currency";
import {
  Producto,
  Categoria,
  ProductosPaginadosResponse,
} from "@/types/producto";
import {
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Barcode,
  X,
  Edit,
  Trash2,
  Tag,
  DollarSign,
  MapPin,
  Wine,
  Percent,
  Layers,
} from "lucide-react";

/** Componente para renderizar el código de barras visual tipo ticket */
function BarcodeRender({ codigo }: { codigo: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && codigo) {
      try {
        JsBarcode(svgRef.current, codigo, {
          format: "CODE128",
          lineColor: "#1e293b",
          width: 1.7,
          height: 44,
          displayValue: true,
          font: "monospace",
          fontSize: 12,
          textMargin: 4,
          background: "transparent",
        });
      } catch (err) {
        console.error("Error al renderizar código de barras:", err);
      }
    }
  }, [codigo]);

  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-4 flex flex-col items-center justify-center shadow-2xs">
      <svg ref={svgRef} className="max-w-full h-auto" />
    </div>
  );
}

function ProductosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { puedeEditar } = usePermisos();

  const tienePermisoEscritura = puedeEditar("productos");

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    lastPage: number;
    total: number;
  }>({ currentPage: 1, lastPage: 1, total: 0 });

  // Vista toggle: tabla o cuadrícula (inicia en cuadrícula por defecto)
  const [vista, setVista] = useState<ViewMode>("cuadricula");

  const [busqueda, setBusqueda] = useState<string>("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Drawer state
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  // Modal de desactivación
  const [productoParaDesactivar, setProductoParaDesactivar] = useState<Producto | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (searchParams.get("created") === "1") {
      setSuccessMessage("¡Producto creado y registrado en inventario exitosamente!");
      router.replace("/productos");
    } else if (searchParams.get("updated") === "1") {
      setSuccessMessage("¡Producto actualizado correctamente!");
      router.replace("/productos");
    } else if (searchParams.get("denied") === "1") {
      setErrorMessage("No tienes permiso para esta acción.");
      router.replace("/productos");
    }
  }, [searchParams, router]);

  useEffect(() => {
    let isMounted = true;
    async function loadCategorias() {
      try {
        setIsLoadingCategorias(true);
        const res = await obtenerCategorias({ per_page: 100 }, token);
        if (isMounted) setCategorias(res.data || []);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      } finally {
        if (isMounted) setIsLoadingCategorias(false);
      }
    }
    loadCategorias();
    return () => { isMounted = false; };
  }, [token]);

  const fetchProductos = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response: ProductosPaginadosResponse = await obtenerProductos(
        { busqueda: busqueda.trim() || undefined, categoria_id: categoriaSeleccionada || undefined, page },
        token
      );
      setProductos(response.data || []);
      setPagination({
        currentPage: response.current_page || 1,
        lastPage: response.last_page || 1,
        total: response.total || 0,
      });
    } catch (error: unknown) {
      console.error("Error al cargar productos:", error);
      setErrorMessage(error instanceof Error ? error.message : "No se pudieron cargar los productos.");
      setProductos([]);
    } finally {
      setIsLoading(false);
    }
  }, [busqueda, categoriaSeleccionada, page, token]);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);

  const handleLimpiarFiltros = () => {
    setBusqueda("");
    setCategoriaSeleccionada("");
    setPage(1);
  };

  const handleConfirmarDesactivar = async () => {
    if (!productoParaDesactivar) return;
    setIsDeleting(true);
    try {
      await desactivarProducto(productoParaDesactivar.id, token);
      setSuccessMessage(`El producto "${productoParaDesactivar.nombre}" ha sido desactivado del catálogo.`);
      setProductoParaDesactivar(null);
      if (productoSeleccionado?.id === productoParaDesactivar.id) {
        setProductoSeleccionado(null);
      }
      await fetchProductos();
    } catch (error: unknown) {
      console.error("Error al desactivar producto:", error);
      alert(error instanceof Error ? error.message : "Ocurrió un error al intentar desactivar el producto.");
    } finally {
      setIsDeleting(false);
    }
  };

  const { formatMoneda: formatMoney } = useMoneda();

  const getStockStatus = (prod: Producto) => {
    const isZero = prod.stock_actual <= 0;
    const isLow = !isZero && prod.stock_actual <= prod.stock_minimo;
    return { isZero, isLow };
  };

  return (
    <ProtectedByRole modulo="productos">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] font-sans">
                Catálogo de Productos
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Haz clic en cualquier producto para consultar su ficha técnica, código de barras y acciones.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProductos}
                disabled={isLoading}
                className="text-xs font-semibold gap-1.5 shadow-2xs"
                title="Actualizar listado"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--primary-brand)]" : ""}`} />
                <span className="hidden sm:inline">Refrescar</span>
              </Button>
              {tienePermisoEscritura && (
                <Link href="/productos/nuevo">
                  <Button size="sm" className="text-xs font-semibold gap-1.5 shadow-sm shadow-brand/20">
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Producto</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Banners */}
          {successMessage && (
            <div role="status" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="font-medium text-xs sm:text-sm">{successMessage}</p>
              </div>
              <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100/50 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {errorMessage && (
            <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-xs sm:text-sm text-rose-900">Error al consultar el catálogo</p>
                  <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchProductos} className="text-xs bg-white border-rose-200 text-rose-700 hover:bg-rose-100/50">
                Reintentar
              </Button>
            </div>
          )}

          {/* Barra de Filtros y Selector de Vista */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="w-full md:flex-1 relative">
              <Input
                placeholder="Buscar por nombre, marca o código de barras..."
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
                leftIcon={<Search className="w-4 h-4" />}
                rightElement={
                  busqueda ? (
                    <button type="button" onClick={() => { setBusqueda(""); setPage(1); }} className="p-1 text-slate-400 hover:text-slate-600 mr-1.5 cursor-pointer" title="Limpiar búsqueda">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null
                }
                className="bg-slate-50/50"
              />
            </div>
            <div className="w-full md:w-64">
              <select
                value={categoriaSeleccionada}
                onChange={(e) => { setCategoriaSeleccionada(e.target.value); setPage(1); }}
                disabled={isLoadingCategorias}
                className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-[#18181B] hover:border-slate-400 focus:border-[var(--primary-brand)] focus:ring-3 focus:ring-[var(--primary-brand)]/15 outline-none transition-all cursor-pointer"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            {/* Toggle de Vista Tabla / Cuadrícula */}
            <ViewToggle vista={vista} onCambiarVista={setVista} />

            {(busqueda || categoriaSeleccionada) && (
              <button type="button" onClick={handleLimpiarFiltros} className="text-xs font-semibold text-slate-500 hover:text-[var(--primary-brand)] px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer">
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Vistas: Tabla o Cuadrícula */}
          {vista === "tabla" ? (
            /* ═══════════════ VISTA TABLA ═══════════════ */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Código</th>
                      <th className="py-3.5 px-4 sm:px-6">Producto</th>
                      <th className="py-3.5 px-4">Categoría</th>
                      <th className="py-3.5 px-4 text-right">P. Compra</th>
                      <th className="py-3.5 px-4 text-right">P. Venta</th>
                      <th className="py-3.5 px-4 text-center">Stock</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-4 px-4 sm:px-6"><div className="h-3.5 bg-slate-200 rounded w-20" /></td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0" />
                              <div className="space-y-1">
                                <div className="h-4 bg-slate-200 rounded w-40" />
                                <div className="h-3 bg-slate-100 rounded w-24" />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded-full w-20" /></td>
                          <td className="py-4 px-4 text-right"><div className="h-3.5 bg-slate-100 rounded w-14 ml-auto" /></td>
                          <td className="py-4 px-4 text-right"><div className="h-3.5 bg-slate-200 rounded w-16 ml-auto" /></td>
                          <td className="py-4 px-4 text-center"><div className="h-3.5 bg-slate-100 rounded w-10 mx-auto" /></td>
                          <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-100 rounded-full w-14 mx-auto" /></td>
                        </tr>
                      ))
                    ) : productos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-14 text-center">
                          <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                              <Package className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">No se encontraron productos</h3>
                            <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
                              {busqueda || categoriaSeleccionada
                                ? "No hay resultados para los filtros seleccionados."
                                : "Aún no has registrado licores ni productos en el inventario."}
                            </p>
                            {busqueda || categoriaSeleccionada ? (
                              <Button variant="outline" size="sm" onClick={handleLimpiarFiltros} className="text-xs">Restablecer búsqueda</Button>
                            ) : tienePermisoEscritura ? (
                              <Link href="/productos/nuevo">
                                <Button size="sm" className="text-xs gap-1.5 shadow-sm shadow-brand/20">
                                  <Plus className="w-3.5 h-3.5" /><span>Registrar primer producto</span>
                                </Button>
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      productos.map((prod) => {
                        const { isZero, isLow } = getStockStatus(prod);
                        const isSelected = productoSeleccionado?.id === prod.id;
                        return (
                          <tr
                            key={prod.id}
                            className={`hover:bg-slate-50/80 transition-colors group ${isSelected ? "bg-[var(--primary-brand)]/5" : ""}`}
                          >
                            <td className="py-3.5 px-4 sm:px-6">
                              {prod.codigo_barras ? (
                                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{prod.codigo_barras}</span>
                              ) : (
                                <span className="text-slate-400 font-mono text-[11px]">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6">
                              <button
                                type="button"
                                onClick={() => setProductoSeleccionado(isSelected ? null : prod)}
                                className="flex items-center gap-3 text-left group/name cursor-pointer"
                              >
                                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-slate-200/80 shrink-0 overflow-hidden flex items-center justify-center p-0.5">
                                  {prod.imagen_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={prod.imagen_url}
                                      alt={prod.nombre}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <Wine className="w-5 h-5 text-slate-300 stroke-[1.5]" />
                                  )}
                                </div>
                                <div>
                                  <div className={`font-semibold text-xs transition-colors ${isSelected ? "text-[var(--primary-brand)]" : "text-slate-900 group-hover/name:text-[var(--primary-brand)]"}`}>
                                    {prod.nombre}
                                  </div>
                                  {(prod.marca || prod.presentacion_ml) && (
                                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                      {prod.marca && <span>{prod.marca}</span>}
                                      {prod.marca && prod.presentacion_ml && <span>•</span>}
                                      {prod.presentacion_ml && <span>{formatPresentacionMl(prod.presentacion_ml)}</span>}
                                    </div>
                                  )}
                                </div>
                              </button>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--primary-brand)]/10 text-[var(--primary-brand)]">
                                {prod.categoria?.nombre || "Sin categoría"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-600">
                              {formatMoney(prod.precio_compra)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-sans font-bold text-slate-900 text-sm">
                              {formatMoney(prod.precio_venta)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                isZero ? "bg-rose-100 text-rose-800" : isLow ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                              }`}>
                                {prod.stock_actual}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                prod.activo ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80" : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${prod.activo ? "bg-emerald-500" : "bg-slate-400"}`} />
                                {prod.activo ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación Tabla */}
              <div className="bg-slate-50/50 border-t border-slate-200/80 py-3.5 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  {pagination.total > 0 ? (
                    <span>Mostrando <strong className="text-slate-800 font-bold">{productos.length}</strong> de <strong className="text-slate-800 font-bold">{pagination.total}</strong> productos</span>
                  ) : <span>Total: 0 productos</span>}
                </div>
                {pagination.lastPage > 1 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={pagination.currentPage <= 1 || isLoading} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="text-xs gap-1">
                      <ChevronLeft className="w-3.5 h-3.5" /><span>Anterior</span>
                    </Button>
                    <span className="text-xs text-slate-600 font-medium px-1">Página {pagination.currentPage} de {pagination.lastPage}</span>
                    <Button variant="outline" size="sm" disabled={pagination.currentPage >= pagination.lastPage || isLoading} onClick={() => setPage((prev) => Math.min(pagination.lastPage, prev + 1))} className="text-xs gap-1">
                      <span>Siguiente</span><ChevronRight className="w-3.5 h-3.5" />
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
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 animate-pulse flex flex-col h-full">
                      <div className="aspect-[3/4] rounded-xl bg-slate-200 w-full" />
                      <div className="h-3 bg-slate-100 rounded w-16" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center mt-auto">
                        <div className="h-4 bg-slate-200 rounded w-16" />
                        <div className="h-3 bg-slate-100 rounded w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : productos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-14 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <Package className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No se encontraron productos</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
                      {busqueda || categoriaSeleccionada
                        ? "No hay resultados para los filtros seleccionados."
                        : "Aún no has registrado licores ni productos en el inventario."}
                    </p>
                    {busqueda || categoriaSeleccionada ? (
                      <Button variant="outline" size="sm" onClick={handleLimpiarFiltros} className="text-xs">Restablecer búsqueda</Button>
                    ) : tienePermisoEscritura ? (
                      <Link href="/productos/nuevo">
                        <Button size="sm" className="text-xs gap-1.5 shadow-sm shadow-brand/20">
                          <Plus className="w-3.5 h-3.5" /><span>Registrar primer producto</span>
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {productos.map((prod) => {
                    const { isZero, isLow } = getStockStatus(prod);
                    const isSelected = productoSeleccionado?.id === prod.id;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => setProductoSeleccionado(isSelected ? null : prod)}
                        className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-full hover:shadow-md ${
                          isSelected
                            ? "ring-2 ring-[var(--primary-brand)] border-transparent shadow-md"
                            : "border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        {/* Contenedor de imagen aspect-[3/4], object-contain y fallback */}
                        <ProductoImagenCard
                          imagenUrl={prod.imagen_url}
                          alt={prod.nombre}
                          aspectRatio="3/4"
                          badges={
                            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                              {isZero ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500 text-white shadow-xs">
                                  Agotado
                                </span>
                              ) : isLow ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-white shadow-xs">
                                  Stock bajo
                                </span>
                              ) : null}
                            </div>
                          }
                        />

                        {/* Info del producto */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--primary-brand)]/10 text-[var(--primary-brand)] truncate">
                                {prod.categoria?.nombre || "Sin categoría"}
                              </span>
                              {prod.presentacion_ml && (
                                <span className="text-[11px] text-slate-400 font-medium shrink-0">
                                  {formatPresentacionMl(prod.presentacion_ml)}
                                </span>
                              )}
                            </div>
                            <h3 className="font-serif font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-[var(--primary-brand)] transition-colors">
                              {prod.nombre}
                            </h3>
                            {prod.marca && (
                              <p className="text-[11px] text-slate-400 font-medium truncate">{prod.marca}</p>
                            )}
                          </div>

                          <div className="pt-2.5 border-t border-slate-100 flex items-end justify-between mt-auto">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Precio</p>
                              <p className="text-base font-bold text-[var(--primary-brand)] font-sans">
                                {formatMoney(prod.precio_venta)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Stock</p>
                              <p className={`text-xs font-bold ${isZero ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-700"}`}>
                                {prod.stock_actual} <span className="text-[10px] text-slate-400 font-normal">uds</span>
                              </p>
                            </div>
                          </div>
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
                    <span>Mostrando <strong className="text-slate-800 font-bold">{productos.length}</strong> de <strong className="text-slate-800 font-bold">{pagination.total}</strong> productos</span>
                  ) : <span>Total: 0 productos</span>}
                </div>
                {pagination.lastPage > 1 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={pagination.currentPage <= 1 || isLoading} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="text-xs gap-1">
                      <ChevronLeft className="w-3.5 h-3.5" /><span>Anterior</span>
                    </Button>
                    <span className="text-xs text-slate-600 font-medium px-1">Página {pagination.currentPage} de {pagination.lastPage}</span>
                    <Button variant="outline" size="sm" disabled={pagination.currentPage >= pagination.lastPage || isLoading} onClick={() => setPage((prev) => Math.min(pagination.lastPage, prev + 1))} className="text-xs gap-1">
                      <span>Siguiente</span><ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            DETAIL DRAWER — Producto Enriquecido (Layout 2 Bloques)
            ═══════════════════════════════════════════════════════════════ */}
        <DetailDrawer
          isOpen={!!productoSeleccionado}
          onClose={() => setProductoSeleccionado(null)}
          title="Ficha del Producto"
          subtitle={productoSeleccionado?.codigo_barras || productoSeleccionado?.categoria?.nombre || ""}
          icon={<Package className="w-4 h-4" />}
        >
          {productoSeleccionado && (() => {
            const prod = productoSeleccionado;
            const { isZero, isLow } = getStockStatus(prod);

            const pCompra = typeof prod.precio_compra === "string" ? parseFloat(prod.precio_compra) : prod.precio_compra;
            const pVenta = typeof prod.precio_venta === "string" ? parseFloat(prod.precio_venta) : prod.precio_venta;
            const margen = pCompra > 0 ? (((pVenta - pCompra) / pCompra) * 100) : 0;

            return (
              <div className="p-5 space-y-6">
                {/* 1. BLOQUE SUPERIOR: Imagen grande + Info Clave */}
                <div className="space-y-4">
                  <div className="aspect-square max-h-56 w-full rounded-2xl bg-gray-50 border border-slate-200/80 flex items-center justify-center overflow-hidden shadow-2xs">
                    {prod.imagen_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={prod.imagen_url}
                        alt={prod.nombre}
                        className="h-full w-full object-contain p-4"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                        <Wine className="w-16 h-16 stroke-[1.25]" />
                        <span className="text-[11px] text-slate-400">Sin fotografía</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <h2 className="text-lg font-serif font-bold text-slate-900 leading-snug">
                        {prod.nombre}
                      </h2>
                      {prod.codigo_barras && (
                        <p className="font-mono text-xs text-slate-500 mt-0.5">
                          Cód: {prod.codigo_barras}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--primary-brand)]/10 text-[var(--primary-brand)]">
                        {prod.categoria?.nombre || "Sin categoría"}
                      </span>
                      {isZero ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                          Agotado
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                          Stock bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Óptimo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. SECCIÓN: Información Básica */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Información Básica</span>
                  </h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 text-xs">
                    {[
                      { label: "Marca", value: prod.marca ?? "—" },
                      { label: "Categoría", value: prod.categoria?.nombre ?? "Sin categoría" },
                      { label: "Presentación", value: formatPresentacionMl(prod.presentacion_ml) || "—" },
                      { label: "Ubicación en tienda", value: prod.ubicacion ?? "No registrada" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-semibold text-slate-800 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. SECCIÓN: Información de Venta & Inventario */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Información de Venta & Inventario</span>
                  </h3>

                  {/* Precios y Margen */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">P. Compra</p>
                      <p className="text-sm font-bold text-slate-700 font-sans">{formatMoney(prod.precio_compra)}</p>
                    </div>
                    <div className="bg-[var(--primary-brand)]/5 rounded-xl border border-[var(--primary-brand)]/20 p-3 text-center">
                      <p className="text-[10px] text-[var(--primary-brand)] font-semibold mb-0.5">P. Venta</p>
                      <p className="text-sm font-bold text-[var(--primary-brand)] font-sans">{formatMoney(prod.precio_venta)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3 text-center">
                      <p className="text-[10px] text-emerald-700 font-semibold mb-0.5 flex items-center justify-center gap-0.5">
                        <Percent className="w-2.5 h-2.5" />Margen
                      </p>
                      <p className="text-sm font-bold text-emerald-700 font-sans">
                        {margen >= 0 ? "+" : ""}{margen.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Stock Metas */}
                  <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 text-xs">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-slate-500">Stock actual</span>
                      <span className={`font-bold ${isZero ? "text-rose-600" : isLow ? "text-amber-600" : "text-emerald-700"}`}>
                        {prod.stock_actual} unidades
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-slate-500">Stock mínimo</span>
                      <span className="font-semibold text-slate-800">{prod.stock_minimo} unidades</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-slate-500">Stock máximo</span>
                      <span className="font-semibold text-slate-800">{prod.stock_maximo ? `${prod.stock_maximo} unidades` : "No definido"}</span>
                    </div>
                  </div>
                </div>

                {/* 4. SECCIÓN: Código de Barras (Visual) */}
                {prod.codigo_barras && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Barcode className="w-3.5 h-3.5" />
                      <span>Código de Barras</span>
                    </h3>
                    <BarcodeRender codigo={prod.codigo_barras} />
                  </div>
                )}

                {/* 5. ACCIONES */}
                {tienePermisoEscritura && (
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acciones</p>
                    <div className="flex flex-col gap-2">
                      <Link href={`/productos/${prod.id}/editar`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full text-xs gap-2 justify-center">
                          <Edit className="w-3.5 h-3.5" />
                          <span>Editar producto</span>
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProductoParaDesactivar(prod)}
                        className="w-full text-xs gap-2 justify-center text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Desactivar producto</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DetailDrawer>

        {/* Modal de confirmación de desactivación */}
        {productoParaDesactivar && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">¿Desactivar producto?</h3>
                <p className="text-xs text-slate-500">
                  Estás a punto de desactivar <strong className="text-slate-800 font-semibold">&ldquo;{productoParaDesactivar.nombre}&rdquo;</strong>. Ya no estará disponible para ventas ni aparecerá activo en el catálogo.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setProductoParaDesactivar(null)} disabled={isDeleting} className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer text-center">
                  Cancelar
                </button>
                <Button size="sm" isLoading={isDeleting} onClick={handleConfirmarDesactivar} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-transparent text-xs py-2.5">
                  Confirmar Desactivación
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedByRole>
  );
}

export default function ProductosPage() {
  return (
    <Suspense fallback={null}>
      <ProductosContent />
    </Suspense>
  );
}
