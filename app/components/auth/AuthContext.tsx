import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { getAuthService, type AuthService } from '../../lib/auth/authService';
import { AUTH_STORAGE_KEYS, AUTH_PATHS, AUTH_ERROR_MESSAGES } from '../../lib/auth/constants';
import type { User } from 'oidc-client-ts';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 认证上下文提供器
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // 保存返回URL的辅助函数
  const saveReturnUrl = useCallback(() => {
    const currentPath = location.pathname;
    if (!currentPath.startsWith('/auth/') && currentPath !== AUTH_PATHS.LOGIN) {
      localStorage.setItem(AUTH_STORAGE_KEYS.RETURN_URL, currentPath);
    }
  }, []);

  // 处理认证状态变化
  const handleAuthStateChange = useCallback((newUser: User | null) => {
    setUser(newUser);
    setError(null);
  }, []);

  // 处理认证错误
  const handleAuthError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setUser(null);
  }, []);

  // 初始化用户状态
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let pollInterval: NodeJS.Timeout | undefined;
    let attempts = 0;
    const maxAttempts = 50; // 最多尝试5秒 (50 * 100ms)
    
    const initializeAuth = async () => {
      const authService = getAuthService();
      
      if (!authService) {
        attempts++;
        if (attempts < maxAttempts) {
          // 如果认证服务未初始化，等待一段时间后重试
          pollInterval = setTimeout(initializeAuth, 100);
          return;
        } else {
          // 超时后停止加载
          console.warn('Authentication service initialization timeout');
          setLoading(false);
          return;
        }
      }

      // 清除轮询定时器
      if (pollInterval) {
        clearTimeout(pollInterval);
        pollInterval = undefined;
      }

      try {
        const loadedUser = await authService.loadUser();
        handleAuthStateChange(loadedUser);
      } catch (err) {
        console.error('Failed to load user:', err);
        handleAuthError('Failed to load user session');
      } finally {
        setLoading(false);
      }

      // 设置事件监听器
      const handleLogin = () => {
        const currentUser = authService.getUser();
        handleAuthStateChange(currentUser);
      };

      const handleLogout = () => {
        handleAuthStateChange(null);
      };

      const handleExpired = () => {
        handleAuthError(AUTH_ERROR_MESSAGES.SESSION_EXPIRED);
      };

      authService.addEventListener('login', handleLogin);
      authService.addEventListener('logout', handleLogout);
      authService.addEventListener('expired', handleExpired);

      cleanup = () => {
        authService.removeEventListener('login', handleLogin);
        authService.removeEventListener('logout', handleLogout);
        authService.removeEventListener('expired', handleExpired);
      };
    };

    initializeAuth();

    return () => {
      if (pollInterval) {
        clearTimeout(pollInterval);
      }
      cleanup?.();
    };
  }, [handleAuthStateChange, handleAuthError]);

  const login = useCallback(async () => {
    const authService = getAuthService();
    
    if (!authService) {
      const errorMessage = 'Authentication service is not initialized. Please check your OIDC configuration.';
      handleAuthError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      saveReturnUrl();
      await authService.login();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : AUTH_ERROR_MESSAGES.LOGIN_FAILED;
      handleAuthError(errorMessage);
      throw err;
    }
  }, [saveReturnUrl, handleAuthError]);

  const logout = useCallback(() => {
    const authService = getAuthService();
    
    if (!authService) {
      return;
    }

    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.RETURN_URL);
      authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getIsAuthenticated = useCallback(() => {
    const authService = getAuthService();
    return Boolean(user && authService?.isAuthenticated());
  }, [user]);

  const value = {
    user,
    isAuthenticated: getIsAuthenticated(),
    loading,
    error,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 使用认证上下文的钩子
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
