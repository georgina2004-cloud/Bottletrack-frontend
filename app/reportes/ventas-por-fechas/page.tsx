"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { obtenerReporteVentasPorFechas } from "@/lib/api";
import { ReporteVentaPorFecha } from "@/types/reporte";
import { useMoneda } from "@/lib/currency";
import { ReportesHeader } from "@/components/reportes/ReportesHeader";
import { FiltrosFecha } from "@/components/reportes/FiltrosFecha";
import { Calendar, Loader2, DollarSign } from "lucide-react";

import { formatDateLegible } from "@/lib/formatDate";

export default function VentasPorFechasPage() {
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

  const [ventas, setVentas] = useState<ReporteVentaPorFecha[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await obtenerReporteVentasPorFechas({ desde, hasta }, token);
      setVentas(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al cargar ventas por fechas."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, desde, hasta]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const totalSubtotal = ventas.reduce(
    (acc, curr) => acc + (Number(curr.subtotal) || 0),
    0
  );
  const totalImpuesto = ventas.reduce(
    (acc, curr) => acc + (Number(curr.impuesto) || 0),
    0
  );
  const totalDescuento = ventas.reduce(
    (acc, curr) => acc + (Number(curr.descuento) || 0),
    0
  );
  const totalFacturado = ventas.reduce(
    (acc, curr) => acc + (Number(curr.total) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <ReportesHeader
        title="Ventas por Rango de Fechas"
        description="Consolidado cronológico de facturación, desglose de subtotales, IVA cobrado y descuentos."
        tipo="ventas-por-fechas"
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
            <span className="text-xs">Cargando ventas del período...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">{error}</div>
        ) : ventas.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">No se encontraron ventas para las fechas seleccionadas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Factura</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">IVA (15%)</th>
                  <th className="py-3 px-4 text-right">Descuento</th>
                  <th className="py-3 px-4 text-right">Total Facturado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{v.numero_factura}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {formatDateLegible(v.fecha)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {v.cliente_nombre || (typeof v.cliente === "string" ? v.cliente : "Consumidor Final")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatMonto(v.subtotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatMonto(v.impuesto)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      {Number(v.descuento) > 0 ? `-${formatMonto(v.descuento)}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatMonto(v.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/90 font-bold border-t-2 border-slate-200 text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3.5 px-4 uppercase tracking-wider text-[11px] text-slate-800">
                    Total Facturado ({ventas.length} ventas)
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {formatMonto(totalSubtotal)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {formatMonto(totalImpuesto)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-700">
                    {totalDescuento > 0 ? `-${formatMonto(totalDescuento)}` : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-950 text-base">
                    {formatMonto(totalFacturado)}
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
