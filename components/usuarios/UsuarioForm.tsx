"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Usuario, UsuarioPayload } from "@/types/usuario";
import { Role } from "@/types/role";
import { obtenerRoles, ValidationError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  User,
  Mail,
  Lock,
  Shield,
  Save,
  X,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

/**
 * Generador de esquema de validación Zod para usuarios
 */
export const createUsuarioSchema = (isEditing: boolean) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre completo es obligatorio.")
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(255, "El nombre no puede exceder 255 caracteres."),
    email: z
      .string()
      .trim()
      .min(1, "El correo electrónico es obligatorio.")
      .email("Ingresa un correo electrónico válido.")
      .max(255, "El correo electrónico no puede exceder 255 caracteres."),
    password: z
      .string()
      .optional()
      .superRefine((val, ctx) => {
        if (!isEditing) {
          if (!val || val.trim().length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "La contraseña es obligatoria para nuevos usuarios.",
            });
          } else if (val.length < 6) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "La contraseña debe tener al menos 6 caracteres.",
            });
          }
        } else {
          // En modo edición: si se escribe algo, debe cumplir el mínimo de 6 caracteres
          if (val && val.length > 0 && val.length < 6) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "La contraseña debe tener al menos 6 caracteres.",
            });
          }
        }
      }),
    role_id: z.number().min(1, "Debes seleccionar un rol para el usuario."),
    estado: z.boolean(),
  });

export interface UsuarioFormData {
  name: string;
  email: string;
  password?: string;
  role_id: number;
  estado: boolean;
}

interface UsuarioFormProps {
  initialData?: Usuario | null;
  isEditing?: boolean;
  onSubmit: (data: UsuarioPayload) => Promise<void>;
  isLoading?: boolean;
}

export function UsuarioForm({
  initialData,
  isEditing = false,
  onSubmit,
  isLoading = false,
}: UsuarioFormProps) {
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Cargar lista de roles una sola vez al montar desde el backend
  useEffect(() => {
    let isMounted = true;

    async function cargarRoles() {
      try {
        setIsLoadingRoles(true);
        const rolesData = await obtenerRoles(token);
        if (isMounted) {
          setRoles(rolesData);
        }
      } catch (err) {
        console.error("Error al cargar roles:", err);
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
        }
      }
    }

    cargarRoles();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const schema = React.useMemo(
    () => createUsuarioSchema(isEditing),
    [isEditing]
  );

  const [estado, setEstado] = useState<boolean>(
    initialData ? initialData.estado : true
  );

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      password: "",
      role_id: initialData?.role_id || (roles[0]?.id ?? 0),
      estado: initialData ? initialData.estado : true,
    },
  });

  // Si los roles se cargan de forma asíncrona y no hay valor inicial, sincronizar el primero
  useEffect(() => {
    if (!initialData && roles.length > 0) {
      const currentRole = getValues("role_id");
      if (!currentRole || currentRole === 0) {
        setValue("role_id", roles[0].id);
      }
    }
  }, [roles, initialData, setValue, getValues]);

  const onSubmitInternal = async (data: UsuarioFormData) => {
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      const payload: UsuarioPayload = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        role_id: Number(data.role_id),
      };

      if (data.password && data.password.trim().length > 0) {
        payload.password = data.password;
      }

      if (isEditing) {
        payload.estado = estado;
      }

      await onSubmit(payload);
    } catch (err: unknown) {
      if (err instanceof ValidationError) {
        Object.entries(err.errors).forEach(([field, messages]) => {
          if (messages && messages.length > 0) {
            setError(field as keyof UsuarioFormData, {
              type: "server",
              message: messages[0],
            });
          }
        });
        setGeneralError(
          err.message ||
            "Por favor corrige los campos señalados antes de continuar."
        );
      } else {
        setGeneralError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error inesperado al procesar la solicitud."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center min-h-[350px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D17B00]" />
        <p className="text-sm font-medium text-slate-500">
          Cargando datos del usuario...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmitInternal)}
      noValidate
      className="space-y-6"
    >
      {/* Alerta de Error General */}
      {generalError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-3 shadow-2xs animate-in fade-in duration-200"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-xs sm:text-sm text-rose-950">
              No se pudo guardar la información
            </p>
            <p className="text-xs text-rose-800 mt-0.5">{generalError}</p>
          </div>
          <button
            type="button"
            onClick={() => setGeneralError(null)}
            className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tarjeta Principal de Información de Cuenta */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-[#D17B00]" />
            <span>Datos de la Cuenta</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Información de acceso e identificación del usuario en el sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Nombre Completo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nombre Completo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                {...register("name")}
                placeholder="Ej. Juan Pérez"
                error={errors.name?.message}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-rose-600 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Correo Electrónico <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="email"
                {...register("email")}
                placeholder="usuario@bottletrack.com"
                error={errors.email?.message}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-rose-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contraseña {isEditing ? "(Opcional)" : <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder={
                  isEditing
                    ? "•••••••• (Sin cambios)"
                    : "Mínimo 6 caracteres"
                }
                className={`
                  w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-white border rounded-lg transition-all text-slate-900
                  focus:outline-none focus:border-[#D17B00] focus:ring-2 focus:ring-[#D17B00]/15
                  ${
                    errors.password
                      ? "border-rose-300 ring-1 ring-rose-500/20 bg-rose-50/20"
                      : "border-slate-300 hover:border-slate-400"
                  }
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p className="text-[11px] text-rose-600 mt-1">
                {errors.password.message}
              </p>
            ) : isEditing ? (
              <p className="text-[11px] text-slate-400 mt-1">
                Dejar en blanco para no cambiar la contraseña actual.
              </p>
            ) : null}
          </div>

          {/* Rol del Sistema */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Rol Asignado <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                {...register("role_id", { valueAsNumber: true })}
                disabled={isLoadingRoles}
                className={`
                  w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border rounded-lg transition-all text-slate-900 appearance-none
                  focus:outline-none focus:border-[#D17B00] focus:ring-2 focus:ring-[#D17B00]/15
                  ${
                    errors.role_id
                      ? "border-rose-300 ring-1 ring-rose-500/20 bg-rose-50/20"
                      : "border-slate-300 hover:border-slate-400"
                  }
                  ${isLoadingRoles ? "bg-slate-50 opacity-70" : ""}
                `}
              >
                {isLoadingRoles ? (
                  <option value="">Cargando roles...</option>
                ) : (
                  roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))
                )}
              </select>
            </div>
            {errors.role_id && (
              <p className="text-[11px] text-rose-600 mt-1">
                {errors.role_id.message}
              </p>
            )}
          </div>
        </div>

        {/* Estado del Usuario (Solo en modo edición) */}
        {isEditing && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 p-4 rounded-xl">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Estado del Usuario
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {estado
                  ? "Usuario activo: tiene permitido iniciar sesión y operar según su rol."
                  : "Usuario inactivo: acceso revocado temporalmente sin eliminar su historial."}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={estado}
                onChange={(e) => setEstado(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-semibold text-slate-700">
                {estado ? "Activo" : "Inactivo"}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/usuarios">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="text-xs sm:text-sm font-semibold"
          >
            Cancelar
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="text-xs sm:text-sm font-semibold gap-2 shadow-sm shadow-[#D17B00]/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEditing ? "Guardar Cambios" : "Crear Usuario"}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
