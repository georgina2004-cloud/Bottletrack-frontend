"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Producto, ProductoPayload, Categoria } from "@/types/producto";
import {
  obtenerCategorias,
  ValidationError,
  buscarProductoPorCodigo,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Package,
  DollarSign,
  Layers,
  MapPin,
  Barcode,
  Save,
  X,
  AlertTriangle,
  TrendingUp,
  Tag,
  Loader2,
  AlertCircle,
  Edit3,
  ImagePlus,
  Trash2,
  Boxes,
  Droplets,
} from "lucide-react";
import { PresentacionesManager } from "@/components/productos/PresentacionesManager";

/**
 * Esquema de validación con Zod para creación y edición de productos
 */
export const productoFormSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre del producto es obligatorio.")
    .max(255, "El nombre no puede exceder 255 caracteres."),
  marca: z
    .string()
    .trim()
    .max(100, "La marca no puede exceder 100 caracteres.")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  codigo_barras: z
    .string()
    .trim()
    .max(64, "El código de barras no puede exceder 64 caracteres.")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  categoria_id: z
    .coerce
    .number()
    .min(1, "Debes seleccionar una categoría válida."),
  precio_compra: z
    .coerce
    .number()
    .min(0, "El precio de compra no puede ser negativo."),
  precio_venta: z
    .coerce
    .number()
    .min(0, "El precio de venta no puede ser negativo."),
  stock_actual: z
    .coerce
    .number()
    .int("El stock actual debe ser un número entero.")
    .min(0, "El stock actual no puede ser negativo."),
  stock_minimo: z
    .coerce
    .number()
    .int("El stock mínimo debe ser un número entero.")
    .min(0, "El stock mínimo no puede ser negativo."),
  stock_maximo: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z
      .number()
      .int("El stock máximo debe ser un número entero.")
      .min(0, "El stock máximo no puede ser negativo.")
      .nullable()
      .optional()
  ),
  presentacion_ml: z
    .string()
    .trim()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      "Ingresa solo el valor numérico (ej. 750)."
    )
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  ubicacion: z
    .string()
    .trim()
    .max(100, "La ubicación no puede exceder 100 caracteres.")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type ProductoFormData = z.input<typeof productoFormSchema>;

interface ProductoFormProps {
  initialData?: Producto | null;
  isEditing?: boolean;
  onSubmit: (data: FormData) => Promise<void>;
  isLoadingProduct?: boolean;
}

