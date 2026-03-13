"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface AuthContextType {
  user: any | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("AuthContext - Initializing...");
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      console.log("AuthContext - Found token and user in storage", JSON.parse(storedUser));
      setUser(JSON.parse(storedUser));
    } else {
      console.log("AuthContext - No storage data found");
    }
    setLoading(false);
  }, []);

  const login = (token: string, user: any) => {
    console.log("AuthContext - Executing login function for:", user.email);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    console.log("AuthContext - State updated, pushing to /admin");
    router.push('/admin');
  };

  const logout = () => {
    console.log("AuthContext - Executing logout");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
