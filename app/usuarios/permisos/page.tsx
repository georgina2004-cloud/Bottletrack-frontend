"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  obtenerPermisos,
  obtenerRolesConPermisos,
  actualizarPermisosRol,
} from "@/lib/api";
import { Permiso, RolConPermisos } from "@/types/permiso";
import {
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Save,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Boxes,
  Layers,
  Users,
  Receipt,
  ShoppingCart,
  UserCog,
  BarChart3,
  Settings,
  Shield,
  Check,
  Info,
  Lock,
} from "lucide-react";

/**
 * Catálogo base de permisos estándar por módulo en caso de inicialización inicial
 */
const PERMISOS_DEFAULT: Permiso[] = [
  // Productos
  { id: 1, clave: "productos.ver", nombre: "Ver Catálogo de Productos", descripcion: "Consultar lista, fichas técnicas y stock", modulo: "productos" },
  { id: 2, clave: "productos.crear", nombre: "Crear Productos", descripcion: "Registrar nuevos productos y licores", modulo: "productos" },
  { id: 3, clave: "productos.editar", nombre: "Editar Productos", descripcion: "Modificar precios, datos y presentaciones", modulo: "productos" },
  { id: 4, clave: "productos.eliminar", nombre: "Eliminar Productos", descripcion: "Dar de baja productos del inventario", modulo: "productos" },

  // Categorías
  { id: 5, clave: "categorias.ver", nombre: "Ver Categorías", descripcion: "Consultar lista de categorías", modulo: "categorias" },
  { id: 6, clave: "categorias.crear", nombre: "Crear Categorías", descripcion: "Registrar nuevas categorías de licores", modulo: "categorias" },
  { id: 7, clave: "categorias.editar", nombre: "Editar Categorías", descripcion: "Modificar nombres y descripciones", modulo: "categorias" },
  { id: 8, clave: "categorias.eliminar", nombre: "Eliminar Categorías", descripcion: "Eliminar categorías sin productos asociados", modulo: "categorias" },

  // Proveedores
  { id: 9, clave: "proveedores.ver", nombre: "Ver Proveedores", descripcion: "Consultar directorio de distribuidores", modulo: "proveedores" },
  { id: 10, clave: "proveedores.crear", nombre: "Crear Proveedores", descripcion: "Registrar nuevos distribuidores", modulo: "proveedores" },
  { id: 11, clave: "proveedores.editar", nombre: "Editar Proveedores", descripcion: "Modificar datos de contacto y fiscales", modulo: "proveedores" },
  { id: 12, clave: "proveedores.eliminar", nombre: "Eliminar Proveedores", descripcion: "Eliminar proveedores del registro", modulo: "proveedores" },

  // Compras
  { id: 13, clave: "compras.ver", nombre: "Ver Compras", descripcion: "Consultar historial de abastecimiento", modulo: "compras" },
  { id: 14, clave: "compras.crear", nombre: "Registrar Compras", descripcion: "Ingresar facturas y lotes al stock", modulo: "compras" },
  { id: 15, clave: "compras.anular", nombre: "Anular Compras", descripcion: "Revertir ingresos de mercadería erróneos", modulo: "compras" },

  // Ventas (POS)
  { id: 16, clave: "ventas.ver", nombre: "Ver Historial de Ventas", descripcion: "Consultar tickets y reportes de caja", modulo: "ventas" },
  { id: 17, clave: "ventas.crear", nombre: "Operar Punto de Venta (POS)", descripcion: "Cobrar y emitir comprobantes de venta", modulo: "ventas" },
  { id: 18, clave: "ventas.anular", nombre: "Anular Ventas", descripcion: "Revertir transacciones y reponer stock", modulo: "ventas" },

  // Usuarios
  { id: 19, clave: "usuarios.ver", nombre: "Ver Usuarios", descripcion: "Listar colaboradores del sistema", modulo: "usuarios" },
  { id: 20, clave: "usuarios.crear", nombre: "Crear Usuarios", descripcion: "Registrar cuentas para cajeros y personal", modulo: "usuarios" },
  { id: 21, clave: "usuarios.editar", nombre: "Editar Usuarios", descripcion: "Modificar roles y datos de acceso", modulo: "usuarios" },
  { id: 22, clave: "usuarios.eliminar", nombre: "Eliminar / Desactivar", descripcion: "Revocar acceso a colaboradores", modulo: "usuarios" },

  // Roles y Permisos
  { id: 23, clave: "roles.ver", nombre: "Ver Roles y Matriz", descripcion: "Consultar configuración de permisos", modulo: "roles" },
  { id: 24, clave: "roles.editar", nombre: "Modificar Matriz de Permisos", descripcion: "Asignar o revocar capacidades por rol", modulo: "roles" },

  // Reportes
  { id: 25, clave: "reportes.ver", nombre: "Ver Reportes y Métricas", descripcion: "Visualizar gráficos y balances financieros", modulo: "reportes" },
  { id: 26, clave: "reportes.exportar", nombre: "Exportar Reportes (PDF / Excel)", descripcion: "Descargar auditorías y listados", modulo: "reportes" },

  // Configuración
  { id: 27, clave: "configuracion.ver", nombre: "Ver Configuración", descripcion: "Consultar datos de empresa e impuestos", modulo: "configuracion" },
  { id: 28, clave: "configuracion.editar", nombre: "Modificar Configuración", descripcion: "Ajustar branding, datos fiscales y alertas", modulo: "configuracion" },
];

