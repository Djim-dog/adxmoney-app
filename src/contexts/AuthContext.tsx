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
  primary_link?: string | null;
  country?: string | null;
  referral_code?: string | null;
  invited_by?: string | null;
  referred_completed?: boolean;
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

  // Função para sincronizar perfil automaticamente a partir do user autenticado
  const fetchOrSyncProfile = async (authUser: User): Promise<Profile | null> => {
    try {
      // 1. Tentar localizar o perfil existente na tabela pública 'profiles'
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileData && !profileError) {
        const loaded = profileData as Profile;
        setProfile(loaded);
        return loaded;
      }

      // 2. Se não existir perfil na tabela 'profiles', criar automaticamente a partir do authUser
      const metaRole = (authUser.user_metadata?.role as string) || "user";
      const metaName = (authUser.user_metadata?.name as string) || authUser.email?.split("@")[0] || "Utilizador";
      const userEmail = authUser.email || "";

      const newProfile: Profile = {
        id: authUser.id,
        email: userEmail,
        name: metaName,
        first_name: authUser.user_metadata?.first_name || null,
        last_name: authUser.user_metadata?.last_name || null,
        phone: authUser.user_metadata?.phone || null,
        avatar_url: null,
        role: metaRole,
        first_login: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Inserir de forma resiliente na tabela 'profiles'
      const { data: insertedProfile } = await supabase
        .from("profiles")
        .upsert({
          id: authUser.id,
          email: userEmail,
          name: metaName,
          role: metaRole,
          first_login: true,
          is_active: true,
        })
        .select()
        .maybeSingle();

      // Garantir carteira para novos utilizadores
      await supabase
        .from("wallets")
        .upsert({
          user_id: authUser.id,
          balance: 0.00,
          reserved_balance: 0.00,
        });

      const finalProfile = (insertedProfile as Profile) || newProfile;
      setProfile(finalProfile);
      return finalProfile;
    } catch (err) {
      console.error("[AuthContext] Erro ao sincronizar perfil:", err);
      // Fallback seguro em memória para evitar qualquer bloqueio de tela
      const fallbackProfile: Profile = {
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Utilizador",
        first_name: null,
        last_name: null,
        phone: null,
        avatar_url: null,
        role: (authUser.user_metadata?.role as string) || "user",
        first_login: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(fallbackProfile);
      return fallbackProfile;
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
          await fetchOrSyncProfile(initialSession.user);
        }
      } catch (err) {
        console.error("[AuthContext] Erro ao inicializar sessão:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchOrSyncProfile(newSession.user);
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
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      await fetchOrSyncProfile(currentUser);
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
