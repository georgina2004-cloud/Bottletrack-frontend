"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useDebounce } from "@/hooks/useDebounce";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import {
  obtenerProductos,
  obtenerCategorias,
  crearVenta,
  abrirFacturaPDF,
  obtenerPresentaciones,
  ValidationError,
} from "@/lib/api";
import { useCompanyConfig } from "@/context/CompanyConfigContext";
import { useMoneda, formatPresentacionMl } from "@/lib/currency";
import { obtenerCategoriasSugeridasPara } from "@/lib/sugerenciasCombo";
import { Producto, Categoria, ProductosPaginadosResponse } from "@/types/producto";
import { Presentacion } from "@/types/presentacion";
import { CarritoItem, CrearVentaPayload } from "@/types/venta";
import { ProductoImagenCard } from "@/components/ui/ProductoImagenCard";
import { Button } from "@/components/ui/Button";
import { diasParaVencer, textoVencimiento, formatDateLegible } from "@/lib/formatDate";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Receipt,
  RotateCcw,
  ArrowLeft,
  Boxes,
  User,
  Tag,
  Loader2,
  X,
  Printer,
  Layers,
  Wine,
  Banknote,
  Coins,
  Check,
  Clock,
} from "lucide-react";

interface ProductoConSugerencia {
  producto: Producto;
  motivo: string;
}

const EMPTY_CATEGORIAS: Categoria[] = [];

/**
 * Obtiene el estado y detalle de vencimiento de un producto para el POS.
 */
export function getVencimientoInfo(prod: Producto) {
  // 1. Usar flag/estado del backend si está presente
  if (prod.vencimiento_estado === "vencido") {
    return {
      estado: "vencido" as const,
      dias: prod.dias_para_vencer ?? -1,
      texto: "Vencido",
      fechaStr: prod.fecha_vencimiento,
    };
  }

  if (prod.vencimiento_estado === "por_vencer") {
    return {
      estado: "por_vencer" as const,
      dias: prod.dias_para_vencer ?? 30,
      texto: textoVencimiento(prod.fecha_vencimiento) || "Por vencer",
      fechaStr: prod.fecha_vencimiento,
    };
  }

  // 2. Cálculo dinámico en el cliente en base a la fecha de vencimiento
  if (prod.fecha_vencimiento) {
    const dias = diasParaVencer(prod.fecha_vencimiento);
    if (dias !== null) {
      if (dias <= 0) {
        return {
          estado: "vencido" as const,
          dias,
          texto: textoVencimiento(prod.fecha_vencimiento) || "Vencido",
          fechaStr: prod.fecha_vencimiento,
        };
      }
      if (dias <= 30) {
        return {
          estado: "por_vencer" as const,
          dias,
          texto: textoVencimiento(prod.fecha_vencimiento) || `Vence en ${dias} días`,
          fechaStr: prod.fecha_vencimiento,
        };
      }
    }
  }

  return null;
}

