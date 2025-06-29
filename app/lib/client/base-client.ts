/**
 * 基础 HTTP 客户端
 * 提供统一的 HTTP 请求处理逻辑
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
}

export interface APIResponse<T = any> {
  data: T;
  success: boolean;
}

export class BaseHTTPClient {
  protected baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * 构建 URL，支持查询参数
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    let fullUrl: string;
    
    // 如果 endpoint 已经是完整的 URL，直接使用
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      fullUrl = endpoint;
    }
    // 如果有 baseUrl，组合使用
    else if (this.baseUrl) {
      // 确保 baseUrl 不以 / 结尾，endpoint 以 / 开头
      const base = this.baseUrl.replace(/\/$/, '');
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      fullUrl = base + path;
    }
    // 否则直接使用 endpoint（应该是相对路径）
    else {
      fullUrl = endpoint;
    }
    
    // 如果需要添加查询参数
    if (params && Object.keys(params).length > 0) {
      const url = new URL(fullUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
      return url.toString();
    }
    
    return fullUrl;
  }

  /**
   * 通用请求方法
   */
  protected async request<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      params
    } = options;

    const url = this.buildUrl(endpoint, params);
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // 处理空响应（如 DELETE 请求）
      if (response.status === 204 || method === 'DELETE') {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      throw this.formatError(error, endpoint, method);
    }
  }

  /**
   * 处理错误响应
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorBody = await response.json();
      if (errorBody.error) {
        errorMessage = errorBody.error;
      } else if (errorBody.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // 如果解析 JSON 失败，使用默认错误消息
    }

    throw new Error(errorMessage);
  }

  /**
   * 格式化错误信息
   */
  private formatError(error: any, endpoint: string, method: string): Error {
    const baseMessage = `Failed to ${method.toLowerCase()} ${endpoint}`;
    
    if (error instanceof Error) {
      return new Error(`${baseMessage}: ${error.message}`);
    }
    
    return new Error(`${baseMessage}: Unknown error`);
  }

  /**
   * GET 请求
   */
  protected async get<T = any>(
    endpoint: string, 
    params?: Record<string, any>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST 请求
   */
  protected async post<T = any>(
    endpoint: string, 
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  /**
   * PUT 请求
   */
  protected async put<T = any>(
    endpoint: string, 
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  /**
   * DELETE 请求
   */
  protected async delete<T = any>(
    endpoint: string
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * PATCH 请求
   */
  protected async patch<T = any>(
    endpoint: string, 
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  }
}
