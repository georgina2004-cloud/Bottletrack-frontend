"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ExportButtons } from "./ExportButtons";
import { TipoReporte } from "@/types/reporte";

interface ReportesHeaderProps {
  title: string;
  description: string;
  tipo?: TipoReporte;
  desde?: string;
  hasta?: string;
  badge?: string;
}

export function ReportesHeader({
  title,
  description,
  tipo,
  desde,
  hasta,
  badge,
}: ReportesHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
      <div>
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5"
        >
          <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600">Reportes</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-brand">{title}</span>
        </nav>

        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] font-sans">
            {title}
          </h1>
          {badge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p>
      </div>

      {tipo && (
        <div className="shrink-0">
          <ExportButtons tipo={tipo} desde={desde} hasta={hasta} />
        </div>
      )}
    </div>
  );
}
