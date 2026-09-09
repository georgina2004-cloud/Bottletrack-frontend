import {
  ResumenInventario,
  ResumenVentasCompras,
  PuntoTendencia,
  VentaPorCategoria,
} from "@/types/dashboard";
import {
  Producto,
  ProductosPaginadosResponse,
  ProductoFiltros,
  ProductoPayload,
  Categoria,
  CategoriaPayload,
  ApiValidationErrorResponse,
} from "@/types/producto";
import {
  Presentacion,
  CrearPresentacionPayload,
  ActualizarPresentacionPayload,
} from "@/types/presentacion";
import {
  Proveedor,
  ProveedorPayload,
  ProveedoresPaginadosResponse,
  ProveedorFiltros,
} from "@/types/proveedor";
import {
  Venta,
  VentasPaginadasResponse,
  VentaFiltros,
  CrearVentaPayload,
  CrearVentaResponse,
} from "@/types/venta";
import {
  Compra,
  ComprasPaginadasResponse,
  CompraFiltros,
  CrearCompraPayload,
  CrearCompraResponse,
} from "@/types/compra";
import { Role } from "@/types/role";
import {
  Permiso,
  RolConPermisos,
  MatrizPermisosResponse,
} from "@/types/permiso";
import {
  Usuario,
  UsuarioPayload,
  UsuariosPaginadosResponse,
  UsuarioFiltros,
} from "@/types/usuario";
import {
  ReporteFiltrosFechas,
  TipoReporte,
  FormatoReporte,
  ReporteMaestroDetalleVenta,
  ReporteInventarioActual,
  ReporteStockBajo,
  ReporteVentaPorFecha,
  ReporteVentasPorVendedor,
  ReporteComprasPorProveedor,
  ReporteMovimientoInventario,
} from "@/types/reporte";
import {
  SetupEstadoResponse,
  SetupInicializarResponse,
  ConfiguracionPublica,
  ConfiguracionEmpresa,
} from "@/types/configuracion";
import { getStoredToken } from "@/lib/auth";
export { getStoredToken };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Clase de error personalizada para manejar errores de validación HTTP 422 de Laravel
 */
export class ValidationError extends Error {
  public errors: Record<string, string[]>;
  public status: number;

  constructor(message: string, errors: Record<string, string[]> = {}, status = 422) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
    this.status = status;
  }
}

/**
 * Error cuando el sistema ya fue inicializado previamente (HTTP 409 Conflict)
 */
export class SetupConflictError extends Error {
  constructor(message: string = "El sistema ya ha sido inicializado previamente.") {
    super(message);
    this.name = "SetupConflictError";
  }
}

/**
 * Función auxiliar para generar headers comunes con Bearer token
 */
function getAuthHeaders(token?: string | null): HeadersInit {
  const authToken = token || getStoredToken();
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return headers;
}

/**
 * Obtiene el resumen de inventario en tiempo real desde el backend Laravel.
 * Endpoint: GET /api/dashboard/resumen-inventario
 * Protegido mediante Laravel Sanctum (Bearer Token).
 */
export async function obtenerResumenInventario(
  token?: string | null
): Promise<ResumenInventario | null> {
  const authToken = token || getStoredToken();

  if (!authToken) {
    console.warn(
      "[obtenerResumenInventario] No se proporcionó un token de autenticación válido."
    );
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/resumen-inventario`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      console.error(
        `[obtenerResumenInventario] Error en respuesta del servidor: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data: ResumenInventario = await response.json();
    return data;
  } catch (error) {
    console.error(
      "[obtenerResumenInventario] Error de conexión al consultar el endpoint:",
      error
    );
    return null;
  }
}

/**
 * Obtiene el resumen de ventas y compras para el dashboard en tiempo real.
 * Endpoint: GET /api/dashboard/resumen-ventas-compras
 * Protegido mediante Laravel Sanctum (Bearer Token).
 */
export async function obtenerResumenVentasCompras(
  token?: string | null
): Promise<ResumenVentasCompras | null> {
  const authToken = token || getStoredToken();

  if (!authToken) {
    console.warn(
      "[obtenerResumenVentasCompras] No se proporcionó un token de autenticación válido."
    );
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/resumen-ventas-compras`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        `[obtenerResumenVentasCompras] Error en respuesta del servidor: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data: ResumenVentasCompras = await response.json();
    return data;
  } catch (error) {
    console.error(
      "[obtenerResumenVentasCompras] Error de conexión al consultar el endpoint:",
      error
    );
    return null;
  }
}

/**
 * Obtiene la serie temporal de tendencia de ventas y compras para el dashboard.
 * Endpoint: GET /api/dashboard/tendencia?periodo=7d|14d|mes
 * Respuesta: [{ "fecha": "2026-08-20", "ventas": number, "compras": number }, ...]
 */
export async function obtenerTendenciaDashboard(
  periodo: "7d" | "14d" | "mes" = "7d",
  token?: string | null
): Promise<PuntoTendencia[]> {
  const authToken = token || getStoredToken();

  if (!authToken) {
    console.warn("[obtenerTendenciaDashboard] No se proporcionó un token de autenticación.");
    return [];
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/tendencia?periodo=${periodo}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        `[obtenerTendenciaDashboard] Error ${response.status}: ${response.statusText}`
      );
      return [];
    }

    const data: PuntoTendencia[] = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[obtenerTendenciaDashboard] Error de conexión:", error);
    return [];
  }
}

/**
 * Obtiene el total de ventas acumulado agrupado por categoría para el Dashboard.
 * Endpoint: GET /api/dashboard/ventas-por-categoria
 */
export async function obtenerVentasPorCategoria(
  token?: string | null
): Promise<VentaPorCategoria[] | null> {
  const authToken = token || getStoredToken();

  if (!authToken) {
    console.warn(
      "[obtenerVentasPorCategoria] No se proporcionó un token de autenticación válido."
    );
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/ventas-por-categoria`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      console.error(
        `[obtenerVentasPorCategoria] Error en respuesta del servidor: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const json = await response.json();
    return Array.isArray(json) ? json : json.data || [];
  } catch (error) {
    console.error("[obtenerVentasPorCategoria] Error de conexión:", error);
    return null;
  }
}


