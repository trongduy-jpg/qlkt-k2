import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthGate } from "@/components/auth-gate";
import { AuthProvider } from "@/components/auth-context";
import { MaterialDashboard } from "@/components/material-dashboard";
import "./globals.css";

export const metadata: Metadata = {
  title: "QLKT K2 - Theo dõi NVL",
  description: "Demo hệ thống theo dõi tiến độ nguyên vật liệu và hao hụt ngành trang sức"
};

// Ung dung chi hoat dong dung sau khi client hydrate va kiem tra dang
// nhap (Supabase Auth) - khong nen dong bang thanh HTML tinh luc build.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <AuthGate>
            <Suspense fallback={null}>
              <MaterialDashboard />
            </Suspense>
          </AuthGate>
        </AuthProvider>
        {children}
      </body>
    </html>
  );
}
