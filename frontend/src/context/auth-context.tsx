"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'OPERATOR' | 'DRIVER' | 'PASSENGER';
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User, redirect?: string) => void;
  logout: () => void;
  loading: boolean;
  isPassenger: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string, user: User, redirect?: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);

    if (redirect) {
      router.push(redirect);
      return;
    }

    // Role-based default redirect
    if (user.role === 'PASSENGER') {
      router.push('/hesap/biletlerim');
    } else if (user.role === 'DRIVER') {
      router.push('/driver');
    } else {
      router.push('/admin');
    }
  };

  const logout = () => {
    const wasPassenger = user?.role === 'PASSENGER';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push(wasPassenger ? '/' : '/login');
  };

  const isPassenger = user?.role === 'PASSENGER';
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'OPERATOR';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isPassenger, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
