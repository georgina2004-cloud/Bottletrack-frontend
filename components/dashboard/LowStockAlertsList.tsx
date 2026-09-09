"use client";

import React from "react";
import Link from "next/link";
import { ProductoStockBajo } from "@/types/dashboard";
import {
  AlertOctagon,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

interface LowStockAlertsListProps {
  alerts: ProductoStockBajo[];
  isLoading?: boolean;
  isError?: boolean;
}

export function LowStockAlertsList({
  alerts,
  isLoading = false,
  isError = false,
}: LowStockAlertsListProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-lg ${
                alerts.length > 0 && !isLoading && !isError
                  ? "bg-rose-50 text-rose-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {alerts.length > 0 && !isLoading && !isError ? (
                <AlertOctagon className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </span>
            <h3 className="text-base font-bold text-[#18181B]">
              Alertas de Stock Bajo
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Productos que han alcanzado o superado el umbral mínimo
          </p>
        </div>

        {isLoading ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 animate-pulse">
            Cargando...
          </span>
        ) : isError ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            Error
          </span>
        ) : alerts.length > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
            {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            0 alertas
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4 py-2 flex-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-4 ${
                i !== 1 ? "pt-3 border-t border-slate-100" : ""
              } animate-pulse`}
            >
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-200 rounded w-3/5" />
                <div className="h-2.5 bg-slate-100 rounded w-2/5" />
                <div className="h-1.5 bg-slate-100 rounded-full w-32 mt-2" />
              </div>
              <div className="space-y-1.5 flex flex-col items-end">
                <div className="h-3.5 bg-slate-200 rounded w-12" />
                <div className="h-4 bg-slate-100 rounded w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
          <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-xs font-semibold text-slate-700">
            No se pudieron cargar las alertas de stock
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Verifica la conexión con el servidor
          </p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            No hay productos con stock bajo
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-[250px]">
            Todos los productos del inventario se encuentran por encima de su umbral mínimo de stock.
          </p>
        </div>
      ) : (
        <div className="space-y-3 divide-y divide-slate-100 flex-1">
          {alerts.map((item, idx) => {
            const isZero = item.stock_actual === 0;
            const isCritical =
              isZero || item.stock_actual <= Math.max(1, Math.floor(item.stock_minimo * 0.5));
            const percentage =
              item.stock_minimo > 0
                ? Math.min(100, Math.round((item.stock_actual / item.stock_minimo) * 100))
                : 0;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-4 ${
                  idx !== 0 ? "pt-3" : ""
                } group`}
              >
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                        isCritical ? "bg-rose-500 animate-pulse" : "bg-amber-500"
                      }`}
                    />
                    <h4 className="font-semibold text-slate-900 text-xs truncate">
                      {item.nombre}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-mono">ID #{item.id}</span>
                    <span>•</span>
                    <span>Mín. sugerido: {item.stock_minimo} uds.</span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full max-w-[180px] bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCritical ? "bg-rose-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Stock Count & Action */}
                <div className="text-right shrink-0">
                  <div className="flex items-baseline justify-end gap-1">
                    <span
                      className={`text-sm font-bold ${
                        isCritical ? "text-rose-600" : "text-amber-600"
                      }`}
                    >
                      {item.stock_actual}
                    </span>
                    <span className="text-xs text-slate-400">
                      / {item.stock_minimo} uds.
                    </span>
                  </div>

                  <span
                    className={`inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border mt-1 ${
                      isZero
                        ? "bg-rose-100 text-rose-800 border-rose-300 font-bold"
                        : isCritical
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {isZero ? "Agotado" : isCritical ? "Crítico" : "Reordenar"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Action Footer */}
      <div className="pt-4 border-t border-slate-100 mt-auto">
        <Link
          href="/productos"
          className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-[#D17B00] bg-slate-50 hover:bg-[#D17B00]/5 text-xs font-semibold text-slate-700 hover:text-[#D17B00] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {alerts.length > 0 ? (
            <>
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Gestionar en Inventario</span>
            </>
          ) : (
            <>
              <span>Ver catálogo de inventario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Link>
      </div>
    </div>
  );
}

