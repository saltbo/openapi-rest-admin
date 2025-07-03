import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Spin, Alert, Button } from 'antd';
import { getAuthService } from '../../lib/auth/authService';
import { AUTH_STORAGE_KEYS, AUTH_ERROR_MESSAGES } from '../../lib/auth/constants';
import { useAuth } from '../../components/auth/AuthContext';

/**
 * OIDC认证回调处理组件
 */
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const navigate = useNavigate();
  const authService = getAuthService();
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      if (!authService) {
        setError(AUTH_ERROR_MESSAGES.SERVICE_NOT_AVAILABLE);
        setProcessing(false);
        return;
      }

      try {
        await authService.handleLoginCallback();
        // 认证成功，等待上下文状态更新
      } catch (err) {
        console.error('Error during login callback:', err);
        const errorMessage = err instanceof Error ? err.message : AUTH_ERROR_MESSAGES.CALLBACK_FAILED;
        setError(errorMessage);
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [authService]);

  // 当认证成功且用户状态已更新时，进行跳转
  useEffect(() => {
    if (!processing && !loading && user && !error) {
      const returnUrl = localStorage.getItem(AUTH_STORAGE_KEYS.RETURN_URL) || '/';
      localStorage.removeItem(AUTH_STORAGE_KEYS.RETURN_URL);
      navigate(returnUrl, { replace: true });
    }
  }, [processing, loading, user, error, navigate]);

  const handleReturnHome = () => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.RETURN_URL);
    navigate('/', { replace: true });
  };

  // 显示错误状态
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        padding: '20px'
      }}>
        <Alert
          message="Authentication Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        <Button type="primary" onClick={handleReturnHome}>
          Return to Home
        </Button>
      </div>
    );
  }

  // 显示处理中状态
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
