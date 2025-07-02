/**
 * 资源操作客户端的类型定义
 */

import type { ResourceOperation } from '../../OpenAPIDocumentParser';

/**
 * 资源请求选项
 */
export interface ResourceRequestOptions {
  /** 请求头 */
  headers?: Record<string, string>;
  /** 查询参数（用于过滤、排序等） */
  query?: Record<string, any>;
  /** 路径参数（如资源ID） */
  pathParams?: Record<string, any>;
  /** 请求体数据（用于创建/更新操作） */
  body?: any;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否包含认证信息 */
  withCredentials?: boolean;
}

/**
 * 列表请求选项
 */
export interface ListRequestOptions extends Omit<ResourceRequestOptions, 'query'> {
  /** 页码 */
  page?: number;
  /** 每页大小 */
  pageSize?: number;
  /** 排序字段 */
  sort?: string;
  /** 排序方向 */
  order?: 'asc' | 'desc';
  /** 过滤条件 */
  filters?: Record<string, any>;
  /** 其他查询参数 */
  query?: Record<string, any>;
}

/**
 * 资源响应结果
 */
export interface ResourceResponse<T = any> {
  /** 资源数据 */
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
 * 分页信息
 */
export interface PaginationInfo {
  /** 当前页码 */
  page: number;
  /** 每页大小 */
  pageSize: number;
  /** 总数量 */
  total: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 分页响应结果
 */
export interface PaginatedResponse<T = any> extends ResourceResponse<T[]> {
  /** 分页信息 */
  pagination: PaginationInfo;
}

/**
 * 响应转换器函数
 */
export type ResponseTransformer<T = any> = (responseData: any) => {
  data: T;
  pagination?: PaginationInfo;
};

/**
 * 解析后的响应数据
 */
export interface ParsedResponseData<T = any> {
  /** 实际数据 */
  data: T;
  /** 分页信息（如果有） */
  pagination?: PaginationInfo;
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
 * 请求构建选项
 */
export interface RequestBuildOptions {
  operation: ResourceOperation;
  options: ResourceRequestOptions;
  baseURL: string;
  defaultHeaders: Record<string, string>;
}

/**
 * 构建的请求信息
 */
export interface BuildRequestInfo {
  url: string;
  requestInit: RequestInit;
}
