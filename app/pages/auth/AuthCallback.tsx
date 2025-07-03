import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Spin } from 'antd';
import { getAuthService } from '../../lib/auth/authService';
import { useAuth } from '../../components/auth/AuthContext';

/**
 * OIDC认证回调处理组件
 */
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [callbackProcessed, setCallbackProcessed] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const navigate = useNavigate();
  const authService = getAuthService();
  const { user, loading } = useAuth();

  useEffect(() => {
    async function handleCallback() {
      if (!authService) {
        setError('Authentication service is not initialized');
        return;
      }

      try {
        const callbackUser = await authService.handleLoginCallback();
        if (callbackUser) {
          // 标记回调已处理
          setCallbackProcessed(true);
        } else {
          setError('Failed to log in');
        }
      } catch (error) {
        console.error('Error during login callback:', error);
        setError(error instanceof Error ? error.message : 'Unknown error during login');
      }
    }

    handleCallback();
  }, [authService]);

  // 当回调处理完成且用户状态已更新时，进行跳转
  useEffect(() => {
    if (callbackProcessed && !loading && user && !redirected) {
      const returnUrl = localStorage.getItem('returnUrl') || '/';
      localStorage.removeItem('returnUrl');
      setRedirected(true);
      navigate(returnUrl);
    }
  }, [callbackProcessed, loading, user, redirected, navigate]);

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
