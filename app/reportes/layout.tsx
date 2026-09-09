"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProtectedByRole } from "@/components/auth/ProtectedByRole";

export default function ReportesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedByRole modulo="reportes">
      <DashboardLayout>
        <div className="space-y-6">{children}</div>
      </DashboardLayout>
    </ProtectedByRole>
  );
}
