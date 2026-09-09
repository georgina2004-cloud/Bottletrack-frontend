/**
 * Mapeo y utilidades de recomendación y venta cruzada (cross-selling)
 * para el Punto de Venta (POS) de BottleTrack.
 */

export const MAPEO_SUGERENCIAS: Record<string, string[]> = {
  "Rones": ["Refrescos", "Snacks"],
  "Ron": ["Refrescos", "Snacks"],
  "Whisky": ["Refrescos", "Snacks"],
  "Whiskey": ["Refrescos", "Snacks"],
  "Vodka": ["Refrescos", "Snacks"],
  "Tequila": ["Refrescos", "Snacks"],
  "Vinos": ["Snacks"],
  "Vino": ["Snacks"],
  "Cervezas": ["Snacks"],
  "Cerveza": ["Snacks"],
  "Ginebra": ["Refrescos", "Snacks"],
  "Gin": ["Refrescos", "Snacks"],
  "Licores": ["Refrescos", "Snacks"],
  "Licor": ["Refrescos", "Snacks"],
};

/**
 * Retorna la lista de nombres de categorías recomendadas según la categoría dada
 */
export function obtenerCategoriasSugeridasPara(categoriaNombre: string): string[] {
  if (!categoriaNombre) return [];
  const clean = categoriaNombre.trim();

  // Coincidencia exacta
  if (MAPEO_SUGERENCIAS[clean]) {
    return MAPEO_SUGERENCIAS[clean];
  }

  // Coincidencia insensible a mayúsculas
  const exactCase = Object.keys(MAPEO_SUGERENCIAS).find(
    (k) => k.toLowerCase() === clean.toLowerCase()
  );
  if (exactCase) {
    return MAPEO_SUGERENCIAS[exactCase];
  }

  // Coincidencia parcial por subcadena
  const partial = Object.keys(MAPEO_SUGERENCIAS).find(
    (k) =>
      clean.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(clean.toLowerCase())
  );
  if (partial) {
    return MAPEO_SUGERENCIAS[partial];
  }

  return [];
}