/**
 * Obtiene el listado paginado de productos con filtros opcionales.
 * Endpoint: GET /api/productos?busqueda={}&categoria_id={}&page={}
 */
export async function obtenerProductos(
  filtros: ProductoFiltros = {},
  token?: string | null
): Promise<ProductosPaginadosResponse> {
  const params = new URLSearchParams();

  if (filtros.busqueda && filtros.busqueda.trim() !== "") {
    params.append("busqueda", filtros.busqueda.trim());
  }

  if (filtros.categoria_id && filtros.categoria_id !== "" && filtros.categoria_id !== "todas") {
    params.append("categoria_id", String(filtros.categoria_id));
  }

  if (filtros.page && filtros.page > 1) {
    params.append("page", String(filtros.page));
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/productos${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Error al obtener productos (${response.status})`
    );
  }

  const data: ProductosPaginadosResponse = await response.json();
  return data;
}

/**
 * Obtiene el detalle de un producto por su ID.
 * Endpoint: GET /api/productos/{id}
 */
export async function obtenerProductoPorId(
  id: number | string,
  token?: string | null
): Promise<Producto> {
  const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("El producto solicitado no existe o ha sido eliminado.");
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Error al obtener el producto (${response.status})`
    );
  }

  // TODO: [Laravel Backend Integration] Verificar si la respuesta viene envuelta en { data: Producto } o directamente Producto
  const data = await response.json();
  return (data.data || data) as Producto;
}

/**
 * Crea un nuevo producto en el catálogo.
 * Acepta FormData (con imagen) o ProductoPayload (sin imagen).
 * Endpoint: POST /api/productos
 *
 * Cuando se envía FormData, NO se fija Content-Type manualmente —
 * el navegador lo setea automáticamente con el boundary multipart correcto.
 */
export async function crearProducto(
  payload: ProductoPayload | FormData,
  token?: string | null
): Promise<Producto> {
  const isFormData = payload instanceof FormData;

  // Auth headers sin Content-Type cuando es multipart
  const authToken = token || getStoredToken();
  const headers: HeadersInit = { Accept: "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE_URL}/productos`, {
    method: "POST",
    headers,
    body: isFormData ? payload : JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422) {
      const valError = data as ApiValidationErrorResponse | null;
      throw new ValidationError(
        valError?.message || "Los datos proporcionados no son válidos.",
        valError?.errors || {}
      );
    }

    throw new Error(
      data?.message || `Error al crear el producto (${response.status})`
    );
  }

  return (data.data || data) as Producto;
}

/**
 * Actualiza los datos de un producto existente.
 * Acepta FormData (con imagen) o ProductoPayload (sin imagen).
 * Endpoint: POST /api/productos/{id} con _method=PUT (method spoofing Laravel)
 *
 * Laravel no procesa archivos en peticiones PUT reales (php://input), por eso
 * cuando hay imagen usamos POST + _method=PUT en el FormData.
 */
export async function actualizarProducto(
  id: number | string,
  payload: ProductoPayload | FormData,
  token?: string | null
): Promise<Producto> {
  const isFormData = payload instanceof FormData;

  const authToken = token || getStoredToken();
  const headers: HeadersInit = { Accept: "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  // Si es FormData, hacemos POST con spoofing _method=PUT (ya incluido en el FormData desde el componente)
  // Si es JSON plano, usamos PUT directo
  const method = isFormData ? "POST" : "PUT";
  const url = `${API_BASE_URL}/productos/${id}`;

  const response = await fetch(url, {
    method,
    headers,
    body: isFormData ? payload : JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422) {
      const valError = data as ApiValidationErrorResponse | null;
      throw new ValidationError(
        valError?.message || "Los datos proporcionados no son válidos.",
        valError?.errors || {}
      );
    }

    throw new Error(
      data?.message || `Error al actualizar el producto (${response.status})`
    );
  }

  return (data.data || data) as Producto;
}

/**
 * Desactiva un producto (borrado lógico: marca activo = false).
 * Endpoint: DELETE /api/productos/{id}
 */
export async function desactivarProducto(
  id: number | string,
  token?: string | null
): Promise<{ message?: string }> {
  const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || `Error al desactivar el producto (${response.status})`
    );
  }

  return data || { message: "Producto desactivado correctamente." };
}

/**
 * Obtiene la lista completa de categorías disponibles para selectores y filtros.
 * Endpoint: GET /api/categorias
 */
export async function obtenerCategorias(
  token?: string | null
): Promise<Categoria[]> {
  const response = await fetch(`${API_BASE_URL}/categorias`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    console.error(
      `[obtenerCategorias] Error en respuesta del servidor: ${response.status}`
    );
    return [];
  }

  // TODO: [Laravel Backend Integration] Verificar si la lista viene en { data: Categoria[] } o Categoria[]
  const data = await response.json().catch(() => []);
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}

/**
 * Busca un producto por su código de barras o QR en el catálogo.
 * Endpoint: GET /api/productos/buscar-por-codigo/{codigo}
 * Respuestas:
 * - 200: { "existe": true, "producto": { ... } } -> Retorna el producto encontrado
 * - 404: { "existe": false } -> Retorna null
 * - Otros errores: Lanza una excepción controlada
 */
export async function buscarProductoPorCodigo(
  codigo: string,
  token?: string | null
): Promise<Producto | null> {
  const cleanCodigo = encodeURIComponent(codigo.trim());

  try {
    const response = await fetch(
      `${API_BASE_URL}/productos/buscar-por-codigo/${cleanCodigo}`,
      {
        method: "GET",
        headers: getAuthHeaders(token),
        cache: "no-store",
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ||
          `Error al buscar el producto por código de barras (${response.status})`
      );
    }

    const data = await response.json();
    return (data.producto || data.data || data) as Producto;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error de conexión al verificar el código de barras.");
  }
}

