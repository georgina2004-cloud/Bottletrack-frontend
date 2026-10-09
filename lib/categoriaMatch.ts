/**
 * Normaliza una cadena de texto para comparaciones flexibles:
 * Descompone caracteres con diacríticos (NFD), elimina acentos/marcas diacríticas,
 * convierte a minúsculas y elimina espacios iniciales/finales.
 */
function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Busca la primera categoría cuyo nombre normalizado incluya el texto sugerido normalizado.
 * Ejemplo: la sugerencia "ron" calzará con "Rones", "vodka" con "Vodkas", etc.
 * Si la sugerencia está vacía o es solo espacios en blanco, retorna undefined.
 */
export function buscarCategoriaPorSugerencia<T extends { id: number; nombre: string }>(
  sugerida: string,
  categorias: T[]
): T | undefined {
  const normSugerida = normalizarTexto(sugerida || "");
  if (!normSugerida) {
    return undefined;
  }

  return categorias.find((cat) => {
    const normNombre = normalizarTexto(cat.nombre || "");
    return normNombre.includes(normSugerida);
  });
}
