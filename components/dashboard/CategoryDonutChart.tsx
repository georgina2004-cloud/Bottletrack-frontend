"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ResponsivePie } from "@nivo/pie";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { usePaletaMarca } from "@/lib/colorPalette";
import { obtenerResumenInventario } from "@/lib/api";
import { CategoriaInventario } from "@/types/dashboard";

interface CategoryDonutChartProps {
  data?: CategoriaInventario[];
  isLoading?: boolean;
  isError?: boolean;
}

export function CategoryDonutChart({
  data: dataProp,
  isLoading: isLoadingProp,
  isError: isErrorProp = false,
}: CategoryDonutChartProps) {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<CategoriaInventario[]>([]);
  const [isLoadingFetch, setIsLoadingFetch] = useState<boolean>(true);
  const [isErrorFetch, setIsErrorFetch] = useState<boolean>(false);

  // Paleta dinámica basada en el color de marca de la empresa
  const numCategorias = useMemo(
    () => Math.max(categorias.filter((c) => Number(c.total) > 0).length, 5),
    [categorias]
  );
  const { paleta: paletaEmpresa } = usePaletaMarca(numCategorias);

  // Fetch real de productos por categoría desde GET /api/dashboard/resumen-inventario
  useEffect(() => {
    if (dataProp !== undefined) {
      setCategorias(dataProp);
      setIsLoadingFetch(false);
      return;
    }

    let isMounted = true;

    async function cargarDatos() {
      setIsLoadingFetch(true);
      setIsErrorFetch(false);

      try {
        const resumen = await obtenerResumenInventario(token);
        if (!isMounted) return;

        if (resumen && Array.isArray(resumen.productos_por_categoria)) {
          setCategorias(resumen.productos_por_categoria);
        } else {
          setIsErrorFetch(true);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error al cargar productos por categoría:", error);
        setIsErrorFetch(true);
      } finally {
        if (isMounted) {
          setIsLoadingFetch(false);
        }
      }
    }

    cargarDatos();

    return () => {
      isMounted = false;
    };
  }, [token, dataProp]);

  const isLoading = isLoadingProp !== undefined ? isLoadingProp : isLoadingFetch;
  const isError = isErrorProp || isErrorFetch;

  // Suma total de todos los productos de inventario
  const totalProductos = useMemo(() => {
    return categorias.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  }, [categorias]);

  // Datos estructurados con colores asignados de la marca y porcentajes calculados
  const chartData = useMemo(() => {
    return categorias
      .filter((item) => Number(item.total) > 0)
      .map((item, index) => {
        const color =
          paletaEmpresa && paletaEmpresa.length > 0
            ? paletaEmpresa[index % paletaEmpresa.length]
            : "#171717";
        const cantidad = Number(item.total) || 0;
        const porcentaje =
          totalProductos > 0
            ? Number(((cantidad / totalProductos) * 100).toFixed(1))
            : 0;

        return {
          id: item.categoria,
          label: item.categoria,
          value: cantidad,
          categoria: item.categoria,
          cantidad,
          porcentaje,
          color,
        };
      });
  }, [categorias, totalProductos, paletaEmpresa]);

  // Tema personalizado de Nivo usando Inter y colores del sistema
  const nivoTheme = useMemo(
    () => ({
      text: {
        fontFamily: "var(--font-sans, Inter, sans-serif)",
        fontSize: 11,
        fill: "#64748B",
      },
      labels: {
        text: {
          fontFamily: "var(--font-sans, Inter, sans-serif)",
          fontSize: 11,
          fontWeight: 700,
        },
      },
    }),
    []
  );

  // Layer central personalizado para Nivo Pie (TOTAL / número / productos)
  const CenteredMetricLayer = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ({ centerX, centerY }: any) => {
      return (
        <g key="centered-metric-donut" className="select-none pointer-events-none">
          <text
            x={centerX}
            y={centerY - 16}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#94A3B8"
            fontSize="9px"
            fontWeight="bold"
            letterSpacing="0.1em"
          >
            TOTAL
          </text>
          <text
            x={centerX}
            y={centerY + 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#0F172A"
            fontSize="22px"
            fontWeight="800"
            fontFamily="var(--font-sans, Inter, sans-serif)"
          >
            {totalProductos.toLocaleString("es-NI")}
          </text>
          <text
            x={centerX}
            y={centerY + 19}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#94A3B8"
            fontSize="10px"
            fontWeight="500"
          >
            productos
          </text>
        </g>
      );
    };
  }, [totalProductos]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="mb-2">
        <h3 className="text-base font-bold text-[#18181B]">
          Productos por Categoría
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Distribución de productos en inventario
        </p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-brand" />
          <p className="text-xs text-slate-400">
            Cargando productos por categoría...
          </p>
        </div>
      ) : isError || chartData.length === 0 || totalProductos === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center px-4">
          <p className="text-xs text-slate-500 font-medium">
            Sin datos para este período
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          {/* Donut Centrado Arriba */}
          <div className="w-full h-[180px] flex items-center justify-center py-1">
            <div className="w-[180px] h-[180px]">
              <ResponsivePie
                data={chartData}
                theme={nivoTheme}
                innerRadius={0.58}
                padAngle={2}
                cornerRadius={3}
                activeOuterRadiusOffset={4}
                colors={(datum) => datum.data.color}
                borderWidth={2}
                borderColor="#FFFFFF"
                enableArcLinkLabels={false}
                enableArcLabels={true}
                arcLabel={(d) => `${d.value}`}
                arcLabelsTextColor="#FFFFFF"
                arcLabelsRadiusOffset={0.5}
                arcLabelsSkipAngle={0}
                margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
                layers={["arcs", "arcLabels", CenteredMetricLayer]}
                tooltip={({ datum }) => (
                  <div className="bg-white p-2.5 rounded-xl shadow-lg border border-slate-200/80 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: datum.color }}
                      />
                      <p className="font-bold text-slate-900">{datum.id}</p>
                    </div>
                    <div className="space-y-0.5 text-slate-700">
                      <p className="font-semibold text-slate-900">
                        {datum.value.toLocaleString("es-NI")} productos
                      </p>
                      <p className="text-slate-500">
                        {datum.data.porcentaje}% del total
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Leyenda Abajo */}
          <div className="w-full pt-3 mt-2 border-t border-slate-100 max-h-[160px] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {chartData.map((item) => (
                <div
                  key={item.categoria}
                  className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-slate-50 transition-colors gap-1.5"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-slate-700 text-xs truncate" title={item.categoria}>
                      {item.categoria}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-semibold text-slate-700 text-xs tabular-nums font-mono">
                      {item.porcentaje}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const CategorySalesPieChart = CategoryDonutChart;
export const CategoryPieChart = CategoryDonutChart;