/**
 * Obtiene el detalle de una categoría por su ID.
 * Endpoint: GET /api/categorias/{id}
 */
export async function obtenerCategoriaPorId(
  id: number | string,
  token?: string | null
): Promise<Categoria> {
  const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("La categoría solicitada no existe o ha sido eliminada.");
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Error al obtener la categoría (${response.status})`
    );
  }

  const data = await response.json();
  return (data.data || data) as Categoria;
}

/**
 * Registra una nueva categoría en la base de datos.
 * Endpoint: POST /api/categorias
 */
export async function crearCategoria(
  payload: CategoriaPayload,
  token?: string | null
): Promise<Categoria> {
  const response = await fetch(`${API_BASE_URL}/categorias`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422) {
      const valError = data as ApiValidationErrorResponse | null;
      throw new ValidationError(
        valError?.message || "Los datos de la categoría no son válidos.",
        valError?.errors || {}
      );
    }
    throw new Error(
      data?.message || `Error al crear la categoría (${response.status})`
    );
  }

  return (data?.data || data) as Categoria;
}

/**
 * Actualiza los datos de una categoría existente.
 * Endpoint: PUT /api/categorias/{id}
 */
export async function actualizarCategoria(
  id: number | string,
  payload: CategoriaPayload,
  token?: string | null
): Promise<Categoria> {
  const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422) {
      const valError = data as ApiValidationErrorResponse | null;
      throw new ValidationError(
        valError?.message || "Los datos de la categoría no son válidos.",
        valError?.errors || {}
      );
    }
    throw new Error(
      data?.message || `Error al actualizar la categoría (${response.status})`
    );
  }

  return (data?.data || data) as Categoria;
}

/**
 * Elimina físicamente una categoría del sistema.
 * Endpoint: DELETE /api/categorias/{id}
 * 
 * Nota: Si la categoría tiene productos asociados, el backend responde HTTP 409 Conflict:
 * { "message": "No se puede eliminar: esta categoría tiene productos asociados." }
 */
export async function eliminarCategoria(
  id: number | string,
  token?: string | null
): Promise<{ message?: string }> {
  const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(
        data?.message ||
          "No se puede eliminar: esta categoría tiene productos asociados."
      );
    }
    throw new Error(
      data?.message || `Error al eliminar la categoría (${response.status})`
    );
  }

  return data || { message: "Categoría eliminada correctamente." };
}

/**
 * Consulta el listado paginado de proveedores desde el backend Laravel.
 * Endpoint: GET /api/proveedores
 * Query params: busqueda, page
 */
export async function obtenerProveedores(
  filtros: ProveedorFiltros = {},
  token?: string | null
): Promise<ProveedoresPaginadosResponse> {
  const queryParams = new URLSearchParams();

  if (filtros.busqueda && filtros.busqueda.trim().length > 0) {
    queryParams.append("busqueda", filtros.busqueda.trim());
  }

  if (filtros.page && filtros.page > 1) {
    queryParams.append("page", filtros.page.toString());
  }

  const url = `${API_BASE_URL}/proveedores${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al cargar el listado de proveedores (${response.status})`
    );
  }

  const data = await response.json();
  return data as ProveedoresPaginadosResponse;
}

/**
 * Obtiene el detalle de un proveedor por su ID.
 * Endpoint: GET /api/proveedores/{id}
 */
export async function obtenerProveedorPorId(
  id: number | string,
  token?: string | null
): Promise<Proveedor> {
  const response = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("El proveedor solicitado no existe o ha sido eliminado.");
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Error al obtener el proveedor (${response.status})`
    );
  }

  const data = await response.json();
  return (data.data || data) as Proveedor;
}

/**
 * Registra un nuevo proveedor en la base de datos.
 * Endpoint: POST /api/proveedores
 */
export async function crearProveedor(
  payload: ProveedorPayload,
  token?: string | null
): Promise<Proveedor> {
  const response = await fetch(`${API_BASE_URL}/proveedores`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422) {
      const valError = data as ApiValidationErrorResponse | null;
      throw new ValidationError(
        valError?.message || "Los datos del proveedor no son válidos.",
        valError?.errors || {}
      );
    }
    throw new Error(
      data?.message || `Error al registrar el proveedor (${response.status})`
    );
  }

  return (data?.data || data) as Proveedor;
}

/**
 * Actualiza los datos de un proveedor existente.
 * Endpoint: PUT /api/proveedores/{id}
 */
export async function actualizarProveedor(
  id: number | string,
  payload: ProveedorPayload,
  token?: string | null
): Promise<Proveedor> {
  const response = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422) {
      const valError = data as ApiValidationErrorResponse | null;
      throw new ValidationError(
        valError?.message || "Los datos del proveedor no son válidos.",
        valError?.errors || {}
      );
    }
    throw new Error(
      data?.message || `Error al actualizar el proveedor (${response.status})`
    );
  }

  return (data?.data || data) as Proveedor;
}

/**
 * Desactiva lógicamente un proveedor (borrado lógico: activo = false).
 * Endpoint: DELETE /api/proveedores/{id}
 */
export async function desactivarProveedor(
  id: number | string,
  token?: string | null
): Promise<{ message?: string }> {
  const response = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || `Error al desactivar el proveedor (${response.status})`
    );
  }

  return data || { message: "Proveedor desactivado correctamente." };
}

/**
 * Obtiene el listado paginado de ventas.
 * Endpoint: GET /api/ventas?page={}&busqueda={}
 * (Encargado de Ventas solo ve las suyas, Gerente/Auditor ven todas)
 */
