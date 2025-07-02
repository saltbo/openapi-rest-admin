/**
 * 客户端模块入口
 * 导出所有公共接口和类
 */

// 主客户端类
export { ResourceOperationClient, RESTfulAPIClient } from './ResourceOperationClient';

// 类型定义
export type {
  ResourceRequestOptions,
  ListRequestOptions,
  ResourceResponse,
  PaginatedResponse,
  PaginationInfo,
  ResponseTransformer,
  ParsedResponseData,
  ValidationError,
  RequestBuildOptions,
  BuildRequestInfo
} from './types';

// 错误类
export { APIError } from './types';

// 核心工具类
export { RequestBuilder, ResponseParser, OperationHelper, ErrorHandler } from './core';

// 转换器类
export { ResponseTransformer as DataTransformer } from './transformers';
