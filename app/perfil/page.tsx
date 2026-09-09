"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  actualizarPerfilUsuario,
  ValidationError,
  ActualizarPerfilPayload,
} from "@/lib/api";
import {
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Save,
  Loader2,
  LogOut,
  Calendar,
} from "lucide-react";

export default function PerfilPage() {
  const { user, token, logout, updateUser, isLoading: isAuthLoading } = useAuth();

  // Estados del formulario de perfil
  const [nombre, setNombre] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  // Estados de cambio de contraseña
  const [passwordActual, setPasswordActual] = useState<string>("");
  const [passwordNuevo, setPasswordNuevo] = useState<string>("");
  const [passwordConfirmacion, setPasswordConfirmacion] = useState<string>("");

  // Estados de control y feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Sincronizar datos iniciales del usuario
  useEffect(() => {
    if (user) {
      setNombre(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Manejador del guardado de perfil y/o contraseña
  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    if (!nombre.trim()) {
      setErrorMessage("El nombre completo es obligatorio.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("El correo electrónico es obligatorio.");
      return;
    }

    // Validar contraseña si se intenta cambiar
    if (passwordNuevo || passwordActual || passwordConfirmacion) {
      if (!passwordActual) {
        setErrorMessage("Debes ingresar tu contraseña actual para cambiarla.");
        return;
      }
      if (passwordNuevo.length < 6) {
        setErrorMessage("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (passwordNuevo !== passwordConfirmacion) {
        setErrorMessage("La confirmación de la nueva contraseña no coincide.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: ActualizarPerfilPayload = {
        name: nombre.trim(),
        email: email.trim(),
      };

      if (passwordNuevo) {
        payload.password_actual = passwordActual;
        payload.password = passwordNuevo;
        payload.password_confirmation = passwordConfirmacion;
      }

      const res = await actualizarPerfilUsuario(payload, token);

      // Actualizar usuario en sesión para reflejar en Header/Avatar al instante
      if (res.user) {
        updateUser(res.user);
      }

      setSuccessMessage(res.message || "¡Tu perfil ha sido actualizado con éxito!");
      setPasswordActual("");
      setPasswordNuevo("");
      setPasswordConfirmacion("");

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      console.error("Error al actualizar perfil:", err);
      if (err instanceof ValidationError) {
        setFieldErrors(err.errors);
        setErrorMessage("Por favor corrige los campos señalados a continuación.");
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "No fue posible actualizar tu perfil. Intenta nuevamente."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const initial = (user?.name || nombre || "U").charAt(0).toUpperCase();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Breadcrumb y Encabezado */}
        <div>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-slate-500 mb-2"
          >
            <Link
              href="/dashboard"
              className="hover:text-slate-900 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-brand">Mi Perfil</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                  Mi Perfil de Usuario
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Gestiona tu información personal de acceso y seguridad en BottleTrack.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-200 self-start sm:self-center cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>

        {/* Notificación de Éxito */}
        {successMessage && (
          <div
            role="alert"
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5 shadow-2xs animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Notificación de Error */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 shadow-2xs animate-in fade-in"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Error al procesar el perfil</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleGuardarPerfil}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ========================================================================= */}
            {/* TARJETA 1: IDENTIDAD DEL USUARIO                                         */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6 text-center flex flex-col items-center">
              {/* Avatar con inicial */}
              <div className="w-24 h-24 rounded-full bg-brand text-white flex items-center justify-center text-3xl font-bold shadow-md shadow-brand/20 border-4 border-white ring-1 ring-slate-200">
                {initial}
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {user?.name || (isAuthLoading ? "Cargando..." : "Usuario")}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  {user?.email || "usuario@bottletrack.com"}
                </p>
              </div>

              {/* Badge de Rol y Estado */}
              <div className="pt-2 border-t border-slate-100 w-full space-y-3">
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-brand" />
                    Rol de Acceso:
                  </span>
                  <span className="font-bold px-2.5 py-0.5 rounded-full text-[11px] bg-brand/10 text-brand border border-brand/20">
                    {user?.role || "Gerente de Bodega"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Estado de Cuenta:
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Activa
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* TARJETA 2: FORMULARIO DE EDICIÓN & SEGURIDAD                             */}
            {/* ========================================================================= */}
            <div className="md:col-span-2 space-y-6">
              {/* Información Personal */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <UserIcon className="w-4 h-4 text-brand" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Información Personal
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre Completo */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Nombre Completo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all"
                    />
                    {fieldErrors.name && (
                      <p className="text-[10px] text-rose-600 mt-1 font-medium">
                        {fieldErrors.name[0]}
                      </p>
                    )}
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Correo Electrónico <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@bottletrack.com"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-xl text-slate-900 font-semibold font-mono focus:outline-none focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all"
                    />
                    {fieldErrors.email && (
                      <p className="text-[10px] text-rose-600 mt-1 font-medium">
                        {fieldErrors.email[0]}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección de Seguridad / Cambio de Contraseña */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <KeyRound className="w-4 h-4 text-brand" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Cambio de Contraseña (Opcional)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Deja estos campos en blanco si no deseas modificar tu contraseña.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Contraseña Actual */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordActual}
                      onChange={(e) => setPasswordActual(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                    />
                    {fieldErrors.password_actual && (
                      <p className="text-[10px] text-rose-600 mt-1 font-medium">
                        {fieldErrors.password_actual[0]}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nueva Contraseña */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        value={passwordNuevo}
                        onChange={(e) => setPasswordNuevo(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                      />
                      {fieldErrors.password && (
                        <p className="text-[10px] text-rose-600 mt-1 font-medium">
                          {fieldErrors.password[0]}
                        </p>
                      )}
                    </div>

                    {/* Confirmación */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        minLength={6}
                        placeholder="Repite la nueva contraseña"
                        value={passwordConfirmacion}
                        onChange={(e) => setPasswordConfirmacion(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="gap-2 text-xs sm:text-sm font-semibold shadow-sm shadow-brand/20 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando cambios...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Cambios de Perfil</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
