/**
 * RESTful API Client
 * 
 * 负责发送网络请求，包括 CRUD 操作
 * 严格遵循 RESTful 规范，基于 OpenAPI 定义进行参数验证和响应解析
 */

import type { OpenAPIV3 } from 'openapi-types';
import type { ResourceOperation } from './OpenAPIDocumentParser';

/**
 * API 请求选项
 */
export interface APIRequestOptions {
  /** 请求头 */
  headers?: Record<string, string>;
  /** 查询参数 */
  query?: Record<string, any>;
  /** 路径参数 */
  pathParams?: Record<string, any>;
  /** 请求体数据 */
  body?: any;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否包含认证信息 */
  withCredentials?: boolean;
}

/**
 * API 响应结果
 */
export interface APIResponse<T = any> {
  /** 响应数据 */
  data: T;
  /** HTTP 状态码 */
  status: number;
  /** 状态文本 */
  statusText: string;
  /** 响应头 */
  headers: Record<string, string>;
  /** 原始响应对象 */
  raw?: Response;
}

/**
 * 分页响应结果
 */
export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  /** 分页信息 */
  pagination: {
    /** 当前页码 */
    page: number;
    /** 每页大小 */
    pageSize: number;
    /** 总数量 */
    total: number;
    /** 总页数 */
    totalPages: number;
  };
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 字段名 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code?: string;
}

/**
 * API 错误
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public response?: any,
    public validationErrors?: ValidationError[]
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * RESTful API 客户端
 */
