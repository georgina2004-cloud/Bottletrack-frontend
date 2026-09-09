"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import { obtenerCompras, obtenerCompraPorId } from "@/lib/api";
import { useMoneda } from "@/lib/currency";
import { Compra } from "@/types/compra";
import { Button } from "@/components/ui/Button";
import { DetailDrawer } from "@/components/ui/DetailDrawer";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import {
  ShoppingCart,
  Plus,
  Search,
  AlertTriangle,
  RefreshCw,
  X,
  ChevronRight,
  ChevronLeft,
  Clock,
  User,
  Building2,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Hash,
} from "lucide-react";

export default function ComprasPage() {
  const { token, user } = useAuth();
  const { puedeEditar, rol } = usePermisos();

  const tienePermisoEscritura = puedeEditar("compras");

  // Estado del listado y paginación
  const [compras, setCompras] = useState<Compra[]>([]);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    lastPage: number;
    total: number;
  }>({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  // Toggle de vista: inicia en cuadrícula por defecto
  const [vista, setVista] = useState<ViewMode>("cuadricula");

  // Filtros
  const [busqueda, setBusqueda] = useState<string>("");
  const [terminoBuscado, setTerminoBuscado] = useState<string>("");
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");
  const [filtroFechas, setFiltroFechas] = useState<{ desde: string; hasta: string }>({
    desde: "",
    hasta: "",
  });
  const [page, setPage] = useState<number>(1);

  // Estados de carga y error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drawer / Detalle de Compra
  const [compraSeleccionada, setCompraSeleccionada] = useState<Compra | null>(null);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState<boolean>(false);

  // Carga de compras desde el backend al cambiar página o filtros
  useEffect(() => {
    let isMounted = true;

    async function cargar() {
      setErrorMessage(null);
      try {
        const res = await obtenerCompras(
          {
            page,
            busqueda: terminoBuscado,
            desde: filtroFechas.desde || undefined,
            hasta: filtroFechas.hasta || undefined,
          },
          token
        );
        if (isMounted) {
          setCompras(res.data || []);
          setPagination({
            currentPage: res.current_page || 1,
            lastPage: res.last_page || 1,
            total: res.total ?? (res.data ? res.data.length : 0),
          });
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Error al cargar compras:", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Ocurrió un error al cargar el listado de compras."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    cargar();

    return () => {
      isMounted = false;
    };
  }, [page, terminoBuscado, filtroFechas, token]);

  // Recarga manual
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const res = await obtenerCompras(
        {
          page,
          busqueda: terminoBuscado,
          desde: filtroFechas.desde || undefined,
          hasta: filtroFechas.hasta || undefined,
        },
        token
      );
      setCompras(res.data || []);
      setPagination({
        currentPage: res.current_page || 1,
        lastPage: res.last_page || 1,
        total: res.total ?? (res.data ? res.data.length : 0),
      });
    } catch (err: unknown) {
      console.error("Error al recargar compras:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al recargar las compras."
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [page, terminoBuscado, filtroFechas, token]);

  // Manejador de búsqueda y filtros
  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setTerminoBuscado(busqueda.trim());
    setFiltroFechas({ desde, hasta });
  };

  const handleLimpiarFiltros = () => {
    setBusqueda("");
    setTerminoBuscado("");
    setDesde("");
    setHasta("");
    setFiltroFechas({ desde: "", hasta: "" });
    setPage(1);
  };

  // Abrir detalle de compra en Drawer
  const handleVerDetalle = async (compra: Compra) => {
    if (compra.detalles && compra.detalles.length > 0) {
      setCompraSeleccionada(compra);
      return;
    }

    try {
      setIsLoadingDetalle(true);
      setCompraSeleccionada(compra);
      const compraCompleta = await obtenerCompraPorId(compra.id, token);
      setCompraSeleccionada(compraCompleta);
    } catch (err) {
      console.error("Error al cargar detalle de compra:", err);
    } finally {
      setIsLoadingDetalle(false);
    }
  };

  // Formato de moneda
  const { formatMoneda: formatMoney } = useMoneda();

  // Formato de fecha
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const hayFiltrosActivos =
    Boolean(terminoBuscado) || Boolean(filtroFechas.desde) || Boolean(filtroFechas.hasta);

  return (
    <ProtectedByRole modulo="compras">
      <DashboardLayout>
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* BREADCRUMB Y ENCABEZADO                                                  */}
          {/* ========================================================================= */}
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
              <span className="font-semibold text-brand">Compras</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                    Historial de Compras
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Haz clic en el número de factura para consultar los detalles de la compra.
                  </p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isLoading || isRefreshing}
                  className="text-xs gap-1.5 shadow-2xs"
                  title="Recargar compras"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-slate-500 ${
                      isRefreshing ? "animate-spin text-brand" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>

                {tienePermisoEscritura && (
                  <Link href="/compras/nueva">
                    <Button
                      size="sm"
                      className="text-xs gap-1.5 shadow-sm shadow-brand/20 font-semibold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nueva Compra</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ALERTA DE ERROR                                                           */}
          {/* ========================================================================= */}
          {errorMessage && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <p className="font-medium">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-600 hover:text-rose-800 p-1 rounded-md transition-colors cursor-pointer"
                title="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BARRA DE FILTROS: BÚSQUEDA, RANGO DE FECHAS Y TOGGLE DE VISTA             */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
            <form onSubmit={handleFiltrar} className="flex flex-col lg:flex-row gap-3 flex-1">
              {/* Búsqueda por proveedor o factura */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por n° de factura o proveedor..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all text-slate-800 placeholder:text-slate-400"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Rango de fechas */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-400 text-[11px]">Desde:</span>
                  <input
                    type="date"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                    className="bg-transparent text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-400 text-[11px]">Hasta:</span>
                  <input
                    type="date"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                    className="bg-transparent text-slate-700 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Botones de acción de filtro */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="text-xs h-[38px] px-4 font-semibold"
                >
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                  Filtrar
                </Button>
                {hayFiltrosActivos && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleLimpiarFiltros}
                    className="text-xs h-[38px] text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </form>

            <div className="shrink-0 flex items-center justify-end border-t xl:border-t-0 pt-2.5 xl:pt-0 border-slate-100">
              <ViewToggle vista={vista} onCambiarVista={setVista} />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONTENIDO PRINCIPAL: TABLA O CUADRÍCULA                                   */}
          {/* ========================================================================= */}
          {vista === "tabla" ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 font-semibold">N° Factura Proveedor</th>
                      <th className="py-3.5 px-4 font-semibold">Proveedor</th>
                      <th className="py-3.5 px-4 font-semibold">Registrado por</th>
                      <th className="py-3.5 px-4 font-semibold">Fecha</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-brand" />
                            <p className="text-xs font-medium text-slate-500">
                              Cargando historial de compras...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : compras.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                              <ShoppingCart className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 mb-1">
                              No se encontraron compras
                            </p>
                            <p className="text-xs text-slate-400 mb-4">
                              {hayFiltrosActivos
                                ? "No hay compras coincidentes con los filtros seleccionados."
                                : "Aún no se han registrado órdenes de compra a proveedores."}
                            </p>
                            {tienePermisoEscritura && (
                              <Link href="/compras/nueva">
                                <Button size="sm" className="text-xs gap-1.5 shadow-sm shadow-brand/20">
                                  <Plus className="w-4 h-4" />
                                  <span>Registrar Primera Compra</span>
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      compras.map((compra) => {
                        const isSelected = compraSeleccionada?.id === compra.id;
                        return (
                          <tr
                            key={compra.id}
                            className={`hover:bg-slate-50/70 transition-colors group ${
                              isSelected ? "bg-brand/5" : ""
                            }`}
                          >
                            {/* N° Factura Proveedor — clickeable para abrir DetailDrawer */}
                            <td className="py-3.5 px-4 font-mono font-semibold">
                              <button
                                type="button"
                                onClick={() => handleVerDetalle(compra)}
                                className="text-left font-mono font-bold text-slate-900 group-hover:text-brand transition-colors cursor-pointer hover:underline underline-offset-2"
                              >
                                {compra.numero_factura_proveedor &&
                                compra.numero_factura_proveedor.trim() !== "" ? (
                                  compra.numero_factura_proveedor
                                ) : (
                                  <span className="text-slate-400 font-normal italic">
                                    Compra #{compra.id} (Sin Factura)
                                  </span>
                                )}
                              </button>
                            </td>

                            {/* Proveedor */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-800">
                                  {compra.proveedor?.razon_social || "Proveedor no asignado"}
                                </span>
                              </div>
                            </td>

                            {/* Registrado por */}
                            <td className="py-3.5 px-4 text-slate-600">
                              {compra.usuario?.name || "N/A"}
                            </td>

                            {/* Fecha */}
                            <td className="py-3.5 px-4 text-slate-500 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{formatDate(compra.fecha || compra.created_at || "")}</span>
                              </div>
                            </td>

                            {/* Total */}
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                              {formatMoney(compra.total)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ═══════════════ VISTA CUADRÍCULA ═══════════════ */
            <div className="space-y-6">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3.5 animate-pulse flex flex-col h-full">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-xl bg-slate-200" />
                        <div className="w-20 h-5 bg-slate-100 rounded-full" />
                      </div>
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <div className="h-3.5 bg-slate-100 rounded w-1/3" />
                        <div className="h-5 bg-slate-200 rounded w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : compras.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-14 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No se encontraron compras</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
                      {hayFiltrosActivos
                        ? "No hay compras coincidentes con los filtros seleccionados."
                        : "Aún no se han registrado órdenes de compra a proveedores."}
                    </p>
                    {hayFiltrosActivos ? (
                      <Button variant="outline" size="sm" onClick={handleLimpiarFiltros} className="text-xs">
                        Limpiar filtros
                      </Button>
                    ) : tienePermisoEscritura ? (
                      <Link href="/compras/nueva">
                        <Button size="sm" className="text-xs gap-1.5 shadow-sm shadow-brand/20">
                          <Plus className="w-4 h-4" />
                          <span>Registrar Primera Compra</span>
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {compras.map((compra) => {
                    const isSelected = compraSeleccionada?.id === compra.id;
                    const tieneFactura = Boolean(
                      compra.numero_factura_proveedor && compra.numero_factura_proveedor.trim() !== ""
                    );

                    return (
                      <div
                        key={compra.id}
                        onClick={() => handleVerDetalle(compra)}
                        className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-5 flex flex-col h-full hover:shadow-md ${
                          isSelected
                            ? "ring-2 ring-[var(--primary-brand)] border-transparent shadow-md"
                            : "border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        {/* Encabezado de la tarjeta */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
                            <ShoppingCart className="w-4 h-4" />
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                              tieneFactura
                                ? "bg-slate-50 text-slate-700 border-slate-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>
                              {tieneFactura
                                ? compra.numero_factura_proveedor
                                : `Compra #${compra.id}`}
                            </span>
                          </span>
                        </div>

                        {/* Proveedor */}
                        <div className="mb-3 flex-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                            Proveedor
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-[var(--primary-brand)] transition-colors">
                            {compra.proveedor?.razon_social || "Proveedor no asignado"}
                          </h3>
                        </div>

                        {/* Metadatos: Registrado por y Fecha */}
                        <div className="space-y-1.5 py-3 border-t border-slate-100 text-xs text-slate-500">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <User className="w-3.5 h-3.5" /> Registrado por:
                            </span>
                            <span className="font-medium text-slate-700 truncate max-w-[130px]">
                              {compra.usuario?.name || "N/A"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <Calendar className="w-3.5 h-3.5" /> Fecha:
                            </span>
                            <span className="font-medium text-slate-600">
                              {formatDate(compra.fecha || compra.created_at || "")}
                            </span>
                          </div>
                        </div>

                        {/* Footer: Total destacado */}
                        <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                          <span className="text-xs font-semibold text-slate-500">Total</span>
                          <span className="text-base font-bold text-[var(--primary-brand)] font-mono">
                            {formatMoney(compra.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Barra de Estado y Paginación compartida para ambas vistas */}
          <div className="px-4 py-3 bg-white rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shadow-xs">
            <div>
              {pagination.total > 0 ? (
                <span>
                  Mostrando <strong className="text-slate-800 font-bold">{compras.length}</strong> de{" "}
                  <strong className="text-slate-800 font-bold">{pagination.total}</strong> compras registradas en total
                </span>
              ) : (
                <span>Total: 0 compras</span>
              )}
            </div>

            {pagination.lastPage > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.currentPage <= 1 || isLoading}
                  className="text-xs h-8 px-2.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Anterior
                </Button>

                <span className="text-xs text-slate-600 font-medium px-1">
                  Página {pagination.currentPage} de {pagination.lastPage}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.lastPage, p + 1))}
                  disabled={pagination.currentPage >= pagination.lastPage || isLoading}
                  className="text-xs h-8 px-2.5"
                >
                  Siguiente
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* DETAIL DRAWER — Compra                                                    */}
          {/* ========================================================================= */}
          <DetailDrawer
            isOpen={!!compraSeleccionada}
            onClose={() => setCompraSeleccionada(null)}
            title={
              compraSeleccionada
                ? `Compra #${compraSeleccionada.id}`
                : "Detalle de Compra"
            }
            subtitle={
              compraSeleccionada?.numero_factura_proveedor
                ? `Factura: ${compraSeleccionada.numero_factura_proveedor}`
                : "Orden de Abastecimiento"
            }
            icon={<ShoppingCart className="w-4 h-4" />}
          >
            {compraSeleccionada && (
              <div className="p-5 space-y-5">
                {/* Meta info de la compra */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Datos de Abastecimiento
                  </h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 text-xs">
                    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <Hash className="w-3.5 h-3.5" />
                        <span>ID interno</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-700">
                        #{compraSeleccionada.id}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Proveedor</span>
                      </div>
                      <span className="font-semibold text-slate-800 text-right">
                        {compraSeleccionada.proveedor?.razon_social || "No asignado"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Factura Prov.</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800">
                        {compraSeleccionada.numero_factura_proveedor || "Sin Factura"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <User className="w-3.5 h-3.5" />
                        <span>Registrado por</span>
                      </div>
                      <span className="font-semibold text-slate-800">
                        {compraSeleccionada.usuario?.name || user?.name || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Fecha de registro</span>
                      </div>
                      <span className="font-medium text-slate-700">
                        {formatDate(
                          compraSeleccionada.fecha ||
                            compraSeleccionada.created_at ||
                            ""
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desglose de artículos recibidos */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Productos Recibidos</span>
                    <span className="font-normal text-slate-400 lowercase">
                      {compraSeleccionada.detalles?.length || 0} ítems
                    </span>
                  </h3>

                  {isLoadingDetalle ? (
                    <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand mb-2" />
                      <p className="text-xs">Cargando desglose de productos...</p>
                    </div>
                  ) : compraSeleccionada.detalles &&
                    compraSeleccionada.detalles.length > 0 ? (
                    <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3">Producto</th>
                            <th className="py-2.5 px-2 text-center">Cant.</th>
                            <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                            <th className="py-2.5 px-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {compraSeleccionada.detalles.map((det, idx) => (
                            <tr key={det.id || idx}>
                              <td className="py-2.5 px-3 font-medium text-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <Package className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[150px]">
                                    {det.producto?.nombre ||
                                      `Producto #${det.producto_id}`}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center text-slate-600 font-semibold">
                                {det.cantidad}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                                {formatMoney(det.precio_unitario)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-slate-800 font-mono">
                                {formatMoney(det.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-slate-100">
                      No hay detalles disponibles para esta compra.
                    </p>
                  )}
                </div>

                {/* Resumen Total */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total
                  </h3>
                  <div className="bg-brand/5 rounded-xl border border-brand/20 p-4 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                      <DollarSign className="w-4 h-4 text-brand" /> Total de la
                      Compra:
                    </span>
                    <span className="text-brand font-sans font-bold text-base">
                      {formatMoney(compraSeleccionada.total)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DetailDrawer>
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
