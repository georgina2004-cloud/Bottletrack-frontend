"use client";

import React, { useState, useMemo } from "react";
import { ResponsiveLine } from "@nivo/line";
import { PuntoTendencia } from "@/types/dashboard";
import { usePaletaMarca } from "@/lib/colorPalette";
import { useMoneda, formatMoney } from "@/lib/currency";
import { TrendingUp, Loader2 } from "lucide-react";

export type PeriodoTendencia = "7d" | "14d" | "mes";

interface SalesTrendChartProps {
  data: PuntoTendencia[];
  periodo: PeriodoTendencia;
  onPeriodoChange: (periodo: PeriodoTendencia) => void;
  isLoading?: boolean;
}

function formatFechaEje(fechaStr: string): string {
  if (!fechaStr) return "";
  try {
    const parts = fechaStr.split("-").map(Number);
    if (parts.length !== 3) return fechaStr;
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    const dia = date.getDate();
    const mes = date.toLocaleDateString("es-ES", { month: "short" });
    const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1).replace(".", "");
    return `${dia} ${mesCapitalizado}`;
  } catch {
    return fechaStr;
  }
}

function formatFechaCompleta(fechaStr: string): string {
  if (!fechaStr) return "";
  try {
    const parts = fechaStr.split("-").map(Number);
    if (parts.length !== 3) return fechaStr;
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return fechaStr;
  }
}

