/**
 * 请求构建器
 * 负责构建HTTP请求的URL和选项
 */

import type { ResourceOperation } from '../../OpenAPIDocumentParser';
import { APIError } from '../types';
import type { 
  ResourceRequestOptions, 
  ValidationError, 
  RequestBuildOptions, 
  BuildRequestInfo 
} from '../types';

/**
 * 请求构建器类
 */
export class RequestBuilder {
  /**
   * 验证请求参数
   */
  static validateRequestParameters(
    operation: ResourceOperation,
    options: ResourceRequestOptions
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
   * 构建请求 URL
   */
  static buildRequestURL(
    operation: ResourceOperation,
    options: ResourceRequestOptions,
    baseURL: string
  ): string {
    let url = operation.path;

    // 替换路径参数
    if (options.pathParams) {
      Object.entries(options.pathParams).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
      });
    }

    // 添加基础 URL
    const fullURL = `${baseURL}${url}`;

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
   * 构建请求选项
   */
  static buildRequestOptions(
    operation: ResourceOperation,
    options: ResourceRequestOptions,
    defaultHeaders: Record<string, string>
  ): RequestInit {
    const headers = {
      ...defaultHeaders,
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
   * 构建完整的请求信息
   */
  static buildRequest(buildOptions: RequestBuildOptions): BuildRequestInfo {
    const { operation, options, baseURL, defaultHeaders } = buildOptions;

    // 验证请求参数
    this.validateRequestParameters(operation, options);

    // 构建请求 URL
    const url = this.buildRequestURL(operation, options, baseURL);

    // 构建请求选项
    const requestInit = this.buildRequestOptions(operation, options, defaultHeaders);

    return {
      url,
      requestInit
    };
  }
}
