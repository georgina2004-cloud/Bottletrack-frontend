"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Wordmark } from "@/components/auth/Wordmark";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  User as UserIcon,
  AlertTriangle,
  Receipt,
  CheckCheck,
  CheckCircle2,
  PackageX,
  X,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: "stock" | "sale" | "system";
  time: string;
  read: boolean;
  href?: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Stock bajo en inventario",
    description: "Rancho Escondido 750ml ha alcanzado su nivel mínimo (2 unidades).",
    type: "stock",
    time: "Hace 15 min",
    read: false,
    href: "/productos",
  },
  {
    id: "notif-2",
    title: "Reabastecimiento sugerido",
    description: "Flor de Caña 12 Años tiene alta demanda esta semana.",
    type: "stock",
    time: "Hace 1 hora",
    read: false,
    href: "/compras",
  },
  {
    id: "notif-3",
    title: "Factura generada",
    description: "Venta registrada por $145.00 a Consumidor Final.",
    type: "sale",
    time: "Hace 2 horas",
    read: true,
    href: "/ventas",
  },
];

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout, isLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Cerrar menús flotantes al hacer clic fuera
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarcarTodasLeidas = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarcarUnaLeida = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

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
        {/* NOTIFICACIONES (POPOVER INTERACTIVO)                                      */}
        {/* ========================================================================= */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            aria-label="Notificaciones del sistema"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header de Notificaciones */}
              <div className="p-3.5 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    Notificaciones
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-brand/10 text-brand border border-brand/20">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarcarTodasLeidas}
                    className="text-[11px] text-brand hover:text-brand-hover font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Marcar leídas</span>
                  </button>
                )}
              </div>

              {/* Lista de Notificaciones */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">
                      Sin notificaciones pendientes
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Todo el inventario y las ventas se encuentran al día.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarcarUnaLeida(n.id)}
                      className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        !n.read ? "bg-amber-50/30" : ""
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          n.type === "stock"
                            ? "bg-amber-100/80 text-amber-700"
                            : n.type === "sale"
                            ? "bg-emerald-100/80 text-emerald-700"
                            : "bg-blue-100/80 text-blue-700"
                        }`}
                      >
                        {n.type === "stock" ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : n.type === "sale" ? (
                          <Receipt className="w-3.5 h-3.5" />
                        ) : (
                          <PackageX className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs truncate ${!n.read ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">
                          {n.description}
                        </p>
                        {n.href && (
                          <Link
                            href={n.href}
                            onClick={() => setShowNotifications(false)}
                            className="inline-block text-[10px] font-semibold text-brand hover:underline pt-1"
                          >
                            Ver detalle →
                          </Link>
                        )}
                      </div>

                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-2" />
                      )}
                    </div>
                  ))
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
                  disabled={isLoading}
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
