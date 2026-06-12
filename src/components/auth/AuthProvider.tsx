"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  applyGoogleProfile,
  setCachedAuthUserId,
  signInWithGoogle as authSignIn,
  signOut as authSignOut,
} from "@/lib/auth";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      const nextSession = data.session ?? null;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setCachedAuthUserId(nextSession?.user?.id ?? null);
      if (nextSession?.user) applyGoogleProfile(nextSession.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setCachedAuthUserId(nextSession?.user?.id ?? null);
      if (nextSession?.user) applyGoogleProfile(nextSession.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async (redirectPath?: string) => {
    await authSignIn(redirectPath);
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, signInWithGoogle, signOut }),
    [user, session, loading, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
