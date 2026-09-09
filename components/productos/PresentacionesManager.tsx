"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  obtenerPresentaciones,
  crearPresentacion,
  eliminarPresentacion,
} from "@/lib/api";
import { Presentacion, CrearPresentacionPayload } from "@/types/presentacion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useMoneda } from "@/lib/currency";
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Tag,
  Boxes,
  X,
  Star,
} from "lucide-react";

interface PresentacionesManagerProps {
  productoId: number;
  precioVentaBase?: number | string;
  onPresentacionesChange?: (presentaciones: Presentacion[]) => void;
}

export function PresentacionesManager({
  productoId,
  precioVentaBase,
  onPresentacionesChange,
}: PresentacionesManagerProps) {
  const { token } = useAuth();
  const { formatMoneda: formatMoney, moneda } = useMoneda();

  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorList, setErrorList] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado del formulario de creación
  const [mostrarForm, setMostrarForm] = useState<boolean>(false);
  const [nombre, setNombre] = useState<string>("");
  const [unidadesEquivalentes, setUnidadesEquivalentes] = useState<string>("1");
  const [precioVenta, setPrecioVenta] = useState<string>("");
  const [esDefault, setEsDefault] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Estado para eliminación
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const cargarPresentaciones = useCallback(async () => {
    if (!productoId) return;
    setIsLoading(true);
    setErrorList(null);
    try {
      const data = await obtenerPresentaciones(productoId, token);
      setPresentaciones(data);
      onPresentacionesChange?.(data);
    } catch (err: unknown) {
      console.error("Error al cargar presentaciones:", err);
      setErrorList(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las presentaciones del producto."
      );
    } finally {
      setIsLoading(false);
    }
  }, [productoId, token, onPresentacionesChange]);

  useEffect(() => {
    cargarPresentaciones();
  }, [cargarPresentaciones]);

  const handleCrearPresentacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const nom = nombre.trim();
    const unidades = parseInt(unidadesEquivalentes, 10);
    const precio = parseFloat(precioVenta);

    if (!nom) {
      setFormError("El nombre de la presentación es obligatorio.");
      return;
    }
    if (isNaN(unidades) || unidades < 1) {
      setFormError("Las unidades equivalentes deben ser al menos 1.");
      return;
    }
    if (isNaN(precio) || precio < 0) {
      setFormError("El precio de venta debe ser un número válido mayor o igual a 0.");
      return;
    }

    const payload: CrearPresentacionPayload = {
      nombre: nom,
      unidades_equivalentes: unidades,
      precio_venta: precio,
      es_default: esDefault,
    };

    setIsSubmitting(true);
    try {
      await crearPresentacion(productoId, payload, token);
      setSuccessMessage(`Presentación "${nom}" registrada correctamente.`);
      setNombre("");
      setUnidadesEquivalentes("1");
      setPrecioVenta("");
      setEsDefault(false);
      setMostrarForm(false);
      await cargarPresentaciones();
    } catch (err: unknown) {
      console.error("Error al registrar presentación:", err);
      setFormError(
        err instanceof Error
          ? err.message
          : "Error al registrar la presentación."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminarPresentacion = async (pres: Presentacion) => {
    if (presentaciones.length <= 1) {
      alert("No se puede eliminar la única presentación disponible del producto.");
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar la presentación "${pres.nombre}"?`)) {
      return;
    }

    setDeletingId(pres.id);
    setFormError(null);
    setSuccessMessage(null);
    try {
      await eliminarPresentacion(pres.id, token);
      setSuccessMessage(`La presentación "${pres.nombre}" fue eliminada.`);
      await cargarPresentaciones();
    } catch (err: unknown) {
      console.error("Error al eliminar presentación:", err);
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la presentación."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
      {/* Encabezado de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-[var(--primary-brand)]/10 text-[var(--primary-brand)] rounded-lg">
            <Boxes className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#18181B]">
              Presentaciones de Venta
            </h3>
            <p className="text-xs text-slate-500">
              Configura cómo se puede vender este producto (Unidad, Six-pack, Caja, etc.) y su precio específico
            </p>
          </div>
        </div>

        {!mostrarForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setMostrarForm(true);
              setFormError(null);
              // Pre-llenar precio sugerido si está vacío
              if (!precioVenta && precioVentaBase) {
                setPrecioVenta(String(precioVentaBase));
              }
            }}
            className="text-xs font-semibold gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Presentación</span>
          </Button>
        )}
      </div>

      {/* Banners de notificación */}
      {successMessage && (
        <div
          role="status"
          className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorList && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorList}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cargarPresentaciones}
            className="text-xs py-1 h-auto"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Formulario para agregar nueva presentación */}
      {mostrarForm && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[var(--primary-brand)]" />
              <span>Registrar Nueva Presentación</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setMostrarForm(false);
                setFormError(null);
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Nombre */}
            <div className="sm:col-span-1">
              <Input
                label="Nombre de Presentación"
                placeholder="Ej: Six-pack, Caja 24"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            {/* Unidades equivalentes */}
            <div>
              <Input
                label="Unidades Equivalentes"
                type="number"
                min="1"
                step="1"
                placeholder="1"
                value={unidadesEquivalentes}
                onChange={(e) => setUnidadesEquivalentes(e.target.value)}
                helperText="Cant. de botellas base que descuenta del inventario"
                required
              />
            </div>

            {/* Precio de venta */}
            <div>
              <Input
                label="Precio de Venta"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                leftIcon={<span className="text-xs font-bold text-[var(--primary-brand)]">$</span>}
                helperText="Precio al cobrar esta presentación"
                required
              />
            </div>
          </div>

          {/* Checkbox predeterminada */}
          <div className="pt-1 flex items-center gap-2">
            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={esDefault}
                onChange={(e) => setEsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[var(--primary-brand)] focus:ring-[var(--primary-brand)] cursor-pointer"
              />
              <span>Establecer como presentación predeterminada del producto</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMostrarForm(false);
                setFormError(null);
              }}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleCrearPresentacion}
              className="text-xs font-semibold gap-1.5 shadow-sm shadow-brand/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Guardar Presentación</span>
            </Button>
          </div>
        </div>
      )}

      {/* Lista de presentaciones existentes */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--primary-brand)]" />
            <p className="text-xs">Cargando presentaciones de venta...</p>
          </div>
        ) : presentaciones.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-300 stroke-[1.2]" />
            <p className="text-xs font-semibold text-slate-700">
              No hay presentaciones configuradas
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Agrega al menos una presentación (ej: &quot;Unidad&quot;) para que el producto esté listo para el sistema de ventas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Presentación</th>
                  <th className="py-3 px-4 text-center">Unidades Equiv.</th>
                  <th className="py-3 px-4 text-right">Precio de Venta</th>
                  <th className="py-3 px-4 text-center">Tipo</th>
                  <th className="py-3 px-4 text-center w-16">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {presentaciones.map((pres) => {
                  const esUnica = presentaciones.length <= 1;
                  const isDeleting = deletingId === pres.id;

                  return (
                    <tr
                      key={pres.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{pres.nombre}</span>
                          {pres.es_default && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200"
                              title="Presentación predeterminada seleccionada al vender"
                            >
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              Predeterminada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {pres.unidades_equivalentes}{" "}
                        <span className="text-[10px] text-slate-400">
                          {pres.unidades_equivalentes === 1 ? "ud" : "uds"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatMoney(pres.precio_venta)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                          {pres.unidades_equivalentes === 1 ? "Individual" : "Paquete / Lote"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={esUnica || isDeleting}
                          onClick={() => handleEliminarPresentacion(pres)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            esUnica
                              ? "text-slate-300 cursor-not-allowed opacity-50"
                              : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          }`}
                          title={
                            esUnica
                              ? "No se puede eliminar la única presentación del producto"
                              : `Eliminar presentación ${pres.nombre}`
                          }
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
