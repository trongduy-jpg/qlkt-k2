"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { loadAppUserByEmail, signOutCurrentUser, type AppUser } from "@/lib/auth-service";

type AuthState = {
  isLoading: boolean;
  session: Session | null;
  appUser: AppUser | null;
  deniedEmail: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);

  async function resolveSession(nextSession: Session | null) {
    setSession(nextSession);
    setDeniedEmail(null);

    if (!nextSession?.user?.email) {
      setAppUser(null);
      return;
    }

    try {
      const user = await loadAppUserByEmail(nextSession.user.email);
      if (!user) {
        setDeniedEmail(nextSession.user.email);
        setAppUser(null);
        await signOutCurrentUser();
        setSession(null);
        return;
      }
      setAppUser(user);
    } catch {
      setAppUser(null);
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      resolveSession(data.session).finally(() => setIsLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      resolveSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await signOutCurrentUser();
    setSession(null);
    setAppUser(null);
  }

  return (
    <AuthContext.Provider value={{ isLoading, session, appUser, deniedEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
