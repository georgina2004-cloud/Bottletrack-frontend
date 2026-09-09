"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { obtenerCategorias, crearProducto, ValidationError } from "@/lib/api";
import { Categoria, ProductoPayload } from "@/types/producto";
import {
  Layers,
  Plus,
  Trash2,
  Copy,
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Save,
  PackagePlus,
  Info,
  HelpCircle,
} from "lucide-react";

export interface FilaProductoMasivo {
  id: string;
  nombre: string;
  marca: string;
  categoria_id: string;
  codigo_barras: string;
  presentacion_ml: string;
  precio_compra: string;
  precio_venta: string;
  stock_actual: string;
  stock_minimo: string;
  ubicacion: string;
  estado: "idle" | "guardando" | "exito" | "error";
  mensajeError?: string;
  erroresCampos: Record<string, string>;
}

const generarIdFila = () =>
  Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

const crearFilaVacia = (categoriaDefault = ""): FilaProductoMasivo => ({
  id: generarIdFila(),
  nombre: "",
  marca: "",
  categoria_id: categoriaDefault,
  codigo_barras: "",
  presentacion_ml: "",
  precio_compra: "",
  precio_venta: "",
  stock_actual: "0",
  stock_minimo: "5",
  ubicacion: "",
  estado: "idle",
  erroresCampos: {},
});

