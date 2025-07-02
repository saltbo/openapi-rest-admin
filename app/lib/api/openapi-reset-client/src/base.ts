import type { ResourceOperation } from "../../OpenAPIDocumentParser";
import {
  APIError,
  type BuildRequestInfo,
  type RequestBuildOptions,
  type ResourceRequestOptions,
  type ResourceResponse,
  type ValidationError,
} from "../lib/types";

export class BaseOpenapiClient {
  protected baseURL: string;
  protected defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, ""); // 移除末尾斜杠
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
  setAuthToken(token: string, type: "Bearer" | "Basic" = "Bearer"): void {
    this.defaultHeaders["Authorization"] = `${type} ${token}`;
  }

  /**
   * 移除认证令牌
   */
  removeAuthToken(): void {
    delete this.defaultHeaders["Authorization"];
  }

  /**
   * 执行实际的网络请求
   */
  async executeRequest<T>(
    operation: ResourceOperation,
    options: ResourceRequestOptions
  ): Promise<ResourceResponse<T>> {
    // 构建请求信息
    const requestInfo = this.buildRequest({
      operation,
      options,
      baseURL: this.baseURL,
      defaultHeaders: this.defaultHeaders,
    });

    try {
      // 发送请求
      const response = await fetch(requestInfo.url, requestInfo.requestInit);

      // 解析响应
      return await this.parseResponse<T>(response, operation);
    } catch (error) {
      console.error("API request failed:", error);
      throw new APIError(
        `Request failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        0,
        "Network Error"
      );
    }
  }

  /**
   * 构建完整的请求信息
   */
  private buildRequest(buildOptions: RequestBuildOptions): BuildRequestInfo {
    const { operation, options, baseURL, defaultHeaders } = buildOptions;

    // 验证请求参数
    this.validateRequestParameters(operation, options);

    // 构建请求 URL
    const url = this.buildRequestURL(operation, options, baseURL);

    // 构建请求选项
    const requestInit = this.buildRequestOptions(
      operation,
      options,
      defaultHeaders
    );

    return {
      url,
      requestInit,
    };
  }

  /**
   * 验证请求参数
   */
  private validateRequestParameters(
    operation: ResourceOperation,
    options: ResourceRequestOptions
  ): void {
    const errors: ValidationError[] = [];

    // 验证路径参数
    const pathParams = operation.parameters.filter((p) => p.in === "path");
    pathParams.forEach((param) => {
      const value = options.pathParams?.[param.name];
      if (param.required && (value === undefined || value === null)) {
        errors.push({
          field: param.name,
          message: `Path parameter '${param.name}' is required`,
          code: "REQUIRED",
        });
      }
    });

    // 验证查询参数
    const queryParams = operation.parameters.filter((p) => p.in === "query");
    queryParams.forEach((param) => {
      const value = options.query?.[param.name];
      if (param.required && (value === undefined || value === null)) {
        errors.push({
          field: param.name,
          message: `Query parameter '${param.name}' is required`,
          code: "REQUIRED",
        });
      }
    });

    // 验证请求体
    if (operation.requestBody && operation.requestBody.required) {
      if (!options.body) {
        errors.push({
          field: "body",
          message: "Request body is required",
          code: "REQUIRED",
        });
      }
    }

    if (errors.length > 0) {
      throw new APIError(
        "Request validation failed",
        400,
        "Bad Request",
        undefined,
        errors
      );
    }
  }

  /**
   * 构建请求 URL
   */
  private buildRequestURL(
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
            value.forEach((v) => searchParams.append(key, String(v)));
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
  private buildRequestOptions(
    operation: ResourceOperation,
    options: ResourceRequestOptions,
    defaultHeaders: Record<string, string>
  ): RequestInit {
    const headers = {
      ...defaultHeaders,
      ...options.headers,
    };

    const requestInit: RequestInit = {
      method: operation.method,
      headers,
      credentials: options.withCredentials ? "include" : "same-origin",
    };

    // 添加请求体
    if (options.body && ["POST", "PUT", "PATCH"].includes(operation.method)) {
      if (typeof options.body === "object") {
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
   * 解析响应
   */
  private async parseResponse<T>(
    response: Response,
    operation: ResourceOperation
  ): Promise<ResourceResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // 检查响应状态
    if (!response.ok) {
      let errorData: any;
      const contentType = response.headers.get("content-type");

      try {
        if (contentType?.includes("application/json")) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
      } catch {
        errorData = "Failed to parse error response";
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
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else if (response.status === 204 || operation.method === "DELETE") {
      data = undefined as any;
    } else {
      data = (await response.text()) as any;
    }

    // 直接返回原始数据，不在这里做转换
    return {
      data: data,
      status: response.status,
      statusText: response.statusText,
      headers,
      raw: response,
    };
  }

  /**
   * 获取错误消息
   */
  getErrorMessage(error: any): string {
    if (error instanceof APIError) {
      if (error.validationErrors && error.validationErrors.length > 0) {
        return error.validationErrors
          .map((ve) => `${ve.field}: ${ve.message}`)
          .join(", ");
      }
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Unknown error occurred";
  }

  /**
   * 检查错误类型
   */
  isValidationError(error: any): error is APIError {
    return (
      error instanceof APIError &&
      Boolean(error.validationErrors) &&
      error.validationErrors!.length > 0
    );
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
    return (
      error instanceof APIError &&
      (error.status === 401 || error.status === 403)
    );
  }

  /**
   * 检查是否为服务器错误
   */
  isServerError(error: any): boolean {
    return error instanceof APIError && error.status >= 500;
  }
}
