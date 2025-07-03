import { BaseOpenapiClient } from '../core/openapi-reset-client/src/base';
import { getAuthService } from '../auth/authService';

/**
 * 设置认证令牌的同步函数（用于事件监听器）
 */
function setAuthTokenSync<T extends BaseOpenapiClient>(client: T): void {
  const authService = getAuthService();
  if (!authService) return;
  
  console.log('Sync setting auth token...');
  console.log('Is authenticated:', authService.isAuthenticated());
  
  if (authService.isAuthenticated()) {
    const token = authService.getAccessToken();
    console.log('User is authenticated, setting auth token:', token);
    if (token) {
      client.setAuthToken(token);
      console.log('Auth token set for API client (sync)');
    }
  } else {
    console.log('User is not authenticated, removing any existing token (sync)');
    client.removeAuthToken();
  }
}

/**
 * 初始化API客户端并配置认证
 * 
 * @param client API客户端实例
 * @returns 配置好的API客户端实例的Promise
 */
export async function initApiClientWithAuth<T extends BaseOpenapiClient>(client: T): Promise<T> {
  const authService = getAuthService();
  
  console.log('Initializing API client with auth service:', authService);
  
  // 设置认证令牌的异步函数（用于初始化）
  const setAuthTokenIfAuthenticated = async () => {
    if (!authService) return;
    
    // 确保用户信息已加载
    await authService.loadUser();
    
    console.log('Checking authentication after loading user...');
    console.log('Current user:', authService.getUser());
    console.log('Is authenticated:', authService.isAuthenticated());
    
    if (authService.isAuthenticated()) {
      const token = authService.getAccessToken();
      console.log('User is authenticated, setting auth token:', token);
      if (token) {
        client.setAuthToken(token);
        console.log('Auth token set for API client');
      }
    } else {
      console.log('User is not authenticated, removing any existing token');
      client.removeAuthToken();
    }
  };

  // 立即尝试设置认证令牌，并等待完成
  await setAuthTokenIfAuthenticated();

  // 添加认证事件监听器
  if (authService) {
    // 登录时设置令牌（使用同步版本，因为登录事件触发时用户信息已经可用）
    authService.addEventListener('login', () => {
      setAuthTokenSync(client);
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
