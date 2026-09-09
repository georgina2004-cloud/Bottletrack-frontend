"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import { obtenerProveedores, desactivarProveedor } from "@/lib/api";
import { Proveedor } from "@/types/proveedor";
import { Button } from "@/components/ui/Button";
import { DetailDrawer } from "@/components/ui/DetailDrawer";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  Building2,
  FileText,
  Ban,
  MapPin,
  Calendar,
  Hash,
} from "lucide-react";

function ProveedoresContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { puedeEditar } = usePermisos();

  const tienePermisoEscritura = puedeEditar("proveedores");

  // Estado del listado y paginación
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    lastPage: number;
    total: number;
  }>({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  // Toggle de vista: inicia en cuadrícula por defecto
  const [vista, setVista] = useState<ViewMode>("cuadricula");

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState<string>("");
  const [terminoBuscado, setTerminoBuscado] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Estados de carga y error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Mensajes flash y notificaciones
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dismissedFlash, setDismissedFlash] = useState<boolean>(false);

  // Drawer state
  const [proveedorSeleccionado, setProveedorSeleccionado] =
    useState<Proveedor | null>(null);

  // Modal de confirmación de desactivación
  const [proveedorParaDesactivar, setProveedorParaDesactivar] =
    useState<Proveedor | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Detección de mensajes flash en searchParams
  const isCreated = searchParams.get("created") === "1";
  const isUpdated = searchParams.get("updated") === "1";
  const isDenied = searchParams.get("denied") === "1";

  const effectiveSuccessMessage =
    successMessage ||
    (!dismissedFlash
      ? isCreated
        ? "¡Proveedor registrado exitosamente en el directorio!"
        : isUpdated
        ? "¡Proveedor actualizado correctamente!"
        : null
      : null);

  const effectiveErrorMessage =
    errorMessage ||
    (!dismissedFlash && isDenied
      ? "No tienes permiso para esta acción."
      : null);

  const handleDismissSuccess = () => {
    setSuccessMessage(null);
    setDismissedFlash(true);
    if (isCreated || isUpdated) router.replace("/proveedores");
  };

  const handleDismissError = () => {
    setErrorMessage(null);
    setDismissedFlash(true);
    if (isDenied) router.replace("/proveedores");
  };

  // Carga de proveedores desde el backend al cambiar página o búsqueda
  useEffect(() => {
    let isMounted = true;

    async function cargar() {
      setErrorCarga(null);
      try {
        const response = await obtenerProveedores(
          {
            busqueda: terminoBuscado,
            page,
          },
          token
        );
        if (isMounted) {
          setProveedores(response.data || []);
          setPagination({
            currentPage: response.current_page || 1,
            lastPage: response.last_page || 1,
            total: response.total || 0,
          });
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Error al cargar proveedores:", err);
        setErrorCarga(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el listado de proveedores."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    cargar();

    return () => {
      isMounted = false;
    };
  }, [page, terminoBuscado, token]);

  // Recarga manual al presionar botón de actualización
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorCarga(null);
    try {
      const response = await obtenerProveedores(
        {
          busqueda: terminoBuscado,
          page,
        },
        token
      );
      setProveedores(response.data || []);
      setPagination({
        currentPage: response.current_page || 1,
        lastPage: response.last_page || 1,
        total: response.total || 0,
      });
    } catch (err: unknown) {
      console.error("Error al refrescar proveedores:", err);
      setErrorCarga(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el listado de proveedores."
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [page, terminoBuscado, token]);

  // Manejador del formulario de búsqueda
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

  // Desactivación lógica del proveedor
  const handleConfirmarDesactivar = async () => {
    if (!proveedorParaDesactivar) return;

    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await desactivarProveedor(proveedorParaDesactivar.id, token);
      setSuccessMessage(
        `El proveedor "${proveedorParaDesactivar.razon_social}" ha sido desactivado.`
      );
      // Actualizar estado local para reflejar activo = false
      setProveedores((prev) =>
        prev.map((p) =>
          p.id === proveedorParaDesactivar.id ? { ...p, activo: false } : p
        )
      );
      if (proveedorSeleccionado?.id === proveedorParaDesactivar.id) {
        setProveedorSeleccionado((prev) => (prev ? { ...prev, activo: false } : null));
      }
      setProveedorParaDesactivar(null);
    } catch (err: unknown) {
      console.error("Error al desactivar proveedor:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al desactivar el proveedor."
      );
      setProveedorParaDesactivar(null);
    } finally {
      setIsDeleting(false);
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
    <ProtectedByRole modulo="proveedores">
      <DashboardLayout>
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* BREADCRUMBS Y ENCABEZADO                                                  */}
          {/* ========================================================================= */}
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
              <span className="font-semibold text-brand">Proveedores</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                    Directorio de Proveedores
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Haz clic en la razón social de un proveedor para ver sus detalles y acciones.
                  </p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isLoading || isRefreshing}
                  className="text-xs gap-1.5 shadow-2xs"
                  title="Recargar directorio de proveedores"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-slate-500 ${
                      isRefreshing ? "animate-spin text-brand" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>

                {tienePermisoEscritura && (
                  <Link href="/proveedores/nuevo">
                    <Button
                      size="sm"
                      className="text-xs gap-1.5 shadow-sm shadow-brand/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nuevo Proveedor</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BANNERS DE MENSAJE (ÉXITO / ERROR)                                        */}
          {/* ========================================================================= */}
          {effectiveSuccessMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="font-medium">{effectiveSuccessMessage}</p>
              </div>
              <button
                type="button"
                onClick={handleDismissSuccess}
                className="text-emerald-500 hover:text-emerald-800 p-1 rounded-lg hover:bg-emerald-100/50 transition-colors cursor-pointer"
                title="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {effectiveErrorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <p className="font-medium">{effectiveErrorMessage}</p>
              </div>
              <button
                type="button"
                onClick={handleDismissError}
                className="text-rose-400 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100/50 transition-colors cursor-pointer"
                title="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BARRA DE BÚSQUEDA Y TOGGLE                                                */}
          {/* ========================================================================= */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <form onSubmit={handleBuscar} className="flex items-center gap-2.5 flex-1">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar proveedor por Razón Social o RUC... (Presiona Enter)"
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={handleLimpiarBusqueda}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <Button
                type="submit"
                size="sm"
                className="text-xs shrink-0"
              >
                Buscar
              </Button>
            </form>

            {/* Toggle de Vista Tabla / Cuadrícula */}
            <ViewToggle vista={vista} onCambiarVista={setVista} />
          </div>

          {/* ========================================================================= */}
          {/* VISTAS: TABLA O CUADRÍCULA                                                */}
          {/* ========================================================================= */}
          {vista === "tabla" ? (
            /* ═══════════════ VISTA TABLA ═══════════════ */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">RUC / Identificación</th>
                      <th className="py-3.5 px-4 sm:px-6">Razón Social</th>
                      <th className="py-3.5 px-4">Teléfono</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {/* ESTADO: CARGANDO */}
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-4 px-4 sm:px-6">
                            <div className="h-3.5 bg-slate-200 rounded w-28" />
                          </td>
                          <td className="py-4 px-4 sm:px-6">
                            <div className="h-4 bg-slate-200 rounded w-44" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="h-3.5 bg-slate-100 rounded w-24" />
                          </td>
                          <td className="py-4 px-4">
                            <div className="h-3.5 bg-slate-100 rounded w-36" />
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="h-4 bg-slate-100 rounded-full w-14 mx-auto" />
                          </td>
                        </tr>
                      ))
                    ) : errorCarga ? (
                      /* ESTADO: ERROR DE CONEXIÓN */
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center"
                        >
                          <div className="max-w-xs mx-auto flex flex-col items-center">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-2.5">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-slate-800">
                              Error al cargar proveedores
                            </p>
                            <p className="text-xs text-slate-500 mt-1 mb-3">
                              {errorCarga}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleManualRefresh}
                              className="text-xs"
                            >
                              Intentar de nuevo
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : proveedores.length === 0 ? (
                      /* ESTADO: VACÍO */
                      <tr>
                        <td
                          colSpan={5}
                          className="py-14 text-center"
                        >
                          <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">
                              No se encontraron proveedores
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
                              {terminoBuscado
                                ? "No hay resultados para la búsqueda ingresada. Intenta con otro término."
                                : "Aún no has registrado distribuidores o proveedores en el sistema."}
                            </p>
                            {terminoBuscado ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLimpiarBusqueda}
                                className="text-xs"
                              >
                                Limpiar búsqueda
                              </Button>
                            ) : tienePermisoEscritura ? (
                              <Link href="/proveedores/nuevo">
                                <Button
                                  size="sm"
                                  className="text-xs gap-1.5 shadow-sm shadow-brand/20"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Registrar primer proveedor</span>
                                </Button>
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      /* FILAS DE PROVEEDORES */
                      proveedores.map((prov) => {
                        const isSelected = proveedorSeleccionado?.id === prov.id;
                        return (
                          <tr
                            key={prov.id}
                            className={`hover:bg-slate-50/80 transition-colors group ${
                              isSelected ? "bg-brand/5" : ""
                            }`}
                          >
                            {/* RUC */}
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-mono font-medium text-slate-800">
                                  {prov.ruc}
                                </span>
                              </div>
                            </td>

                            {/* Razón Social — clickeable para abrir el DetailDrawer */}
                            <td className="py-3.5 px-4 sm:px-6">
                              <button
                                type="button"
                                onClick={() =>
                                  setProveedorSeleccionado(
                                    isSelected ? null : prov
                                  )
                                }
                                className="flex items-center gap-2.5 text-left cursor-pointer w-full group/btn"
                              >
                                <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-xs shrink-0">
                                  <Building2 className="w-3.5 h-3.5" />
                                </div>
                                <span
                                  className={`font-semibold transition-colors ${
                                    isSelected
                                      ? "text-brand"
                                      : "text-slate-900 group-hover/btn:text-brand"
                                  }`}
                                >
                                  {prov.razon_social}
                                </span>
                              </button>
                            </td>

                            {/* Teléfono */}
                            <td className="py-3.5 px-4 text-slate-600">
                              {prov.telefono ? (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{prov.telefono}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No registrado</span>
                              )}
                            </td>

                            {/* Email */}
                            <td className="py-3.5 px-4 text-slate-600">
                              {prov.email ? (
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span className="truncate max-w-[180px]">
                                    {prov.email}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No registrado</span>
                              )}
                            </td>

                            {/* Estado */}
                            <td className="py-3.5 px-4 text-center">
                              {prov.activo ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Activo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  <Ban className="w-3 h-3 text-slate-400" />
                                  Inactivo
                                </span>
                              )}
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
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 animate-pulse flex flex-col h-full">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-slate-200" />
                        <div className="w-16 h-5 bg-slate-100 rounded-full" />
                      </div>
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 mt-auto">
                        <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                        <div className="h-3.5 bg-slate-100 rounded w-3/4" />
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
                    <p className="text-xs font-bold text-slate-800">Error al cargar proveedores</p>
                    <p className="text-xs text-slate-500 mt-1 mb-3">{errorCarga}</p>
                    <Button variant="outline" size="sm" onClick={handleManualRefresh} className="text-xs">Intentar de nuevo</Button>
                  </div>
                </div>
              ) : proveedores.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-14 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No se encontraron proveedores</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
                      {terminoBuscado
                        ? "No hay resultados para la búsqueda ingresada. Intenta con otro término."
                        : "Aún no has registrado distribuidores o proveedores en el sistema."}
                    </p>
                    {terminoBuscado ? (
                      <Button variant="outline" size="sm" onClick={handleLimpiarBusqueda} className="text-xs">Limpiar búsqueda</Button>
                    ) : tienePermisoEscritura ? (
                      <Link href="/proveedores/nuevo">
                        <Button size="sm" className="text-xs gap-1.5 shadow-sm shadow-brand/20">
                          <Plus className="w-3.5 h-3.5" /><span>Registrar primer proveedor</span>
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {proveedores.map((prov) => {
                    const isSelected = proveedorSeleccionado?.id === prov.id;
                    return (
                      <div
                        key={prov.id}
                        onClick={() => setProveedorSeleccionado(isSelected ? null : prov)}
                        className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-5 flex flex-col h-full hover:shadow-md ${
                          isSelected
                            ? "ring-2 ring-[var(--primary-brand)] border-transparent shadow-md"
                            : "border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                            style={{
                              backgroundColor: "color-mix(in srgb, var(--primary-brand) 12%, transparent)",
                              color: "var(--primary-brand)",
                            }}
                          >
                            <Building2 className="w-5 h-5" />
                          </div>

                          {prov.activo ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              <Ban className="w-3 h-3 text-slate-400" />
                              Inactivo
                            </span>
                          )}
                        </div>

                        {/* Razón Social y RUC */}
                        <div className="space-y-1.5 mb-3">
                          <h3
                            className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-brand transition-colors"
                            style={isSelected ? { color: "var(--primary-brand)" } : undefined}
                          >
                            {prov.razon_social}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">RUC:</span>
                            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {prov.ruc}
                            </span>
                          </div>
                        </div>

                        {/* Contacto */}
                        <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1.5 mt-auto">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{prov.telefono || <span className="text-slate-400 italic">Sin teléfono</span>}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{prov.email || <span className="text-slate-400 italic">Sin correo</span>}</span>
                          </div>
                        </div>

                        {/* Pie de tarjeta */}
                        <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Distribuidor</span>
                          <span className="font-semibold text-brand group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            <span>Ver detalles</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Barra de Estado y Paginación Compartida */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs py-3.5 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {pagination.total > 0 ? (
                <span>
                  Mostrando <strong className="text-slate-800 font-bold">{proveedores.length}</strong> de{" "}
                  <strong className="text-slate-800 font-bold">{pagination.total}</strong> proveedores registrados en total
                </span>
              ) : (
                <span>Total: 0 proveedores</span>
              )}
            </div>

            {pagination.lastPage > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => {
                    setIsLoading(true);
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  className="text-xs p-2 h-8"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <span className="text-xs text-slate-600 font-medium px-1">
                  Página {pagination.currentPage} de {pagination.lastPage}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.lastPage || isLoading}
                  onClick={() => {
                    setIsLoading(true);
                    setPage((p) => Math.min(pagination.lastPage, p + 1));
                  }}
                  className="text-xs p-2 h-8"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* DETAIL DRAWER — Proveedor                                                 */}
          {/* ========================================================================= */}
          <DetailDrawer
            isOpen={!!proveedorSeleccionado}
            onClose={() => setProveedorSeleccionado(null)}
            title={proveedorSeleccionado?.razon_social ?? "Detalle de Proveedor"}
            subtitle={proveedorSeleccionado ? `RUC: ${proveedorSeleccionado.ruc}` : ""}
            icon={<Building2 className="w-4 h-4" />}
          >
            {proveedorSeleccionado && (
              <div className="p-5 space-y-5">
                {/* Identificación */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Información Comercial
                  </h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 text-xs">
                    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <Hash className="w-3.5 h-3.5" />
                        <span>ID interno</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-700">
                        #{proveedorSeleccionado.id}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                        <span>RUC</span>
                      </div>
                      <span className="font-mono font-semibold text-slate-800">
                        {proveedorSeleccionado.ruc}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Razón Social</span>
                      </div>
                      <span className="font-semibold text-slate-800 text-right">
                        {proveedorSeleccionado.razon_social}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-slate-500">Estado</span>
                      {proveedorSeleccionado.activo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <Ban className="w-3 h-3 text-slate-400" />
                          Inactivo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contacto y Ubicación */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Datos de Contacto
                  </h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100 text-xs">
                    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Teléfono</span>
                      </div>
                      <span className="font-semibold text-slate-800">
                        {proveedorSeleccionado.telefono || (
                          <span className="text-slate-400 italic font-normal">No registrado</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Correo</span>
                      </div>
                      <span className="font-medium text-slate-800 text-right truncate max-w-[200px]">
                        {proveedorSeleccionado.email || (
                          <span className="text-slate-400 italic font-normal">No registrado</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Dirección</span>
                      </div>
                      <span className="font-medium text-slate-800 text-right">
                        {proveedorSeleccionado.direccion || (
                          <span className="text-slate-400 italic font-normal">No registrada</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fechas / Auditoría si existen */}
                {(proveedorSeleccionado.created_at || proveedorSeleccionado.updated_at) && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Registro
                    </h3>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-xs space-y-1.5">
                      {proveedorSeleccionado.created_at && (
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Registrado el:
                          </span>
                          <span className="font-semibold text-slate-700">
                            {formatDate(proveedorSeleccionado.created_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Acciones */}
                {tienePermisoEscritura && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Acciones
                    </p>
                    <div className="flex flex-col gap-2">
                      <Link href={`/proveedores/${proveedorSeleccionado.id}/editar`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full text-xs gap-2 justify-center">
                          <Edit className="w-3.5 h-3.5" />
                          <span>Editar proveedor</span>
                        </Button>
                      </Link>

                      {proveedorSeleccionado.activo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProveedorParaDesactivar(proveedorSeleccionado)}
                          className="w-full text-xs gap-2 justify-center text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Desactivar proveedor</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DetailDrawer>

          {/* ========================================================================= */}
          {/* MODAL DE CONFIRMACIÓN DE DESACTIVACIÓN                                    */}
          {/* ========================================================================= */}
          {proveedorParaDesactivar && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-desactivar-titulo"
            >
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <div className="text-center space-y-1.5">
                  <h3
                    id="modal-desactivar-titulo"
                    className="text-base font-bold text-slate-900"
                  >
                    ¿Desactivar proveedor?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Estás a punto de marcar como inactivo al proveedor{" "}
                    <strong className="text-slate-800 font-semibold">
                      &ldquo;{proveedorParaDesactivar.razon_social}&rdquo;
                    </strong>
                    . Ya no aparecerá disponible para registrar nuevas compras.
                  </p>
                  <p className="text-[11px] text-slate-400 bg-slate-50 rounded-lg p-2 mt-2 border border-slate-200/80">
                    Esta acción es un borrado lógico. Podrás reactivarlo en cualquier momento desde la pantalla de edición.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setProveedorParaDesactivar(null)}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <Button
                    size="sm"
                    isLoading={isDeleting}
                    onClick={handleConfirmarDesactivar}
                    className="flex-1 text-xs py-2.5"
                  >
                    Confirmar Desactivación
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}

export default function ProveedoresPage() {
  return (
    <Suspense fallback={null}>
      <ProveedoresContent />
    </Suspense>
  );
}

