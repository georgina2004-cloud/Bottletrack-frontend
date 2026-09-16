"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StorefrontIllustration } from "@/components/auth/StorefrontIllustration";
import { LoginForm } from "@/components/auth/LoginForm";
import { useCompanyConfig } from "@/context/CompanyConfigContext";
import { verificarEstadoSetup } from "@/lib/api";
import { Loader2, Info } from "lucide-react";

export function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { nombreLicoreria } = useCompanyConfig();
  const [verificandoSetup, setVerificandoSetup] = useState<boolean>(true);

  const motivo = searchParams.get("motivo");

  useEffect(() => {
    let isMounted = true;

    async function checkSetup() {
      try {
        const estado = await verificarEstadoSetup();
        if (!estado.configurado) {
          router.replace("/setup");
          return;
        }
      } catch (error) {
        console.error("Error al verificar estado inicial de setup:", error);
      } finally {
        if (isMounted) {
          setVerificandoSetup(false);
        }
      }
    }

    checkSetup();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Pantalla de carga mientras se verifica si el sistema ya fue inicializado
  if (verificandoSetup) {
    return (
      <main className="min-h-screen w-full bg-[#FAFAF8] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary-brand)]/10 border border-[var(--primary-brand)]/20 flex items-center justify-center mb-4 shadow-sm">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--primary-brand)]" />
          </div>
          <h2 className="font-serif font-bold text-xl text-slate-800 tracking-tight">
            {nombreLicoreria || "BottleTrack"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 animate-pulse">
            Verificando estado del sistema...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#FAFAF8] flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative overflow-hidden">
      {/* Luces ambientales sutiles de fondo */}
      <div
        className="absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-[var(--primary-brand)]/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -right-40 w-[32rem] h-[32rem] bg-slate-200/50 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Tarjeta flotante principal */}
      <div className="w-full max-w-5xl xl:max-w-6xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/5 flex flex-col lg:flex-row relative z-10 overflow-hidden p-2.5 sm:p-3.5 lg:p-3.5 border border-slate-200/80">
        {/* PANEL IZQUIERDO: Ilustración de Fachada */}
        <section className="w-full lg:w-1/2 bg-[#FAFAF8] text-[#18181B] flex flex-col items-center justify-center p-8 sm:p-10 lg:p-12 relative overflow-hidden rounded-[2rem] border border-slate-100 shadow-xs">
          {/* Patrón geométrico sutil */}
          <svg
            className="absolute inset-0 w-full h-full stroke-slate-200/50 [mask-image:radial-gradient(100%_100%_at_top_left,white,transparent)] pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <pattern id="light-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M.5 24V.5H24" fill="none" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" strokeWidth="0" fill="url(#light-grid)" />
          </svg>

          {/* Resplandor decorativo interno */}
          <div
            className="absolute -top-24 -left-24 w-80 h-80 bg-[var(--primary-brand)]/5 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Ilustración artesanal de fachada */}
          <div className="relative z-10 w-full flex items-center justify-center">
            <StorefrontIllustration className="w-full max-w-sm sm:max-w-md" />
          </div>
        </section>

        {/* PANEL DERECHO: Formulario de Login */}
        <section className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
          <div className="w-full max-w-md mx-auto">
            {/* Aviso si el usuario fue redirigido porque ya estaba configurado */}
            {motivo === "ya_configurado" && (
              <div
                role="alert"
                className="mb-6 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs animate-in fade-in"
              >
                <Info className="w-4 h-4 text-[var(--primary-brand)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Sistema ya inicializado</span>
                  <span>
                    La licorería ya cuenta con una configuración activa. Ingresa con tus
                    credenciales de administrador.
                  </span>
                </div>
              </div>
            )}

            {/* Header del formulario */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B]">
                Iniciar sesión
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                Ingresa tus credenciales para acceder al inventario y gestión de pedidos.
              </p>
            </div>

            {/* Formulario interactivo */}
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
