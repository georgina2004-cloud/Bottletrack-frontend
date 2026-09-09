"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface DetailDrawerProps {
  /** Controla si el panel está abierto o cerrado */
  isOpen: boolean;
  /** Callback para cerrar el panel */
  onClose: () => void;
  /** Título mostrado en el encabezado del drawer */
  title: string;
  /** Subtítulo opcional debajo del título (ej: número de factura, ID) */
  subtitle?: string;
  /** Nodo JSX del ícono que acompaña al título */
  icon?: React.ReactNode;
  /** Contenido específico de cada módulo */
  children: React.ReactNode;
}

/**
 * Panel lateral deslizante reutilizable (Drawer / Side-sheet).
 *
 * - Se desliza desde la derecha con animación CSS de transición.
 * - Cierra con: clic en overlay, botón ×, o tecla Escape.
 * - Ancho fijo en desktop (w-[460px]), pantalla completa en mobile.
 * - Bloquea el scroll del body mientras está abierto.
 * - El contenido queda en un contenedor scrolleable independiente.
 */
export function DetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
}: DetailDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Foco inicial en el drawer al abrir (accesibilidad)
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* ── Overlay semitransparente ──────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`
          fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]
          transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* ── Panel lateral ────────────────────────────────────────────────── */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`
          fixed top-0 right-0 z-50 h-full
          w-full sm:w-[460px]
          bg-white shadow-2xl border-l border-slate-200
          flex flex-col
          transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          outline-none
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* ── Encabezado ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="p-2 rounded-xl bg-brand/10 text-brand shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#18181B] tracking-tight truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Contenido scrolleable ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </aside>
    </>
  );
}