export async function obtenerVentas(
  filtros: VentaFiltros = {},
  token?: string | null
): Promise<VentasPaginadasResponse> {
  const params = new URLSearchParams();

  if (filtros.page && filtros.page > 1) {
    params.append("page", String(filtros.page));
  }
  if (filtros.busqueda && filtros.busqueda.trim() !== "") {
    params.append("busqueda", filtros.busqueda.trim());
  }
  if (filtros.desde && filtros.desde.trim() !== "") {
    params.append("desde", filtros.desde.trim());
  }
  if (filtros.hasta && filtros.hasta.trim() !== "") {
    params.append("hasta", filtros.hasta.trim());
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/ventas${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Error al obtener las ventas (${response.status})`
    );
  }

  const data: VentasPaginadasResponse = await response.json();
  return data;
}

/**
 * Registra una nueva venta en el sistema (Punto de Venta / POS).
 * Endpoint: POST /api/ventas
 * Body: { cliente_nombre?, descuento?, productos: [{ producto_id, cantidad }] }
 */
export async function crearVenta(
  payload: CrearVentaPayload,
  token?: string | null
): Promise<CrearVentaResponse> {
  const response = await fetch(`${API_BASE_URL}/ventas`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422) {
      const valError = data as ApiValidationErrorResponse | null;
      throw new ValidationError(
        valError?.message || "Los datos de la venta no son válidos.",
        valError?.errors || {}
      );
    }
    // Manejar errores de validación o negocio como stock insuficiente (500)
    throw new Error(
      data?.message || `Error al registrar la venta (${response.status})`
    );
  }

  return data as CrearVentaResponse;
}

/**
 * Obtiene el detalle de una venta por su ID.
 * Endpoint: GET /api/ventas/{id}
 */
export async function obtenerVentaPorId(
  id: number | string,
  token?: string | null
): Promise<Venta> {
  const response = await fetch(`${API_BASE_URL}/ventas/${id}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("La venta solicitada no existe o no se encuentra disponible.");
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Error al obtener el detalle de la venta (${response.status})`
    );
  }

  const data = await response.json();
  return (data.data || data.venta || data) as Venta;
}

/**
 * Anula una venta activa y revierte el stock al inventario.
 * Endpoint: POST /api/ventas/{id}/anular
 */
export async function anularVenta(
  id: number | string,
  token?: string | null
): Promise<{ message: string; venta?: Venta }> {
  const response = await fetch(`${API_BASE_URL}/ventas/${id}/anular`, {
    method: "POST",
    headers: getAuthHeaders(token),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || `Error al anular la venta (${response.status})`
    );
  }

  return data || { message: "Venta anulada correctamente." };
}

/**
 * Obtiene el listado paginado de compras registradas.
 * Endpoint: GET /api/compras?page={}&desde={}&hasta={}&busqueda={}
 */
export async function obtenerCompras(
  filtros: CompraFiltros = {},
  token?: string | null
): Promise<ComprasPaginadasResponse> {
  const params = new URLSearchParams();

  if (filtros.page && filtros.page > 1) {
    params.append("page", String(filtros.page));
  }
  if (filtros.desde && filtros.desde.trim() !== "") {
    params.append("desde", filtros.desde.trim());
  }
  if (filtros.hasta && filtros.hasta.trim() !== "") {
    params.append("hasta", filtros.hasta.trim());
  }
  if (filtros.busqueda && filtros.busqueda.trim() !== "") {
    params.append("busqueda", filtros.busqueda.trim());
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/compras${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Error al obtener las compras (${response.status})`
    );
  }

  const data: ComprasPaginadasResponse = await response.json();
  return data;
}

/**
 * Registra una nueva compra a un proveedor con sus líneas de producto.
 * Endpoint: POST /api/compras
 * Body: { proveedor_id, numero_factura_proveedor?, productos: [{ producto_id, cantidad, precio_unitario }] }
 */
export async function crearCompra(
  payload: CrearCompraPayload,
  token?: string | null
): Promise<CrearCompraResponse> {
  const response = await fetch(`${API_BASE_URL}/compras`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422) {
      const valError = data as ApiValidationErrorResponse | null;
      throw new ValidationError(
        valError?.message || "Los datos de la compra no son válidos.",
        valError?.errors || {}
      );
    }
    throw new Error(
      data?.message || `Error al registrar la compra (${response.status})`
    );
  }

  return data as CrearCompraResponse;
}

/**
 * Obtiene el detalle de una compra específica por su ID.
 * Endpoint: GET /api/compras/{id}
 */
export async function obtenerCompraPorId(
  id: number | string,
  token?: string | null
): Promise<Compra> {
  const response = await fetch(`${API_BASE_URL}/compras/${id}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("La compra solicitada no existe o no se encuentra disponible.");
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Error al obtener el detalle de la compra (${response.status})`
    );
  }

  const data = await response.json();
  return (data.data || data.compra || data) as Compra;
}

// =============================================================================
// MÓDULO DE USUARIOS Y ROLES
// =============================================================================

/**
 * Obtiene la lista paginada de usuarios con filtro opcional de búsqueda.
 * Endpoint: GET /api/usuarios?busqueda={}&page={}
 */
export async function obtenerUsuarios(
  filtros: UsuarioFiltros = {},
  token?: string | null
): Promise<UsuariosPaginadosResponse> {
  const params = new URLSearchParams();

  if (filtros.busqueda && filtros.busqueda.trim() !== "") {
    params.append("busqueda", filtros.busqueda.trim());
  }

  if (filtros.page && filtros.page > 1) {
    params.append("page", filtros.page.toString());
  }

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/usuarios${queryString}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al obtener el listado de usuarios (${response.status})`
    );
  }

  const data = await response.json();
  return data as UsuariosPaginadosResponse;
}

/**
 * Obtiene un usuario por su ID.
 * Endpoint: GET /api/usuarios/{id}
 */
export async function obtenerUsuarioPorId(
  id: number | string,
  token?: string | null
): Promise<Usuario> {
  const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("El usuario solicitado no existe.");
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al obtener información del usuario (${response.status})`
    );
  }

  const data = await response.json();
  return (data.data || data.usuario || data) as Usuario;
}

/**
 * Crea un nuevo usuario en el sistema.
 * Endpoint: POST /api/usuarios
 * Body: { name, email, password, role_id }
 */
