"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { UsuarioForm } from "@/components/usuarios/UsuarioForm";
import { useAuth } from "@/context/AuthContext";
import { obtenerUsuarioPorId, actualizarUsuario } from "@/lib/api";
import { Usuario, UsuarioPayload } from "@/types/usuario";
import { Button } from "@/components/ui/Button";
import {
  ChevronRight,
  ArrowLeft,
  Edit3,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface EditarUsuarioPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarUsuarioPage({ params }: EditarUsuarioPageProps) {
  const router = useRouter();
  const { token } = useAuth();

  // En Next.js 15, params es una promesa que se desenvuelve con React.use()
  const resolvedParams = use(params);
  const usuarioId = resolvedParams.id;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar datos del usuario a editar
  useEffect(() => {
    let isMounted = true;

    async function loadUsuario() {
      if (!usuarioId) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const data = await obtenerUsuarioPorId(usuarioId, token);
        if (isMounted) {
          setUsuario(data);
        }
      } catch (error: unknown) {
        if (!isMounted) return;
        console.error("Error al cargar usuario:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo obtener la información del usuario."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUsuario();

    return () => {
      isMounted = false;
    };
  }, [usuarioId, token]);

  const handleActualizarUsuario = async (payload: UsuarioPayload) => {
    if (!usuarioId) return;
    await actualizarUsuario(usuarioId, payload, token);
    router.push("/usuarios?updated=1");
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
              <span className="font-semibold text-brand">Editar Usuario</span>
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
                    Editar Usuario
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    <Edit3 className="w-3 h-3" />
                    ID #{usuarioId}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Actualiza el nombre, correo, contraseña o rol de este usuario.
                </p>
              </div>
            </div>
          </div>

          {/* Estado de Carga */}
          {isLoading && (
            <div className="bg-white rounded-2xl p-12 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#D17B00]" />
              <p className="text-sm font-medium text-slate-500">
                Obteniendo datos del usuario...
              </p>
            </div>
          )}

          {/* Estado de Error */}
          {!isLoading && errorMessage && (
            <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-xs flex flex-col items-center justify-center text-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Error al cargar el usuario
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                {errorMessage}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Link href="/usuarios">
                  <Button variant="outline" size="sm" className="text-xs">
                    Volver al listado
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-xs"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {/* Formulario de Edición */}
          {!isLoading && !errorMessage && usuario && (
            <UsuarioForm
              initialData={usuario}
              isEditing={true}
              onSubmit={handleActualizarUsuario}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
