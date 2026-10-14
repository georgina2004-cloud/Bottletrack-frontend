"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { obtenerAuditLogs, obtenerVentaPorId, obtenerCompraPorId } from "@/lib/api";
import { AuditLog, AuditLogsPaginadosResponse } from "@/types/auditoria";
import { Venta } from "@/types/venta";
import { Compra } from "@/types/compra";
import { formatDateTimeLegible, formatDateLegible } from "@/lib/formatDate";
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
  RotateCcw,
  Receipt,
  Package,
  DollarSign,
  Tag,
  ShieldAlert,
  SlidersHorizontal,
  Image as ImageIcon,
  ExternalLink,
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
 * Diccionario de traducción de nombres de campos técnicos a etiquetas amigables en español.
 */
const FIELD_LABELS: Record<string, string> = {
  nombre: "Nombre",
  name: "Nombre",
  numero_factura: "N° Factura / Ticket",
  cliente_nombre: "Nombre del Cliente",
  fecha: "Fecha",
  subtotal: "Subtotal",
  descuento: "Descuento",
  impuesto: "Impuesto (IVA 15%)",
  total: "Total Facturado",
  estado_activa: "Estado de la Venta",
  activo: "Estado Activo",
  stock_actual: "Stock Actual",
  stock_minimo: "Stock Mínimo",
  stock: "Stock",
  precio_compra: "Precio de Compra",
  precio_venta: "Precio de Venta",
  codigo_barras: "Código de Barras",
  descripcion: "Descripción",
  razon_social: "Razón Social",
  nombre_comercial: "Nombre Comercial",
  ruc: "RUC",
  telefono: "Teléfono",
  email: "Correo Electrónico",
  correo: "Correo Electrónico",
  direccion: "Dirección",
  ubicacion: "Ubicación en Bodega",
  categoria: "Categoría",
  categoria_id: "ID Categoría",
  proveedor: "Proveedor",
  marca: "Marca",
  proveedor_id: "ID Proveedor",
  presentacion_ml: "Presentación (ML)",
  unidades_equivalentes: "Unidades Equivalentes",
  motivo: "Motivo de Anulación",
  eslogan: "Eslogan",
  logo_path: "Logo de la Empresa",
  imagen_path: "Imagen del Producto",
  stock_maximo: "Stock Máximo",
  fecha_vencimiento: "Fecha de Vencimiento",
  ubicacion_en_bodega: "Ubicación en Bodega",
  numero_factura_proveedor: "N° Factura Proveedor",
  numero_compra: "N° de Compra",
  monto_total: "Monto Total",
  fecha_compra: "Fecha de Compra",
  fecha_anulacion: "Fecha de Anulación",
};

/**
 * Obtiene una etiqueta en español amigable para cualquier campo de la base de datos.
 */
