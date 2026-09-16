"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartSkeleton } from "@/components/dashboard/ChartSkeleton";
import type { PeriodoTendencia } from "@/components/dashboard/SalesTrendChart";

const SalesTrendChart = dynamic(
  () => import("@/components/dashboard/SalesTrendChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton height="h-[360px]" />,
  }
);

const CategoryDonutChart = dynamic(
  () => import("@/components/dashboard/CategoryDonutChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton height="h-[360px]" />,
  }
);

const TopProductsChart = dynamic(
  () => import("@/components/dashboard/TopProductsChart"),
  {
    ssr: false,
    loading: () => <ChartSkeleton height="h-[320px]" />,
  }
);

import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { RecentClientsCard } from "@/components/dashboard/RecentClientsCard";
import { MonthlyPurchasesCard } from "@/components/dashboard/MonthlyPurchasesCard";
import { LowStockAlertsList } from "@/components/dashboard/LowStockAlertsList";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import {
  obtenerResumenInventario,
  obtenerResumenVentasCompras,
  obtenerTendenciaDashboard,
} from "@/lib/api";
import {
  ResumenInventario,
  ResumenVentasCompras,
  PuntoTendencia,
  MetricItem,
} from "@/types/dashboard";
import { Plus, AlertTriangle, X } from "lucide-react";
import { useMoneda } from "@/lib/currency";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user } = useAuth();
  const { puedeEditar } = usePermisos();
  const { formatMoneda } = useMoneda();

  // Saludo dinámico según la hora del día
  const saludo = useMemo(() => {
    const hora = new Date().getHours();
    const nombre = user?.name ? user.name.split(" ")[0] : "Vendedor";
    if (hora < 12) return `Buenos días, ${nombre}`;
    if (hora < 19) return `Buenas tardes, ${nombre}`;
    return `Buenas noches, ${nombre}`;
  }, [user]);

  // Mensaje de redirección por falta de permisos (derivado de searchParams)
  const [dismissedAuthError, setDismissedAuthError] = useState<boolean>(false);
  const isUnauthorizedParam = searchParams.get("unauthorized") === "1";
  const authError =
    isUnauthorizedParam && !dismissedAuthError
      ? "No tienes permiso para acceder a esta sección."
      : null;

  const handleDismissAuthError = () => {
    setDismissedAuthError(true);
    router.replace("/dashboard");
  };

  // =========================================================================
  // 1. ESTADO DE DATOS REALES DE INVENTARIO (GET /api/dashboard/resumen-inventario)
  // =========================================================================
  const [resumenInventario, setResumenInventario] =
    useState<ResumenInventario | null>(null);
  const [isLoadingInventario, setIsLoadingInventario] = useState<boolean>(true);
  const [isErrorInventario, setIsErrorInventario] = useState<boolean>(false);

  // =========================================================================
  // 2. ESTADO DE DATOS REALES DE VENTAS Y COMPRAS (GET /api/dashboard/resumen-ventas-compras)
  // =========================================================================
  const [resumenVentasCompras, setResumenVentasCompras] =
    useState<ResumenVentasCompras | null>(null);
  const [isLoadingVentasCompras, setIsLoadingVentasCompras] =
    useState<boolean>(true);
  const [isErrorVentasCompras, setIsErrorVentasCompras] =
    useState<boolean>(false);

  // =========================================================================
  // 3. ESTADO DE TENDENCIA HISTÓRICA REAL (GET /api/dashboard/tendencia?periodo=...)
  // =========================================================================
  const [tendenciaData, setTendenciaData] = useState<PuntoTendencia[]>([]);
  const [periodoTendencia, setPeriodoTendencia] =
    useState<PeriodoTendencia>("7d");
  const [isLoadingTendencia, setIsLoadingTendencia] = useState<boolean>(true);

  // Consulta al endpoint real GET /api/dashboard/resumen-inventario
  useEffect(() => {
    let isMounted = true;

    async function cargarResumenInventario() {
      setIsLoadingInventario(true);
      setIsErrorInventario(false);

      try {
        const data = await obtenerResumenInventario(token);
        if (!isMounted) return;

        if (data) {
          setResumenInventario(data);
        } else {
          setIsErrorInventario(true);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error al cargar resumen de inventario:", error);
        setIsErrorInventario(true);
      } finally {
        if (isMounted) {
          setIsLoadingInventario(false);
        }
      }
    }

    cargarResumenInventario();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Consulta al endpoint real GET /api/dashboard/resumen-ventas-compras
  useEffect(() => {
    let isMounted = true;

    async function cargarResumenVentasCompras() {
      setIsLoadingVentasCompras(true);
      setIsErrorVentasCompras(false);

      try {
        const data = await obtenerResumenVentasCompras(token);
        if (!isMounted) return;

        if (data) {
          setResumenVentasCompras(data);
        } else {
          setIsErrorVentasCompras(true);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error al cargar resumen de ventas y compras:", error);
        setIsErrorVentasCompras(true);
      } finally {
        if (isMounted) {
          setIsLoadingVentasCompras(false);
        }
      }
    }

    cargarResumenVentasCompras();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Consulta al endpoint real GET /api/dashboard/tendencia?periodo=7d|14d|mes
  useEffect(() => {
    let isMounted = true;

    async function cargarTendencia() {
      setIsLoadingTendencia(true);

      try {
        const data = await obtenerTendenciaDashboard(periodoTendencia, token);
        if (!isMounted) return;
        setTendenciaData(data || []);
      } catch (error) {
        if (!isMounted) return;
        console.error("Error al cargar tendencia de ventas y compras:", error);
        setTendenciaData([]);
      } finally {
        if (isMounted) {
          setIsLoadingTendencia(false);
        }
      }
    }

    cargarTendencia();

    return () => {
      isMounted = false;
    };
  }, [periodoTendencia, token]);



  // ===========================================================================
  // 1. MÉTRICAS SUPERIORES: INVENTARIO Y ALERTAS (2 Tarjetas Reales)
  // ===========================================================================
  const metricsInventario: MetricItem[] = [
    // 1. DATO REAL — Conectado a GET /api/dashboard/resumen-inventario (total_productos)
    {
      id: "productos-inventario",
      title: "Productos en inventario",
      value: isErrorInventario
        ? "—"
        : resumenInventario
        ? resumenInventario.total_productos.toLocaleString("es-NI")
        : "—",
      iconName: "package",
      secondaryText: "Ítems activos en catálogo",
    },

    // 2. DATO REAL — Conectado a GET /api/dashboard/resumen-inventario (productos_stock_bajo)
    {
      id: "alertas-stock",
      title: "Alertas de stock",
      value: isErrorInventario
        ? "—"
        : resumenInventario
        ? resumenInventario.productos_stock_bajo.toLocaleString("es-NI")
        : "—",
      iconName: "alert-triangle",
      secondaryText: "Requieren reabastecimiento",
    },
  ];

  // ===========================================================================
  // 2. MÉTRICAS COMERCIALES (Movidas a la sección de Actividad y Compras)
  // ===========================================================================
  const metricVentasDia: MetricItem = {
    id: "ventas-dia",
    title: "Ventas del día",
    value: isErrorVentasCompras
      ? "—"
      : resumenVentasCompras
      ? formatMoneda(resumenVentasCompras.ventas_hoy)
      : "—",
    iconName: "dollar",
    secondaryText: "Facturación acumulada hoy",
  };

  const metricVentasMes: MetricItem = {
    id: "ventas-mes",
    title: "Ventas del mes",
    value: isErrorVentasCompras
      ? "—"
      : resumenVentasCompras
      ? formatMoneda(resumenVentasCompras.ventas_mes)
      : "—",
    iconName: "calendar-dollar",
    secondaryText: "Total facturado este mes",
  };

  return (
    <ProtectedByRole modulo="dashboard">
      <DashboardLayout>
        <div
          className="rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/80 shadow-2xs space-y-6 transition-colors"
          style={{
            backgroundColor: "color-mix(in srgb, var(--primary-brand) 3.5%, white)",
          }}
        >
          {/* Banner de Acceso Restringido */}
          {authError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold text-xs sm:text-sm text-amber-950">
                    Acceso restringido
                  </p>
                  <p className="text-xs text-amber-800 mt-0.5">{authError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismissAuthError}
                className="text-amber-700 hover:text-amber-900 p-1 rounded-lg hover:bg-amber-100/50 transition-colors cursor-pointer"
                title="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TOP BAR: Saludo personalizado y acciones principales                     */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] font-sans">
                {saludo}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Aquí tienes el resumen operativo y movimientos de tu licorería hoy.
              </p>
            </div>

            {/* Quick Action: Registrar Venta hacia POS */}
            <div className="flex items-center gap-2.5">
              {puedeEditar("ventas") && (
                <Link href="/ventas/nueva">
                  <Button
                    size="sm"
                    className="text-xs font-semibold gap-1.5 shadow-sm shadow-brand/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nueva Venta</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 1: 2 TARJETAS DE MÉTRICAS SUPERIORES                              */}
          {/* ========================================================================= */}
          <section aria-label="Métricas Principales Comerciales">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <MetricCard
                metric={metricVentasDia}
                isLoading={isLoadingVentasCompras}
              />
              <MetricCard
                metric={metricVentasMes}
                isLoading={isLoadingVentasCompras}
              />
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECCIÓN 2: GRÁFICOS PRINCIPALES (100% Datos Reales)                       */}
          {/* ========================================================================= */}
          <section
            aria-label="Análisis Gráfico"
            className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6"
          >
            {/* DATO REAL — Conectado a GET /api/dashboard/tendencia?periodo=... */}
            <div className="xl:col-span-2 min-w-0 w-full">
              <SalesTrendChart
                data={tendenciaData}
                periodo={periodoTendencia}
                onPeriodoChange={setPeriodoTendencia}
                isLoading={isLoadingTendencia}
              />
            </div>

            {/* DATO REAL — Conectado a GET /api/dashboard/resumen-inventario (productos_por_categoria) */}
            <div className="xl:col-span-1 min-w-0 w-full">
              <CategoryDonutChart
                data={resumenInventario?.productos_por_categoria}
                isLoading={isLoadingInventario}
                isError={isErrorInventario}
              />
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECCIÓN 3: TOP PRODUCTOS Y ALERTAS DE STOCK BAJO (100% Datos Reales)      */}
          {/* ========================================================================= */}
          <section
            aria-label="Inventario y Productos Destacados"
            className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6"
          >
            {/* DATO REAL — Conectado a GET /api/dashboard/resumen-ventas-compras (top_productos) */}
            <TopProductsChart
              products={resumenVentasCompras?.top_productos || []}
              isLoading={isLoadingVentasCompras}
            />

            {/* DATO REAL — Conectado a GET /api/dashboard/resumen-inventario (productos_stock_bajo_detalle) */}
            <LowStockAlertsList
              alerts={resumenInventario?.productos_stock_bajo_detalle || []}
              isLoading={isLoadingInventario}
              isError={isErrorInventario}
            />
          </section>

          {/* ========================================================================= */}
          {/* SECCIÓN 4: ACTIVIDAD Y MÉTRICAS DE INVENTARIO (2 arriba, 2 abajo)          */}
          {/* ========================================================================= */}
          <section
            aria-label="Actividad Reciente y Métricas de Inventario"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
          >
            {/* Fila 1 Arriba: Clientes Recientes y Compras del Mes */}
            <RecentClientsCard
              sales={resumenVentasCompras?.ultimas_ventas || []}
              isLoading={isLoadingVentasCompras}
            />

            <MonthlyPurchasesCard
              totalCompras={resumenVentasCompras?.compras_mes || 0}
              isLoading={isLoadingVentasCompras}
            />

            {/* Fila 2 Abajo: Productos en Inventario y Alertas de Stock */}
            <MetricCard
              metric={metricsInventario[0]}
              isLoading={isLoadingInventario}
            />

            <MetricCard
              metric={metricsInventario[1]}
              isLoading={isLoadingInventario}
            />
          </section>

          {/* ========================================================================= */}
          {/* SECCIÓN 5: TABLA DE ÚLTIMAS VENTAS (100% Datos Reales)                     */}
          {/* ========================================================================= */}
          <section aria-label="Últimas Ventas Registradas">
            {/* DATO REAL — Conectado a GET /api/dashboard/resumen-ventas-compras (ultimas_ventas) */}
            <RecentSalesTable
              sales={resumenVentasCompras?.ultimas_ventas || []}
              isLoading={isLoadingVentasCompras}
            />
          </section>
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
