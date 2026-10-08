/**
 * Tipos e interfaces para el módulo de Registro de Auditoría (Audit Logs) de BottleTrack.
 */

export interface AuditLogUsuario {
  id?: number;
  name: string;
  email?: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: "crear" | "actualizar" | "eliminar" | "anular" | "restaurar" | string;
  auditable_type: string;
  auditable_id: number;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent?: string | null;
  created_at: string;
  usuario?: AuditLogUsuario | null;
}

export interface AuditLogsPaginadosResponse {
  data: AuditLog[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  from?: number;
  to?: number;
}

export interface AuditLogFiltros {
  usuario_id?: number | string;
  desde?: string;
  hasta?: string;
  modulo?: string;
  page?: number;
}
