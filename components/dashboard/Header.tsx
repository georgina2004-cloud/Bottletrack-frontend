"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAlertas } from "@/hooks/useAlertas";
import { textoVencimiento } from "@/lib/formatDate";
import { Wordmark } from "@/components/auth/Wordmark";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  AlertTriangle,
  AlertOctagon,
  Clock,
  PackageX,
  CheckCircle2,
} from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { vencidos, porVencer, stockBajo, total } = useAlertas();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cerrar menús flotantes al navegar
  useEffect(() => {
    setShowNotifications(false);
    setShowUserMenu(false);
  }, [pathname]);

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle, Dynamic Brand & Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-lg lg:hidden cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Branding Indicator */}
        <div className="lg:hidden flex items-center">
          <Wordmark size="sm" theme="dark" showSubtitle={false} />
        </div>

        {/* Global Search Bar (Linear/Stripe style) */}
        <div className="relative w-full max-w-sm hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar producto, lote, factura... (⌘K)"
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all"
          />
        </div>
      </div>

      {/* Right: Notifications & User Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* ========================================================================= */}
        {/* NOTIFICACIONES (POPOVER INTERACTIVO CONECTADO A DATOS REALES)            */}
        {/* ========================================================================= */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            aria-label="Notificaciones del sistema"
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {total > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-50 duration-150">
                {total > 9 ? "9+" : total}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header de Notificaciones */}
              <div className="p-3.5 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    Notificaciones y Alertas
                  </span>
                  {total > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      {total} {total === 1 ? "alerta" : "alertas"}
                    </span>
                  )}
                </div>

                <Link
                  href="/productos"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] text-brand hover:text-brand-hover font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver inventario →</span>
                </Link>
              </div>

              {/* Lista de Notificaciones */}
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {total === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">
                      No hay notificaciones pendientes
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Todo el inventario y las operaciones se encuentran al día.
                    </p>
                  </div>
                ) : (
                  <div className="py-1">
                    {/* SECCIÓN 1: PRODUCTOS VENCIDOS */}
                    {vencidos.length > 0 && (
                      <div>
                        <div className="px-4 py-1.5 bg-rose-50/70 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            Vencidos ({vencidos.length})
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {vencidos.map((prod) => (
                            <Link
                              key={`vencido-${prod.id}`}
                              href="/productos?alerta_vencimiento=1"
                              onClick={() => setShowNotifications(false)}
                              className="p-3.5 flex items-start gap-3 hover:bg-rose-50/40 transition-colors cursor-pointer group"
                            >
                              <div className="p-2 rounded-xl shrink-0 mt-0.5 bg-rose-100 text-rose-700">
                                <AlertOctagon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-rose-700 transition-colors">
                                  {prod.nombre}
                                </p>
                                <p className="text-[11px] font-semibold text-rose-600">
                                  {textoVencimiento(prod.fecha_vencimiento) || "Producto vencido"}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SECCIÓN 2: PRODUCTOS POR VENCER */}
                    {porVencer.length > 0 && (
                      <div>
                        <div className="px-4 py-1.5 bg-amber-50/70 flex items-center justify-between border-t border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Por vencer en 30 días ({porVencer.length})
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {porVencer.map((prod) => (
                            <Link
                              key={`porvencer-${prod.id}`}
                              href="/productos?alerta_vencimiento=1"
                              onClick={() => setShowNotifications(false)}
                              className="p-3.5 flex items-start gap-3 hover:bg-amber-50/40 transition-colors cursor-pointer group"
                            >
                              <div className="p-2 rounded-xl shrink-0 mt-0.5 bg-amber-100 text-amber-800">
                                <Clock className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-800 transition-colors">
                                  {prod.nombre}
                                </p>
                                <p className="text-[11px] font-semibold text-amber-700">
                                  {textoVencimiento(prod.fecha_vencimiento) || "Próximo a vencer"}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SECCIÓN 3: STOCK BAJO */}
                    {stockBajo.length > 0 && (
                      <div>
                        <div className="px-4 py-1.5 bg-amber-50/70 flex items-center justify-between border-t border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Stock bajo ({stockBajo.length})
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {stockBajo.map((prod) => (
                            <Link
                              key={`stockbajo-${prod.id}`}
                              href="/productos"
                              onClick={() => setShowNotifications(false)}
                              className="p-3.5 flex items-start gap-3 hover:bg-amber-50/40 transition-colors cursor-pointer group"
                            >
                              <div className="p-2 rounded-xl shrink-0 mt-0.5 bg-amber-100 text-amber-800">
                                <PackageX className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-800 transition-colors">
                                  {prod.nombre}
                                </p>
                                <p className="text-[11px] font-semibold text-amber-700">
                                  Stock: {prod.stock_actual} (mínimo {prod.stock_minimo})
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PERFIL DE USUARIO & DROPDOWN                                              */}
        {/* ========================================================================= */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pl-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            {/* Avatar Pill */}
            <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>

            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || "Administrador"}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">
                {user?.email || "admin@bottletrack.com"}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          </button>

          {/* User Popover Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || "Administrador"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email || "admin@bottletrack.com"}
                </p>
                <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-brand/10 text-brand border border-brand/20">
                  {user?.role || "Gerente de Bodega"}
                </span>
              </div>

              <div className="p-1 space-y-1">
                <button
                  type="button"
                  onClick={logout}
                  disabled={isAuthLoading}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
