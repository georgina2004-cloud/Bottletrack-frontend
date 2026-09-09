"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCart, ArrowUpRight, Loader2, PackageCheck } from "lucide-react";
import { useMoneda } from "@/lib/currency";

interface MonthlyPurchasesCardProps {
  totalCompras: number | string;
  isLoading?: boolean;
}

export function MonthlyPurchasesCard({
  totalCompras,
  isLoading = false,
}: MonthlyPurchasesCardProps) {
  const { formatMoneda } = useMoneda();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full group hover:shadow-md hover:border-slate-300 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-100/70 flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#18181B] leading-tight">
              Compras del Mes
            </h4>
            <span className="text-[11px] text-slate-500">
              Reabastecimiento acumulado
            </span>
          </div>
        </div>

        <Link
          href="/compras"
          className="text-xs font-semibold text-slate-500 hover:text-brand flex items-center gap-0.5 transition-colors cursor-pointer"
        >
          <span>Ver todas</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content: Big Amount + Status */}
      <div className="flex items-baseline justify-between gap-2 pt-1">
        {isLoading ? (
          <div className="h-8 w-28 bg-slate-200 animate-pulse rounded-lg my-0.5" />
        ) : (
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] font-sans">
            {formatMoneda(totalCompras)}
          </span>
        )}

        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
          <PackageCheck className="w-3 h-3 text-orange-600" />
          <span>Registros al día</span>
        </span>
      </div>
    </div>
  );
}
