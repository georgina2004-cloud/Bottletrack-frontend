"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { obtenerReporteMovimientosInventario } from "@/lib/api";
import { ReporteMovimientoInventario } from "@/types/reporte";
import { useMoneda } from "@/lib/currency";
import { ReportesHeader } from "@/components/reportes/ReportesHeader";
import { FiltrosFecha } from "@/components/reportes/FiltrosFecha";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { formatDateTimeLegible } from "@/lib/formatDate";

export default function MovimientosInventarioPage() {
  const { token } = useAuth();
  const { formatMoneda: formatMonto } = useMoneda();

  const [desde, setDesde] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [hasta, setHasta] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const [movimientos, setMovimientos] = useState<ReporteMovimientoInventario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await obtenerReporteMovimientosInventario({ desde, hasta }, token);
      setMovimientos(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al cargar movimientos de inventario."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, desde, hasta]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return (
    <div className="space-y-6">
      <ReportesHeader
        title="Movimientos de Inventario (Kárdex)"
        description="Historial cronológico de entradas y salidas de producto por ventas, compras o ajustes."
        tipo="movimientos-inventario"
        desde={desde}
        hasta={hasta}
        badge={`${movimientos.length} registros`}
      />

      <FiltrosFecha
        desde={desde}
        hasta={hasta}
        onDesdeChange={setDesde}
        onHastaChange={setHasta}
        onFiltrar={cargarDatos}
        isLoading={isLoading}
      />

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto mb-2" />
            <span className="text-xs">Consultando movimientos de kárdex...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">{error}</div>
        ) : movimientos.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ArrowLeftRight className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">No se registraron movimientos en el rango de fechas seleccionado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4 text-right">Precio Unitario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientos.map((m, idx) => {
                  const esEntrada =
                    m.tipo?.toLowerCase() === "entrada" ||
                    m.tipo?.toLowerCase() === "compra" ||
                    m.tipo?.toLowerCase() === "ingreso";

                  return (
                    <tr key={`${m.fecha}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTimeLegible(m.fecha)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-[10px] px-2.5 py-0.5 rounded-full border ${
                            esEntrada
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {esEntrada ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                          )}
                          <span className="capitalize">{m.tipo}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{m.producto}</td>
                      <td
                        className={`py-3 px-4 text-center font-bold font-mono ${
                          esEntrada ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatMonto(m.precio_unitario)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