export function ProductoForm({
  initialData,
  isEditing = false,
  onSubmit,
  isLoadingProduct = false,
}: ProductoFormProps) {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState<boolean>(true);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Estados para búsqueda por código de barras (pistola lectora / USB)
  const [isSearchingCodigo, setIsSearchingCodigo] = useState<boolean>(false);
  const [productoExistente, setProductoExistente] = useState<Producto | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // ─── Estados para imagen ────────────────────────────────────────────────────
  /** Archivo seleccionado por el usuario (nuevo, aún no subido) */
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  /** URL de previsualización generada con createObjectURL */
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  /** Si el usuario quiere quitar la imagen actual del servidor */
  const [quitarImagenExistente, setQuitarImagenExistente] = useState<boolean>(false);
  const imagenInputRef = useRef<HTMLInputElement>(null);
  // ───────────────────────────────────────────────────────────────────────────

  const selectId = useId();

  // ─── Estado para selector de unidad de volumen (ml / L) ───────────────────
  const [unidadVolumen, setUnidadVolumen] = useState<"ml" | "L">("ml");

  const {
    register,
    handleSubmit,
    watch,
    setError,
    reset,
    setFocus,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductoFormData>({
    resolver: zodResolver(productoFormSchema),
    defaultValues: {
      nombre: "",
      marca: "",
      codigo_barras: "",
      categoria_id: undefined as unknown as number,
      precio_compra: "" as unknown as number,
      precio_venta: "" as unknown as number,
      stock_actual: 0,
      stock_minimo: 5,
      stock_maximo: null,
      presentacion_ml: "",
      ubicacion: "",
    },
  });

  const handleCambiarUnidad = (nuevaUnidad: "ml" | "L") => {
    if (nuevaUnidad === unidadVolumen) return;
    const currentVal = getValues("presentacion_ml");
    if (currentVal && !isNaN(Number(currentVal))) {
      const num = Number(currentVal);
      if (nuevaUnidad === "L") {
        // De ml a L: ej. 750 -> 0.75, 1000 -> 1
        const enLitros = Math.round((num / 1000) * 1000) / 1000;
        setValue("presentacion_ml", String(enLitros), { shouldValidate: true });
      } else {
        // De L a ml: ej. 0.75 -> 750, 1.5 -> 1500
        const enMl = Math.round(num * 1000 * 100) / 100;
        setValue("presentacion_ml", String(enMl), { shouldValidate: true });
      }
    }
    setUnidadVolumen(nuevaUnidad);
  };

  // Auto-enfocar el campo de código de barras en modo creación
  useEffect(() => {
    if (!isEditing) {
      const timer = setTimeout(() => {
        setFocus("codigo_barras");
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isEditing, setFocus]);

  // Cargar categorías disponibles desde el backend
  useEffect(() => {
    let isMounted = true;
    async function loadCategorias() {
      try {
        setIsLoadingCategorias(true);
        const res = await obtenerCategorias({ per_page: 100 }, token);
        if (isMounted) {
          setCategorias(res.data || []);
        }
      } catch (err) {
        console.error("Error al cargar categorías:", err);
      } finally {
        if (isMounted) {
          setIsLoadingCategorias(false);
        }
      }
    }
    loadCategorias();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Precargar datos si estamos en modo edición
  useEffect(() => {
    if (initialData) {
      reset({
        nombre: initialData.nombre || "",
        marca: initialData.marca || "",
        codigo_barras: initialData.codigo_barras || "",
        categoria_id: initialData.categoria_id,
        precio_compra: initialData.precio_compra ? Number(initialData.precio_compra) : 0,
        precio_venta: initialData.precio_venta ? Number(initialData.precio_venta) : 0,
        stock_actual: initialData.stock_actual ?? 0,
        stock_minimo: initialData.stock_minimo ?? 0,
        stock_maximo: initialData.stock_maximo ?? null,
        presentacion_ml: initialData.presentacion_ml || "",
        ubicacion: initialData.ubicacion || "",
      });
      setUnidadVolumen("ml");
      // Limpiar imagen seleccionada localmente al recargar datos iniciales
      setImagenFile(null);
      setImagenPreview(null);
      setQuitarImagenExistente(false);
    }
  }, [initialData, reset]);

  // Limpiar object URL al desmontar o cuando cambia la imagen
  useEffect(() => {
    return () => {
      if (imagenPreview && imagenPreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagenPreview);
      }
    };
  }, [imagenPreview]);

  // Observar precios para calcular margen de ganancia en vivo
  const watchedPrecioCompra = watch("precio_compra");
  const watchedPrecioVenta = watch("precio_venta");

  const margenCalculado = React.useMemo(() => {
    const compra = Number(watchedPrecioCompra);
    const venta = Number(watchedPrecioVenta);
    if (!isNaN(compra) && !isNaN(venta) && venta > 0 && compra >= 0) {
      const margen = ((venta - compra) / venta) * 100;
      const ganancia = venta - compra;
      return { margen: margen.toFixed(1), ganancia: ganancia.toFixed(2) };
    }
    return null;
  }, [watchedPrecioCompra, watchedPrecioVenta]);

  // Manejo de selección de imagen
  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño máximo 2MB
    if (file.size > 2 * 1024 * 1024) {
      setGeneralError("La imagen no puede superar 2 MB. Selecciona una imagen más pequeña.");
      // Reset input
      if (imagenInputRef.current) imagenInputRef.current.value = "";
      return;
    }

    // Revocar URL anterior si existe
    if (imagenPreview && imagenPreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagenPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setImagenFile(file);
    setImagenPreview(previewUrl);
    setQuitarImagenExistente(false);
    setGeneralError(null);
  };

  const handleQuitarImagen = () => {
    if (imagenPreview && imagenPreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagenPreview);
    }
    setImagenFile(null);
    setImagenPreview(null);
    if (imagenInputRef.current) imagenInputRef.current.value = "";
    // Si estamos en edición y había imagen del servidor, marcamos para quitar
    if (isEditing && initialData?.imagen_url && !imagenFile) {
      setQuitarImagenExistente(true);
    }
  };

  // Manejo de lectura de código de barras / QR con pistola lectora USB o teclado
  const handleCodigoKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isEditing) return;

    if (e.key === "Enter") {
      e.preventDefault();
      const codigo = (e.currentTarget.value || "").trim();

      if (!codigo) {
        setFocus("nombre");
        return;
      }

      setProductoExistente(null);
      setSearchError(null);
      setIsSearchingCodigo(true);

      try {
        const prod = await buscarProductoPorCodigo(codigo, token);
        if (prod) {
          setProductoExistente(prod);
        } else {
          setProductoExistente(null);
          setSearchError(null);
          setFocus("nombre");
        }
      } catch (err: unknown) {
        console.error("Error al consultar código de barras:", err);
        setProductoExistente(null);
        setSearchError("No se pudo verificar el código, continúa manualmente.");
        setFocus("nombre");
      } finally {
        setIsSearchingCodigo(false);
      }
    }
  };

  const handleFormSubmit = async (data: ProductoFormData) => {
    setGeneralError(null);

    try {
      const payload: ProductoPayload = {
        nombre: data.nombre.trim(),
        marca: data.marca ? data.marca.trim() : null,
        codigo_barras: data.codigo_barras ? data.codigo_barras.trim() : null,
        categoria_id: Number(data.categoria_id),
        precio_compra: Number(data.precio_compra),
        precio_venta: Number(data.precio_venta),
        stock_actual: Number(data.stock_actual),
        stock_minimo: Number(data.stock_minimo),
        stock_maximo:
          data.stock_maximo !== null && data.stock_maximo !== undefined && data.stock_maximo !== ("" as unknown as number)
            ? Number(data.stock_maximo)
            : null,
        presentacion_ml: (() => {
          if (!data.presentacion_ml || data.presentacion_ml.trim() === "") return null;
          const numVal = Number(data.presentacion_ml.trim());
          if (isNaN(numVal) || numVal <= 0) return null;
          if (unidadVolumen === "L") {
            return String(Math.round(numVal * 1000 * 100) / 100);
          }
          return String(numVal);
        })(),
        ubicacion: data.ubicacion ? data.ubicacion.trim() : null,
      };

      // Construir FormData con todos los campos del producto
      const formData = new FormData();

      // Campos de texto
      formData.append("nombre", payload.nombre);
      if (payload.marca) formData.append("marca", payload.marca);
      if (payload.codigo_barras) formData.append("codigo_barras", payload.codigo_barras);
      formData.append("categoria_id", String(payload.categoria_id));
      formData.append("precio_compra", String(payload.precio_compra));
      formData.append("precio_venta", String(payload.precio_venta));
      formData.append("stock_actual", String(payload.stock_actual));
      formData.append("stock_minimo", String(payload.stock_minimo));
      if (payload.stock_maximo !== null && payload.stock_maximo !== undefined) {
        formData.append("stock_maximo", String(payload.stock_maximo));
      }
      if (payload.presentacion_ml) formData.append("presentacion_ml", payload.presentacion_ml);
      if (payload.ubicacion) formData.append("ubicacion", payload.ubicacion);

      // Imagen: agregar archivo si se seleccionó uno nuevo
      if (imagenFile) {
        formData.append("imagen", imagenFile);
      }

      // Si se marcó quitar imagen existente (en edición sin nueva imagen)
      if (quitarImagenExistente && !imagenFile) {
        formData.append("quitar_imagen", "1");
      }

      // Laravel method spoofing para PUT (cuando se usa FormData en edición)
      if (isEditing) {
        formData.append("_method", "PUT");
      }

      await onSubmit(formData);
    } catch (err: unknown) {
      if (err instanceof ValidationError) {
        if (err.errors && Object.keys(err.errors).length > 0) {
          Object.entries(err.errors).forEach(([field, messages]) => {
            const fieldName = field as keyof ProductoFormData;
            const message = Array.isArray(messages) ? messages[0] : String(messages);
            setError(fieldName, {
              type: "server",
              message,
            });
          });
        }
        setGeneralError(err.message || "Por favor corrige los errores señalados en el formulario.");
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError("Ocurrió un error inesperado al guardar el producto. Intenta nuevamente.");
      }
    }
  };

  // Preview de imagen a mostrar: primero local (seleccionada), luego la del servidor
  const imagenMostrada = imagenPreview
    ?? (quitarImagenExistente ? null : initialData?.imagen_url ?? null);

  if (isLoadingProduct) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-10 bg-slate-100 rounded-lg" />
          <div className="h-10 bg-slate-100 rounded-lg" />
          <div className="h-10 bg-slate-100 rounded-lg" />
          <div className="h-10 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-20 bg-slate-100 rounded-lg" />
      </div>
    );
  }

  const codigoRegister = register("codigo_barras");

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Banner de error general del servidor */}
      {generalError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-2xs"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Atención requerida</p>
            <p className="text-rose-700 text-xs mt-0.5">{generalError}</p>
          </div>
        </div>
      )}

      {/* Banner de alerta: Producto ya registrado detectado por escáner de código */}
      {productoExistente && (
        <div
          role="alert"
          className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100/90 text-amber-800 rounded-xl shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-amber-950">
                    Este producto ya está registrado
                  </p>
                  {productoExistente.codigo_barras && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 font-mono font-medium">
                      {productoExistente.codigo_barras}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-amber-900">
                  {productoExistente.nombre}
                  {productoExistente.categoria?.nombre
                    ? ` • Categoría: ${productoExistente.categoria.nombre}`
                    : ""}
                </p>
                <p className="text-xs text-amber-800/80">
                  Para evitar duplicados accidentales, no se completó el formulario con estos datos. Si deseas actualizarlo, puedes editarlo directamente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProductoExistente(null)}
              className="text-amber-700 hover:text-amber-900 p-1.5 rounded-lg hover:bg-amber-200/50 transition-colors shrink-0 cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3.5 pt-3 border-t border-amber-200/70 flex items-center justify-end">
            <Link href={`/productos/${productoExistente.id}/editar`}>
              <Button
                type="button"
                size="sm"
                className="text-xs font-semibold gap-1.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ir a editar este producto</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Banner de aviso: Error de conexión o servidor al consultar código */}
      {searchError && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{searchError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSearchError(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 1: INFORMACIÓN BÁSICA DEL PRODUCTO                                 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
          <span className="p-1.5 bg-brand/10 text-brand rounded-lg">
            <Package className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#18181B]">
              Información General
            </h3>
            <p className="text-xs text-slate-500">
              Datos principales para la identificación del licor o bebida
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Nombre del Producto */}
          <div className="md:col-span-2">
            <Input
              label="Nombre del Producto"
              placeholder="Ej: Ron Flor de Caña 12 Años"
              required
              error={errors.nombre?.message}
              {...register("nombre")}
            />
          </div>

          {/* Marca */}
          <div>
            <Input
              label="Marca / Destilería"
              placeholder="Ej: Flor de Caña"
              leftIcon={<Tag className="w-4 h-4" />}
              error={errors.marca?.message}
              helperText="Opcional. Fabricante o marca comercial"
              {...register("marca")}
            />
          </div>

          {/* Categoría (Select dinámico) */}
          <div className="w-full space-y-1.5 text-left">
            <label
              htmlFor={selectId}
              className="block text-sm font-medium text-slate-700 tracking-tight"
            >
              Categoría <span className="text-brand ml-1" title="Campo requerido">*</span>
            </label>
            <div className="relative">
              <select
                id={selectId}
                disabled={isLoadingCategorias}
                className={`
                  w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#18181B]
                  transition-all duration-150 ease-in-out outline-none cursor-pointer
                  ${
                    errors.categoria_id
                      ? "border-rose-300 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15"
                      : "border-slate-300 hover:border-slate-400 focus:border-brand focus:ring-3 focus:ring-brand/15"
                  }
                  ${isLoadingCategorias ? "bg-slate-50 text-slate-400 cursor-wait" : ""}
                `}
                {...register("categoria_id")}
              >
                <option value="">
                  {isLoadingCategorias
                    ? "Cargando categorías..."
                    : "Selecciona una categoría"}
                </option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            {errors.categoria_id && (
              <p className="text-xs text-rose-600 font-medium">
                {errors.categoria_id.message}
              </p>
            )}
          </div>

          {/* Código de Barras */}
          <div>
            <Input
              label="Código de Barras (EAN / UPC)"
              placeholder="Ej: 741100123456"
              leftIcon={<Barcode className="w-4 h-4" />}
              autoFocus={!isEditing}
              error={errors.codigo_barras?.message}
              helperText={
                isSearchingCodigo
                  ? "Buscando producto en el catálogo..."
                  : !isEditing
                  ? "Escanea con la pistola o presiona Enter para verificar duplicados"
                  : "Código numérico impreso en la botella"
              }
              className={isSearchingCodigo ? "pr-28" : ""}
              rightElement={
                isSearchingCodigo ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-brand bg-brand/5 rounded-md mr-1 border border-brand/20">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline text-[11px]">Buscando...</span>
                  </div>
                ) : undefined
              }
              {...codigoRegister}
              onKeyDown={handleCodigoKeyDown}
              onChange={(e) => {
                codigoRegister.onChange(e);
                if (productoExistente) setProductoExistente(null);
                if (searchError) setSearchError(null);
              }}
            />
          </div>

          {/* Presentación en ML / Litros */}
          <div>
            <Input
              type="number"
              step="any"
              min="0"
              label="Presentación / Volumen"
              placeholder={unidadVolumen === "ml" ? "Ej: 750" : "Ej: 0.75"}
              leftIcon={<Droplets className="w-4 h-4" />}
              error={errors.presentacion_ml?.message}
              helperText={
                unidadVolumen === "L"
                  ? "Se convertirá automáticamente a mililitros (ej: 1.5 L → 1500 ml)"
                  : "Capacidad o volumen neto en mililitros (ej: 750 para botella, 355 para lata)"
              }
              className="pr-20"
              rightElement={
                <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200/80 mr-1 text-[11px] font-semibold text-slate-600">
                  <button
                    type="button"
                    onClick={() => handleCambiarUnidad("ml")}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      unidadVolumen === "ml"
                        ? "bg-white text-brand shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ml
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCambiarUnidad("L")}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      unidadVolumen === "L"
                        ? "bg-white text-brand shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    L
                  </button>
                </div>
              }
              {...register("presentacion_ml")}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN DE IMAGEN DEL PRODUCTO                                            */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
          <span className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
            <ImagePlus className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#18181B]">
              Imagen del Producto
            </h3>
            <p className="text-xs text-slate-500">
              Foto de la botella o lata (JPG, PNG, WebP · máx. 2 MB)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Vista previa */}
          <div className="shrink-0">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative group">
              {imagenMostrada ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagenMostrada}
                    alt="Vista previa del producto"
                    className="w-full h-full object-contain p-2"
                  />
                  <button
                    type="button"
                    onClick={handleQuitarImagen}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                    title="Quitar imagen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300 px-2 text-center">
                  <ImagePlus className="w-8 h-8" />
                  <span className="text-[10px] font-medium leading-tight">
                    Sin imagen
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Controles de carga */}
          <div className="flex-1 space-y-3">
            <div>
              <label
                htmlFor="imagen-producto-input"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-brand hover:text-brand transition-colors cursor-pointer shadow-2xs"
              >
                <ImagePlus className="w-4 h-4" />
                <span>{isEditing && initialData?.imagen_url ? "Cambiar imagen" : "Seleccionar imagen"}</span>
              </label>
              <input
                id="imagen-producto-input"
                ref={imagenInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImagenChange}
              />
            </div>

            {imagenFile && (
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="font-medium text-slate-700 truncate max-w-[200px]">
                  {imagenFile.name}
                </span>
                <span className="text-slate-400 shrink-0">
                  ({(imagenFile.size / 1024).toFixed(0)} KB)
                </span>
                <button
                  type="button"
                  onClick={handleQuitarImagen}
                  className="ml-auto text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer"
                  title="Quitar imagen seleccionada"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isEditing && initialData?.imagen_url && !imagenFile && !quitarImagenExistente && (
              <button
                type="button"
                onClick={handleQuitarImagen}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Quitar imagen actual</span>
              </button>
            )}

            {quitarImagenExistente && (
              <p className="text-xs text-rose-600 font-medium">
                La imagen actual será eliminada al guardar.
              </p>
            )}

            <p className="text-[11px] text-slate-400">
              Formatos aceptados: JPG, PNG, WebP, GIF · Tamaño máximo: 2 MB
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: PRECIOS Y MÁRGENES                                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#18181B]">
                Precios y Rentabilidad
              </h3>
              <p className="text-xs text-slate-500">
                Costos de adquisición y precio final de venta al público
              </p>
            </div>
          </div>

          {/* Indicador de Margen en Vivo */}
          {margenCalculado && (
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-xl text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Margen: <strong className="font-bold">{margenCalculado.margen}%</strong> (+${margenCalculado.ganancia})
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Precio Compra */}
          <div>
            <Input
              label="Precio de Compra (Costo)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              leftIcon={<span className="text-xs font-bold text-slate-400">$</span>}
              error={errors.precio_compra?.message}
              helperText="Costo neto pagado al proveedor"
              {...register("precio_compra")}
            />
          </div>

          {/* Precio Venta */}
          <div>
            <Input
              label="Precio de Venta al Público"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              leftIcon={<span className="text-xs font-bold text-brand">$</span>}
              error={errors.precio_venta?.message}
              helperText="Precio de mostrador para clientes"
              {...register("precio_venta")}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 3: CONTROL DE INVENTARIO Y STOCK                                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
          <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Layers className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#18181B]">
              Control de Inventario
            </h3>
            <p className="text-xs text-slate-500">
              Gestión de existencias actuales y umbrales de reorden
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {/* Stock Actual */}
          <div>
            <Input
              label="Stock Actual"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              required
              error={errors.stock_actual?.message}
              helperText="Unidades disponibles en bodega"
              {...register("stock_actual")}
            />
          </div>

          {/* Stock Mínimo */}
          <div>
            <Input
              label="Stock Mínimo (Alerta)"
              type="number"
              step="1"
              min="0"
              placeholder="5"
              required
              error={errors.stock_minimo?.message}
              helperText="Dispara alerta de stock bajo"
              {...register("stock_minimo")}
            />
          </div>

          {/* Stock Máximo */}
          <div>
            <Input
              label="Stock Máximo"
              type="number"
              step="1"
              min="0"
              placeholder="Ej: 50"
              error={errors.stock_maximo?.message}
              helperText="Capacidad máxima sugerida"
              {...register("stock_maximo")}
            />
          </div>

          {/* Ubicación Física */}
          <div className="sm:col-span-3">
            <Input
              label="Ubicación Física en Bodega / Tienda"
              placeholder="Ej: Estantería Central B-04 / Vitrina Principal"
              leftIcon={<MapPin className="w-4 h-4" />}
              error={errors.ubicacion?.message}
              helperText="Referencia rápida para encontrar el producto en el almacén"
              {...register("ubicacion")}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 4: PRESENTACIONES DE VENTA (EDICIÓN O HINT)                       */}
      {/* ========================================================================= */}
      {isEditing && initialData?.id ? (
        <PresentacionesManager
          productoId={initialData.id}
          precioVentaBase={initialData.precio_venta}
        />
      ) : (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
          <div className="p-1.5 bg-slate-200/70 text-slate-700 rounded-lg shrink-0 mt-0.5">
            <Boxes className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-800">Presentaciones de Venta</p>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Las presentaciones de venta adicionales (ej. Six-pack, Caja de 12 ó 24 unidades) con sus respectivos precios podrán configurarse una vez registrado el producto en el catálogo.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA DE ACCIONES (Guardar / Cancelar)                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
        <Link
          href="/productos"
          className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <X className="w-4 h-4 text-slate-400" />
          <span>Cancelar</span>
        </Link>

        <Button
          type="submit"
          size="md"
          isLoading={isSubmitting}
          className="w-full sm:w-auto shadow-sm gap-2"
          style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--primary-brand) 30%, transparent)" }}
        >
          <Save className="w-4 h-4" />
          <span>{isEditing ? "Actualizar Producto" : "Guardar Producto"}</span>
        </Button>
      </div>
    </form>
  );
}
