/**
 * Utilidades centralizadas de formateo de fechas para BottleTrack / Cava & Cobre.
 * Garantiza formateo legible uniforme (ej: "09 de septiembre de 2026" / "09 Septiembre 2026")
 * tanto para strings ISO como para fechas estándar.
 */

/**
 * Formatea una fecha ISO o string a un formato legible en español.
 * Ejemplo de salida: "09 Septiembre 2026"
 */
export function formatDateLegible(dateStr?: string | null): string {
  if (!dateStr) return "—";

  try {
    // Si viene solo fecha en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      const formatted = new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(date);

      // Capitalizar el mes: "09 Septiembre 2026"
      return formatted.replace(/\b([a-záéíóúñ]+)\b/g, (match, p1, offset) =>
        offset > 2 ? match.charAt(0).toUpperCase() + match.slice(1) : match
      );
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);

    const formatted = new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);

    return formatted.replace(/\b([a-záéíóúñ]+)\b/g, (match, p1, offset) =>
      offset > 2 ? match.charAt(0).toUpperCase() + match.slice(1) : match
    );
  } catch {
    return String(dateStr);
  }
}

/**
 * Formatea una fecha con hora incluida.
 * Ejemplo de salida: "09 Septiembre 2026, 02:30 PM"
 */
export function formatDateTimeLegible(dateStr?: string | null): string {
  if (!dateStr) return "—";

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return formatDateLegible(dateStr);

    const fechaParte = formatDateLegible(dateStr);
    const horaParte = new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);

    return `${fechaParte}, ${horaParte}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Formatea una fecha corta.
 * Ejemplo: "09/09/2026"
 */
export function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return "—";

  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-").map(Number);
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);

    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return String(dateStr);
  }
}

/**
 * Calcula la diferencia en días entre la fecha dada ('YYYY-MM-DD') y la fecha actual en hora local,
 * evitando desfases de zona horaria (sin new Date(string) directo).
 * Retorna:
 *  - Positivo (>0): Días restantes para vencer
 *  - 0: Vence hoy
 *  - Negativo (<0): Días transcurridos desde que venció
 *  - null: Si la fecha es inválida o no existe
 */
export function diasParaVencer(fechaStr?: string | null): number | null {
  if (!fechaStr) return null;

  const match = String(fechaStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);

  // Fecha objetivo en hora local (00:00:00)
  const target = new Date(year, month, day, 0, 0, 0, 0);

  // Fecha actual en hora local (00:00:00)
  const now = new Date();
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const diffMs = target.getTime() - hoy.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Genera el texto legible y descriptivo del vencimiento de un producto.
 * Salidas: "Vencido hace N días", "Vence hoy", "Vence mañana", "Vence en N días".
 */
export function textoVencimiento(fechaStr?: string | null): string | null {
  const dias = diasParaVencer(fechaStr);
  if (dias === null) return null;

  if (dias < 0) {
    const absDias = Math.abs(dias);
    return absDias === 1 ? "Vencido hace 1 día" : `Vencido hace ${absDias} días`;
  }

  if (dias === 0) {
    return "Vence hoy";
  }

  if (dias === 1) {
    return "Vence mañana";
  }

  return `Vence en ${dias} días`;
}