export async function crearUsuario(
  payload: UsuarioPayload,
  token?: string | null
): Promise<Usuario> {
  const response = await fetch(`${API_BASE_URL}/usuarios`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 422) {
      const errorData: ApiValidationErrorResponse = await response.json();
      throw new ValidationError(
        errorData.message || "Errores de validación al crear usuario.",
        errorData.errors || {}
      );
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al registrar el usuario en el servidor (${response.status})`
    );
  }

  const data = await response.json();
  return (data.data || data.usuario || data) as Usuario;
}

/**
 * Actualiza un usuario existente.
 * Endpoint: PUT /api/usuarios/{id}
 * Body: { name, email, password?, role_id, estado? }
 */
export async function actualizarUsuario(
  id: number | string,
  payload: Partial<UsuarioPayload>,
  token?: string | null
): Promise<Usuario> {
  const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 422) {
      const errorData: ApiValidationErrorResponse = await response.json();
      throw new ValidationError(
        errorData.message || "Errores de validación al actualizar usuario.",
        errorData.errors || {}
      );
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al actualizar el usuario (${response.status})`
    );
  }

  const data = await response.json();
  return (data.data || data.usuario || data) as Usuario;
}

/**
 * Desactiva un usuario (borrado lógico: estado=false).
 * Endpoint: DELETE /api/usuarios/{id}
 * Responde 409 si el usuario intenta desactivarse a sí mismo.
 */
export async function desactivarUsuario(
  id: number | string,
  token?: string | null
): Promise<{ message?: string }> {
  const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (response.status === 409) {
      throw new Error(
        errorData?.message ||
          "No puedes desactivar tu propia cuenta de usuario en sesión."
      );
    }
    throw new Error(
      errorData?.message ||
        `Error al desactivar el usuario (${response.status})`
    );
  }

  return await response.json().catch(() => ({}));
}

/**
 * Eliminación definitiva (física) de un usuario.
 * Endpoint: DELETE /api/usuarios/{id}
 *
 * Respuestas esperadas del backend:
 * - 200: { message } — Borrado exitoso.
 * - 409: { message: "No se puede eliminar: este usuario tiene ventas o compras registradas..." }
 *        El usuario tiene historial referencial: no se puede borrar permanentemente.
 */
export async function eliminarUsuario(
  id: number | string,
  token?: string | null
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // 409 = integridad referencial (tiene ventas/compras)
    throw new Error(
      data?.message ||
        `Error al eliminar el usuario (${response.status})`
    );
  }

  return data as { message: string };
}

/**
 * Obtiene la lista simple de roles disponibles en el sistema.
 * Endpoint: GET /api/roles
 */
export async function obtenerRoles(
  token?: string | null
): Promise<Role[]> {
  const response = await fetch(`${API_BASE_URL}/roles`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al cargar la lista de roles (${response.status})`
    );
  }

  const data = await response.json();
  // El endpoint puede devolver un array directo o un objeto con data
  return Array.isArray(data) ? (data as Role[]) : (data.data || []) as Role[];
}

/**
 * Obtiene el catálogo completo de permisos del sistema agrupados por módulo.
 * Endpoint: GET /api/permisos
 */
export async function obtenerPermisos(
  token?: string | null
): Promise<Permiso[]> {
  const response = await fetch(`${API_BASE_URL}/permisos`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al obtener la lista de permisos (${response.status})`
    );
  }

  const data = await response.json();
  return Array.isArray(data) ? (data as Permiso[]) : (data.data || []) as Permiso[];
}

/**
 * Obtiene los roles del sistema con sus permisos actualmente asignados (relación role_has_permissions).
 * Endpoint: GET /api/roles/permisos o GET /api/roles?include=permissions
 */
export async function obtenerRolesConPermisos(
  token?: string | null
): Promise<RolConPermisos[]> {
  // Intentar endpoint de matriz /api/roles/permisos o fallback a /api/roles?with_permissions=1
  let response = await fetch(`${API_BASE_URL}/roles/permisos`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok && response.status === 404) {
    response = await fetch(`${API_BASE_URL}/roles`, {
      method: "GET",
      headers: getAuthHeaders(token),
      cache: "no-store",
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al obtener roles con permisos (${response.status})`
    );
  }

  const data = await response.json();
  const rawList = Array.isArray(data) ? data : (data.data || []);

  return rawList.map((r: any) => ({
    id: r.id,
    nombre: r.nombre || r.name || `Rol #${r.id}`,
    descripcion: r.descripcion || r.description || null,
    permisos: Array.isArray(r.permisos)
      ? r.permisos
      : Array.isArray(r.permissions)
      ? r.permissions
      : [],
    permission_ids: Array.isArray(r.permission_ids)
      ? r.permission_ids
      : Array.isArray(r.permisos)
      ? r.permisos.map((p: any) => p.id)
      : Array.isArray(r.permissions)
      ? r.permissions.map((p: any) => p.id)
      : [],
  })) as RolConPermisos[];
}

/**
 * Actualiza (sync) los permisos asignados a un rol específico dentro de una transacción.
 * Endpoint: PUT /api/roles/{id}/permisos o POST /api/roles/{id}/permisos
 */
export async function actualizarPermisosRol(
  roleId: number,
  permissionIds: number[],
  token?: string | null
): Promise<{ message: string }> {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new Error("No hay token de sesión disponible.");
  }

  const response = await fetch(`${API_BASE_URL}/roles/${roleId}/permisos`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(authToken),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      permission_ids: permissionIds,
      permisos: permissionIds, // compatibilidad con ambos formatos de request
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422 && data?.errors) {
      throw new ValidationError(
        data.message || "Error de validación al sincronizar permisos.",
        data.errors,
        422
      );
    }
    throw new Error(
      data?.message ||
        `Error al actualizar permisos del rol (HTTP ${response.status})`
    );
  }

  return { message: data?.message || "Permisos actualizados correctamente." };
}

// =============================================================================
// MÓDULO DE REPORTES Y DESCARGAS BINARIAS (UNIFICADOS)
// Endpoints base: /api/reportes/{tipo}?desde=&hasta=&formato=pdf|excel
// =============================================================================

