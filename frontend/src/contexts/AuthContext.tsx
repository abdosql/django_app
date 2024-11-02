import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { LoginResponse } from '../services/auth.service';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    console.log('AuthContext: Checking authentication...');
    try {
      const isAuth = await authService.checkAuthStatus();
      console.log('AuthContext: Auth check result:', isAuth);
      if (isAuth) {
        const userData = authService.getUserData();
        console.log('AuthContext: User data retrieved:', userData);
        setIsAuthenticated(true);
        setUser(userData);
        authService.startTokenCheck();
      } else {
        console.log('AuthContext: Not authenticated');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext: Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('AuthContext: Initializing authentication');
    const initAuth = async () => {
      await checkAuth();
    };
    initAuth();

    return () => {
      console.log('AuthContext: Cleaning up');
      authService.stopTokenCheck();
    };
  }, []);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      setIsAuthenticated(true);
      setUser(authService.getUserData());
      authService.startTokenCheck();
      return response;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 