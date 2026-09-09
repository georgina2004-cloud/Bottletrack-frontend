"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { obtenerVentas, descargarFacturaPDF } from "@/lib/api";
import { Venta } from "@/types/venta";
import { useMoneda } from "@/lib/currency";
import { ReportesHeader } from "@/components/reportes/ReportesHeader";
import { Button } from "@/components/ui/Button";
import {
  Search,
  FileDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Printer,
  Calendar,
  DollarSign,
  Package,
} from "lucide-react";

export default function FacturaImprimiblePage() {
  const { token } = useAuth();
  const { formatMoneda: formatMonto } = useMoneda();

  const [busquedaFactura, setBusquedaFactura] = useState<string>("");
  const [ventasEncontradas, setVentasEncontradas] = useState<Venta[]>([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const [isLoadingFacturas, setIsLoadingFacturas] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);

  const buscarFacturas = async (query: string) => {
    setIsLoadingFacturas(true);
    setPdfError(null);
    try {
      const res = await obtenerVentas({ busqueda: query.trim() }, token);
      setVentasEncontradas(res.data || []);
      if (res.data && res.data.length > 0) {
        setVentaSeleccionada((prev) => (prev ? prev : res.data[0]));
      }
    } catch (err) {
      console.error("Error al buscar facturas:", err);
    } finally {
      setIsLoadingFacturas(false);
    }
  };

  useEffect(() => {
    buscarFacturas("");
  }, [token]);

  const handleDescargarFacturaPdf = async () => {
    if (!ventaSeleccionada) return;
    setIsDownloadingPdf(true);
    setPdfError(null);
    setPdfSuccess(null);

    try {
      await descargarFacturaPDF(
        ventaSeleccionada.id,
        `Factura-${ventaSeleccionada.numero_factura}.pdf`,
        token
      );
      setPdfSuccess(`Factura #${ventaSeleccionada.numero_factura} descargada en PDF.`);
      setTimeout(() => setPdfSuccess(null), 4000);
    } catch (err: unknown) {
      setPdfError(
        err instanceof Error ? err.message : "Error al descargar el documento PDF."
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <ReportesHeader
        title="Factura Imprimible"
        description="Búsqueda, previsualización y exportación de comprobantes oficiales en PDF para impresión fiscal o archivo digital."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda: Buscador de facturas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Buscar Factura</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtra por número de factura o nombre del cliente.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Ej. FAC-0001, Juan..."
              value={busquedaFactura}
              onChange={(e) => {
                setBusquedaFactura(e.target.value);
                buscarFacturas(e.target.value);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:bg-white transition-colors"
            />
          </div>

          {isLoadingFacturas ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-brand mx-auto mb-2" />
              <span className="text-xs">Buscando facturas...</span>
            </div>
          ) : ventasEncontradas.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No se encontraron facturas con ese criterio.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1 divide-y divide-slate-100 text-xs">
              {ventasEncontradas.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setVentaSeleccionada(v)}
                  className={`
                    p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between
                    ${
                      ventaSeleccionada?.id === v.id
                        ? "bg-brand/10 border border-brand text-brand font-semibold shadow-2xs"
                        : "hover:bg-slate-50 text-slate-700"
                    }
                  `}
                >
                  <div>
                    <span className="font-mono font-bold block">
                      #{v.numero_factura}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block max-w-[160px]">
                      {v.cliente_nombre || "Consumidor Final"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold block ${
                        ventaSeleccionada?.id === v.id ? "text-brand" : "text-slate-900"
                      }`}
                    >
                      {formatMonto(v.total)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {v.fecha?.slice(0, 10)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Previsualización de Factura */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          {pdfSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pdfSuccess}</span>
            </div>
          )}

          {pdfError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pdfError}</span>
            </div>
          )}

          {ventaSeleccionada ? (
            <div className="space-y-6">
              {/* Encabezado del comprobante */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-[11px] font-bold text-brand uppercase tracking-wider block">
                    Comprobante de Venta
                  </span>
                  <h2 className="text-xl sm:text-2xl font-mono font-bold text-slate-900">
                    Factura #{ventaSeleccionada.numero_factura}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fecha: {ventaSeleccionada.fecha} • Vendedor:{" "}
                    <span className="font-semibold text-slate-700">
                      {ventaSeleccionada.usuario?.name || "Cajero / Vendedor"}
                    </span>
                  </p>
                </div>

                <Button
                  type="button"
                  disabled={isDownloadingPdf}
                  onClick={handleDescargarFacturaPdf}
                  className="gap-2 text-xs sm:text-sm font-semibold shadow-sm shadow-brand/20 cursor-pointer"
                  title="Descargar factura en formato PDF"
                >
                  {isDownloadingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Descargando PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>Descargar PDF</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Resumen del Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold">Cliente:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {ventaSeleccionada.cliente_nombre || "Consumidor Final"}
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-400 block font-semibold">Estado:</span>
                  <span
                    className={`inline-block font-bold text-[11px] px-2 py-0.5 rounded-full border ${
                      ventaSeleccionada.estado_activa !== false
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {ventaSeleccionada.estado_activa !== false ? "Activa / Emitida" : "Anulada"}
                  </span>
                </div>
              </div>

              {/* Tabla de Artículos */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Artículos en Factura
                </h4>
                {ventaSeleccionada.detalles && ventaSeleccionada.detalles.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Producto</th>
                          <th className="py-2.5 px-3 text-center">Cant.</th>
                          <th className="py-2.5 px-3 text-right">P. Unitario</th>
                          <th className="py-2.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ventaSeleccionada.detalles.map((det, idx) => (
                          <tr key={det.id || idx}>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {det.producto?.nombre || `Producto #${det.producto_id}`}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                              {det.cantidad}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              {formatMonto(det.precio_unitario)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                              {formatMonto(det.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400 text-center">
                    Detalles no precargados. Descargue el PDF para consultar las líneas completas.
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">{formatMonto(ventaSeleccionada.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IVA (15%):</span>
                  <span className="font-mono font-semibold">{formatMonto(ventaSeleccionada.impuesto)}</span>
                </div>
                {Number(ventaSeleccionada.descuento) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Descuento:</span>
                    <span className="font-mono font-semibold">-{formatMonto(ventaSeleccionada.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                  <span>Total Facturado:</span>
                  <span className="text-brand font-mono text-base">{formatMonto(ventaSeleccionada.total)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">Selecciona una factura del panel izquierdo para previsualizarla.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
