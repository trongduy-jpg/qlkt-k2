import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthProvider } from "@/components/auth-context";
import { MaterialDashboard } from "@/components/material-dashboard";
import "./globals.css";

export const metadata: Metadata = {
  title: "QLKT K2 - Theo dõi NVL",
  description: "Demo hệ thống theo dõi tiến độ nguyên vật liệu và hao hụt ngành trang sức"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <Suspense fallback={null}>
            <MaterialDashboard />
          </Suspense>
        </AuthProvider>
        {children}
      </body>
    </html>
  );
}
