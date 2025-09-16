import React, { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';
import { api } from '../api/client';
import { UserProfile, UserRole } from '../types';

interface AuthState {
  user?: UserProfile;
  token?: string;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

export type RegisterPayload = {
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  skills: string[];
  interests: string[];
  biography: string;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserProfile>();
  const [token, setToken] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.login(email, password);
      setUser(response.user);
      setToken(response.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      await api.register({ ...payload });
      await login(payload.email, payload.password);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profile = await api.getProfile(user.id);
    setUser(profile);
  };

  const logout = () => {
    setUser(undefined);
    setToken(undefined);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      refreshProfile,
      logout,
    }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
