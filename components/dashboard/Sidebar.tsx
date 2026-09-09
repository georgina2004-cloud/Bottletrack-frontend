"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/auth/Wordmark";
import { usePermisos } from "@/hooks/usePermisos";
import { ModuloSistema } from "@/lib/permisos";
import {
  LayoutDashboard,
  Boxes,
  Layers,
  Users,
  Receipt,
  ShoppingCart,
  Sparkles,
  UserCog,
  BarChart3,
  Settings,
  ShieldCheck,
  User,
  Database,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Wine,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SubMenuItem {
  label: string;
  href: string;
}

export interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  modulo: ModuloSistema;
  badge?: string;
  submenu?: SubMenuItem[];
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { tieneAcceso, rol } = usePermisos();

  // Estado de colapso con persistencia en localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Estado para acordeón de submenús en modo expandido
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  // Estado para flyout flotante en modo colapsado
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const flyoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Cargar preferencia de colapsado desde localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("bottletrack_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // Ignorar si localStorage está restringido
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("bottletrack_sidebar_collapsed", String(next));
      } catch {
        // Ignorar
      }
      return next;
    });
    setActiveFlyout(null);
  };

  // Módulos del sistema con submenús reales
  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, modulo: "dashboard" },
    { name: "Productos", href: "/productos", icon: Boxes, modulo: "productos" },
    { name: "Categorías", href: "/categorias", icon: Layers, modulo: "categorias" },
    { name: "Proveedores", href: "/proveedores", icon: Users, modulo: "proveedores" },
    { name: "Ventas", href: "/ventas", icon: Receipt, modulo: "ventas" },
    { name: "Compras", href: "/compras", icon: ShoppingCart, modulo: "compras" },
    { name: "Usuarios", href: "/usuarios", icon: UserCog, modulo: "usuarios" },
    { name: "Permisos", href: "/usuarios/permisos", icon: ShieldCheck, modulo: "roles" },
    {
      name: "Reportes",
      icon: BarChart3,
      modulo: "reportes",
      submenu: [
        { label: "Factura Imprimible", href: "/reportes/factura-imprimible" },
        { label: "Maestro-Detalle Ventas", href: "/reportes/maestro-detalle-ventas" },
        { label: "Inventario Actual", href: "/reportes/inventario-actual" },
        { label: "Stock Bajo", href: "/reportes/stock-bajo" },
        { label: "Ventas por Fechas", href: "/reportes/ventas-por-fechas" },
        { label: "Ventas por Vendedor", href: "/reportes/ventas-por-vendedor" },
        { label: "Compras por Proveedor", href: "/reportes/compras-por-proveedor" },
        { label: "Movimientos de Inventario", href: "/reportes/movimientos-inventario" },
      ],
    },
    { name: "Configuración", href: "/configuracion", icon: Settings, modulo: "configuracion" },
    { name: "Respaldos", href: "/respaldos", icon: Database, modulo: "respaldos" },
    { name: "Mi Perfil", href: "/perfil", icon: User, modulo: "dashboard" },
  ];

  // Auto-expandir submenú si la ruta actual coincide
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.submenu) {
        const isInSubmenu = item.submenu.some(
          (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")
        );
        if (isInSubmenu) {
          setOpenSubmenus((prev) => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [pathname]);

  const toggleSubmenu = (itemName: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const handleFlyoutMouseEnter = (itemName: string) => {
    if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
    setActiveFlyout(itemName);
  };

  const handleFlyoutMouseLeave = () => {
    flyoutTimeoutRef.current = setTimeout(() => {
      setActiveFlyout(null);
    }, 200);
  };

  // Filtrar elementos de navegación según permisos del rol en sesión
  const visibleNavItems = navItems.filter((item) => tieneAcceso(item.modulo));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/80
          flex flex-col justify-between transition-[width,transform] duration-200 ease-in-out
          lg:sticky lg:top-0 lg:h-screen
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-[68px]" : "lg:w-64"}
          w-64
        `}
      >
        {/* Brand Header & Collapse Button */}
        <div className="h-16 px-3.5 flex items-center justify-between border-b border-slate-100 shrink-0 bg-white">
          {!isCollapsed ? (
            <>
              <Link href="/dashboard" className="flex items-center min-w-0 pl-1.5">
                <Wordmark size="sm" theme="dark" showSubtitle={false} />
              </Link>
              <button
                type="button"
                onClick={toggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Colapsar menú lateral"
                aria-label="Colapsar menú lateral"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={toggleCollapse}
                className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                title="Expandir menú lateral"
                aria-label="Expandir menú lateral"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {/* En mobile o fallback */}
              <div className="lg:hidden flex items-center justify-between w-full px-2">
                <Link href="/dashboard">
                  <Wordmark size="sm" theme="dark" showSubtitle={false} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Links */}
        <nav
          className="flex-1 p-2.5 space-y-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(203,213,225,0.4)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent"
          aria-label="Navegación principal"
        >
          {!isCollapsed && (
            <div className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
              Menú Principal
            </div>
          )}

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const hasSubmenu = Boolean(item.submenu && item.submenu.length > 0);

            // Determinar si este módulo o alguno de sus hijos está activo
            const isChildActive = hasSubmenu
              ? item.submenu!.some(
                  (sub) =>
                    pathname === sub.href ||
                    pathname.startsWith(sub.href + "/") ||
                    (sub.href.startsWith("/reportes") && pathname.startsWith("/reportes"))
                )
              : false;

            const isDirectActive = item.href
              ? pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              : false;

            const isActive = isDirectActive || isChildActive;
            const isSubmenuOpen = Boolean(openSubmenus[item.name]);
            const isFlyoutActive = activeFlyout === item.name;

            // ===============================================================
            // CASO A: ÍTEM CON SUBMENÚ (ej. Reportes)
            // ===============================================================
            if (hasSubmenu) {
              return (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => {
                    if (isCollapsed) handleFlyoutMouseEnter(item.name);
                  }}
                  onMouseLeave={() => {
                    if (isCollapsed) handleFlyoutMouseLeave();
                  }}
                >
                  {/* Botón Padre del Submenú */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCollapsed) {
                        toggleSubmenu(item.name);
                      } else {
                        setActiveFlyout(isFlyoutActive ? null : item.name);
                      }
                    }}
                    className={`
                      w-full flex items-center rounded-xl text-xs font-semibold
                      transition-all duration-150 group cursor-pointer
                      ${isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"}
                      ${
                        isActive
                          ? "bg-brand/10 text-brand font-bold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }
                    `}
                    title={isCollapsed ? item.name : undefined}
                    aria-expanded={!isCollapsed ? isSubmenuOpen : isFlyoutActive}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-brand"
                            : "text-slate-400 group-hover:text-slate-700"
                        }`}
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>

                    {!isCollapsed && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          isSubmenuOpen ? "rotate-180 text-brand" : ""
                        }`}
                      />
                    )}
                  </button>

                  {/* 1. Modo Expandido: Acordeón Inline */}
                  {!isCollapsed && isSubmenuOpen && item.submenu && (
                    <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 ml-5 my-0.5 animate-in slide-in-from-top-1 fade-in-50 duration-150">
                      {item.submenu.map((sub) => {
                        const isSubActive =
                          pathname === sub.href || pathname.startsWith(sub.href + "/");

                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => {
                              if (window.innerWidth < 1024) onClose();
                            }}
                            className={`
                              flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                              transition-all duration-150
                              ${
                                isSubActive
                                  ? "text-brand font-bold bg-brand/10"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                              }
                            `}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isSubActive ? "bg-brand" : "bg-slate-300"
                              }`}
                            />
                            <span className="truncate">{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. Modo Colapsado: Flyout Flotante */}
                  {isCollapsed && isFlyoutActive && item.submenu && (
                    <div
                      className="absolute left-full top-0 ml-2.5 z-50 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2.5 px-2 min-w-[220px] max-w-[260px] animate-in fade-in zoom-in-95 duration-150"
                      onMouseEnter={() => handleFlyoutMouseEnter(item.name)}
                      onMouseLeave={handleFlyoutMouseLeave}
                    >
                      <div className="px-3 pb-2 mb-1 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-brand" />
                          <span>{item.name}</span>
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        {item.submenu.map((sub) => {
                          const isSubActive =
                            pathname === sub.href || pathname.startsWith(sub.href + "/");

                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => {
                                setActiveFlyout(null);
                                if (window.innerWidth < 1024) onClose();
                              }}
                              className={`
                                flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium
                                transition-all duration-150
                                ${
                                  isSubActive
                                    ? "text-brand font-bold bg-brand/10"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                }
                              `}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isSubActive ? "bg-brand" : "bg-slate-300"
                                }`}
                              />
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // ===============================================================
            // CASO B: ÍTEM DIRECTO SIMPLE
            // ===============================================================
            return (
              <Link
                key={item.name}
                href={item.href || "#"}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  flex items-center rounded-xl text-xs font-semibold
                  transition-all duration-150 group
                  ${isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"}
                  ${
                    isActive
                      ? "bg-brand/10 text-brand font-bold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-brand"
                        : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? "bg-brand text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Rol del usuario y estado de la licorería */}
        <div className="p-2.5 border-t border-slate-100 shrink-0 bg-white">
          {!isCollapsed ? (
            <div className="p-2.5 bg-[#FAFAF8] rounded-xl border border-slate-200/60 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {rol || "Bodega Principal"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 truncate">
                  {rol ? "Rol autenticado" : "Trazabilidad Activa"}
                </span>
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 mx-auto rounded-xl bg-brand/10 flex items-center justify-center text-brand"
              title={rol ? `Rol: ${rol}` : "Trazabilidad Activa"}
            >
              <Wine className="w-4 h-4" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