export function SalesTrendChart({
  data = [],
  periodo,
  onPeriodoChange,
  isLoading = false,
}: SalesTrendChartProps) {
  const [viewMode, setViewMode] = useState<"all" | "ventas" | "compras">("all");
  const { colorPrimario } = usePaletaMarca(6);
  const { moneda } = useMoneda();

  // Estructura de series para @nivo/line
  const nivoSeries = useMemo(() => {
    const series = [];

    if (viewMode === "all" || viewMode === "ventas") {
      series.push({
        id: "Ventas",
        color: colorPrimario,
        data: data.map((d) => ({
          x: formatFechaEje(d.fecha),
          y: Number(d.ventas) || 0,
          fechaReal: d.fecha,
        })),
      });
    }

    if (viewMode === "all" || viewMode === "compras") {
      series.push({
        id: "Compras",
        color: "#64748B",
        data: data.map((d) => ({
          x: formatFechaEje(d.fecha),
          y: Number(d.compras) || 0,
          fechaReal: d.fecha,
        })),
      });
    }

    return series;
  }, [data, viewMode, colorPrimario]);

  // Tema personalizado de Nivo usando Inter y colores del sistema
  const nivoTheme = useMemo(
    () => ({
      text: {
        fontFamily: "var(--font-sans, Inter, sans-serif)",
        fontSize: 11,
        fill: "#64748B",
      },
      grid: {
        line: {
          stroke: "#F1F5F9",
          strokeWidth: 1,
          strokeDasharray: "3 3",
        },
      },
      axis: {
        ticks: {
          text: {
            fontFamily: "var(--font-sans, Inter, sans-serif)",
            fill: "#64748B",
            fontSize: 11,
          },
        },
      },
      crosshair: {
        line: {
          stroke: "#94A3B8",
          strokeWidth: 1,
          strokeDasharray: "4 4",
        },
      },
    }),
    []
  );

  // Layer custom para el Callout / Speech bubble del pico más alto
  const CalloutLayer = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ({ series }: any) => {
      if (viewMode === "compras" || !series || series.length === 0) return null;

      const ventasSerie = series.find((s: { id: string }) => s.id === "Ventas");
      if (!ventasSerie || !ventasSerie.data || ventasSerie.data.length === 0) return null;

      // Buscar punto con mayor valor en ventas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let maxPoint: any = null;
      let maxVal = -1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ventasSerie.data.forEach((p: any) => {
        const val = Number(p.data.y);
        if (val > maxVal) {
          maxVal = val;
          maxPoint = p;
        }
      });

      if (!maxPoint || maxVal <= 0) return null;

      const cx = maxPoint.position.x;
      const cy = maxPoint.position.y;
      const labelText = formatMoney(maxVal, moneda);
      const bubbleWidth = Math.max(labelText.length * 8 + 18, 76);
      const bubbleHeight = 26;
      const bubbleX = cx - bubbleWidth / 2;
      const bubbleY = cy - bubbleHeight - 12;

      return (
        <g key="callout-max-sales" className="select-none pointer-events-none">
          {/* Anillo de resalte en el punto */}
          <circle cx={cx} cy={cy} r={8} fill={colorPrimario} fillOpacity={0.2} />
          <circle cx={cx} cy={cy} r={5} fill={colorPrimario} stroke="#FFFFFF" strokeWidth={2} />

          {/* Globo Speech bubble con flecha apuntando hacia abajo */}
          <g transform={`translate(${bubbleX}, ${bubbleY})`}>
            <rect
              width={bubbleWidth}
              height={bubbleHeight}
              rx={7}
              ry={7}
              fill="#18181B"
              stroke={colorPrimario}
              strokeWidth={1.5}
              className="drop-shadow-md"
            />
            <polygon
              points={`${bubbleWidth / 2 - 5},${bubbleHeight} ${bubbleWidth / 2 + 5},${bubbleHeight} ${bubbleWidth / 2},${bubbleHeight + 6}`}
              fill="#18181B"
            />
            <text
              x={bubbleWidth / 2}
              y={bubbleHeight / 2 + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#FFFFFF"
              fontSize={11}
              fontWeight="bold"
              fontFamily="monospace"
            >
              {labelText}
            </text>
          </g>
        </g>
      );
    };
  }, [viewMode, colorPrimario, moneda]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col h-full relative">
      {/* Header with Title and Mode Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-4">
        <div className="shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg shrink-0"
              style={{
                backgroundColor: "color-mix(in srgb, var(--primary-brand) 12%, transparent)",
                color: "var(--primary-brand)",
              }}
            >
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-[#18181B] whitespace-nowrap">
              Tendencia de Ventas y Compras
            </h3>
            {isLoading && (
              <Loader2
                className="w-3.5 h-3.5 animate-spin shrink-0"
                style={{ color: "var(--primary-brand)" }}
              />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comportamiento de ingresos vs costos de adquisición en el tiempo
          </p>
        </div>

        {/* Selector de Período (7 días / 14 días / Este Mes) */}
        <div className="inline-flex p-0.5 bg-slate-100/90 rounded-xl text-xs font-medium border border-slate-200/60 shadow-2xs h-[34px] items-center shrink-0">
          <button
            type="button"
            onClick={() => onPeriodoChange("7d")}
            className={`h-full px-3 flex items-center justify-center rounded-lg transition-all cursor-pointer text-center ${
              periodo === "7d"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            7 días
          </button>
          <button
            type="button"
            onClick={() => onPeriodoChange("14d")}
            className={`h-full px-3 flex items-center justify-center rounded-lg transition-all cursor-pointer text-center ${
              periodo === "14d"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            14 días
          </button>
          <button
            type="button"
            onClick={() => onPeriodoChange("mes")}
            className={`h-full px-3 flex items-center justify-center rounded-lg transition-all cursor-pointer text-center ${
              periodo === "mes"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Este Mes
          </button>
        </div>
      </div>

      {/* Chart Area con transición suave de carga usando @nivo/line */}
      <div
        className={`w-full h-72 sm:h-80 transition-opacity duration-200 ${
          isLoading ? "opacity-60" : "opacity-100"
        }`}
      >
        {data.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
            <p>No se encontraron movimientos registrados en este período.</p>
          </div>
        ) : (
          <ResponsiveLine
            data={nivoSeries}
            theme={nivoTheme}
            margin={{ top: 32, right: 18, bottom: 28, left: 56 }}
            xScale={{ type: "point" }}
            yScale={{
              type: "linear",
              min: 0,
              max: "auto",
              stacked: false,
            }}
            curve="monotoneX"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 0,
              tickPadding: 10,
              tickRotation: 0,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 8,
              tickRotation: 0,
              format: (val) =>
                `${moneda} ${Number(val) >= 1000 ? `${(Number(val) / 1000).toFixed(1)}k` : val}`,
            }}
            enableGridX={false}
            enableGridY={true}
            gridYValues={5}
            colors={(serie) => serie.color}
            lineWidth={2.5}
            enableArea={true}
            areaOpacity={0.14}
            enablePoints={true}
            pointSize={5}
            pointColor={{ from: "color" }}
            pointBorderWidth={2}
            pointBorderColor="#FFFFFF"
            enableCrosshair={true}
            crosshairType="x"
            useMesh={true}
            layers={[
              "grid",
              "markers",
              "axes",
              "areas",
              "lines",
              "points",
              "slices",
              "crosshair",
              "mesh",
              CalloutLayer,
            ]}
            tooltip={({ point }) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const datum = point.data as any;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const pt = point as any;
              const seriesName = pt.seriesId ?? pt.serieId ?? pt.id ?? "Serie";
              const seriesColor = pt.seriesColor ?? pt.serieColor ?? pt.color ?? colorPrimario;

              return (
                <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200/80 text-xs">
                  <p className="font-semibold text-slate-800 mb-1.5 border-b border-slate-100 pb-1 capitalize">
                    {datum.fechaReal ? formatFechaCompleta(datum.fechaReal) : String(datum.x)}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: seriesColor }}
                      />
                      {seriesName}:
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatMoney(Number(point.data.y), moneda)}
                    </span>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

      {/* Legend / Quick Summary */}
      <div className="flex items-center justify-end gap-6 pt-4 border-t border-slate-100 text-xs text-slate-600 mt-2">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colorPrimario }}
          />
          <span>Ventas Realizadas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-500" />
          <span>Reabastecimiento (Compras)</span>
        </div>
      </div>
    </div>
  );
}

export default SalesTrendChart;

