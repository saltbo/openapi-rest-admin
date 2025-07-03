import { UserManager, User, WebStorageStateStore, Log } from 'oidc-client-ts';
import type { RuntimeConfig } from '../../../config/types';

// 设置日志级别，生产环境可以关闭
Log.setLogger(console);
Log.setLevel(process.env.NODE_ENV === 'production' ? Log.NONE : Log.INFO);

// 事件类型
export type AuthEventType = 'login' | 'logout' | 'expiring' | 'expired' | 'error';

/**
 * OIDC认证服务
 */
export class AuthService {
  private userManager: UserManager | null = null;
  private user: User | null = null;
  private config: RuntimeConfig;
  private listeners: Map<AuthEventType, Set<() => void>> = new Map();

  constructor(config: RuntimeConfig) {
    this.config = config;
    this.initUserManager();
  }

  /**
   * 初始化OIDC用户管理器
   */
  private initUserManager() {
    const { 
      oidcIssuer, 
      oidcClientId, 
      oidcRedirectUri, 
      oidcResponseType, 
      oidcScope,
      oidcAudience 
    } = this.config;

    // 检查必要的OIDC配置是否存在
    if (!oidcIssuer || !oidcClientId) {
      console.warn('OIDC configuration is incomplete. Authentication will not work.');
      return;
    }

    // 确保重定向URI包含完整的origin
    let fullRedirectUri = oidcRedirectUri || '/auth/callback';
    if (fullRedirectUri.startsWith('/')) {
      fullRedirectUri = `${window.location.origin}${fullRedirectUri}`;
    }

    this.userManager = new UserManager({
      authority: oidcIssuer,
      client_id: oidcClientId,
      redirect_uri: fullRedirectUri,
      response_type: oidcResponseType || 'code',
      scope: oidcScope || 'openid profile email offline_access',
      automaticSilentRenew: true,
      userStore: new WebStorageStateStore({ store: window.localStorage }),
      ...(oidcAudience && { 
        extraQueryParams: { audience: oidcAudience },
        extraTokenParams: { audience: oidcAudience }
      }),
    });

    // 添加事件监听器
    this.userManager.events.addUserLoaded(user => {
      this.user = user;
      this.notifyListeners('login');
    });

    this.userManager.events.addUserUnloaded(() => {
      this.user = null;
      this.notifyListeners('logout');
    });

    this.userManager.events.addAccessTokenExpiring(() => {
      this.notifyListeners('expiring');
    });

    this.userManager.events.addAccessTokenExpired(() => {
      this.notifyListeners('expired');
    });

    this.userManager.events.addSilentRenewError(() => {
      this.notifyListeners('error');
    });
  }

  /**
   * 加载当前用户
   */
  async loadUser(): Promise<User | null> {
    if (!this.userManager) {
      return null;
    }
    
    try {
      this.user = await this.userManager.getUser();
      return this.user;
    } catch (error) {
      console.error('Failed to load user:', error);
      return null;
    }
  }

  /**
   * 获取当前用户
   */
  getUser(): User | null {
    return this.user;
  }

  /**
   * 获取访问令牌
   */
  getAccessToken(): string | null {
    return this.user?.access_token || null;
  }

  /**
   * 开始登录流程
   */
  login(): Promise<void> {
    if (!this.userManager) {
      return Promise.reject(new Error('OIDC not configured'));
    }
    
    return this.userManager.signinRedirect();
  }

  /**
   * 处理登录回调
   */
  async handleLoginCallback(): Promise<User | null> {
    if (!this.userManager) {
      return null;
    }
    
    try {
      this.user = await this.userManager.signinRedirectCallback();
      // 手动触发登录事件，确保监听器得到通知
      if (this.user) {
        this.notifyListeners('login');
      }
      return this.user;
    } catch (error) {
      console.error('Error handling login callback:', error);
      return null;
    }
  }

  /**
   * 登出
   */
  logout(): Promise<void> {
    if (!this.userManager) {
      return Promise.reject(new Error('OIDC not configured'));
    }
    
    return this.userManager.signoutRedirect();
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    console.log('Checking authentication status...');
    console.log('Current user:', this.user);
    console.log('User access token:', this.user?.access_token);
    console.log('Token expired:', this.isTokenExpired());
    
    const authenticated = !!this.user && !this.isTokenExpired();
    console.log('Final authentication result:', authenticated);
    
    return authenticated;
  }

  /**
   * 检查令牌是否已过期
   */
  isTokenExpired(): boolean {
    if (!this.user || !this.user.expires_at) {
      return true;
    }
    
    const now = Math.round(Date.now() / 1000);
    return this.user.expires_at < now;
  }

  /**
   * 添加事件监听器
   */
  addEventListener(event: AuthEventType, callback: () => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)?.add(callback);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(event: AuthEventType, callback: () => void): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.delete(callback);
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(event: AuthEventType): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach(callback => callback());
    }
  }
}

// 创建单例实例
let authServiceInstance: AuthService | null = null;

/**
 * 初始化认证服务
 */
export function initAuthService(config: RuntimeConfig): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(config);
  }
  return authServiceInstance;
}

/**
 * 获取认证服务实例
 */
export function getAuthService(): AuthService | null {
  return authServiceInstance;
}
