"use client";

import React, { useState, useId } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Categoria, CategoriaPayload } from "@/types/producto";
import { ValidationError } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Layers,
  Save,
  X,
  AlertTriangle,
  Tag,
  AlignLeft,
  Loader2,
} from "lucide-react";

/**
 * Esquema de validación con Zod para el formulario de categorías
 */
export const categoriaFormSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre de la categoría es obligatorio.")
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede exceder 100 caracteres."),
  descripcion: z
    .string()
    .trim()
    .max(255, "La descripción no puede exceder 255 caracteres.")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type CategoriaFormData = z.input<typeof categoriaFormSchema>;

interface CategoriaFormProps {
  initialData?: Categoria | null;
  isEditing?: boolean;
  onSubmit: (data: CategoriaPayload) => Promise<void>;
  isLoading?: boolean;
}

export function CategoriaForm({
  initialData,
  isEditing = false,
  onSubmit,
  isLoading = false,
}: CategoriaFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const descripcionId = useId();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaFormSchema),
    defaultValues: {
      nombre: initialData?.nombre || "",
      descripcion: initialData?.descripcion || "",
    },
  });

  const nombreWatcher = watch("nombre");
  const descripcionWatcher = watch("descripcion");

  const handleFormSubmit = async (formData: CategoriaFormData) => {
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
      });
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (field === "nombre" || field === "descripcion") {
            setError(field as keyof CategoriaFormData, {
              type: "server",
              message: messages[0],
            });
          } else {
            setGeneralError(messages[0]);
          }
        });
      } else if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError("Ocurrió un error inesperado al procesar la solicitud.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isLoading || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      className="space-y-6"
    >
      {/* Alerta general de error */}
      {generalError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-2xs animate-in fade-in duration-200"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">No se pudo guardar la categoría</p>
            <p className="mt-0.5 text-rose-700">{generalError}</p>
          </div>
          <button
            type="button"
            onClick={() => setGeneralError(null)}
            className="text-rose-400 hover:text-rose-700 p-0.5 rounded cursor-pointer transition-colors"
            title="Cerrar mensaje"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tarjeta de Formulario Principal */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-[#D17B00]/10 text-[#D17B00]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Información de la Categoría
            </h2>
            <p className="text-xs text-slate-500">
              Define la clasificación para agrupar botellas y productos en el catálogo de la licorería.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Nombre de la Categoría */}
          <Input
            label="Nombre de la categoría"
            placeholder="Ej. Vinos Tintos, Rones Añejos, Cervezas Artesanales..."
            autoFocus
            leftIcon={<Tag className="w-4 h-4" />}
            required
            error={errors.nombre?.message}
            helperText="Nombre distintivo y claro que aparecerá en los filtros y reportes."
            {...register("nombre")}
          />

          {/* Descripción */}
          <div className="space-y-1.5">
            <label
              htmlFor={descripcionId}
              className="block text-xs font-semibold text-slate-700"
            >
              Descripción de la categoría{" "}
              <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
                <AlignLeft className="w-4 h-4" />
              </div>
              <textarea
                id={descripcionId}
                rows={3}
                placeholder="Breve detalle sobre las características o tipos de productos que pertenecen a esta familia..."
                className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all resize-none ${
                  errors.descripcion
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15"
                    : "border-slate-200/90 hover:border-slate-300 focus:border-[#D17B00] focus:ring-2 focus:ring-[#D17B00]/15"
                }`}
                {...register("descripcion")}
              />
            </div>
            {errors.descripcion ? (
              <p className="text-[11px] font-medium text-rose-600">
                {errors.descripcion.message}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Máximo 255 caracteres.
              </p>
            )}
          </div>
        </div>

        {/* Vista previa en tiempo real */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Vista Previa de Etiqueta
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#D17B00]" />
            <span className="font-semibold text-slate-800">
              {nombreWatcher?.trim() || "Nombre de categoría"}
            </span>
            {descripcionWatcher?.trim() && (
              <span className="text-[11px] text-slate-400 max-w-xs truncate border-l border-slate-200 pl-2">
                {descripcionWatcher.trim()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Acciones / Botones */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
        <Link href="/categorias" className="w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={isBusy}
            className="w-full sm:w-auto text-xs"
          >
            Cancelar
          </Button>
        </Link>

        <Button
          type="submit"
          size="md"
          isLoading={isBusy}
          className="w-full sm:w-auto text-xs gap-2 shadow-sm shadow-[#D17B00]/20"
        >
          {isBusy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isEditing ? "Actualizando..." : "Registrando..."}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEditing ? "Guardar Cambios" : "Crear Categoría"}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