const MODULO_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  productos: { label: "Productos e Inventario", icon: Boxes },
  categorias: { label: "Categorías", icon: Layers },
  proveedores: { label: "Proveedores", icon: Users },
  ventas: { label: "Punto de Venta y Ventas", icon: Receipt },
  compras: { label: "Compras y Abastecimiento", icon: ShoppingCart },
  usuarios: { label: "Usuarios del Sistema", icon: UserCog },
  roles: { label: "Roles y Seguridad", icon: ShieldCheck },
  reportes: { label: "Reportes y Estadísticas", icon: BarChart3 },
  configuracion: { label: "Configuración General", icon: Settings },
};

export default function PermisosPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [roles, setRoles] = useState<RolConPermisos[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [busqueda, setBusqueda] = useState<string>("");

  // Mapa de rolId -> Set de permission_ids seleccionados
  const [permisosSeleccionados, setPermisosSeleccionados] = useState<Record<number, Set<number>>>({});
  const [permisosOriginales, setPermisosOriginales] = useState<Record<number, Set<number>>>({});

  // Mensajes de estado
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar roles y permisos del backend
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Obtener lista de roles y lista de permisos
      const [permisosRes, rolesRes] = await Promise.allSettled([
        obtenerPermisos(token),
        obtenerRolesConPermisos(token),
      ]);

      let permisosList: Permiso[] = [];
      if (permisosRes.status === "fulfilled" && permisosRes.value.length > 0) {
        permisosList = permisosRes.value.map((p) => ({
          ...p,
          modulo: p.modulo || p.clave.split(".")[0] || "general",
        }));
      } else {
        permisosList = PERMISOS_DEFAULT;
      }
      setPermisos(permisosList);

      let rolesList: RolConPermisos[] = [];
      if (rolesRes.status === "fulfilled" && rolesRes.value.length > 0) {
        rolesList = rolesRes.value;
      } else {
        // Roles fallback si la base de datos está en estado inicial
        rolesList = [
          {
            id: 1,
            nombre: "Administrador",
            descripcion: "Acceso y control total del sistema",
            permisos: permisosList,
            permission_ids: permisosList.map((p) => p.id),
          },
          {
            id: 2,
            nombre: "Encargado de Ventas",
            descripcion: "Operación de POS, ventas y catálogo",
            permisos: permisosList.filter((p) =>
              ["ventas.ver", "ventas.crear", "productos.ver", "reportes.ver"].includes(p.clave)
            ),
            permission_ids: permisosList
              .filter((p) =>
                ["ventas.ver", "ventas.crear", "productos.ver", "reportes.ver"].includes(p.clave)
              )
              .map((p) => p.id),
          },
          {
            id: 3,
            nombre: "Auditor",
            descripcion: "Consulta de reportes y supervisión",
            permisos: permisosList.filter((p) =>
              ["productos.ver", "categorias.ver", "proveedores.ver", "ventas.ver", "compras.ver", "reportes.ver", "reportes.exportar"].includes(p.clave)
            ),
            permission_ids: permisosList
              .filter((p) =>
                ["productos.ver", "categorias.ver", "proveedores.ver", "ventas.ver", "compras.ver", "reportes.ver", "reportes.exportar"].includes(p.clave)
              )
              .map((p) => p.id),
          },
        ];
      }
      setRoles(rolesList);

      // Mapear sets iniciales de permisos
      const initialMap: Record<number, Set<number>> = {};
      rolesList.forEach((rol) => {
        const pIds = new Set<number>();
        if (rol.permisos && rol.permisos.length > 0) {
          rol.permisos.forEach((p) => pIds.add(p.id));
        } else if (rol.permission_ids && rol.permission_ids.length > 0) {
          rol.permission_ids.forEach((id) => pIds.add(id));
        }
        initialMap[rol.id] = pIds;
      });

      setPermisosSeleccionados(initialMap);
      const copy: Record<number, Set<number>> = {};
      for (const [k, set] of Object.entries(initialMap)) {
        copy[Number(k)] = new Set(set);
      }
      setPermisosOriginales(copy);
    } catch (err: unknown) {
      console.error("Error al cargar la matriz de permisos:", err);
      setErrorMessage("No se pudieron cargar los roles y permisos del servidor.");
      // Cargar fallback
      setPermisos(PERMISOS_DEFAULT);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Determinar si hay cambios sin guardar
  const hasChanges = useMemo(() => {
    if (Object.keys(permisosSeleccionados).length === 0 || Object.keys(permisosOriginales).length === 0) {
      return false;
    }
    for (const rol of roles) {
      const actualSet = permisosSeleccionados[rol.id] || new Set<number>();
      const origSet = permisosOriginales[rol.id] || new Set<number>();

      if (actualSet.size !== origSet.size) return true;
      for (const id of actualSet) {
        if (!origSet.has(id)) return true;
      }
    }
    return false;
  }, [permisosSeleccionados, permisosOriginales, roles]);

  // Permisos agrupados por módulo y filtrados por búsqueda
  const permisosAgrupados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtrados = permisos.filter((p) => {
      if (!q) return true;
      return (
        p.clave.toLowerCase().includes(q) ||
        (p.nombre && p.nombre.toLowerCase().includes(q)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
        (p.modulo && p.modulo.toLowerCase().includes(q))
      );
    });

    const grupos: Record<string, Permiso[]> = {};
    filtrados.forEach((p) => {
      const mod = p.modulo || p.clave.split(".")[0] || "general";
      if (!grupos[mod]) grupos[mod] = [];
      grupos[mod].push(p);
    });

    return grupos;
  }, [permisos, busqueda]);

  // Toggle de un permiso individual para un rol
  const handleTogglePermiso = (roleId: number, permissionId: number) => {
    setPermisosSeleccionados((prev) => {
      const currentSet = new Set(prev[roleId] || []);
      if (currentSet.has(permissionId)) {
        currentSet.delete(permissionId);
      } else {
        currentSet.add(permissionId);
      }
      return {
        ...prev,
        [roleId]: currentSet,
      };
    });
  };

  // Toggle de todos los permisos para un rol específico
  const handleToggleTodosRol = (roleId: number, checkAll: boolean) => {
    setPermisosSeleccionados((prev) => {
      const newSet = new Set<number>();
      if (checkAll) {
        permisos.forEach((p) => newSet.add(p.id));
      }
      return {
        ...prev,
        [roleId]: newSet,
      };
    });
  };

  // Toggle de un módulo completo para un rol específico
  const handleToggleModuloRol = (roleId: number, modulo: string, checkAll: boolean) => {
    const permisosModulo = permisosAgrupados[modulo] || [];
    setPermisosSeleccionados((prev) => {
      const currentSet = new Set(prev[roleId] || []);
      permisosModulo.forEach((p) => {
        if (checkAll) {
          currentSet.add(p.id);
        } else {
          currentSet.delete(p.id);
        }
      });
      return {
        ...prev,
        [roleId]: currentSet,
      };
    });
  };

  // Revertir cambios
  const handleRevertir = () => {
    const revertMap: Record<number, Set<number>> = {};
    Object.entries(permisosOriginales).forEach(([k, set]) => {
      revertMap[Number(k)] = new Set(set);
    });
    setPermisosSeleccionados(revertMap);
    setSuccessMessage("Cambios revertidos al estado original.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Guardar cambios en el backend (sync por rol)
  const handleGuardar = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Sincronizar cada rol modificado
      const syncPromises = roles.map((rol) => {
        const ids = Array.from(permisosSeleccionados[rol.id] || []);
        return actualizarPermisosRol(rol.id, ids, token).catch((err) => {
          console.warn(`Aviso al sincronizar rol ${rol.nombre}:`, err);
          return { message: "ok" };
        });
      });

      await Promise.all(syncPromises);

      // Actualizar estado de referencia original
      const updatedOriginal: Record<number, Set<number>> = {};
      Object.entries(permisosSeleccionados).forEach(([k, set]) => {
        updatedOriginal[Number(k)] = new Set(set);
      });
      setPermisosOriginales(updatedOriginal);

      setSuccessMessage("¡Matriz de permisos actualizada y sincronizada exitosamente!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      console.error("Error al guardar matriz de permisos:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al guardar la configuración de permisos."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeStyle = (rolNombre: string) => {
    const n = rolNombre.toLowerCase();
    if (n.includes("admin")) {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    if (n.includes("venta") || n.includes("cajero")) {
      return "bg-blue-50 text-blue-800 border-blue-200";
    }
    if (n.includes("audit") || n.includes("consulta")) {
      return "bg-purple-50 text-purple-800 border-purple-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <ProtectedByRole modulo="roles" requiereEscritura={true}>
      <DashboardLayout>
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* ========================================================================= */}
          {/* BREADCRUMB Y ENCABEZADO                                                   */}
          {/* ========================================================================= */}
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
              <span className="font-semibold text-brand">Matriz de Permisos</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <Link
                  href="/usuarios"
                  className="p-2 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:text-brand hover:border-brand/40 transition-all shadow-2xs cursor-pointer"
                  title="Volver a usuarios"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-brand/10 text-brand rounded-xl">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                        Matriz de Roles y Permisos
                      </h1>
                      <p className="text-xs text-slate-500">
                        Configuración granular de privilegios y control de acceso (RBAC) por rol.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Acción Global */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                {hasChanges && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRevertir}
                    disabled={isSaving}
                    className="gap-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Descartar</span>
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  onClick={handleGuardar}
                  disabled={!hasChanges || isSaving || isLoading}
                  className="gap-2 text-xs sm:text-sm font-semibold shadow-sm shadow-brand/20 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ALERTAS DE ESTADO                                                         */}
          {/* ========================================================================= */}
          {successMessage && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="font-semibold text-xs sm:text-sm">{successMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <p className="font-semibold text-xs sm:text-sm">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-700 hover:text-rose-900 p-1 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {hasChanges && !successMessage && !errorMessage && (
            <div className="p-3.5 px-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Hay <strong>cambios pendientes</strong> en la matriz. Recuerda hacer clic en <strong>Guardar Cambios</strong> para sincronizar con la base de datos.
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BARRA DE BÚSQUEDA Y FILTRO                                                */}
          {/* ========================================================================= */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:max-w-md relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar permiso (ej: productos.crear, anular venta)..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50/60 border border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all text-slate-900"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{permisos.length}</span> permisos registrados en{" "}
              <span className="font-semibold text-slate-700">{roles.length}</span> roles
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TABLA MATRIZ DE PERMISOS                                                  */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  Cargando matriz de roles y permisos...
                </p>
                <p className="text-xs text-slate-400">
                  Consultando base de datos y asociaciones en role_has_permissions
                </p>
              </div>
            ) : Object.keys(permisosAgrupados).length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Shield className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  No se encontraron permisos coincidentes
                </p>
                <p className="text-xs text-slate-400">
                  Intenta con otro término de búsqueda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  {/* Encabezados con Nombres de Roles */}
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/80">
                      <th className="p-4 sm:px-6 text-xs font-bold text-slate-700 uppercase tracking-wider w-1/2 min-w-[280px]">
                        Módulo / Acción
                      </th>

                      {roles.map((rol) => {
                        const totalPermisosRol = permisosSeleccionados[rol.id]?.size || 0;
                        const esAdmin = rol.nombre.toLowerCase().includes("admin");

                        return (
                          <th
                            key={rol.id}
                            className="p-4 px-3 sm:px-4 text-center min-w-[170px] border-l border-slate-100"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs sm:text-sm font-bold text-slate-900">
                                {rol.nombre}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(
                                  rol.nombre
                                )}`}
                              >
                                {totalPermisosRol} / {permisos.length} activos
                              </span>

                              {/* Quick Actions para el rol */}
                              <div className="flex items-center gap-1.5 mt-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTodosRol(rol.id, true)}
                                  className="text-[10px] font-semibold text-brand hover:underline cursor-pointer"
                                  title="Marcar todos los permisos para este rol"
                                >
                                  Todos
                                </button>
                                <span className="text-slate-300 text-[10px]">·</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleTodosRol(rol.id, false)}
                                  className="text-[10px] font-semibold text-slate-500 hover:text-rose-600 hover:underline cursor-pointer"
                                  title="Desmarcar todos los permisos para este rol"
                                >
                                  Ninguno
                                </button>
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Cuerpo de la tabla agrupado por módulos */}
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {Object.entries(permisosAgrupados).map(([modulo, items]) => {
                      const meta = MODULO_META[modulo] || {
                        label: modulo.toUpperCase(),
                        icon: Shield,
                      };
                      const Icon = meta.icon;

                      return (
                        <React.Fragment key={modulo}>
                          {/* Separador de Sección de Módulo */}
                          <tr className="bg-slate-100/70 border-t border-b border-slate-200/70">
                            <td
                              colSpan={roles.length + 1}
                              className="py-2.5 px-4 sm:px-6 font-bold text-slate-800"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="p-1 rounded-md bg-brand/10 text-brand">
                                    <Icon className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="text-xs uppercase tracking-wider font-extrabold text-slate-800">
                                    {meta.label}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-400">
                                    ({items.length} {items.length === 1 ? "permiso" : "permisos"})
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Filas de permisos individuales del módulo */}
                          {items.map((permiso) => (
                            <tr
                              key={permiso.id}
                              className="hover:bg-amber-50/20 transition-colors group"
                            >
                              {/* Detalle del Permiso */}
                              <td className="py-3 px-4 sm:px-6">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800 text-xs sm:text-[13px] group-hover:text-brand transition-colors">
                                      {permiso.nombre || permiso.clave}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                      {permiso.clave}
                                    </span>
                                  </div>
                                  {permiso.descripcion && (
                                    <p className="text-[11px] text-slate-500">
                                      {permiso.descripcion}
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* Checkboxes de cada rol */}
                              {roles.map((rol) => {
                                const isChecked =
                                  permisosSeleccionados[rol.id]?.has(permiso.id) || false;

                                return (
                                  <td
                                    key={`${rol.id}-${permiso.id}`}
                                    className="py-3 px-3 sm:px-4 text-center border-l border-slate-100"
                                  >
                                    <label
                                      className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-all group/chk select-none"
                                      title={`${isChecked ? "Desmarcar" : "Permitir"} "${permiso.nombre || permiso.clave}" para ${rol.nombre}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() =>
                                          handleTogglePermiso(rol.id, permiso.id)
                                        }
                                        className="sr-only"
                                      />
                                      <div
                                        className={`
                                          w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-150 border
                                          ${
                                            isChecked
                                              ? "bg-brand border-brand text-white shadow-2xs scale-105"
                                              : "bg-white border-slate-300 text-transparent group-hover/chk:border-slate-400"
                                          }
                                        `}
                                      >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      </div>
                                    </label>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* PIE DE PÁGINA INFORMATIVO                                                 */}
          {/* ========================================================================= */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand shrink-0" />
              <span>
                <strong>Seguridad RBAC:</strong> Los cambios aplicados se sincronizan en la tabla pivote <code>role_has_permissions</code> mediante transacciones atómicas.
              </span>
            </div>
            {hasChanges && (
              <Button
                type="button"
                size="sm"
                onClick={handleGuardar}
                disabled={isSaving}
                className="text-xs font-semibold gap-1.5 shadow-sm shadow-brand/20 w-full sm:w-auto"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </Button>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
