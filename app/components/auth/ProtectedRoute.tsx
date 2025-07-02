import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { Spin } from 'antd';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * 受保护路由组件
 * 如果requireAuth为true且用户未登录，将重定向到登录页
 */
export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    // 保存当前URL，以便在登录后重定向回来
    localStorage.setItem('returnUrl', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
