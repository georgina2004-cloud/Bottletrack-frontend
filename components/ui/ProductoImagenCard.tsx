"use client";

import React from "react";
import { Wine } from "lucide-react";

interface ProductoImagenCardProps {
  imagenUrl?: string | null;
  alt: string;
  aspectRatio?: "3/4" | "4/5" | "square";
  className?: string;
  badges?: React.ReactNode;
  fallbackIconClassName?: string;
}

/**
 * Componente reutilizable para el contenedor de imagen de productos
 * con fallback elegante de licorería y proporciones óptimas para botellas.
 */
export function ProductoImagenCard({
  imagenUrl,
  alt,
  aspectRatio = "3/4",
  className = "",
  badges,
  fallbackIconClassName = "w-14 h-14 sm:w-16 sm:h-16 stroke-[1.2] text-slate-300/80",
}: ProductoImagenCardProps) {
  const aspectClass =
    aspectRatio === "3/4"
      ? "aspect-[3/4]"
      : aspectRatio === "4/5"
      ? "aspect-[4/5]"
      : "aspect-square";

  return (
    <div
      className={`relative w-full ${aspectClass} bg-stone-50/80 flex items-center justify-center p-2 border-b border-slate-100 overflow-hidden ${className}`}
    >
      {imagenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagenUrl}
          alt={alt}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-300">
          <Wine className={fallbackIconClassName} />
        </div>
      )}

      {/* Badges / Overlays opcionales pasados como children */}
      {badges}
    </div>
  );
}
