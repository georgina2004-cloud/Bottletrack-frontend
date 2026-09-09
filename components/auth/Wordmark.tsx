"use client";

import React, { useState } from "react";
import { useCompanyConfig } from "@/context/CompanyConfigContext";

interface WordmarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  theme?: "light" | "dark";
  showSubtitle?: boolean;
  tagline?: string;
  className?: string;
  showLogo?: boolean;
}

function getFullImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const backendBase = apiBase.replace(/\/api\/?$/, "");
  return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function Wordmark({
  size = "lg",
  theme = "dark",
  showSubtitle = false,
  tagline = "CONTROL DE INVENTARIO",
  className = "",
  showLogo = true,
}: WordmarkProps) {
  const { nombreLicoreria, logoUrl, colorPrimario } = useCompanyConfig();
  const [imgError, setImgError] = useState<boolean>(false);

  const sizeMap = {
    sm: "text-lg sm:text-xl",
    md: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-3xl lg:text-4xl",
    xl: "text-3xl sm:text-4xl lg:text-5xl",
  };

  const logoSizeMap = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const primaryTextColor = theme === "light" ? "text-white" : "text-[#18181B]";
  const subtitleColor = theme === "light" ? "text-slate-300" : "text-slate-500";

  const resolvedLogoUrl = !imgError ? getFullImageUrl(logoUrl) : null;
  const name = (nombreLicoreria || "BottleTrack").trim();

  // Función para dividir el nombre en dos tonos
  const renderTwoToneTitle = () => {
    // 1. Caso multi-palabras: "Cava & Cobre", "Licorería La Fina", "El Barril"
    const words = name.split(/\s+/);
    if (words.length > 1) {
      const firstWord = words[0];
      const restOfWords = words.slice(1).join(" ");
      return (
        <span className="truncate max-w-[220px] sm:max-w-xs inline-flex items-center gap-1.5">
          <span className={primaryTextColor}>{firstWord}</span>
          <span
            style={{ color: colorPrimario || "var(--primary-brand)" }}
            className="text-brand font-serif font-bold truncate"
          >
            {restOfWords}
          </span>
        </span>
      );
    }

    // 2. Caso PascalCase/CamelCase en una sola palabra: "BottleTrack", "CavaCobre", "LicorExpress"
    const camelMatch = name.match(/^([A-ZÁÉÍÓÚÑ][a-záéíóúñ0-9]+)([A-ZÁÉÍÓÚÑ].*)$/);
    if (camelMatch) {
      return (
        <span className="truncate max-w-[220px] sm:max-w-xs inline-flex items-center">
          <span className={primaryTextColor}>{camelMatch[1]}</span>
          <span
            style={{ color: colorPrimario || "var(--primary-brand)" }}
            className="text-brand font-serif font-bold"
          >
            {camelMatch[2]}
          </span>
        </span>
      );
    }

    // 3. Palabra simple única: "Licorería"
    return (
      <span className={`truncate max-w-[220px] sm:max-w-xs ${primaryTextColor}`}>
        {name}
      </span>
    );
  };

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="flex items-center gap-2.5">
        {showLogo && resolvedLogoUrl && (
          <div
            className={`relative ${logoSizeMap[size]} rounded-md overflow-hidden shrink-0 flex items-center justify-center`}
          >
            <img
              src={resolvedLogoUrl}
              alt={name}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        <span
          className={`font-serif font-bold tracking-tight select-none ${sizeMap[size]} flex items-center leading-none`}
        >
          {renderTwoToneTitle()}
        </span>
      </div>

      {showSubtitle && (
        <span
          className={`text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold mt-1.5 ${subtitleColor}`}
        >
          {tagline}
        </span>
      )}
    </div>
  );
}
