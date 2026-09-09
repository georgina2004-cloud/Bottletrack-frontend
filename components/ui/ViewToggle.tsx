"use client";

import React from "react";
import { LayoutList, LayoutGrid } from "lucide-react";

export type ViewMode = "cuadricula" | "tabla";

interface ViewToggleProps {
  vista: ViewMode;
  onCambiarVista: (nuevaVista: ViewMode) => void;
  className?: string;
}

export function ViewToggle({
  vista,
  onCambiarVista,
  className = "",
}: ViewToggleProps) {
  return (
    <div
      className={`flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 ${className}`}
    >
      <button
        type="button"
        onClick={() => onCambiarVista("cuadricula")}
        className={`p-2 rounded-lg transition-all cursor-pointer ${
          vista === "cuadricula"
            ? "bg-white text-slate-900 shadow-xs font-semibold"
            : "text-slate-400 hover:text-slate-600"
        }`}
        title="Vista en cuadrícula"
        aria-label="Vista en cuadrícula"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onCambiarVista("tabla")}
        className={`p-2 rounded-lg transition-all cursor-pointer ${
          vista === "tabla"
            ? "bg-white text-slate-900 shadow-xs font-semibold"
            : "text-slate-400 hover:text-slate-600"
        }`}
        title="Vista en tabla"
        aria-label="Vista en tabla"
      >
        <LayoutList className="w-4 h-4" />
      </button>
    </div>
  );
}
