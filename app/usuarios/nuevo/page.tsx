"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { UsuarioForm } from "@/components/usuarios/UsuarioForm";
import { useAuth } from "@/context/AuthContext";
import { crearUsuario } from "@/lib/api";
import { UsuarioPayload } from "@/types/usuario";
import { ChevronRight, ArrowLeft, UserPlus } from "lucide-react";

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const { token } = useAuth();

  const handleCrearUsuario = async (payload: UsuarioPayload) => {
    await crearUsuario(payload, token);
    router.push("/usuarios?created=1");
  };

  return (
    <ProtectedByRole modulo="usuarios" requiereEscritura={true}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Breadcrumbs y Encabezado */}
          <div className="space-y-2">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-slate-500"
            >
              <Link
                href="/dashboard"
                className="hover:text-slate-900 transition-colors"
              >
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link
                href="/usuarios"
                className="hover:text-slate-900 transition-colors"
              >
                Usuarios
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-brand">Nuevo Usuario</span>
            </nav>

            <div className="flex items-center gap-3 pt-1">
              <Link
                href="/usuarios"
                className="p-2 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:text-brand hover:border-brand/40 transition-all shadow-2xs cursor-pointer"
                title="Volver a usuarios"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                    Registrar Nuevo Usuario
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D17B00]/10 text-[#D17B00] border border-[#D17B00]/20">
                    <UserPlus className="w-3 h-3" />
                    Nuevo
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Crea una nueva cuenta de acceso con credenciales y asigna el rol correspondiente.
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <UsuarioForm onSubmit={handleCrearUsuario} />
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
