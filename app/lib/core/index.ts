/**
 * API 服务入口文件
 *
 * 统一导出 OpenAPI 相关的核心服务类
 */

import { OpenapiRestClient } from "./openapi-reset-client/src";
import {
  OpenAPIDocumentParser,
  type ResourceInfo,
} from "./OpenAPIDocumentParser";
import { SchemaRenderer } from "./SchemaRenderer";

export { OpenAPIDocumentParser } from "./OpenAPIDocumentParser";
export type {
  ResourceStatistics,
  ResourceInfo,
  ResourceOperation,
} from "./OpenAPIDocumentParser";

export { SchemaRenderer } from "./SchemaRenderer";
export { PathParamResolver } from "./PathParamResolver";
export type {
  FormSchemaOptions,
  TableSchemaOptions,
  FormSchema,
  TableSchema,
} from "./SchemaRenderer";

/**
 * 完整的 OpenAPI 服务包装器
 * 整合三个核心服务，提供统一的接口
 */
export class OpenAPIService {
  private parser: OpenAPIDocumentParser;
  private renderer: SchemaRenderer;

  constructor() {
    this.parser = new OpenAPIDocumentParser();
    this.renderer = new SchemaRenderer();
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
  getClient(): OpenapiRestClient {
    const servers = this.parser.getServers();
    if (servers.length === 0) {
      throw new Error("No servers defined in OpenAPI document");
    }
    return new OpenapiRestClient(servers[0] || "");
  }

  /**
   * 初始化服务（解析 OpenAPI 文档）
   */
  async initialize(apiDocumentUrl: string): Promise<void> {
    await this.parser.parseDocument(apiDocumentUrl);
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
   * 获取所有资源信息
   */
  getResource(path: string): ResourceInfo | null {
    return this.parser.getResourceByPath(path);
  }

  /**
   * 获取顶级资源
   */
  getTopLevelResources() {
    return this.parser.getAllResources();
  }

  /**
   * 获取特定资源唯一标识符的值
   * @param resourceName 资源名
   * @param resourceData 资源数据
   * @returns {string} 资源的唯一标识符
   */
  getResourceIdentifier(resourceName: string, data: any): string {
    const allResources = this.parser.getAllResources();
    const resource = allResources.find((r) => r.name === resourceName);
    if (!resource) {
      throw new Error(`Resource '${resourceName}' not found`);
    }

    const identifierField = resource.identifierField;
    if (!identifierField) {
      throw new Error(
        `Resource '${resourceName}' does not have an identifier field`
      );
    }

    const identifierValue = data[identifierField];
    if (identifierValue === undefined || identifierValue === null) {
      throw new Error(
        `Resource '${resourceName}' identifier field '${identifierField}' is missing in data`
      );
    }
    return String(identifierValue);
  }

  /**
   * 为特定资源生成表单 schema（支持 create/edit，自动处理初始数据）
   * @param resource 资源
   * @param options 选项 { action, initialData, excludeFields, ... }
   * @returns { schema, uiSchema, formData }
   */
  getResourceFormSchema(
    resource: ResourceInfo,
    options: {
      action?: "create" | "edit";
      initialData?: any;
      excludeFields?: string[];
      [key: string]: any;
    } = {}
  ) {
    const {
      action = "create",
      initialData,
      excludeFields = [],
      ...rest
    } = options;
    const resourceSchema = resource.schema;
    if (!resourceSchema) {
      throw new Error(
        `Resource '${resource.name}' does not have a schema defined`
      );
    }

    // 选择表单 schema 生成器
    let formSchemaResult;
    if (action === "edit") {
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
    if (action === "edit" && initialData) {
      const processedData = { ...initialData };
      Object.keys(processedData).forEach((key) => {
        const value = processedData[key];
        if (value && typeof value === "string") {
          // 检查是否为日期字符串
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime()) && value.includes("T")) {
            processedData[key] = value;
          }
        }
      });
      formData = processedData;
    }

    return {
      schema: formSchemaResult.schema,
      uiSchema: formSchemaResult.uiSchema,
      formData,
    };
  }

  /**
   * 为特定资源生成表格 schema
   */
  getResourceTableSchema(resource: ResourceInfo, options?: any) {
    if (!resource || !resource.schema) {
      throw new Error(
        `Resource '${resource.name}' does not have a schema defined`
      );
    }

    return this.renderer.getTableSchema(resource.schema, options);
  }
}

/**
 * 创建 OpenAPI 服务实例的工厂函数
 */
export function createOpenAPIService(): OpenAPIService {
  return new OpenAPIService();
}
