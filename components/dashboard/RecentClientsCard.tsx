"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { UltimaVentaDashboard } from "@/types/dashboard";
import { Users, ArrowUpRight, Loader2 } from "lucide-react";

interface RecentClientsCardProps {
  sales: UltimaVentaDashboard[];
  isLoading?: boolean;
}

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-rose-100 text-rose-800 border-rose-200",
];

function getInitials(name: string): string {
  if (!name || name.trim() === "") return "CL";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export function RecentClientsCard({
  sales = [],
  isLoading = false,
}: RecentClientsCardProps) {
  // Extraer clientes únicos de las ventas recientes
  const uniqueClients = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    sales.forEach((s) => {
      const clientName = s.cliente_nombre?.trim() || "Cliente General";
      if (map.has(clientName)) {
        map.get(clientName)!.count += 1;
      } else {
        map.set(clientName, { name: clientName, count: 1 });
      }
    });
    return Array.from(map.values()).slice(0, 5);
  }, [sales]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full group hover:shadow-md hover:border-slate-300 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/70 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#18181B] leading-tight">
              Clientes Recientes
            </h4>
            <span className="text-[11px] text-slate-500">
              Últimos compradores en mostrador
            </span>
          </div>
        </div>

        <Link
          href="/ventas"
          className="text-xs font-semibold text-slate-500 hover:text-brand flex items-center gap-0.5 transition-colors cursor-pointer"
        >
          <span>Ver todas</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content: Avatar Stack + Summary */}
      {isLoading ? (
        <div className="py-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        </div>
      ) : uniqueClients.length === 0 ? (
        <div className="py-4 text-center text-slate-400 text-xs">
          Sin registros de clientes recientes
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Stack de Avatares */}
          <div className="flex -space-x-2 overflow-hidden py-1">
            {uniqueClients.map((client, idx) => {
              const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <div
                  key={`client-${idx}`}
                  title={client.name}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-bold border-2 border-white shadow-xs ${colorClass} transition-transform hover:scale-110 hover:z-10`}
                >
                  {getInitials(client.name)}
                </div>
              );
            })}
          </div>

          <span className="text-xs text-slate-500 font-medium text-right">
            <strong className="text-slate-900 font-bold">{sales.length}</strong>{" "}
            ventas registradas
          </span>
        </div>
      )}
    </div>
  );
}
