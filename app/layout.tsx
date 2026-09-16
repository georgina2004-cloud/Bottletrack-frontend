import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { CompanyConfigProvider } from "@/context/CompanyConfigContext";
import { SwrProvider } from "@/components/providers/SwrProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BottleTrack | Sistema de Inventario",
  description: "Panel de administración y control de inventario para BottleTrack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#FAFAF8] text-[#18181B]">
        <AuthProvider>
          <CompanyConfigProvider>
            <SwrProvider>{children}</SwrProvider>
          </CompanyConfigProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
