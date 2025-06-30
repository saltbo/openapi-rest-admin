/**
 * API 服务入口文件
 * 
 * 统一导出 OpenAPI 相关的核心服务类
 */

import { OpenAPIDocumentParser } from './OpenAPIDocumentParser';
import { SchemaRenderer } from './SchemaRenderer';
import { RESTfulAPIClient } from './RESTfulAPIClient';

export { OpenAPIDocumentParser } from './OpenAPIDocumentParser';
export type { 
  ResourceStatistics, 
  ResourceInfo, 
  ResourceOperation 
} from './OpenAPIDocumentParser';

export { SchemaRenderer } from './SchemaRenderer';
export type { 
  FormSchemaOptions, 
  TableSchemaOptions, 
  FormSchema, 
  TableColumn, 
  TableSchema 
} from './SchemaRenderer';

export { RESTfulAPIClient, APIError } from './RESTfulAPIClient';
export type { 
  APIRequestOptions, 
  APIResponse, 
  PaginatedResponse, 
  ValidationError 
} from './RESTfulAPIClient';

/**
 * 完整的 OpenAPI 服务包装器
 * 整合三个核心服务，提供统一的接口
 */
export class OpenAPIService {
  private parser: OpenAPIDocumentParser;
  private renderer: SchemaRenderer;
  private client: RESTfulAPIClient;

  constructor(baseURL: string) {
    this.parser = new OpenAPIDocumentParser();
    this.renderer = new SchemaRenderer();
    this.client = new RESTfulAPIClient(baseURL);
  }

  /**
   * 获取解析器实例
   */
  getParser(): OpenAPIDocumentParser {
    return this.parser;
  }

  /**
   * 获取渲染器实例
   */
  getRenderer(): SchemaRenderer {
    return this.renderer;
  }

  /**
   * 获取客户端实例
   */
  getClient(): RESTfulAPIClient {
    return this.client;
  }

  /**
   * 初始化服务（解析 OpenAPI 文档）
   */
  async initialize(apiDocumentUrl: string): Promise<void> {
    await this.parser.parseDocument(apiDocumentUrl);
    
    // 设置客户端的服务器地址
    const servers = this.parser.getServers();
    if (servers.length > 0) {
      // 重新创建客户端使用正确的基础 URL
      this.client = new RESTfulAPIClient(servers[0]);
    }
  }

  /**
   * 获取文档信息
   */
  getDocumentInfo() {
    return this.parser.getDocumentInfo();
  }

  /**
   * 获取资源统计
   */
  getResourceStatistics() {
    return this.parser.getResourceStatistics();
  }

  /**
   * 获取所有资源 schemas
   */
  getAllResourceSchemas() {
    return this.parser.getAllResourceSchemas();
  }

  /**
   * 为特定资源生成表单 schema
   */
  getResourceFormSchema(resourceName: string, options?: any) {
    const schema = this.parser.getResourceSchema(resourceName);
    if (!schema) {
      throw new Error(`Resource '${resourceName}' not found`);
    }
    return this.renderer.getFormSchema(schema, options);
  }

  /**
   * 为特定资源生成表格 schema
   */
  getResourceTableSchema(resourceName: string, options?: any) {
    const schema = this.parser.getResourceSchema(resourceName);
    if (!schema) {
      throw new Error(`Resource '${resourceName}' not found`);
    }
    return this.renderer.getTableSchema(schema, options);
  }

  /**
   * 设置认证信息
   */
  setAuth(token: string, type: 'Bearer' | 'Basic' = 'Bearer') {
    this.client.setAuthToken(token, type);
  }

  /**
   * 移除认证信息
   */
  removeAuth() {
    this.client.removeAuthToken();
  }
}

/**
 * 创建 OpenAPI 服务实例的工厂函数
 */
export function createOpenAPIService(baseURL: string): OpenAPIService {
  return new OpenAPIService(baseURL);
}