/**
 * Función genérica reutilizable para descargar cualquier reporte en formato binario (PDF o Excel).
 * Endpoint: GET /api/reportes/{tipo}?desde=&hasta=&formato={pdf|excel}
 */
export async function descargarReporteArchivo(
  tipo: TipoReporte,
  formato: FormatoReporte,
  filtros: ReporteFiltrosFechas = {},
  token?: string | null
): Promise<void> {
  const authToken = token || getStoredToken();
  const params = new URLSearchParams();

  if (filtros.desde && filtros.desde.trim() !== "") {
    params.append("desde", filtros.desde.trim());
  }
  if (filtros.hasta && filtros.hasta.trim() !== "") {
    params.append("hasta", filtros.hasta.trim());
  }
  params.append("formato", formato);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/reportes/${tipo}?${queryString}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    let errorMsg = `Error al descargar el reporte en formato ${formato.toUpperCase()} (${response.status} ${response.statusText})`;
    try {
      const errorJson = await response.json();
      if (errorJson?.message) {
        errorMsg = errorJson.message;
      }
    } catch {
      // Ignorar si no es JSON
    }
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const extension = formato === "pdf" ? "pdf" : "xlsx";
  const fechaStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `reporte_${tipo.replace(/-/g, "_")}_${fechaStr}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl);
  }, 30000);
}

/**
 * 1. Reporte Maestro-Detalle de Ventas.
 * Endpoint: GET /api/reportes/maestro-detalle-ventas?desde=&hasta=
 */
export async function obtenerReporteMaestroDetalleVentas(
  filtros: ReporteFiltrosFechas = {},
  token?: string | null
): Promise<ReporteMaestroDetalleVenta[]> {
  const params = new URLSearchParams();
  if (filtros.desde && filtros.desde.trim() !== "") {
    params.append("desde", filtros.desde.trim());
  }
  if (filtros.hasta && filtros.hasta.trim() !== "") {
    params.append("hasta", filtros.hasta.trim());
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/reportes/maestro-detalle-ventas${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al obtener reporte maestro-detalle de ventas (${response.status})`
    );
  }

  const data = await response.json();
  return Array.isArray(data)
    ? (data as ReporteMaestroDetalleVenta[])
    : ((data.data || []) as ReporteMaestroDetalleVenta[]);
}

/**
 * 2. Reporte de Inventario Actual.
 * Endpoint: GET /api/reportes/inventario-actual?desde=&hasta=
 */
export async function obtenerReporteInventarioActual(
  filtros: ReporteFiltrosFechas = {},
  token?: string | null
): Promise<ReporteInventarioActual[]> {
  const params = new URLSearchParams();
  if (filtros.desde && filtros.desde.trim() !== "") {
    params.append("desde", filtros.desde.trim());
  }
  if (filtros.hasta && filtros.hasta.trim() !== "") {
    params.append("hasta", filtros.hasta.trim());
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/reportes/inventario-actual${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al obtener reporte de inventario actual (${response.status})`
    );
  }

  const data = await response.json();
  return Array.isArray(data)
    ? (data as ReporteInventarioActual[])
    : ((data.data || []) as ReporteInventarioActual[]);
}

/**
 * 3. Reporte de Stock Bajo.
 * Endpoint: GET /api/reportes/stock-bajo?desde=&hasta=
 */
export async function obtenerReporteStockBajo(
  filtros: ReporteFiltrosFechas = {},
  token?: string | null
): Promise<ReporteStockBajo[]> {
  const params = new URLSearchParams();
  if (filtros.desde && filtros.desde.trim() !== "") {
    params.append("desde", filtros.desde.trim());
  }
  if (filtros.hasta && filtros.hasta.trim() !== "") {
    params.append("hasta", filtros.hasta.trim());
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/reportes/stock-bajo${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al obtener reporte de stock bajo (${response.status})`
    );
  }

  const data = await response.json();
  return Array.isArray(data)
    ? (data as ReporteStockBajo[])
    : ((data.data || []) as ReporteStockBajo[]);
}

/**
 * 4. Reporte de Ventas por Fechas.
 * Endpoint: GET /api/reportes/ventas-por-fechas?desde=&hasta=
 */
export async function obtenerReporteVentasPorFechas(
  filtros: ReporteFiltrosFechas = {},
  token?: string | null
): Promise<ReporteVentaPorFecha[]> {
  const params = new URLSearchParams();
  if (filtros.desde && filtros.desde.trim() !== "") {
    params.append("desde", filtros.desde.trim());
  }
  if (filtros.hasta && filtros.hasta.trim() !== "") {
    params.append("hasta", filtros.hasta.trim());
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/reportes/ventas-por-fechas${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al consultar reporte de ventas por fechas (${response.status})`
    );
  }

  const data = await response.json();
  return Array.isArray(data)
    ? (data as ReporteVentaPorFecha[])
    : ((data.data || []) as ReporteVentaPorFecha[]);
}

/**
 * 5. Reporte de ventas agrupadas por vendedor.
 * Endpoint: GET /api/reportes/ventas-por-vendedor?desde=&hasta=
 */
export async function obtenerReporteVentasPorVendedor(
  filtros: ReporteFiltrosFechas = {},
  token?: string | null
): Promise<ReporteVentasPorVendedor[]> {
  const params = new URLSearchParams();
  if (filtros.desde && filtros.desde.trim() !== "") {
    params.append("desde", filtros.desde.trim());
  }
  if (filtros.hasta && filtros.hasta.trim() !== "") {
    params.append("hasta", filtros.hasta.trim());
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/reportes/ventas-por-vendedor${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al obtener reporte de ventas por vendedor (${response.status})`
    );
  }

  const data = await response.json();
  return Array.isArray(data)
    ? (data as ReporteVentasPorVendedor[])
    : ((data.data || []) as ReporteVentasPorVendedor[]);
}

/**
 * 6. Reporte de compras agrupadas por proveedor.
 * Endpoint: GET /api/reportes/compras-por-proveedor?desde=&hasta=
 */
