import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getAuthService, type AuthService } from '../../lib/auth/authService';
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
  const [authService, setAuthService] = useState<AuthService | null>(getAuthService());

  useEffect(() => {
    // 检查认证服务是否已初始化，如果没有则等待初始化
    const checkAuthService = () => {
      const service = getAuthService();
      if (service && service !== authService) {
        setAuthService(service);
      }
    };

    // 如果认证服务还未初始化，定期检查
    if (!authService) {
      const interval = setInterval(checkAuthService, 100);
      return () => clearInterval(interval);
    }
  }, [authService]);

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
      const currentUser = authService?.getUser() || null;
      setUser(currentUser);
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
      // 保存当前URL作为登录后的返回地址，但排除登录相关页面
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/auth/') && currentPath !== '/login') {
        localStorage.setItem('returnUrl', currentPath);
      }
      authService.login();
    } else {
      console.error('Authentication service is not initialized. Cannot start login process.');
    }
  };

  const logout = () => {
    if (authService) {
      authService.logout();
    }
  };

  const isAuthenticated = user !== null && (authService?.isAuthenticated() || false);

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
