"use client";

import { useCompanyConfig } from "@/context/CompanyConfigContext";
import { useCallback } from "react";


export function formatMoney(
  valor: number | string | null | undefined,
  moneda: string = "C$"
): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const num = typeof valor === "number" ? valor : parseFloat(String(valor));
  if (isNaN(num)) return "—";

  const formattedNumber = num.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbol = (moneda || "C$").trim();
  return `${symbol} ${formattedNumber}`;
}

/**
 * Formatea el valor de presentacion_ml a número sin decimales forzados + " ml".
 * Ej: formatPresentacionMl("750.00") => "750 ml"
 *     formatPresentacionMl(750) => "750 ml"
 *     formatPresentacionMl(null) => ""
 */
export function formatPresentacionMl(
  val: string | number | null | undefined
): string {
  if (!val && val !== 0) return "";
  const str = String(val).trim();
  if (str === "") return "";
  const num = typeof val === "number" ? val : parseFloat(str);
  if (isNaN(num)) return str.endsWith("ml") ? str : `${str} ml`;

  // Si no tiene parte decimal real (ej. 750.00), mostrar entero
  const formatted = num % 1 === 0 ? num.toFixed(0) : num.toString();
  return `${formatted} ml`;
}

/**
 * Hook para obtener el símbolo de moneda actual y la función formatMoneda reactiva
 * que consume CompanyConfigContext.
 */
export function useMoneda() {
  const { moneda } = useCompanyConfig();
  const currentMoneda = moneda || "C$";

  const formatMoneda = useCallback(
    (valor: number | string | null | undefined): string => {
      return formatMoney(valor, currentMoneda);
    },
    [currentMoneda]
  );

  return {
    moneda: currentMoneda,
    formatMoneda,
    formatMoney: formatMoneda,
  };
}
