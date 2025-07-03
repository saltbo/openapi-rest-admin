import { useEffect } from 'react';
import { message } from 'antd';
import { useAuth } from '../components/auth/AuthContext';

/**
 * 自动显示认证错误的Hook
 */
export function useAuthError() {
  const { error, clearError } = useAuth();

  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);
}
