"use client";

import React, { useState, useId } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Proveedor, ProveedorPayload } from "@/types/proveedor";
import { ValidationError } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Building2,
  FileText,
  Phone,
  Mail,
  MapPin,
  Save,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";

/**
 * Esquema de validación con Zod para proveedores
 */
export const proveedorFormSchema = z.object({
  ruc: z
    .string()
    .trim()
    .min(1, "El número RUC es obligatorio.")
    .max(30, "El RUC no puede exceder 30 caracteres."),
  razon_social: z
    .string()
    .trim()
    .min(1, "La razón social o nombre comercial es obligatorio.")
    .min(2, "La razón social debe tener al menos 2 caracteres.")
    .max(255, "La razón social no puede exceder 255 caracteres."),
  telefono: z
    .string()
    .trim()
    .max(50, "El teléfono no puede exceder 50 caracteres.")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  email: z
    .string()
    .trim()
    .max(100, "El correo electrónico no puede exceder 100 caracteres.")
    .optional()
    .nullable()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Ingresa un correo electrónico válido."
    )
    .transform((val) => (val && val.length > 0 ? val : null)),
  direccion: z
    .string()
    .trim()
    .max(500, "La dirección no puede exceder 500 caracteres.")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  activo: z.boolean().default(true),
});

export type ProveedorFormData = z.input<typeof proveedorFormSchema>;

interface ProveedorFormProps {
  initialData?: Proveedor | null;
  isEditing?: boolean;
  onSubmit: (data: ProveedorPayload) => Promise<void>;
  isLoading?: boolean;
}

export function ProveedorForm({
  initialData,
  isEditing = false,
  onSubmit,
  isLoading = false,
}: ProveedorFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const direccionId = useId();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorFormSchema),
    defaultValues: {
      ruc: initialData?.ruc || "",
      razon_social: initialData?.razon_social || "",
      telefono: initialData?.telefono || "",
      email: initialData?.email || "",
      direccion: initialData?.direccion || "",
      activo: initialData ? initialData.activo : true,
    },
  });

  const activoWatcher = watch("activo");

  const handleFormSubmit = async (formData: ProveedorFormData) => {
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        ruc: formData.ruc.trim(),
        razon_social: formData.razon_social.trim(),
        telefono: formData.telefono?.trim() || null,
        email: formData.email?.trim() || null,
        direccion: formData.direccion?.trim() || null,
        activo: Boolean(formData.activo),
      });
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (
            field === "ruc" ||
            field === "razon_social" ||
            field === "telefono" ||
            field === "email" ||
            field === "direccion" ||
            field === "activo"
          ) {
            setError(field as keyof ProveedorFormData, {
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
        setGeneralError("Ocurrió un error inesperado al procesar el proveedor.");
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
            <p className="font-semibold text-rose-900">No se pudo guardar el proveedor</p>
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

      {/* Tarjeta de Información General */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-[#D17B00]/10 text-[#D17B00]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Datos Fiscales y Comerciales
            </h2>
            <p className="text-xs text-slate-500">
              Identificación oficial de la casa distribuidora, bodega o mayorista.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* RUC */}
          <div>
            <Input
              label="Número RUC o Cédula Jurídica"
              placeholder="Ej. J0310000000000"
              autoFocus
              leftIcon={<FileText className="w-4 h-4" />}
              required
              error={errors.ruc?.message}
              helperText="Identificador tributario único ante la DGI."
              {...register("ruc")}
            />
          </div>

          {/* Razón Social */}
          <div>
            <Input
              label="Razón Social / Nombre Comercial"
              placeholder="Ej. Compañía Licorera de Nicaragua S.A."
              leftIcon={<Building2 className="w-4 h-4" />}
              required
              error={errors.razon_social?.message}
              helperText="Nombre comercial registrado del distribuidor."
              {...register("razon_social")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100/80">
          {/* Teléfono */}
          <div>
            <Input
              label="Teléfono de Contacto"
              placeholder="Ej. +505 2278-0000 / 8888-9999"
              leftIcon={<Phone className="w-4 h-4" />}
              error={errors.telefono?.message}
              helperText="Línea directa o celular del asesor de ventas."
              {...register("telefono")}
            />
          </div>

          {/* Email */}
          <div>
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="Ej. pedidos@licorera.com.ni"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              helperText="Dirección para envío de órdenes de compra y facturas."
              {...register("email")}
            />
          </div>
        </div>

        {/* Dirección */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100/80">
          <label
            htmlFor={direccionId}
            className="block text-xs font-semibold text-slate-700"
          >
            Dirección Física o Bodega{" "}
            <span className="text-slate-400 font-normal">(Opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <textarea
              id={direccionId}
              rows={3}
              placeholder="Ej. Km 12.5 Carretera Norte, del semáforo 200 mts al norte..."
              className={`w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all resize-none ${
                errors.direccion
                  ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15"
                  : "border-slate-200/90 hover:border-slate-300 focus:border-[#D17B00] focus:ring-2 focus:ring-[#D17B00]/15"
              }`}
              {...register("direccion")}
            />
          </div>
          {errors.direccion ? (
            <p className="text-[11px] font-medium text-rose-600">
              {errors.direccion.message}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400">
              Ubicación de despachos o instalaciones principales.
            </p>
          )}
        </div>

        {/* Estado Activo / Inactivo (solo en modo edición para permitir reactivación) */}
        {isEditing && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Estado del Proveedor en el Sistema
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Los proveedores activos pueden recibir nuevas órdenes de compra y asociarse a productos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setValue("activo", !activoWatcher)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                activoWatcher ? "bg-emerald-500" : "bg-slate-300"
              }`}
              role="switch"
              aria-checked={activoWatcher}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  activoWatcher ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Barra de Acciones */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
        <Link href="/proveedores" className="w-full sm:w-auto">
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
              <span>{isEditing ? "Guardar Cambios" : "Crear Proveedor"}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
