"use client";

import React from "react";
import { SWRConfig } from "swr";
import { getStoredToken } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Fetcher global para SWR:
 * - Resuelve URLs relativas contra API_BASE_URL
 * - Inyecta automáticamente el token Sanctum desde auth helpers
 * - Lanza errores tipados legibles ante fallos HTTP
 */
export const globalFetcher = async (resource: string | [string, ...unknown[]]) => {
  const token = getStoredToken();
  const urlPath = Array.isArray(resource) ? resource[0] : resource;
  const fullUrl = urlPath.startsWith("http")
    ? urlPath
    : `${API_BASE_URL}${urlPath.startsWith("/") ? "" : "/"}${urlPath}`;

  const res = await fetch(fullUrl, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const error = new Error(
      errorData?.message || `Error ${res.status}: ${res.statusText}`
    );
    (error as any).status = res.status;
    (error as any).info = errorData;
    throw error;
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
};

interface SwrProviderProps {
  children: React.ReactNode;
}

export function SwrProvider({ children }: SwrProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher: globalFetcher,
        revalidateOnFocus: false,      // Evita refetch al alternar pestañas
        revalidateIfStale: true,       // Muestra datos de caché al instante mientras valida en background
        dedupingInterval: 60000,       // Evita peticiones duplicadas durante 60 segundos
        keepPreviousData: true,        // Mantiene la vista anterior mientras carga nuevos filtros
        errorRetryCount: 2,            // Máximo 2 reintentos si falla la red
      }}
    >
      {children}
    </SWRConfig>
  );
}
