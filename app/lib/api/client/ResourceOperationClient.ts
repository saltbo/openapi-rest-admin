/**
 * Resource Operation Client
 * 
 * 专门为 ResourceOperation 服务的客户端
 * 提供简化的接口，直接请求操作即可获得对应的资源数据
 */

import type { OpenAPIV3 } from 'openapi-types';
import type { ResourceOperation } from '../OpenAPIDocumentParser';
import { APIError } from './types';
import type { 
  ResourceRequestOptions, 
  ListRequestOptions, 
  ResourceResponse, 
  PaginatedResponse, 
  ResponseTransformer,
  PaginationInfo
} from './types';
import { RequestBuilder, ResponseParser, OperationHelper, ErrorHandler } from './core';
import { ResponseTransformer as DataTransformer } from './transformers';

/**
 * Resource Operation Client
 * 专门为 ResourceOperation 服务的客户端
 */
export class ResourceOperationClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  private responseTransformer?: ResponseTransformer;

  constructor(baseURL: string, responseTransformer?: ResponseTransformer) {
    this.baseURL = baseURL.replace(/\/$/, ''); // 移除末尾斜杠
    this.responseTransformer = responseTransformer;
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
   * 设置响应转换器
   */
  setResponseTransformer(transformer: ResponseTransformer): void {
    this.responseTransformer = transformer;
  }

  /**
   * 移除响应转换器
   */
  removeResponseTransformer(): void {
    this.responseTransformer = undefined;
  }

  /**
   * 请求资源操作
   * 根据操作类型自动处理响应数据格式
   * 要求调用方显式传入 resourceSchema
   */
  async request<T = any>(
    operation: ResourceOperation,
    resourceSchema: OpenAPIV3.SchemaObject,
    options: ResourceRequestOptions = {}
  ): Promise<ResourceResponse<T> | PaginatedResponse<T>> {
    // 判断是否为列表操作
    const isListOperation = OperationHelper.isListOperation(operation);
    
    if (isListOperation) {
      // 对于列表操作，返回分页结果
      return await this.requestList<T>(operation, resourceSchema, options as ListRequestOptions);
    } else {
      // 对于单个资源操作，返回普通结果
      return await this.requestSingle<T>(operation, resourceSchema, options);
    }
  }

  /**
   * 请求资源列表
   * 专门用于处理列表操作，自动处理分页
   * 要求调用方显式传入 resourceSchema
   */
  async requestList<T = any>(
    operation: ResourceOperation,
    resourceSchema: OpenAPIV3.SchemaObject,
    options: ListRequestOptions = {}
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, pageSize = 20, sort, order, filters, query = {}, ...requestOptions } = options;

    // 构建查询参数
    const queryParams: Record<string, any> = {
      ...query,
      page,
      pageSize
    };

    if (sort) {
      queryParams.sort = sort;
      if (order) {
        queryParams.order = order;
      }
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams[key] = value;
        }
      });
    }

    const response = await this.executeRequest<T[]>(operation, {
      ...requestOptions,
      query: queryParams
    });

    // 使用专门的列表转换器解析响应数据
    const transformedData = this.transformListResponseData<T>(response.data, resourceSchema);

    return {
      ...response,
      data: transformedData.data,
      pagination: transformedData.pagination
    };
  }

  /**
   * 请求单个资源
   * 用于处理获取、创建、更新、删除操作
   * 要求调用方显式传入 resourceSchema
   */
  async requestSingle<T = any>(
    operation: ResourceOperation,
    resourceSchema: OpenAPIV3.SchemaObject,
    options: ResourceRequestOptions = {}
  ): Promise<ResourceResponse<T>> {
    const response = await this.executeRequest<T>(operation, options);
    
    // 使用专门的单个资源转换器解析响应数据
    const transformedData = this.transformSingleResponseData<T>(response.data, resourceSchema);
    
    return {
      ...response,
      data: transformedData
    };
  }

  /**
   * 获取资源（GET单个）
   * 要求调用方显式传入 resourceSchema
   */
  async get<T = any>(
    operation: ResourceOperation,
    resourceSchema: OpenAPIV3.SchemaObject,
    id: string | number,
    options: Omit<ResourceRequestOptions, 'pathParams'> = {}
  ): Promise<ResourceResponse<T>> {
    return this.requestSingle<T>(operation, resourceSchema, {
      ...options,
      pathParams: { id, ...(options as any).pathParams }
    });
  }

  /**
   * 获取资源列表（GET列表）
   * 要求调用方显式传入 resourceSchema
   */
  async list<T = any>(
    operation: ResourceOperation,
    resourceSchema: OpenAPIV3.SchemaObject,
    options: ListRequestOptions = {}
  ): Promise<PaginatedResponse<T>> {
    return this.requestList<T>(operation, resourceSchema, options);
  }

  /**
   * 创建资源（POST）
   * 要求调用方显式传入 resourceSchema
   */
  async create<T = any>(
    operation: ResourceOperation,
    resourceSchema: OpenAPIV3.SchemaObject,
    data: any,
    options: Omit<ResourceRequestOptions, 'body'> = {}
  ): Promise<ResourceResponse<T>> {
    return this.requestSingle<T>(operation, resourceSchema, {
      ...options,
      body: data
    });
  }

  /**
   * 更新资源（PUT/PATCH）
   * 要求调用方显式传入 resourceSchema
   */
  async update<T = any>(
    operation: ResourceOperation,
    resourceSchema: OpenAPIV3.SchemaObject,
    id: string | number,
    data: any,
    options: Omit<ResourceRequestOptions, 'body' | 'pathParams'> = {}
  ): Promise<ResourceResponse<T>> {
    return this.requestSingle<T>(operation, resourceSchema, {
      ...options,
      body: data,
      pathParams: { id, ...(options as any).pathParams }
    });
  }

  /**
   * 执行实际的网络请求
   */
  private async executeRequest<T>(
    operation: ResourceOperation,
    options: ResourceRequestOptions
  ): Promise<ResourceResponse<T>> {
    // 构建请求信息
    const requestInfo = RequestBuilder.buildRequest({
      operation,
      options,
      baseURL: this.baseURL,
      defaultHeaders: this.defaultHeaders
    });

    try {
      // 发送请求
      const response = await fetch(requestInfo.url, requestInfo.requestInit);

      // 解析响应
      return await ResponseParser.parseResponse<T>(response, operation);
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
   * 转换列表响应数据
   * 要求调用方显式传入 resourceSchema
   */
  private transformListResponseData<T>(
    responseData: any,
    resourceSchema: OpenAPIV3.SchemaObject
  ): {
    data: T[];
    pagination: PaginationInfo;
  } {
    // 如果有自定义转换器，使用自定义转换器
    if (this.responseTransformer) {
      const result = this.responseTransformer(responseData);
      if (!result.pagination) {
        throw new APIError('Custom transformer must provide pagination info for list operations', 500, 'Parse Error');
      }
      return {
        data: result.data as T[],
        pagination: result.pagination
      };
    }

    // 使用基于 resourceSchema 的确定性转换器
    return DataTransformer.transformListResponseData<T>(responseData, resourceSchema);
  }

  /**
   * 转换单个资源响应数据
   * 要求调用方显式传入 resourceSchema
   */
  private transformSingleResponseData<T>(
    responseData: any,
    resourceSchema: OpenAPIV3.SchemaObject
  ): T {
    // 如果有自定义转换器，使用自定义转换器
    if (this.responseTransformer) {
      const result = this.responseTransformer(responseData);
      return result.data as T;
    }

    // 使用基于 resourceSchema 的确定性转换器
    return DataTransformer.transformSingleResponseData<T>(responseData, resourceSchema);
  }

  getErrorMessage(error: any): string {
    return ErrorHandler.getErrorMessage(error);
  }

  /**
   * 检查错误类型
   */
  isValidationError(error: any): error is APIError {
    return ErrorHandler.isValidationError(error);
  }

  /**
   * 检查是否为网络错误
   */
  isNetworkError(error: any): boolean {
    return ErrorHandler.isNetworkError(error);
  }

  /**
   * 检查是否为认证错误
   */
  isAuthError(error: any): boolean {
    return ErrorHandler.isAuthError(error);
  }

  /**
   * 检查是否为服务器错误
   */
  isServerError(error: any): boolean {
    return ErrorHandler.isServerError(error);
  }
}

// 为了向后兼容，保留原始类名的别名
export const RESTfulAPIClient = ResourceOperationClient;
