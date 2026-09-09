"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { obtenerConfiguracionPublica, obtenerConfiguracionEmpresa } from "@/lib/api";
import { ConfiguracionEmpresa } from "@/types/configuracion";

interface CompanyConfigContextType {
  nombreLicoreria: string;
  logoUrl: string | null;
  colorPrimario: string;
  moneda: string;
  eslogan: string | null;
  telefono: string | null;
  emailEmpresa: string | null;
  direccion: string | null;
  configurado: boolean;
  isLoadingConfig: boolean;
  refetchConfig: () => Promise<void>;
  actualizarConfig: (nuevaConfig: Partial<ConfiguracionEmpresa>) => void;
}

const DEFAULT_CONFIG: CompanyConfigContextType = {
  nombreLicoreria: "BottleTrack",
  logoUrl: null,
  colorPrimario: "#171717",
  moneda: "C$",
  eslogan: null,
  telefono: null,
  emailEmpresa: null,
  direccion: null,
  configurado: false,
  isLoadingConfig: true,
  refetchConfig: async () => {},
  actualizarConfig: () => {},
};

const CompanyConfigContext = createContext<CompanyConfigContextType>(DEFAULT_CONFIG);

/**
 * Aplica las 3 variables CSS de marca sobre :root del documento en tiempo real,
 * sin necesidad de recargar la página. Los valores derivados (hover, light) se
 * calculan declarativamente con color-mix() en CSS, por lo que basta con fijar
 * --primary-brand y las otras dos se actualizan automáticamente al ser referencias.
 */
function aplicarColorPrimarioDOM(color: string) {
  if (typeof document !== "undefined" && color) {
    const root = document.documentElement;
    root.style.setProperty("--primary-brand", color);
    // hover y light son derivados via color-mix() en :root de globals.css;
    // al actualizar --primary-brand los cálculos se propagan solos en CSS.
    // Si se necesita forzar una recomputación explícita (ej. browsers sin color-mix):
    root.style.setProperty(
      "--primary-brand-hover",
      `color-mix(in srgb, ${color} 82%, black)`
    );
    root.style.setProperty(
      "--primary-brand-light",
      `color-mix(in srgb, ${color} 10%, transparent)`
    );
  }
}

export function CompanyConfigProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [nombreLicoreria, setNombreLicoreria] = useState<string>("BottleTrack");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [colorPrimario, setColorPrimario] = useState<string>("#171717");
  const [moneda, setMoneda] = useState<string>("C$");
  const [eslogan, setEslogan] = useState<string | null>(null);
  const [telefono, setTelefono] = useState<string | null>(null);
  const [emailEmpresa, setEmailEmpresa] = useState<string | null>(null);
  const [direccion, setDireccion] = useState<string | null>(null);
  const [configurado, setConfigurado] = useState<boolean>(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

  const actualizarConfig = useCallback(
    (nuevaConfig: Partial<ConfiguracionEmpresa>) => {
      if (nuevaConfig.nombre_licoreria !== undefined && nuevaConfig.nombre_licoreria !== null) {
        setNombreLicoreria(nuevaConfig.nombre_licoreria);
      }
      if (nuevaConfig.logo_url !== undefined) {
        setLogoUrl(nuevaConfig.logo_url);
      }
      if (nuevaConfig.color_primario !== undefined && nuevaConfig.color_primario !== null) {
        setColorPrimario(nuevaConfig.color_primario);
        aplicarColorPrimarioDOM(nuevaConfig.color_primario);
      }
      if (nuevaConfig.moneda !== undefined && nuevaConfig.moneda !== null) {
        setMoneda(nuevaConfig.moneda);
      }
      if (nuevaConfig.eslogan !== undefined) {
        setEslogan(nuevaConfig.eslogan);
      }
      if (nuevaConfig.telefono !== undefined) {
        setTelefono(nuevaConfig.telefono);
      }
      if (nuevaConfig.email_empresa !== undefined) {
        setEmailEmpresa(nuevaConfig.email_empresa);
      }
      if (nuevaConfig.direccion !== undefined) {
        setDireccion(nuevaConfig.direccion);
      }
      setConfigurado(true);
    },
    []
  );

  const cargarConfiguracion = useCallback(async () => {
    setIsLoadingConfig(true);
    try {
      if (token) {
        // Usuario autenticado: consultar configuración completa
        const datos = await obtenerConfiguracionEmpresa(token);
        if (datos) {
          setConfigurado(true);
          setNombreLicoreria(datos.nombre_licoreria || "BottleTrack");
          setLogoUrl(datos.logo_url || null);
          const color = datos.color_primario || "#171717";
          setColorPrimario(color);
          aplicarColorPrimarioDOM(color);
          setMoneda(datos.moneda || "C$");
          setEslogan(datos.eslogan || null);
          setTelefono(datos.telefono || null);
          setEmailEmpresa(datos.email_empresa || null);
          setDireccion(datos.direccion || null);
          return;
        }
      }

      // Contexto público (Login o sin autenticación previa): consultar configuración pública
      const publica = await obtenerConfiguracionPublica();
      setConfigurado(publica.configurado);
      if (publica.nombre_licoreria) {
        setNombreLicoreria(publica.nombre_licoreria);
      }
      if (publica.logo_url !== undefined) {
        setLogoUrl(publica.logo_url);
      }
      if (publica.color_primario) {
        setColorPrimario(publica.color_primario);
        aplicarColorPrimarioDOM(publica.color_primario);
      }
      if (publica.moneda) {
        setMoneda(publica.moneda);
      }
    } catch (error) {
      console.error("[CompanyConfigContext] Error al sincronizar configuración:", error);
    } finally {
      setIsLoadingConfig(false);
    }
  }, [token]);

  // Aplicar color neutro inicial en el cliente antes de que cargue la config
  useEffect(() => {
    if (typeof document !== "undefined") {
      aplicarColorPrimarioDOM("#171717");
    }
  }, []);

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion, user]);

  return (
    <CompanyConfigContext.Provider
      value={{
        nombreLicoreria,
        logoUrl,
        colorPrimario,
        moneda,
        eslogan,
        telefono,
        emailEmpresa,
        direccion,
        configurado,
        isLoadingConfig,
        refetchConfig: cargarConfiguracion,
        actualizarConfig,
      }}
    >
      {children}
    </CompanyConfigContext.Provider>
  );
}

export function useCompanyConfig(): CompanyConfigContextType {
  return useContext(CompanyConfigContext);
}
