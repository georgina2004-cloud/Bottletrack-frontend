"use client";

import React, { useMemo } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { TopProductoDashboard } from "@/types/dashboard";
import { usePaletaMarca } from "@/lib/colorPalette";
import { Award, Loader2, PackageOpen } from "lucide-react";

interface TopProductsChartProps {
  products: TopProductoDashboard[];
  isLoading?: boolean;
}

export function TopProductsChart({
  products = [],
  isLoading = false,
}: TopProductsChartProps) {
  // Paleta de colores dinámica con degradación tonal calculada desde el color de marca
  const { colorPrimario, paleta } = usePaletaMarca(Math.max(products.length, 5));

  // Datos estructurados para @nivo/bar invertidos para que el #1 quede arriba
  const nivoData = useMemo(() => {
    return [...products].reverse().map((item) => {
      const origIndex = products.findIndex((p) => p.nombre === item.nombre);
      const colorIndex = origIndex >= 0 ? origIndex : 0;
      return {
        nombre: item.nombre,
        total_vendido: Number(item.total_vendido) || 0,
        color: paleta[colorIndex % paleta.length] || colorPrimario,
      };
    });
  }, [products, paleta, colorPrimario]);

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
    }),
    []
  );

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg shrink-0"
              style={{
                backgroundColor: "color-mix(in srgb, var(--primary-brand) 12%, transparent)",
                color: "var(--primary-brand)",
              }}
            >
              <Award className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-[#18181B]">
              Top 5 Productos Más Vendidos
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Licores con mayor volumen de salida según ventas registradas
          </p>
        </div>
      </div>

      {/* Chart Content usando @nivo/bar */}
      <div className="w-full flex-1 min-h-[250px] flex flex-col justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 py-12">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: colorPrimario }}
            />
            <p className="text-xs font-medium">Cargando top productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 py-12">
            <PackageOpen className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-medium text-slate-500">
              Aún no hay ventas registradas para este periodo.
            </p>
          </div>
        ) : (
          <div className="w-full h-[250px]">
            <ResponsiveBar
              data={nivoData}
              keys={["total_vendido"]}
              indexBy="nombre"
              layout="horizontal"
              theme={nivoTheme}
              margin={{ top: 8, right: 32, bottom: 24, left: 140 }}
              padding={0.3}
              borderRadius={5}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              colors={(bar: any) => bar.data.color || colorPrimario}
              enableGridX={true}
              enableGridY={false}
              gridXValues={4}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 0,
                tickPadding: 8,
                tickValues: 4,
                format: (val) => `${val} u.`,
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 8,
                format: (name) =>
                  String(name).length > 18
                    ? `${String(name).substring(0, 18)}...`
                    : String(name),
              }}
              enableLabel={true}
              label={(d) => `${d.value}`}
              labelTextColor="#FFFFFF"
              tooltip={({ data }) => (
                <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200/80 text-xs">
                  <p className="font-bold text-slate-900">{data.nombre}</p>
                  <div className="space-y-1 border-t border-slate-100 pt-1.5 text-slate-700 mt-1">
                    <div className="flex justify-between gap-4">
                      <span>Unidades vendidas:</span>
                      <span
                        className="font-bold font-mono"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        style={{ color: (data as any).color || colorPrimario }}
                      >
                        {data.total_vendido}{" "}
                        {data.total_vendido === 1 ? "unidad" : "unidades"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default TopProductsChart;

