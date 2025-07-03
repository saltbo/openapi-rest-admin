/**
 * 认证相关常量
 */

// 本地存储键名
export const AUTH_STORAGE_KEYS = {
  RETURN_URL: 'returnUrl',
} as const;

// 认证路径
export const AUTH_PATHS = {
  LOGIN: '/login',
  CALLBACK: '/auth/callback',
  LOGOUT: '/logout',
} as const;

// 错误消息
export const AUTH_ERROR_MESSAGES = {
  SERVICE_NOT_AVAILABLE: 'Authentication service is not available',
  LOGIN_FAILED: 'Login failed',
  SESSION_EXPIRED: 'Session expired',
  CALLBACK_FAILED: 'Authentication callback failed',
} as const;
