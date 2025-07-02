import { BaseOpenapiClient } from '../core/openapi-reset-client/src/base';
import { getAuthService } from '../auth/authService';

/**
 * 初始化API客户端并配置认证
 * 
 * @param client API客户端实例
 * @returns 配置好的API客户端实例
 */
export function initApiClientWithAuth<T extends BaseOpenapiClient>(client: T): T {
  const authService = getAuthService();
  
  // 如果有认证服务且用户已登录，设置认证令牌
  if (authService && authService.isAuthenticated()) {
    const token = authService.getAccessToken();
    if (token) {
      client.setAuthToken(token);
      console.log('Auth token set for API client');
    }
  }

  // 添加认证事件监听器
  if (authService) {
    // 登录时设置令牌
    authService.addEventListener('login', () => {
      const token = authService.getAccessToken();
      if (token) {
        client.setAuthToken(token);
        console.log('Auth token updated after login');
      }
    });

    // 登出或令牌过期时移除令牌
    const removeToken = () => {
      client.removeAuthToken();
      console.log('Auth token removed');
    };

    authService.addEventListener('logout', removeToken);
    authService.addEventListener('expired', removeToken);
  }

  return client;
}
