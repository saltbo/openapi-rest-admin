import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { Spin, Alert } from 'antd';
import { useAuth } from './AuthContext';
import { AUTH_PATHS } from '~/lib/auth/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * 受保护路由组件
 * 如果requireAuth为true且用户未登录，将重定向到登录页
 */
export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { isAuthenticated, loading, error } = useAuth();
  const location = useLocation();

  // 显示加载状态
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  // 显示错误状态
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: '20px'
      }}>
        <Alert
          message="Authentication Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  // 需要认证但用户未登录，重定向到登录页
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={AUTH_PATHS.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
