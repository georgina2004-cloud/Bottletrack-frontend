"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { HexColorPicker } from "react-colorful";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { useCompanyConfig } from "@/context/CompanyConfigContext";
import { getStoredToken } from "@/lib/auth";
import {
  obtenerConfiguracionEmpresa,
  actualizarConfiguracionEmpresa,
  ValidationError,
} from "@/lib/api";
import { ConfiguracionEmpresa } from "@/types/configuracion";
import { Button } from "@/components/ui/Button";
import {
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  Coins,
  Palette,
  Upload,
  Pencil,
  Save,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Database,
  ChevronRight,
} from "lucide-react";

function getFullImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const backendBase = apiBase.replace(/\/api\/?$/, "");
  return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

const MONEDAS_DISPONIBLES = [
  { simbolo: "C$", nombre: "Córdoba Nicaragüense (C$)" },
  { simbolo: "$", nombre: "Dólar Estadounidense ($ USD)" },
  { simbolo: "€", nombre: "Euro (€ EUR)" },
];

interface FormConfigState {
  nombre_licoreria: string;
  eslogan: string;
  telefono: string;
  email: string;
  direccion: string;
  moneda: string;
  color_primario: string;
}

export default function ConfiguracionPage() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const { refetchConfig, actualizarConfig } = useCompanyConfig();

  // Estados de datos
  const [configuracion, setConfiguracion] = useState<ConfiguracionEmpresa | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);

  // Estados de edición
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const colorPickerContainerRef = useRef<HTMLDivElement>(null);

  const [formState, setFormState] = useState<FormConfigState>({
    nombre_licoreria: "",
    eslogan: "",
    telefono: "",
    email: "",
    direccion: "",
    moneda: "C$",
    color_primario: "#D17B00",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Subida de Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cerrar el popover del Color Picker al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        colorPickerContainerRef.current &&
        !colorPickerContainerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    }
    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showColorPicker]);

  // Carga inicial
  const cargarConfiguracion = useCallback(async () => {
    if (isAuthLoading) return;

    setIsLoading(true);
    setError(null);
    setImgError(false);

    try {
      const authToken = token || getStoredToken();
      if (!authToken) {
        setError("No se encontró una sesión activa válida. Por favor, vuelve a iniciar sesión.");
        setIsLoading(false);
        return;
      }

      const data = await obtenerConfiguracionEmpresa(authToken);
      if (data) {
        setConfiguracion(data);
        if (data.color_primario && typeof document !== "undefined") {
          document.documentElement.style.setProperty("--primary-brand", data.color_primario);
        }
      }
    } catch (err: unknown) {
      console.error("[ConfiguracionPage] Error al cargar configuración:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al conectar con el servidor para consultar la configuración."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthLoading]);

  useEffect(() => {
    if (!isAuthLoading) {
      cargarConfiguracion();
    }
  }, [cargarConfiguracion, isAuthLoading]);

  // Manejo de cambio de color en vivo
  const handleColorChange = (nuevoColor: string) => {
    // Asegurar formato con prefijo #
    const formatted = nuevoColor.startsWith("#") ? nuevoColor : `#${nuevoColor}`;
    setFormState((prev) => ({ ...prev, color_primario: formatted }));
    if (typeof document !== "undefined" && formatted) {
      document.documentElement.style.setProperty("--primary-brand", formatted);
    }
  };

  // Iniciar Modo Edición
  const handleIniciarEdicion = () => {
    if (!configuracion) return;
    setFormState({
      nombre_licoreria: configuracion.nombre_licoreria || "",
      eslogan: configuracion.eslogan || "",
      telefono: configuracion.telefono || "",
      email:
        configuracion.email_empresa ||
        (configuracion as unknown as { email?: string })?.email ||
        "",
      direccion: configuracion.direccion || "",
      moneda: configuracion.moneda || "C$",
      color_primario: configuracion.color_primario || "#D17B00",
    });
    setLogoFile(null);
    setLogoPreview(null);
    setShowColorPicker(false);
    setFieldErrors({});
    setError(null);
    setSuccessMsg(null);
    setIsEditing(true);
  };

  // Cancelar Edición
  const handleCancelarEdicion = () => {
    setIsEditing(false);
    setShowColorPicker(false);
    setLogoFile(null);
    setLogoPreview(null);
    setFieldErrors({});
    setError(null);
    // Restaurar color original en el DOM
    if (configuracion?.color_primario && typeof document !== "undefined") {
      document.documentElement.style.setProperty("--primary-brand", configuracion.color_primario);
    }
  };

  // Manejador del selector de archivo de Logo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("El archivo seleccionado debe ser una imagen válida (PNG, JPG, WEBP, SVG).");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("La imagen no debe superar los 4MB de tamaño.");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError(null);
    setImgError(false);
  };

  const handleDescartarLogoNuevo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Guardar Cambios
  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.nombre_licoreria.trim()) {
      setError("El nombre de la licorería es obligatorio.");
      return;
    }

    setIsSaving(true);
    setShowColorPicker(false);
    setError(null);
    setSuccessMsg(null);
    setFieldErrors({});

    try {
      const authToken = token || getStoredToken();
      const formData = new FormData();

      formData.append("nombre_licoreria", formState.nombre_licoreria.trim());
      formData.append("eslogan", formState.eslogan.trim());
      formData.append("telefono", formState.telefono.trim());
      formData.append("email_empresa", formState.email.trim());
      formData.append("email", formState.email.trim());
      formData.append("direccion", formState.direccion.trim());
      formData.append("moneda", formState.moneda);
      formData.append("color_primario", formState.color_primario);

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const updated = await actualizarConfiguracionEmpresa(formData, authToken);

      // 1. Actualizar estado local
      setConfiguracion(updated);
      setLogoFile(null);
      setLogoPreview(null);
      setIsEditing(false);
      setSuccessMsg("¡Configuración de la empresa guardada y actualizada exitosamente!");

      // 2. Inyectar variable CSS en tiempo real
      if (updated.color_primario && typeof document !== "undefined") {
        document.documentElement.style.setProperty("--primary-brand", updated.color_primario);
      }

      // 3. Sincronizar contexto global en vivo
      actualizarConfig(updated);
      await refetchConfig();

      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      console.error("[ConfiguracionPage] Error al guardar:", err);
      if (err instanceof ValidationError) {
        setFieldErrors(err.errors);
        setError("Por favor corrige los campos señalados a continuación.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron guardar los cambios en la configuración."
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefetch = async () => {
    await cargarConfiguracion();
    await refetchConfig();
  };

  const currentLogoUrl = logoPreview || (!imgError ? getFullImageUrl(configuracion?.logo_url) : null);
  const initialLetter =
    (isEditing ? formState.nombre_licoreria : configuracion?.nombre_licoreria)?.charAt(0).toUpperCase() ||
    "B";
  const emailDisplay =
    configuracion?.email_empresa ||
    (configuracion as unknown as { email?: string })?.email ||
    null;

  return (
    <ProtectedByRole modulo="configuracion">
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Encabezado Principal y Barra de Acciones */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand/10 text-brand rounded-2xl">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] tracking-tight">
                  Configuración de la Empresa
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Detalles de identidad comercial, moneda y apariencia de la licorería.
                </p>
              </div>
            </div>

            {/* Acciones Superiores */}
            <div className="flex items-center gap-2.5 self-start sm:self-center">
              {!isEditing ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleIniciarEdicion}
                    disabled={isLoading}
                    className="gap-2 text-xs sm:text-sm font-semibold shadow-sm shadow-brand/20 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar Configuración</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRefetch}
                    disabled={isLoading || isAuthLoading}
                    className="gap-1.5 text-xs text-slate-700 shadow-2xs cursor-pointer"
                    title="Actualizar información"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-brand" : ""}`} />
                    <span className="hidden sm:inline">Refrescar</span>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelarEdicion}
                    disabled={isSaving}
                    className="gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGuardarCambios}
                    disabled={isSaving}
                    className="gap-1.5 text-xs font-semibold shadow-sm shadow-brand/20 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Banner de Notificación de Éxito */}
          {successMsg && (
            <div
              role="alert"
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMsg(null)}
                className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Banner de Estado de Error */}
          {error && !isLoading && (
            <div
              role="alert"
              className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start justify-between gap-3 shadow-2xs animate-in fade-in"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Error al procesar la configuración</span>
                  <span>{error}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Estado de Carga Inicial (Skeleton Loader) */}
          {isLoading || isAuthLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-5 w-40 bg-slate-200 rounded-lg mb-4" />
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-24 h-24 bg-slate-200 rounded-2xl shrink-0" />
                  <div className="space-y-3 flex-1 w-full">
                    <div className="h-4 w-48 bg-slate-200 rounded" />
                    <div className="h-3 w-64 bg-slate-100 rounded" />
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="h-5 w-56 bg-slate-200 rounded-lg mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="h-16 bg-slate-100 rounded-xl" />
                  <div className="h-16 bg-slate-100 rounded-xl" />
                  <div className="h-16 bg-slate-100 rounded-xl" />
                </div>
              </div>
            </div>
          ) : configuracion ? (
            <form onSubmit={handleGuardarCambios} className="space-y-6">
              {/* ========================================================================= */}
              {/* SECCIÓN 1: IDENTIDAD & MARCA                                              */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-brand/10 text-brand rounded-xl">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      Identidad & Marca
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {isEditing ? "Modo Edición" : "Información Pública"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Vista previa y Carga del Logo */}
                  <div className="flex flex-col items-center gap-2.5 shrink-0">
                    <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-[#FAFAF8] p-2 flex items-center justify-center shadow-2xs overflow-hidden relative group">
                      {currentLogoUrl ? (
                        <img
                          src={currentLogoUrl}
                          alt={isEditing ? formState.nombre_licoreria : configuracion.nombre_licoreria}
                          onError={() => setImgError(true)}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center">
                          <span className="font-serif font-bold text-3xl text-brand">
                            {initialLetter}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                            Sin Logo
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botón de Selección de Archivo en Modo Edición */}
                    {isEditing && (
                      <div className="flex flex-col items-center gap-1.5">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="logo-upload-input"
                        />
                        <label
                          htmlFor="logo-upload-input"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>{logoFile || currentLogoUrl ? "Cambiar Logo" : "Subir Logo"}</span>
                        </label>

                        {logoFile && (
                          <button
                            type="button"
                            onClick={handleDescartarLogoNuevo}
                            className="text-[11px] text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Descartar nuevo</span>
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400 text-center">
                          PNG, JPG o WEBP (máx. 4MB)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Campos de Identidad */}
                  <div className="flex-1 w-full space-y-4">
                    {/* Nombre de la Licorería */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Nombre de la Licorería <span className="text-rose-500">*</span>
                      </label>
                      {isEditing ? (
                        <div>
                          <input
                            type="text"
                            value={formState.nombre_licoreria}
                            onChange={(e) =>
                              setFormState({ ...formState, nombre_licoreria: e.target.value })
                            }
                            placeholder="Ej. Licorería El Trago Fino"
                            required
                            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-900 font-semibold"
                          />
                          {fieldErrors.nombre_licoreria && (
                            <p className="text-[11px] text-rose-600 mt-1 font-medium">
                              {fieldErrors.nombre_licoreria[0]}
                            </p>
                          )}
                        </div>
                      ) : (
                        <h3 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                          {configuracion.nombre_licoreria}
                        </h3>
                      )}
                    </div>

                    {/* Eslogan Comercial */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Eslogan Comercial
                      </label>
                      {isEditing ? (
                        <div>
                          <input
                            type="text"
                            value={formState.eslogan}
                            onChange={(e) =>
                              setFormState({ ...formState, eslogan: e.target.value })
                            }
                            placeholder="Ej. Las mejores bebidas al mejor precio"
                            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-800"
                          />
                          {fieldErrors.eslogan && (
                            <p className="text-[11px] text-rose-600 mt-1 font-medium">
                              {fieldErrors.eslogan[0]}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-slate-600 font-medium">
                          {configuracion.eslogan || (
                            <span className="text-slate-400 italic">No especificado</span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Color Primario de Marca (Color Picker Interactivo) */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Color Primario de Marca
                      </label>
                      {isEditing ? (
                        <div className="space-y-2.5">
                          <div
                            ref={colorPickerContainerRef}
                            className="relative flex items-center gap-3"
                          >
                            {/* Botón Swatch que activa el popover interactivo */}
                            <button
                              type="button"
                              onClick={() => setShowColorPicker(!showColorPicker)}
                              className="w-10 h-10 rounded-xl border border-slate-300 shadow-2xs cursor-pointer p-0.5 relative group transition-transform hover:scale-105 shrink-0"
                              title="Abrir selector interactivo de color"
                              style={{ backgroundColor: formState.color_primario }}
                            >
                              <div className="w-full h-full rounded-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 text-white transition-opacity">
                                <Palette className="w-3.5 h-3.5" />
                              </div>
                            </button>

                            {/* Input Hexadecimal sincronizado */}
                            <div className="relative">
                              <input
                                type="text"
                                value={formState.color_primario}
                                onChange={(e) => handleColorChange(e.target.value)}
                                onClick={() => setShowColorPicker(true)}
                                placeholder="#D17B00"
                                maxLength={7}
                                className="w-32 px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl uppercase text-slate-800 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                              />
                            </div>

                            <span className="text-[11px] text-slate-400 hidden sm:inline">
                              Haz clic en el color para abrir el gradiente
                            </span>

                            {/* Popover flotante del HexColorPicker de react-colorful */}
                            {showColorPicker && (
                              <div className="absolute top-full mt-2 left-0 z-50 bg-white p-3.5 rounded-2xl shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                                <HexColorPicker
                                  color={formState.color_primario}
                                  onChange={handleColorChange}
                                  className="!w-52 !h-48"
                                />

                                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-4 h-4 rounded-md border border-slate-200 shrink-0"
                                      style={{ backgroundColor: formState.color_primario }}
                                    />
                                    <span className="font-mono text-xs font-bold text-slate-800 uppercase">
                                      {formState.color_primario}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setShowColorPicker(false)}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors"
                                  >
                                    Cerrar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80 shadow-2xs">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-2xs shrink-0"
                            style={{ backgroundColor: configuracion.color_primario || "#D17B00" }}
                          />
                          <span className="font-mono text-xs font-bold text-slate-800 uppercase">
                            {configuracion.color_primario || "#D17B00"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECCIÓN 2: DATOS DE CONTACTO Y UBICACIÓN                                  */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      Datos de Contacto y Ubicación
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Operaciones & Facturación
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Teléfono */}
                  <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                      <label className="text-[11px] font-bold uppercase tracking-wider">
                        Teléfono
                      </label>
                    </div>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={formState.telefono}
                          onChange={(e) =>
                            setFormState({ ...formState, telefono: e.target.value })
                          }
                          placeholder="+505 8888-8888"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-800 font-semibold"
                        />
                        {fieldErrors.telefono && (
                          <p className="text-[10px] text-rose-600 mt-1 font-medium">
                            {fieldErrors.telefono[0]}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm font-bold text-slate-800 block truncate">
                        {configuracion.telefono || (
                          <span className="text-slate-400 font-normal italic">No registrado</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Correo Electrónico */}
                  <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5" />
                      <label className="text-[11px] font-bold uppercase tracking-wider">
                        Email de Contacto
                      </label>
                    </div>
                    {isEditing ? (
                      <div>
                        <input
                          type="email"
                          value={formState.email}
                          onChange={(e) =>
                            setFormState({ ...formState, email: e.target.value })
                          }
                          placeholder="contacto@licoreria.com"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-800 font-semibold"
                        />
                        {fieldErrors.email_empresa && (
                          <p className="text-[10px] text-rose-600 mt-1 font-medium">
                            {fieldErrors.email_empresa[0]}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm font-bold text-slate-800 block truncate">
                        {emailDisplay || (
                          <span className="text-slate-400 font-normal italic">No registrado</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Dirección Física */}
                  <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <label className="text-[11px] font-bold uppercase tracking-wider">
                        Dirección Física
                      </label>
                    </div>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={formState.direccion}
                          onChange={(e) =>
                            setFormState({ ...formState, direccion: e.target.value })
                          }
                          placeholder="Calle Principal, Módulo 4"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-800 font-semibold"
                        />
                        {fieldErrors.direccion && (
                          <p className="text-[10px] text-rose-600 mt-1 font-medium">
                            {fieldErrors.direccion[0]}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm font-bold text-slate-800 block truncate">
                        {configuracion.direccion || (
                          <span className="text-slate-400 font-normal italic">No registrada</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECCIÓN 3: PREFERENCIAS OPERATIVAS                                        */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Coins className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      Preferencias Operativas
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Sistema & Finanzas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Moneda Principal */}
                  <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex flex-col justify-between gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Moneda Principal del Sistema
                      </label>
                      {isEditing ? (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {MONEDAS_DISPONIBLES.map((m) => (
                            <button
                              key={m.simbolo}
                              type="button"
                              onClick={() => setFormState({ ...formState, moneda: m.simbolo })}
                              className={`
                                p-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer
                                ${
                                  formState.moneda === m.simbolo
                                    ? "bg-brand text-white border-brand shadow-sm shadow-brand/25"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                }
                              `}
                            >
                              <span className="block text-sm">{m.simbolo}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm sm:text-base font-bold text-slate-900 block mt-1">
                          {configuracion.moneda === "C$"
                            ? "C$ — Córdoba Nicaragüense"
                            : configuracion.moneda === "$"
                            ? "$ — Dólar Estadounidense (USD)"
                            : configuracion.moneda === "€"
                            ? "€ — Euro (EUR)"
                            : configuracion.moneda}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Estado del Tenant */}
                  <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Estado del Tenant
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        Inicializado y Activo
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Activo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECCIÓN 4: BASE DE DATOS Y RESPALDOS                                      */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-brand/10 text-brand rounded-xl">
                      <Database className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      Base de Datos & Copias de Seguridad
                    </h2>
                  </div>
                  <Link href="/respaldos">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs font-semibold text-brand border-brand/30 hover:bg-brand/10 cursor-pointer"
                    >
                      <span>Gestionar Respaldos</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                  <div className="space-y-0.5">
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Generación de Respaldos MySQL (.sql) y Restauración
                    </p>
                    <p className="text-xs text-slate-500">
                      Descarga copias de seguridad de todas las tablas o restaura el estado del sistema desde una copia local.
                    </p>
                  </div>
                  <Link href="/respaldos" className="w-full sm:w-auto shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      className="w-full sm:w-auto text-xs font-semibold gap-1.5 cursor-pointer shadow-xs shadow-brand/20"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Ir a Respaldos</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Botones de acción inferiores en modo edición */}
              {isEditing && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelarEdicion}
                    disabled={isSaving}
                    className="text-xs sm:text-sm font-semibold text-slate-700"
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    <span>Cancelar</span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="text-xs sm:text-sm font-semibold shadow-sm shadow-brand/20"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        <span>Guardando cambios...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1.5" />
                        <span>Guardar Configuración</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