export class RESTfulAPIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, ''); // 移除末尾斜杠
  }

  /**
   * 设置默认请求头
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * 设置认证令牌
   */
  setAuthToken(token: string, type: 'Bearer' | 'Basic' = 'Bearer'): void {
    this.defaultHeaders['Authorization'] = `${type} ${token}`;
  }

  /**
   * 移除认证令牌
   */
  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * 发送 RESTful 请求
   * 基于操作定义自动验证参数和解析响应
   */
  async request<T = any>(
    operation: ResourceOperation,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    // 验证请求参数
    this.validateRequestParameters(operation, options);

    // 构建请求 URL
    const url = this.buildRequestURL(operation, options);

    // 构建请求选项
    const requestOptions = this.buildRequestOptions(operation, options);

    try {
      // 发送请求
      const response = await fetch(url, requestOptions);

      // 解析响应
      return await this.parseResponse<T>(response, operation);
    } catch (error) {
      console.error('API request failed:', error);
      throw new APIError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        'Network Error'
      );
    }
  }

  /**
   * 获取资源列表（GET /resources）
   */
  async getList<T = any>(
    operation: ResourceOperation,
    options: APIRequestOptions & {
      page?: number;
      pageSize?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      filters?: Record<string, any>;
    } = {}
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, pageSize = 20, sort, order, filters, ...requestOptions } = options;

    // 构建查询参数
    const query: Record<string, any> = {
      ...requestOptions.query,
      page,
      pageSize
    };

    if (sort) {
      query.sort = sort;
      if (order) {
        query.order = order;
      }
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query[key] = value;
        }
      });
    }

    const response = await this.request<T[]>(operation, {
      ...requestOptions,
      query
    });

    // 解析分页信息
    const pagination = this.parsePaginationFromResponse(response);

    return {
      ...response,
      pagination
    };
  }

  /**
   * 获取单个资源（GET /resources/{id}）
   */
  async getById<T = any>(
    operation: ResourceOperation,
    id: string | number,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    return this.request<T>(operation, {
      ...options,
      pathParams: {
        ...options.pathParams,
        id
      }
    });
  }

  /**
   * 创建资源（POST /resources）
   */
  async create<T = any>(
    operation: ResourceOperation,
    data: any,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    return this.request<T>(operation, {
      ...options,
      body: data
    });
  }

  /**
   * 更新资源（PUT /resources/{id}）
   */
  async update<T = any>(
    operation: ResourceOperation,
    id: string | number,
    data: any,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    return this.request<T>(operation, {
      ...options,
      pathParams: {
        ...options.pathParams,
        id
      },
      body: data
    });
  }

  /**
   * 部分更新资源（PATCH /resources/{id}）
   */
  async patch<T = any>(
    operation: ResourceOperation,
    id: string | number,
    data: any,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    return this.request<T>(operation, {
      ...options,
      pathParams: {
        ...options.pathParams,
        id
      },
      body: data
    });
  }

  /**
   * 删除资源（DELETE /resources/{id}）
   */
  async delete(
    operation: ResourceOperation,
    id: string | number,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<void>> {
    return this.request<void>(operation, {
      ...options,
      pathParams: {
        ...options.pathParams,
        id
      }
    });
  }

  /**
   * 私有方法：验证请求参数
   */
  private validateRequestParameters(
    operation: ResourceOperation,
    options: APIRequestOptions
  ): void {
    const errors: ValidationError[] = [];

    // 验证路径参数
    const pathParams = operation.parameters.filter(p => p.in === 'path');
    pathParams.forEach(param => {
      const value = options.pathParams?.[param.name];
      if (param.required && (value === undefined || value === null)) {
        errors.push({
          field: param.name,
          message: `Path parameter '${param.name}' is required`,
          code: 'REQUIRED'
        });
      }
    });

    // 验证查询参数
    const queryParams = operation.parameters.filter(p => p.in === 'query');
    queryParams.forEach(param => {
      const value = options.query?.[param.name];
      if (param.required && (value === undefined || value === null)) {
        errors.push({
          field: param.name,
          message: `Query parameter '${param.name}' is required`,
          code: 'REQUIRED'
        });
      }
    });

    // 验证请求体
    if (operation.requestBody && operation.requestBody.required) {
      if (!options.body) {
        errors.push({
          field: 'body',
          message: 'Request body is required',
          code: 'REQUIRED'
        });
      }
    }

    if (errors.length > 0) {
      throw new APIError(
        'Request validation failed',
        400,
        'Bad Request',
        undefined,
        errors
      );
    }
  }

  /**
   * 私有方法：构建请求 URL
   */
  private buildRequestURL(
    operation: ResourceOperation,
    options: APIRequestOptions
  ): string {
    let url = operation.path;

    // 替换路径参数
    if (options.pathParams) {
      Object.entries(options.pathParams).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
      });
    }

    // 添加基础 URL
    const fullURL = `${this.baseURL}${url}`;

    // 添加查询参数
    if (options.query && Object.keys(options.query).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      return `${fullURL}?${searchParams.toString()}`;
    }

    return fullURL;
  }

  /**
   * 私有方法：构建请求选项
   */
  private buildRequestOptions(
    operation: ResourceOperation,
    options: APIRequestOptions
  ): RequestInit {
    const headers = {
      ...this.defaultHeaders,
      ...options.headers
    };

    const requestInit: RequestInit = {
      method: operation.method,
      headers,
      credentials: options.withCredentials ? 'include' : 'same-origin'
    };

    // 添加请求体
    if (options.body && ['POST', 'PUT', 'PATCH'].includes(operation.method)) {
      if (typeof options.body === 'object') {
        requestInit.body = JSON.stringify(options.body);
      } else {
        requestInit.body = options.body;
      }
    }

    // 添加超时
    if (options.timeout) {
      const controller = new AbortController();
      requestInit.signal = controller.signal;
      setTimeout(() => controller.abort(), options.timeout);
    }

    return requestInit;
  }

  /**
   * 私有方法：解析响应
   */
  private async parseResponse<T>(
    response: Response,
    operation: ResourceOperation
  ): Promise<APIResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // 检查响应状态
    if (!response.ok) {
      let errorData: any;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
      } catch {
        errorData = 'Failed to parse error response';
      }

      throw new APIError(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText,
        errorData
      );
    }

    // 解析响应数据
    let data: T;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (response.status === 204 || operation.method === 'DELETE') {
      data = undefined as any;
    } else {
      data = (await response.text()) as any;
    }

    // 根据操作定义验证响应格式
    const validatedData = this.validateAndTransformResponse(data, operation);

    return {
      data: validatedData as T,
      status: response.status,
      statusText: response.statusText,
      headers,
      raw: response
    };
  }

  /**
   * 私有方法：验证和转换响应
   */
  private validateAndTransformResponse<T>(
    data: any,
    operation: ResourceOperation
  ): T {
    // 获取成功响应的 schema
    const successResponse = operation.responses['200'] || 
                           operation.responses['201'] || 
                           operation.responses['default'];

    if (!successResponse || typeof successResponse === 'string') {
      return data;
    }

    const response = successResponse as OpenAPIV3.ResponseObject;
    
    // 如果没有内容定义，直接返回
    if (!response.content) {
      return data;
    }

    // 处理常见的响应包装格式
    return this.extractDataFromResponse(data);
  }

  /**
   * 私有方法：从响应中提取数据
   */
  private extractDataFromResponse<T>(responseData: any): T {
    // 如果数据已经是期望的格式，直接返回
    if (!responseData || typeof responseData !== 'object') {
      return responseData;
    }

    // 处理常见的响应包装格式
    if ('data' in responseData) {
      return responseData.data;
    }

    if ('result' in responseData) {
      return responseData.result;
    }

    if ('items' in responseData) {
      return responseData.items;
    }

    if ('list' in responseData) {
      return responseData.list;
    }

    // 默认返回原始数据
    return responseData;
  }

  /**
   * 私有方法：从响应中解析分页信息
   */
  private parsePaginationFromResponse(response: APIResponse<any[]>): {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } {
    const rawData = (response as any).raw;
    
    // 尝试从响应头中获取分页信息
    const totalHeader = response.headers['x-total-count'] || 
                       response.headers['total-count'] ||
                       response.headers['x-total'];
    
    const pageHeader = response.headers['x-page'] || 
                      response.headers['page'];
    
    const pageSizeHeader = response.headers['x-page-size'] || 
                          response.headers['page-size'] ||
                          response.headers['x-per-page'] ||
                          response.headers['per-page'];

    let total = 0;
    let page = 1;
    let pageSize = 20;

    if (totalHeader) {
      total = parseInt(totalHeader, 10);
    }

    if (pageHeader) {
      page = parseInt(pageHeader, 10);
    }

    if (pageSizeHeader) {
      pageSize = parseInt(pageSizeHeader, 10);
    }

    // 如果响应头中没有分页信息，尝试从响应数据中获取
    if (total === 0 && rawData && typeof rawData === 'object') {
      if ('total' in rawData) {
        total = rawData.total;
      } else if ('count' in rawData) {
        total = rawData.count;
      } else if (Array.isArray(response.data)) {
        total = response.data.length;
      }

      if ('page' in rawData) {
        page = rawData.page;
      }

      if ('pageSize' in rawData || 'page_size' in rawData) {
        pageSize = rawData.pageSize || rawData.page_size;
      }
    }

    const totalPages = Math.ceil(total / pageSize);

    return {
      page,
      pageSize,
      total,
      totalPages
    };
  }

  /**
   * 获取错误消息
   */
  getErrorMessage(error: any): string {
    if (error instanceof APIError) {
      if (error.validationErrors && error.validationErrors.length > 0) {
        return error.validationErrors.map(ve => `${ve.field}: ${ve.message}`).join(', ');
      }
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error occurred';
  }

  /**
   * 检查错误类型
   */
  isValidationError(error: any): error is APIError {
    return error instanceof APIError && 
           Boolean(error.validationErrors) && 
           error.validationErrors!.length > 0;
  }

  /**
   * 检查是否为网络错误
   */
  isNetworkError(error: any): boolean {
    return error instanceof APIError && error.status === 0;
  }

  /**
   * 检查是否为认证错误
   */
  isAuthError(error: any): boolean {
    return error instanceof APIError && (error.status === 401 || error.status === 403);
  }

  /**
   * 检查是否为服务器错误
   */
  isServerError(error: any): boolean {
    return error instanceof APIError && error.status >= 500;
  }
}
