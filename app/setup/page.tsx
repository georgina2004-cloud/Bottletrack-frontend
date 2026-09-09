"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useCompanyConfig } from "@/context/CompanyConfigContext";
import {
  verificarEstadoSetup,
  inicializarSetup,
  ValidationError,
  SetupConflictError,
} from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserRole } from "@/types/auth";
import {
  Store,
  UserCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Coins,
  Palette,
  Upload,
  Image as ImageIcon,
  Trash2,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

/**
 * Esquema de validación completo con Zod (Paso 1 + Paso 2)
 */
const setupSchema = z
  .object({
    // Paso 1: Datos de la licorería
    nombre_licoreria: z
      .string()
      .min(2, "El nombre de la licorería debe tener al menos 2 caracteres.")
      .max(100, "El nombre no puede exceder los 100 caracteres."),
    eslogan: z.string().max(150, "El eslogan no puede exceder los 150 caracteres.").optional(),
    telefono: z.string().max(30, "El teléfono no puede exceder los 30 caracteres.").optional(),
    email_empresa: z
      .string()
      .email("Ingresa un formato de correo electrónico válido.")
      .optional()
      .or(z.literal("")),
    direccion: z.string().max(255, "La dirección no puede exceder los 255 caracteres.").optional(),
    moneda: z.string().min(1, "Debes seleccionar la moneda principal."),
    color_primario: z
      .string()
      .regex(/^#([0-9A-Fa-f]{6})$/, "Ingresa un color hexadecimal válido (ej. #D17B00)."),

    // Paso 2: Cuenta del administrador
    admin_name: z
      .string()
      .min(2, "El nombre del administrador debe tener al menos 2 caracteres.")
      .max(100, "El nombre no puede exceder los 100 caracteres."),
    admin_email: z
      .string()
      .min(1, "El correo del administrador es obligatorio.")
      .email("Ingresa un correo electrónico válido."),
    admin_password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres."),
    admin_password_confirmation: z
      .string()
      .min(8, "La confirmación de contraseña debe tener al menos 8 caracteres."),
  })
  .refine((data) => data.admin_password === data.admin_password_confirmation, {
    message: "Las contraseñas no coinciden.",
    path: ["admin_password_confirmation"],
  });

type SetupFormValues = z.infer<typeof setupSchema>;

const OPCIONES_MONEDA = [
  { valor: "C$", etiqueta: "C$ — Córdoba Nicaragüense" },
  { valor: "$", etiqueta: "$ — Dólar Estadounidense (USD)" },
  { valor: "€", etiqueta: "€ — Euro (EUR)" },
  { valor: "MXN$", etiqueta: "MXN$ — Peso Mexicano" },
  { valor: "Q", etiqueta: "Q — Quetzal Guatemalteco" },
];

export default function SetupPage() {
  const router = useRouter();
  const { setAuthData } = useAuth();
  const { refetchConfig } = useCompanyConfig();

  // Estados de control de la pantalla
  const [isCheckingEstado, setIsCheckingEstado] = useState<boolean>(true);
  const [pasoActual, setPasoActual] = useState<1 | 2>(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [exito, setExito] = useState<boolean>(false);

  // Estados para Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Visibilidad de contraseñas
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      nombre_licoreria: "",
      eslogan: "",
      telefono: "",
      email_empresa: "",
      direccion: "",
      moneda: "C$",
      color_primario: "#D17B00",
      admin_name: "",
      admin_email: "",
      admin_password: "",
      admin_password_confirmation: "",
    },
    mode: "onBlur",
  });

  const colorPrimarioSeleccionado = watch("color_primario");

  // =========================================================================
  // 3. PROTECCIÓN INVERSA: Verificar si el sistema ya está configurado
  // =========================================================================
  useEffect(() => {
    let isMounted = true;

    async function checkSetupEstado() {
      try {
        const res = await verificarEstadoSetup();
        if (res.configurado) {
          // Si ya está configurado, redirigir a login inmediatamente
          router.replace("/login?motivo=ya_configurado");
          return;
        }
      } catch (err) {
        console.error("Error al consultar /api/setup/estado:", err);
      } finally {
        if (isMounted) {
          setIsCheckingEstado(false);
        }
      }
    }

    checkSetupEstado();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Manejo de carga de archivo de logo con previsualización
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoError(null);

    if (!file) {
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      setLogoError("El archivo debe ser una imagen válida (PNG, JPG, SVG, WEBP).");
      return;
    }

    // Validar tamaño máximo (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("El logo no debe exceder los 2MB de tamaño.");
      return;
    }

    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
  };

  const handleEliminarLogo = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(null);
  };

  // Validación del Paso 1 antes de avanzar al Paso 2
  const handleAvanzarPaso2 = async () => {
    setServerError(null);
    const isValidStep1 = await trigger([
      "nombre_licoreria",
      "eslogan",
      "telefono",
      "email_empresa",
      "direccion",
      "moneda",
      "color_primario",
    ]);

    if (isValidStep1) {
      setPasoActual(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // =========================================================================
  // ENVÍO FINAL DEL FORMULARIO MULTIPART/FORM-DATA
  // =========================================================================
  const onSubmit = async (values: SetupFormValues) => {
    setServerError(null);

    const formData = new FormData();
    formData.append("nombre_licoreria", values.nombre_licoreria.trim());

    if (values.eslogan?.trim()) {
      formData.append("eslogan", values.eslogan.trim());
    }
    if (values.telefono?.trim()) {
      formData.append("telefono", values.telefono.trim());
    }
    if (values.email_empresa?.trim()) {
      formData.append("email_empresa", values.email_empresa.trim());
    }
    if (values.direccion?.trim()) {
      formData.append("direccion", values.direccion.trim());
    }

    formData.append("moneda", values.moneda);
    formData.append("color_primario", values.color_primario);

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    formData.append("admin_name", values.admin_name.trim());
    formData.append("admin_email", values.admin_email.trim());
    formData.append("admin_password", values.admin_password);
    formData.append("admin_password_confirmation", values.admin_password_confirmation);

    try {
      const respuesta = await inicializarSetup(formData);
      setExito(true);

      // Auto-login: Guardar token y usuario en AuthContext
      setAuthData(
        respuesta.token,
        {
          ...respuesta.user,
          role: respuesta.user.role as UserRole,
        },
        true
      );

      // Actualizar el branding en memoria
      await refetchConfig();

      // Redirigir al dashboard administrativo
      setTimeout(() => {
        router.replace("/dashboard");
      }, 1200);
    } catch (err: unknown) {
      if (err instanceof SetupConflictError) {
        router.replace("/login?motivo=ya_configurado");
        return;
      }

      if (err instanceof ValidationError) {
        const errores = err.errors;
        let huboErrorPaso1 = false;

        Object.keys(errores).forEach((campo) => {
          const mensaje = errores[campo]?.[0] || "Dato inválido";
          // Mapear campos conocidos a react-hook-form
          if (
            [
              "nombre_licoreria",
              "eslogan",
              "telefono",
              "email_empresa",
              "direccion",
              "moneda",
              "color_primario",
            ].includes(campo)
          ) {
            huboErrorPaso1 = true;
            setError(campo as keyof SetupFormValues, { message: mensaje });
          } else if (
            [
              "admin_name",
              "admin_email",
              "admin_password",
              "admin_password_confirmation",
            ].includes(campo)
          ) {
            setError(campo as keyof SetupFormValues, { message: mensaje });
          } else if (campo === "logo") {
            setLogoError(mensaje);
            huboErrorPaso1 = true;
          }
        });

        if (huboErrorPaso1 && pasoActual === 2) {
          setPasoActual(1);
          setServerError("Corrige los datos indicados en la configuración de la licorería.");
        } else {
          setServerError(err.message || "Revisa los campos señalados.");
        }
        return;
      }

      setServerError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al inicializar la plataforma. Por favor intenta de nuevo."
      );
    }
  };

  // Pantalla de carga mientras se consulta el estado de configuración inicial
  if (isCheckingEstado) {
    return (
      <main className="min-h-screen w-full bg-[#FAFAF8] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#D17B00]/10 border border-[#D17B00]/20 flex items-center justify-center mb-4 shadow-sm">
            <Loader2 className="w-7 h-7 animate-spin text-[#D17B00]" />
          </div>
          <h2 className="font-bold text-xl text-slate-800 tracking-tight">
            BottleTrack
          </h2>
          <p className="text-xs text-slate-500 mt-1 animate-pulse">
            Preparando asistente de configuración inicial...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#FAFAF8] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Resplandores ambientales decorativos */}
      <div
        className="absolute -top-32 -left-32 w-[30rem] h-[30rem] bg-[#D17B00]/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-slate-200/60 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-6 sm:p-10 relative z-10">
        {/* Cabecera del Asistente */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-[#D17B00] mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Configuración de Nueva Licorería</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Bienvenido a BottleTrack
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            Inicializa tu sistema en dos pasos para comenzar a controlar tu inventario y ventas.
          </p>
        </div>

        {/* Stepper / Indicador de Pasos */}
        <div className="flex items-center justify-between max-w-md mx-auto mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-[#D17B00] transition-all duration-300 -z-0"
            style={{ width: pasoActual === 1 ? "25%" : "100%" }}
          />

          {/* Paso 1 Badge */}
          <button
            type="button"
            onClick={() => setPasoActual(1)}
            className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-full relative z-10 cursor-pointer text-left"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-2xs ${
                pasoActual === 1
                  ? "bg-[#D17B00] text-white ring-4 ring-[#D17B00]/15"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {pasoActual === 2 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
            </div>
            <div className="hidden sm:block">
              <span className="text-[11px] font-bold text-slate-800 block leading-tight">
                Licorería
              </span>
              <span className="text-[10px] text-slate-400 block">Identidad y marca</span>
            </div>
          </button>

          {/* Paso 2 Badge */}
          <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-full relative z-10 text-left">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-2xs ${
                pasoActual === 2
                  ? "bg-[#D17B00] text-white ring-4 ring-[#D17B00]/15"
                  : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}
            >
              2
            </div>
            <div className="hidden sm:block">
              <span className="text-[11px] font-bold text-slate-800 block leading-tight">
                Administrador
              </span>
              <span className="text-[10px] text-slate-400 block">Cuenta de acceso</span>
            </div>
          </div>
        </div>

        {/* Alerta de Error General */}
        {serverError && (
          <div
            role="alert"
            className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3 shadow-2xs animate-in fade-in"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">No se pudo completar la inicialización</span>
              <span className="mt-0.5 block">{serverError}</span>
            </div>
          </div>
        )}

        {/* Alerta de Éxito */}
        {exito && (
          <div
            role="alert"
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-3 shadow-2xs animate-in fade-in"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block text-sm">¡Configuración inicial exitosa!</span>
              <span>Iniciando sesión y redirigiendo al dashboard...</span>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ========================================================================= */}
          {/* PASO 1: DATOS DE LA LICORERÍA                                             */}
          {/* ========================================================================= */}
          {pasoActual === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Store className="w-4 h-4 text-[#D17B00]" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Paso 1: Datos de tu Licorería
                </h3>
              </div>

              {/* Nombre de la Licorería */}
              <div>
                <Input
                  label="Nombre de la Licorería"
                  placeholder="Ej. Licorería La Cava Real"
                  required
                  error={errors.nombre_licoreria?.message}
                  leftIcon={<Building2 className="w-4 h-4 text-slate-400" />}
                  {...register("nombre_licoreria")}
                />
              </div>

              {/* Eslogan */}
              <div>
                <Input
                  label="Eslogan o Frase Comercial (Opcional)"
                  placeholder="Ej. Los mejores licores y destilados finos"
                  error={errors.eslogan?.message}
                  {...register("eslogan")}
                />
              </div>

              {/* Teléfono y Correo Electrónico de la Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Teléfono de Contacto"
                    placeholder="Ej. +505 8888-1234"
                    error={errors.telefono?.message}
                    leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                    {...register("telefono")}
                  />
                </div>
                <div>
                  <Input
                    label="Email Corporativo"
                    type="email"
                    placeholder="contacto@licorerialacava.com"
                    error={errors.email_empresa?.message}
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                    {...register("email_empresa")}
                  />
                </div>
              </div>

              {/* Dirección Física */}
              <div>
                <Input
                  label="Dirección Física (Opcional)"
                  placeholder="Ej. De la rotonda El Güegüense 2c al sur, Managua"
                  error={errors.direccion?.message}
                  leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                  {...register("direccion")}
                />
              </div>

              {/* Moneda Principal y Color Primario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Moneda */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-slate-400" />
                    <span>Moneda Principal</span>
                    <span className="text-[#D17B00] ml-1">*</span>
                  </label>
                  <select
                    {...register("moneda")}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#D17B00] focus:ring-3 focus:ring-[#D17B00]/15 text-[#18181B] font-medium cursor-pointer shadow-xs"
                  >
                    {OPCIONES_MONEDA.map((m) => (
                      <option key={m.valor} value={m.valor}>
                        {m.etiqueta}
                      </option>
                    ))}
                  </select>
                  {errors.moneda && (
                    <p className="text-xs text-rose-600 font-medium">
                      {errors.moneda.message}
                    </p>
                  )}
                </div>

                {/* Color Primario */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-400" />
                    <span>Color de Marca</span>
                    <span className="text-[#D17B00] ml-1">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorPrimarioSeleccionado || "#D17B00"}
                      onChange={(e) => setValue("color_primario", e.target.value)}
                      className="w-11 h-10 p-1 rounded-lg border border-slate-300 bg-white cursor-pointer shadow-xs"
                      title="Seleccionar color de marca"
                    />
                    <input
                      type="text"
                      {...register("color_primario")}
                      placeholder="#D17B00"
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#D17B00] focus:ring-3 focus:ring-[#D17B00]/15 text-[#18181B] uppercase shadow-xs"
                    />
                  </div>
                  {errors.color_primario && (
                    <p className="text-xs text-rose-600 font-medium">
                      {errors.color_primario.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Carga de Logo con Preview */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Logo de la Licorería (Opcional)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, SVG o WEBP (máx. 2MB)</span>
                </label>

                {logoPreview ? (
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white p-1 overflow-hidden flex items-center justify-center shadow-2xs">
                        <img
                          src={logoPreview}
                          alt="Vista previa del logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block truncate max-w-[200px]">
                          {logoFile?.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : ""}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleEliminarLogo}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Quitar logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#D17B00]/50 bg-slate-50/50 hover:bg-amber-50/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-[#D17B00]/10 flex items-center justify-center text-slate-400 group-hover:text-[#D17B00] mb-2 transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                      Haz clic para seleccionar el logo de tu empresa
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Recomendado formato horizontal o cuadrado con fondo transparente
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}

                {logoError && (
                  <p className="text-xs text-rose-600 font-medium">{logoError}</p>
                )}
              </div>

              {/* Botón para continuar al paso 2 */}
              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={handleAvanzarPaso2}
                  className="gap-2 text-xs sm:text-sm font-semibold shadow-sm shadow-[#D17B00]/20"
                >
                  <span>Continuar a Cuenta Administrador</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASO 2: CUENTA DEL ADMINISTRADOR                                          */}
          {/* ========================================================================= */}
          {pasoActual === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#D17B00]" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Paso 2: Cuenta del Administrador
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Acceso con rol <strong className="text-slate-700">Administrador</strong>
                </span>
              </div>

              <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#D17B00] shrink-0 mt-0.5" />
                <span>
                  Esta cuenta tendrá control total sobre la configuración, inventario, ventas,
                  compras y gestión de usuarios.
                </span>
              </div>

              {/* Nombre del Administrador */}
              <div>
                <Input
                  label="Nombre Completo del Administrador"
                  placeholder="Ej. Juan Pérez"
                  required
                  error={errors.admin_name?.message}
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                  {...register("admin_name")}
                />
              </div>

              {/* Email del Administrador */}
              <div>
                <Input
                  label="Correo Electrónico de Acceso"
                  type="email"
                  placeholder="admin@licorerialacava.com"
                  required
                  error={errors.admin_email?.message}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  {...register("admin_email")}
                />
              </div>

              {/* Contraseña */}
              <div>
                <Input
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  required
                  error={errors.admin_password?.message}
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      tabIndex={-1}
                      title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                  {...register("admin_password")}
                />
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <Input
                  label="Confirmar Contraseña"
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="Repite la contraseña"
                  required
                  error={errors.admin_password_confirmation?.message}
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      tabIndex={-1}
                      title={showPasswordConfirm ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                  {...register("admin_password_confirmation")}
                />
              </div>

              {/* Botones de navegación del paso 2 */}
              <div className="pt-4 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPasoActual(1)}
                  disabled={isSubmitting || exito}
                  className="gap-2 text-xs text-slate-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver al Paso 1</span>
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || exito}
                  className="gap-2 text-xs sm:text-sm font-semibold shadow-sm shadow-[#D17B00]/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Inicializando Sistema...</span>
                    </>
                  ) : exito ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>¡Inicializado!</span>
                    </>
                  ) : (
                    <>
                      <span>Finalizar e Inicializar Licorería</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