export async function obtenerReporteComprasPorProveedor(
  filtros: ReporteFiltrosFechas = {},
  token?: string | null
): Promise<ReporteComprasPorProveedor[]> {
  const params = new URLSearchParams();
  if (filtros.desde && filtros.desde.trim() !== "") {
    params.append("desde", filtros.desde.trim());
  }
  if (filtros.hasta && filtros.hasta.trim() !== "") {
    params.append("hasta", filtros.hasta.trim());
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/reportes/compras-por-proveedor${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al obtener reporte de compras por proveedor (${response.status})`
    );
  }

  const data = await response.json();
  return Array.isArray(data)
    ? (data as ReporteComprasPorProveedor[])
    : ((data.data || []) as ReporteComprasPorProveedor[]);
}

/**
 * 7. Reporte de movimientos de inventario (Kárdex: entradas y salidas).
 * Endpoint: GET /api/reportes/movimientos-inventario?desde=&hasta=
 */
export async function obtenerReporteMovimientosInventario(
  filtros: ReporteFiltrosFechas = {},
  token?: string | null
): Promise<ReporteMovimientoInventario[]> {
  const params = new URLSearchParams();
  if (filtros.desde && filtros.desde.trim() !== "") {
    params.append("desde", filtros.desde.trim());
  }
  if (filtros.hasta && filtros.hasta.trim() !== "") {
    params.append("hasta", filtros.hasta.trim());
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/reportes/movimientos-inventario${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al obtener movimientos de inventario (${response.status})`
    );
  }

  const data = await response.json();
  return Array.isArray(data)
    ? (data as ReporteMovimientoInventario[])
    : ((data.data || []) as ReporteMovimientoInventario[]);
}

/**
 * Descarga el archivo Excel de movimientos de inventario en formato binario (.xlsx).
 * Reutiliza descargarReporteArchivo con tipo "movimientos-inventario" y formato "excel".
 */
export async function descargarReporteMovimientosExcel(
  filtros: ReporteFiltrosFechas = {},
  token?: string | null
): Promise<void> {
  return descargarReporteArchivo("movimientos-inventario", "excel", filtros, token);
}

/**
 * Descarga la factura en formato PDF para una venta específica en formato binario (.pdf).
 * Endpoint: GET /api/ventas/{id}/factura-pdf
 */
export async function descargarFacturaPDF(
  ventaId: number | string,
  numeroFactura?: string,
  token?: string | null
): Promise<void> {
  const authToken = token || getStoredToken();
  const url = `${API_BASE_URL}/ventas/${ventaId}/factura-pdf`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Error al descargar la factura en PDF (${response.status} ${response.statusText})`
    );
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `factura_${numeroFactura || ventaId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl);
  }, 1000);
}

/**
 * Obtiene la factura en formato PDF binario y la abre en una nueva pestaña del navegador
 * (usando stream() del backend) para que el usuario pueda visualizarla e imprimirla directamente.
 * Endpoint: GET /api/ventas/{id}/factura-pdf
 */
export async function abrirFacturaPDF(
  ventaId: number | string,
  token?: string | null
): Promise<void> {
  const authToken = token || getStoredToken();
  const url = `${API_BASE_URL}/ventas/${ventaId}/factura-pdf`;

  // Pre-abrir la ventana síncronamente durante el evento de click para evitar que bloqueadores de popups la cancelen
  const nuevaVentana = window.open("", "_blank");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (nuevaVentana) nuevaVentana.close();
      let errorMensaje = `Error al obtener la factura en PDF (${response.status} ${response.statusText})`;
      try {
        const errorJson = await response.json();
        if (errorJson?.message) {
          errorMensaje = errorJson.message;
        }
      } catch {
        // Ignorar si el cuerpo no es JSON
      }
      throw new Error(errorMensaje);
    }

    const blob = await response.blob();
    const pdfBlob = new Blob([blob], { type: "application/pdf" });
    const fileUrl = window.URL.createObjectURL(pdfBlob);

    if (nuevaVentana) {
      nuevaVentana.location.href = fileUrl;
    } else {
      window.open(fileUrl, "_blank");
    }

    // Revocar el objeto URL tras 60 segundos
    setTimeout(() => {
      window.URL.revokeObjectURL(fileUrl);
    }, 60000);
  } catch (error) {
    if (nuevaVentana) nuevaVentana.close();
    throw error;
  }
}

/**
 * Alias de abrirFacturaPDF para semántica de impresión
 */
export const imprimirFacturaPDF = abrirFacturaPDF;

// =============================================================================
// MÓDULO DE SETUP Y CONFIGURACIÓN DE EMPRESA
// =============================================================================

/**
 * Verifica si el sistema ya fue configurado inicialmente.
 * Endpoint público: GET /api/setup/estado
 */
export async function verificarEstadoSetup(): Promise<SetupEstadoResponse> {
  const response = await fetch(`${API_BASE_URL}/setup/estado`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Error al verificar estado del sistema (${response.status})`);
  }

  return response.json();
}

/**
 * Inicializa la configuración de la licorería y crea la cuenta del administrador.
 * Endpoint público: POST /api/setup/inicializar (multipart/form-data)
 */
export async function inicializarSetup(
  formData: FormData
): Promise<SetupInicializarResponse> {
  const response = await fetch(`${API_BASE_URL}/setup/inicializar`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      // NOTA: No colocar 'Content-Type': el navegador asigna multipart/form-data con el boundary automáticamente
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 409) {
      throw new SetupConflictError(
        data?.message || "El sistema ya ha sido inicializado previamente."
      );
    }

    if (response.status === 422) {
      throw new ValidationError(
        data?.message || "Los datos proporcionados no son válidos.",
        data?.errors || {}
      );
    }

    throw new Error(
      data?.message || `Error al inicializar el sistema (${response.status})`
    );
  }

  return data as SetupInicializarResponse;
}

/**
 * Obtiene la configuración pública de branding (sin requerir sesión).
 * Endpoint público: GET /api/configuracion/publica
 */
export async function obtenerConfiguracionPublica(): Promise<ConfiguracionPublica> {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/publica`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { configurado: false };
    }

    const data = await response.json();
    return (data.data || data) as ConfiguracionPublica;
  } catch (error) {
    console.error("[obtenerConfiguracionPublica] Error de conexión al consultar branding público:", error);
    return { configurado: false };
  }
}

