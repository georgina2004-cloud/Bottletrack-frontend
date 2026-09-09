"use client";

import { useMemo, useState, useEffect } from "react";
import { useCompanyConfig } from "@/context/CompanyConfigContext";

/**
 * Convierte un color HEX (#RGB, #RRGGBB) a formato HSL { h, s, l }.
 * Hue: 0-360, Saturation: 0-1, Lightness: 0-1
 */
export function hexToHsl(hexInput: string): { h: number; s: number; l: number } {
  let hex = hexInput.trim().replace(/^#/, "");

  // Expandir formato corto de 3 caracteres (#fff -> #ffffff)
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  // Fallback si no es un HEX válido
  if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) {
    return { h: 36, s: 1, l: 0.41 }; // Ámbar default
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / delta + 2) * 60;
        break;
      case b:
        h = ((r - g) / delta + 4) * 60;
        break;
    }
  }

  return { h: Math.round(h), s, l };
}

/**
 * Calcula la luminancia relativa (0 a 1) según el estándar WCAG 2.1.
 * Referencia: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function calcularLuminancia(hexInput: string): number {
  let hex = hexInput.trim().replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) {
    return 0.1; // Default oscuro
  }

  const sRGBtoLin = (val: number) => {
    const c = val / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const r = sRGBtoLin(parseInt(hex.substring(0, 2), 16));
  const g = sRGBtoLin(parseInt(hex.substring(2, 4), 16));
  const b = sRGBtoLin(parseInt(hex.substring(4, 6), 16));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determina el color de texto óptimo (#ffffff o #171717) para garantizar máxima legibilidad y contraste
 * sobre un color de fondo dinámico según la luminancia relativa WCAG.
 * - Fondos claros (luminancia > 0.45, ej: amarillo, cian claro, verde lima): devuelve "#171717" (oscuro).
 * - Fondos oscuros/medios (luminancia <= 0.45, ej: cobre, azul marino, vino, negro): devuelve "#ffffff" (blanco).
 */
export function obtenerColorTextoContraste(hexInput: string): string {
  const luminancia = calcularLuminancia(hexInput);
  return luminancia > 0.45 ? "#171717" : "#ffffff";
}

/**
 * Convierte valores HSL { h (0-360), s (0-1), l (0-1) } a formato HEX (#rrggbb).
 */
export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else if (h >= 300 && h < 360) {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(rPrime)}${toHex(gPrime)}${toHex(bPrime)}`.toUpperCase();
}

/**
 * Genera una paleta armónica de `cantidad` colores en formato HEX basada en un color base.
 * Mantiene el tono (Hue) y ajusta la luminosidad progresivamente entre ~28% y ~75%,
 * adaptando la saturación para garantizar contraste y elegancia en gráficos.
 */
export function generarPaletaDesdeColor(colorBaseHex: string, cantidad: number): string[] {
  if (cantidad <= 0) return [];
  if (cantidad === 1) return [colorBaseHex.startsWith("#") ? colorBaseHex : `#${colorBaseHex}`];

  const { h, s } = hexToHsl(colorBaseHex);

  const minL = 0.28;
  const maxL = 0.74;
  const step = (maxL - minL) / (cantidad - 1);

  const paleta: string[] = [];

  for (let i = 0; i < cantidad; i++) {
    const currentL = minL + i * step;
    // Ajuste sutil de saturación para evitar colores deslavados en extremos
    const currentS = Math.min(1, Math.max(0.25, s * (1.15 - Math.abs(currentL - 0.5) * 0.4)));
    paleta.push(hslToHex(h, currentS, currentL));
  }

  return paleta;
}

/**
 * Hook de React para obtener la paleta dinámica del color de marca configurado.
 * Lee el color actual desde el CompanyConfigContext / DOM y se recalcula instantáneamente
 * al cambiar el color sin recargar la página.
 */
export function usePaletaMarca(cantidad: number = 6): {
  colorPrimario: string;
  paleta: string[];
} {
  const { colorPrimario } = useCompanyConfig();
  const [domColor, setDomColor] = useState<string>(colorPrimario || "#D17B00");

  useEffect(() => {
    if (colorPrimario) {
      setDomColor(colorPrimario);
    } else if (typeof document !== "undefined") {
      const computed = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary-brand")
        .trim();
      if (computed) setDomColor(computed);
    }
  }, [colorPrimario]);

  const paleta = useMemo(() => {
    return generarPaletaDesdeColor(domColor, cantidad);
  }, [domColor, cantidad]);

  return { colorPrimario: domColor, paleta };
}
