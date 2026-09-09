"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import { obtenerUsuarios, desactivarUsuario, eliminarUsuario } from "@/lib/api";
import { Usuario } from "@/types/usuario";
import { Button } from "@/components/ui/Button";
import { DetailDrawer } from "@/components/ui/DetailDrawer";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import {
  UserCog,
  Plus,
  Search,
  Edit2,
  UserX,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Shield,
  Mail,
  Trash2,
  Calendar,
  Clock,
  Hash,
  Info,
} from "lucide-react";

function UsuariosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, token } = useAuth();
  const { puedeEditar } = usePermisos();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  // Toggle de vista: inicia en cuadrícula por defecto
  const [vista, setVista] = useState<ViewMode>("cuadricula");

  // Búsqueda y paginación
  const [busqueda, setBusqueda] = useState<string>("");
  const [terminoBuscado, setTerminoBuscado] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [reloadCounter, setReloadCounter] = useState<number>(0);

  // Estados de carga y error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Notificaciones flash
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dismissedFlash, setDismissedFlash] = useState<boolean>(false);

  // Drawer state
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<Usuario | null>(null);

  // Modal de confirmación de desactivación
  const [usuarioParaDesactivar, setUsuarioParaDesactivar] =
    useState<Usuario | null>(null);
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false);

  // Modal de confirmación de eliminación definitiva
  const [usuarioParaEliminar, setUsuarioParaEliminar] =
    useState<Usuario | null>(null);
  const [isEliminating, setIsEliminating] = useState<boolean>(false);

  // Detección de parámetros en URL (created=1, updated=1)
  const isCreated = searchParams.get("created") === "1";
  const isUpdated = searchParams.get("updated") === "1";

  const effectiveSuccessMessage =
    successMessage ||
    (!dismissedFlash
      ? isCreated
        ? "¡Usuario registrado exitosamente!"
        : isUpdated
        ? "¡Usuario actualizado correctamente!"
        : null
      : null);

  const handleDismissSuccess = () => {
    setSuccessMessage(null);
    setDismissedFlash(true);
    if (isCreated || isUpdated) router.replace("/usuarios");
  };

  const handleDismissError = () => {
    setErrorMessage(null);
  };

  // Carga de usuarios desde el backend al cambiar página, búsqueda o tras recarga
  useEffect(() => {
    let isMounted = true;

    async function cargar() {
      setErrorCarga(null);
      try {
        const response = await obtenerUsuarios(
          {
            busqueda: terminoBuscado,
            page,
          },
          token
        );
        if (isMounted) {
          setUsuarios(response.data || []);
          setPagination({
            currentPage: response.current_page || 1,
            lastPage: response.last_page || 1,
            total: response.total || 0,
          });
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Error al cargar usuarios:", err);
        setErrorCarga(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el listado de usuarios."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    cargar();

    return () => {
      isMounted = false;
    };
  }, [terminoBuscado, page, token, reloadCounter]);

  // Manejador del buscador
  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPage(1);
    setTerminoBuscado(busqueda.trim());
  };

  const handleLimpiarBusqueda = () => {
    setIsLoading(true);
    setBusqueda("");
    setTerminoBuscado("");
    setPage(1);
  };

  // Desactivar usuario (borrado lógico)
  const handleConfirmarDesactivacion = async () => {
    if (!usuarioParaDesactivar) return;

    setIsDeactivating(true);
    setErrorMessage(null);

    try {
      await desactivarUsuario(usuarioParaDesactivar.id, token);
      setSuccessMessage(
        `El usuario "${usuarioParaDesactivar.name}" ha sido desactivado exitosamente.`
      );
      if (usuarioSeleccionado?.id === usuarioParaDesactivar.id) {
        setUsuarioSeleccionado((prev) => (prev ? { ...prev, estado: false } : null));
      }
      setUsuarioParaDesactivar(null);
      setIsRefreshing(true);
      setReloadCounter((c) => c + 1);
    } catch (err: unknown) {
      console.error("Error al desactivar usuario:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al desactivar el usuario."
      );
    } finally {
      setIsDeactivating(false);
    }
  };

  // Eliminación definitiva
  const handleConfirmarEliminacion = async () => {
    if (!usuarioParaEliminar) return;

    setIsEliminating(true);
    setErrorMessage(null);

    try {
      await eliminarUsuario(usuarioParaEliminar.id, token);
      setUsuarios((prev) => prev.filter((u) => u.id !== usuarioParaEliminar.id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
      setSuccessMessage(
        `El usuario "${usuarioParaEliminar.name}" ha sido eliminado permanentemente del sistema.`
      );
      if (usuarioSeleccionado?.id === usuarioParaEliminar.id) {
        setUsuarioSeleccionado(null);
      }
      setUsuarioParaEliminar(null);
    } catch (err: unknown) {
      console.error("Error al eliminar usuario:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al eliminar el usuario."
      );
      setUsuarioParaEliminar(null);
    } finally {
      setIsEliminating(false);
    }
  };

  // Badge de rol
  const getRoleBadge = (roleName?: string) => {
    switch (roleName) {
      case "Gerente de Bodega":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Encargado de Ventas":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "Auditor":
        return "bg-purple-50 text-purple-800 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <ProtectedByRole modulo="usuarios">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Alertas Flash de Éxito o Error */}
          {effectiveSuccessMessage && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="font-semibold text-xs sm:text-sm">
                  {effectiveSuccessMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismissSuccess}
                className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start justify-between gap-3 shadow-2xs animate-in fade-in duration-200"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs sm:text-sm">
                    {errorMessage}
                  </p>
                  {errorMessage.toLowerCase().includes("ventas") ||
                  errorMessage.toLowerCase().includes("compras") ? (
                    <p className="text-xs text-rose-700 mt-1">
                      Puedes <strong>desactivar</strong> al usuario para revocar su acceso sin perder el historial operativo.
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissError}
                className="text-rose-700 hover:text-rose-900 p-1 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Encabezado y Acción Nuevo Usuario */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand/10 text-brand rounded-xl">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] tracking-tight">
                    Gestión de Usuarios
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Haz clic en el nombre de un usuario para ver sus detalles y opciones de administración.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              {puedeEditar("roles") && (
                <Link href="/usuarios/permisos">
                  <Button
                    variant="outline"
                    className="gap-2 text-xs sm:text-sm font-semibold border-slate-200 hover:border-brand/40 hover:text-brand shadow-2xs w-full sm:w-auto cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-brand" />
                    <span>Matriz de Permisos</span>
                  </Button>
                </Link>
              )}

              {puedeEditar("usuarios") && (
                <Link href="/usuarios/nuevo">
                  <Button
                    className="gap-2 text-xs sm:text-sm font-semibold shadow-sm shadow-brand/20 w-full sm:w-auto cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Usuario</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Barra de Filtros, Búsqueda y Toggle de Vista */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form onSubmit={handleBuscar} className="w-full sm:max-w-md relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre o correo electrónico..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all text-slate-900"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={handleLimpiarBusqueda}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            <div className="shrink-0 flex items-center justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
              <ViewToggle vista={vista} onCambiarVista={setVista} />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONTENIDO PRINCIPAL: TABLA O CUADRÍCULA                                   */}
          {/* ========================================================================= */}
          {vista === "tabla" ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 sm:px-6">Usuario</th>
                      <th className="py-3 px-4">Correo Electrónico</th>
                      <th className="py-3 px-4">Rol Asignado</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-brand" />
                            <span className="text-xs font-medium">
                              Cargando usuarios...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : errorCarga ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-rose-600">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-rose-500" />
                            <span className="text-xs font-medium">
                              {errorCarga}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsLoading(true);
                                setReloadCounter((c) => c + 1);
                              }}
                              className="text-xs mt-2"
                            >
                              Reintentar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : usuarios.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <UserX className="w-8 h-8 text-slate-300" />
                            <p className="text-sm font-semibold text-slate-700">
                              No se encontraron usuarios
                            </p>
                            <p className="text-xs text-slate-400">
                              {terminoBuscado
                                ? "Prueba cambiando el término de búsqueda."
                                : "Comienza registrando un nuevo usuario en el sistema."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      usuarios.map((usr) => {
                        const isSelf = currentUser?.id === usr.id;
                        const isSelected = usuarioSeleccionado?.id === usr.id;

                        return (
                          <tr
                            key={usr.id}
                            className={`hover:bg-slate-50/60 transition-colors group ${
                              isSelected ? "bg-brand/5" : ""
                            }`}
                          >
                            {/* Nombre — clickeable para abrir DetailDrawer */}
                            <td className="py-3.5 px-4 sm:px-6">
                              <button
                                type="button"
                                onClick={() =>
                                  setUsuarioSeleccionado(
                                    isSelected ? null : usr
                                  )
                                }
                                className="flex items-center gap-3 text-left cursor-pointer group/btn w-full"
                              >
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 group-hover/btn:border-brand/40">
                                  {usr.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="truncate max-w-[180px] sm:max-w-[240px]">
                                  <span
                                    className={`font-semibold block truncate transition-colors ${
                                      isSelected
                                        ? "text-brand"
                                        : "text-slate-900 group-hover/btn:text-brand"
                                    }`}
                                  >
                                    {usr.name}
                                  </span>
                                  {isSelf && (
                                    <span className="inline-flex items-center text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.2 rounded border border-brand/20">
                                      Tu cuenta en sesión
                                    </span>
                                  )}
                                </div>
                              </button>
                            </td>

                            {/* Email */}
                            <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[200px]">
                                  {usr.email}
                                </span>
                              </div>
                            </td>

                            {/* Rol */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(
                                  usr.role?.nombre
                                )}`}
                              >
                                <Shield className="w-3 h-3" />
                                <span>{usr.role?.nombre || "Sin Rol"}</span>
                              </span>
                            </td>

                            {/* Estado */}
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  usr.estado
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    usr.estado ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                />
                                <span>{usr.estado ? "Activo" : "Inactivo"}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ═══════════════ VISTA CUADRÍCULA ═══════════════ */
            <div className="space-y-6">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3.5 animate-pulse flex flex-col h-full">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                        <div className="w-16 h-5 bg-slate-100 rounded-full" />
                      </div>
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <div className="h-5 bg-slate-100 rounded-full w-24" />
                        <div className="h-3.5 bg-slate-100 rounded w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : errorCarga ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-2.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">Error al cargar usuarios</p>
                    <p className="text-xs text-slate-500 mt-1 mb-3">{errorCarga}</p>
                    <Button variant="outline" size="sm" onClick={() => { setIsLoading(true); setReloadCounter((c) => c + 1); }} className="text-xs">
                      Reintentar
                    </Button>
                  </div>
                </div>
              ) : usuarios.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-14 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <UserX className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No se encontraron usuarios</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
                      {terminoBuscado
                        ? "Prueba cambiando el término de búsqueda."
                        : "Comienza registrando un nuevo usuario en el sistema."}
                    </p>
                    {terminoBuscado && (
                      <Button variant="outline" size="sm" onClick={handleLimpiarBusqueda} className="text-xs">
                        Limpiar búsqueda
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {usuarios.map((usr) => {
                    const isSelf = currentUser?.id === usr.id;
                    const isSelected = usuarioSeleccionado?.id === usr.id;

                    return (
                      <div
                        key={usr.id}
                        onClick={() => setUsuarioSeleccionado(isSelected ? null : usr)}
                        className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-5 flex flex-col h-full hover:shadow-md ${
                          isSelected
                            ? "ring-2 ring-[var(--primary-brand)] border-transparent shadow-md"
                            : "border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        {/* Cabecera: Avatar e Indicador de Estado */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0 group-hover:border-[var(--primary-brand)] transition-colors">
                            {usr.name.charAt(0).toUpperCase()}
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              usr.estado
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                usr.estado ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            <span>{usr.estado ? "Activo" : "Inactivo"}</span>
                          </span>
                        </div>

                        {/* Nombre y Badge de sesión */}
                        <div className="mb-2 flex-1">
                          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-[var(--primary-brand)] transition-colors">
                            {usr.name}
                          </h3>
                          {isSelf && (
                            <span className="inline-flex items-center text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.2 rounded border border-brand/20 mt-1">
                              Tu cuenta en sesión
                            </span>
                          )}
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mb-3">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{usr.email}</span>
                        </div>

                        {/* Footer: Rol */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(
                              usr.role?.nombre
                            )}`}
                          >
                            <Shield className="w-3 h-3" />
                            <span>{usr.role?.nombre || "Sin Rol"}</span>
                          </span>

                          <span className="text-[11px] text-slate-400 font-mono">
                            #{usr.id}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Barra de Estado y Paginación compartida para ambas vistas */}
          <div className="py-3.5 px-4 sm:px-6 bg-white rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shadow-xs">
            <div>
              {pagination.total > 0 ? (
                <span>
                  Mostrando <strong className="text-slate-800 font-bold">{usuarios.length}</strong> de{" "}
                  <strong className="text-slate-800 font-bold">{pagination.total}</strong> usuarios registrados en total
                </span>
              ) : (
                <span>Total: 0 usuarios</span>
              )}
            </div>

            {pagination.lastPage > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.currentPage <= 1 || isRefreshing}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs text-slate-600 font-medium px-1">
                  Página {pagination.currentPage} de {pagination.lastPage}
                </span>

                <button
                  type="button"
                  disabled={
                    pagination.currentPage >= pagination.lastPage ||
                    isRefreshing
                  }
                  onClick={() =>
                    setPage((p) => Math.min(pagination.lastPage, p + 1))
                  }
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* DETAIL DRAWER — Usuario                                                   */}
          {/* ========================================================================= */}
          <DetailDrawer
            isOpen={!!usuarioSeleccionado}
            onClose={() => setUsuarioSeleccionado(null)}
            title={usuarioSeleccionado?.name ?? "Detalle de Usuario"}
            subtitle={
              usuarioSeleccionado
                ? `${usuarioSeleccionado.role?.nombre ?? "Cuenta de Acceso"}${
                    currentUser?.id === usuarioSeleccionado.id
                      ? " · Tu sesión activa"
                      : ""
                  }`
                : ""
            }
            icon={<UserCog className="w-4 h-4" />}
          >
            {usuarioSeleccionado && (() => {
              const usr = usuarioSeleccionado;
              const isSelf = currentUser?.id === usr.id;

              return (
                <div className="p-5 space-y-5">
                  {/* Información de Cuenta */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Datos de la Cuenta
                      </h3>
                      {isSelf && (
                        <span className="inline-flex items-center text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20">
                          Tu cuenta en sesión
                        </span>
                      )}
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 text-xs">
                      <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                        <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                          <Hash className="w-3.5 h-3.5" />
                          <span>ID de Usuario</span>
                        </div>
                        <span className="font-mono font-semibold text-slate-700">
                          #{usr.id}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                        <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                          <span>Correo electrónico</span>
                        </div>
                        <span className="font-mono font-semibold text-slate-800 text-right truncate max-w-[200px]">
                          {usr.email}
                        </span>
                      </div>

                      <div className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Rol asignado</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(
                            usr.role?.nombre
                          )}`}
                        >
                          {usr.role?.nombre || "Sin Rol"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-slate-500">Estado de acceso</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            usr.estado
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              usr.estado ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          <span>{usr.estado ? "Activo" : "Inactivo"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Auditoría / Fechas */}
                  {(usr.created_at || usr.updated_at) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Historial de Registro
                      </h3>
                      <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-xs space-y-1.5">
                        {usr.created_at && (
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" /> Registrado el:
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatDate(usr.created_at)}
                            </span>
                          </div>
                        )}
                        {usr.updated_at && (
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> Última actualización:
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatDate(usr.updated_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  {puedeEditar("usuarios") && (
                    <div className="pt-2 border-t border-slate-100 space-y-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Acciones de Administración
                      </p>

                      {isSelf && (
                        <div className="p-3 rounded-xl bg-brand/5 border border-brand/20 text-xs text-brand flex items-start gap-2">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <p>
                            Esta es tu cuenta en sesión. Puedes editar tus datos pero no puedes desactivar ni eliminar tu propio usuario.
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        {/* Editar */}
                        <Link href={`/usuarios/${usr.id}/editar`} className="w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-2 justify-center"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar usuario y rol</span>
                          </Button>
                        </Link>

                        {/* Desactivar */}
                        {!isSelf && usr.estado && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUsuarioParaDesactivar(usr)}
                            className="w-full text-xs gap-2 justify-center text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Desactivar acceso</span>
                          </Button>
                        )}

                        {/* Eliminar definitivamente */}
                        {!isSelf && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUsuarioParaEliminar(usr)}
                            className="w-full text-xs gap-2 justify-center text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar permanentemente</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </DetailDrawer>

          {/* Modal de Confirmación para Desactivar Usuario */}
          {usuarioParaDesactivar && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="p-2.5 bg-rose-50 rounded-xl">
                    <UserX className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      ¿Desactivar usuario?
                    </h3>
                    <p className="text-xs text-slate-500">
                      Confirma si deseas revocar el acceso a esta cuenta.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nombre:</span>
                    <span className="font-semibold text-slate-900">
                      {usuarioParaDesactivar.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Correo:</span>
                    <span className="font-mono text-slate-800">
                      {usuarioParaDesactivar.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rol:</span>
                    <span className="font-semibold text-brand">
                      {usuarioParaDesactivar.role?.nombre}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600">
                  Al desactivar al usuario, su sesión quedará revocada y no podrá ingresar al sistema. Su historial de ventas, compras y operaciones se mantendrá intacto. Puedes reactivar su acceso en cualquier momento.
                </p>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isDeactivating}
                    onClick={() => setUsuarioParaDesactivar(null)}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isDeactivating}
                    onClick={handleConfirmarDesactivacion}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 font-semibold"
                  >
                    {isDeactivating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Desactivando...</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>Sí, Desactivar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Eliminación Definitiva */}
          {usuarioParaEliminar && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-eliminar-titulo"
            >
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Franja de advertencia */}
                <div className="bg-rose-600 px-6 py-4 flex items-center gap-3">
                  <div className="p-2 bg-rose-500 rounded-xl shrink-0">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3
                      id="modal-eliminar-titulo"
                      className="text-base font-bold text-white"
                    >
                      Eliminar usuario permanentemente
                    </h3>
                    <p className="text-xs text-rose-100">
                      Esta acción <strong>no se puede deshacer</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Confirmación explícita */}
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 font-medium leading-relaxed">
                    ¿Estás seguro de eliminar permanentemente a{" "}
                    <strong className="font-bold">
                      &quot;{usuarioParaEliminar.name}&quot;
                    </strong>
                    ? Esta acción no se puede deshacer.
                  </div>

                  {/* Datos del usuario */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nombre:</span>
                      <span className="font-semibold text-slate-900">
                        {usuarioParaEliminar.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Correo:</span>
                      <span className="font-mono text-slate-800">
                        {usuarioParaEliminar.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rol:</span>
                      <span className="font-semibold text-slate-700">
                        {usuarioParaEliminar.role?.nombre || "Sin rol"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Si el usuario tiene ventas o compras registradas, el sistema{" "}
                    <strong>no permitirá</strong> la eliminación por integridad
                    referencial. En ese caso, puedes{" "}
                    <strong>desactivarlo</strong> para revocar su acceso.
                  </p>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isEliminating}
                      onClick={() => setUsuarioParaEliminar(null)}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isEliminating}
                      onClick={handleConfirmarEliminacion}
                      className="bg-rose-700 hover:bg-rose-800 text-white text-xs gap-1.5 font-bold shadow-md shadow-rose-300/50"
                    >
                      {isEliminating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Eliminando...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Sí, eliminar permanentemente</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}

export default function UsuariosPage() {
  return (
    <Suspense fallback={null}>
      <UsuariosContent />
    </Suspense>
  );
}

