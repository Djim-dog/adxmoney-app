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

  const fetchProfile = async (userId: string, currentUser?: User | null): Promise<Profile | null> => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileData) {
        const loaded = profileData as Profile;
        setProfile(loaded);
        return loaded;
      }

      // Se não encontrou na tabela profiles mas temos o user do auth, cria instantaneamente em memória e no banco
      const targetUser = currentUser || user;
      const metaRole = (targetUser?.user_metadata?.role as string) || "user";
      const metaName = (targetUser?.user_metadata?.name as string) || targetUser?.email?.split("@")[0] || "Operador";
      const userEmail = targetUser?.email || "";

      const newProfile: Profile = {
        id: userId,
        email: userEmail,
        name: metaName,
        first_name: null,
        last_name: null,
        phone: null,
        avatar_url: null,
        role: metaRole,
        first_login: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Tenta gravar na tabela profiles em segundo plano (sem bloquear)
      supabase.from("profiles").upsert({
        id: userId,
        email: userEmail,
        name: metaName,
        role: metaRole,
        first_login: true,
        is_active: true,
      }).then();

      supabase.from("wallets").upsert({
        user_id: userId,
        balance: 0.00,
        reserved_balance: 0.00,
      }).then();

      setProfile(newProfile);
      return newProfile;
    } catch (err) {
      console.error("[AuthContext] Erro ao buscar perfil:", err);
      // Fallback supremo para nunca dar tela branca
      const emergencyProfile: Profile = {
        id: userId,
        email: user?.email || "",
        name: "Operador",
        first_name: null,
        last_name: null,
        phone: null,
        avatar_url: null,
        role: "user",
        first_login: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(emergencyProfile);
      return emergencyProfile;
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
          await fetchProfile(initialSession.user.id, initialSession.user);
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
          await fetchProfile(newSession.user.id, newSession.user);
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
