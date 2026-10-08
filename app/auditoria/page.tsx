"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { obtenerAuditLogs } from "@/lib/api";
import { AuditLog, AuditLogsPaginadosResponse } from "@/types/auditoria";
import { Button } from "@/components/ui/Button";
import { DetailDrawer } from "@/components/ui/DetailDrawer";
import {
  ClipboardList,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Layers,
  ArrowRight,
  Globe,
  Clock,
  FileCode,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/**
 * Convierte nombres de modelos de backend (ej: "App\Models\Producto") en nombres legibles en español.
 */
function getModuloLegible(auditableType: string): string {
  if (!auditableType) return "General";
  const clean = auditableType.replace(/^App\\Models\\/, "").trim();

  const mapping: Record<string, string> = {
    Producto: "Productos",
    Categoria: "Categorías",
    Proveedor: "Proveedores",
    Venta: "Ventas",
    DetalleVenta: "Detalles de Venta",
    Compra: "Compras",
    DetalleCompra: "Detalles de Compra",
    User: "Usuarios",
    Usuario: "Usuarios",
    Role: "Roles y Permisos",
    Permiso: "Permisos",
    ConfiguracionEmpresa: "Configuración",
    Presentacion: "Presentaciones de Venta",
    Backup: "Respaldos",
  };

  return mapping[clean] || clean;
}

/**
 * Genera el badge de acción (creación, actualización, eliminación, anulación).
 */
function getActionBadge(action: string) {
  const norm = (action || "").toLowerCase().trim();

  if (norm.includes("crea") || norm === "create" || norm === "store") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Creación
      </span>
    );
  }

  if (norm.includes("act") || norm === "update" || norm === "edit") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Actualización
      </span>
    );
  }

  if (norm.includes("elim") || norm === "delete" || norm === "destroy") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Eliminación
      </span>
    );
  }

  if (norm.includes("anul")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Anulación
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
      {action}
    </span>
  );
}

/**
 * Formateador de fechas para registros de auditoría
 */
function formatFechaAuditoria(fechaIso: string): { fecha: string; hora: string } {
  if (!fechaIso) return { fecha: "—", hora: "" };
  try {
    const d = new Date(fechaIso);
    if (isNaN(d.getTime())) return { fecha: fechaIso, hora: "" };

    const fecha = d.toLocaleDateString("es-NI", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
    const hora = d.toLocaleTimeString("es-NI", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return { fecha, hora };
  } catch {
    return { fecha: fechaIso, hora: "" };
  }
}

function parseValoresAuditoria(val: unknown): Record<string, unknown> {
  if (!val) return {};
  if (typeof val === "object" && val !== null) {
    if (Array.isArray(val)) {
      return val.reduce((acc, item, idx) => {
        acc[`item_${idx + 1}`] = item;
        return acc;
      }, {} as Record<string, unknown>);
    }
    return val as Record<string, unknown>;
  }
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === "object" && parsed !== null) {
        return parseValoresAuditoria(parsed);
      }
      return { valor: parsed };
    } catch {
      return { detalle: val };
    }
  }
  return { valor: val };
}

/**
 * Convierte un valor a texto legible para el drawer de comparación.
 */
