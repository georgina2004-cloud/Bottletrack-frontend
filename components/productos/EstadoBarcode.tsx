import React from "react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { EstadoLookup } from "@/hooks/useBarcodeLookup";

interface EstadoBarcodeProps {
  estado: EstadoLookup;
  productoLocal: { id: number; nombre: string } | null;
}

export function EstadoBarcode({ estado, productoLocal }: EstadoBarcodeProps) {
  if (estado === "idle") {
    return null;
  }

  if (estado === "buscando") {
    return (
      <div
        role="status"
        className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium animate-in fade-in duration-150"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand shrink-0" />
        <span>Buscando información de la botella...</span>
      </div>
    );
  }

  if (estado === "existe_local") {
    return (
      <div
        role="alert"
        className="mt-1.5 p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs flex flex-col gap-1.5 shadow-2xs animate-in fade-in duration-150"
      >
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-amber-900 leading-relaxed">
              Este código ya está registrado como{" "}
              <strong className="font-semibold text-amber-950">
                {productoLocal?.nombre || "otro producto"}
              </strong>
              .
            </p>
            {productoLocal?.id && (
              <div className="pt-0.5">
                <Link
                  href={`/productos/${productoLocal.id}/editar`}
                  className="font-medium text-amber-800 hover:text-amber-950 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Editar ese producto
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (estado === "encontrado") {
    return (
      <div
        role="status"
        className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500 animate-in fade-in duration-150"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
        <span>Datos autocompletados desde Open Food Facts. Revisalos antes de guardar.</span>
      </div>
    );
  }

  if (estado === "no_encontrado") {
    return (
      <div
        role="status"
        className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500 animate-in fade-in duration-150"
      >
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>No encontramos este código en la base externa. Podés completar los datos manualmente.</span>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div
        role="status"
        className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500 animate-in fade-in duration-150"
      >
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>No se pudo consultar la base externa. Continuá con el llenado manual.</span>
      </div>
    );
  }

  return null;
}
