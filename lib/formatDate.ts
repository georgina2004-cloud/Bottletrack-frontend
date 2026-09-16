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
