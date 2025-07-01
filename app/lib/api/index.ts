/**
 * API 服务入口文件
 * 
 * 统一导出 OpenAPI 相关的核心服务类
 */

import { OpenAPIDocumentParser } from './OpenAPIDocumentParser';
import { SchemaRenderer } from './SchemaRenderer';
import { RESTfulAPIClient } from './RESTfulAPIClient';
import { DataExtractor } from './DataExtractor';
import { PathParamResolver } from './PathParamResolver';

export { OpenAPIDocumentParser } from './OpenAPIDocumentParser';
export type { 
  ResourceStatistics, 
  ResourceInfo, 
  ResourceOperation 
} from './OpenAPIDocumentParser';

export { SchemaRenderer } from './SchemaRenderer';
export { PathParamResolver } from './PathParamResolver';
export type { 
  FormSchemaOptions, 
  TableSchemaOptions, 
  FormSchema, 
  TableSchema 
} from './SchemaRenderer';

export { RESTfulAPIClient, APIError } from './RESTfulAPIClient';
export type { 
  APIRequestOptions, 
  APIResponse, 
  PaginatedResponse, 
  ValidationError 
} from './RESTfulAPIClient';

export { DataExtractor } from './DataExtractor';
export type {
  DataExtractionOptions,
  ExtractedData
} from './DataExtractor';

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
   * 获取所有资源信息
   */
  getAllResources() {
    return this.parser.getAllResources();
  }

  /**
   * 获取顶级资源
   */
  getTopLevelResources() {
    return this.parser.getTopLevelResources();
  }

  /**
   * 获取特定资源唯一标识符的值
   * @param resourceName 资源名
   * @param resourceData 资源数据
   * @returns {string} 资源的唯一标识符
   */
  getResourceIdentifier(resourceName: string, data: any): string {
    const allResources = this.parser.getAllResources();
    const resource = allResources.find(r => r.name === resourceName);
    if (!resource) {
      throw new Error(`Resource '${resourceName}' not found`);
    }
    
    const identifierField = resource.identifierField;
    if (!identifierField) {
      throw new Error(`Resource '${resourceName}' does not have an identifier field`);
    }

    const identifierValue = data[identifierField];
    if (identifierValue === undefined || identifierValue === null) {
      throw new Error(`Resource '${resourceName}' identifier field '${identifierField}' is missing in data`);
    }
    return String(identifierValue);
  }

  /**
   * 为特定资源生成表单 schema（支持 create/edit，自动处理初始数据）
   * @param resourceName 资源名
   * @param options 选项 { action, initialData, excludeFields, ... }
   * @returns { schema, uiSchema, formData }
   */
  getResourceFormSchema(
    resourceName: string,
    options: {
      action?: 'create' | 'edit',
      initialData?: any,
      excludeFields?: string[],
      [key: string]: any
    } = {}
  ) {
    const { action = 'create', initialData, excludeFields = [], ...rest } = options;
    const resourceSchema = this.parser.getResourceSchema(resourceName);
    if (!resourceSchema) {
      throw new Error(`Resource '${resourceName}' not found`);
    }

    // 选择表单 schema 生成器
    let formSchemaResult;
    if (action === 'edit') {
      formSchemaResult = this.renderer.getEditFormSchema(resourceSchema, {
        excludeFields,
        ...rest,
      });
    } else {
      formSchemaResult = this.renderer.getCreateFormSchema(resourceSchema, {
        excludeFields,
        ...rest,
      });
    }

    // 处理初始数据（如日期字段格式化）
    let formData = formSchemaResult.formData || {};
    if (action === 'edit' && initialData) {
      const processedData = { ...initialData };
      Object.keys(processedData).forEach(key => {
        const value = processedData[key];
        if (value && typeof value === 'string') {
          // 检查是否为日期字符串
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime()) && value.includes('T')) {
            processedData[key] = value;
          }
        }
      });
      formData = processedData;
    }

    return {
      schema: formSchemaResult.schema,
      uiSchema: formSchemaResult.uiSchema,
      formData
    };
  }

  /**
   * 为特定资源生成表格 schema
   */
  getResourceTableSchema(resourceName: string, options?: any) {
    const resourceSchema = this.parser.getResourceSchema(resourceName);
    if (!resourceSchema) {
      throw new Error(`Resource '${resourceName}' not found`);
    }
    
    return this.renderer.getTableSchema(resourceSchema, options);
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
