/**
 * Contrato de tipos para el Setup Inicial y la Configuración de Empresa en BottleTrack
 */

export interface SetupEstadoResponse {
  configurado: boolean;
}

export interface SetupInicializarResponse {
  message?: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface ConfiguracionPublica {
  configurado: boolean;
  nombre_licoreria?: string;
  logo_url?: string | null;
  color_primario?: string | null;
  moneda?: string | null;
}

export interface ConfiguracionEmpresa {
  id?: number;
  nombre_licoreria: string;
  eslogan?: string | null;
  telefono?: string | null;
  email_empresa?: string | null;
  direccion?: string | null;
  moneda: string;
  color_primario: string;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SetupFormStep1 {
  nombre_licoreria: string;
  eslogan?: string;
  telefono?: string;
  email_empresa?: string;
  direccion?: string;
  moneda: string;
  color_primario: string;
  logo?: File | null;
}

export interface SetupFormStep2 {
  admin_name: string;
  admin_email: string;
  admin_password: string;
  admin_password_confirmation: string;
}

export interface SetupFormData extends SetupFormStep1, SetupFormStep2 {}
