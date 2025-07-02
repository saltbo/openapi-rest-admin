import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getAuthService } from '../../lib/auth/authService';
import type { User } from 'oidc-client-ts';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 认证上下文提供器
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = getAuthService();

  useEffect(() => {
    const loadUser = async () => {
      if (authService) {
        try {
          const loadedUser = await authService.loadUser();
          setUser(loadedUser);
        } catch (error) {
          console.error('Failed to load user:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadUser();

    // 添加认证事件监听器
    const handleLoginEvent = () => {
      setUser(authService?.getUser() || null);
    };

    const handleLogoutEvent = () => {
      setUser(null);
    };

    if (authService) {
      authService.addEventListener('login', handleLoginEvent);
      authService.addEventListener('logout', handleLogoutEvent);
      authService.addEventListener('expired', handleLogoutEvent);
    }

    // 清理监听器
    return () => {
      if (authService) {
        authService.removeEventListener('login', handleLoginEvent);
        authService.removeEventListener('logout', handleLogoutEvent);
        authService.removeEventListener('expired', handleLogoutEvent);
      }
    };
  }, [authService]);

  const login = () => {
    if (authService) {
      // 保存当前URL作为登录后的返回地址
      localStorage.setItem('returnUrl', window.location.pathname);
      authService.login();
    }
  };

  const logout = () => {
    if (authService) {
      authService.logout();
    }
  };

  const isAuthenticated = authService?.isAuthenticated() || false;

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 使用认证上下文的钩子
 */
export function useAuth() {
  return useContext(AuthContext);
}
