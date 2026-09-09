"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { obtenerReporteStockBajo } from "@/lib/api";
import { ReporteStockBajo } from "@/types/reporte";
import { ReportesHeader } from "@/components/reportes/ReportesHeader";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export default function StockBajoPage() {
  const { token } = useAuth();
  const [stockBajoDetalle, setStockBajoDetalle] = useState<ReporteStockBajo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await obtenerReporteStockBajo({}, token);
      setStockBajoDetalle(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al consultar productos con stock bajo."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return (
    <div className="space-y-6">
      <ReportesHeader
        title="Stock Bajo & Alertas"
        description="Listado de botellas y productos por debajo del umbral mínimo configurado que requieren reorden urgente."
        tipo="stock-bajo"
        badge={stockBajoDetalle.length > 0 ? `${stockBajoDetalle.length} en riesgo` : undefined}
      />

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto mb-2" />
            <span className="text-xs">Evaluando niveles de inventario...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">{error}</div>
        ) : stockBajoDetalle.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              ¡Inventario en niveles óptimos!
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              No existen productos por debajo del umbral mínimo de stock.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Producto en Riesgo</th>
                  <th className="py-3 px-4 text-center">Stock Actual</th>
                  <th className="py-3 px-4 text-center">Stock Mínimo</th>
                  <th className="py-3 px-4 text-center">Déficit</th>
                  <th className="py-3 px-4 text-center">Criticidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockBajoDetalle.map((item) => {
                  const deficit =
                    item.deficit !== undefined
                      ? item.deficit
                      : Math.max(0, item.stock_minimo - item.stock_actual);
                  const isCritical = item.stock_actual <= 0;

                  return (
                    <tr key={item.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">#{item.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.nombre}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-700">
                        {item.stock_actual}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-semibold">
                        {item.stock_minimo}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-700">
                        -{deficit} uds
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isCritical
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {isCritical ? "Crítico (Agotado)" : "Alerta de Reorden"}
                        </span>
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
