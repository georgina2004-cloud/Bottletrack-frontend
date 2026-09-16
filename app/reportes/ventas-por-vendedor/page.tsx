"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { obtenerReporteVentasPorVendedor } from "@/lib/api";
import { ReporteVentasPorVendedor } from "@/types/reporte";
import { useMoneda } from "@/lib/currency";
import { ReportesHeader } from "@/components/reportes/ReportesHeader";
import { FiltrosFecha } from "@/components/reportes/FiltrosFecha";
import { Users, Loader2, User } from "lucide-react";

export default function VentasPorVendedorPage() {
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

  const [datos, setDatos] = useState<ReporteVentasPorVendedor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await obtenerReporteVentasPorVendedor({ desde, hasta }, token);
      setDatos(res);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al cargar ventas por vendedor."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, desde, hasta]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const totalTransacciones = datos.reduce(
    (acc, curr) => acc + (Number(curr.total_ventas) || 0),
    0
  );
  const totalVendido = datos.reduce(
    (acc, curr) => acc + (Number(curr.monto_total) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <ReportesHeader
        title="Ventas por Vendedor"
        description="Rendimiento del personal de caja/mostrador, volumen de ventas y facturación acumulada."
        tipo="ventas-por-vendedor"
        desde={desde}
        hasta={hasta}
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
            <span className="text-xs">Calculando rendimiento de vendedores...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">{error}</div>
        ) : datos.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">No se encontraron ventas para este período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Vendedor / Cajero</th>
                  <th className="py-3 px-4 text-center">Transacciones Realizadas</th>
                  <th className="py-3 px-4 text-right">Total Facturado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datos.map((item, idx) => (
                  <tr key={`${item.vendedor}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span>{item.vendedor}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {item.total_ventas} transacciones
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-sans text-slate-900 text-sm">
                      {formatMonto(item.monto_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/90 font-bold border-t-2 border-slate-200 text-slate-900">
                <tr>
                  <td className="py-3.5 px-4 uppercase tracking-wider text-[11px] text-slate-800">
                    Total General ({datos.length} vendedores)
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {totalTransacciones} transacciones
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold font-sans text-slate-950 text-base">
                    {formatMonto(totalVendido)}
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
