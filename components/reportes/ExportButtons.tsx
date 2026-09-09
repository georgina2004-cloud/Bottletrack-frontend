"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { descargarReporteArchivo } from "@/lib/api";
import { TipoReporte, FormatoReporte } from "@/types/reporte";
import { useAuth } from "@/context/AuthContext";
import { FileDown, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface ExportButtonsProps {
  tipo: TipoReporte;
  desde?: string;
  hasta?: string;
}

export function ExportButtons({ tipo, desde, hasta }: ExportButtonsProps) {
  const { token } = useAuth();
  const [exportando, setExportando] = useState<FormatoReporte | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const handleExportar = async (formato: FormatoReporte) => {
    setExportando(formato);
    setMensajeExito(null);
    setMensajeError(null);

    try {
      await descargarReporteArchivo(tipo, formato, { desde, hasta }, token);
      setMensajeExito(`Reporte exportado exitosamente en ${formato.toUpperCase()}.`);
      setTimeout(() => setMensajeExito(null), 3500);
    } catch (err: unknown) {
      console.error(`Error al exportar reporte ${tipo} como ${formato}:`, err);
      setMensajeError(
        err instanceof Error
          ? err.message
          : `No se pudo descargar el archivo en formato ${formato.toUpperCase()}.`
      );
      setTimeout(() => setMensajeError(null), 4000);
    } finally {
      setExportando(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {/* Botón PDF */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={exportando !== null}
          onClick={() => handleExportar("pdf")}
          className="text-xs font-semibold gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-2xs cursor-pointer"
          title="Exportar y descargar reporte en PDF"
        >
          {exportando === "pdf" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
              <span>Generando...</span>
            </>
          ) : (
            <>
              <FileDown className="w-3.5 h-3.5 text-rose-600" />
              <span>Exportar PDF</span>
            </>
          )}
        </Button>

        {/* Botón Excel */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={exportando !== null}
          onClick={() => handleExportar("excel")}
          className="text-xs font-semibold gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors shadow-2xs cursor-pointer"
          title="Exportar y descargar reporte en Excel"
        >
          {exportando === "excel" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Generando...</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar Excel</span>
            </>
          )}
        </Button>
      </div>

      {/* Alertas flotantes breves */}
      {mensajeExito && (
        <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 animate-in fade-in">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {mensajeExito}
        </span>
      )}
      {mensajeError && (
        <span className="text-[11px] font-medium text-rose-700 flex items-center gap-1 animate-in fade-in">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          {mensajeError}
        </span>
      )}
    </div>
  );
}