function getFieldLabel(campo: string): string {
  const norm = (campo || "").toLowerCase().trim();
  if (FIELD_LABELS[norm]) return FIELD_LABELS[norm];
  if (FIELD_LABELS[campo]) return FIELD_LABELS[campo];
  const clean = campo.replace(/_/g, " ").trim();
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Campos técnicos irrelevantes para la vista ejecutiva/resumen de creación.
 */
const CAMPOS_TECNICOS_IGNORADOS = new Set([
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "user_id",
  "remember_token",
  "password",
  "email_verified_at",
]);

/**
 * Parse seguro de valores raw provenientes del backend
 */
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

export type TipoAccionAuditoria = "anulacion" | "creacion" | "modificacion" | "eliminacion" | "otro";

export interface InfoAccionAuditoria {
  tipo: TipoAccionAuditoria;
  label: string;
  badge: React.ReactNode;
}

/**
 * Helper unificado para determinar la acción real tanto en la tabla como en el drawer.
 */
function determinarAccion(log: {
  action?: string;
  old_values?: unknown;
  new_values?: unknown;
}): InfoAccionAuditoria {
  const actionNorm = (log.action || "").toLowerCase().trim();
  const oldV = parseValoresAuditoria(log.old_values);
  const newV = parseValoresAuditoria(log.new_values);

  // 1. Detección unificada de Anulación:
  // Si el texto de acción lo indica o si el estado de activación cambió de activo a inactivo
  const isAnulacion =
    actionNorm.includes("anul") ||
    // Cambio en estado_activa de activo a inactivo
    ((oldV.estado_activa === true || oldV.estado_activa === 1 || oldV.estado_activa === "1" || oldV.estado_activa === undefined) &&
      (newV.estado_activa === false || newV.estado_activa === 0 || newV.estado_activa === "0")) ||
    // Cambio en activo de 1 a 0
    ((oldV.activo === true || oldV.activo === 1 || oldV.activo === "1") &&
      (newV.activo === false || newV.activo === 0 || newV.activo === "0"));

  if (isAnulacion) {
    return {
      tipo: "anulacion",
      label: "Anulación",
      badge: (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Anulación
        </span>
      ),
    };
  }

  // 2. Detección de Creación
  const isCreacion =
    actionNorm.includes("crea") ||
    actionNorm === "create" ||
    actionNorm === "store" ||
    (Object.keys(oldV).length === 0 && Object.keys(newV).length > 0);

  if (isCreacion) {
    return {
      tipo: "creacion",
      label: "Creación",
      badge: (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Creación
        </span>
      ),
    };
  }

  // 3. Detección de Eliminación
  const isEliminacion =
    actionNorm.includes("elim") ||
    actionNorm === "delete" ||
    actionNorm === "destroy";

  if (isEliminacion) {
    return {
      tipo: "eliminacion",
      label: "Eliminación",
      badge: (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Eliminación
        </span>
      ),
    };
  }

  // 4. Modificación ordinaria
  return {
    tipo: "modificacion",
    label: "Modificación",
    badge: (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Modificación
      </span>
    ),
  };
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

/**
 * Renderizado amigable con formato de moneda, fecha, enteros limpios o badges booleanos.
 */
function renderValorAmigable(val: unknown, campo?: string): React.ReactNode {
  if (val === null || val === undefined || val === "") {
    return <span className="text-slate-400 italic font-normal text-xs">—</span>;
  }

  // Booleans / Estados
  if (typeof val === "boolean" || val === 1 || val === 0 || val === "1" || val === "0") {
    if (campo && /estado_activa/i.test(campo)) {
      const isActiva = val === true || val === 1 || val === "1";
      return isActiva ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Activa
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Anulada
        </span>
      );
    }
    if (campo && /activo/i.test(campo)) {
      const isActivo = val === true || val === 1 || val === "1";
      return isActivo ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Activo
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Inactivo
        </span>
      );
    }
    if (typeof val === "boolean") {
      return (
        <span className="font-semibold text-xs text-slate-800">
          {val ? "Sí" : "No"}
        </span>
      );
    }
  }

  // Montos monetarios en córdobas (C$)
  if (
    campo &&
    /precio|total|subtotal|descuento|impuesto|costo/i.test(campo) &&
    !isNaN(Number(val))
  ) {
    return (
      <span className="font-sans font-bold text-slate-900 text-xs">
        C$ {Number(val).toFixed(2)}
      </span>
    );
  }

  // Cantidad / Stock: enteros positivos limpios
  if (
    campo &&
    /cantidad|stock|deficit|unidades/i.test(campo) &&
    !isNaN(Number(val))
  ) {
    return (
      <span className="font-mono font-bold text-slate-800 text-xs">
        {Math.abs(Math.round(Number(val)))}
      </span>
    );
  }

  // Fechas legibles
  if (campo && /fecha|created_at|updated_at/i.test(campo) && typeof val === "string") {
    return (
      <span className="text-slate-800 font-medium text-xs">
        {formatDateTimeLegible(val)}
      </span>
    );
  }

  // Imágenes y rutas de archivos multimedia
  if (campo && /imagen|logo|foto|image/i.test(campo) && typeof val === "string") {
    if (!val || val.trim() === "") {
      return <span className="text-slate-400 italic text-xs">Sin imagen</span>;
    }

    const backendBase =
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "")) ||
      "http://localhost:8000";
    const imageUrl = val.startsWith("http")
      ? val
      : `${backendBase}/storage/${val.replace(/^\/?storage\//, "")}`;

    const fileName = val.split("/").pop() || val;

    return (
      <div className="flex items-center gap-3 min-w-0 max-w-full overflow-hidden py-0.5">
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs hover:border-brand/40 hover:ring-2 hover:ring-brand/20 transition-all cursor-pointer"
          title="Ver imagen completa en pestaña nueva"
        >
          <img
            src={imageUrl}
            alt="Vista previa"
            className="w-full h-full object-cover relative z-10 transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <ImageIcon className="w-4 h-4 text-slate-400 absolute" />
        </a>
        <div className="min-w-0 flex-1 overflow-hidden space-y-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="font-mono text-xs font-semibold text-slate-800 truncate"
              title={fileName}
            >
              {fileName}
            </span>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-brand shrink-0 inline-flex items-center"
              title="Abrir imagen completa"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <span
            className="text-[10px] text-slate-400 block truncate font-mono"
            title={val}
          >
            {val}
          </span>
        </div>
      </div>
    );
  }

  // Objetos y listas
  if (typeof val === "object") {
    try {
      return (
        <pre className="font-mono text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 overflow-x-auto whitespace-pre-wrap break-all max-w-full">
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-xs text-slate-800 break-all">{String(val)}</span>;
    }
  }

  return (
    <span
      className="text-xs text-slate-800 font-medium break-all max-w-full block"
      title={String(val)}
    >
      {String(val)}
    </span>
  );
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
  const [accionFiltro, setAccionFiltro] = useState<string>("");
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");
  const [filtroAplicado, setFiltroAplicado] = useState({
    usuario_id: "",
    modulo: "",
    accion: "",
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
  const [auditableVenta, setAuditableVenta] = useState<Venta | null>(null);
  const [auditableCompra, setAuditableCompra] = useState<Compra | null>(null);
  const [cargandoAuditable, setCargandoAuditable] = useState<boolean>(false);

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
          accion: filtroAplicado.accion || undefined,
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

  // Cargar información enriquecida del registro auditado (diferenciado por módulo: Venta vs Compra)
  useEffect(() => {
    if (!logSeleccionado || !token) {
      setAuditableVenta(null);
      setAuditableCompra(null);
      return;
    }

    const audType = logSeleccionado.auditable_type || "";
    const isVenta = /venta/i.test(audType);
    const isCompra = /compra/i.test(audType);

    if (isVenta && logSeleccionado.auditable_id) {
      setAuditableCompra(null);
      const aud = logSeleccionado.auditable as any;
      if (aud && aud.numero_factura) {
        setAuditableVenta(aud as Venta);
        return;
      }

      setCargandoAuditable(true);
      obtenerVentaPorId(logSeleccionado.auditable_id, token)
        .then((v) => setAuditableVenta(v))
        .catch(() => setAuditableVenta(null))
        .finally(() => setCargandoAuditable(false));
    } else if (isCompra && logSeleccionado.auditable_id) {
      setAuditableVenta(null);
      const aud = logSeleccionado.auditable as any;
      if (aud && (aud.numero_factura_proveedor || aud.proveedor)) {
        setAuditableCompra(aud as Compra);
        return;
      }

      setCargandoAuditable(true);
      obtenerCompraPorId(logSeleccionado.auditable_id, token)
        .then((c) => setAuditableCompra(c))
        .catch(() => setAuditableCompra(null))
        .finally(() => setCargandoAuditable(false));
    } else {
      setAuditableVenta(null);
      setAuditableCompra(null);
    }
  }, [logSeleccionado, token]);

  const handleAplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setFiltroAplicado({
      usuario_id: usuarioIdInput.trim(),
      modulo: moduloFiltro.trim(),
      accion: accionFiltro.trim(),
      desde: desde.trim(),
      hasta: hasta.trim(),
    });
  };

  const handleLimpiarFiltros = () => {
    setUsuarioIdInput("");
    setModuloFiltro("");
    setAccionFiltro("");
    setDesde("");
    setHasta("");
    setPage(1);
    setFiltroAplicado({
      usuario_id: "",
      modulo: "",
      accion: "",
      desde: "",
      hasta: "",
    });
  };

  const tieneFiltrosActivos = Boolean(
    filtroAplicado.usuario_id ||
      filtroAplicado.modulo ||
      filtroAplicado.accion ||
      filtroAplicado.desde ||
      filtroAplicado.hasta
  );

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
                    Trazabilidad en tiempo real de operaciones, anulaciones y cambios en el sistema.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Filtro por Módulo */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Módulo
                </label>
                <select
                  value={moduloFiltro}
                  onChange={(e) => setModuloFiltro(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 cursor-pointer"
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

              {/* Filtro por Acción */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Acción
                </label>
                <select
                  value={accionFiltro}
                  onChange={(e) => setAccionFiltro(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 cursor-pointer"
                >
                  <option value="">Todas las acciones</option>
                  <option value="anular">Anulación</option>
                  <option value="create">Creación</option>
                  <option value="update">Modificación</option>
                  <option value="delete">Eliminación</option>
                </select>
              </div>

              {/* Filtro por Usuario ID */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  ID de Usuario
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Ej. 1"
                    value={usuarioIdInput}
                    onChange={(e) => setUsuarioIdInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Rango: Desde */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 cursor-pointer"
                />
              </div>

              {/* Rango: Hasta */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 cursor-pointer"
                />
              </div>
            </div>

            {/* Botones de Filtro */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {tieneFiltrosActivos && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLimpiarFiltros}
                  className="text-xs h-8 px-3"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpiar Filtros
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                className="text-xs h-8 px-4 font-semibold gap-1.5 shadow-sm shadow-brand/20 cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Aplicar Filtros</span>
              </Button>
            </div>
          </form>

          {/* Mensaje de Error si aplica */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tabla de Logs */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Usuario Responsable</th>
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
                            {determinarAccion(log).badge}
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
          {/* DETAIL DRAWER: REDISEÑO PROFESIONAL DIFERENCIADO POR TIPO DE ACCIÓN       */}
          {/* ========================================================================= */}
          {logSeleccionado && (() => {
            const oldV = parseValoresAuditoria(logSeleccionado.old_values);
            const newV = parseValoresAuditoria(logSeleccionado.new_values);
            const auditableType = logSeleccionado.auditable_type || "";
            const isVentaModulo = /venta/i.test(auditableType);
            const isCompraModulo = /compra/i.test(auditableType);
            const moduloNombre = getModuloLegible(auditableType);

            // Determinar la acción real de forma unificada
            const accionInfo = determinarAccion(logSeleccionado);
            const isAnulacion = accionInfo.tipo === "anulacion";
            const isCreacion = accionInfo.tipo === "creacion";
            const isEliminacion = accionInfo.tipo === "eliminacion";
            const isModificacion = accionInfo.tipo === "modificacion";

            // Datos descriptivos para VENTAS
            const numeroFacturaVenta: string =
              (oldV.numero_factura as string) ||
              (newV.numero_factura as string) ||
              (auditableVenta?.numero_factura as string) ||
              ((logSeleccionado.auditable as any)?.numero_factura as string) ||
              `Venta #${logSeleccionado.auditable_id}`;

            const nombreCliente: string =
              (oldV.cliente_nombre as string) ||
              (newV.cliente_nombre as string) ||
              (auditableVenta?.cliente_nombre as string) ||
              ((logSeleccionado.auditable as any)?.cliente_nombre as string) ||
              "Consumidor final";

            const rawTotalVenta =
              oldV.total ??
              oldV.monto_total ??
              newV.total ??
              newV.monto_total ??
              auditableVenta?.total ??
              ((logSeleccionado.auditable as any)?.total as any) ??
              0;
            const totalVentaNum = Number(rawTotalVenta) || 0;

            const productosRestituidos =
              (oldV.productos_restituidos as any[]) ||
              (newV.productos_restituidos as any[]) ||
              (auditableVenta?.detalles as any[]) ||
              ((logSeleccionado.auditable as any)?.detalles as any[]) ||
              [];

            // Datos descriptivos para COMPRAS
            const numeroDocCompra: string =
              (oldV.numero_factura_proveedor as string) ||
              (newV.numero_factura_proveedor as string) ||
              (oldV.numero_compra as string) ||
              (newV.numero_compra as string) ||
              (oldV.numero_factura as string) ||
              (newV.numero_factura as string) ||
              (auditableCompra?.numero_factura_proveedor as string) ||
              ((logSeleccionado.auditable as any)?.numero_factura_proveedor as string) ||
              `Compra #${logSeleccionado.auditable_id}`;

            const nombreProveedor: string =
              (oldV.proveedor_nombre as string) ||
              (newV.proveedor_nombre as string) ||
              ((oldV.proveedor as any)?.razon_social as string) ||
              ((newV.proveedor as any)?.razon_social as string) ||
              (auditableCompra?.proveedor?.razon_social as string) ||
              ((logSeleccionado.auditable as any)?.proveedor?.razon_social as string) ||
              (oldV.proveedor_id ? `Proveedor #${oldV.proveedor_id}` : "") ||
              (auditableCompra?.proveedor_id ? `Proveedor #${auditableCompra.proveedor_id}` : "") ||
              "Proveedor no especificado";

            const rawTotalCompra =
              oldV.total ??
              oldV.monto_total ??
              oldV.subtotal ??
              newV.total ??
              newV.monto_total ??
              auditableCompra?.total ??
              ((logSeleccionado.auditable as any)?.total as any) ??
              ((logSeleccionado.auditable as any)?.monto_total as any) ??
              0;
            const totalCompraNum = Number(rawTotalCompra) || 0;

            const productosCompraAfectados =
              (oldV.detalles as any[]) ||
              (newV.detalles as any[]) ||
              (auditableCompra?.detalles as any[]) ||
              ((logSeleccionado.auditable as any)?.detalles as any[]) ||
              [];

            // Campos modificados para comparativa Old vs New
            const candidates = new Set([...Object.keys(newV), ...Object.keys(oldV)]);
            const camposModificados = Array.from(candidates)
              .filter((k) => k !== "updated_at" && k !== "created_at")
              .filter((k) => JSON.stringify(oldV[k]) !== JSON.stringify(newV[k]))
              .filter((k) => {
                if (k in newV) return true;
                if (isAnulacion && /estado_activa|activo|motivo/i.test(k)) return true;
                return false;
              })
              .map((k) => {
                let etiqueta = getFieldLabel(k);
                if (k === "estado_activa") {
                  etiqueta = isCompraModulo
                    ? "Estado de la Compra"
                    : isVentaModulo
                    ? "Estado de la Venta"
                    : "Estado del Registro";
                }
                return {
                  campo: k,
                  etiqueta,
                  antiguo: oldV[k] ?? null,
                  nuevo: newV[k] ?? null,
                };
              });

            if (isAnulacion && !camposModificados.some((c) => /estado_activa|activo/i.test(c.campo))) {
              camposModificados.unshift({
                campo: "estado_activa",
                etiqueta: isCompraModulo
                  ? "Estado de la Compra"
                  : isVentaModulo
                  ? "Estado de la Venta"
                  : "Estado del Registro",
                antiguo: oldV.estado_activa ?? oldV.activo ?? 1,
                nuevo: newV.estado_activa ?? newV.activo ?? 0,
              });
            }

            // Campos limpios para la ficha de creación (filtrando llaves técnicas)
            const camposCreacion = Object.keys(newV)
              .filter((k) => !CAMPOS_TECNICOS_IGNORADOS.has(k))
              .map((k) => ({
                campo: k,
                etiqueta: getFieldLabel(k),
                valor: newV[k],
              }));

            return (
              <DetailDrawer
                isOpen={Boolean(logSeleccionado)}
                onClose={() => setLogSeleccionado(null)}
                title={
                  isAnulacion
                    ? `Auditoría: Anulación de ${moduloNombre}`
                    : isCreacion
                    ? `Auditoría: Creación de ${moduloNombre}`
                    : isEliminacion
                    ? `Auditoría: Eliminación de ${moduloNombre}`
                    : `Auditoría: Modificación de ${moduloNombre}`
                }
                subtitle={`${
                  isVentaModulo
                    ? `${numeroFacturaVenta} • `
                    : isCompraModulo
                    ? `${numeroDocCompra} • `
                    : `ID #${logSeleccionado.auditable_id} • `
                }Ejecutado por ${logSeleccionado.usuario?.name || "Sistema"}`}
              >
                <div className="p-5 space-y-6">
                  {/* ============================================================== */}
                  {/* METADATOS GENERALES DEL EVENTO                                 */}
                  {/* ============================================================== */}
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Acción Ejecutada
                      </span>
                      <div>{accionInfo.badge}</div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Fecha y Hora
                      </span>
                      <div className="font-semibold text-slate-800">
                        {formatFechaAuditoria(logSeleccionado.created_at).fecha}{" "}
                        <span className="text-[11px] font-mono text-slate-500">
                          {formatFechaAuditoria(logSeleccionado.created_at).hora}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Usuario Responsable
                      </span>
                      <div className="font-bold text-slate-900">
                        {logSeleccionado.usuario?.name || "Sistema"}
                      </div>
                      {logSeleccionado.usuario?.email && (
                        <span className="text-[10px] text-slate-400">
                          {logSeleccionado.usuario.email}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Dirección IP
                      </span>
                      <div className="font-mono text-slate-700">
                        {logSeleccionado.ip_address || "127.0.0.1"}
                      </div>
                    </div>
                  </div>

                  {/* ============================================================== */}
                  {/* CASO 1: ANULACIÓN (VENTAS, COMPRAS O REGISTROS CANCELADOS)     */}
                  {/* ============================================================== */}
                  {isAnulacion && (
                    <div className="space-y-4">
                      {/* Tarjeta de Advertencia y Datos Clave del Registro */}
                      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs space-y-3.5 shadow-2xs">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                            <RotateCcw className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-amber-900">
                              Registro de Anulación Confirmado
                            </p>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              {isCompraModulo
                                ? "Esta operación anuló la compra y dedujo las existencias ingresadas del inventario."
                                : isVentaModulo
                                ? "Esta operación anuló la venta y restituyó las existencias correspondientes al inventario."
                                : `Esta operación anuló o desactivó el registro de ${moduloNombre} en el sistema.`}
                            </p>
                          </div>
                        </div>

                        {/* Bloque descriptivo dinámico según el módulo */}
                        {isVentaModulo && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/70 text-xs">
                            {/* N° Factura / Ticket */}
                            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 shadow-2xs min-w-0 overflow-hidden">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70 block truncate">
                                N° Factura / Ticket
                              </span>
                              <span className="font-mono font-bold text-slate-900 mt-0.5 block truncate">
                                {numeroFacturaVenta}
                              </span>
                            </div>

                            {/* Cliente */}
                            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 shadow-2xs min-w-0 overflow-hidden">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70 block truncate">
                                Cliente
                              </span>
                              <span className="font-bold text-slate-900 mt-0.5 block truncate">
                                {nombreCliente}
                              </span>
                            </div>

                            {/* Total Anulado */}
                            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 shadow-2xs min-w-0 overflow-hidden">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70 block truncate">
                                Total Anulado
                              </span>
                              <span className="font-sans font-bold text-rose-700 mt-0.5 block truncate">
                                C$ {totalVentaNum.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        {isCompraModulo && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/70 text-xs">
                            {/* N° Compra / Referencia */}
                            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 shadow-2xs min-w-0 overflow-hidden">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70 block truncate">
                                N° Compra / Referencia
                              </span>
                              <span className="font-mono font-bold text-slate-900 mt-0.5 block truncate">
                                {numeroDocCompra}
                              </span>
                            </div>

                            {/* Proveedor */}
                            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 shadow-2xs min-w-0 overflow-hidden">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70 block truncate">
                                Proveedor
                              </span>
                              <span className="font-bold text-slate-900 mt-0.5 block truncate">
                                {nombreProveedor}
                              </span>
                            </div>

                            {/* Total Anulado */}
                            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 shadow-2xs min-w-0 overflow-hidden">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70 block truncate">
                                Total Anulado
                              </span>
                              <span className="font-sans font-bold text-rose-700 mt-0.5 block truncate">
                                C$ {totalCompraNum.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        {!isVentaModulo && !isCompraModulo && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/70 text-xs">
                            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 shadow-2xs min-w-0 overflow-hidden">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70 block truncate">
                                Registro Afectado
                              </span>
                              <span className="font-mono font-bold text-slate-900 mt-0.5 block truncate">
                                {moduloNombre} #{logSeleccionado.auditable_id}
                              </span>
                            </div>

                            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 shadow-2xs min-w-0 overflow-hidden">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70 block truncate">
                                Identificador
                              </span>
                              <span className="font-bold text-slate-900 mt-0.5 block truncate">
                                {String(oldV.nombre || oldV.name || oldV.descripcion || "—")}
                              </span>
                            </div>

                            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60 shadow-2xs min-w-0 overflow-hidden">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70 block truncate">
                                Estado Resultante
                              </span>
                              <span className="font-bold text-rose-700 mt-0.5 block truncate">
                                Anulado / Inactivo
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Motivo de Anulación si fue registrado */}
                        {Boolean(newV.motivo || oldV.motivo) && (
                          <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-200 text-amber-900 text-[11px]">
                            <span className="font-bold">Motivo: </span>
                            <span>{String(newV.motivo || oldV.motivo)}</span>
                          </div>
                        )}
                      </div>

                      {/* Lista de Existencias / Productos Restituidos (Ventas) */}
                      {isVentaModulo && productosRestituidos.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-brand" />
                            <span>Productos Restituidos al Inventario</span>
                          </h4>
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase">
                                  <th className="py-2 px-3">Producto</th>
                                  <th className="py-2 px-3 text-center">Cant. Restituida</th>
                                  <th className="py-2 px-3 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {productosRestituidos.map((prod: any, idx: number) => {
                                  const prodNombre =
                                    prod.producto?.nombre ||
                                    prod.producto_nombre ||
                                    prod.producto ||
                                    `Producto #${prod.producto_id || idx + 1}`;
                                  const cant = Math.abs(Math.round(Number(prod.cantidad || 0)));
                                  const sub = Number(prod.subtotal || prod.total || 0);

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="py-2 px-3 font-semibold text-slate-800">
                                        {prodNombre}
                                      </td>
                                      <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">
                                        +{cant}
                                      </td>
                                      <td className="py-2 px-3 text-right font-sans font-bold text-slate-900">
                                        C$ {sub.toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Lista de Existencias / Productos Deducidos (Compras) */}
                      {isCompraModulo && productosCompraAfectados.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-brand" />
                            <span>Productos Deducidos del Inventario</span>
                          </h4>
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase">
                                  <th className="py-2 px-3">Producto</th>
                                  <th className="py-2 px-3 text-center">Cant. Deducida</th>
                                  <th className="py-2 px-3 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {productosCompraAfectados.map((prod: any, idx: number) => {
                                  const prodNombre =
                                    prod.producto?.nombre ||
                                    prod.producto_nombre ||
                                    prod.producto ||
                                    `Producto #${prod.producto_id || idx + 1}`;
                                  const cant = Math.abs(Math.round(Number(prod.cantidad || 0)));
                                  const sub = Number(prod.subtotal || prod.total || (Number(prod.precio_unitario || 0) * cant));

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="py-2 px-3 font-semibold text-slate-800">
                                        {prodNombre}
                                      </td>
                                      <td className="py-2 px-3 text-center font-mono font-bold text-rose-700">
                                        -{cant}
                                      </td>
                                      <td className="py-2 px-3 text-right font-sans font-bold text-slate-900">
                                        C$ {sub.toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* CASO 2: CREACIÓN (FICHA LIMPIA DE RESUMEN SIN OLD VS NEW)       */}
                  {/* ============================================================== */}
                  {isCreacion && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Datos del Registro Creado</span>
                        </h3>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Nuevo Registro
                        </span>
                      </div>

                      {camposCreacion.length === 0 ? (
                        <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                          <p className="font-semibold">Registro creado sin atributos individuales adicionales.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {camposCreacion.map(({ campo, etiqueta, valor }) => (
                            <div
                              key={campo}
                              className={`p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-w-0 overflow-hidden ${
                                /imagen|logo|foto|image/i.test(campo) ? "sm:col-span-2" : ""
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 truncate">
                                {etiqueta}
                              </span>
                              <div className="min-w-0 max-w-full overflow-hidden">
                                {renderValorAmigable(valor, campo)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* CASO 3: CAMPOS MODIFICADOS (PARA ANULACIONES Y MODIFICACIONES)  */}
                  {/* ============================================================== */}
                  {(isAnulacion || isModificacion) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <SlidersHorizontal className="w-4 h-4 text-brand" />
                          <span>Campos Modificados</span>
                        </h3>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {camposModificados.length} cambio(s)
                        </span>
                      </div>

                      {camposModificados.length === 0 ? (
                        <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-1">
                          <p className="font-semibold text-slate-700">
                            No se detectaron cambios en campos de datos.
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Operación registrada sobre {moduloNombre} #{logSeleccionado.auditable_id}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {camposModificados.map(({ campo, etiqueta, antiguo, nuevo }) => (
                            <div
                              key={campo}
                              className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs"
                            >
                              {/* Encabezado del Campo Modificado */}
                              <div className="bg-slate-50 px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-800">
                                  {etiqueta}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {campo}
                                </span>
                              </div>

                              {/* Comparativa 2 Columnas: Anterior vs Nuevo */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-xs">
                                {/* Valor Anterior */}
                                <div className="p-3 bg-rose-50/20 min-w-0 overflow-hidden">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1 truncate">
                                    Valor Anterior
                                  </span>
                                  <div className="p-2 rounded-lg bg-rose-50/60 border border-rose-100 min-h-[36px] flex items-center min-w-0 max-w-full overflow-hidden">
                                    {renderValorAmigable(antiguo, campo)}
                                  </div>
                                </div>

                                {/* Valor Nuevo */}
                                <div className="p-3 bg-emerald-50/20 min-w-0 overflow-hidden">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1 truncate">
                                    Valor Nuevo
                                  </span>
                                  <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 min-h-[36px] flex items-center min-w-0 max-w-full overflow-hidden">
                                    {renderValorAmigable(nuevo, campo)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* CASO 4: ELIMINACIÓN                                            */}
                  {/* ============================================================== */}
                  {isEliminacion && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-rose-800">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Registro Eliminado</span>
                      </div>
                      <p className="text-[11px] text-rose-700">
                        El elemento {moduloNombre} #{logSeleccionado.auditable_id} fue dado de baja o removido del sistema.
                      </p>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* DETALLE RAW JSON COLAPSABLE                                     */}
                  {/* ============================================================== */}
                  <details className="mt-4 pt-3 border-t border-slate-100 group">
                    <summary className="text-[11px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-800 select-none py-1 flex items-center justify-between">
                      <span>+ Ver estructura JSON completa</span>
                      <span className="text-[10px] font-normal text-slate-400 group-open:hidden">
                        (Valores crudos de auditoría)
                      </span>
                    </summary>
                    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">
                          old_values (raw)
                        </span>
                        <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                          {JSON.stringify(oldV, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">
                          new_values (raw)
                        </span>
                        <pre className="p-2.5 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                          {JSON.stringify(newV, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              </DetailDrawer>
            );
          })()}
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
