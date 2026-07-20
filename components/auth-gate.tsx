"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/auth-context";
import { LoginView } from "@/components/login-view";
import { isSupabaseConfigured } from "@/lib/supabase";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, appUser, deniedEmail } = useAuth();

  if (!isSupabaseConfigured) return <>{children}</>;
  if (isLoading) return null;
  if (!appUser) return <LoginView deniedEmail={deniedEmail} />;

  return <>{children}</>;
}