/**
 * Obtiene la configuración completa de la empresa (protegido con token Sanctum).
 * Endpoint: GET /api/configuracion
 */
export async function obtenerConfiguracionEmpresa(
  token?: string | null
): Promise<ConfiguracionEmpresa> {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new Error("No hay un token de autenticación disponible.");
  }

  const response = await fetch(`${API_BASE_URL}/configuracion`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Error al obtener la configuración de la empresa (${response.status} ${response.statusText})`
    );
  }

  const data = await response.json();
  return (data.data || data.configuracion || data) as ConfiguracionEmpresa;
}

/**
 * Actualiza la configuración de la empresa (protegido con token Sanctum, multipart/form-data).
 * Endpoint: POST /api/configuracion
 */
export async function actualizarConfiguracionEmpresa(
  formData: FormData,
  token?: string | null
): Promise<ConfiguracionEmpresa> {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new Error("No hay un token de autenticación disponible.");
  }

  const response = await fetch(`${API_BASE_URL}/configuracion`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${authToken}`,
      // NOTA: No especificar Content-Type para permitir que el navegador agregue el boundary multipart/form-data
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422 && data?.errors) {
      throw new ValidationError(
        data?.message || "Error de validación al guardar la configuración",
        data.errors
      );
    }
    throw new Error(
      data?.message ||
        `Error al guardar la configuración de la empresa (HTTP ${response.status})`
    );
  }

  return (data.data || data.configuracion || data) as ConfiguracionEmpresa;
}

/**
 * Payload para actualizar el perfil del usuario autenticado
 */
export interface ActualizarPerfilPayload {
  name?: string;
  email?: string;
  password_actual?: string;
  password?: string;
  password_confirmation?: string;
}

/**
 * Actualizar datos personales y/o contraseña del usuario en sesión
 * Endpoint: PUT /api/perfil
 */
export async function actualizarPerfilUsuario(
  payload: ActualizarPerfilPayload,
  token?: string | null
): Promise<{ message: string; user: import("@/types/auth").User }> {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new Error("No hay un token de autenticación disponible.");
  }

  const response = await fetch(`${API_BASE_URL}/perfil`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422 && data?.errors) {
      throw new ValidationError(
        data?.message || "Error de validación al actualizar el perfil",
        data.errors
      );
    }
    throw new Error(
      data?.message ||
        `Error al actualizar el perfil de usuario (HTTP ${response.status})`
    );
  }

  return {
    message: data.message || "Perfil actualizado exitosamente.",
    user: (data.user || data.data || data) as import("@/types/auth").User,
  };
}

// =========================================================================
// PRESENTACIONES DE VENTA DE PRODUCTOS
// =========================================================================

/**
 * Obtiene el listado de presentaciones de venta para un producto específico.
 * Endpoint: GET /api/productos/{id}/presentaciones
 */
export async function obtenerPresentaciones(
  productoId: number | string,
  token?: string | null
): Promise<Presentacion[]> {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new Error("No hay un token de autenticación disponible.");
  }

  const response = await fetch(
    `${API_BASE_URL}/productos/${productoId}/presentaciones`,
    {
      method: "GET",
      headers: getAuthHeaders(authToken),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Error al consultar presentaciones del producto (HTTP ${response.status})`
    );
  }

  return Array.isArray(data) ? data : data?.data || [];
}

/**
 * Registra una nueva presentación de venta para un producto.
 * Endpoint: POST /api/productos/{id}/presentaciones
 */
export async function crearPresentacion(
  productoId: number | string,
  payload: CrearPresentacionPayload,
  token?: string | null
): Promise<Presentacion> {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new Error("No hay un token de autenticación disponible.");
  }

  const response = await fetch(
    `${API_BASE_URL}/productos/${productoId}/presentaciones`,
    {
      method: "POST",
      headers: getAuthHeaders(authToken),
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422 && data?.errors) {
      throw new ValidationError(
        data?.message || "Error de validación al crear presentación",
        data.errors
      );
    }
    throw new Error(
      data?.message ||
        `Error al registrar presentación de venta (HTTP ${response.status})`
    );
  }

  return (data?.presentacion || data?.data || data) as Presentacion;
}

/**
 * Actualiza una presentación de venta existente.
 * Endpoint: PUT /api/presentaciones/{id}
 */
export async function actualizarPresentacion(
  presentacionId: number | string,
  payload: ActualizarPresentacionPayload,
  token?: string | null
): Promise<Presentacion> {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new Error("No hay un token de autenticación disponible.");
  }

  const response = await fetch(
    `${API_BASE_URL}/presentaciones/${presentacionId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(authToken),
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 422 && data?.errors) {
      throw new ValidationError(
        data?.message || "Error de validación al actualizar presentación",
        data.errors
      );
    }
    throw new Error(
      data?.message ||
        `Error al actualizar presentación de venta (HTTP ${response.status})`
    );
  }

  return (data?.presentacion || data?.data || data) as Presentacion;
}

/**
 * Elimina una presentación de venta.
 * Endpoint: DELETE /api/presentaciones/{id}
 * Falla con 409 Conflict si es la última presentación del producto.
 */
export async function eliminarPresentacion(
  presentacionId: number | string,
  token?: string | null
): Promise<void> {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new Error("No hay un token de autenticación disponible.");
  }

  const response = await fetch(
    `${API_BASE_URL}/presentaciones/${presentacionId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(authToken),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(
        data?.message ||
          "No se puede eliminar la única presentación del producto. Debe existir al menos una presentación activa."
      );
    }
    throw new Error(
      data?.message ||
        `Error al eliminar presentación de venta (HTTP ${response.status})`
    );
  }
}

