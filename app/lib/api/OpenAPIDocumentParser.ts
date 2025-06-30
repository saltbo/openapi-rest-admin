/**
 * OpenAPI Document Parser
 * 
 * 专门处理 OpenAPI 文档的解析，使用 swagger-parser 库作为底层解析引擎
 * 严格遵循 OpenAPI 规范，使用社区标准的数据类型
 */

const SwaggerParser = require('swagger-parser');
import type { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

/**
 * 资源统计信息
 */
export interface ResourceStatistics {
  /** 总资源数量 */
  totalResources: number;
  /** 总路径数量 */
  totalPaths: number;
  /** 总操作数量 */
  totalOperations: number;
  /** RESTful 资源数量 */
  restfulResources: number;
  /** 支持的 HTTP 方法统计 */
  methodCounts: Record<string, number>;
  /** 标签统计 */
  tagCounts: Record<string, number>;
}

/**
 * 资源信息
 * 基于 OpenAPI 路径推断出的资源结构
 */
export interface ResourceInfo {
  /** 资源名称 */
  name: string;
  /** 资源路径模式 */
  pathPattern: string;
  /** 基础路径（用于实际请求） */
  basePath: string;
  /** 支持的操作 */
  operations: ResourceOperation[];
  /** 是否为 RESTful 资源 */
  isRESTful: boolean;
  /** 标签 */
  tags: string[];
  /** 子资源 */
  subResources: ResourceInfo[];
}

/**
 * 资源操作信息
 */
export interface ResourceOperation {
  /** HTTP 方法 */
  method: string;
  /** 操作 ID */
  operationId?: string;
  /** 操作摘要 */
  summary?: string;
  /** 操作描述 */
  description?: string;
  /** 路径 */
  path: string;
  /** 参数 */
  parameters: OpenAPIV3.ParameterObject[];
  /** 请求体 */
  requestBody?: OpenAPIV3.RequestBodyObject;
  /** 响应 */
  responses: OpenAPIV3.ResponsesObject;
  /** 标签 */
  tags: string[];
}

/**
 * OpenAPI 文档解析器
 */
export class OpenAPIDocumentParser {
  private parsedApi: OpenAPI.Document | null = null;
  private resourceCache = new Map<string, ResourceInfo[]>();
  private statisticsCache: ResourceStatistics | null = null;

  /**
   * 解析 OpenAPI 文档
   * @param source 文档 URL 或文档对象
   */
  async parseDocument(source: string | OpenAPI.Document): Promise<void> {
    try {
      // 使用 swagger-parser 解析和验证文档
      this.parsedApi = await SwaggerParser.validate(source);
      
      // 清空缓存
      this.resourceCache.clear();
      this.statisticsCache = null;
      
      console.log('OpenAPI document parsed successfully:', {
        title: this.parsedApi?.info?.title,
        version: this.parsedApi?.info?.version,
        openApiVersion: this.getOpenAPIVersion()
      });
    } catch (error: any) {
      console.error('Failed to parse OpenAPI document:', error);
      throw new Error(`Failed to parse OpenAPI document: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * 获取所有资源的 schema
   * 返回按资源组织的 OpenAPI schema，用于后续渲染表单和表格
   */
  getAllResourceSchemas(): Record<string, OpenAPIV3.SchemaObject> {
    if (!this.parsedApi) {
      throw new Error('Document not parsed. Call parseDocument() first.');
    }

    const schemas: Record<string, OpenAPIV3.SchemaObject> = {};
    const resources = this.getResourceList();

    resources.forEach(resource => {
      // 为每个资源提取主要的 schema
      const resourceSchema = this.extractResourceSchema(resource);
      if (resourceSchema) {
        schemas[resource.name] = resourceSchema;
      }
    });

    return schemas;
  }

  /**
   * 获取资源数据的统计信息
   */
  getResourceStatistics(): ResourceStatistics {
    if (!this.parsedApi) {
      throw new Error('Document not parsed. Call parseDocument() first.');
    }

    if (this.statisticsCache) {
      return this.statisticsCache;
    }

    const resources = this.getResourceList();
    const methodCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    
    let totalOperations = 0;
    let restfulResources = 0;

    resources.forEach(resource => {
      if (resource.isRESTful) {
        restfulResources++;
      }

      resource.operations.forEach(operation => {
        totalOperations++;
        methodCounts[operation.method] = (methodCounts[operation.method] || 0) + 1;
        
        operation.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
    });

    this.statisticsCache = {
      totalResources: resources.length,
      totalPaths: Object.keys(this.parsedApi.paths || {}).length,
      totalOperations,
      restfulResources,
      methodCounts,
      tagCounts
    };

    return this.statisticsCache;
  }

  /**
   * 获取特定资源的 schema
   */
  getResourceSchema(resourceName: string): OpenAPIV3.SchemaObject | null {
    const schemas = this.getAllResourceSchemas();
    return schemas[resourceName] || null;
  }

  /**
   * 获取特定操作的完整信息
   */
  getOperationInfo(method: string, path: string): ResourceOperation | null {
    if (!this.parsedApi || !this.parsedApi.paths) {
      return null;
    }

    const pathItem = this.parsedApi.paths[path];
    if (!pathItem) {
      return null;
    }

    const operation = (pathItem as any)[method.toLowerCase()];
    if (!operation) {
      return null;
    }

    return this.buildOperationInfo(method, path, operation, pathItem as any);
  }

  /**
   * 获取服务器列表
   */
  getServers(): string[] {
    if (!this.parsedApi) {
      return [];
    }

    if (this.isV3()) {
      const v3Doc = this.parsedApi as OpenAPIV3.Document;
      return v3Doc.servers?.map(server => server.url) || [];
    } else {
      const v2Doc = this.parsedApi as OpenAPIV2.Document;
      const scheme = v2Doc.schemes?.[0] || 'http';
      const host = v2Doc.host || 'localhost';
      const basePath = v2Doc.basePath || '';
      return [`${scheme}://${host}${basePath}`];
    }
  }

  /**
   * 获取文档基本信息
   */
  getDocumentInfo() {
    if (!this.parsedApi) {
      return null;
    }

    return {
      title: this.parsedApi.info.title,
      version: this.parsedApi.info.version,
      description: this.parsedApi.info.description,
      openApiVersion: this.getOpenAPIVersion(),
      servers: this.getServers()
    };
  }

  /**
   * 私有方法：获取资源列表
   */
  private getResourceList(): ResourceInfo[] {
    const cacheKey = 'all_resources';
    if (this.resourceCache.has(cacheKey)) {
      return this.resourceCache.get(cacheKey)!;
    }

    if (!this.parsedApi || !this.parsedApi.paths) {
      return [];
    }

    const resourceMap = new Map<string, ResourceInfo>();

    // 分析所有路径，提取资源信息
    Object.entries(this.parsedApi.paths).forEach(([path, pathItem]) => {
      if (!pathItem) return;

      const resourceNames = this.extractResourceNamesFromPath(path);
      if (resourceNames.length === 0) return;

      resourceNames.forEach((resourceName, index) => {
        const isNestedResource = index > 0;
        const parentResourceName = index > 0 ? resourceNames[index - 1] : null;

        if (!resourceMap.has(resourceName)) {
          resourceMap.set(resourceName, {
            name: resourceName,
            pathPattern: this.buildPathPattern(resourceName, path),
            basePath: this.extractBasePath(resourceName, path),
            operations: [],
            isRESTful: false,
            tags: [],
            subResources: []
          });
        }

        const resource = resourceMap.get(resourceName)!;
        
        // 添加操作
        const operations = this.extractOperationsFromPathItem(path, pathItem);
        operations.forEach(operation => {
          if (!resource.operations.find(op => op.method === operation.method && op.path === operation.path)) {
            resource.operations.push(operation);
          }
        });

        // 收集标签
        operations.forEach(op => {
          op.tags.forEach(tag => {
            if (!resource.tags.includes(tag)) {
              resource.tags.push(tag);
            }
          });
        });

        // 处理嵌套关系
        if (isNestedResource && parentResourceName) {
          const parentResource = resourceMap.get(parentResourceName);
          if (parentResource && !parentResource.subResources.find(sub => sub.name === resourceName)) {
            parentResource.subResources.push(resource);
          }
        }
      });
    });

    // 判断是否为 RESTful 资源
    resourceMap.forEach(resource => {
      resource.isRESTful = this.isRESTfulResource(resource);
    });

    const resources = Array.from(resourceMap.values());
    this.resourceCache.set(cacheKey, resources);
    
    return resources;
  }

  /**
   * 从路径中提取资源名称
   */
  private extractResourceNamesFromPath(path: string): string[] {
    const segments = path.split('/').filter(Boolean);
    const resourceNames: string[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // 跳过参数段
      if (segment.startsWith('{') && segment.endsWith('}')) {
        continue;
      }

      // 跳过常见的非资源段
      if (this.isNonResourceSegment(segment)) {
        continue;
      }

      resourceNames.push(segment);
    }

    return resourceNames;
  }

  /**
   * 判断是否为非资源段
   */
  private isNonResourceSegment(segment: string): boolean {
    const nonResourceSegments = [
      'api', 'v1', 'v2', 'v3', 'version',
      'search', 'filter', 'export', 'import',
      'status', 'health', 'metrics',
      'login', 'logout', 'auth', 'oauth',
      'upload', 'download', 'files'
    ];
    
    return nonResourceSegments.includes(segment.toLowerCase());
  }

  /**
   * 构建路径模式
   */
  private buildPathPattern(resourceName: string, originalPath: string): string {
    return originalPath;
  }

  /**
   * 提取基础路径
   */
  private extractBasePath(resourceName: string, originalPath: string): string {
    // 简化处理：移除最后的参数段
    const segments = originalPath.split('/');
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment && lastSegment.startsWith('{') && lastSegment.endsWith('}')) {
      return segments.slice(0, -1).join('/');
    }
    
    return originalPath;
  }

  /**
   * 从 PathItem 中提取操作
   */
  private extractOperationsFromPathItem(path: string, pathItem: any): ResourceOperation[] {
    const operations: ResourceOperation[] = [];
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

    methods.forEach(method => {
      const operation = pathItem[method];
      if (operation) {
        operations.push(this.buildOperationInfo(method.toUpperCase(), path, operation, pathItem));
      }
    });

    return operations;
  }

  /**
   * 构建操作信息
   */
  private buildOperationInfo(
    method: string, 
    path: string, 
    operation: any,
    pathItem: any
  ): ResourceOperation {
    // 合并路径级别和操作级别的参数
    const pathParameters = pathItem.parameters || [];
    const operationParameters = operation.parameters || [];
    const allParameters = [...pathParameters, ...operationParameters];

    // 标准化参数格式（处理 v2 和 v3 的差异）
    const normalizedParameters = this.normalizeParameters(allParameters);

    return {
      method: method.toUpperCase(),
      operationId: operation.operationId,
      summary: operation.summary,
      description: operation.description,
      path,
      parameters: normalizedParameters,
      requestBody: this.normalizeRequestBody(operation),
      responses: operation.responses || {},
      tags: operation.tags || []
    };
  }

  /**
   * 标准化参数（处理 v2 和 v3 的差异）
   */
  private normalizeParameters(parameters: any[]): OpenAPIV3.ParameterObject[] {
    return parameters.map(param => {
      if ('$ref' in param) {
        return param; // 引用参数暂时保持原样
      }

      // 处理 v2 参数格式
      if ('in' in param && param.in === 'body') {
        // v2 的 body 参数转换为 v3 的 requestBody（这里简化处理）
        return {
          name: param.name || 'body',
          in: 'query', // 简化处理
          required: param.required || false,
          schema: param.schema || { type: 'object' }
        };
      }

      // 标准化为 v3 格式
      return {
        name: param.name,
        in: param.in,
        description: param.description,
        required: param.required || false,
        schema: param.schema || { type: 'string' }
      };
    });
  }

  /**
   * 标准化请求体（处理 v2 和 v3 的差异）
   */
  private normalizeRequestBody(operation: any): OpenAPIV3.RequestBodyObject | undefined {
    // v3 格式
    if (operation.requestBody) {
      return operation.requestBody;
    }

    // v2 格式 - 从 parameters 中查找 body 参数
    if (operation.parameters) {
      const bodyParam = operation.parameters.find((p: any) => p.in === 'body');
      if (bodyParam) {
        return {
          required: bodyParam.required || false,
          content: {
            'application/json': {
              schema: bodyParam.schema || { type: 'object' }
            }
          }
        };
      }
    }

    return undefined;
  }

  /**
   * 判断是否为 RESTful 资源
   */
  private isRESTfulResource(resource: ResourceInfo): boolean {
    const methods = resource.operations.map(op => op.method);
    
    // 基本的 RESTful 判断：至少有 GET 操作
    if (!methods.includes('GET')) {
      return false;
    }

    // 检查是否有集合和单个资源的操作
    const hasCollectionOps = resource.operations.some(op => 
      !op.path.includes('{') && (op.method === 'GET' || op.method === 'POST')
    );
    
    const hasItemOps = resource.operations.some(op => 
      op.path.includes('{') && ['GET', 'PUT', 'PATCH', 'DELETE'].includes(op.method)
    );

    return hasCollectionOps || hasItemOps;
  }

  /**
   * 提取资源的主要 schema
   */
  private extractResourceSchema(resource: ResourceInfo): OpenAPIV3.SchemaObject | null {
    // 优先从 GET 操作的响应中提取 schema
    const getOperation = resource.operations.find(op => op.method === 'GET');
    if (getOperation) {
      const schema = this.extractSchemaFromResponse(getOperation.responses);
      if (schema) {
        return schema;
      }
    }

    // 其次从 POST 操作的请求体中提取 schema
    const postOperation = resource.operations.find(op => op.method === 'POST');
    if (postOperation && postOperation.requestBody) {
      const schema = this.extractSchemaFromRequestBody(postOperation.requestBody);
      if (schema) {
        return schema;
      }
    }

    return null;
  }

  /**
   * 从响应中提取 schema
   */
  private extractSchemaFromResponse(responses: OpenAPIV3.ResponsesObject): OpenAPIV3.SchemaObject | null {
    const successResponse = responses['200'] || responses['201'] || responses['default'];
    if (!successResponse || typeof successResponse === 'string') {
      return null;
    }

    const response = successResponse as OpenAPIV3.ResponseObject;
    if (!response.content) {
      return null;
    }

    // 查找 JSON 内容
    const jsonContent = response.content['application/json'] || 
                       response.content['application/vnd.api+json'] ||
                       Object.values(response.content)[0];

    if (!jsonContent || !jsonContent.schema) {
      return null;
    }

    let schema = jsonContent.schema as OpenAPIV3.SchemaObject;

    // 如果是数组，提取数组项的 schema
    if (schema.type === 'array' && schema.items) {
      schema = schema.items as OpenAPIV3.SchemaObject;
    }

    // 处理常见的响应包装格式
    if (schema.type === 'object' && schema.properties) {
      // 检查是否有 data 字段包装
      if (schema.properties.data) {
        const dataSchema = schema.properties.data as OpenAPIV3.SchemaObject;
        if (dataSchema.type === 'array' && dataSchema.items) {
          return dataSchema.items as OpenAPIV3.SchemaObject;
        } else if (dataSchema.type === 'object') {
          return dataSchema;
        }
      }
      
      // 检查是否有 items/list 字段包装
      if (schema.properties.items || schema.properties.list) {
        const itemsSchema = (schema.properties.items || schema.properties.list) as OpenAPIV3.SchemaObject;
        if (itemsSchema.type === 'array' && itemsSchema.items) {
          return itemsSchema.items as OpenAPIV3.SchemaObject;
        }
      }
    }

    return schema;
  }

  /**
   * 从请求体中提取 schema
   */
  private extractSchemaFromRequestBody(requestBody: OpenAPIV3.RequestBodyObject): OpenAPIV3.SchemaObject | null {
    if (!requestBody.content) {
      return null;
    }

    const jsonContent = requestBody.content['application/json'] || 
                       requestBody.content['application/vnd.api+json'] ||
                       Object.values(requestBody.content)[0];

    if (!jsonContent || !jsonContent.schema) {
      return null;
    }

    return jsonContent.schema as OpenAPIV3.SchemaObject;
  }

  /**
   * 获取 OpenAPI 版本
   */
  private getOpenAPIVersion(): string {
    if (!this.parsedApi) return 'unknown';
    
    if ('openapi' in this.parsedApi) {
      return this.parsedApi.openapi;
    } else if ('swagger' in this.parsedApi) {
      return this.parsedApi.swagger;
    }
    
    return 'unknown';
  }

  /**
   * 判断是否为 OpenAPI 3.x
   */
  private isV3(): boolean {
    return this.getOpenAPIVersion().startsWith('3.');
  }
}
