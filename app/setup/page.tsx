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
  ShieldCheck,
  Wine,
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
      .regex(/^#([0-9A-Fa-f]{6})$/, "Ingresa un color hexadecimal válido (ej. #171717)."),

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
      color_primario: "#171717",
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
      <main className="min-h-screen w-full bg-[#171513] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 flex items-center justify-center mb-4 shadow-lg shadow-black/40">
            <Loader2 className="w-7 h-7 animate-spin text-neutral-300" />
          </div>
          <h2 className="font-bold text-xl text-white tracking-tight">
            BottleTrack
          </h2>
          <p className="text-xs text-stone-400 mt-1 animate-pulse">
            Preparando asistente de configuración inicial...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#F4F3EE] lg:bg-[#ECEBE4] flex items-center justify-center p-0 lg:p-6 xl:p-10 font-sans">
      {/* Contenedor Principal de Dos Columnas */}
      <div className="w-full min-h-screen lg:min-h-0 lg:max-w-6xl xl:max-w-7xl bg-white lg:rounded-3xl lg:shadow-2xl lg:shadow-slate-900/10 lg:border lg:border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12">

        {/* ========================================================================= */}
        {/* COLUMNA IZQUIERDA: Identidad, Ilustración Line-Art y Bienvenida (Fija)     */}
        {/* ========================================================================= */}
        <aside className="lg:col-span-5 xl:col-span-5 bg-white lg:bg-[#FAF9F5] p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-center relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200/80">
          {/* Resplandores ambientales decorativos suaves */}
          <div
            className="absolute -top-24 -left-24 w-72 h-72 bg-slate-200/40 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-24 -right-24 w-80 h-80 bg-stone-100/50 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Encabezado Fijo: Título como primer elemento visible */}
          <div className="relative z-10 space-y-2.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Bienvenido a <span className="text-[#A38F7D] font-black">BottleTrack</span>
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed max-w-md">
              Configura tu licorería en minutos y empieza a controlar tu inventario, ventas y facturación desde un solo lugar.
            </p>
          </div>

          {/* Ilustración SVG Line-Art Original: Escena de Licorería & Bar Acogedor en Color */}
          <div className="hidden lg:flex items-center justify-center my-6 xl:my-8 relative z-10">
            <svg
              viewBox="0 0 500 370"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full max-w-sm xl:max-w-md mx-auto drop-shadow-md"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="setup-lamp-glow" cx="50%" cy="10%" r="80%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.18" />
                  <stop offset="50%" stopColor="#D17B00" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#FAF9F5" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="setup-amber-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#D17B00" />
                  <stop offset="100%" stopColor="#9A3412" />
                </linearGradient>
                <linearGradient id="setup-bottle-liquid" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#D17B00" stopOpacity="0.35" />
                </linearGradient>
              </defs>

              {/* Cono de luz cálida desde la lámpara de techo */}
              <path
                d="M250 35 L430 350 L70 350 Z"
                fill="url(#setup-lamp-glow)"
              />

              {/* Lámpara Colgante */}
              <line x1="250" y1="0" x2="250" y2="32" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M224 32 Q250 18 276 32 L288 48 H212 Z" fill="#334155" stroke="#D17B00" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="250" cy="50" r="4.5" fill="#FEF3C7" />
              <circle cx="250" cy="50" r="12" fill="#F59E0B" fillOpacity="0.25" />

              {/* Letrero Colgante Clásico de Fundación (Puente visual desde la parte superior) */}
              <line x1="90" y1="0" x2="90" y2="16" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="2 2" />
              <line x1="140" y1="0" x2="140" y2="16" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="2 2" />
              <circle cx="90" cy="16" r="2" fill="#D17B00" />
              <circle cx="140" cy="16" r="2" fill="#D17B00" />
              <rect x="75" y="16" width="80" height="22" rx="4" fill="#FFFBEB" stroke="#D17B00" strokeWidth="1.2" />
              <rect x="78" y="19" width="74" height="16" rx="2.5" fill="none" stroke="#FDE68A" strokeWidth="0.8" />
              <text x="115" y="30" fill="#78350F" fontSize="8" fontWeight="800" letterSpacing="1.8" textAnchor="middle" fontFamily="sans-serif">
                EST. 2026
              </text>

              {/* Estante Superior de Botellas (Madera cálida con soportes) */}
              <line x1="30" y1="175" x2="470" y2="175" stroke="#CBD5E1" strokeWidth="1.2" strokeDasharray="4 4" />
              <rect x="40" y="175" width="420" height="10" rx="3" fill="#78350F" stroke="#92400E" strokeWidth="1.5" />
              <line x1="42" y1="177" x2="458" y2="177" stroke="#FDE68A" strokeWidth="1" strokeOpacity="0.6" />
              <path d="M75 185 L75 210 L100 185" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M425 185 L425 210 L400 185" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              {/* Botella 1: Vino Tinto Bordeaux */}
              <g transform="translate(75, 82)">
                <path d="M16 0 H24 V26 L32 42 V93 H8 V42 L16 26 Z" fill="#FEF2F2" stroke="#991B1B" strokeWidth="1.75" strokeLinejoin="round" />
                <rect x="15" y="4" width="10" height="9" fill="#B91C1C" rx="1" />
                <rect x="12" y="52" width="16" height="26" rx="2" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1" />
                <line x1="15" y1="58" x2="25" y2="58" stroke="#991B1B" strokeWidth="1" />
                <line x1="15" y1="64" x2="25" y2="64" stroke="#D17B00" strokeWidth="0.75" />
              </g>

              {/* Botella 2: Champagne / Espumoso Dorado */}
              <g transform="translate(125, 76)">
                <path d="M17 0 H23 V18 Q20 36 32 52 V99 H8 V52 Q20 36 17 18 Z" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.75" strokeLinejoin="round" />
                <path d="M15 0 H25 V14 H15 Z" fill="#F59E0B" />
                <rect x="11" y="60" width="18" height="36" fill="url(#setup-bottle-liquid)" rx="2" />
                <circle cx="20" cy="74" r="1.5" fill="#D97706" />
                <circle cx="16" cy="84" r="1" fill="#D97706" />
              </g>

              {/* Botella 3: Licor / Decantador de Whisky Ámbar */}
              <g transform="translate(180, 92)">
                <rect x="14" y="0" width="12" height="12" rx="2" fill="#FEF3C7" stroke="#D17B00" strokeWidth="1.2" />
                <rect x="17" y="12" width="6" height="8" fill="#F8FAFC" stroke="#D17B00" strokeWidth="1.2" />
                <path d="M8 20 H32 L36 32 V83 H4 V32 Z" fill="#FFFBEB" stroke="url(#setup-amber-stroke)" strokeWidth="1.75" strokeLinejoin="round" />
                <path d="M20 34 L30 48 L20 62 L10 48 Z" stroke="#D17B00" strokeWidth="1" strokeOpacity="0.6" fill="#FEF3C7" fillOpacity="0.4" />
              </g>

              {/* Botella 4: Destilado / Ginebra Esmeralda */}
              <g transform="translate(240, 78)">
                <path d="M16 0 H22 V22 L28 34 V97 H10 V34 L16 22 Z" fill="#F0FDFA" stroke="#0D9488" strokeWidth="1.75" strokeLinejoin="round" />
                <rect x="14" y="46" width="10" height="32" rx="2" fill="#FFFFFF" stroke="#0D9488" strokeWidth="0.75" />
                <circle cx="19" cy="58" r="3" stroke="#0D9488" strokeWidth="0.75" fill="none" />
              </g>

              {/* Botella 5: Ron Añejo Cálido */}
              <g transform="translate(295, 96)">
                <rect x="15" y="0" width="10" height="8" rx="2" fill="#D17B00" stroke="#B45309" strokeWidth="1" />
                <path d="M16 8 H24 V18 Q34 24 34 38 V79 H6 V38 Q6 24 16 18 Z" fill="#FFF7ED" stroke="#C2410C" strokeWidth="1.75" strokeLinejoin="round" />
                <rect x="10" y="38" width="20" height="24" rx="2" fill="#FFFFFF" stroke="#EA580C" strokeWidth="0.75" />
                <line x1="14" y1="46" x2="26" y2="46" stroke="#D17B00" strokeWidth="1" />
              </g>

              {/* Copa de Vino en el Estante */}
              <g transform="translate(355, 116)">
                <path d="M6 0 Q6 25 18 32 V54 H8 V59 H28 V54 H18 V32 Q30 25 30 0" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M9 10 Q9 22 18 26 Q27 22 27 10" fill="url(#setup-bottle-liquid)" stroke="#D17B00" strokeWidth="1" />
              </g>

              {/* Copa Coupe de Cóctel */}
              <g transform="translate(398, 126)">
                <path d="M4 0 Q18 20 18 22 V46 H10 V49 H26 V46 H18 V22 Q18 20 32 0 Z" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <line x1="8" y1="8" x2="28" y2="8" stroke="#D17B00" strokeWidth="1" />
                <circle cx="26" cy="4" r="3" fill="#EF4444" stroke="#DC2626" strokeWidth="0.75" />
              </g>

              {/* Mostrador / Barra Principal de Madera */}
              <rect x="25" y="310" width="450" height="14" rx="4" fill="#78350F" stroke="#92400E" strokeWidth="1.75" />
              <line x1="27" y1="313" x2="473" y2="313" stroke="#FDE68A" strokeWidth="1" strokeOpacity="0.8" />
              <rect x="40" y="324" width="420" height="26" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />

              {/* Coctelera / Shaker Metálica */}
              <g transform="translate(75, 246)">
                <rect x="14" y="0" width="12" height="8" rx="2" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.2" />
                <path d="M12 8 H28 L32 22 H8 Z" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
                <path d="M8 22 H32 L28 64 H12 Z" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.75" strokeLinejoin="round" />
                <line x1="14" y1="34" x2="26" y2="34" stroke="#94A3B8" strokeWidth="0.75" />
              </g>

              {/* Vaso de Whisky en las Rocas con Hielo */}
              <g transform="translate(140, 268)">
                <path d="M6 0 L9 42 H31 L34 0 Z" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8 16 L10 38 H30 L32 16 Z" fill="url(#setup-bottle-liquid)" stroke="#D17B00" strokeWidth="1" />
                <rect x="14" y="22" width="12" height="12" rx="2" fill="#FFFFFF" fillOpacity="0.8" stroke="#F59E0B" strokeWidth="1" transform="rotate(12 20 28)" />
              </g>

              {/* Botella de Barra con Dosificador / Vertedor */}
              <g transform="translate(205, 216)">
                <line x1="16" y1="0" x2="20" y2="12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 12 H22 V22 L28 36 V94 H8 V36 L14 22 Z" fill="#FFFBEB" stroke="url(#setup-amber-stroke)" strokeWidth="1.75" strokeLinejoin="round" />
                <rect x="11" y="48" width="14" height="26" rx="2" fill="#FFFFFF" stroke="#D17B00" strokeWidth="0.75" />
              </g>

              {/* Caja Rústica de Vinos */}
              <g transform="translate(275, 252)">
                <rect x="0" y="16" width="70" height="42" rx="3" fill="#FEF3C7" stroke="#B45309" strokeWidth="1.5" />
                <line x1="0" y1="30" x2="70" y2="30" stroke="#D97706" strokeWidth="1" />
                <line x1="0" y1="44" x2="70" y2="44" stroke="#D97706" strokeWidth="1" />
                <path d="M14 16 L14 4 H22 L22 16" fill="#FEF2F2" stroke="#991B1B" strokeWidth="1.5" />
                <rect x="13" y="2" width="10" height="4" fill="#B91C1C" rx="1" />
                <path d="M42 16 L42 2 H50 L50 16" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5" />
                <rect x="41" y="0" width="10" height="4" fill="#F59E0B" rx="1" />
              </g>

              {/* Copa Flauta de Espumoso */}
              <g transform="translate(375, 246)">
                <path d="M8 0 V34 Q8 44 14 48 V64 H6 V67 H22 V64 H14 V48 Q20 44 20 34 V0 Z" stroke="#64748B" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                <path d="M10 14 V30 Q10 38 14 41 Q18 38 18 30 V14 Z" fill="url(#setup-bottle-liquid)" stroke="#D97706" strokeWidth="0.75" />
                <circle cx="14" cy="20" r="1" fill="#F59E0B" />
                <circle cx="15" cy="30" r="1" fill="#F59E0B" />
              </g>

              {/* Destellos y Estrellas de Ambiente Cálido */}
              <g fill="#D97706" stroke="none">
                <path d="M435 80 Q435 85 440 85 Q435 85 435 90 Q435 85 430 85 Q435 85 435 80 Z" />
                <path d="M330 60 Q330 65 335 65 Q330 65 330 70 Q330 65 325 65 Q330 65 330 60 Z" />
                <circle cx="115" cy="140" r="1.5" opacity="0.7" />
                <circle cx="410" cy="200" r="1.5" opacity="0.7" />
                <circle cx="280" cy="45" r="1" opacity="0.6" />
              </g>
            </svg>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* COLUMNA DERECHA: Formulario Wizard de 2 Pasos                             */}
        {/* ========================================================================= */}
        <section className="lg:col-span-7 xl:col-span-7 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          {/* Stepper / Indicador de Pasos */}
          <div className="flex items-center justify-between max-w-md mx-auto w-full mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
            <div
              className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-neutral-900 transition-all duration-300 -z-0"
              style={{ width: pasoActual === 1 ? "25%" : "100%" }}
            />

            {/* Paso 1 Badge */}
            <button
              type="button"
              onClick={() => setPasoActual(1)}
              className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-full relative z-10 cursor-pointer text-left focus:outline-none"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-2xs ${pasoActual === 1
                    ? "bg-neutral-900 text-white ring-4 ring-neutral-900/15"
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
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-2xs ${pasoActual === 2
                    ? "bg-neutral-900 text-white ring-4 ring-neutral-900/15"
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
                  <Store className="w-4 h-4 text-slate-800" />
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
                      <span className="text-slate-700 ml-1">*</span>
                    </label>
                    <select
                      {...register("moneda")}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-3 focus:ring-neutral-900/15 text-[#18181B] font-medium cursor-pointer shadow-xs"
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
                      <span className="text-slate-700 ml-1">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorPrimarioSeleccionado || "#171717"}
                        onChange={(e) => setValue("color_primario", e.target.value)}
                        className="w-11 h-10 p-1 rounded-lg border border-slate-300 bg-white cursor-pointer shadow-xs"
                        title="Seleccionar color de marca"
                      />
                      <input
                        type="text"
                        {...register("color_primario")}
                        placeholder="#171717"
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-3 focus:ring-neutral-900/15 text-[#18181B] uppercase shadow-xs"
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
                    <label className="border-2 border-dashed border-slate-200 hover:border-neutral-400 bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
                      <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-neutral-200 flex items-center justify-center text-slate-400 group-hover:text-neutral-900 mb-2 transition-colors">
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
                    className="gap-2 text-xs sm:text-sm font-semibold shadow-sm shadow-neutral-900/20"
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
                    <UserCheck className="w-4 h-4 text-slate-800" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Paso 2: Cuenta del Administrador
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Acceso con rol <strong className="text-slate-700">Administrador</strong>
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-700 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
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
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
                    className="gap-2 text-xs sm:text-sm font-semibold shadow-sm shadow-neutral-900/20"
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
                        <Wine className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

