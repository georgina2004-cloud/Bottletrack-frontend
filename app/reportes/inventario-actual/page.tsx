"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { obtenerReporteInventarioActual } from "@/lib/api";
import { ReporteInventarioActual } from "@/types/reporte";
import { useMoneda, formatPresentacionMl } from "@/lib/currency";
import { ReportesHeader } from "@/components/reportes/ReportesHeader";
import { Boxes, Loader2, Package } from "lucide-react";

export default function InventarioActualPage() {
  const { token } = useAuth();
  const { formatMoneda: formatMonto } = useMoneda();

  const [productos, setProductos] = useState<ReporteInventarioActual[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await obtenerReporteInventarioActual({}, token);
      setProductos(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el inventario actual."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const totalUnidadesStock = productos.reduce((acc, p) => {
    const s = Number(
      p.stock_actual !== undefined && p.stock_actual !== null
        ? p.stock_actual
        : (p as any).stock !== undefined && (p as any).stock !== null
        ? (p as any).stock
        : (p as any).stockActual ?? (p as any).existencias ?? (p as any).cantidad ?? 0
    );
    return acc + (isNaN(s) ? 0 : s);
  }, 0);

  return (
    <div className="space-y-6">
      <ReportesHeader
        title="Inventario Actual"
        description="Catálogo completo de existencias, marcas, categorías, precios de compra/venta y niveles de stock."
        tipo="inventario-actual"
        badge={`${productos.length} productos`}
      />

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto mb-2" />
            <span className="text-xs">Consultando inventario actual...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">{error}</div>
        ) : productos.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">No hay productos registrados en el inventario.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Marca</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-right">P. Compra</th>
                  <th className="py-3 px-4 text-right">P. Venta</th>
                  <th className="py-3 px-4 text-center">Stock Actual</th>
                  <th className="py-3 px-4 text-center">Stock Mínimo</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productos.map((p) => {
                  const categoriaTexto =
                    typeof p.categoria === "object" && p.categoria
                      ? p.categoria.nombre
                      : p.categoria_nombre || (typeof p.categoria === "string" ? p.categoria : "Sin categoría");
                  
                  const stockActual = Number(
                    p.stock_actual !== undefined && p.stock_actual !== null
                      ? p.stock_actual
                      : (p as any).stock !== undefined && (p as any).stock !== null
                      ? (p as any).stock
                      : (p as any).stockActual ?? (p as any).existencias ?? (p as any).cantidad ?? 0
                  );

                  const stockMinimo = Number(
                    p.stock_minimo !== undefined && p.stock_minimo !== null
                      ? p.stock_minimo
                      : (p as any).stock_min !== undefined && (p as any).stock_min !== null
                      ? (p as any).stock_min
                      : (p as any).stockMinimo ?? (p as any).min_stock ?? 0
                  );

                  const isStockBajo = stockActual <= stockMinimo;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.nombre}
                        {p.presentacion_ml && (
                          <span className="text-slate-400 text-[10px] block font-normal">
                            {formatPresentacionMl(p.presentacion_ml)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.marca || "—"}</td>
                      <td className="py-3 px-4 text-slate-600">{categoriaTexto}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatMonto(p.precio_compra)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatMonto(p.precio_venta)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {stockActual}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {stockMinimo}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block font-bold text-[10px] px-2.5 py-0.5 rounded-full border ${
                            isStockBajo
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isStockBajo ? "Stock Bajo" : "Óptimo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/90 font-bold border-t-2 border-slate-200 text-slate-900">
                <tr>
                  <td colSpan={5} className="py-3.5 px-4 uppercase tracking-wider text-[11px] text-slate-800">
                    Total Catálogo ({productos.length} productos)
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-900 text-sm">
                    {totalUnidadesStock} uds
                  </td>
                  <td colSpan={2} className="py-3.5 px-4 text-center text-slate-400 text-[11px]">
                    —
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
