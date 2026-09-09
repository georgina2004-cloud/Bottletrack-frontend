"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import { obtenerVentas, anularVenta, obtenerVentaPorId, abrirFacturaPDF } from "@/lib/api";
import { useMoneda } from "@/lib/currency";
import { Venta } from "@/types/venta";
import { Button } from "@/components/ui/Button";
import { DetailDrawer } from "@/components/ui/DetailDrawer";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import {
  Receipt,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  ChevronRight,
  ChevronLeft,
  Ban,
  Clock,
  User,
  Printer,
  Calendar,
  DollarSign,
  Package,
} from "lucide-react";

export default function VentasPage() {
  const { token, user } = useAuth();
  const { puedeEditar, rol } = usePermisos();

  const tienePermisoEscritura = puedeEditar("ventas");

  // Estado de listado y paginación
  const [ventas, setVentas] = useState<Venta[]>([]);
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
  const [page, setPage] = useState<number>(1);

  // Estados de carga y error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Drawer / Detalle de Venta
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState<boolean>(false);
  const [isImprimiendoPdf, setIsImprimiendoPdf] = useState<boolean>(false);
  const [errorImpresionPdf, setErrorImpresionPdf] = useState<string | null>(null);

  // Modal de Confirmación Fuerte para Anulación
  const [ventaParaAnular, setVentaParaAnular] = useState<Venta | null>(null);
  const [textoConfirmacion, setTextoConfirmacion] = useState<string>("");
  const [isAnulando, setIsAnulando] = useState<boolean>(false);

  // Recarga tras operaciones o manual
  const recargarVentas = useCallback(async () => {
    try {
      const res = await obtenerVentas(
        {
          page,
          busqueda: terminoBuscado,
        },
        token
      );
      setVentas(res.data || []);
      setPagination({
        currentPage: res.current_page || 1,
        lastPage: res.last_page || 1,
        total: res.total ?? (res.data ? res.data.length : 0),
      });
    } catch (err: unknown) {
      console.error("Error al recargar ventas:", err);
    }
  }, [page, terminoBuscado, token]);

  // Carga de ventas desde el backend al cambiar página o filtro
  useEffect(() => {
    let isMounted = true;

    async function cargar() {
      setErrorMessage(null);
      try {
        const res = await obtenerVentas(
          {
            page,
            busqueda: terminoBuscado,
          },
          token
        );
        if (isMounted) {
          setVentas(res.data || []);
          setPagination({
            currentPage: res.current_page || 1,
            lastPage: res.last_page || 1,
            total: res.total ?? (res.data ? res.data.length : 0),
          });
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Error al cargar ventas:", err);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Ocurrió un error al cargar el listado de ventas."
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
  }, [page, terminoBuscado, token]);

  // Manejador de búsqueda
  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setTerminoBuscado(busqueda.trim());
  };

  const handleLimpiarFiltro = () => {
    setBusqueda("");
    setTerminoBuscado("");
    setPage(1);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    recargarVentas().finally(() => setIsRefreshing(false));
  };

  // Abrir detalle de venta en Drawer
  const handleVerDetalle = async (venta: Venta) => {
    setErrorImpresionPdf(null);
    // Si ya viene con detalles completos la usamos; si no, consultamos por ID
    if (venta.detalles && venta.detalles.length > 0) {
      setVentaSeleccionada(venta);
      return;
    }

    try {
      setIsLoadingDetalle(true);
      setVentaSeleccionada(venta);
      const ventaCompleta = await obtenerVentaPorId(venta.id, token);
      setVentaSeleccionada(ventaCompleta);
    } catch (err) {
      console.error("Error al cargar detalle de venta:", err);
    } finally {
      setIsLoadingDetalle(false);
    }
  };

  // Impresión y apertura de factura en formato PDF
  const handleImprimirFactura = async (ventaId: number | string) => {
    setIsImprimiendoPdf(true);
    setErrorImpresionPdf(null);
    try {
      await abrirFacturaPDF(ventaId, token);
    } catch (err: unknown) {
      console.error("Error al generar o imprimir factura PDF:", err);
      setErrorImpresionPdf(
        err instanceof Error
          ? err.message
          : "Error al generar la factura en PDF. Por favor, intente nuevamente."
      );
    } finally {
      setIsImprimiendoPdf(false);
    }
  };

  // Abrir modal de anulación
  const handleIniciarAnulacion = (venta: Venta) => {
    setVentaParaAnular(venta);
    setTextoConfirmacion("");
  };

  // Ejecutar anulación fuerte
  const handleConfirmarAnular = async () => {
    if (!ventaParaAnular) return;
    if (textoConfirmacion.trim().toUpperCase() !== "ANULAR") return;

    setIsAnulando(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await anularVenta(ventaParaAnular.id, token);
      setSuccessMessage(
        res.message ||
          `La factura ${ventaParaAnular.numero_factura} fue anulada exitosamente y su stock devuelto al inventario.`
      );
      // Si el drawer está abierto para esta venta, actualizar estado a anulada
      if (ventaSeleccionada?.id === ventaParaAnular.id) {
        setVentaSeleccionada((prev) => (prev ? { ...prev, estado_activa: false } : null));
      }
      setVentaParaAnular(null);
      setTextoConfirmacion("");
      await recargarVentas();
    } catch (err: unknown) {
      console.error("Error al anular venta:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Error al anular la venta. Verifica los permisos o el estado del registro."
      );
    } finally {
      setIsAnulando(false);
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

  return (
    <ProtectedByRole modulo="ventas">
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
              <span className="font-semibold text-brand">Ventas</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                    Historial de Ventas
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Haz clic en el número de factura para consultar sus detalles y opciones.
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
                  title="Recargar ventas"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-slate-500 ${
                      isRefreshing ? "animate-spin text-[#D17B00]" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>

                {tienePermisoEscritura && (
                  <Link href="/ventas/nueva">
                    <Button
                      size="sm"
                      className="text-xs gap-1.5 shadow-sm shadow-[#D17B00]/20 font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nueva Venta</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ALERTAS DE ÉXITO O ERROR                                                 */}
          {/* ========================================================================= */}
          {successMessage && (
            <div
              role="status"
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="font-medium">{successMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md transition-colors cursor-pointer"
                title="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
          {/* BARRA DE BÚSQUEDA Y TOGGLE                                                */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-2.5 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por n° de factura o nombre de cliente..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#D17B00] focus:ring-2 focus:ring-[#D17B00]/15 transition-all text-slate-800 placeholder:text-slate-400"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={handleLimpiarFiltro}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* Toggle de Vista Tabla / Cuadrícula */}
            <ViewToggle vista={vista} onCambiarVista={setVista} />
          </div>

          {/* ========================================================================= */}
          {/* VISTAS: TABLA O CUADRÍCULA                                                */}
          {/* ========================================================================= */}
          {vista === "tabla" ? (
            /* ═══════════════ VISTA TABLA ═══════════════ */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 font-semibold">Factura</th>
                      <th className="py-3.5 px-4 font-semibold">Cliente</th>
                      <th className="py-3.5 px-4 font-semibold">Vendedor</th>
                      <th className="py-3.5 px-4 font-semibold">Fecha</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Total</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#D17B00]" />
                            <p className="text-xs font-medium text-slate-500">
                              Cargando historial de ventas...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : ventas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-slate-400">
                          <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                              <Receipt className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">
                              No se encontraron ventas
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
                              {terminoBuscado
                                ? "No hay registros que coincidan con los filtros de búsqueda."
                                : "Aún no se han registrado ventas en el sistema."}
                            </p>
                            {terminoBuscado ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLimpiarFiltro}
                                className="text-xs"
                              >
                                Limpiar filtros
                              </Button>
                            ) : tienePermisoEscritura ? (
                              <Link href="/ventas/nueva">
                                <Button
                                  size="sm"
                                  className="text-xs gap-1.5 shadow-sm shadow-[#D17B00]/20 font-semibold"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Crear primera venta</span>
                                </Button>
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      ventas.map((venta) => {
                        const estaActiva = venta.estado_activa !== false;
                        const isSelected = ventaSeleccionada?.id === venta.id;

                        return (
                          <tr
                            key={venta.id}
                            className={`hover:bg-slate-50/80 transition-colors group ${
                              isSelected ? "bg-amber-50/30" : ""
                            }`}
                          >
                            {/* Factura con clickeable para abrir el DetailDrawer */}
                            <td className="py-3.5 px-4 font-mono font-medium">
                              <button
                                type="button"
                                onClick={() => handleVerDetalle(venta)}
                                className="text-left font-bold text-[#D17B00] hover:underline flex items-center gap-1.5 cursor-pointer"
                                title="Ver comprobante y acciones"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>#{venta.numero_factura}</span>
                              </button>
                            </td>

                            {/* Cliente */}
                            <td className="py-3.5 px-4 text-slate-900 font-medium">
                              {venta.cliente_nombre || (
                                <span className="text-slate-400 italic">Consumidor Final</span>
                              )}
                            </td>

                            {/* Vendedor */}
                            <td className="py-3.5 px-4 text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{venta.usuario?.name || "Vendedor"}</span>
                              </div>
                            </td>

                            {/* Fecha */}
                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{formatDate(venta.fecha || venta.created_at || "")}</span>
                              </div>
                            </td>

                            {/* Total */}
                            <td className="py-3.5 px-4 text-right font-semibold text-slate-900 font-sans">
                              {formatMoney(venta.total)}
                            </td>

                            {/* Estado */}
                            <td className="py-3.5 px-4 text-center">
                              {estaActiva ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Activa
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  Anulada
                                </span>
                              )}
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
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 animate-pulse flex flex-col h-full">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-slate-200" />
                        <div className="w-16 h-5 bg-slate-100 rounded-full" />
                      </div>
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-auto">
                        <div className="h-5 bg-slate-200 rounded w-20" />
                        <div className="h-3.5 bg-slate-100 rounded w-14" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : ventas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-14 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No se encontraron ventas</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
                      {terminoBuscado
                        ? "No hay registros que coincidan con los filtros de búsqueda."
                        : "Aún no se han registrado ventas en el sistema."}
                    </p>
                    {terminoBuscado ? (
                      <Button variant="outline" size="sm" onClick={handleLimpiarFiltro} className="text-xs">
                        Limpiar filtros
                      </Button>
                    ) : tienePermisoEscritura ? (
                      <Link href="/ventas/nueva">
                        <Button size="sm" className="text-xs gap-1.5 shadow-sm shadow-[#D17B00]/20 font-semibold">
                          <Plus className="w-4 h-4" /><span>Crear primera venta</span>
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {ventas.map((venta) => {
                    const estaActiva = venta.estado_activa !== false;
                    const isSelected = ventaSeleccionada?.id === venta.id;

                    return (
                      <div
                        key={venta.id}
                        onClick={() => handleVerDetalle(venta)}
                        className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-5 flex flex-col h-full hover:shadow-md ${
                          isSelected
                            ? "ring-2 ring-[var(--primary-brand)] border-transparent shadow-md"
                            : "border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                            style={{
                              backgroundColor: "color-mix(in srgb, var(--primary-brand) 12%, transparent)",
                              color: "var(--primary-brand)",
                            }}
                          >
                            <Receipt className="w-5 h-5" />
                          </div>

                          {estaActiva ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <Ban className="w-3 h-3 text-rose-500" />
                              Anulada
                            </span>
                          )}
                        </div>

                        {/* Factura y Cliente */}
                        <div className="space-y-1 mb-3">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            #{venta.numero_factura}
                          </span>
                          <h3
                            className="font-serif font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-brand transition-colors"
                            style={isSelected ? { color: "var(--primary-brand)" } : undefined}
                          >
                            {venta.cliente_nombre || "Consumidor Final"}
                          </h3>
                        </div>

                        {/* Vendedor y Fecha */}
                        <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{venta.usuario?.name || "Vendedor"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="whitespace-nowrap">{formatDate(venta.fecha || venta.created_at || "")}</span>
                          </div>
                        </div>

                        {/* Total destacado */}
                        <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between mt-auto">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                          <span
                            className="text-lg font-extrabold font-sans"
                            style={{ color: "var(--primary-brand)" }}
                          >
                            {formatMoney(venta.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Barra de Estado y Paginación Compartida */}
          <div className="px-4 py-3 bg-white rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shadow-xs">
            <div>
              {pagination.total > 0 ? (
                <span>
                  Mostrando <strong className="text-slate-800 font-bold">{ventas.length}</strong> de{" "}
                  <strong className="text-slate-800 font-bold">{pagination.total}</strong> ventas registradas en total
                </span>
              ) : (
                <span>Total: 0 ventas</span>
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
          {/* DETAIL DRAWER — Venta / Factura                                           */}
          <DetailDrawer
            isOpen={!!ventaSeleccionada}
            onClose={() => {
              setVentaSeleccionada(null);
              setErrorImpresionPdf(null);
            }}
            title={
              ventaSeleccionada
                ? `Factura #${ventaSeleccionada.numero_factura}`
                : "Detalle de Factura"
            }
            subtitle={
              ventaSeleccionada
                ? formatDate(
                    ventaSeleccionada.fecha || ventaSeleccionada.created_at || ""
                  )
                : ""
            }
            icon={<Receipt className="w-4 h-4" />}
          >
            {ventaSeleccionada && (
              <div className="p-5 space-y-5">
                {/* Meta info de la venta */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Datos de Facturación
                  </h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 text-xs">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-slate-500">Cliente</span>
                      <span className="font-semibold text-slate-800">
                        {ventaSeleccionada.cliente_nombre || "Consumidor Final"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-slate-500">Vendedor</span>
                      <span className="font-semibold text-slate-800">
                        {ventaSeleccionada.usuario?.name || user?.name || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-slate-500">Fecha y Hora</span>
                      <span className="font-medium text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(
                          ventaSeleccionada.fecha ||
                            ventaSeleccionada.created_at ||
                            ""
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-slate-500">Estado</span>
                      <span
                        className={`inline-block font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                          ventaSeleccionada.estado_activa
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {ventaSeleccionada.estado_activa ? "Activa" : "Anulada"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desglose de artículos */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Productos Facturados</span>
                    <span className="font-normal text-slate-400 lowercase">
                      {ventaSeleccionada.detalles?.length || 0} ítems
                    </span>
                  </h3>

                  {isLoadingDetalle ? (
                    <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#D17B00] mb-2" />
                      <p className="text-xs">Cargando desglose de productos...</p>
                    </div>
                  ) : ventaSeleccionada.detalles &&
                    ventaSeleccionada.detalles.length > 0 ? (
                    <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3">Producto</th>
                            <th className="py-2.5 px-2 text-center">Cant.</th>
                            <th className="py-2.5 px-3 text-right">Unitario</th>
                            <th className="py-2.5 px-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ventaSeleccionada.detalles.map((det, idx) => (
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
                      No hay detalles disponibles para esta venta.
                    </p>
                  )}
                </div>

                {/* Resumen financiero */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Totales
                  </h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatMoney(ventaSeleccionada.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Impuesto (IVA):</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatMoney(ventaSeleccionada.impuesto)}
                      </span>
                    </div>
                    {Number(ventaSeleccionada.descuento) > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Descuento aplicado:</span>
                        <span className="font-mono font-semibold">
                          -{formatMoney(ventaSeleccionada.descuento)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2.5 border-t border-slate-200 text-sm font-bold text-slate-900">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-[#D17B00]" /> Total
                        Cobrado:
                      </span>
                      <span className="text-[#D17B00] font-sans font-bold">
                        {formatMoney(ventaSeleccionada.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones del Drawer */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Acciones
                  </p>

                  {errorImpresionPdf && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errorImpresionPdf}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {/* Botón Imprimir Factura PDF */}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleImprimirFactura(ventaSeleccionada.id)}
                      isLoading={isImprimiendoPdf}
                      disabled={isImprimiendoPdf}
                      className="w-full text-xs gap-2 justify-center shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>
                        {isImprimiendoPdf
                          ? "Generando Factura PDF..."
                          : "Imprimir / Ver Factura PDF"}
                      </span>
                    </Button>

                    {/* Botón Anular (si tiene permiso y está activa) */}
                    {tienePermisoEscritura && ventaSeleccionada.estado_activa && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleIniciarAnulacion(ventaSeleccionada)}
                        className="w-full text-xs gap-2 justify-center text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Anular factura y revertir stock</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DetailDrawer>

          {/* ========================================================================= */}
          {/* MODAL DE CONFIRMACIÓN FUERTE PARA ANULAR VENTA                             */}
          {/* ========================================================================= */}
          {ventaParaAnular && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
              role="alertdialog"
              aria-modal="true"
            >
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-900">
                      ¿Confirmar anulación de factura?
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Esta operación es irreversible y modificará el stock.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                    <p className="font-semibold">
                      Factura: #{ventaParaAnular.numero_factura}
                    </p>
                    <p>
                      Monto total:{" "}
                      <span className="font-bold">{formatMoney(ventaParaAnular.total)}</span>
                    </p>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed">
                      Al anular esta transacción, todos los productos contenidos en ella
                      serán devueltos automáticamente a las existencias del inventario.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Para confirmar, escribe la palabra <span className="text-rose-600 font-bold">ANULAR</span> abajo:
                    </label>
                    <input
                      type="text"
                      placeholder="Escribe ANULAR para confirmar"
                      value={textoConfirmacion}
                      onChange={(e) => setTextoConfirmacion(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 text-slate-900 font-mono text-center tracking-widest uppercase"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setVentaParaAnular(null)}
                      disabled={isAnulando}
                      className="w-1/2 text-xs"
                    >
                      Cancelar
                    </Button>
                    <button
                      type="button"
                      onClick={handleConfirmarAnular}
                      disabled={
                        isAnulando ||
                        textoConfirmacion.trim().toUpperCase() !== "ANULAR"
                      }
                      className="w-1/2 inline-flex items-center justify-center font-medium rounded-lg text-xs py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isAnulando ? (
                        <div className="flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Anulando...</span>
                        </div>
                      ) : (
                        <span>Confirmar Anulación</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
