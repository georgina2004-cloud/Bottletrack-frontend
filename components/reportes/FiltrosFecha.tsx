"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Calendar, Filter, RotateCcw } from "lucide-react";

interface FiltrosFechaProps {
  desde: string;
  hasta: string;
  onDesdeChange: (value: string) => void;
  onHastaChange: (value: string) => void;
  onFiltrar: () => void;
  onLimpiar?: () => void;
  isLoading?: boolean;
}

export function FiltrosFecha({
  desde,
  hasta,
  onDesdeChange,
  onHastaChange,
  onFiltrar,
  onLimpiar,
  isLoading = false,
}: FiltrosFechaProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltrar();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <Calendar className="w-3.5 h-3.5 text-brand" />
          <span>Rango:</span>
        </div>

        {/* Desde */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="filtro-desde" className="text-slate-500 font-medium">
            Desde
          </label>
          <input
            id="filtro-desde"
            type="date"
            value={desde}
            onChange={(e) => onDesdeChange(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand shadow-2xs cursor-pointer"
          />
        </div>

        {/* Hasta */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="filtro-hasta" className="text-slate-500 font-medium">
            Hasta
          </label>
          <input
            id="filtro-hasta"
            type="date"
            value={hasta}
            onChange={(e) => onHastaChange(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand shadow-2xs cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onLimpiar && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLimpiar}
            className="text-xs h-8 px-2.5 gap-1 shadow-2xs cursor-pointer text-slate-600"
            title="Restablecer fechas"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Restablecer</span>
          </Button>
        )}

        <Button
          type="submit"
          size="sm"
          disabled={isLoading}
          className="text-xs h-8 px-3 gap-1.5 font-semibold shadow-sm shadow-brand/20 cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filtrar</span>
        </Button>
      </div>
    </form>
  );
}
