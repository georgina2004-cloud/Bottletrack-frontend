"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

/**
 * Esquema de validación estricto con Zod
 * - Email requerido y con formato válido
 * - Contraseña requerida con mínimo 6 caracteres
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es obligatorio.")
    .email("Ingresa un formato de correo electrónico válido."),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria.")
    .min(6, "La contraseña debe contener al menos 6 caracteres."),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    try {
      // TODO: [Laravel Backend Integration]
      // 1. Envía POST a `${NEXT_PUBLIC_API_URL}/login` con { email: values.email, password: values.password }
      // 2. Si el backend responde 200 OK con { token, user }, almacena el token en la cookie 'bottletrack_token'
      //    con vigencia de 30 días (si rememberMe es true) o vigencia de sesión (si rememberMe es false).
      // 3. Sincroniza el usuario en AuthContext.
      await login(
        { email: values.email, password: values.password },
        values.rememberMe
      );

      // Redirección al dashboard del panel administrativo tras login exitoso
      router.push("/dashboard");
    } catch (err: unknown) {
      // Manejo de error de credenciales incorrectas (HTTP 401/422) o problemas de red
      const message =
        err instanceof Error
          ? err.message
          : "No fue posible iniciar sesión. Verifica tus credenciales.";
      setServerError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Alerta de Error del Servidor (401 / 422 / Error de conexión) */}
      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 transition-all"
        >
          <svg
            className="w-5 h-5 text-rose-500 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1 font-medium leading-relaxed">{serverError}</div>
        </div>
      )}

      {/* Campo: Correo Electrónico */}
      <Input
        label="Correo electrónico"
        type="email"
        id="email"
        placeholder="usuario@bottletrack.com"
        required
        autoComplete="email"
        error={errors.email?.message}
        disabled={isSubmitting}
        {...register("email")}
        leftIcon={
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
            />
          </svg>
        }
      />

      {/* Campo: Contraseña con Toggle Mostrar/Ocultar */}
      <Input
        label="Contraseña"
        type={showPassword ? "text" : "password"}
        id="password"
        placeholder="••••••••"
        required
        autoComplete="current-password"
        error={errors.password?.message}
        disabled={isSubmitting}
        {...register("password")}
        leftIcon={
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        }
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-800 transition-colors rounded cursor-pointer"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            tabIndex={0}
          >
            {showPassword ? (
              // Icono: EyeOff
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
            ) : (
              // Icono: Eye
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        }
      />

      {/* Recordarme y ¿Olvidaste tu contraseña? */}
      <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-800">
          <input
            type="checkbox"
            disabled={isSubmitting}
            className="w-4 h-4 rounded border-slate-300 text-[var(--primary-brand)] focus:ring-[var(--primary-brand)] focus:ring-offset-0 cursor-pointer accent-[var(--primary-brand)]"
            {...register("rememberMe")}
          />
          <span>Recordarme</span>
        </label>

        <a
          href="#recuperar-password"
          onClick={(e) => {
            e.preventDefault();
            // TODO: [Recuperación de contraseña] Ruta o modal para solicitar reset de password
            console.log("Recuperación de contraseña solicitada");
          }}
          className="text-slate-600 hover:text-[var(--primary-brand)] transition-colors font-medium hover:underline underline-offset-2"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {/* Botón Principal de Acción (CTA) */}
      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="w-full text-base font-semibold tracking-wide shadow-md hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
        >
          {isSubmitting ? "Iniciando sesión..." : "Ingresar"}
        </Button>
      </div>

      {/* Pie del formulario: Soporte administrativo */}
      <div className="pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          ¿No tienes acceso?{" "}
          <span
            className="text-slate-700 font-medium hover:text-[var(--primary-brand)] transition-colors cursor-pointer"
            title="Contacta al administrador del sistema"
          >
            Contacta al administrador
          </span>
        </p>
      </div>
    </form>
  );
}
