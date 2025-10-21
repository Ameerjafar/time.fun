"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email?: string;
  twitterHandle?: string;
  avatar?: string;
  isAuthenticated: boolean;
  isTwitterConnected?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (userData: Partial<User>) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = localStorage.getItem('timefun_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: Partial<User>) => {
    const newUser: User = {
      id: userData.id || Date.now().toString(),
      name: userData.name || 'User',
      email: userData.email,
      twitterHandle: userData.twitterHandle,
      avatar: userData.avatar,
      isAuthenticated: true,
      isTwitterConnected: userData.isTwitterConnected || !!userData.twitterHandle,
    };
    setUser(newUser);
    localStorage.setItem('timefun_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('timefun_user');
    sessionStorage.removeItem('isTwitterConnected');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