export default function CargaMasivaProductosPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState<boolean>(true);

  // Filas del formulario masivo (inicia con 3 filas vacías)
  const [filas, setFilas] = useState<FilaProductoMasivo[]>([
    crearFilaVacia(),
    crearFilaVacia(),
    crearFilaVacia(),
  ]);

  // Estados de proceso de guardado
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [progreso, setProgreso] = useState<{
    actual: number;
    total: number;
    exitosos: number;
    fallidos: number;
  }>({ actual: 0, total: 0, exitosos: 0, fallidos: 0 });

  const [resumenGuardado, setResumenGuardado] = useState<{
    totalProcesados: number;
    exitosos: number;
    fallidos: number;
  } | null>(null);

  // Cargar categorías disponibles
  useEffect(() => {
    let isMounted = true;
    async function loadCategorias() {
      try {
        setIsLoadingCategorias(true);
        const data = await obtenerCategorias(token);
        if (isMounted) setCategorias(data || []);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      } finally {
        if (isMounted) setIsLoadingCategorias(false);
      }
    }
    loadCategorias();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Manejadores para manipular filas
  const handleActualizarCampo = (
    id: string,
    campo: keyof FilaProductoMasivo,
    valor: string
  ) => {
    setFilas((prev) =>
      prev.map((fila) => {
        if (fila.id !== id) return fila;
        const nuevosErrores = { ...fila.erroresCampos };
        delete nuevosErrores[campo as string];
        return {
          ...fila,
          [campo]: valor,
          erroresCampos: nuevosErrores,
          mensajeError: undefined,
          estado: fila.estado === "error" ? "idle" : fila.estado,
        };
      })
    );
  };

  const handleAgregarFila = (cantidad = 1) => {
    const defaultCat = categorias.length > 0 ? String(categorias[0].id) : "";
    const nuevasFilas = Array.from({ length: cantidad }, () =>
      crearFilaVacia(defaultCat)
    );
    setFilas((prev) => [...prev, ...nuevasFilas]);
  };

  const handleDuplicarFila = (index: number) => {
    const filaOriginal = filas[index];
    if (!filaOriginal) return;

    const nuevaFila: FilaProductoMasivo = {
      ...filaOriginal,
      id: generarIdFila(),
      nombre: filaOriginal.nombre ? `${filaOriginal.nombre} (Copia)` : "",
      codigo_barras: "", // El código de barras debe ser único, no se copia
      estado: "idle",
      mensajeError: undefined,
      erroresCampos: {},
    };

    const copia = [...filas];
    copia.splice(index + 1, 0, nuevaFila);
    setFilas(copia);
  };

  const handleEliminarFila = (id: string) => {
    if (filas.length <= 1) {
      // Si es la única fila, solo la reiniciamos
      setFilas([crearFilaVacia()]);
      return;
    }
    setFilas((prev) => prev.filter((f) => f.id !== id));
  };

  // Validación local individual por fila
  const validarFilas = (): boolean => {
    let esValido = true;
    const nuevasFilas = filas.map((fila) => {
      const errores: Record<string, string> = {};

      if (!fila.nombre.trim()) {
        errores.nombre = "El nombre es obligatorio.";
      }
      if (!fila.categoria_id || Number(fila.categoria_id) <= 0) {
        errores.categoria_id = "Selecciona una categoría.";
      }

      const pCompra = Number(fila.precio_compra);
      if (fila.precio_compra === "" || isNaN(pCompra) || pCompra < 0) {
        errores.precio_compra = "Precio de compra inválido (>= 0).";
      }

      const pVenta = Number(fila.precio_venta);
      if (fila.precio_venta === "" || isNaN(pVenta) || pVenta < 0) {
        errores.precio_venta = "Precio de venta inválido (>= 0).";
      }

      const stockActual = Number(fila.stock_actual);
      if (fila.stock_actual === "" || isNaN(stockActual) || stockActual < 0) {
        errores.stock_actual = "Stock inválido (>= 0).";
      }

      if (fila.stock_minimo !== "") {
        const stockMin = Number(fila.stock_minimo);
        if (isNaN(stockMin) || stockMin < 0) {
          errores.stock_minimo = "Mínimo inválido (>= 0).";
        }
      }

      if (fila.presentacion_ml !== "") {
        const ml = Number(fila.presentacion_ml);
        if (isNaN(ml) || ml < 0) {
          errores.presentacion_ml = "Volumen numérico (ej. 750).";
        }
      }

      if (Object.keys(errores).length > 0) {
        esValido = false;
        return {
          ...fila,
          estado: "error" as const,
          erroresCampos: errores,
          mensajeError: "Corrige los campos obligatorios marcados en rojo.",
        };
      }

      return {
        ...fila,
        erroresCampos: {},
        mensajeError: undefined,
      };
    });

    setFilas(nuevasFilas);
    return esValido;
  };

  // Procesamiento secuencial de guardado
  const handleGuardarLote = async () => {
    setResumenGuardado(null);

    // 1. Validar cliente
    const valido = validarFilas();
    if (!valido) {
      return;
    }

    setIsSaving(true);
    const total = filas.length;
    let exitososCount = 0;
    let fallidosCount = 0;

    setProgreso({ actual: 0, total, exitosos: 0, fallidos: 0 });

    const filasResultado = [...filas];

    for (let i = 0; i < total; i++) {
      const fila = filasResultado[i];
      setProgreso({
        actual: i + 1,
        total,
        exitosos: exitososCount,
        fallidos: fallidosCount,
      });

      // Marcar fila como guardando
      filasResultado[i] = { ...fila, estado: "guardando" };
      setFilas([...filasResultado]);

      const payload: ProductoPayload = {
        nombre: fila.nombre.trim(),
        marca: fila.marca.trim() || null,
        categoria_id: Number(fila.categoria_id),
        codigo_barras: fila.codigo_barras.trim() || null,
        presentacion_ml: fila.presentacion_ml.trim()
          ? String(fila.presentacion_ml.trim())
          : null,
        precio_compra: Number(fila.precio_compra),
        precio_venta: Number(fila.precio_venta),
        stock_actual: Number(fila.stock_actual) || 0,
        stock_minimo: Number(fila.stock_minimo) || 5,
        ubicacion: fila.ubicacion.trim() || null,
      };

      try {
        await crearProducto(payload, token);
        exitososCount++;
        filasResultado[i] = {
          ...fila,
          estado: "exito",
          mensajeError: undefined,
          erroresCampos: {},
        };
      } catch (err: unknown) {
        fallidosCount++;
        let msgError = "Error al guardar este producto.";
        const erroresCampos: Record<string, string> = {};

        if (err instanceof ValidationError) {
          msgError = err.message || "Datos no válidos.";
          if (err.errors) {
            Object.entries(err.errors).forEach(([field, messages]) => {
              const message = Array.isArray(messages)
                ? messages[0]
                : String(messages);
              erroresCampos[field] = message;
            });
          }
        } else if (err instanceof Error) {
          msgError = err.message;
        }

        filasResultado[i] = {
          ...fila,
          estado: "error",
          mensajeError: msgError,
          erroresCampos,
        };
      }

      setFilas([...filasResultado]);
    }

    setIsSaving(false);
    setResumenGuardado({
      totalProcesados: total,
      exitosos: exitososCount,
      fallidos: fallidosCount,
    });

    // Si todos fueron exitosos, redirigir al catálogo
    if (fallidosCount === 0 && exitososCount > 0) {
      setTimeout(() => {
        router.push("/productos?created=1");
      }, 1200);
    } else if (exitososCount > 0) {
      // Remover de la tabla las filas que ya se guardaron exitosamente,
      // dejando únicamente las que fallaron para que el usuario las corrija y reintente
      setFilas((prev) => prev.filter((f) => f.estado === "error"));
    }
  };

  return (
    <ProtectedByRole modulo="productos" requiereEscritura={true}>
      <DashboardLayout>
        <div className="space-y-6 pb-16">
          {/* ========================================================================= */}
          {/* BREADCRUMB & ENCABEZADO                                                   */}
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
                href="/productos"
                className="hover:text-slate-900 transition-colors"
              >
                Productos
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-brand">Carga Masiva</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <Link
                  href="/productos"
                  className="p-2 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:text-brand hover:border-brand/40 transition-all shadow-2xs cursor-pointer"
                  title="Volver al catálogo"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                      Carga Masiva de Productos
                    </h1>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--primary-brand)]/10 text-[var(--primary-brand)]">
                      <Layers className="w-3 h-3" />
                      Lote de productos
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Registra múltiples licores y bebidas en una sola operación.
                    Puedes agregar, duplicar y eliminar filas dinámicamente.
                  </p>
                </div>
              </div>

              {/* Acciones superiores */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAgregarFila(1)}
                  disabled={isSaving}
                  className="text-xs font-semibold gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar fila</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAgregarFila(5)}
                  disabled={isSaving}
                  className="text-xs font-semibold gap-1.5 shadow-2xs hidden md:inline-flex"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>+5 filas</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BANNERS INFORMATIVOS Y DE ESTADO                                          */}
          {/* ========================================================================= */}
          {/* Alerta de progreso en ejecución */}
          {isSaving && (
            <div className="p-4 rounded-2xl bg-white border border-brand/30 shadow-md space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  <span>
                    Guardando producto {progreso.actual} de {progreso.total}...
                  </span>
                </div>
                <span className="font-mono text-slate-500 font-semibold">
                  {Math.round((progreso.actual / (progreso.total || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[var(--primary-brand)] h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      (progreso.actual / (progreso.total || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Resumen post guardado con errores parciales */}
          {resumenGuardado && (
            <div
              className={`p-4 rounded-2xl border shadow-xs space-y-1.5 ${
                resumenGuardado.fallidos === 0
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-200 text-amber-950"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {resumenGuardado.fallidos === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <span>
                  {resumenGuardado.fallidos === 0
                    ? `¡Éxito! Se crearon los ${resumenGuardado.exitosos} productos correctamente.`
                    : `${resumenGuardado.exitosos} producto(s) creados con éxito. ${resumenGuardado.fallidos} producto(s) fallaron.`}
                </span>
              </div>
              {resumenGuardado.fallidos > 0 && (
                <p className="text-xs text-amber-800/90 pl-7">
                  Las filas guardadas fueron retiradas de la lista. Corrige los
                  errores indicados abajo en las filas restantes y haz clic en
                  &quot;Guardar productos pendientes&quot;.
                </p>
              )}
            </div>
          )}

          {/* Banner de ayuda rápida */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-800">Consejos de llenado</p>
              <p className="text-[11px] text-slate-500">
                Campos obligatorios: <strong>Nombre</strong>, <strong>Categoría</strong>, <strong>Precio Compra</strong>, <strong>Precio Venta</strong> y <strong>Stock</strong>. Puedes usar el botón de copiar <Copy className="w-3 h-3 inline text-slate-400" /> para duplicar una fila con sus valores base y acelerar la carga.
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TABLA / FORMULARIO DE FILAS DINÁMICAS                                     */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1050px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 min-w-[200px]">
                      Nombre del Producto <span className="text-rose-500">*</span>
                    </th>
                    <th className="py-3 px-3 min-w-[140px]">
                      Marca / Destilería
                    </th>
                    <th className="py-3 px-3 min-w-[160px]">
                      Categoría <span className="text-rose-500">*</span>
                    </th>
                    <th className="py-3 px-3 min-w-[130px]">Cód. Barras</th>
                    <th className="py-3 px-3 min-w-[100px]">Presentación</th>
                    <th className="py-3 px-3 min-w-[105px]">
                      P. Compra <span className="text-rose-500">*</span>
                    </th>
                    <th className="py-3 px-3 min-w-[105px]">
                      P. Venta <span className="text-rose-500">*</span>
                    </th>
                    <th className="py-3 px-3 min-w-[85px]">
                      Stock <span className="text-rose-500">*</span>
                    </th>
                    <th className="py-3 px-3 min-w-[80px]">Mín.</th>
                    <th className="py-3 px-3 min-w-[120px]">Ubicación</th>
                    <th className="py-3 px-3 w-20 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filas.map((fila, index) => {
                    const tieneError =
                      fila.estado === "error" ||
                      Object.keys(fila.erroresCampos).length > 0;
                    const esGuardando = fila.estado === "guardando";
                    const esExito = fila.estado === "exito";

                    return (
                      <React.Fragment key={fila.id}>
                        <tr
                          className={`transition-colors ${
                            esGuardando
                              ? "bg-blue-50/40"
                              : esExito
                              ? "bg-emerald-50/40"
                              : tieneError
                              ? "bg-rose-50/30"
                              : "hover:bg-slate-50/60"
                          }`}
                        >
                          {/* Número de fila / Estado */}
                          <td className="py-3 px-3 text-center text-slate-400 font-mono font-medium">
                            {esGuardando ? (
                              <Loader2 className="w-4 h-4 animate-spin text-brand mx-auto" />
                            ) : esExito ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : tieneError ? (
                              <AlertTriangle className="w-4 h-4 text-rose-500 mx-auto" />
                            ) : (
                              index + 1
                            )}
                          </td>

                          {/* Nombre */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              placeholder="Ej. Ron Flor de Caña 12"
                              value={fila.nombre}
                              disabled={isSaving}
                              onChange={(e) =>
                                handleActualizarCampo(
                                  fila.id,
                                  "nombre",
                                  e.target.value
                                )
                              }
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs text-slate-900 bg-white outline-none transition-all ${
                                fila.erroresCampos.nombre
                                  ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20"
                                  : "border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/15"
                              }`}
                            />
                            {fila.erroresCampos.nombre && (
                              <p className="text-[10px] text-rose-600 font-medium mt-0.5 leading-tight">
                                {fila.erroresCampos.nombre}
                              </p>
                            )}
                          </td>

                          {/* Marca */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              placeholder="Ej. Flor de Caña"
                              value={fila.marca}
                              disabled={isSaving}
                              onChange={(e) =>
                                handleActualizarCampo(
                                  fila.id,
                                  "marca",
                                  e.target.value
                                )
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-xs text-slate-900 bg-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all"
                            />
                          </td>

                          {/* Categoría */}
                          <td className="py-2 px-2">
                            <select
                              value={fila.categoria_id}
                              disabled={isSaving || isLoadingCategorias}
                              onChange={(e) =>
                                handleActualizarCampo(
                                  fila.id,
                                  "categoria_id",
                                  e.target.value
                                )
                              }
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs text-slate-900 bg-white outline-none transition-all cursor-pointer ${
                                fila.erroresCampos.categoria_id
                                  ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20"
                                  : "border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/15"
                              }`}
                            >
                              <option value="">Selecciona...</option>
                              {categorias.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.nombre}
                                </option>
                              ))}
                            </select>
                            {fila.erroresCampos.categoria_id && (
                              <p className="text-[10px] text-rose-600 font-medium mt-0.5 leading-tight">
                                {fila.erroresCampos.categoria_id}
                              </p>
                            )}
                          </td>

                          {/* Código de barras */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              placeholder="EAN / UPC"
                              value={fila.codigo_barras}
                              disabled={isSaving}
                              onChange={(e) =>
                                handleActualizarCampo(
                                  fila.id,
                                  "codigo_barras",
                                  e.target.value
                                )
                              }
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs font-mono text-slate-900 bg-white outline-none transition-all ${
                                fila.erroresCampos.codigo_barras
                                  ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20"
                                  : "border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/15"
                              }`}
                            />
                            {fila.erroresCampos.codigo_barras && (
                              <p className="text-[10px] text-rose-600 font-medium mt-0.5 leading-tight">
                                {fila.erroresCampos.codigo_barras}
                              </p>
                            )}
                          </td>

                          {/* Presentación en ML */}
                          <td className="py-2 px-2">
                            <div className="relative">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="750"
                                value={fila.presentacion_ml}
                                disabled={isSaving}
                                onChange={(e) =>
                                  handleActualizarCampo(
                                    fila.id,
                                    "presentacion_ml",
                                    e.target.value
                                  )
                                }
                                className={`w-full px-2 py-1.5 pr-6 rounded-lg border text-xs text-slate-900 bg-white outline-none transition-all ${
                                  fila.erroresCampos.presentacion_ml
                                    ? "border-rose-400 bg-rose-50/20"
                                    : "border-slate-200 hover:border-slate-300 focus:border-brand"
                                }`}
                              />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                                ml
                              </span>
                            </div>
                          </td>

                          {/* Precio de Compra */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={fila.precio_compra}
                              disabled={isSaving}
                              onChange={(e) =>
                                handleActualizarCampo(
                                  fila.id,
                                  "precio_compra",
                                  e.target.value
                                )
                              }
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs font-mono text-slate-900 bg-white outline-none transition-all ${
                                fila.erroresCampos.precio_compra
                                  ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20"
                                  : "border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/15"
                              }`}
                            />
                            {fila.erroresCampos.precio_compra && (
                              <p className="text-[10px] text-rose-600 font-medium mt-0.5 leading-tight">
                                {fila.erroresCampos.precio_compra}
                              </p>
                            )}
                          </td>

                          {/* Precio de Venta */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={fila.precio_venta}
                              disabled={isSaving}
                              onChange={(e) =>
                                handleActualizarCampo(
                                  fila.id,
                                  "precio_venta",
                                  e.target.value
                                )
                              }
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs font-mono font-bold text-slate-900 bg-white outline-none transition-all ${
                                fila.erroresCampos.precio_venta
                                  ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20"
                                  : "border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/15"
                              }`}
                            />
                            {fila.erroresCampos.precio_venta && (
                              <p className="text-[10px] text-rose-600 font-medium mt-0.5 leading-tight">
                                {fila.erroresCampos.precio_venta}
                              </p>
                            )}
                          </td>

                          {/* Stock Actual */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              placeholder="0"
                              value={fila.stock_actual}
                              disabled={isSaving}
                              onChange={(e) =>
                                handleActualizarCampo(
                                  fila.id,
                                  "stock_actual",
                                  e.target.value
                                )
                              }
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs text-center font-bold text-slate-900 bg-white outline-none transition-all ${
                                fila.erroresCampos.stock_actual
                                  ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400/20"
                                  : "border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/15"
                              }`}
                            />
                          </td>

                          {/* Stock Mínimo */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              placeholder="5"
                              value={fila.stock_minimo}
                              disabled={isSaving}
                              onChange={(e) =>
                                handleActualizarCampo(
                                  fila.id,
                                  "stock_minimo",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-xs text-center text-slate-700 bg-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all"
                            />
                          </td>

                          {/* Ubicación */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              placeholder="Ej. Estante A"
                              value={fila.ubicacion}
                              disabled={isSaving}
                              onChange={(e) =>
                                handleActualizarCampo(
                                  fila.id,
                                  "ubicacion",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-xs text-slate-700 bg-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all"
                            />
                          </td>

                          {/* Acciones de fila */}
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDuplicarFila(index)}
                                disabled={isSaving}
                                className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-lg transition-colors cursor-pointer"
                                title="Duplicar fila"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarFila(fila.id)}
                                disabled={isSaving}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar fila"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Mensaje de error general de la fila si falló en backend */}
                        {fila.mensajeError && (
                          <tr className="bg-rose-50/60 border-b border-rose-100">
                            <td colSpan={12} className="py-1.5 px-4">
                              <div className="flex items-center gap-2 text-rose-700 text-[11px] font-medium">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>
                                  Fila {index + 1}: {fila.mensajeError}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pie de tabla con botón para añadir más filas */}
            <div className="p-3 bg-slate-50/70 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAgregarFila(1)}
                  disabled={isSaving}
                  className="text-xs font-semibold gap-1.5 bg-white shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar otra fila</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAgregarFila(5)}
                  disabled={isSaving}
                  className="text-xs font-semibold gap-1.5 bg-white shadow-2xs"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>+ Agregar 5 filas</span>
                </Button>
              </div>
              <span className="font-medium text-slate-600">
                Total de productos en lista:{" "}
                <strong className="text-slate-900 font-bold">
                  {filas.length}
                </strong>
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BARRA DE ACCIONES INFERIOR                                                */}
          {/* ========================================================================= */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
            <Link
              href="/productos"
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <span>Volver a Productos</span>
            </Link>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                size="md"
                onClick={handleGuardarLote}
                isLoading={isSaving}
                disabled={filas.length === 0}
                className="w-full sm:w-auto shadow-sm gap-2 text-xs font-bold"
                style={{
                  boxShadow:
                    "0 2px 8px color-mix(in srgb, var(--primary-brand) 30%, transparent)",
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      Guardando {progreso.actual} de {progreso.total}...
                    </span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>
                      {resumenGuardado && resumenGuardado.fallidos > 0
                        ? `Guardar productos pendientes (${filas.length})`
                        : `Guardar ${filas.length} producto${
                            filas.length > 1 ? "s" : ""
                          }`}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