function renderValorDiff(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "object") {
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

export default function AuditoriaPage() {
  const { token } = useAuth();

  // Estados del listado
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 15,
  });

  // Filtros
  const [usuarioIdInput, setUsuarioIdInput] = useState<string>("");
  const [moduloFiltro, setModuloFiltro] = useState<string>("");
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");
  const [filtroAplicado, setFiltroAplicado] = useState({
    usuario_id: "",
    modulo: "",
    desde: "",
    hasta: "",
  });
  const [page, setPage] = useState<number>(1);

  // Estados de carga y error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drawer de detalle
  const [logSeleccionado, setLogSeleccionado] = useState<AuditLog | null>(null);

  // Cargar logs al cambiar página o filtros aplicados
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res: AuditLogsPaginadosResponse = await obtenerAuditLogs(
        {
          page,
          usuario_id: filtroAplicado.usuario_id || undefined,
          modulo: filtroAplicado.modulo || undefined,
          desde: filtroAplicado.desde || undefined,
          hasta: filtroAplicado.hasta || undefined,
        },
        token
      );
      setLogs(res.data || []);
      setPagination({
        currentPage: res.current_page || 1,
        lastPage: res.last_page || 1,
        total: res.total || (res.data ? res.data.length : 0),
        perPage: res.per_page || 15,
      });
    } catch (err: unknown) {
      console.error("Error al cargar registros de auditoría:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "No fue posible cargar el registro de auditoría."
      );
      setLogs([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, filtroAplicado, token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleAplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setFiltroAplicado({
      usuario_id: usuarioIdInput.trim(),
      modulo: moduloFiltro.trim(),
      desde: desde.trim(),
      hasta: hasta.trim(),
    });
  };

  const handleLimpiarFiltros = () => {
    setUsuarioIdInput("");
    setModuloFiltro("");
    setDesde("");
    setHasta("");
    setPage(1);
    setFiltroAplicado({
      usuario_id: "",
      modulo: "",
      desde: "",
      hasta: "",
    });
  };

  const tieneFiltrosActivos =
    Boolean(filtroAplicado.usuario_id ||
    filtroAplicado.modulo ||
    filtroAplicado.desde ||
    filtroAplicado.hasta);

  // Calcular claves modificadas entre old_values y new_values
  const getCamposCambiados = (log: AuditLog) => {
    const oldV = parseValoresAuditoria(log.old_values);
    const newV = parseValoresAuditoria(log.new_values);
    const todasLasKeys = Array.from(new Set([...Object.keys(oldV), ...Object.keys(newV)]));

    const actionNorm = (log.action || "").toLowerCase().trim();
    const isCreacion = actionNorm.includes("crea") || actionNorm === "create" || actionNorm === "store";
    const isEliminacion = actionNorm.includes("elim") || actionNorm === "delete" || actionNorm === "destroy";

    // Si es creación, todos los new_values son nuevos
    if (isCreacion || Object.keys(oldV).length === 0) {
      if (Object.keys(newV).length > 0) {
        return Object.keys(newV).map((k) => ({
          campo: k,
          antiguo: null,
          nuevo: newV[k],
          badge: "Nuevo Atributo",
          badgeColor: "bg-emerald-100 text-emerald-800",
        }));
      }
    }

    // Si es eliminación, todos los old_values fueron removidos
    if (isEliminacion || Object.keys(newV).length === 0) {
      if (Object.keys(oldV).length > 0) {
        return Object.keys(oldV).map((k) => ({
          campo: k,
          antiguo: oldV[k],
          nuevo: null,
          badge: "Eliminado",
          badgeColor: "bg-rose-100 text-rose-800",
        }));
      }
    }

    // Si es actualización, filtrar solo los que cambiaron de valor
    const modificados = todasLasKeys
      .filter((key) => {
        const a = JSON.stringify(oldV[key]);
        const b = JSON.stringify(newV[key]);
        return a !== b;
      })
      .map((key) => ({
        campo: key,
        antiguo: oldV[key] ?? null,
        nuevo: newV[key] ?? null,
        badge: "Modificado",
        badgeColor: "bg-blue-100 text-blue-800",
      }));

    if (modificados.length > 0) {
      return modificados;
    }

    // Si no hubo diferencias estrictas pero hay claves en newV u oldV, mostrarlas todas
    if (todasLasKeys.length > 0) {
      return todasLasKeys.map((key) => ({
        campo: key,
        antiguo: oldV[key] ?? null,
        nuevo: newV[key] ?? null,
        badge: "Registrado",
        badgeColor: "bg-slate-100 text-slate-700",
      }));
    }

    return [];
  };

  return (
    <ProtectedByRole modulo="auditoria">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] font-sans">
                    Registro de Auditoría
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Trazabilidad en tiempo real de operaciones, modificaciones y cambios en el sistema.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRefreshing(true);
                fetchLogs();
              }}
              disabled={isLoading || isRefreshing}
              className="text-xs font-semibold gap-1.5 shadow-2xs self-start sm:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand" : ""}`} />
              <span>Refrescar</span>
            </Button>
          </div>

          {/* Barra de Filtros */}
          <form
            onSubmit={handleAplicarFiltros}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Filtro por Módulo */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Módulo
                </label>
                <select
                  value={moduloFiltro}
                  onChange={(e) => setModuloFiltro(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                >
                  <option value="">Todos los módulos</option>
                  <option value="Producto">Productos</option>
                  <option value="Categoria">Categorías</option>
                  <option value="Proveedor">Proveedores</option>
                  <option value="Venta">Ventas</option>
                  <option value="Compra">Compras</option>
                  <option value="User">Usuarios</option>
                  <option value="Role">Roles y Permisos</option>
                  <option value="ConfiguracionEmpresa">Configuración</option>
                  <option value="Presentacion">Presentaciones</option>
                </select>
              </div>

              {/* Filtro por Usuario ID */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  ID de Usuario
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej. 1"
                    value={usuarioIdInput}
                    onChange={(e) => setUsuarioIdInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  />
                </div>
              </div>

              {/* Fecha Desde */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 font-sans"
                />
              </div>

              {/* Fecha Hasta */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 font-sans"
                />
              </div>
            </div>

            {/* Botones de acción del filtro */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                {tieneFiltrosActivos && (
                  <span className="font-semibold text-brand">
                    Filtros activos aplicados
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {tieneFiltrosActivos && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleLimpiarFiltros}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    <span>Limpiar</span>
                  </Button>
                )}

                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold gap-1.5 shadow-sm shadow-brand/20"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filtrar</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Mensaje de Error */}
          {errorMessage && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-2xs"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900">Error al consultar auditoría</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Tabla de Registros */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Usuario</th>
                    <th className="py-3.5 px-4">Acción</th>
                    <th className="py-3.5 px-4">Módulo Afectado</th>
                    <th className="py-3.5 px-4">ID Registro</th>
                    <th className="py-3.5 px-4">Fecha y Hora</th>
                    <th className="py-3.5 px-4 text-right">Dirección IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-4">
                          <div className="h-4 bg-slate-200 rounded w-28" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-5 bg-slate-200 rounded-full w-20" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 bg-slate-200 rounded w-24" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 bg-slate-200 rounded w-12" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 bg-slate-200 rounded w-32" />
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="h-4 bg-slate-200 rounded w-20 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-sm text-slate-700">
                          No hay registros de auditoría encontrados
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Ajusta los filtros o realiza operaciones en el sistema para generar eventos.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const { fecha, hora } = formatFechaAuditoria(log.created_at);
                      const moduloNombre = getModuloLegible(log.auditable_type);

                      return (
                        <tr
                          key={log.id}
                          onClick={() => setLogSeleccionado(log)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          {/* Usuario */}
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-bold text-xs shrink-0">
                                {log.usuario?.name ? log.usuario.name.charAt(0).toUpperCase() : "S"}
                              </div>
                              <div className="truncate max-w-[160px]">
                                <span className="block truncate font-bold text-slate-800">
                                  {log.usuario?.name || "Sistema"}
                                </span>
                                {log.usuario?.email && (
                                  <span className="block text-[10px] text-slate-400 truncate">
                                    {log.usuario.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Acción */}
                          <td className="py-3.5 px-4">
                            {getActionBadge(log.action)}
                          </td>

                          {/* Módulo */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-slate-400" />
                              <span>{moduloNombre}</span>
                            </span>
                          </td>

                          {/* ID Registro */}
                          <td className="py-3.5 px-4 font-mono text-slate-600 font-bold">
                            #{log.auditable_id}
                          </td>

                          {/* Fecha y Hora */}
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            <div className="font-medium text-slate-800">{fecha}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{hora}</div>
                          </td>

                          {/* IP */}
                          <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              <Globe className="w-3 h-3 text-slate-400" />
                              {log.ip_address || "127.0.0.1"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {!isLoading && pagination.lastPage > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs bg-slate-50/50">
                <span className="text-slate-500 font-medium">
                  Página {pagination.currentPage} de {pagination.lastPage} ({pagination.total} registros)
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.currentPage <= 1}
                    className="text-xs px-2.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Anterior
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.lastPage, p + 1))}
                    disabled={pagination.currentPage >= pagination.lastPage}
                    className="text-xs px-2.5"
                  >
                    Siguiente
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* DETAIL DRAWER: COMPARATIVA OLD_VALUES VS NEW_VALUES LADO A LADO            */}
          {/* ========================================================================= */}
          {logSeleccionado && (
            <DetailDrawer
              isOpen={Boolean(logSeleccionado)}
              onClose={() => setLogSeleccionado(null)}
              title={`Auditoría #${logSeleccionado.id}: ${getModuloLegible(logSeleccionado.auditable_type)}`}
              subtitle={`Acción ejecutada por ${logSeleccionado.usuario?.name || "Sistema"} • ID #${logSeleccionado.auditable_id}`}
            >
              <div className="p-5 space-y-6">
                {/* Metadatos Generales */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Acción
                    </span>
                    <div>{getActionBadge(logSeleccionado.action)}</div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Fecha y Hora
                    </span>
                    <div className="font-semibold text-slate-800">
                      {formatFechaAuditoria(logSeleccionado.created_at).fecha} {formatFechaAuditoria(logSeleccionado.created_at).hora}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Usuario Responsable
                    </span>
                    <div className="font-bold text-slate-900">
                      {logSeleccionado.usuario?.name || "Sistema"}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Dirección IP
                    </span>
                    <div className="font-mono text-slate-700">
                      {logSeleccionado.ip_address || "127.0.0.1"}
                    </div>
                  </div>
                </div>

                {/* Comparativa Lado a Lado de Campos Modificados */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-brand" />
                      <span>Campos Modificados (Old vs New)</span>
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {getCamposCambiados(logSeleccionado).length} atributo(s)
                    </span>
                  </div>

                  {getCamposCambiados(logSeleccionado).length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
                      <p className="font-semibold">No se detectaron cambios en campos individuales.</p>
                      <p className="text-[11px] text-slate-400">
                        {logSeleccionado.action} sobre {getModuloLegible(logSeleccionado.auditable_type)} #{logSeleccionado.auditable_id}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getCamposCambiados(logSeleccionado).map(({ campo, antiguo, nuevo, badge, badgeColor }) => (
                        <div
                          key={campo}
                          className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs"
                        >
                          {/* Nombre del Campo */}
                          <div className="bg-slate-100/80 px-3.5 py-1.5 border-b border-slate-200 flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-slate-800">
                              {campo}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor || "bg-slate-100 text-slate-700"}`}>
                              {badge || "Modificado"}
                            </span>
                          </div>

                          {/* Comparativa 2 Columnas */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-xs">
                            {/* Valor Antiguo */}
                            <div className="p-3 bg-rose-50/30">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                                Valor Anterior
                              </span>
                              <pre className="font-mono text-xs text-rose-900 bg-rose-50/70 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all border border-rose-100 font-medium">
                                {renderValorDiff(antiguo)}
                              </pre>
                            </div>

                            {/* Valor Nuevo */}
                            <div className="p-3 bg-emerald-50/30">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                                Valor Nuevo
                              </span>
                              <pre className="font-mono text-xs text-emerald-900 bg-emerald-50/70 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all border border-emerald-100 font-medium">
                                {renderValorDiff(nuevo)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Detalle Raw JSON inspeccionable */}
                  <details className="mt-4 pt-2 border-t border-slate-100 group">
                    <summary className="text-[11px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-800 select-none py-1">
                      + Ver estructura JSON completa
                    </summary>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">old_values (raw)</span>
                        <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                          {JSON.stringify(parseValoresAuditoria(logSeleccionado.old_values), null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">new_values (raw)</span>
                        <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                          {JSON.stringify(parseValoresAuditoria(logSeleccionado.new_values), null, 2)}
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </DetailDrawer>
          )}
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
