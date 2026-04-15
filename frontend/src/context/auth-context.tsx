"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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

function readStoredUser(): User | null {
  try {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) return null;
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
}

function homeForRole(role: User['role'] | undefined): string {
  switch (role) {
    case 'PASSENGER': return '/hesap/biletlerim';
    case 'DRIVER': return '/driver';
    case 'COMPANY_ADMIN':
    case 'SUPER_ADMIN':
    case 'OPERATOR':
      return '/admin';
    default: return '/';
  }
}

/**
 * Path prefixes each role owns. If a user's role-bearing tab gets hijacked
 * by another role via localStorage sync, we redirect them out.
 */
const PROTECTED_PREFIXES: Record<string, User['role'][]> = {
  '/admin': ['COMPANY_ADMIN', 'SUPER_ADMIN', 'OPERATOR'],
  '/driver': ['DRIVER'],
  '/hesap': ['PASSENGER'],
};

function requiredRolesForPath(pathname: string): User['role'][] | null {
  for (const prefix in PROTECTED_PREFIXES) {
    if (pathname.startsWith(prefix)) return PROTECTED_PREFIXES[prefix];
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initial load
  useEffect(() => {
    setUser(readStoredUser());
    setLoading(false);
  }, []);

  // Cross-tab sync: when another tab logs in/out, pick it up here
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'token' && e.key !== 'user' && e.key !== null) return;
      const next = readStoredUser();
      setUser(next);

      // If another tab logged out, send this tab home
      if (!next && pathname && requiredRolesForPath(pathname)) {
        router.push(pathname.startsWith('/hesap') ? '/hesap/giris' : '/login');
        return;
      }

      // If another tab logged in as a different role that doesn't own this path
      if (next && pathname) {
        const required = requiredRolesForPath(pathname);
        if (required && !required.includes(next.role)) {
          router.push(homeForRole(next.role));
        }
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [pathname, router]);

  const login = (token: string, user: User, redirect?: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);

    if (redirect) {
      router.push(redirect);
      return;
    }
    router.push(homeForRole(user.role));
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
