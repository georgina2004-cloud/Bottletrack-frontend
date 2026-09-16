import React, { Suspense } from "react";
import type { Metadata } from "next";
import { LoginContent } from "@/components/auth/LoginContent";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Iniciar Sesión | BottleTrack",
  description: "Acceso al panel administrativo y control de inventario de BottleTrack",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#FAFAF8] flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-brand)]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
