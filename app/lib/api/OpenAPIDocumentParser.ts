/**
 * 浏览器友好的 OpenAPI 文档解析器
 * 避免使用 swagger-parser 的重量级依赖
 * 
 * 主要功能：
 * - 解析 OpenAPI 2.0/3.0/3.1 文档
 * - 提取资源信息和操作
 * - 构建资源层级关系
 * - 解析 schema 并解引用
 * - 提供统计信息
 */

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
  /** 资源标识字段（通常是 ID） */
  identifierField: string; 
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
 * 浏览器友好的 OpenAPI 文档解析器
 * 使用简化的解析逻辑，避免重量级的 Node.js 依赖
 */
export class OpenAPIDocumentParser {
  private parsedApi: OpenAPI.Document | null = null;
  private resourceCache = new Map<string, ResourceInfo[]>();
  private statisticsCache: ResourceStatistics | null = null;
  private documentUrl: string | null = null;

  /**
   * 解析 OpenAPI 文档
   * @param source 文档 URL 或文档对象
   */
  async parseDocument(source: string | OpenAPI.Document): Promise<void> {
    try {
      let apiDoc: OpenAPI.Document;

      if (typeof source === 'string') {
        // 存储文档URL用于后续拼接相对路径
        this.documentUrl = source;
        const response = await fetch(source);
        if (!response.ok) {
          throw new Error(`Failed to fetch OpenAPI document: ${response.statusText}`);
        }
        apiDoc = await response.json();
      } else {
        // 直接使用提供的文档对象时，无法获取URL
        this.documentUrl = null;
        apiDoc = source;
      }

      // 基本验证
      this.validateDocument(apiDoc);
      this.parsedApi = apiDoc;
      
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
   * 基本文档验证
   */
  private validateDocument(doc: any): void {
    if (!doc || typeof doc !== 'object') {
      throw new Error('Invalid OpenAPI document: must be an object');
    }

    if (!doc.info || !doc.info.title || !doc.info.version) {
      throw new Error('Invalid OpenAPI document: missing required info fields');
    }

    if (!doc.openapi && !doc.swagger) {
      throw new Error('Invalid OpenAPI document: missing version field');
    }

    if (!doc.paths || typeof doc.paths !== 'object') {
      throw new Error('Invalid OpenAPI document: missing or invalid paths');
    }
  }

  // ==================== 公共方法 ====================

  /**
   * 获取所有资源的 schema
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
    const resourceSchema = schemas[resourceName];
    if (!resourceSchema) {
      console.warn(`Resource schema for '${resourceName}' not found`);
      return null;
    }

    return resourceSchema;
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
      const servers = v3Doc.servers?.map(server => {
        let url = server.url;
        
        // 如果是相对路径，需要拼接文档的 host
        if (url.startsWith('/') && this.documentUrl) {
          try {
            const docUrl = new URL(this.documentUrl);
            url = `${docUrl.protocol}//${docUrl.host}${url}`;
          } catch (error) {
            console.warn('Failed to parse document URL for relative server path:', error);
            // 如果解析失败，使用当前页面的 origin 作为 fallback
            url = window.location.origin + url;
          }
        }
        
        return url;
      }) || [];
      
      return servers;
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
   * 获取所有资源信息
   */
  getAllResources(): ResourceInfo[] {
    return this.getResourceList();
  }

  /**
   * 获取顶级资源（没有父资源的资源）
   */
  getTopLevelResources(): ResourceInfo[] {
    const allResources = this.getResourceList();
    return allResources.filter(resource => 
      !allResources.some(other => 
        other.subResources.some(sub => sub.name === resource.name)
      )
    );
  }

  /**
   * 获取原始文档对象
   */
  getDocument(): OpenAPI.Document | null {
    return this.parsedApi;
  }

  // ==================== 私有方法 ====================

  /**
   * 获取资源列表（核心私有方法）
   * 只从列表端点（GET /resources）提取资源，符合 RESTful 约定
   */
  private getResourceList(): ResourceInfo[] {
    const cacheKey = 'all_resources';
    if (this.resourceCache.has(cacheKey)) {
      return this.resourceCache.get(cacheKey)!;
    }

    if (!this.parsedApi || !this.parsedApi.paths) {
      return [];
    }

    // 第一步：按资源链分组所有路径
    const resourceGroups = new Map<string, Array<{path: string, pathItem: any}>>();
    
    Object.entries(this.parsedApi.paths).forEach(([path, pathItem]) => {
      if (!pathItem) return;

      const resourceChain = this.extractResourceChainFromPath(path);
      if (resourceChain.length === 0) return;

      const resourceKey = resourceChain.join('.');
      if (!resourceGroups.has(resourceKey)) {
        resourceGroups.set(resourceKey, []);
      }
      resourceGroups.get(resourceKey)!.push({ path, pathItem });
    });

    // 第二步：只从列表端点创建资源
    const resourceMap = new Map<string, ResourceInfo>();
    
    resourceGroups.forEach((pathGroup, resourceKey) => {
      const resourceChain = resourceKey.split('.');
      const resourceName = resourceChain[resourceChain.length - 1];
      
      // 查找列表端点（GET /resources，不带 ID 参数）
      const listEndpoint = this.findListEndpoint(pathGroup);
      if (!listEndpoint) {
        console.warn(`No RESTful list endpoint found for resource: ${resourceName}`);
        return;
      }

      // 收集该资源的所有操作
      const allOperations: ResourceOperation[] = [];
      const tags = new Set<string>();
      
      pathGroup.forEach(({ path, pathItem }) => {
        const operations = this.extractOperationsFromPathItem(path, pathItem);
        operations.forEach(operation => {
          allOperations.push(operation);
          operation.tags.forEach(tag => tags.add(tag));
        });
      });

      // 既然找到了列表端点，该资源就是 RESTful 的
      const resource: ResourceInfo = {
        name: resourceName,
        pathPattern: this.buildResourcePathPattern(resourceName, pathGroup),
        basePath: this.extractResourceBasePath(resourceName, pathGroup),
        operations: allOperations,
        identifierField: this.extractResourceIdentifier(resourceName, pathGroup),
        isRESTful: true, // 有列表端点即为 RESTful
        tags: Array.from(tags),
        subResources: []
      };

      resourceMap.set(resourceKey, resource);
    });

    // 第三步：构建层级关系
    const resources = this.organizeResourceHierarchy(resourceMap);
    this.resourceCache.set(cacheKey, resources);
    
    return resources;
  }

  /**
   * 从路径中提取资源链
   * e.g., "/users/{id}/posts/{postId}/comments" -> ["users", "posts", "comments"]
   */
  private extractResourceChainFromPath(path: string): string[] {
    const segments = path.split('/').filter(Boolean);
    const resourceChain: string[] = [];

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

      resourceChain.push(segment);
    }

    return resourceChain;
  }

  /**
   * 查找列表端点（GET /resources，不带 ID 参数）
   */
  private findListEndpoint(pathGroup: Array<{path: string, pathItem: any}>): {path: string, pathItem: any} | null {
    return pathGroup.find(({ path, pathItem }) => {
      // 检查是否有 GET 操作
      if (!pathItem.get) return false;
      
      // 集合路径不应该以 ID 参数结尾
      // e.g., /users 是集合，/users/{id} 是单个项目
      const segments = path.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      
      // 如果最后一段是参数，这可能是单个项目的端点
      if (lastSegment && lastSegment.startsWith('{') && lastSegment.endsWith('}')) {
        return false;
      }
      
      return true;
    }) || null;
  }

  /**
   * 构建资源路径模式
   */
  private buildResourcePathPattern(resourceName: string, pathGroup: Array<{path: string, pathItem: any}>): string {
    // 选择最简单的路径作为模式
    const paths = pathGroup.map(p => p.path);
    return this.selectMainPath(paths);
  }

  /**
   * 提取资源基础路径
   */
  private extractResourceBasePath(resourceName: string, pathGroup: Array<{path: string, pathItem: any}>): string {
    // 查找集合路径（不带参数的路径）
    const collectionPath = pathGroup.find(({ path }) => {
      const segments = path.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      return !(lastSegment && lastSegment.startsWith('{') && lastSegment.endsWith('}'));
    });
    
    return collectionPath ? collectionPath.path : pathGroup[0].path;
  }

  /**
   * 选择主要路径（最简单的路径）
   */
  private selectMainPath(paths: string[]): string {
    if (paths.length === 1) return paths[0];
    
    // 按复杂度排序：优先选择段数较少和参数较少的路径
    return paths.sort((a, b) => {
      const aSegments = a.replace(/\{[^}]+\}/g, '').split('/').filter(Boolean);
      const bSegments = b.replace(/\{[^}]+\}/g, '').split('/').filter(Boolean);
      
      // 优先选择段数较少的
      if (aSegments.length !== bSegments.length) {
        return aSegments.length - bSegments.length;
      }
      
      // 优先选择无参数的路径
      const aHasParams = /\{/.test(a);
      const bHasParams = /\{/.test(b);
      
      if (aHasParams && !bHasParams) return 1;
      if (!aHasParams && bHasParams) return -1;
      
      // 字典序
      return a.localeCompare(b);
    })[0];
  }

  /**
   * 组织资源层级关系
   */
  private organizeResourceHierarchy(resourceMap: Map<string, ResourceInfo>): ResourceInfo[] {
    const rootResources: ResourceInfo[] = [];
    
    // 按深度排序以确保父资源先处理
    const sortedEntries = Array.from(resourceMap.entries()).sort((a, b) => {
      const aDepth = a[0].split('.').length;
      const bDepth = b[0].split('.').length;
      return aDepth - bDepth;
    });
    
    sortedEntries.forEach(([resourceKey, resource]) => {
      const keyParts = resourceKey.split('.');
      
      if (keyParts.length === 1) {
        // 顶级资源
        rootResources.push(resource);
      } else {
        // 查找父资源
        const parentKey = keyParts.slice(0, -1).join('.');
        const parentResource = resourceMap.get(parentKey);
        
        if (parentResource) {
          // 添加为子资源
          if (!parentResource.subResources.find(sub => sub.name === resource.name)) {
            parentResource.subResources.push(resource);
          }
        } else {
          // 找不到父资源，作为顶级资源处理
          rootResources.push(resource);
        }
      }
    });
    
    return rootResources;
  }
  /**
   * 从路径中提取资源名称（向后兼容）
   */
  private extractResourceNamesFromPath(path: string): string[] {
    return this.extractResourceChainFromPath(path);
  }

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
   * 构建路径模式（向后兼容）
   */
  private buildPathPattern(resourceName: string, originalPath: string): string {
    return originalPath;
  }

  /**
   * 提取基础路径（向后兼容）
   */
  private extractBasePath(resourceName: string, originalPath: string): string {
    const segments = originalPath.split('/');
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment && lastSegment.startsWith('{') && lastSegment.endsWith('}')) {
      return segments.slice(0, -1).join('/');
    }
    
    return originalPath;
  }

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

