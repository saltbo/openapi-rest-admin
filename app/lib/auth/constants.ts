/**
 * 认证相关常量
 */

// 本地存储键名
export const AUTH_STORAGE_KEYS = {
  RETURN_URL: 'returnUrl',
} as const;

// 认证路径
export const AUTH_PATHS = {
  LOGIN: '/auth/login',
  CALLBACK: '/auth/callback',
  LOGOUT: '/auth/logout',
} as const;

// 错误消息
export const AUTH_ERROR_MESSAGES = {
  SERVICE_NOT_INITIALIZED: 'Authentication service is not initialized. Please check your OIDC configuration.',
  LOGIN_FAILED: 'Login failed',
  SESSION_EXPIRED: 'Session expired',
  CALLBACK_FAILED: 'Authentication callback failed',
} as const;
