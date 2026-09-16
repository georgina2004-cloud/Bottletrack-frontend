"use client";

import { useState, useEffect } from "react";

/**
 * Hook para retrasar la actualización de un valor hasta que el usuario haya dejado de escribir
 * @param value Valor a retrasar (ej: término de búsqueda)
 * @param delay Milisegundos de espera (por defecto 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
