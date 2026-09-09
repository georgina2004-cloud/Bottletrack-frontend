"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import {
  obtenerProveedores,
  obtenerProductos,
  crearCompra,
  ValidationError,
} from "@/lib/api";
import { useMoneda, formatPresentacionMl } from "@/lib/currency";
import { Proveedor } from "@/types/proveedor";
import { Producto } from "@/types/producto";
import { LineaCompraForm, CrearCompraPayload } from "@/types/compra";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Building2,
  FileText,
  Save,
  Loader2,
  X,
  Search,
  Package,
} from "lucide-react";

/**
 * Componente buscador de producto por línea para orden de compra.
 * Renderiza UN SOLO input por fila con dropdown de sugerencias anclado directamente
 * debajo mediante position: absolute relativo al contenedor del input,
 * con estado aislado por fila y soporte para cerrar al hacer clic afuera (click outside).
 */
interface BuscadorProductoLineaProps {
  productoId: number | "";
  productoNombre: string;
  productos: Producto[];
  onSeleccionar: (producto: Producto) => void;
  onLimpiar?: () => void;
  error?: string;
}

function BuscadorProductoLinea({
  productoId,
  productoNombre,
  productos,
  onSeleccionar,
  onLimpiar,
  error,
}: BuscadorProductoLineaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(productoNombre || "");
  const [prevNombre, setPrevNombre] = useState(productoNombre);

  // Sincronizar query durante renderizado si cambia la prop productoNombre
  if (prevNombre !== productoNombre) {
    setPrevNombre(productoNombre);
    setQuery(productoNombre || "");
  }

  // Cerrar el dropdown al hacer clic fuera del componente (click outside)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Si hay un producto ya seleccionado, restaurar su nombre exacto en el input
        if (productoId && productoNombre) {
          setQuery(productoNombre);
        } else if (!productoId) {
          setQuery("");
        }
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, productoId, productoNombre]);

  // Filtrar productos disponibles según lo que el usuario escriba
  const productosFiltrados = useMemo(() => {
    if (!query.trim() || query === productoNombre) {
      return productos;
    }
    const q = query.toLowerCase().trim();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.marca && p.marca.toLowerCase().includes(q)) ||
        (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes(q)) ||
        (p.codigo_barras && p.codigo_barras.includes(q))
    );
  }, [productos, query, productoNombre]);

  const handleSelect = (prod: Producto) => {
    onSeleccionar(prod);
    setQuery(prod.nombre);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLimpiar) {
      onLimpiar();
    }
    setQuery("");
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Único input de búsqueda */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Escribe o selecciona producto..."
          className={`
            w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border rounded-lg transition-all text-slate-900
            focus:outline-none focus:border-[#D17B00] focus:ring-2 focus:ring-[#D17B00]/15
            ${
              error
                ? "border-rose-300 ring-1 ring-rose-500/20 bg-rose-50/20"
                : "border-slate-300 hover:border-slate-400"
            }
          `}
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            title="Limpiar selección"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {error && (
        <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>
      )}

      {/* Dropdown de resultados anclado exactamente debajo del input único */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          {productosFiltrados.length === 0 ? (
            <div className="py-4 px-3 text-center text-slate-400 text-xs">
              No se encontraron productos coincidentes.
            </div>
          ) : (
            productosFiltrados.map((prod) => (
              <div
                key={prod.id}
                onMouseDown={(e) => {
                  e.preventDefault(); // Evita perder el foco antes del clic
                  handleSelect(prod);
                }}
                className={`
                  py-2 px-2.5 hover:bg-[#D17B00]/10 hover:text-[#D17B00] rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs
                  ${
                    productoId === prod.id
                      ? "bg-amber-50 font-semibold text-[#D17B00]"
                      : "text-slate-800"
                  }
                `}
              >
                <div className="truncate pr-2">
                  <span className="font-semibold block truncate">{prod.nombre}</span>
                  <span className="text-[10px] text-slate-400">
                    {prod.categoria?.nombre || "Sin categoría"}
                    {prod.presentacion_ml ? ` • ${formatPresentacionMl(prod.presentacion_ml)}` : ""}
                    {` • Stock actual: ${prod.stock_actual}`}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                  ID #{prod.id}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function NuevaCompraPage() {
  const { token } = useAuth();

  // Proveedores y Productos disponibles
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState<boolean>(true);

  // Campos principales de la factura de compra
  const [proveedorId, setProveedorId] = useState<number | "">("");
  const [numeroFacturaProveedor, setNumeroFacturaProveedor] = useState<string>("");

  // Líneas dinámicas de productos
  const [lineas, setLineas] = useState<LineaCompraForm[]>([
    {
      id: "linea-1",
      producto_id: "",
      producto_nombre: "",
      cantidad: 1,
      precio_unitario: "",
      subtotal: 0,
    },
  ]);

  // Estados de envío y validación
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Modal de éxito
  const [compraExitosa, setCompraExitosa] = useState<{
    id: number;
    numeroFactura: string | null;
    proveedor: string;
    total: number | string;
    itemsCount: number;
  } | null>(null);

  // Carga inicial de proveedores y productos
  useEffect(() => {
    let isMounted = true;

    async function cargarCatalogos() {
      try {
        setIsLoadingCatalogos(true);
        const [resProveedores, resProductos] = await Promise.all([
          obtenerProveedores({ page: 1 }, token),
          obtenerProductos({ page: 1 }, token),
        ]);

        if (isMounted) {
          // Filtrar únicamente los proveedores activos
          const provActivos = (resProveedores.data || []).filter(
            (p) => p.activo !== false
          );
          setProveedores(provActivos);

          // Filtrar únicamente productos activos
          const prodActivos = (resProductos.data || []).filter(
            (p) => p.activo !== false
          );
          setProductosDisponibles(prodActivos);
        }
      } catch (err) {
        console.error("Error al cargar catálogos para compra:", err);
      } finally {
        if (isMounted) {
          setIsLoadingCatalogos(false);
        }
      }
    }

    cargarCatalogos();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // =========================================================================
  // GESTIÓN DE LÍNEAS DE PRODUCTOS
  // =========================================================================
  const handleAgregarLinea = () => {
    const nuevaId = `linea-${Date.now()}`;
    setLineas((prev) => [
      ...prev,
      {
        id: nuevaId,
        producto_id: "",
        producto_nombre: "",
        cantidad: 1,
        precio_unitario: "",
        subtotal: 0,
      },
    ]);
  };

  const handleEliminarLinea = (id: string) => {
    setLineas((prev) => {
      if (prev.length <= 1) {
        // Mantener al menos una fila vacía
        return [
          {
            id: `linea-${Date.now()}`,
            producto_id: "",
            producto_nombre: "",
            cantidad: 1,
            precio_unitario: "",
            subtotal: 0,
          },
        ];
      }
      return prev.filter((l) => l.id !== id);
    });
    setFieldErrors({});
  };

  const handleSeleccionarProducto = (lineaId: string, producto: Producto) => {
    setLineas((prev) =>
      prev.map((linea) => {
        if (linea.id !== lineaId) return linea;

        // IMPORTANTE: NO se autocompleta con precio_compra del producto
        // ya que el usuario debe ingresar manualmente el costo pagado en esta factura.
        const cant = typeof linea.cantidad === "number" ? linea.cantidad : 0;
        const precio =
          typeof linea.precio_unitario === "number" ? linea.precio_unitario : 0;

        return {
          ...linea,
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          subtotal: cant * precio,
        };
      })
    );
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[`${lineaId}-producto`];
      return copy;
    });
  };

  const handleLimpiarProducto = (lineaId: string) => {
    setLineas((prev) =>
      prev.map((linea) => {
        if (linea.id !== lineaId) return linea;
        const cant = typeof linea.cantidad === "number" ? linea.cantidad : 0;
        const precio =
          typeof linea.precio_unitario === "number" ? linea.precio_unitario : 0;
        return {
          ...linea,
          producto_id: "",
          producto_nombre: "",
          subtotal: cant * precio,
        };
      })
    );
  };

  const handleCambiarCantidad = (lineaId: string, valorStr: string) => {
    const valNum = valorStr === "" ? "" : parseFloat(valorStr);

    setLineas((prev) =>
      prev.map((linea) => {
        if (linea.id !== lineaId) return linea;

        const cant = typeof valNum === "number" ? valNum : 0;
        const precio =
          typeof linea.precio_unitario === "number" ? linea.precio_unitario : 0;

        return {
          ...linea,
          cantidad: valNum,
          subtotal: cant * precio,
        };
      })
    );
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[`${lineaId}-cantidad`];
      return copy;
    });
  };

  const handleCambiarPrecioUnitario = (lineaId: string, valorStr: string) => {
    const valNum = valorStr === "" ? "" : parseFloat(valorStr);

    setLineas((prev) =>
      prev.map((linea) => {
        if (linea.id !== lineaId) return linea;

        const precio = typeof valNum === "number" ? valNum : 0;
        const cant = typeof linea.cantidad === "number" ? linea.cantidad : 0;

        return {
          ...linea,
          precio_unitario: valNum,
          subtotal: cant * precio,
        };
      })
    );
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[`${lineaId}-precio`];
      return copy;
    });
  };

  // =========================================================================
  // CÁLCULO TOTAL
  // =========================================================================
  const totalGeneral = useMemo(() => {
    return lineas.reduce((acc, l) => acc + l.subtotal, 0);
  }, [lineas]);

  const { formatMoneda: formatMoney } = useMoneda();

  // =========================================================================
  // VALIDACIÓN Y ENVÍO
  // =========================================================================
  const validarFormulario = (): boolean => {
    const errors: Record<string, string> = {};

    if (!proveedorId) {
      errors.proveedor_id = "Debes seleccionar un proveedor para la orden de compra.";
    }

    if (lineas.length === 0) {
      errors.lineas = "Debes ingresar al menos una línea de producto.";
    }

    let lineasValidas = 0;

    lineas.forEach((l, idx) => {
      const numFila = idx + 1;
      if (!l.producto_id) {
        errors[`${l.id}-producto`] = `Fila #${numFila}: Debes seleccionar un producto.`;
      }
      if (typeof l.cantidad !== "number" || l.cantidad <= 0 || isNaN(l.cantidad)) {
        errors[`${l.id}-cantidad`] = `Fila #${numFila}: La cantidad debe ser mayor a 0.`;
      }
      if (
        typeof l.precio_unitario !== "number" ||
        l.precio_unitario <= 0 ||
        isNaN(l.precio_unitario)
      ) {
        errors[`${l.id}-precio`] = `Fila #${numFila}: El costo unitario debe ser mayor a 0.`;
      }

      if (
        l.producto_id &&
        typeof l.cantidad === "number" &&
        l.cantidad > 0 &&
        typeof l.precio_unitario === "number" &&
        l.precio_unitario > 0
      ) {
        lineasValidas++;
      }
    });

    if (lineasValidas === 0 && !errors.lineas) {
      errors.lineas = "Ingresa al menos un producto con cantidad y costo válidos.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validarFormulario()) {
      setGeneralError("Por favor corrige los campos señalados antes de registrar.");
      return;
    }

    setIsSubmitting(true);

    const payload: CrearCompraPayload = {
      proveedor_id: Number(proveedorId),
      numero_factura_proveedor: numeroFacturaProveedor.trim()
        ? numeroFacturaProveedor.trim()
        : undefined,
      productos: lineas.map((l) => ({
        producto_id: Number(l.producto_id),
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
      })),
    };

    try {
      const res = await crearCompra(payload, token);

      const provSeleccionado = proveedores.find((p) => p.id === Number(proveedorId));

      setCompraExitosa({
        id: res.compra.id,
        numeroFactura: res.compra.numero_factura_proveedor,
        proveedor:
          res.compra.proveedor?.razon_social ||
          provSeleccionado?.razon_social ||
          "Proveedor",
        total: res.compra.total,
        itemsCount: payload.productos.length,
      });
    } catch (err: unknown) {
      console.error("Error al registrar compra:", err);
      if (err instanceof ValidationError) {
        const fieldMap: Record<string, string> = {};
        Object.entries(err.errors).forEach(([k, v]) => {
          fieldMap[k] = v.join(" ");
        });
        setFieldErrors(fieldMap);
        setGeneralError(err.message || "Errores de validación devueltos por el servidor.");
      } else {
        setGeneralError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error inesperado al registrar la compra."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNuevaCompra = () => {
    setCompraExitosa(null);
    setProveedorId("");
    setNumeroFacturaProveedor("");
    setLineas([
      {
        id: `linea-${Date.now()}`,
        producto_id: "",
        producto_nombre: "",
        cantidad: 1,
        precio_unitario: "",
        subtotal: 0,
      },
    ]);
    setFieldErrors({});
    setGeneralError(null);
  };

  return (
    <ProtectedByRole modulo="compras" requiereEscritura={true}>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* ========================================================================= */}
          {/* BREADCRUMB Y ENCABEZADO                                                   */}
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
              <Link
                href="/compras"
                className="hover:text-slate-900 transition-colors"
              >
                Compras
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-brand">Nueva Compra</span>
            </nav>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/compras"
                  className="p-2 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:text-brand hover:border-brand/40 transition-all shadow-2xs"
                  title="Volver a compras"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                    Registrar Factura de Compra
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ingreso de mercadería al inventario mediante factura de proveedor.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BANNER DE ERROR GENERAL                                                   */}
          {/* ========================================================================= */}
          {generalError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-800">Atención</h4>
                  <p className="text-rose-700 mt-0.5">{generalError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGeneralError(null)}
                className="text-rose-600 hover:text-rose-800 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMULARIO DE COMPRA TIPO FACTURA                                         */}
          {/* ========================================================================= */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tarjeta de Datos del Proveedor y Factura */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-[#D17B00]" />
                <h2 className="text-sm font-bold text-slate-900">
                  Datos del Proveedor y Facturación
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select de Proveedor */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Proveedor <span className="text-[#D17B00]">*</span>
                  </label>
                  {isLoadingCatalogos ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-400 bg-slate-50">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D17B00]" />
                      <span>Cargando directorio de proveedores...</span>
                    </div>
                  ) : (
                    <select
                      value={proveedorId}
                      onChange={(e) => {
                        setProveedorId(e.target.value === "" ? "" : Number(e.target.value));
                        setFieldErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.proveedor_id;
                          return copy;
                        });
                      }}
                      className={`
                        w-full rounded-lg border bg-white px-3 py-2 text-xs sm:text-sm text-[#18181B]
                        focus:outline-none focus:border-[#D17B00] focus:ring-2 focus:ring-[#D17B00]/15 transition-all
                        ${
                          fieldErrors.proveedor_id
                            ? "border-rose-300 ring-2 ring-rose-500/10"
                            : "border-slate-300 hover:border-slate-400"
                        }
                      `}
                    >
                      <option value="">-- Selecciona una casa proveedora --</option>
                      {proveedores.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.razon_social} {prov.ruc ? `(RUC: ${prov.ruc})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.proveedor_id && (
                    <p className="text-xs text-rose-600 font-medium">
                      {fieldErrors.proveedor_id}
                    </p>
                  )}
                </div>

                {/* Número de Factura del Proveedor (Opcional) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>N° Factura del Proveedor</span>
                    <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="ej. FAC-2026-9812"
                      value={numeroFacturaProveedor}
                      onChange={(e) => setNumeroFacturaProveedor(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#D17B00] focus:ring-2 focus:ring-[#D17B00]/15 text-slate-900 placeholder:text-slate-400 uppercase font-mono"
                    />
                  </div>
                  {fieldErrors.numero_factura_proveedor && (
                    <p className="text-xs text-rose-600 font-medium">
                      {fieldErrors.numero_factura_proveedor}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tarjeta de Líneas de Productos */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#D17B00]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Productos de la Factura
                  </h2>
                  <span className="text-xs text-slate-400">
                    ({lineas.length} {lineas.length === 1 ? "línea" : "líneas"})
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarLinea}
                  className="text-xs gap-1.5 self-start sm:self-auto font-semibold text-[#D17B00] border-[#D17B00]/30 hover:bg-[#D17B00]/5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Línea</span>
                </Button>
              </div>

              {fieldErrors.lineas && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  {fieldErrors.lineas}
                </div>
              )}

              {/* Tabla de Líneas Dinámicas */}
              <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0 min-h-[340px]">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3 w-[45%]">Producto</th>
                      <th className="py-2.5 px-3 w-[15%] text-center">Cantidad</th>
                      <th className="py-2.5 px-3 w-[20%] text-right">Costo Unitario ($)</th>
                      <th className="py-2.5 px-3 w-[15%] text-right">Subtotal</th>
                      <th className="py-2.5 px-2 w-[5%] text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineas.map((linea) => {
                      const errorProd = fieldErrors[`${linea.id}-producto`];
                      const errorCant = fieldErrors[`${linea.id}-cantidad`];
                      const errorPrecio = fieldErrors[`${linea.id}-precio`];

                      return (
                        <tr key={linea.id} className="hover:bg-slate-50/50">
                          {/* Selector de Producto con Input Único y Dropdown Anclado */}
                          <td className="py-3 px-3 align-top">
                            <BuscadorProductoLinea
                              productoId={linea.producto_id}
                              productoNombre={linea.producto_nombre}
                              productos={productosDisponibles}
                              onSeleccionar={(prod) =>
                                handleSeleccionarProducto(linea.id, prod)
                              }
                              onLimpiar={() => handleLimpiarProducto(linea.id)}
                              error={errorProd}
                            />
                          </td>

                          {/* Cantidad */}
                          <td className="py-3 px-3 align-top">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={linea.cantidad}
                              onChange={(e) =>
                                handleCambiarCantidad(linea.id, e.target.value)
                              }
                              placeholder="1"
                              className={`
                                w-full text-center py-2 px-2 text-xs sm:text-sm font-semibold rounded-lg border bg-white
                                focus:outline-none focus:border-[#D17B00] focus:ring-2 focus:ring-[#D17B00]/15
                                ${
                                  errorCant
                                    ? "border-rose-300 ring-1 ring-rose-500/20"
                                    : "border-slate-300"
                                }
                              `}
                            />
                            {errorCant && (
                              <p className="text-[10px] text-rose-600 mt-1 text-center">
                                {errorCant}
                              </p>
                            )}
                          </td>

                          {/* Costo Unitario Pagado (Manual, NO autocompletado) */}
                          <td className="py-3 px-3 align-top">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                                $
                              </span>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={linea.precio_unitario}
                                onChange={(e) =>
                                  handleCambiarPrecioUnitario(linea.id, e.target.value)
                                }
                                placeholder="0.00"
                                className={`
                                  w-full pl-6 pr-2 py-2 text-xs sm:text-sm font-semibold text-right rounded-lg border bg-white font-sans
                                  focus:outline-none focus:border-[#D17B00] focus:ring-2 focus:ring-[#D17B00]/15
                                  ${
                                    errorPrecio
                                      ? "border-rose-300 ring-1 ring-rose-500/20"
                                      : "border-slate-300"
                                  }
                                `}
                              />
                            </div>
                            {errorPrecio && (
                              <p className="text-[10px] text-rose-600 mt-1 text-right">
                                {errorPrecio}
                              </p>
                            )}
                          </td>

                          {/* Subtotal Calculado en Vivo */}
                          <td className="py-3 px-3 text-right font-bold text-slate-900 font-sans align-top pt-4">
                            {formatMoney(linea.subtotal)}
                          </td>

                          {/* Botón Eliminar Fila */}
                          <td className="py-3 px-2 text-center align-top pt-3">
                            <button
                              type="button"
                              onClick={() => handleEliminarLinea(linea.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar línea"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botón Inferior para Añadir más Líneas */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarLinea}
                  className="text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar otra línea</span>
                </Button>
              </div>

              {/* Resumen y Total General de la Factura */}
              <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <p>
                    • Los costos unitarios son registrados manualmente y actualizan los lotes
                    de inventario.
                  </p>
                  <p>
                    • Las cantidades ingresadas se sumarán directamente al stock disponible del
                    producto.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 min-w-[260px] space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Líneas facturadas:</span>
                    <span className="font-semibold text-slate-800">{lineas.length}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Unidades totales:</span>
                    <span className="font-semibold text-slate-800">
                      {lineas.reduce(
                        (acc, l) => acc + (typeof l.cantidad === "number" ? l.cantidad : 0),
                        0
                      )}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-slate-900">Total General:</span>
                    <span className="text-xl font-extrabold text-[#D17B00] font-sans">
                      {formatMoney(totalGeneral)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de Acciones Finales */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/compras">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isSubmitting}
                  className="text-xs font-semibold"
                >
                  Cancelar
                </Button>
              </Link>

              <Button
                type="submit"
                size="md"
                disabled={isSubmitting}
                className="text-xs font-semibold gap-1.5 shadow-sm shadow-[#D17B00]/20 min-w-[170px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registrando Compra...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Registrar Compra</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* ========================================================================= */}
          {/* MODAL DE CONFIRMACIÓN EXITOSA                                             */}
          {/* ========================================================================= */}
          {compraExitosa && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-emerald-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 font-sans">
                      ¡Compra Registrada con Éxito!
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      El inventario ha sido actualizado con los productos recibidos.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Orden de compra:</span>
                      <span className="font-mono font-bold text-slate-900">
                        #{compraExitosa.id}
                      </span>
                    </div>
                    {compraExitosa.numeroFactura && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">N° Factura Proveedor:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {compraExitosa.numeroFactura}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Proveedor:</span>
                      <span className="font-semibold text-slate-800">
                        {compraExitosa.proveedor}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Productos ingresados:</span>
                      <span className="font-semibold text-slate-800">
                        {compraExitosa.itemsCount} productos distintos
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                      <span>Total Factura:</span>
                      <span className="text-[#D17B00] font-sans">
                        {formatMoney(compraExitosa.total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <Button
                      type="button"
                      size="md"
                      onClick={handleNuevaCompra}
                      className="w-full text-xs font-semibold gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar Otra Compra</span>
                    </Button>

                    <Link href="/compras" className="w-full">
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        className="w-full text-xs font-semibold"
                      >
                        Ir al Listado de Compras
                      </Button>
                    </Link>
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