  private buildOperationInfo(
    method: string, 
    path: string, 
    operation: any,
    pathItem: any
  ): ResourceOperation {
    const pathParameters = pathItem.parameters || [];
    const operationParameters = operation.parameters || [];
    const allParameters = [...pathParameters, ...operationParameters];

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

  private normalizeParameters(parameters: any[]): OpenAPIV3.ParameterObject[] {
    return parameters.map(param => {
      if ('$ref' in param) {
        return param;
      }

      if ('in' in param && param.in === 'body') {
        return {
          name: param.name || 'body',
          in: 'query',
          required: param.required || false,
          schema: param.schema || { type: 'object' }
        };
      }

      return {
        name: param.name,
        in: param.in,
        description: param.description,
        required: param.required || false,
        schema: param.schema || { type: 'string' }
      };
    });
  }

  private normalizeRequestBody(operation: any): OpenAPIV3.RequestBodyObject | undefined {
    if (operation.requestBody) {
      return operation.requestBody;
    }

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

  private isRESTfulResource(resource: ResourceInfo): boolean {
    const methods = resource.operations.map(op => op.method);
    
    if (!methods.includes('GET')) {
      return false;
    }

    const hasCollectionOps = resource.operations.some(op => 
      !op.path.includes('{') && (op.method === 'GET' || op.method === 'POST')
    );
    
    const hasItemOps = resource.operations.some(op => 
      op.path.includes('{') && ['GET', 'PUT', 'PATCH', 'DELETE'].includes(op.method)
    );

    return hasCollectionOps || hasItemOps;
  }

  private extractResourceSchema(resource: ResourceInfo): OpenAPIV3.SchemaObject | null {
    const getOperation = resource.operations.find(op => op.method === 'GET');
    if (!getOperation) {
      console.warn(`No GET operation found for resource: ${resource.name}`);
      return null;
    }

    const responseSchema = this.extractSchemaFromResponse(getOperation.responses);
    if (!responseSchema) {
      console.warn(`No response schema found for GET operation of resource: ${resource.name}`);
      return null;
    }

    // 解析响应schema获取资源对象schema
    const resourceSchema = this.resolveResourceSchemaFromResponse(responseSchema);
    if (!resourceSchema) {
      return null;
    }

    // 递归解析所有引用，确保返回完整的schema
    return this.fullyResolveSchema(resourceSchema);
  }

  private extractSchemaFromResponse(responses: OpenAPIV3.ResponsesObject): OpenAPIV3.SchemaObject | null {
    const successResponse = responses['200'] || responses['201'] || responses['default'];
    if (!successResponse || typeof successResponse === 'string') {
      return null;
    }

    const response = successResponse as OpenAPIV3.ResponseObject;
    if (!response.content) {
      return null;
    }

    const jsonContent = response.content['application/json'] || 
                       response.content['application/vnd.api+json'] ||
                       Object.values(response.content)[0];

    if (!jsonContent || !jsonContent.schema) {
      return null;
    }

    let schema = jsonContent.schema as OpenAPIV3.SchemaObject;

    if (schema.type === 'array' && schema.items) {
      schema = schema.items as OpenAPIV3.SchemaObject;
    }

    if (schema.type === 'object' && schema.properties) {
      if (schema.properties.data) {
        const dataSchema = schema.properties.data as OpenAPIV3.SchemaObject;
        if (dataSchema.type === 'array' && dataSchema.items) {
          return dataSchema.items as OpenAPIV3.SchemaObject;
        } else if (dataSchema.type === 'object') {
          return dataSchema;
        }
      }
      
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
   * 从响应schema中解析出资源对象的schema
   * 处理两种情况：
   * 1. 直接返回对象数组：{ type: 'array', items: ResourceSchema }
   * 2. 包装在对象中：{ type: 'object', properties: { data: { type: 'array', items: ResourceSchema } } }
   */
  private resolveResourceSchemaFromResponse(responseSchema: OpenAPIV3.SchemaObject): OpenAPIV3.SchemaObject | null {
    // 首先解引用
    const resolvedSchema = this.resolveSchemaReference(responseSchema);
    if (!resolvedSchema) {
      return null;
    }

    // 情况1: 直接是数组类型
    if (resolvedSchema.type === 'array' && resolvedSchema.items) {
      const itemSchema = this.resolveSchemaReference(resolvedSchema.items as OpenAPIV3.SchemaObject);
      return itemSchema;
    }

    // 情况2: 对象包装的数组
    if (resolvedSchema.type === 'object' && resolvedSchema.properties) {
      // 尝试常见的包装字段名
      const wrapperFields = ['data', 'items', 'list', 'results', 'content', 'records'];
      
      for (const fieldName of wrapperFields) {
        const fieldSchema = resolvedSchema.properties[fieldName];
        if (fieldSchema) {
          const resolvedFieldSchema = this.resolveSchemaReference(fieldSchema as OpenAPIV3.SchemaObject);
          if (resolvedFieldSchema) {
            // 如果包装字段是数组
            if (resolvedFieldSchema.type === 'array' && resolvedFieldSchema.items) {
              const itemSchema = this.resolveSchemaReference(resolvedFieldSchema.items as OpenAPIV3.SchemaObject);
              return itemSchema;
            }
            // 如果包装字段直接是对象（单个资源的情况）
            if (resolvedFieldSchema.type === 'object') {
              return resolvedFieldSchema;
            }
          }
        }
      }

      // 如果没有找到明显的包装字段，检查是否有唯一的数组类型属性
      const arrayProperties = Object.entries(resolvedSchema.properties).filter(([_, propSchema]) => {
        const resolved = this.resolveSchemaReference(propSchema as OpenAPIV3.SchemaObject);
        return resolved && resolved.type === 'array';
      });

      if (arrayProperties.length === 1) {
        const [_, arrayPropSchema] = arrayProperties[0];
        const resolvedArraySchema = this.resolveSchemaReference(arrayPropSchema as OpenAPIV3.SchemaObject);
        if (resolvedArraySchema && resolvedArraySchema.type === 'array' && resolvedArraySchema.items) {
          const itemSchema = this.resolveSchemaReference(resolvedArraySchema.items as OpenAPIV3.SchemaObject);
          return itemSchema;
        }
      }
    }

    // 如果都不匹配，返回原始schema（可能本身就是资源对象）
    return resolvedSchema;
  }

  /**
   * 解析schema引用
   * 递归解析 $ref 引用，返回实际的schema对象
   */
  private resolveSchemaReference(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): OpenAPIV3.SchemaObject | null {
    if (!schema) {
      return null;
    }

    // 如果是引用对象
    if ('$ref' in schema) {
      const refPath = schema.$ref;
      return this.resolveRef(refPath);
    }

    // 如果是allOf, anyOf, oneOf，选择第一个有效的schema
    if (schema.allOf && schema.allOf.length > 0) {
      for (const subSchema of schema.allOf) {
        const resolved = this.resolveSchemaReference(subSchema);
        if (resolved) {
          // 如果有多个allOf，应该合并它们，这里简化处理
          return resolved;
        }
      }
    }

    if (schema.anyOf && schema.anyOf.length > 0) {
      const resolved = this.resolveSchemaReference(schema.anyOf[0]);
      return resolved;
    }

    if (schema.oneOf && schema.oneOf.length > 0) {
      const resolved = this.resolveSchemaReference(schema.oneOf[0]);
      return resolved;
    }

    // 直接返回schema对象
    return schema as OpenAPIV3.SchemaObject;
  }

  /**
   * 解析引用路径，从文档中获取实际的schema
   */
  private resolveRef(refPath: string): OpenAPIV3.SchemaObject | null {
    if (!this.parsedApi || !refPath.startsWith('#/')) {
      return null;
    }

    try {
      // 移除开头的 '#/' 并按 '/' 分割路径
      const pathParts = refPath.substring(2).split('/');
      let current: any = this.parsedApi;

      // 遍历路径获取目标对象
      for (const part of pathParts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          console.warn(`Cannot resolve reference path: ${refPath}`);
          return null;
        }
      }

      // 如果解析的结果还是引用，递归解析
      if (current && typeof current === 'object' && '$ref' in current) {
        return this.resolveRef(current.$ref);
      }

      return current as OpenAPIV3.SchemaObject;
    } catch (error) {
      console.warn(`Error resolving reference ${refPath}:`, error);
      return null;
    }
  }

  private getOpenAPIVersion(): string {
    if (!this.parsedApi) return 'unknown';
    
    if ('openapi' in this.parsedApi) {
      return this.parsedApi.openapi;
    } else if ('swagger' in this.parsedApi) {
      return this.parsedApi.swagger;
    }
    
    return 'unknown';
  }

  private isV3(): boolean {
    return this.getOpenAPIVersion().startsWith('3.');
  }

  /**
   * 递归解析schema中的所有引用
   * 确保返回的schema是完全展开的，不包含任何$ref引用
   */
  private fullyResolveSchema(
    schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, 
    visitedRefs: Set<string> = new Set()
  ): OpenAPIV3.SchemaObject {
    // 检查循环引用
    if ('$ref' in schema && visitedRefs.has(schema.$ref)) {
      console.warn(`Circular reference detected: ${schema.$ref}. Using generic object schema.`);
      return { type: 'object', properties: {} };
    }

    // 首先解析顶层引用
    const resolvedSchema = this.resolveSchemaReference(schema);
    if (!resolvedSchema) {
      // 如果解析失败，返回通用object schema
      return { type: 'object', properties: {} };
    }

    // 如果原始schema是引用，添加到访问集合中
    if ('$ref' in schema) {
      visitedRefs.add(schema.$ref);
    }

    // 深度复制schema避免修改原始对象
    const result: any = JSON.parse(JSON.stringify(resolvedSchema));

    try {
      // 递归解析properties中的引用
      if (result.properties) {
        const resolvedProperties: Record<string, OpenAPIV3.SchemaObject> = {};
        
        for (const [propName, propSchema] of Object.entries(result.properties)) {
          resolvedProperties[propName] = this.fullyResolveSchema(
            propSchema as OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, 
            new Set(visitedRefs)
          );
        }
        
        result.properties = resolvedProperties;
      }

      // 递归解析items中的引用（用于数组类型）
      if (result.type === 'array' && result.items) {
        result.items = this.fullyResolveSchema(
          result.items as OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, 
          new Set(visitedRefs)
        );
      }

      // 递归解析additionalProperties中的引用
      if (result.additionalProperties && typeof result.additionalProperties === 'object') {
        result.additionalProperties = this.fullyResolveSchema(
          result.additionalProperties as OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, 
          new Set(visitedRefs)
        );
      }

      // 处理allOf, anyOf, oneOf中的引用
      if (result.allOf) {
        result.allOf = result.allOf.map((subSchema: any) => 
          this.fullyResolveSchema(
            subSchema as OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, 
            new Set(visitedRefs)
          )
        );
      }

      if (result.anyOf) {
        result.anyOf = result.anyOf.map((subSchema: any) => 
          this.fullyResolveSchema(
            subSchema as OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, 
            new Set(visitedRefs)
          )
        );
      }

      if (result.oneOf) {
        result.oneOf = result.oneOf.map((subSchema: any) => 
          this.fullyResolveSchema(
            subSchema as OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, 
            new Set(visitedRefs)
          )
        );
      }
    } catch (error) {
      console.warn(`Error while fully resolving schema:`, error);
      // 发生错误时返回安全的fallback
      return { type: 'object', properties: {} };
    }

    // 确保返回的schema至少有基本的type
    if (!result.type && !result.allOf && !result.anyOf && !result.oneOf) {
      result.type = 'object';
      if (!result.properties) {
        result.properties = {};
      }
    }

    return result as OpenAPIV3.SchemaObject;
  }

  /**
   * 提取资源的标识符字段
   * 从路径参数中分析出资源的唯一标识符
   * 处理特殊情况：如 bookName -> name, userId -> id 等
   */
  private extractResourceIdentifier(resourceName: string, pathGroup: Array<{path: string, pathItem: any}>): string {
    const identifierCandidates = new Set<string>();
    
    // 遍历所有路径，收集可能的标识符
    pathGroup.forEach(({ path, pathItem }) => {
      const segments = path.split('/').filter(Boolean);
      
      // 查找路径参数 (形如 {id}, {userId}, {bookName} 等)
      segments.forEach(segment => {
        if (segment.startsWith('{') && segment.endsWith('}')) {
          const paramName = segment.slice(1, -1); // 移除大括号
          identifierCandidates.add(paramName);
        }
      });
      
      // 从 pathItem 的参数中提取
      const allParameters = [
        ...(pathItem.parameters || []),
        ...Object.values(pathItem).flatMap((operation: any) => operation?.parameters || [])
      ];
      
      allParameters.forEach((param: any) => {
        if (param && param.in === 'path' && param.name) {
          identifierCandidates.add(param.name);
        }
      });
    });
    
    if (identifierCandidates.size === 0) {
      return 'id'; // 默认标识符
    }
    
    // 转换为数组并按优先级排序
    const candidates = Array.from(identifierCandidates);
    
    // 查找最合适的标识符
    const bestIdentifier = this.selectBestIdentifier(resourceName, candidates);
    
    // 将复合标识符转换为简单字段名
    return this.normalizeIdentifierField(resourceName, bestIdentifier);
  }
  
  /**
   * 选择最佳的标识符
   * 优先级：直接匹配 > 资源名+Id > 资源名+其他后缀 > 通用id
   */
  private selectBestIdentifier(resourceName: string, candidates: string[]): string {
    const resourceNameLower = resourceName.toLowerCase();
    const resourceNameSingular = this.getSingularForm(resourceNameLower);
    
    // 1. 直接匹配：id
    if (candidates.includes('id')) {
      return 'id';
    }
    
    // 2. 资源名 + Id：userId, bookId 等
    const resourceIdPattern = new RegExp(`^${resourceNameSingular}Id$`, 'i');
    const resourceIdMatch = candidates.find(c => resourceIdPattern.test(c));
    if (resourceIdMatch) {
      return resourceIdMatch;
    }
    
    // 3. 资源名 + 其他常见后缀：userName, bookName, userCode 等
    const resourceFieldPattern = new RegExp(`^${resourceNameSingular}(Name|Code|Key|Identifier)$`, 'i');
    const resourceFieldMatch = candidates.find(c => resourceFieldPattern.test(c));
    if (resourceFieldMatch) {
      return resourceFieldMatch;
    }
    
    // 4. 包含资源名的任何参数
    const containsResourceName = candidates.find(c => 
      c.toLowerCase().includes(resourceNameSingular)
    );
    if (containsResourceName) {
      return containsResourceName;
    }
    
    // 5. 常见的标识符名称
    const commonIdentifiers = ['uuid', 'guid', 'key', 'identifier', 'code', 'name'];
    const commonMatch = candidates.find(c => 
      commonIdentifiers.some(common => c.toLowerCase().includes(common))
    );
    if (commonMatch) {
      return commonMatch;
    }
    
    // 6. 返回第一个候选项
    return candidates[0] || 'id';
  }
  
  /**
   * 将标识符字段规范化为简单的字段名
   * 例如：bookName -> name, userId -> id, bookId -> id
   */
  private normalizeIdentifierField(resourceName: string, identifierParam: string): string {
    const resourceNameSingular = this.getSingularForm(resourceName.toLowerCase());
    const identifierLower = identifierParam.toLowerCase();
    
    // 如果就是 id，直接返回
    if (identifierLower === 'id') {
      return 'id';
    }
    
    // 移除资源名前缀，获取实际字段名
    // 例如：bookName -> name, userId -> id, bookCode -> code
    const resourcePrefix = resourceNameSingular;
    if (identifierLower.startsWith(resourcePrefix)) {
      const fieldName = identifierParam.substring(resourcePrefix.length);
      
      // 如果剩余部分是常见的标识符后缀，进行转换
      const normalizedField = this.normalizeFieldName(fieldName);
      return normalizedField;
    }
    
    // 如果不以资源名开头，检查是否以资源名结尾
    // 例如：nameOfBook -> name
    if (identifierLower.endsWith(resourcePrefix)) {
      const fieldName = identifierParam.substring(0, identifierParam.length - resourcePrefix.length);
      return this.normalizeFieldName(fieldName) || identifierParam;
    }
    
    // 直接返回原始字段名
    return identifierParam;
  }
  
  /**
   * 标准化字段名
   */
  private normalizeFieldName(fieldName: string): string {
    const fieldLower = fieldName.toLowerCase();
    
    // 常见的标识符字段映射
    const fieldMappings: Record<string, string> = {
      'id': 'id',
      'identifier': 'id',
      'key': 'id',
      'uuid': 'id',
      'guid': 'id',
      'name': 'name',
      'title': 'name',
      'code': 'code',
      'number': 'number',
      'num': 'number'
    };
    
    return fieldMappings[fieldLower] || fieldName;
  }
  
  /**
   * 获取单数形式（简单实现）
   */
  private getSingularForm(pluralName: string): string {
    const name = pluralName.toLowerCase();
    
    // 常见复数形式转换
    if (name.endsWith('ies')) {
      return name.slice(0, -3) + 'y'; // categories -> category
    }
    if (name.endsWith('es')) {
      return name.slice(0, -2); // boxes -> box
    }
    if (name.endsWith('s') && !name.endsWith('ss')) {
      return name.slice(0, -1); // users -> user
    }
    
    return name;
  }
}
