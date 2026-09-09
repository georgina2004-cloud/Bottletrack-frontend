"use client";

import React from "react";
import Link from "next/link";
import { UltimaVentaDashboard } from "@/types/dashboard";
import { ReceiptText, ArrowUpRight, Loader2, ShoppingBag } from "lucide-react";
import { useMoneda } from "@/lib/currency";

interface RecentSalesTableProps {
  sales: UltimaVentaDashboard[];
  isLoading?: boolean;
}

export function RecentSalesTable({
  sales = [],
  isLoading = false,
}: RecentSalesTableProps) {
  const { formatMoneda: formatMoney } = useMoneda();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("es-ES", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#D17B00]/10 text-[#D17B00] rounded-lg">
              <ReceiptText className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-[#18181B]">
              Últimas 5 Ventas
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Transacciones recientes en punto de venta y facturación
          </p>
        </div>

        <Link
          href="/ventas"
          className="text-xs font-semibold text-[#D17B00] hover:text-[#b56900] flex items-center gap-1 hover:underline cursor-pointer"
        >
          <span>Ver todas</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="pb-3 pr-4 font-semibold">Factura</th>
              <th className="pb-3 px-4 font-semibold">Cliente</th>
              <th className="pb-3 px-4 font-semibold">Vendedor</th>
              <th className="pb-3 px-4 font-semibold text-right">Fecha</th>
              <th className="pb-3 pl-4 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#D17B00]" />
                    <span className="text-xs">Cargando últimas ventas...</span>
                  </div>
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-slate-300" />
                    <span className="text-xs">
                      No se han registrado ventas recientemente.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Factura */}
                  <td className="py-3.5 pr-4 font-mono font-medium text-slate-800 group-hover:text-[#D17B00]">
                    #{sale.numero_factura}
                  </td>

                  {/* Cliente */}
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    {sale.cliente_nombre && sale.cliente_nombre.trim() !== ""
                      ? sale.cliente_nombre
                      : "Cliente general"}
                  </td>

                  {/* Vendedor */}
                  <td className="py-3.5 px-4 text-slate-600">
                    {sale.usuario?.name || "N/A"}
                  </td>

                  {/* Fecha */}
                  <td className="py-3.5 px-4 text-right text-slate-500 whitespace-nowrap">
                    {formatDate(sale.fecha)}
                  </td>

                  {/* Total */}
                  <td className="py-3.5 pl-4 text-right font-bold text-slate-900 font-sans">
                    {formatMoney(sale.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
