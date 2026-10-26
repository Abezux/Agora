import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { StoreSettings, BusinessType } from '@/types';

export interface UserStore extends StoreSettings {
  id: string;
  owner_user_id: string;
  created_at?: string;
}

export type AuthUser = User | { id: string; email: string };

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  store: UserStore | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  createStore: (
    name: string,
    businessType: BusinessType,
    currencySymbol: string,
    currencyCode: string
  ) => Promise<{ error?: string }>;
  refreshStore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_MOCK_USER_KEY = 'agora_mock_user';
const LOCAL_MOCK_STORE_KEY = 'agora_mock_store';
const LEGACY_MOCK_USER_KEY = 'shemsu_mock_user';
const LEGACY_MOCK_STORE_KEY = 'shemsu_mock_store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [store, setStore] = useState<UserStore | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load store for active user
  const fetchUserStore = async (userId: string) => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching store from Supabase:', error);
          setStore(null);
        } else if (data) {
          setStore({
            id: data.id,
            owner_user_id: data.owner_user_id,
            store_name: data.name,
            business_type: data.business_type as BusinessType,
            currency_symbol: data.currency_symbol,
            currency_code: data.currency_code,
            expiry_alert_days: data.expiry_alert_days,
            low_stock_alerts_enabled: true,
          });
        } else {
          setStore(null);
        }
      } catch (err) {
        console.error('Failed to fetch store:', err);
        setStore(null);
      }
    } else {
      // Local Mock Mode (supports fallback check from legacy keys)
      const localStoreStr =
        localStorage.getItem(`${LOCAL_MOCK_STORE_KEY}_${userId}`) ||
        localStorage.getItem(`${LEGACY_MOCK_STORE_KEY}_${userId}`);
      if (localStoreStr) {
        setStore(JSON.parse(localStoreStr));
      } else {
        setStore(null);
      }
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured()) {
      // Supabase Cloud Auth Listener
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserStore(session.user.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserStore(session.user.id).finally(() => setLoading(false));
        } else {
          setStore(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // Security Check: Block unauthenticated mock auth in production deployments
      if (import.meta.env.MODE === 'production') {
        console.error(
          '[CRITICAL SECURITY ERROR]: Supabase is unconfigured in production mode! Local mock auth is disabled.'
        );
        setLoading(false);
        return;
      }

      // Local Mock Auth Loader (Development Mode Only with legacy key migration)
      const localUserStr =
        localStorage.getItem(LOCAL_MOCK_USER_KEY) || localStorage.getItem(LEGACY_MOCK_USER_KEY);
      if (localUserStr) {
        const mockUser = JSON.parse(localUserStr);
        setUser(mockUser);
        fetchUserStore(mockUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }
      setUser(data.user);
      setSession(data.session);
      if (data.user) {
        await fetchUserStore(data.user.id);
      }
      setLoading(false);
      return {};
    } else {
      if (import.meta.env.MODE === 'production') {
        setLoading(false);
        return {
          error: 'Security Error: Supabase credentials are required in production environment.',
        };
      }

      // Local Mock Sign In
      const mockUser = {
        id: `mock-user-${email.replace(/[^a-z0-9]/gi, '_')}`,
        email: email.trim(),
      };
      localStorage.setItem(LOCAL_MOCK_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      await fetchUserStore(mockUser.id);
      setLoading(false);
      return {};
    }
  };

  const signUp = async (email: string, pass: string) => {
    setLoading(true);
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      setUser(data.user);
      setSession(data.session);
      if (data.user) {
        await fetchUserStore(data.user.id);
      }
      setLoading(false);
      return {};
    } else {
      return signIn(email, pass);
    }
  };

  const signOut = async () => {
    setLoading(true);
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_MOCK_USER_KEY);
    setUser(null);
    setSession(null);
    setStore(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) return { error: error.message };
      return {};
    }
    return {};
  };

  const createStore = async (
    name: string,
    businessType: BusinessType,
    currencySymbol: string,
    currencyCode: string
  ) => {
    if (!user) return { error: 'Must be logged in to create a store' };
    setLoading(true);

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          owner_user_id: user.id,
          name: name.trim(),
          business_type: businessType,
          currency_symbol: currencySymbol,
          currency_code: currencyCode,
          expiry_alert_days: 30,
        })
        .select('*')
        .single();

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      const newStore: UserStore = {
        id: data.id,
        owner_user_id: data.owner_user_id,
        store_name: data.name,
        business_type: data.business_type as BusinessType,
        currency_symbol: data.currency_symbol,
        currency_code: data.currency_code,
        expiry_alert_days: data.expiry_alert_days,
        low_stock_alerts_enabled: true,
      };

      setStore(newStore);
      setLoading(false);
      return {};
    } else {
      // Local Mock Store Creation
      const mockStore: UserStore = {
        id: `store-mock-${Date.now()}`,
        owner_user_id: user.id,
        store_name: name.trim(),
        business_type: businessType,
        currency_symbol: currencySymbol,
        currency_code: currencyCode,
        expiry_alert_days: 30,
        low_stock_alerts_enabled: true,
      };
      localStorage.setItem(`${LOCAL_MOCK_STORE_KEY}_${user.id}`, JSON.stringify(mockStore));
      setStore(mockStore);
      setLoading(false);
      return {};
    }
  };

  const refreshStore = async () => {
    if (user) {
      await fetchUserStore(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        store,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        createStore,
        refreshStore,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
