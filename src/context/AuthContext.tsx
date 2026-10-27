import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, DoctorDetails } from '../types';
import { db } from '../services/db';
import { requireSupabase, supabase } from '../services/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (
    data: {
      name: string;
      email: string;
      phone: string;
      role: 'patient' | 'doctor';
      password: string;
      doctorInfo?: Partial<DoctorDetails>;
    }
  ) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setIsLoading(false);
      return;
    }

    let active = true;
    const loadProfile = async (id: string | null) => {
      if (!id) {
        if (active) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }
      try {
        const profile = await db.getProfileById(id);
        if (!profile || profile.is_blocked) {
          if (active) {
            setUser(null);
            setIsLoading(false);
          }
          const { error } = await client.auth.signOut();
          if (error) console.error('Unable to clear an inactive Supabase session.', error);
          return;
        }
        if (active) {
          setUser(profile);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Unable to load signed-in profile.', error);
        if (active) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    void client.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Unable to restore Supabase session.', error);
        if (active) setIsLoading(false);
        return;
      }
      void loadProfile(data.session?.user.id ?? null);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    if (!user) return;
    const updated = await db.getProfileById(user.id);
    setUser(updated);
  };

  const login = async (email: string, password: string, selectedRole: UserRole) => {
    try {
      const client = requireSupabase();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) return { success: false, error: error.message };
      if (!data.user) return { success: false, error: 'Supabase did not return an authenticated user.' };

      const profile = await db.getProfileById(data.user.id);
      if (!profile) {
        await client.auth.signOut();
        return { success: false, error: 'Your account profile is missing. Contact the hospital administrator.' };
      }
      if (profile.role !== selectedRole) {
        await client.auth.signOut();
        return {
          success: false,
          error: `This account is registered as a ${profile.role.toUpperCase()}, not as a ${selectedRole.toUpperCase()}.`
        };
      }
      if (profile.is_blocked) {
        await client.auth.signOut();
        return { success: false, error: 'Your account has been suspended. Please contact hospital support.' };
      }

      setUser(profile);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed.' };
    }
  };

  const signup: AuthContextType['signup'] = async (data) => {
    try {
      const client = requireSupabase();
      const { data: result, error } = await client.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: {
            name: data.name.trim(),
            phone: data.phone.trim(),
            role: data.role,
            doctor_info: data.role === 'doctor' ? data.doctorInfo : undefined
          }
        }
      });
      if (error) return { success: false, error: error.message };
      if (!result.user) return { success: false, error: 'Supabase did not create an account.' };

      const profile = result.session ? await db.getProfileById(result.user.id) : undefined;
      if (profile) setUser(profile);
      return { success: true, user: profile ?? undefined };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed.' };
    }
  };

  const logout = async () => {
    const { error } = await requireSupabase().auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        signup,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
