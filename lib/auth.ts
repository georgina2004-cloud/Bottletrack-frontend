import Cookies from "js-cookie";
import { LoginCredentials, LoginResponse, User, ApiErrorResponse } from "@/types/auth";

export const AUTH_TOKEN_KEY = "bottletrack_token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Utilidades para manejo de cookies de autenticación
 */
export function getStoredToken(): string | undefined {
  return Cookies.get(AUTH_TOKEN_KEY);
}

/**
 * Guarda el token de Sanctum en cookie.
 * @param token Token de texto plano devuelto por Sanctum
 * @param remember Si es true, expira en 30 días; si es false, es una cookie de sesión (se borra al cerrar el navegador)
 */
export function setStoredToken(token: string, remember: boolean = false): void {
  Cookies.set(AUTH_TOKEN_KEY, token, {
    expires: remember ? 30 : undefined, // 30 días vs duración de sesión
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function removeStoredToken(): void {
  Cookies.remove(AUTH_TOKEN_KEY, { path: "/" });
}

/**
 * Cliente HTTP para comunicarse con los endpoints de Laravel Sanctum
 */

// TODO: [Laravel Backend Integration]
// Endpoint: POST /api/login
// Payload enviado: { "email": "usuario@ejemplo.com", "password": "mipassword" }
// Headers enviados: { "Content-Type": "application/json", "Accept": "application/json" }
// Respuesta esperada (200 OK):
// {
//   "token": "1|sanctum_plain_text_token_string...",
//   "user": {
//     "id": 1,
//     "name": "Administrador",
//     "email": "admin@bottletrack.com",
//     "role": "admin"
//   }
// }
// Respuestas de error esperadas:
// - 401 Unauthorized: { "message": "Credenciales incorrectas" }
// - 422 Unprocessable Entity: { "message": "Los datos proporcionados no son válidos", "errors": { "email": ["..."] } }
export async function loginWithCredentials(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorData = data as ApiErrorResponse | null;
    const errorMessage =
      errorData?.message ||
      (errorData?.errors && Object.values(errorData.errors)[0]?.[0]) ||
      (response.status === 401
        ? "Credenciales incorrectas. Verifica tu correo y contraseña."
        : "Error al iniciar sesión. Por favor intenta más tarde.");
    throw new Error(errorMessage);
  }

  if (!data?.token) {
    throw new Error("Respuesta inválida del servidor: no se recibió el token de autenticación.");
  }

  return data as LoginResponse;
}

// TODO: [Laravel Backend Integration]
// Endpoint: POST /api/logout
// Headers requeridos: Authorization: Bearer <token>, Accept: application/json
// Respuesta esperada: 200 OK con { "message": "Sesión cerrada correctamente" }
export async function logoutUser(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    // Si falla la petición de red, se procede con la limpieza local en el frontend
    console.error("Error al revocar token en Laravel:", error);
  }
}

// TODO: [Laravel Backend Integration]
// Endpoint: GET /api/user
// Headers requeridos: Authorization: Bearer <token>, Accept: application/json
// Respuesta esperada: 200 OK con el objeto User
export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/user`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener el perfil de usuario o el token es inválido.");
  }

  const data = await response.json();
  return data as User;
}
