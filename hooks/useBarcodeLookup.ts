"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { lookupBarcode } from "@/lib/api";
import { BarcodeLookupResponse } from "@/types/barcode";

export type EstadoLookup =
  | "idle"
  | "buscando"
  | "encontrado"
  | "no_encontrado"
  | "existe_local"
  | "error";

export function useBarcodeLookup(token: string | null) {
  const [estado, setEstado] = useState<EstadoLookup>("idle");
  const [productoLocal, setProductoLocal] = useState<{ id: number; nombre: string } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const buscar = useCallback(
    async (codigo: string): Promise<BarcodeLookupResponse | null> => {
      // Cada búsqueda nueva aborta la anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setEstado("buscando");

      // Timeout de 8000 ms que aborta la petición
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 8000);

      try {
        const data = await lookupBarcode(codigo, token, controller.signal);

        // Si este controller ya no es el actual, descartamos la respuesta
        if (abortControllerRef.current !== controller || controller.signal.aborted) {
          return null;
        }

        if (data.existe_local && data.producto) {
          setEstado("existe_local");
          setProductoLocal(data.producto);
        } else {
          setProductoLocal(null);
          if (data.found) {
            setEstado("encontrado");
          } else {
            setEstado("no_encontrado");
          }
        }

        return data;
      } catch (err: unknown) {
        // Pasar a 'error' SOLO si este controller sigue siendo el actual
        if (abortControllerRef.current === controller) {
          setEstado("error");
          setProductoLocal(null);
        }
        return null;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    [token]
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setEstado("idle");
    setProductoLocal(null);
  }, []);

  // Cleanup para abortar al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    estado,
    productoLocal,
    buscar,
    reset,
  };
}
