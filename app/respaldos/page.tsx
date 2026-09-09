"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import { descargarRespaldo, restaurarRespaldo } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import {
  Database,
  Download,
  Upload,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  ShieldAlert,
  Loader2,
  RefreshCw,
  LogOut,
  X,
  FileUp,
  Server,
  Lock,
} from "lucide-react";

export default function RespaldosPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const { tienePermiso, puedeEditar } = usePermisos();

  // Estados de Descarga / Generación
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Estados de Restauración
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Permisos dinámicos
  const puedeGenerar = puedeEditar("respaldos") || tienePermiso("respaldos.generar");
  const puedeRestaurar = puedeEditar("respaldos") || tienePermiso("respaldos.restaurar");

  // 1. Manejo de Descarga de Respaldo (.sql)
  const handleDescargarRespaldo = async () => {
    if (!puedeGenerar) return;

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(null);

    try {
      await descargarRespaldo(token);
      setDownloadSuccess("Copia de seguridad descargada exitosamente en tu equipo.");
      setTimeout(() => setDownloadSuccess(null), 6000);
    } catch (err: unknown) {
      console.error("Error al generar respaldo:", err);
      setDownloadError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al generar la copia de seguridad."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. Manejo de Selección de Archivo .sql
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".sql")) {
        setRestoreError("Por favor selecciona un archivo con extensión .sql válida.");
        setArchivoSeleccionado(null);
        return;
      }
      setRestoreError(null);
      setRestoreSuccess(null);
      setArchivoSeleccionado(file);
    }
  };

  const handleLimpiarArchivo = () => {
    setArchivoSeleccionado(null);
    setRestoreError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 3. Ejecución de la Restauración (tras confirmación)
  const handleConfirmarRestauracion = async () => {
    if (!archivoSeleccionado || !puedeRestaurar) return;

    setShowConfirmModal(false);
    setIsRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(null);

    try {
      const response = await restaurarRespaldo(archivoSeleccionado, token);
      setRestoreSuccess(
        response.message ||
          "Base de datos restaurada correctamente. Los cambios ya están en vigor."
      );
      handleLimpiarArchivo();
    } catch (err: unknown) {
      console.error("Error al restaurar respaldo:", err);
      setRestoreError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al procesar el archivo de restauración."
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <ProtectedByRole modulo="respaldos">
      <DashboardLayout>
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
          {/* ========================================================================= */}
          {/* ENCABEZADO Y BREADCRUMB                                                   */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-slate-500"
            >
              <Link
                href="/dashboard"
                className="hover:text-slate-900 transition-colors"
              >
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-brand">Respaldos</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand/10 text-brand rounded-2xl">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans">
                    Copias de Seguridad y Restauración
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Administra y descarga respaldos integrales de la base de datos MySQL o restaura copias anteriores.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BANNER INFORMATIVO GENERAL                                                */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-slate-700 text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
            <Server className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">
                Seguridad y Persistencia de Información
              </p>
              <p className="text-slate-600 leading-relaxed text-xs">
                Se recomienda generar respaldos periódicos antes de realizar actualizaciones de inventario masivas, cortes contables o modificaciones de usuarios. Los archivos generados son compatibles con MySQL y MariaDB.
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TARJETAS PRINCIPALES: GENERAR Y RESTAURAR                                 */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* ----------------------------------------------------------------------- */}
            {/* SECCIÓN 1: GENERAR RESPALDO                                            */}
            {/* ----------------------------------------------------------------------- */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-xl">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
                      Generar Copia de Seguridad
                    </h2>
                    <p className="text-xs text-slate-500">
                      Exporta el estado completo actual del sistema.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span>
                      <strong>Exportación completa:</strong> Incluye productos, stock, presentaciones, compras, ventas, clientes, usuarios y roles.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span>
                      <strong>Formato SQL nativo:</strong> Archivo binario ejecutable mediante <code>mysqldump</code> estándar.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span>
                      <strong>Descarga directa:</strong> El archivo se genera en el servidor y se transfiere de inmediato a tu navegador.
                    </span>
                  </div>
                </div>

                {/* Alertas de Generación */}
                {downloadSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{downloadSuccess}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDownloadSuccess(null)}
                      className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {downloadError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{downloadError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDownloadError(null)}
                      className="text-rose-700 hover:text-rose-900 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={handleDescargarRespaldo}
                  disabled={isDownloading || !puedeGenerar}
                  className="w-full gap-2 text-xs sm:text-sm font-semibold shadow-sm shadow-brand/20 cursor-pointer h-11"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generando archivo de respaldo...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Descargar Copia de Seguridad (.sql)</span>
                    </>
                  )}
                </Button>
                {!puedeGenerar && (
                  <p className="text-[11px] text-amber-700 mt-2 text-center">
                    No posees el permiso <code>respaldos.generar</code> para esta acción.
                  </p>
                )}
              </div>
            </div>

            {/* ----------------------------------------------------------------------- */}
            {/* SECCIÓN 2: RESTAURAR RESPALDO                                          */}
            {/* ----------------------------------------------------------------------- */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-xl">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
                      Restaurar Base de Datos
                    </h2>
                    <p className="text-xs text-slate-500">
                      Restaura la información a partir de un archivo .sql existente.
                    </p>
                  </div>
                </div>

                {/* Advertencia Crítica */}
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>¡Atención Crítica!</strong> Esta acción sobreescribirá <strong>todos</strong> los datos de la base de datos con los registros del archivo. Cualquier cambio no respaldado se perderá de forma permanente.
                  </p>
                </div>

                {/* Zona de Selección de Archivo */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql"
                  onChange={handleFileChange}
                  className="hidden"
                  id="backup-file-input"
                  disabled={isRestoring || !puedeRestaurar}
                />

                {!archivoSeleccionado ? (
                  <label
                    htmlFor="backup-file-input"
                    className={`
                      border-2 border-dashed border-slate-200 hover:border-brand/50 rounded-2xl p-6 text-center
                      flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-slate-50/50 hover:bg-brand/5
                      ${!puedeRestaurar ? "opacity-50 pointer-events-none" : ""}
                    `}
                  >
                    <div className="p-3 bg-white rounded-full text-slate-400 border border-slate-200 shadow-2xs">
                      <FileUp className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800">
                        Haz clic para seleccionar el archivo <code>.sql</code>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tamaño máximo recomendado: 50 MB
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-brand/10 text-brand rounded-xl shrink-0">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {archivoSeleccionado.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatFileSize(archivoSeleccionado.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLimpiarArchivo}
                      disabled={isRestoring}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Quitar archivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Alertas de Restauración */}
                {restoreSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{restoreSuccess}</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Dado que los datos de la base de datos fueron reemplazados, se aconseja refrescar la ventana o iniciar sesión nuevamente.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="gap-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Recargar Sistema</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logout()}
                        className="gap-1.5 text-xs font-semibold text-emerald-900 border-emerald-300 hover:bg-emerald-100 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Reiniciar Sesión</span>
                      </Button>
                    </div>
                  </div>
                )}

                {restoreError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{restoreError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRestoreError(null)}
                      className="text-rose-700 hover:text-rose-900 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!archivoSeleccionado || isRestoring || !puedeRestaurar}
                  className="w-full gap-2 text-xs sm:text-sm font-semibold cursor-pointer h-11 bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Restaurando base de datos...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Restaurar Base de Datos</span>
                    </>
                  )}
                </Button>
                {!puedeRestaurar && (
                  <p className="text-[11px] text-amber-700 mt-2 text-center">
                    No posees el permiso <code>respaldos.restaurar</code> para esta acción.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MODAL DE CONFIRMACIÓN FUERTE DE RESTAURACIÓN                              */}
          {/* ========================================================================= */}
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div
                className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
                role="dialog"
                aria-modal="true"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
                      ¿Confirmar Restauración?
                    </h3>
                    <p className="text-xs text-slate-500">
                      Acción destructiva e irreversible
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-rose-950 text-xs sm:text-sm space-y-2">
                  <p className="font-semibold">
                    Esta acción reemplazará todos los datos actuales del sistema con los del archivo:
                  </p>
                  <p className="font-mono text-xs text-rose-800 bg-white/80 p-2 rounded-xl border border-rose-200 truncate">
                    {archivoSeleccionado?.name}
                  </p>
                  <p className="text-xs text-rose-700 pt-1">
                    Esta acción <strong>no se puede deshacer</strong>. Las ventas, compras y cambios posteriores al respaldo se sobreescribirán.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isRestoring}
                    className="text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleConfirmarRestauracion}
                    disabled={isRestoring}
                    className="text-xs font-semibold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Sí, Restaurar Ahora</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
