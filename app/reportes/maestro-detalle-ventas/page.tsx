"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { obtenerReporteMaestroDetalleVentas } from "@/lib/api";
import { ReporteMaestroDetalleVenta } from "@/types/reporte";
import { useMoneda } from "@/lib/currency";
import { ReportesHeader } from "@/components/reportes/ReportesHeader";
import { FiltrosFecha } from "@/components/reportes/FiltrosFecha";
import {
  Receipt,
  Loader2,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  DollarSign,
} from "lucide-react";

import { formatDateLegible } from "@/lib/formatDate";

export default function MaestroDetalleVentasPage() {
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

  const [maestroVentas, setMaestroVentas] = useState<ReporteMaestroDetalleVenta[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filasExpandidas, setFilasExpandidas] = useState<Record<string, boolean>>({});

  const cargarDatos = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await obtenerReporteMaestroDetalleVentas({ desde, hasta }, token);
      setMaestroVentas(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el reporte maestro-detalle."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, desde, hasta]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const toggleFilaExpandida = (facturaKey: string) => {
    setFilasExpandidas((prev) => ({
      ...prev,
      [facturaKey]: !prev[facturaKey],
    }));
  };

  const totalFacturadoMaestro = maestroVentas.reduce(
    (acc, v) => acc + (Number(v.total_venta || v.total) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <ReportesHeader
        title="Maestro-Detalle de Ventas"
        description="Desglose pormenorizado de transacciones con clientes, vendedores y detalle de productos facturados."
        tipo="maestro-detalle-ventas"
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
            <span className="text-xs">Cargando reporte maestro-detalle...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">{error}</div>
        ) : maestroVentas.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">No se encontraron ventas para el período seleccionado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-8"></th>
                  <th className="py-3 px-4">Factura</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4 text-right">Total Facturado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maestroVentas.map((v, idx) => {
                  const keyFactura = v.factura || v.numero_factura || `factura-${idx}`;
                  const isExpandida = Boolean(filasExpandidas[keyFactura]);
                  const tieneDetalles = Boolean(v.detalles && v.detalles.length > 0);

                  return (
                    <React.Fragment key={keyFactura}>
                      <tr
                        onClick={() => tieneDetalles && toggleFilaExpandida(keyFactura)}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          tieneDetalles ? "cursor-pointer" : ""
                        } ${isExpandida ? "bg-slate-50/90 font-medium" : ""}`}
                      >
                        <td className="py-3 px-4 text-slate-400 text-center">
                          {tieneDetalles &&
                            (isExpandida ? (
                              <ChevronUp className="w-4 h-4 text-brand" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            ))}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          #{keyFactura}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {formatDateLegible(v.fecha)}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {v.cliente || "Consumidor Final"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{v.vendedor || "N/A"}</td>
                        <td className="py-3 px-4 text-right font-bold font-sans text-slate-900 text-sm">
                          {formatMonto(v.total_venta || v.total)}
                        </td>
                      </tr>

                      {/* Filas Hijas Expandidas */}
                      {isExpandida && tieneDetalles && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/40 px-6 py-3 border-b border-slate-100">
                            <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs space-y-2">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                Artículos Facturados ({v.detalles!.length})
                              </span>
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                                    <th className="pb-1.5 font-semibold">Producto</th>
                                    <th className="pb-1.5 text-center font-semibold">Cantidad</th>
                                    <th className="pb-1.5 text-right font-semibold">P. Unitario</th>
                                    <th className="pb-1.5 text-right font-semibold">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-slate-700">
                                  {v.detalles!.map((det, dIdx) => {
                                    const nombreProd =
                                      typeof det.producto === "object" && det.producto
                                        ? det.producto.nombre
                                        : det.producto_nombre ||
                                          (typeof det.producto === "string"
                                            ? det.producto
                                            : `Producto #${det.producto_id || dIdx + 1}`);

                                    return (
                                      <tr key={det.id || dIdx}>
                                        <td className="py-1.5 font-medium text-slate-900">
                                          {nombreProd}
                                        </td>
                                        <td className="py-1.5 text-center font-bold">{det.cantidad}</td>
                                        <td className="py-1.5 text-right font-mono text-slate-500">
                                          {formatMonto(det.precio_unitario)}
                                        </td>
                                        <td className="py-1.5 text-right font-mono font-semibold text-slate-900">
                                          {formatMonto(det.subtotal)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/90 font-bold border-t-2 border-slate-200 text-slate-900">
                <tr>
                  <td colSpan={5} className="py-3.5 px-4 uppercase tracking-wider text-[11px] text-slate-800">
                    Total Facturado ({maestroVentas.length} transacciones)
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold font-sans text-slate-950 text-base">
                    {formatMonto(totalFacturadoMaestro)}
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
