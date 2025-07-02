import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Spin } from 'antd';
import { getAuthService } from '../../lib/auth/authService';

/**
 * OIDC认证回调处理组件
 */
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const authService = getAuthService();

  useEffect(() => {
    async function handleCallback() {
      if (!authService) {
        setError('Authentication service is not initialized');
        return;
      }

      try {
        const user = await authService.handleLoginCallback();
        if (user) {
          // 登录成功，重定向到首页或登录前的页面
          const returnUrl = localStorage.getItem('returnUrl') || '/';
          localStorage.removeItem('returnUrl');
          navigate(returnUrl);
        } else {
          setError('Failed to log in');
        }
      } catch (error) {
        console.error('Error during login callback:', error);
        setError(error instanceof Error ? error.message : 'Unknown error during login');
      }
    }

    handleCallback();
  }, [navigate, authService]);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}>
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Return to Home</button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh' 
    }}>
      <Spin size="large" tip="Processing login..." />
    </div>
  );
}
