"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  obtenerReporteVentasPorVendedor,
  obtenerUsuarios,
  obtenerVentas,
  abrirFacturaPDF,
} from "@/lib/api";
import { ReporteVentasPorVendedor } from "@/types/reporte";
import { Venta } from "@/types/venta";
import { formatDateTimeLegible, formatDateLegible } from "@/lib/formatDate";
import { ReportesHeader } from "@/components/reportes/ReportesHeader";
import { FiltrosFecha } from "@/components/reportes/FiltrosFecha";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Loader2,
  User,
  Receipt,
  DollarSign,
  TrendingUp,
  X,
  Printer,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
} from "lucide-react";

interface VendedorOpcion {
  id: number;
  name: string;
}

export default function VentasPorVendedorPage() {
  const { token } = useAuth();

  // Filtros de fecha (inicio de mes actual y hoy)
  const [desde, setDesde] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [hasta, setHasta] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Filtro de vendedor
  const [vendedorId, setVendedorId] = useState<string>("todos");
  const [vendedoresDisponibles, setVendedoresDisponibles] = useState<VendedorOpcion[]>([]);

  // Datos principales de la tabla
  const [datos, setDatos] = useState<ReporteVentasPorVendedor[]>([]);
  const [totalGeneralTransacciones, setTotalGeneralTransacciones] = useState<number>(0);
  const [totalGeneralFacturado, setTotalGeneralFacturado] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del Drawer / Modal de Detalle de Auditoría
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<ReporteVentasPorVendedor | null>(null);
  const [ventasVendedor, setVentasVendedor] = useState<Venta[]>([]);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState<boolean>(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);
  const [imprimiendoId, setImprimiendoId] = useState<number | null>(null);

  // Formateador estándar de córdobas
  const formatMonto = (monto: number | string | undefined | null): string => {
    return `C$ ${Number(monto || 0).toFixed(2)}`;
  };

  // Carga inicial de usuarios para el selector de vendedores
  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    async function cargarListaUsuarios() {
      try {
        const res = await obtenerUsuarios({}, token);
        if (isMounted && res.data) {
          const list = res.data.map((u) => ({
            id: u.id,
            name: u.name,
          }));
          setVendedoresDisponibles(list);
        }
      } catch (err) {
        console.warn("No se pudo cargar la lista de usuarios para el filtro:", err);
      }
    }

    cargarListaUsuarios();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Carga del reporte de ventas por vendedor
  const cargarDatos = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await obtenerReporteVentasPorVendedor(
        {
          desde,
          hasta,
          vendedor_id: vendedorId,
        },
        token
      );

      const items = res.data || [];
      setDatos(items);
      setTotalGeneralTransacciones(Number(res.total_general_transacciones ?? 0));
      setTotalGeneralFacturado(Number(res.total_general_facturado ?? 0));

      // Si los usuarios del backend no se habían cargado, completar lista con los del reporte
      setVendedoresDisponibles((prev) => {
        const map = new Map<number, string>();
        prev.forEach((v) => map.set(v.id, v.name));
        items.forEach((item) => {
          if (item.id && item.vendedor) {
            map.set(item.id, item.vendedor);
          }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar reporte de ventas por vendedor."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, desde, hasta, vendedorId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Restablecer filtros
  const handleLimpiarFiltros = () => {
    const d = new Date();
    setDesde(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    setHasta(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
    setVendedorId("todos");
  };

  // Apertura del Drawer para ver ventas detalladas del vendedor
  const handleAbrirDetalle = async (item: ReporteVentasPorVendedor) => {
    setVendedorSeleccionado(item);
    setDrawerOpen(true);
    setIsLoadingDetalle(true);
    setErrorDetalle(null);
    setVentasVendedor([]);

    try {
      const res = await obtenerVentas(
        {
          desde,
          hasta,
          user_id: item.id,
          per_page: 100,
        },
        token
      );
      setVentasVendedor(res.data || []);
    } catch (err: unknown) {
      console.error("Error al cargar ventas del vendedor:", err);
      setErrorDetalle(
        err instanceof Error
          ? err.message
          : "No se pudieron obtener las ventas de este vendedor."
      );
    } finally {
      setIsLoadingDetalle(false);
    }
  };

  // Cerrar Drawer con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  // Bloquear scroll de la página al abrir el drawer
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Imprimir comprobante PDF de una venta individual
  const handleImprimirVenta = async (ventaId: number) => {
    setImprimiendoId(ventaId);
    try {
      await abrirFacturaPDF(ventaId, token);
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "Error al abrir el comprobante en PDF."
      );
    } finally {
      setImprimiendoId(null);
    }
  };

  // Métricas rápidas de cabecera
  const ticketPromedio = useMemo(() => {
    if (totalGeneralTransacciones > 0) {
      return totalGeneralFacturado / totalGeneralTransacciones;
    }
    return 0;
  }, [totalGeneralFacturado, totalGeneralTransacciones]);

  const topVendedor = useMemo(() => {
    if (datos.length === 0) return null;
    return [...datos].sort(
      (a, b) =>
        Number(b.total_facturado ?? b.monto_total ?? 0) -
        Number(a.total_facturado ?? a.monto_total ?? 0)
    )[0];
  }, [datos]);

  return (
    <div className="space-y-6">
      {/* Encabezado con botones de exportación PDF y Excel preservando filtros activos */}
      <ReportesHeader
        title="Ventas por Vendedor"
        description="Rendimiento del personal de caja/mostrador, volumen de transacciones y facturación acumulada."
        tipo="ventas-por-vendedor"
        desde={desde}
        hasta={hasta}
        vendedorId={vendedorId}
      />

      {/* Barra de Filtros: Rango de Fecha + Selector de Vendedor */}
      <FiltrosFecha
        desde={desde}
        hasta={hasta}
        onDesdeChange={setDesde}
        onHastaChange={setHasta}
        onFiltrar={cargarDatos}
        onLimpiar={handleLimpiarFiltros}
        isLoading={isLoading}
      >
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="filtro-vendedor"
            className="text-slate-500 font-medium whitespace-nowrap"
          >
            Vendedor:
          </label>
          <div className="relative">
            <select
              id="filtro-vendedor"
              value={vendedorId}
              onChange={(e) => setVendedorId(e.target.value)}
              className="pl-2.5 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand shadow-2xs cursor-pointer appearance-none min-w-[180px]"
            >
              <option value="todos">Todos los vendedores</option>
              {vendedoresDisponibles.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {v.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </FiltrosFecha>

      {/* Tarjetas de Resumen KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Facturación Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Facturado
            </p>
            <p className="text-xl font-bold font-sans text-slate-900 mt-1">
              {formatMonto(totalGeneralFacturado)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">En el rango seleccionado</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Transacciones Totales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Transacciones
            </p>
            <p className="text-xl font-bold font-sans text-slate-900 mt-1">
              {totalGeneralTransacciones}{" "}
              <span className="text-xs font-normal text-slate-500">ventas</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {datos.length} vendedores evaluados
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Ticket Promedio */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Ticket Promedio
            </p>
            <p className="text-xl font-bold font-sans text-slate-900 mt-1">
              {formatMonto(ticketPromedio)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Promedio por transacción</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Líder de Ventas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Mayor Facturación
            </p>
            <p className="text-base font-bold font-sans text-slate-900 mt-1 truncate">
              {topVendedor ? topVendedor.vendedor : "—"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {topVendedor
                ? formatMonto(topVendedor.total_facturado ?? topVendedor.monto_total)
                : "Sin datos"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-3" />
            <span className="text-xs font-medium">Calculando rendimiento de vendedores...</span>
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs text-rose-600 font-semibold">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cargarDatos}
              className="mt-3 text-xs"
            >
              Reintentar
            </Button>
          </div>
        ) : datos.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-9 h-9 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">
              No se encontraron registros de ventas para el período y filtro seleccionados.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Prueba cambiando las fechas o seleccionando &quot;Todos los vendedores&quot;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-5">Vendedor / Cajero</th>
                  <th className="py-3.5 px-5 text-center">Transacciones Realizadas</th>
                  <th className="py-3.5 px-5 text-right">Total Facturado</th>
                  <th className="py-3.5 px-5 text-right w-32">Auditoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datos.map((item, idx) => {
                  const transaccionesVal = Number(item.transacciones ?? item.total_ventas ?? 0);
                  const totalFacturadoVal = Number(item.total_facturado ?? item.monto_total ?? 0);
                  const esTop = topVendedor && topVendedor.vendedor === item.vendedor && totalFacturadoVal > 0;

                  return (
                    <tr
                      key={`${item.id ?? item.vendedor}-${idx}`}
                      onClick={() => handleAbrirDetalle(item)}
                      title="Haz clic para ver el detalle de ventas y auditoría de este vendedor"
                      className="cursor-pointer hover:bg-slate-50/80 transition-all duration-150 group"
                    >
                      {/* Vendedor */}
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold shrink-0 group-hover:scale-105 transition-transform">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-900 font-semibold group-hover:text-brand transition-colors">
                                {item.vendedor}
                              </span>
                              {esTop && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                                  Top Ventas
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-normal text-slate-400">
                              ID: {item.id ?? "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Transacciones Realizadas */}
                      <td className="py-3.5 px-5 text-center font-medium text-slate-700">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100/80 text-slate-800 font-semibold text-xs">
                          {`${transaccionesVal} transacciones`}
                        </span>
                      </td>

                      {/* Total Facturado */}
                      <td className="py-3.5 px-5 text-right font-bold font-sans text-slate-950 text-sm">
                        {formatMonto(totalFacturadoVal)}
                      </td>

                      {/* Acción / Auditoría */}
                      <td className="py-3.5 px-5 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand group-hover:text-brand-dark transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver ventas</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/90 font-bold border-t-2 border-slate-200 text-slate-900">
                <tr>
                  <td className="py-4 px-5 uppercase tracking-wider text-[11px] text-slate-800">
                    Total General ({datos.length} {datos.length === 1 ? "vendedor" : "vendedores"})
                  </td>
                  <td className="py-4 px-5 text-center font-bold text-slate-800">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-200/70 text-slate-900 font-bold text-xs">
                      {`${totalGeneralTransacciones} transacciones`}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right font-bold font-sans text-slate-950 text-base">
                    {formatMonto(totalGeneralFacturado)}
                  </td>
                  <td className="py-4 px-5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          DRAWER LATERAL DE AUDITORÍA: DETALLE DE VENTAS POR VENDEDOR
          ========================================================================= */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-vendedor-titulo"
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Overlay oscuro de fondo */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
              {/* Encabezado del Drawer */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2
                      id="drawer-vendedor-titulo"
                      className="text-base font-bold text-slate-900 tracking-tight"
                    >
                      {vendedorSeleccionado?.vendedor || "Detalle de Ventas"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Período: {formatDateLegible(desde)} al {formatDateLegible(hasta)}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Cerrar panel (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tarjeta de Resumen Rápido del Vendedor dentro del Drawer */}
              {vendedorSeleccionado && (
                <div className="px-5 py-3.5 bg-slate-50/50 border-b border-slate-100 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Transacciones Realizadas
                    </span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                      {`${vendedorSeleccionado.transacciones ?? vendedorSeleccionado.total_ventas ?? 0} transacciones`}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Total Facturado
                    </span>
                    <span className="text-sm font-bold font-sans text-brand mt-0.5 block">
                      {formatMonto(
                        vendedorSeleccionado.total_facturado ?? vendedorSeleccionado.monto_total
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Contenido scrolleable del Drawer: Lista de Ventas */}
              <div className="flex-1 overflow-y-auto p-5">
                {isLoadingDetalle ? (
                  <div className="py-20 text-center text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin text-brand mx-auto mb-2" />
                    <p className="text-xs">Cargando ventas de este vendedor...</p>
                  </div>
                ) : errorDetalle ? (
                  <div className="p-6 text-center bg-rose-50 rounded-2xl border border-rose-200">
                    <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
                    <p className="text-xs text-rose-700 font-semibold">{errorDetalle}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        vendedorSeleccionado && handleAbrirDetalle(vendedorSeleccionado)
                      }
                      className="mt-3 text-xs border-rose-300 text-rose-800"
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : ventasVendedor.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <Receipt className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      Sin ventas registradas
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                      Este vendedor no registró ventas en el período del {desde} al {hasta}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                      <span className="font-semibold text-slate-700">
                        {ventasVendedor.length}{" "}
                        {ventasVendedor.length === 1 ? "venta registrada" : "ventas registradas"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Ordenadas cronológicamente
                      </span>
                    </div>

                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 px-3.5">N° Factura</th>
                            <th className="py-2.5 px-3.5">Fecha y Hora</th>
                            <th className="py-2.5 px-3.5">Cliente</th>
                            <th className="py-2.5 px-3.5 text-right">Total</th>
                            <th className="py-2.5 px-3.5 text-center">Estado</th>
                            <th className="py-2.5 px-3.5 text-center w-12">PDF</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ventasVendedor.map((v) => {
                            const isActiva = Boolean(v.estado_activa);

                            return (
                              <tr
                                key={v.id}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                {/* N° Factura */}
                                <td className="py-3 px-3.5 font-bold font-mono text-slate-900 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{v.numero_factura}</span>
                                  </div>
                                </td>

                                {/* Fecha y Hora */}
                                <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap text-[11px]">
                                  {formatDateTimeLegible(v.created_at || v.fecha)}
                                </td>

                                {/* Cliente */}
                                <td className="py-3 px-3.5 text-slate-700 font-medium max-w-[130px] truncate">
                                  {v.cliente_nombre || "Consumidor final"}
                                </td>

                                {/* Total de la Venta */}
                                <td className="py-3 px-3.5 text-right font-bold font-sans text-slate-900 whitespace-nowrap">
                                  {formatMonto(v.total)}
                                </td>

                                {/* Estado */}
                                <td className="py-3 px-3.5 text-center whitespace-nowrap">
                                  {isActiva ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Activa
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                                      <AlertCircle className="w-3 h-3 text-rose-600" />
                                      Anulada
                                    </span>
                                  )}
                                </td>

                                {/* Botón Imprimir PDF */}
                                <td className="py-3 px-3.5 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleImprimirVenta(v.id)}
                                    disabled={imprimiendoId === v.id}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer disabled:opacity-50"
                                    title="Ver comprobante en PDF"
                                  >
                                    {imprimiendoId === v.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                                    ) : (
                                      <Printer className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Pie del Drawer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
                <span>BottleTrack Auditoría de Ventas</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDrawerOpen(false)}
                  className="text-xs h-8"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
