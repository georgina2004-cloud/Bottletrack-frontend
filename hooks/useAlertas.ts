"use client";

import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import { obtenerAlertasVencimiento, obtenerResumenInventario } from "@/lib/api";
import { ProductoAlertaVencimiento } from "@/types/producto";
import { ProductoStockBajo } from "@/types/dashboard";

export interface UseAlertasReturn {
  vencidos: ProductoAlertaVencimiento[];
  porVencer: ProductoAlertaVencimiento[];
  stockBajo: ProductoStockBajo[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  mutate: () => Promise<any>;
}

export function useAlertas(): UseAlertasReturn {
  const { token } = useAuth();

  const swrConfig = {
    refreshInterval: 300000, // 5 minutos (300,000 ms)
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  };

  const {
    data: vencimientoData,
    error: vencimientoError,
    isLoading: isVencimientoLoading,
    mutate: mutateVencimiento,
  } = useSWR(
    token ? ["/api/productos/alertas-vencimiento?dias=30", token] : null,
    ([, t]) => obtenerAlertasVencimiento(30, t),
    swrConfig
  );

  const {
    data: inventarioData,
    error: inventarioError,
    isLoading: isInventarioLoading,
    mutate: mutateInventario,
  } = useSWR(
    token ? ["/api/dashboard/resumen-inventario", token] : null,
    ([, t]) => obtenerResumenInventario(t),
    swrConfig
  );

  const vencidos = vencimientoData?.vencidos || [];
  const porVencer = vencimientoData?.por_vencer || [];
  const stockBajo = inventarioData?.productos_stock_bajo_detalle || [];

  const total = vencidos.length + porVencer.length + stockBajo.length;
  const isLoading =
    (isVencimientoLoading || isInventarioLoading) &&
    !vencimientoData &&
    !inventarioData;
  const isError = Boolean(vencimientoError || inventarioError);

  const mutate = async () => {
    return Promise.all([mutateVencimiento(), mutateInventario()]);
  };

  return {
    vencidos,
    porVencer,
    stockBajo,
    total,
    isLoading,
    isError,
    mutate,
  };
}
