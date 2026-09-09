"use client";

import React from "react";
import { MetricItem } from "@/types/dashboard";
import {
  DollarSign,
  Calendar,
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface MetricCardProps {
  metric: MetricItem;
  isLoading?: boolean;
}

export function MetricCard({ metric, isLoading = false }: MetricCardProps) {
  const getIcon = (name?: string) => {
    const iconClass = "w-5 h-5";
    switch (name) {
      case "dollar":
        return <DollarSign className={iconClass} />;
      case "calendar-dollar":
        return <Calendar className={iconClass} />;
      case "package":
        return <Package className={iconClass} />;
      case "alert-triangle":
        return <AlertTriangle className={iconClass} />;
      case "shopping-cart":
        return <ShoppingCart className={iconClass} />;
      case "trending-up":
      default:
        return <TrendingUp className={iconClass} />;
    }
  };

  const getIconTheme = () => {
    if (metric.isAlert || metric.id === "alertas-stock" || metric.iconName === "alert-triangle") {
      return "bg-amber-50 text-amber-600 border border-amber-200/80 group-hover:bg-amber-600 group-hover:text-white";
    }
    if (metric.id === "ventas-dia" || metric.iconName === "dollar") {
      return "bg-emerald-50 text-emerald-600 border border-emerald-200/70 group-hover:bg-emerald-600 group-hover:text-white";
    }
    if (metric.id === "ventas-mes" || metric.iconName === "calendar-dollar") {
      return "bg-emerald-50 text-emerald-700 border border-emerald-200/70 group-hover:bg-emerald-700 group-hover:text-white";
    }
    if (metric.id === "productos-inventario" || metric.iconName === "package") {
      return "bg-indigo-50 text-indigo-600 border border-indigo-200/70 group-hover:bg-indigo-600 group-hover:text-white";
    }
    if (metric.id === "compras-mes" || metric.iconName === "shopping-cart") {
      return "bg-orange-50 text-orange-600 border border-orange-200/70 group-hover:bg-orange-600 group-hover:text-white";
    }
    if (metric.id === "utilidad-estimada" || metric.iconName === "trending-up") {
      return "bg-teal-50 text-teal-700 border border-teal-200/70 group-hover:bg-teal-700 group-hover:text-white";
    }
    return "bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-slate-800 group-hover:text-white";
  };

  return (
    <div
      className={`
        relative bg-white rounded-2xl p-4 sm:p-4.5 border transition-all duration-200
        hover:shadow-md hover:border-slate-300 group flex flex-col justify-between
        ${
          metric.isAlert
            ? "border-amber-200/80 bg-linear-to-br from-white via-white to-amber-50/30"
            : "border-slate-200/80 shadow-xs"
        }
      `}
    >
      {/* Top: Icon on LEFT, Label and Value on RIGHT */}
      <div className="flex items-start gap-3 mb-2.5">
        {/* Icon Circle/Rounded Container */}
        <div
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
            ${getIconTheme()}
          `}
        >
          {getIcon(metric.iconName)}
        </div>

        {/* Title and Value */}
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
            {metric.title}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            {isLoading ? (
              <div className="h-7 w-20 bg-slate-200 animate-pulse rounded-lg my-0.5" />
            ) : (
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans truncate">
                {metric.value}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Descriptive secondary text */}
      {(metric.secondaryText || metric.period) && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100/80 text-xs">
          {isLoading ? (
            <div className="h-4 w-28 bg-slate-100 animate-pulse rounded my-0.5" />
          ) : (
            <span
              className="text-slate-500 text-[11px] truncate font-medium"
              title={metric.secondaryText || metric.period}
            >
              {metric.secondaryText || metric.period}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
