"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { obtenerReporteGanancias } from "@/lib/api";
import { ReporteGananciaItem } from "@/types/reporte";
import { formatDateLegible } from "@/lib/formatDate";
import { ReportesHeader } from "@/components/reportes/ReportesHeader";
import { FiltrosFecha } from "@/components/reportes/FiltrosFecha";
import { Button } from "@/components/ui/Button";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  Calendar,
  ChevronDown,
} from "lucide-react";

/**
 * Función auxiliar para formatear la moneda oficial en córdobas.
 * Formato requerido: "C$ 1,234.50" (con soporte para valores negativos "-C$ 400.00").
 */
function formatMonto(monto: number | string | undefined | null): string {
  if (monto === null || monto === undefined || monto === "") return "C$ 0.00";
  const num = typeof monto === "number" ? monto : parseFloat(String(monto));
  if (isNaN(num)) return "C$ 0.00";

  const esNegativo = num < 0;
  const formattedNumber = Math.abs(num).toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${esNegativo ? "-" : ""}C$ ${formattedNumber}`;
}

/**
 * Función auxiliar para formatear la etiqueta del periodo (Día o Mes) de forma legible en español.
 */
function formatPeriodo(periodoStr: string, agrupar: "dia" | "mes"): string {
  if (!periodoStr) return "—";

  // Si está agrupado por mes y viene en formato YYYY-MM
  if (agrupar === "mes" && /^\d{4}-\d{2}$/.test(periodoStr)) {
    const [year, month] = periodoStr.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    const formatted = new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  // Formato estándar YYYY-MM-DD
  return formatDateLegible(periodoStr);
}

export default function GananciasPage() {
  const { token } = useAuth();

  // 1. Estados de Filtros: Por defecto desde el primer día del mes actual hasta hoy
  const [desde, setDesde] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [hasta, setHasta] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [agrupar, setAgrupar] = useState<"dia" | "mes">("dia");

  // 2. Estados de Datos, Carga y Error
  const [datos, setDatos] = useState<ReporteGananciaItem[]>([]);
  const [totalIngresos, setTotalIngresos] = useState<number>(0);
  const [totalCosto, setTotalCosto] = useState<number>(0);
  const [totalGanancia, setTotalGanancia] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Validación de fechas en línea: "hasta" no debe ser menor que "desde"
  const errorFechas = useMemo(() => {
    if (!desde || !hasta) return null;
    if (hasta < desde) {
      return "La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'.";
    }
    return null;
  }, [desde, hasta]);

  // 3. Fetch de Datos del Endpoint GET /api/reportes/ganancias
  const cargarDatos = useCallback(async () => {
    if (!token) return;
    if (errorFechas) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await obtenerReporteGanancias(
        {
          desde,
          hasta,
          agrupar,
        },
        token
      );

      const items = res.data || [];
      setDatos(items);

      // Usar los totales consolidados devueltos por el backend, con fallback a cálculo acumulado
      const sumIngresos =
        res.total_ingresos !== undefined && res.total_ingresos !== null
          ? Number(res.total_ingresos)
          : items.reduce((acc, curr) => acc + (Number(curr.ingresos) || 0), 0);

      const sumCosto =
        res.total_costo !== undefined && res.total_costo !== null
          ? Number(res.total_costo)
          : items.reduce((acc, curr) => acc + (Number(curr.costo) || 0), 0);

      const sumGanancia =
        res.total_ganancia !== undefined && res.total_ganancia !== null
          ? Number(res.total_ganancia)
          : items.reduce((acc, curr) => acc + (Number(curr.ganancia) || 0), 0);

      setTotalIngresos(sumIngresos);
      setTotalCosto(sumCosto);
      setTotalGanancia(sumGanancia);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar el reporte de ganancias por periodo."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, desde, hasta, agrupar, errorFechas]);

  // Carga inicial al montar el componente
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Restablecer filtros a valores por defecto
  const handleLimpiarFiltros = () => {
    const d = new Date();
    setDesde(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    setHasta(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
    setAgrupar("dia");
  };

  return (
    <div className="space-y-6">
      {/* 1. Encabezado estándar con Breadcrumb y Botones de Exportación PDF / Excel */}
      <ReportesHeader
        title="Ganancias por Periodo"
        description="Comparativa de ingresos por ventas, costos de adquisición de mercancía y margen neto de ganancia."
        tipo="ganancias"
        desde={desde}
        hasta={hasta}
        extraFiltros={{ agrupar }}
      />

      {/* 2. Filtros de Fecha y Agrupación con Validación en Línea */}
      <div className="space-y-2">
        <FiltrosFecha
          desde={desde}
          hasta={hasta}
          onDesdeChange={setDesde}
          onHastaChange={setHasta}
          onFiltrar={cargarDatos}
          onLimpiar={handleLimpiarFiltros}
          isLoading={isLoading}
          mostrarBoton={false}
          disabled={Boolean(errorFechas)}
        >
          {/* Selector de Agrupación: Día o Mes */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="filtro-agrupar"
              className="text-slate-500 font-medium whitespace-nowrap"
            >
              Agrupar por:
            </label>
            <div className="relative">
              <select
                id="filtro-agrupar"
                value={agrupar}
                onChange={(e) => setAgrupar(e.target.value as "dia" | "mes")}
                className="pl-2.5 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand shadow-2xs cursor-pointer appearance-none min-w-[100px]"
              >
                <option value="dia">Día</option>
                <option value="mes">Mes</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </FiltrosFecha>

        {/* Mensaje de validación en línea si la fecha 'hasta' es menor que 'desde' */}
        {errorFechas && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorFechas}</span>
          </div>
        )}
      </div>

      {/* 3. Tres Tarjetas de Resumen KPI (1 col en móvil, 3 cols en escritorio) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Total Ingresos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Ingresos
            </p>
            <p className="text-xl font-bold font-sans text-slate-900 mt-1">
              {formatMonto(totalIngresos)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Facturación en el rango seleccionado
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Total Costo */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Costo
            </p>
            <p className="text-xl font-bold font-sans text-slate-900 mt-1">
              {formatMonto(totalCosto)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Costo de adquisición de productos
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Total Ganancia / Pérdida (Verde si es positiva, roja si es negativa) */}
        <div
          className={`bg-white p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
            totalGanancia >= 0 ? "border-emerald-200/80" : "border-rose-200/80"
          }`}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Ganancia / Pérdida
            </p>
            <p
              className={`text-xl font-bold font-sans mt-1 ${
                totalGanancia >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatMonto(totalGanancia)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalGanancia >= 0 ? "Margen neto positivo (ganancia)" : "Margen deficitario (pérdida)"}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              totalGanancia >= 0
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {totalGanancia >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* 4. Tabla de Detalle con Scroll Horizontal en Móvil */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          /* Estado Cargando */
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-3" />
            <span className="text-xs font-medium">Calculando ganancias y pérdidas del periodo...</span>
          </div>
        ) : error ? (
          /* Estado Error */
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
              className="mt-3 text-xs cursor-pointer"
            >
              Reintentar
            </Button>
          </div>
        ) : datos.length === 0 ? (
          /* Estado Vacío */
          <div className="py-16 text-center text-slate-400">
            <Calendar className="w-9 h-9 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">
              No hay ventas en el rango seleccionado.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Prueba cambiando las fechas o el criterio de agrupación.
            </p>
          </div>
        ) : (
          /* Tabla de Resultados */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-5">Periodo</th>
                  <th className="py-3.5 px-5 text-right">Ingresos</th>
                  <th className="py-3.5 px-5 text-right">Costo</th>
                  <th className="py-3.5 px-5 text-right">Ganancia / Pérdida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datos.map((item, idx) => {
                  const ingresosNum = Number(item.ingresos || 0);
                  const costoNum = Number(item.costo || 0);
                  const gananciaNum = Number(item.ganancia || 0);
                  const esPositiva = gananciaNum >= 0;

                  return (
                    <tr
                      key={`${item.periodo}-${idx}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Periodo */}
                      <td className="py-3.5 px-5 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <span>{formatPeriodo(item.periodo, agrupar)}</span>
                        </div>
                      </td>

                      {/* Ingresos */}
                      <td className="py-3.5 px-5 text-right font-medium font-sans text-slate-900 whitespace-nowrap">
                        {formatMonto(ingresosNum)}
                      </td>

                      {/* Costo */}
                      <td className="py-3.5 px-5 text-right font-medium font-sans text-slate-600 whitespace-nowrap">
                        {formatMonto(costoNum)}
                      </td>

                      {/* Ganancia */}
                      <td
                        className={`py-3.5 px-5 text-right font-bold font-sans whitespace-nowrap ${
                          esPositiva ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {formatMonto(gananciaNum)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/90 font-bold border-t-2 border-slate-200 text-slate-900">
                <tr>
                  <td className="py-4 px-5 uppercase tracking-wider text-[11px] text-slate-800">
                    Total General ({datos.length}{" "}
                    {datos.length === 1
                      ? agrupar === "mes"
                        ? "mes"
                        : "día"
                      : agrupar === "mes"
                      ? "meses"
                      : "días"}
                    )
                  </td>
                  <td className="py-4 px-5 text-right font-bold font-sans text-slate-950 text-sm">
                    {formatMonto(totalIngresos)}
                  </td>
                  <td className="py-4 px-5 text-right font-bold font-sans text-slate-700 text-sm">
                    {formatMonto(totalCosto)}
                  </td>
                  <td
                    className={`py-4 px-5 text-right font-extrabold font-sans text-base ${
                      totalGanancia >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatMonto(totalGanancia)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
