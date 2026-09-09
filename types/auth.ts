/**
 * Contrato de tipos de autenticación para BottleTrack Frontend <-> Laravel Sanctum Backend
 */

export type UserRole =
  | "Gerente de Bodega"
  | "Encargado de Ventas"
  | "Auditor"
  | "Administrador"
  | "admin"
  | (string & {});

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Contrato de respuesta esperado de Laravel Sanctum en POST /api/login
 */
export interface LoginResponse {
  token: string;
  user: User;
  message?: string;
}

/**
 * Formato estándar de errores HTTP devueltos por Laravel (401, 422, etc.)
 */
export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}