export default function NuevaVentaPOSPage() {
  const { token } = useAuth();
  const { formatMoneda } = useMoneda();

  // =========================================================================
  // ESTADOS DEL BUSCADOR DE PRODUCTOS (COLUMNA IZQUIERDA CON SWR + DEBOUNCE)
  // =========================================================================
  const [busqueda, setBusqueda] = useState<string>("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("");
  const debouncedBusqueda = useDebounce(busqueda, 300);

  // SWR para catálogo de categorías (con caché de 1 hora)
  const { data: categoriasData } = useSWR<Categoria[] | { data: Categoria[] }>(
    token ? "/categorias?per_page=100" : null,
    { dedupingInterval: 3600000 }
  );
  const todasCategorias: Categoria[] = useMemo(() => {
    if (!categoriasData) return EMPTY_CATEGORIAS;
    if (Array.isArray(categoriasData)) return categoriasData;
    return (categoriasData as { data?: Categoria[] }).data || EMPTY_CATEGORIAS;
  }, [categoriasData]);

  // SWR para catálogo de productos (Punto de Venta)
  const productosEndpoint = token
    ? `/productos?busqueda=${encodeURIComponent(debouncedBusqueda.trim())}&categoria_id=${categoriaSeleccionada || ""}&per_page=100`
    : null;

  const {
    data: productosResponse,
    error: swrErrorProductos,
    isLoading: isLoadingProductos,
    isValidating: isValidatingProductos,
    mutate: mutateProductos,
  } = useSWR<ProductosPaginadosResponse | Producto[]>(productosEndpoint, {
    keepPreviousData: true,
    dedupingInterval: 15000,
  });

  const productos: Producto[] = useMemo(() => {
    const list = Array.isArray(productosResponse)
      ? productosResponse
      : productosResponse?.data || [];
    return list.filter((p) => p.activo !== false);
  }, [productosResponse]);

  const errorCargaProductos = swrErrorProductos
    ? swrErrorProductos instanceof Error
      ? swrErrorProductos.message
      : "No fue posible cargar el catálogo de productos."
    : null;

  // Sección de Sugerencias Dinámicas de Venta Cruzada
  const [sugerencias, setSugerencias] = useState<ProductoConSugerencia[]>([]);
  const [isLoadingSugerencias, setIsLoadingSugerencias] = useState<boolean>(false);

  // Modal / Selector de Presentación
  const [selectorProducto, setSelectorProducto] = useState<{
    producto: Producto;
    presentaciones: Presentacion[];
  } | null>(null);
  const [isLoadingPresId, setIsLoadingPresId] = useState<number | null>(null);

  // =========================================================================
  // ESTADOS DEL CARRITO Y CLIENTE (COLUMNA DERECHA)
  // =========================================================================
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [clienteNombre, setClienteNombre] = useState<string>("");
  const [descuentoInput, setDescuentoInput] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorCobro, setErrorCobro] = useState<string | null>(null);
  const [ventaExitosa, setVentaExitosa] = useState<{
    id: number;
    numeroFactura: string;
    total: number | string;
    cliente: string;
  } | null>(null);
  const [isImprimiendoPdf, setIsImprimiendoPdf] = useState<boolean>(false);
  const [errorImpresionPdf, setErrorImpresionPdf] = useState<string | null>(null);

  // Estados de Modal de Cobro (Efectivo)
  const { moneda } = useCompanyConfig();
  const [showModalCobro, setShowModalCobro] = useState<boolean>(false);
  const metodoPago = "efectivo" as const;
  const [montoRecibido, setMontoRecibido] = useState<string>("");

  // Clave serializada para ejecutar sugerencias solo cuando cambian los productos en el carrito
  const carritoSignature = useMemo(() => {
    return carrito
      .map(
        (item) =>
          `${item.producto.id}_${item.presentacion_id || ""}_${
            item.producto.categoria_id || item.producto.categoria?.id || ""
          }`
      )
      .join(",");
  }, [carrito]);

  // 2. Cálculo en tiempo real de sugerencias cruzadas según el contenido del carrito
  useEffect(() => {
    let isMounted = true;

    async function calcularSugerencias() {
      // Si el carrito está vacío o no hay categorías cargadas, no hay sugerencias
      if (!token || carrito.length === 0 || todasCategorias.length === 0) {
        if (isMounted) {
          setSugerencias((prev) => (prev.length === 0 ? prev : []));
          setIsLoadingSugerencias((prev) => (prev ? false : prev));
        }
        return;
      }

      setIsLoadingSugerencias(true);

      try {
        // IDs y pares [categoría, nombre_producto] actualmente en el carrito
        const idsEnCarrito = new Set<number>();
        const categoriasEnCarrito: { nombre: string; productoNombre: string }[] = [];

        carrito.forEach((item) => {
          idsEnCarrito.add(item.producto.id);
          let catNombre = "";
          if (
            item.producto.categoria &&
            typeof item.producto.categoria === "object"
          ) {
            catNombre = item.producto.categoria.nombre || "";
          }
          if (!catNombre && item.producto.categoria_id) {
            const found = todasCategorias.find(
              (c) => c.id === item.producto.categoria_id
            );
            catNombre = found?.nombre || "";
          }

          if (catNombre) {
            categoriasEnCarrito.push({
              nombre: catNombre,
              productoNombre: item.producto.nombre,
            });
          }
        });

        // Determinar qué categorías objetivo sugerir y cuál es el producto disparador
        const categoriasObjetivoMap = new Map<string, string>(); // NombreCatObjetivo -> NombreProductoOrigen
        categoriasEnCarrito.forEach(({ nombre, productoNombre }) => {
          const sugeridas = obtenerCategoriasSugeridasPara(nombre);
          sugeridas.forEach((catSug) => {
            if (!categoriasObjetivoMap.has(catSug)) {
              categoriasObjetivoMap.set(catSug, productoNombre);
            }
          });
        });

        if (categoriasObjetivoMap.size === 0) {
          if (isMounted) {
            setSugerencias((prev) => (prev.length === 0 ? prev : []));
          }
          return;
        }

        // Consultar productos de cada categoría sugerida
        const promesas: Promise<{
          catNombre: string;
          productoNombre: string;
          productos: Producto[];
        }>[] = [];

        categoriasObjetivoMap.forEach((productoNombre, catNombre) => {
          const catMatch = todasCategorias.find((c) => {
            const norm = c.nombre.toLowerCase();
            const target = catNombre.toLowerCase();
            return (
              norm === target ||
              norm.includes(target) ||
              target.includes(norm)
            );
          });

          if (catMatch) {
            promesas.push(
              obtenerProductos({ categoria_id: catMatch.id, page: 1 }, token).then(
                (res) => ({
                  catNombre,
                  productoNombre,
                  productos: res.data || [],
                })
              )
            );
          }
        });

        const resultados = await Promise.all(promesas);
        if (!isMounted) return;

        // Filtrar productos activos con stock que NO estén en el carrito
        const candidatas: ProductoConSugerencia[] = [];
        const idsRegistrados = new Set<number>();

        resultados.forEach(({ productoNombre, productos: prods }) => {
          prods.forEach((p) => {
            if (
              p.activo !== false &&
              p.stock_actual > 0 &&
              !idsEnCarrito.has(p.id) &&
              !idsRegistrados.has(p.id)
            ) {
              idsRegistrados.add(p.id);
              candidatas.push({
                producto: p,
                motivo: `Combina con ${productoNombre}`,
              });
            }
          });
        });

        // Priorizar por mayor stock disponible y limitar a 4 sugerencias
        candidatas.sort((a, b) => b.producto.stock_actual - a.producto.stock_actual);
        const topSugerencias = candidatas.slice(0, 4);

        if (isMounted) {
          setSugerencias((prev) => {
            if (prev.length === 0 && topSugerencias.length === 0) return prev;
            if (
              prev.length === topSugerencias.length &&
              prev.every(
                (item, idx) =>
                  item.producto.id === topSugerencias[idx].producto.id &&
                  item.motivo === topSugerencias[idx].motivo
              )
            ) {
              return prev;
            }
            return topSugerencias;
          });
        }
      } catch (err) {
        console.error("Error al calcular sugerencias dinámicas:", err);
        if (isMounted) {
          setSugerencias((prev) => (prev.length === 0 ? prev : []));
        }
      } finally {
        if (isMounted) {
          setIsLoadingSugerencias(false);
        }
      }
    }

    calcularSugerencias();

    return () => {
      isMounted = false;
    };
  }, [carritoSignature, token, todasCategorias]);

  // =========================================================================
  // CÁLCULO DE STOCK BASE EN CARRITO
  // =========================================================================
  const calcularUnidadesBaseEnCarrito = useCallback(
    (productoId: number, excludePresentacionId?: number) => {
      return carrito
        .filter(
          (item) =>
            item.producto.id === productoId &&
            (excludePresentacionId === undefined ||
              item.presentacion_id !== excludePresentacionId)
        )
        .reduce(
          (acc, item) =>
            acc +
            item.cantidad * (item.presentacion?.unidades_equivalentes || 1),
          0
        );
    },
    [carrito]
  );

  // =========================================================================
  // SELECCIÓN Y AGREGADO AL CARRITO (CON SOPORTE DE PRESENTACIONES)
  // =========================================================================
  const handleAgregarPresentacionAlCarrito = (
    producto: Producto,
    presentacion: Presentacion
  ) => {
    // Validar si el producto está vencido
    const vencInfo = getVencimientoInfo(producto);
    if (vencInfo?.estado === "vencido") {
      setErrorCobro(
        `El producto "${producto.nombre}" se encuentra vencido y no puede ser vendido.`
      );
      return;
    }

    const equiv = Number(presentacion.unidades_equivalentes) || 1;
    const precio = parseFloat(String(presentacion.precio_venta)) || 0;
    const unidadesUsadas = calcularUnidadesBaseEnCarrito(producto.id);

    // Validar si hay stock base disponible para esta presentación
    if (unidadesUsadas + equiv > producto.stock_actual) {
      setErrorCobro(
        `Stock insuficiente para agregar ${presentacion.nombre} (${equiv} u.). Disponibles: ${producto.stock_actual - unidadesUsadas
        } base.`
      );
      return;
    }

    setCarrito((prevCarrito) => {
      const index = prevCarrito.findIndex(
        (item) =>
          item.producto.id === producto.id &&
          item.presentacion_id === presentacion.id
      );

      if (index > -1) {
        // Ya está en el carrito esta presentación específica
        const itemActual = prevCarrito[index];
        const nuevaCantidad = itemActual.cantidad + 1;
        const copia = [...prevCarrito];
        copia[index] = {
          ...itemActual,
          cantidad: nuevaCantidad,
          precio_unitario: precio,
          subtotal: nuevaCantidad * precio,
        };
        return copia;
      }

      // No está en el carrito: agregar nueva línea
      return [
        ...prevCarrito,
        {
          producto,
          presentacion,
          presentacion_id: presentacion.id,
          cantidad: 1,
          precio_unitario: precio,
          subtotal: precio,
        },
      ];
    });

    setSelectorProducto(null);
    setErrorCobro(null);
  };

  const handleSeleccionarProducto = async (producto: Producto) => {
    // Validar si el producto está vencido
    const vencInfo = getVencimientoInfo(producto);
    if (vencInfo?.estado === "vencido") {
      setErrorCobro(
        `El producto "${producto.nombre}" se encuentra vencido y no puede ser vendido.`
      );
      return;
    }

    if (producto.stock_actual <= 0) return;

    // Si ya viene con presentaciones en el objeto producto
    if (producto.presentaciones && producto.presentaciones.length > 0) {
      if (producto.presentaciones.length > 1) {
        setSelectorProducto({
          producto,
          presentaciones: producto.presentaciones,
        });
        return;
      }
      // Solo 1 presentación: agregar directo
      handleAgregarPresentacionAlCarrito(producto, producto.presentaciones[0]);
      return;
    }

    // Si no están en el objeto, consultar al backend
    try {
      setIsLoadingPresId(producto.id);
      const presentaciones = await obtenerPresentaciones(producto.id, token);

      if (presentaciones && presentaciones.length > 1) {
        setSelectorProducto({
          producto,
          presentaciones,
        });
      } else if (presentaciones && presentaciones.length === 1) {
        handleAgregarPresentacionAlCarrito(producto, presentaciones[0]);
      } else {
        // El producto no tiene presentaciones en la base de datos
        setErrorCobro(
          `El producto "${producto.nombre}" no tiene presentaciones de venta registradas en el catálogo. Por favor edítalo para asignarle presentaciones.`
        );
      }
    } catch (err) {
      console.error("Error al cargar presentaciones del producto:", err);
      setErrorCobro(
        `No fue posible consultar las presentaciones de venta para "${producto.nombre}".`
      );
    } finally {
      setIsLoadingPresId(null);
    }
  };

  const handleCambiarCantidad = (
    productoId: number,
    presentacionId: number,
    nuevaCantidad: number
  ) => {
    setCarrito((prevCarrito) => {
      const item = prevCarrito.find(
        (i) =>
          i.producto.id === productoId && i.presentacion_id === presentacionId
      );
      if (!item) return prevCarrito;

      const equiv = Number(item.presentacion?.unidades_equivalentes) || 1;
      const otrasUnidadesUsadas = calcularUnidadesBaseEnCarrito(
        productoId,
        presentacionId
      );
      const stockDisponible = item.producto.stock_actual - otrasUnidadesUsadas;
      const maxCantidadPermitida = Math.max(
        1,
        Math.floor(stockDisponible / equiv)
      );

      const cantidadClamped = Math.max(
        1,
        Math.min(nuevaCantidad, maxCantidadPermitida)
      );
      const precioUnitario =
        item.precio_unitario ||
        parseFloat(
          String(item.presentacion?.precio_venta || item.producto.precio_venta)
        ) ||
        0;

      return prevCarrito.map((i) => {
        if (
          i.producto.id === productoId &&
          i.presentacion_id === presentacionId
        ) {
          return {
            ...i,
            cantidad: cantidadClamped,
            subtotal: cantidadClamped * precioUnitario,
          };
        }
        return i;
      });
    });
    setErrorCobro(null);
  };

  const handleEliminarItem = (productoId: number, presentacionId: number) => {
    setCarrito((prevCarrito) =>
      prevCarrito.filter(
        (item) =>
          !(
            item.producto.id === productoId &&
            item.presentacion_id === presentacionId
          )
      )
    );
    setErrorCobro(null);
  };

  const handleVaciarCarrito = () => {
    setCarrito([]);
    setErrorCobro(null);
  };

  // =========================================================================
  // CÁLCULOS FINANCIEROS (PREVIEW EN TIEMPO REAL)
  // =========================================================================
  const { subtotal, previewIVA, descuento, total } = useMemo(() => {
    const sumSubtotal = carrito.reduce((acc, item) => acc + item.subtotal, 0);

    // NOTA: El cálculo de IVA (15%) en el frontend es únicamente una vista previa
    // estimativa para el usuario. El backend de Laravel es la fuente de verdad definitiva.
    const tasaIVA = 0.15;
    const calcIVA = sumSubtotal * tasaIVA;

    const descNum = parseFloat(descuentoInput);
    const descValido = isNaN(descNum) || descNum < 0 ? 0 : descNum;

    // El descuento no debería exceder el subtotal + IVA
    const totalCalc = Math.max(0, sumSubtotal + calcIVA - descValido);

    return {
      subtotal: sumSubtotal,
      previewIVA: calcIVA,
      descuento: descValido,
      total: totalCalc,
    };
  }, [carrito, descuentoInput]);

  // Formato de moneda
  const { formatMoneda: formatMoney } = useMoneda();

  // =========================================================================
  // VALIDACIONES DEL DESCUENTO Y RESTRICCIONES DE COBRO
  // =========================================================================
  const descuentoNum = parseFloat(descuentoInput);
  const isDescuentoNegativo = !isNaN(descuentoNum) && descuentoNum < 0;
  const isDescuentoMayorSubtotal = !isNaN(descuentoNum) && descuentoNum > subtotal;
  const clientDescuentoError = isDescuentoNegativo
    ? "El descuento no puede ser menor que 0."
    : isDescuentoMayorSubtotal
    ? `El descuento no puede superar el subtotal actual (${formatMoney(subtotal)}).`
    : null;

  const discountErrorMessage = errors.descuento?.[0] || clientDescuentoError;
  const hasDiscountError = Boolean(discountErrorMessage);

  // Deshabilitar botón Cobrar si carrito vacío, enviando o descuento inválido (< 0 o > subtotal)
  const isCobroDisabled =
    carrito.length === 0 ||
    isSubmitting ||
    (!isNaN(descuentoNum) && (descuentoNum < 0 || descuentoNum > subtotal));

  // =========================================================================
  // CÁLCULOS DE PAGO EN EFECTIVO Y CAMBIO
  // =========================================================================
  const montoRecibidoNum = parseFloat(montoRecibido) || 0;
  const cambio = Math.max(0, montoRecibidoNum - total);
  const faltante = Math.max(0, total - montoRecibidoNum);
  const esMontoSuficiente =
    montoRecibido.trim() !== "" && !isNaN(montoRecibidoNum) && montoRecibidoNum >= total;

  // Abrir modal de cobro configurando el monto por defecto
  const handleAbrirModalCobro = () => {
    if (carrito.length === 0 || isCobroDisabled) return;
    setErrorCobro(null);
    setMontoRecibido(total.toFixed(2));
    setShowModalCobro(true);
  };

  // =========================================================================
  // CONFIRMACIÓN DE VENTA (ENVÍO A POST /api/ventas)
  // =========================================================================
  const handleConfirmarVenta = async () => {
    if (carrito.length === 0) return;
    if (!esMontoSuficiente) return;
    if (!isNaN(descuentoNum) && (descuentoNum < 0 || descuentoNum > subtotal)) return;

    // Verificar si algún producto en el carrito está vencido
    const itemVencido = carrito.find((item) => {
      const v = getVencimientoInfo(item.producto);
      return v?.estado === "vencido";
    });
    if (itemVencido) {
      setErrorCobro(
        `El producto "${itemVencido.producto.nombre}" se encuentra vencido y no puede ser vendido.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorCobro(null);
    setErrors({});

    const payload: CrearVentaPayload = {
      cliente_nombre: clienteNombre.trim() ? clienteNombre.trim() : undefined,
      descuento: descuento > 0 ? descuento : undefined,
      productos: carrito.map((item) => ({
        producto_id: item.producto.id,
        presentacion_id: item.presentacion_id,
        cantidad: item.cantidad,
      })),
    };

    try {
      const response = await crearVenta(payload, token);

      // Éxito: guardar datos de confirmación, cerrar modal de cobro y limpiar carrito
      setVentaExitosa({
        id: response.venta.id,
        numeroFactura: response.venta.numero_factura,
        total: response.venta.total,
        cliente: response.venta.cliente_nombre || "Consumidor Final",
      });
      setShowModalCobro(false);
      setCarrito([]);
      setClienteNombre("");
      setDescuentoInput("");
      setErrors({});
      setMontoRecibido("");
      mutateProductos();
    } catch (err: unknown) {
      console.error("Error al procesar cobro de venta:", err);
      let errorMsg =
        "Error inesperado al procesar la venta. Por favor, revisa las cantidades o el inventario disponible.";
      let validationErrors: Record<string, string[]> = {};

      if (err instanceof ValidationError) {
        errorMsg = err.message || "Los datos de la venta no son válidos.";
        validationErrors = err.errors || {};
      } else if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        (err as any).response?.status === 422
      ) {
        const resData = (err as any).response?.data;
        errorMsg = resData?.message || "Error de validación en la venta.";
        validationErrors = resData?.errors || {};
      } else if (
        typeof err === "object" &&
        err !== null &&
        "data" in err &&
        (err as any).data?.errors
      ) {
        validationErrors = (err as any).data.errors;
        errorMsg = (err as any).message || "Error de validación.";
      } else if (
        typeof err === "object" &&
        err !== null &&
        "errors" in err &&
        typeof (err as any).errors === "object"
      ) {
        validationErrors = (err as any).errors || {};
        errorMsg = (err as any).message || "Error de validación.";
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      setErrors(validationErrors);
      setErrorCobro(errorMsg);
      setShowModalCobro(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Iniciar otra venta luego del éxito
  const handleNuevaVenta = () => {
    setVentaExitosa(null);
    setErrorCobro(null);
    setErrorImpresionPdf(null);
    setIsImprimiendoPdf(false);
    setBusqueda("");
    setCategoriaSeleccionada("");
    mutateProductos();
  };

  const handleImprimirFactura = async () => {
    if (!ventaExitosa?.id) return;
    setIsImprimiendoPdf(true);
    setErrorImpresionPdf(null);
    try {
      await abrirFacturaPDF(ventaExitosa.id, token);
    } catch (err: unknown) {
      console.error("Error al generar o imprimir factura PDF:", err);
      setErrorImpresionPdf(
        err instanceof Error
          ? err.message
          : "Error al generar la factura en PDF. Por favor, intente nuevamente."
      );
    } finally {
      setIsImprimiendoPdf(false);
    }
  };

  return (
    <ProtectedByRole modulo="ventas" requiereEscritura={true}>
      <DashboardLayout>
        <div className="space-y-4">
          {/* ========================================================================= */}
          {/* ENCABEZADO PRINCIPAL (SIN BREADCRUMB REDUNDANTE)                           */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand/10 text-brand">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                  Punto de Venta (POS)
                </h1>
                <p className="text-xs text-slate-500">
                  Busca productos por código o nombre para añadirlos al carrito.
                </p>
              </div>
            </div>

            <Link href="/ventas">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 self-start sm:self-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Ventas</span>
              </Button>
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* BANNER DE ERROR (CONSERVA EL CARRITO PARA AJUSTE INMEDIATO)               */}
          {/* ========================================================================= */}
          {errorCobro && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-800">
                    No se pudo completar la operación
                  </h4>
                  <p className="text-rose-700 mt-0.5 leading-relaxed">
                    {errorCobro}
                  </p>
                  <p className="text-[11px] text-rose-600 mt-1">
                    Tu orden se ha conservado. Ajusta las cantidades o presentaciones para continuar.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorCobro(null)}
                className="text-rose-500 hover:text-rose-800 p-1 rounded-md transition-colors cursor-pointer"
                title="Cerrar advertencia"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CONTENEDOR EN DOS COLUMNAS                                                */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ======================================================================= */}
            {/* COLUMNA IZQUIERDA: BUSCADOR Y CUADRÍCULA DE PRODUCTOS (7 COLS EN LG)    */}
            {/* ======================================================================= */}
            <div className="lg:col-span-7 space-y-3.5">
              {/* Barra de Búsqueda Reactiva y Menú de Categorías */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre, marca o código..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-slate-800 placeholder:text-slate-400"
                    autoFocus
                  />
                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => setBusqueda("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Menú de Categorías (Pills con scroll horizontal) */}
                {todasCategorias.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setCategoriaSeleccionada("")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${categoriaSeleccionada === ""
                          ? "bg-[var(--primary-brand)] text-[var(--primary-brand-text,#ffffff)] shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                        }`}
                    >
                      Todas
                    </button>
                    {todasCategorias.map((cat) => {
                      const isSelected = String(cat.id) === String(categoriaSeleccionada);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            setCategoriaSeleccionada(isSelected ? "" : String(cat.id))
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${isSelected
                              ? "bg-[var(--primary-brand)] text-[var(--primary-brand-text,#ffffff)] shadow-2xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                            }`}
                        >
                          {cat.nombre}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sección Sugerencias Dinámicas de Venta Cruzada */}
              {sugerencias.length > 0 ? (
                <div className="bg-brand/5 rounded-2xl border border-brand/20 p-3.5 shadow-xs transition-all animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-brand/15">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-brand/10 text-brand">
                        <Wine className="w-3.5 h-3.5" />
                      </span>
                      <h3 className="text-xs font-bold text-slate-900">
                        Sugerencias para esta venta
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        · Recomendaciones automáticas
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                      {sugerencias.length} sugerencias
                    </span>
                  </div>

                  {/* Scroll Horizontal Compacto de Sugerencias */}
                  <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                    {sugerencias.map(({ producto: prod, motivo }) => {
                      const tieneStock = prod.stock_actual > 0;
                      const unidadesEnCarrito = calcularUnidadesBaseEnCarrito(prod.id);
                      const vencInfo = getVencimientoInfo(prod);
                      const isVencido = vencInfo?.estado === "vencido";
                      const isPorVencer = vencInfo?.estado === "por_vencer";
                      const stockAlcanzado =
                        unidadesEnCarrito >= prod.stock_actual && tieneStock;

                      return (
                        <div
                          key={`sugerencia-${prod.id}`}
                          className={`min-w-[165px] sm:min-w-[180px] max-w-[200px] shrink-0 bg-white rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-200 ${
                            isVencido
                              ? "opacity-60 border-rose-200 bg-rose-50/40"
                              : !tieneStock
                              ? "opacity-50 border-slate-200 bg-slate-50"
                              : stockAlcanzado
                              ? "border-brand/30 bg-brand/5"
                              : "border-brand/20 hover:border-brand hover:shadow-xs"
                          }`}
                        >
                          <div className="mb-2">
                            {/* Badges superiores: motivo y vencimiento */}
                            <div className="flex flex-wrap gap-1 mb-1">
                              <span
                                className="text-[10px] font-semibold text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded-md inline-block max-w-full truncate"
                                title={motivo}
                              >
                                {motivo}
                              </span>

                              {isVencido && (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" /> Vencido
                                </span>
                              )}

                              {isPorVencer && !isVencido && (
                                <span
                                  className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5"
                                  title={prod.fecha_vencimiento ? `Vence: ${formatDateLegible(prod.fecha_vencimiento)}` : undefined}
                                >
                                  <Clock className="w-2.5 h-2.5" /> Por vencer
                                </span>
                              )}
                            </div>

                            <span
                              className="text-xs font-bold text-slate-900 block truncate"
                              title={prod.nombre}
                            >
                              {prod.nombre}
                            </span>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <span className="text-xs font-extrabold text-slate-800 font-mono">
                                {formatMoneda(prod.precio_venta)}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                  isVencido
                                    ? "text-rose-700 bg-rose-100"
                                    : !tieneStock
                                    ? "text-rose-600 bg-rose-50"
                                    : "text-slate-500 bg-slate-100"
                                }`}
                              >
                                {isVencido
                                  ? "Vencido"
                                  : tieneStock
                                  ? `${prod.stock_actual} disp.`
                                  : "Agotado"}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={
                              isVencido ||
                              !tieneStock ||
                              stockAlcanzado ||
                              isLoadingPresId === prod.id
                            }
                            onClick={() => handleSeleccionarProducto(prod)}
                            className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                              isVencido
                                ? "bg-rose-100 text-rose-500 border border-rose-200 cursor-not-allowed"
                                : !tieneStock || stockAlcanzado
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-[0.98] cursor-pointer"
                            }`}
                          >
                            {isLoadingPresId === prod.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isVencido ? (
                              <span>Vencido</span>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Agregar</span>
                                {unidadesEnCarrito > 0 && (
                                  <span className="ml-1 bg-white/25 px-1 py-0.2 rounded text-[10px]">
                                    ({unidadesEnCarrito})
                                  </span>
                                )}
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : carrito.length === 0 ? (
                <div className="bg-brand/5 rounded-2xl border border-dashed border-brand/20 p-3 text-xs text-slate-600 flex items-center gap-2.5">
                  <span className="p-1 rounded-md bg-brand/10 text-brand shrink-0">
                    <Wine className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    Agrega un licor o bebida al carrito para ver acompañantes sugeridos automáticamente (hielo, refrescos, snacks).
                  </span>
                </div>
              ) : null}

              {/* Contenedor de Tarjetas de Productos */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs min-h-[520px]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-brand" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Productos Disponibles para Venta
                    </h2>
                    <span className="text-xs text-slate-400">
                      ({productos.length} encontrados)
                    </span>
                  </div>
                  {isLoadingProductos && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                      <span>Buscando...</span>
                    </div>
                  )}
                </div>

                {errorCargaProductos ? (
                  <div className="py-16 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    <p className="text-xs text-rose-600 font-medium">
                      {errorCargaProductos}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => mutateProductos()}
                      className="mt-3 text-xs"
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : isLoadingProductos && productos.length === 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-4.5 max-h-[640px] overflow-y-auto pr-1.5 pb-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse flex flex-col justify-between"
                      >
                        <div className="aspect-[3/4] bg-slate-200/80 w-full" />
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="h-3 bg-slate-200 rounded w-16" />
                            <div className="h-3 bg-slate-200 rounded w-12" />
                          </div>
                          <div className="h-4 bg-slate-200 rounded w-3/4" />
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <div className="h-5 bg-slate-200 rounded w-20" />
                            <div className="h-4 bg-slate-200 rounded w-14" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : productos.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                    <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">
                      No hay productos coincidentes
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Intenta escribir otro término o borra la búsqueda.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-4.5 max-h-[640px] overflow-y-auto pr-1.5 pb-2">
                    {productos.map((prod) => {
                      const tieneStock = prod.stock_actual > 0;
                      const unidadesEnCarrito = calcularUnidadesBaseEnCarrito(prod.id);
                      const isSelected = unidadesEnCarrito > 0;
                      const stockAlcanzado = unidadesEnCarrito >= prod.stock_actual && tieneStock;
                      const isLoadingThis = isLoadingPresId === prod.id;
                      const vencInfo = getVencimientoInfo(prod);
                      const isVencido = vencInfo?.estado === "vencido";
                      const isPorVencer = vencInfo?.estado === "por_vencer";

                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            if (isVencido) {
                              setErrorCobro(
                                `El producto "${prod.nombre}" se encuentra vencido y no puede ser vendido.`
                              );
                              return;
                            }
                            if (tieneStock && !stockAlcanzado && !isLoadingThis) {
                              handleSeleccionarProducto(prod);
                            }
                          }}
                          className={`
                            group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 select-none overflow-hidden bg-white
                            ${isVencido
                              ? "opacity-60 border-rose-200 bg-rose-50/20 cursor-not-allowed"
                              : !tieneStock
                              ? "opacity-45 cursor-not-allowed border-slate-200 bg-slate-50/60 pointer-events-none"
                              : isSelected
                                ? "cursor-pointer shadow-md"
                                : "border-slate-200/90 hover:border-slate-300 hover:shadow-lg cursor-pointer active:scale-[0.98]"
                            }
                          `}
                          style={
                            isSelected && tieneStock && !isVencido
                              ? {
                                borderColor: "var(--primary-brand)",
                                boxShadow:
                                  "0 0 0 1.5px var(--primary-brand), 0 8px 20px -4px color-mix(in srgb, var(--primary-brand) 16%, transparent)",
                              }
                              : undefined
                          }
                        >
                          {/* Contenedor de imagen vertical reutilizable (aspect-[3/4], fondo neutro, fallback de licorería) */}
                          <ProductoImagenCard
                            imagenUrl={prod.imagen_url}
                            alt={prod.nombre}
                            aspectRatio="3/4"
                            badges={
                              <>
                                {/* Badge de unidades en carrito */}
                                {unidadesEnCarrito > 0 && !isVencido && (
                                  <span
                                    className="absolute top-2.5 right-2.5 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold shadow-md animate-in zoom-in-75 duration-150"
                                    style={{
                                      backgroundColor: "var(--primary-brand)",
                                      color: "var(--primary-brand-text, #ffffff)",
                                    }}
                                    title={`${unidadesEnCarrito} unidades base en la orden`}
                                  >
                                    {unidadesEnCarrito}
                                  </span>
                                )}

                                {/* Badge Por Vencer (ámbar/amarillo) */}
                                {isPorVencer && !isVencido && (
                                  <span
                                    className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs bg-amber-50 text-amber-800 border border-amber-300 backdrop-blur-xs"
                                    title={prod.fecha_vencimiento ? `Vence: ${formatDateLegible(prod.fecha_vencimiento)}` : undefined}
                                  >
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>Por vencer {prod.fecha_vencimiento ? `(${formatDateLegible(prod.fecha_vencimiento)})` : ""}</span>
                                  </span>
                                )}

                                {/* Overlay informativo de producto vencido */}
                                {isVencido && (
                                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center">
                                    <span className="text-[11px] font-bold tracking-wider uppercase text-rose-700 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" /> Vencido
                                    </span>
                                    {prod.fecha_vencimiento && (
                                      <span className="text-[10px] text-rose-600 font-medium mt-1">
                                        Venció: {formatDateLegible(prod.fecha_vencimiento)}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Overlay informativo de stock agotado */}
                                {!tieneStock && !isVencido && (
                                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                                    <span className="text-[10px] font-bold tracking-wider uppercase text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full shadow-xs">
                                      Agotado
                                    </span>
                                  </div>
                                )}

                                {/* Overlay de carga al consultar presentaciones */}
                                {isLoadingThis && (
                                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-brand" />
                                  </div>
                                )}
                              </>
                            }
                          />

                          {/* Cuerpo de la tarjeta */}
                          <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                            <div className="space-y-1">
                              {/* Línea secundaria: Categoría y Presentación en ml */}
                              <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 font-medium">
                                <span className="truncate">
                                  {prod.categoria?.nombre || "Licorería"}
                                  {prod.presentacion_ml && ` · ${formatPresentacionMl(prod.presentacion_ml)}`}
                                </span>
                              </div>

                              {/* Nombre del producto en tipografía serif destacada */}
                              <h3
                                className="font-serif text-sm sm:text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 transition-colors group-hover:text-slate-950"
                                style={isSelected && !isVencido ? { color: "var(--primary-brand)" } : undefined}
                              >
                                {prod.nombre}
                              </h3>
                            </div>

                            {/* Fila inferior: Precio, Stock disponible y Botón de acción */}
                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                              <div>
                                <div
                                  className="text-base sm:text-lg font-extrabold font-sans leading-none"
                                  style={{ color: "var(--primary-brand)" }}
                                >
                                  {formatMoney(prod.precio_venta)}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  {isVencido
                                    ? "Producto vencido"
                                    : !tieneStock
                                    ? "Sin existencias"
                                    : stockAlcanzado
                                      ? "Stock máx. alcanzado"
                                      : `${prod.stock_actual - unidadesEnCarrito} disp. (${prod.stock_actual} total)`}
                                </p>
                              </div>

                              {/* Botón de acción circular (+) */}
                              <button
                                type="button"
                                disabled={!tieneStock || stockAlcanzado || isLoadingThis || isVencido}
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform duration-150 ${
                                  isVencido
                                    ? "bg-rose-100 text-rose-400 border border-rose-200 cursor-not-allowed"
                                    : !tieneStock || stockAlcanzado
                                    ? "disabled:opacity-40 disabled:cursor-not-allowed"
                                    : "group-hover:scale-105 active:scale-95 cursor-pointer"
                                }`}
                                style={
                                  !isVencido
                                    ? {
                                        backgroundColor: "var(--primary-brand)",
                                        color: "var(--primary-brand-text, #ffffff)",
                                      }
                                    : undefined
                                }
                                title={
                                  isVencido
                                    ? "Producto vencido - No se puede vender"
                                    : !tieneStock
                                    ? "Producto agotado"
                                    : stockAlcanzado
                                      ? "No hay más unidades disponibles"
                                      : "Seleccionar presentación / Agregar"
                                }
                              >
                                {isLoadingThis ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Plus className="w-4 h-4 stroke-[2.5]" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================================= */}
            {/* COLUMNA DERECHA: ORDEN ACTUAL, TOTALES Y COBRO (5 COLS EN LG)           */}
            {/* ======================================================================= */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between">
                {/* Cabecera del Carrito */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Detalle de la Orden
                    </h2>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                      {carrito.reduce((acc, i) => acc + i.cantidad, 0)} ítems
                    </span>
                  </div>

                  {carrito.length > 0 && (
                    <button
                      type="button"
                      onClick={handleVaciarCarrito}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium transition-colors cursor-pointer"
                    >
                      Vaciar
                    </button>
                  )}
                </div>

                {/* Campos opcionales: Cliente y Descuento */}
                <div className="space-y-2.5 mb-3.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 shrink-0">
                  {/* Cliente */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Nombre del cliente (opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Juan Pérez / Consumidor Final"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Descuento */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>Descuento fijo ({moneda || "C$"}) (opcional)</span>
                      </label>
                      {subtotal > 0 && (
                        <span className="text-[10px] text-slate-400">
                          Máx: {formatMoney(subtotal)}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={subtotal}
                      placeholder="0.00"
                      value={descuentoInput}
                      onKeyDown={(e) => {
                        // Impedir signos negativos y caracteres exponenciales
                        if (["-", "e", "E", "+"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        setDescuentoInput(e.target.value);
                        if (errors.descuento) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.descuento;
                            return next;
                          });
                        }
                      }}
                      className={`w-full px-3 py-1.5 text-xs bg-white rounded-lg focus:outline-none focus:ring-2 font-sans placeholder:text-slate-400 transition-colors ${
                        hasDiscountError
                          ? "border border-red-500 focus:border-red-500 focus:ring-red-500/20 text-red-900"
                          : "border border-slate-200 focus:border-brand focus:ring-brand/15 text-slate-900"
                      }`}
                    />
                    {hasDiscountError && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1 animate-in fade-in duration-150">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{discountErrorMessage}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Lista de Productos en el Carrito */}
                <div className="flex-1 min-h-[120px] max-h-[calc(100vh-440px)] overflow-y-auto pr-1 mb-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 sticky top-0 bg-white/95 py-0.5 z-5 backdrop-blur-xs">
                    Líneas de Venta
                  </h3>

                  {carrito.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl bg-gray-50/50">
                      <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-medium text-slate-600">
                        El carrito está vacío
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Selecciona productos en el catálogo de la izquierda para comenzar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {carrito.map((item) => {
                        const equiv = item.presentacion?.unidades_equivalentes || 1;
                        const otrasUnidades = calcularUnidadesBaseEnCarrito(
                          item.producto.id,
                          item.presentacion_id
                        );
                        const stockRestante = item.producto.stock_actual - otrasUnidades;
                        const maxCantidad = Math.max(1, Math.floor(stockRestante / equiv));
                        const nombrePresentacion = item.presentacion?.nombre || "Unidad";

                        return (
                          <div
                            key={`${item.producto.id}-${item.presentacion_id}`}
                            className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors flex items-center justify-between gap-2 text-xs"
                          >
                            {/* Información del Producto y Presentación */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-semibold text-slate-900 truncate">
                                  {item.producto.nombre}
                                </p>
                                <span
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide"
                                  style={{
                                    backgroundColor: "color-mix(in srgb, var(--primary-brand) 12%, transparent)",
                                    color: "var(--primary-brand)",
                                  }}
                                >
                                  {nombrePresentacion}
                                  {equiv > 1 && ` (${equiv} u.)`}
                                </span>
                                {getVencimientoInfo(item.producto)?.estado === "por_vencer" && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <Clock className="w-2.5 h-2.5" />
                                    Por vencer
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <span>{formatMoney(item.precio_unitario)} c/u</span>
                                <span>•</span>
                                <span className="text-slate-500">
                                  Disp: {maxCantidad} packs ({item.producto.stock_actual} base)
                                </span>
                              </div>
                            </div>

                            {/* Controles de Cantidad (+/- e input directo) */}
                            <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-1 rounded-lg">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCambiarCantidad(
                                    item.producto.id,
                                    item.presentacion_id,
                                    item.cantidad - 1
                                  )
                                }
                                disabled={item.cantidad <= 1}
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                title="Disminuir unidad"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <input
                                type="number"
                                min="1"
                                max={maxCantidad}
                                value={item.cantidad}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val)) {
                                    handleCambiarCantidad(
                                      item.producto.id,
                                      item.presentacion_id,
                                      val
                                    );
                                  }
                                }}
                                className="w-8 text-center bg-white rounded border border-slate-200 text-xs font-semibold py-0.5 focus:outline-none focus:border-brand"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  handleCambiarCantidad(
                                    item.producto.id,
                                    item.presentacion_id,
                                    item.cantidad + 1
                                  )
                                }
                                disabled={item.cantidad >= maxCantidad}
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                title="Aumentar unidad"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Subtotal de Línea */}
                            <div className="w-20 text-right font-bold text-slate-900 font-sans">
                              {formatMoney(item.subtotal)}
                            </div>

                            {/* Eliminar Línea */}
                            <button
                              type="button"
                              onClick={() =>
                                handleEliminarItem(
                                  item.producto.id,
                                  item.presentacion_id
                                )
                              }
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar línea de la orden"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Resumen Financiero y Totales Sticky */}
                <div className="sticky bottom-0 bg-white pt-3.5 pb-1 border-t border-slate-200 space-y-2 text-xs shadow-xs z-10">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900 font-sans">
                      {formatMoney(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <span>IVA (15% Preview):</span>
                      <span
                        className="text-[10px] text-slate-400 cursor-help"
                        title="Cálculo estimativo. El backend recalcula los impuestos finales de acuerdo con las normativas fiscales."
                      >
                        (est.)
                      </span>
                    </span>
                    <span className="font-semibold text-slate-900 font-sans">
                      {formatMoney(previewIVA)}
                    </span>
                  </div>

                  {descuento > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Descuento aplicado:</span>
                      <span className="font-semibold font-sans">
                        -{formatMoney(descuento)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2 flex items-baseline justify-between text-sm font-bold text-slate-900">
                    <span className="text-base text-neutral-900">Total a Cobrar:</span>
                    <span
                      className="text-xl font-extrabold text-brand font-sans"
                      style={{ color: "var(--primary-brand)" }}
                    >
                      {formatMoney(total)}
                    </span>
                  </div>

                  {/* Botón Grande de Cobrar */}
                  <div className="pt-2">
                    <Button
                      type="button"
                      size="lg"
                      onClick={handleAbrirModalCobro}
                      disabled={isCobroDisabled}
                      className="w-full text-sm font-bold gap-2 py-3 shadow-md shadow-brand/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-auto"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Cobrar {formatMoney(total)}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MODAL SELECTOR DE PRESENTACIÓN DE VENTA (PILLS / TARJETAS)                */}
          {/* ========================================================================= */}
          {selectorProducto && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectorProducto(null);
              }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header del Modal */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--primary-brand) 12%, transparent)",
                        color: "var(--primary-brand)",
                      }}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {selectorProducto.producto.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>Selecciona la presentación de venta</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">
                          {selectorProducto.producto.stock_actual -
                            calcularUnidadesBaseEnCarrito(selectorProducto.producto.id)}{" "}
                          unidades base disponibles
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectorProducto(null)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Aviso visual en el modal si el producto está por vencer */}
                {getVencimientoInfo(selectorProducto.producto)?.estado === "por_vencer" && (
                  <div className="mx-5 mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Aviso de lote:</strong> Este producto vence el{" "}
                      {formatDateLegible(selectorProducto.producto.fecha_vencimiento)} (
                      {getVencimientoInfo(selectorProducto.producto)?.texto}).
                    </span>
                  </div>
                )}

                {/* Lista de Presentaciones tipo Pills / Tarjetas */}
                <div className="p-5 space-y-3 max-h-[380px] overflow-y-auto">
                  {selectorProducto.presentaciones.map((pres) => {
                    const equiv = Number(pres.unidades_equivalentes) || 1;
                    const stockBaseDisp =
                      selectorProducto.producto.stock_actual -
                      calcularUnidadesBaseEnCarrito(selectorProducto.producto.id);
                    const packsDisponibles = Math.floor(stockBaseDisp / equiv);
                    const tieneStockSuficiente = packsDisponibles > 0;

                    return (
                      <button
                        key={pres.id}
                        type="button"
                        disabled={!tieneStockSuficiente}
                        onClick={() =>
                          handleAgregarPresentacionAlCarrito(
                            selectorProducto.producto,
                            pres
                          )
                        }
                        className={`
                          w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between gap-3 group
                          ${!tieneStockSuficiente
                            ? "border-slate-200 bg-slate-50/60 opacity-50 cursor-not-allowed"
                            : "border-slate-200 hover:border-brand hover:shadow-md bg-white cursor-pointer active:scale-[0.99]"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                              w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors
                              ${pres.es_default
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700 group-hover:bg-brand/10 group-hover:text-brand"
                              }
                            `}
                          >
                            {equiv}x
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors">
                                {pres.nombre}
                              </span>
                              {pres.es_default && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                                  <Wine className="w-2.5 h-2.5" />
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {equiv === 1
                                ? "1 unidad base"
                                : `Equivale a ${equiv} unidades base`}
                              {" · "}
                              <span className={packsDisponibles > 0 ? "text-slate-600 font-medium" : "text-rose-500 font-semibold"}>
                                {packsDisponibles > 0
                                  ? `${packsDisponibles} disponible${packsDisponibles === 1 ? "" : "s"}`
                                  : "Sin existencias suficientes"}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className="text-base sm:text-lg font-extrabold font-sans"
                            style={{ color: "var(--primary-brand)" }}
                          >
                            {formatMoney(pres.precio_venta)}
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {formatMoney(
                              (parseFloat(String(pres.precio_venta)) || 0) / equiv
                            )}{" "}
                            / u.
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer del Modal */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectorProducto(null)}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL DE SELECCIÓN DE MÉTODO DE PAGO Y CÁLCULO DE CAMBIO                  */}
          {/* ========================================================================= */}
          {showModalCobro && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) setShowModalCobro(false);
              }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header del Modal */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--primary-brand) 12%, transparent)",
                        color: "var(--primary-brand)",
                      }}
                    >
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-sans text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        Cobro de Venta
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {clienteNombre.trim()
                          ? `Cliente: ${clienteNombre.trim()}`
                          : "Consumidor Final"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowModalCobro(false)}
                    disabled={isSubmitting}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Banner con Total a Cobrar */}
                  <div className="bg-slate-900 rounded-2xl p-4 text-white flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total a Cobrar
                      </span>
                      <span className="text-xs text-slate-300">
                        {carrito.length} producto{carrito.length === 1 ? "" : "s"} en la orden
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-sans text-right tracking-tight">
                      {formatMoney(total)}
                    </div>
                  </div>

                  {/* Indicador de Método de Pago: Solo Efectivo */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/80">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs"
                        style={{
                          backgroundColor: "var(--primary-brand)",
                          color: "var(--primary-brand-text, #ffffff)",
                        }}
                      >
                        <Coins className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Pago en Efectivo
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Moneda: {moneda || "C$"}
                    </span>
                  </div>

                  {/* Panel de Pago en Efectivo */}
                  <div className="space-y-3 pt-1">
                    {/* Input Monto Recibido */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Monto Recibido del Cliente
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none">
                          {moneda || "C$"}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={montoRecibido}
                          onChange={(e) => setMontoRecibido(e.target.value)}
                          disabled={isSubmitting}
                          autoFocus
                          className="w-full pl-12 pr-4 py-2.5 text-base sm:text-lg font-bold font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[var(--primary-brand)] focus:ring-3 focus:ring-[var(--primary-brand)]/15 transition-all"
                        />
                      </div>

                      {/* Botones de atajo rápido */}
                      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5">
                        <button
                          type="button"
                          onClick={() => setMontoRecibido(total.toFixed(2))}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors shrink-0 cursor-pointer shadow-2xs"
                        >
                          Monto Exacto
                        </button>
                        {[100, 200, 500, 1000].map((billete) => {
                          if (billete >= total) {
                            return (
                              <button
                                key={billete}
                                type="button"
                                onClick={() => setMontoRecibido(billete.toFixed(2))}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors shrink-0 cursor-pointer"
                              >
                                {moneda || "C$"} {billete}
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>

                    {/* Caja de Cálculo de Cambio en Tiempo Real */}
                    {esMontoSuficiente ? (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex items-center justify-between animate-in fade-in duration-150 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-emerald-900 block">
                              Cambio a Entregar
                            </span>
                            <span className="text-[10px] text-emerald-700">
                              {cambio === 0
                                ? "Pago exacto (sin vuelto)"
                                : "Devolver al cliente"}
                            </span>
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-extrabold font-sans text-emerald-700 tracking-tight">
                          {formatMoney(cambio)}
                        </div>
                      </div>
                    ) : montoRecibido.trim() !== "" ? (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="font-bold">Monto insuficiente</span>
                        </div>
                        <span className="font-mono font-bold text-rose-700">
                          Faltan {formatMoney(faltante)}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 text-center">
                        Ingresa el monto recibido para calcular el cambio.
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer del Modal */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowModalCobro(false)}
                    disabled={isSubmitting}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleConfirmarVenta}
                    isLoading={isSubmitting}
                    disabled={isSubmitting || !esMontoSuficiente}
                    className="text-xs font-bold gap-1.5 shadow-sm"
                  >
                    {isSubmitting ? (
                      <span>Procesando...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmar Venta</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL DE CONFIRMACIÓN EXITOSA DE VENTA                                     */}
          {/* ========================================================================= */}
          {ventaExitosa && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) handleNuevaVenta();
              }}
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
                      ¡Venta Cobrada con Éxito!
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      La transacción ha sido registrada y el inventario actualizado.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Factura n°:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                        #{ventaExitosa.numeroFactura}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cliente:</span>
                      <span className="font-semibold text-slate-800">
                        {ventaExitosa.cliente}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                      <span>Monto Total:</span>
                      <span className="font-sans" style={{ color: "var(--primary-brand)" }}>
                        {formatMoney(ventaExitosa.total)}
                      </span>
                    </div>
                  </div>

                  {/* Alerta de error si falla la impresión del PDF */}
                  {errorImpresionPdf && (
                    <div
                      role="alert"
                      className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 text-left animate-in fade-in"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{errorImpresionPdf}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setErrorImpresionPdf(null)}
                        className="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer"
                        title="Cerrar advertencia"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <Button
                      type="button"
                      size="md"
                      onClick={handleImprimirFactura}
                      isLoading={isImprimiendoPdf}
                      disabled={isImprimiendoPdf}
                      className="w-full sm:flex-1 min-w-0 text-xs font-semibold gap-1.5 shadow-sm justify-center cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{isImprimiendoPdf ? "Generando PDF..." : "Imprimir Factura"}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={handleNuevaVenta}
                      className="w-full sm:flex-1 min-w-0 text-xs font-semibold gap-1.5 justify-center cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Nueva Venta</span>
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <Link href="/ventas" className="w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full sm:w-auto text-xs text-slate-500 hover:text-slate-800"
                      >
                        Ver Historial de Ventas
                      </Button>
                    </Link>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setVentaExitosa(null)}
                      className="w-full sm:w-auto text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cerrar
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
