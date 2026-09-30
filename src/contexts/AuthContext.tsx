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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[AuthContext] Erro ao carregar perfil:", error.message);
      }

      if (data) {
        const loadedProfile = data as Profile;
        setProfile(loadedProfile);
        return loadedProfile;
      }

      // Self-healing: Se o perfil não existir na tabela public.profiles, autocria
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const fallbackProfile: Profile = {
        id: userId,
        email: currentUser?.email || "",
        name: currentUser?.user_metadata?.name || currentUser?.email?.split("@")[0] || "Operador",
        role: (currentUser?.user_metadata?.role as "user" | "admin") || "user",
        first_login: true,
        is_active: true,
      };

      await supabase.from("profiles").upsert({
        id: userId,
        email: fallbackProfile.email,
        name: fallbackProfile.name,
        role: fallbackProfile.role,
        first_login: true,
        is_active: true,
      });

      await supabase.from("wallets").upsert({
        user_id: userId,
        balance: 0.00,
        reserved_balance: 0.00,
      });

      setProfile(fallbackProfile);
      return fallbackProfile;
    } catch (err) {
      console.error("[AuthContext] Erro inesperado no perfil:", err);
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
