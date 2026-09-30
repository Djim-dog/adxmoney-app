import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "admin" | "user" | string;
  first_login: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isActive: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  isActive: true,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      // 1. Tenta buscar o perfil
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, first_name, last_name, email, phone, avatar_url, role, first_login, is_active, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
        return profileData as Profile;
      }

      // 2. Se não encontrou, tenta criar (self-healing)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return null;

      const role = (currentUser.user_metadata?.role as "user" | "admin") || "user";
      const email = currentUser.email || "";
      const name = currentUser.user_metadata?.name || email.split("@")[0] || "Operador";

      const { data: newProfile, error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email,
          name,
          role,
          first_login: true,
          is_active: true,
        })
        .select()
        .single();

      if (upsertError) {
        console.error("[AuthContext] Erro ao autocriar perfil:", upsertError);
        return null;
      }

      // Garante carteira
      await supabase.from("wallets").upsert({
        user_id: userId,
        balance: 0.00,
        reserved_balance: 0.00,
      });

      setProfile(newProfile as Profile);
      return newProfile as Profile;
    } catch (err) {
      console.error("[AuthContext] Erro fatal ao carregar perfil:", err);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        }
      } catch (err) {
        console.error("[AuthContext] Erro ao obter sessão:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[AuthContext] Erro no logout:", err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const isAdmin = profile?.role === "admin";
  const isActive = profile ? profile.is_active !== false : true;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAdmin,
        isActive,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
