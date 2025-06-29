import type {
  OpenAPISpec,
  OpenAPIAnalysis,
  ParsedResource,
  FieldDefinition,
  OperationInfo,
  FieldType,
} from "~/types/openapi";

/**
 * OpenAPI 文档解析服务
 * 负责解析 OpenAPI/Swagger 文档并提取资源信息
 *
 * 注意：由于 swagger-parser 在浏览器环境中的兼容性问题，
 * 这里先实现一个简化版本的解析器，专注于常见的 OpenAPI 结构
 */
export class OpenAPIParserService {
  private cache = new Map<string, OpenAPIAnalysis>();

  /**
   * 解析 OpenAPI 文档
   */
  async parseOpenAPI(apiId: string, url: string): Promise<OpenAPIAnalysis> {
    try {
      // 检查缓存
      if (this.cache.has(apiId)) {
        return this.cache.get(apiId)!;
      }

      console.log(`开始解析 OpenAPI 文档: ${url}`);

      // 直接获取 JSON 文档
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch OpenAPI document: ${response.statusText}`
        );
      }

      const api = (await response.json()) as OpenAPISpec;

      // 提取基本信息
      const baseUrl = this.extractBaseUrl(api);
      const servers = this.extractServers(api);

      // 解析资源
      const resources = this.parseResources(api, baseUrl);

      // 统计信息
      const totalPaths = Object.keys(api.paths).length;
      const totalOperations = this.countOperations(api.paths);
      const restfulApis = this.countRESTfulAPIs(resources);
      const tags = this.extractTags(api);

      const analysis: OpenAPIAnalysis = {
        id: apiId,
        title: api.info.title,
        version: api.info.version,
        description: api.info.description,
        base_url: baseUrl,
        servers,
        resources,
        total_paths: totalPaths,
        total_operations: totalOperations,
        restful_apis: restfulApis,
        tags,
        last_parsed: new Date().toISOString(),
      };

      // 缓存结果
      this.cache.set(apiId, analysis);

      console.log(
        `解析完成: ${analysis.title}, 共发现 ${resources.length} 个资源`
      );
      console.log(
        "资源列表:",
        resources.map((r) => ({
          id: r.id,
          name: r.name,
          displayName: r.displayName,
          path: r.path,
        }))
      );
      return analysis;
    } catch (error) {
      console.error("解析 OpenAPI 文档失败:", error);
      throw new Error(
        `Failed to parse OpenAPI document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * 提取基础URL
   */
  private extractBaseUrl(api: OpenAPISpec): string {
    // OpenAPI 3.x
    if (api.servers && api.servers.length > 0) {
      return api.servers[0].url;
    }

    // Swagger 2.0
    if (api.swagger) {
      const host = (api as any).host || "localhost";
      const basePath = (api as any).basePath || "";
      const schemes = (api as any).schemes || ["http"];
      return `${schemes[0]}://${host}${basePath}`;
    }

    return "";
  }

  /**
   * 提取所有服务器地址
   */
  private extractServers(api: OpenAPISpec): string[] {
    if (api.servers) {
      return api.servers.map((server) => server.url);
    }

    if (api.swagger) {
      const host = (api as any).host || "localhost";
      const basePath = (api as any).basePath || "";
      const schemes = (api as any).schemes || ["http"];
      return schemes.map((scheme: string) => `${scheme}://${host}${basePath}`);
    }

    return [];
  }

  /**
   * 解析资源
   */
  private parseResources(api: OpenAPISpec, baseUrl: string): ParsedResource[] {
    const resources = new Map<string, ParsedResource>();
    const pathsByResource = new Map<string, string[]>();

    // 首先收集所有路径并按完整资源链分组
    Object.keys(api.paths).forEach((path) => {
      const resourceInfo = this.extractResourceInfo(path);

      if (resourceInfo.resourceChain && resourceInfo.resourceChain.length > 0) {
        // 使用完整的资源链作为键
        const resourceKey = resourceInfo.resourceChain.join(".");

        if (!pathsByResource.has(resourceKey)) {
          pathsByResource.set(resourceKey, []);
        }
        pathsByResource.get(resourceKey)!.push(path);
      }
    });

    // 创建所有资源
    pathsByResource.forEach((paths, resourceKey) => {
      const resourceChain = resourceKey.split(".");
      const resourceName = resourceChain[resourceChain.length - 1];
      const parentResourceName =
        resourceChain.length > 1
          ? resourceChain[resourceChain.length - 2]
          : null;

      const resource: ParsedResource = {
        id: resourceKey,
        name: resourceName,
        displayName: this.generateDisplayName(resourceName),
        path: paths[0], // 使用第一个路径作为主路径
        basePath: baseUrl + paths[0],
        methods: [],
        schema: [],
        operations: {},
        is_restful: false,
        resource_type: "custom",
        tags: [],
        sub_resources: [],
        parent_resource: parentResourceName || undefined,
      };

      resources.set(resourceKey, resource);
    });

    // 解析每个资源的操作
    Object.entries(api.paths).forEach(([path, pathItem]) => {
      if (!pathItem || typeof pathItem !== "object") return;

      const resourceInfo = this.extractResourceInfo(path);
      const resourceKey = resourceInfo.resourceChain
        ? resourceInfo.resourceChain.join(".")
        : resourceInfo.resourceName;

      const resource = resources.get(resourceKey);
      if (!resource) return;

      // 解析操作
      const methods = [
        "get",
        "post",
        "put",
        "patch",
        "delete",
        "options",
        "head",
      ];
      methods.forEach((method) => {
        const operation = pathItem[method];
        if (operation) {
          resource.methods.push(method.toUpperCase());
          resource.operations[method] = this.parseOperation(operation);

          // 提取标签
          if (operation.tags) {
            resource.tags = [
              ...new Set([...resource.tags!, ...operation.tags]),
            ];
          }
        }
      });

      // 判断资源类型
      resource.resource_type = this.determineResourceType(resource.methods);
      resource.is_restful = this.isRESTfulResource(resource.methods);

      // 解析 schema
      resource.schema = this.extractSchema(api, pathItem, resource.operations);
    });

    // 构建嵌套关系（支持任意深度）
    const rootResources: ParsedResource[] = [];
    const allResources = Array.from(resources.values());

    // 先按层级深度排序，确保父资源在子资源之前处理
    allResources.sort((a, b) => {
      const aDepth = a.id.split(".").length;
      const bDepth = b.id.split(".").length;
      return aDepth - bDepth;
    });

    allResources.forEach((resource) => {
      const resourceChain = resource.id.split(".");

      if (resourceChain.length === 1) {
        // 顶级资源
        rootResources.push(resource);
      } else {
        // 嵌套资源：寻找直接父资源
        const parentChain = resourceChain.slice(0, -1);
        const parentKey = parentChain.join(".");
        const parentResource = resources.get(parentKey);

        if (parentResource) {
          if (!parentResource.sub_resources) {
            parentResource.sub_resources = [];
          }
          parentResource.sub_resources.push(resource);
        } else {
          // 如果找不到直接父资源，尝试寻找最近的祖先资源
          let ancestorFound = false;
          for (let i = parentChain.length - 1; i >= 0; i--) {
            const ancestorKey = parentChain.slice(0, i + 1).join(".");
            const ancestorResource = resources.get(ancestorKey);
            if (ancestorResource) {
              if (!ancestorResource.sub_resources) {
                ancestorResource.sub_resources = [];
              }
              ancestorResource.sub_resources.push(resource);
              ancestorFound = true;
              break;
            }
          }

          // 如果找不到任何祖先资源，当作顶级资源处理
          if (!ancestorFound) {
            rootResources.push(resource);
          }
        }
      }
    });

    return rootResources;
  }

  /**
   * 提取资源信息，支持无限级嵌套
   */
  private extractResourceInfo(path: string): {
    resourceName: string;
    parentResource?: string;
    resourceChain?: string[]; // 完整的资源链
  } {
    // 移除参数部分 {id}, :id 等
    const cleanPath = path.replace(/[{:][^}/:]+[}]?/g, "");

    // 分割路径并过滤空段
    const segments = cleanPath.split("/").filter(Boolean);

    if (segments.length === 0)
      return { resourceName: "root", resourceChain: ["root"] };

    // 特殊处理：某些端点虽然看起来像操作，但实际上是资源
    const operationSegments = [
      "actions",
      "status",
      "health",
      "metrics",
      "search",
    ];

    let resourceName = segments[segments.length - 1];
    let resourceChain: string[] = [];
    let parentResource: string | undefined;

    // 检查最后一段是否为操作端点
    if (operationSegments.includes(resourceName.toLowerCase())) {
      if (segments.length >= 2) {
        resourceName = segments[segments.length - 2];
        resourceChain = segments.slice(0, -1); // 排除操作端点
      } else {
        resourceChain = [resourceName];
      }
    } else {
      // 正常情况：所有段都是资源名
      resourceChain = segments;
    }

    // 确定父资源
    if (resourceChain.length > 1) {
      parentResource = resourceChain[resourceChain.length - 2];
    }

    return {
      resourceName,
      parentResource,
      resourceChain,
    };
  }

  /**
   * 提取资源名称（保留原方法用于向后兼容）
   */
  private extractResourceName(path: string): string {
    return this.extractResourceInfo(path).resourceName;
  }

  /**
   * 生成资源ID
   */
  private generateResourceId(resourceName: string, path: string): string {
    // 简单的资源ID生成策略
    return resourceName.toLowerCase();
  }

  /**
   * 生成显示名称
   */
  private generateDisplayName(resourceName: string): string {
    return resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  }

  /**
   * 解析操作信息
   */
  private parseOperation(operation: any): OperationInfo {
    return {
      operationId: operation.operationId,
      summary: operation.summary,
      description: operation.description,
      parameters: operation.parameters || [],
      requestBody: operation.requestBody,
      responses: operation.responses || {},
      tags: operation.tags || [],
    };
  }

  /**
   * 确定资源类型
   */
  private determineResourceType(
    methods: string[]
  ): "full_crud" | "read_only" | "custom" {
    const methodSet = new Set(methods.map((m) => m.toLowerCase()));

    if (
      methodSet.has("get") &&
      methodSet.has("post") &&
      methodSet.has("put") &&
      methodSet.has("delete")
    ) {
      return "full_crud";
    }

    if (methodSet.has("get") && methodSet.size === 1) {
      return "read_only";
    }

    return "custom";
  }

  /**
   * 判断是否为RESTful资源
   */
  private isRESTfulResource(methods: string[]): boolean {
    const methodSet = new Set(methods.map((m) => m.toLowerCase()));
    const restfulMethods = ["get", "post", "put", "delete"];

    return restfulMethods.some((method) => methodSet.has(method));
  }

  /**
   * 提取字段定义
   */
  private extractSchema(
    api: OpenAPISpec,
    pathItem: any,
    operations: Record<string, OperationInfo>
  ): FieldDefinition[] {
    const fields: FieldDefinition[] = [];
    const processedSchemas = new Set<string>();

    // 从各种操作中提取 schema
    Object.values(operations).forEach((operation) => {
      // 从响应中提取
      Object.values(operation.responses || {}).forEach((response: any) => {
        if (response.content) {
          Object.values(response.content).forEach((content: any) => {
            if (content.schema) {
              const extracted = this.extractFieldsFromSchema(
                content.schema,
                api
              );
              extracted.forEach((field) => {
                if (!processedSchemas.has(field.name)) {
                  fields.push(field);
                  processedSchemas.add(field.name);
                }
              });
            }
          });
        }
      });

      // 从请求体中提取
      if (operation.requestBody?.content) {
        Object.values(operation.requestBody.content).forEach((content: any) => {
          if (content.schema) {
            const extracted = this.extractFieldsFromSchema(content.schema, api);
            extracted.forEach((field) => {
              if (!processedSchemas.has(field.name)) {
                fields.push(field);
                processedSchemas.add(field.name);
              }
            });
          }
        });
      }
    });

    return fields;
  }

  /**
   * 从 schema 对象中提取字段
   */
  private extractFieldsFromSchema(
    schema: any,
    api: OpenAPISpec,
    required: string[] = []
  ): FieldDefinition[] {
    const fields: FieldDefinition[] = [];

    if (!schema) return fields;

    // 处理引用
    if (schema.$ref) {
      const resolvedSchema = this.resolveReference(schema.$ref, api);
      if (resolvedSchema) {
        return this.extractFieldsFromSchema(resolvedSchema, api, required);
      }
    }

    // 处理对象类型
    if (schema.type === "object" && schema.properties) {
      const requiredFields = schema.required || required;

      Object.entries(schema.properties).forEach(
        ([fieldName, fieldSchema]: [string, any]) => {
          const field: FieldDefinition = {
            name: fieldName,
            type: this.mapSchemaTypeToFieldType(fieldSchema),
            format: fieldSchema.format,
            description: fieldSchema.description,
            required: requiredFields.includes(fieldName),
            example: fieldSchema.example,
          };

          // 处理枚举
          if (fieldSchema.enum) {
            field.enum = fieldSchema.enum;
          }

          // 处理数组类型
          if (fieldSchema.type === "array" && fieldSchema.items) {
            field.items = {
              name: "item",
              type: this.mapSchemaTypeToFieldType(fieldSchema.items),
              required: false,
            };
          }

          // 处理嵌套对象
          if (fieldSchema.type === "object" && fieldSchema.properties) {
            field.properties = {};
            const nestedFields = this.extractFieldsFromSchema(fieldSchema, api);
            nestedFields.forEach((nestedField) => {
              field.properties![nestedField.name] = nestedField;
            });
          }

          fields.push(field);
        }
      );
    }

    return fields;
  }

  /**
   * 解析引用
   */
  private resolveReference(ref: string, api: OpenAPISpec): any {
    const path = ref.replace("#/", "").split("/");
    let current: any = api;

    for (const segment of path) {
      if (current && typeof current === "object" && segment in current) {
        current = current[segment];
      } else {
        return null;
      }
    }

    return current;
  }

  /**
   * 映射 schema 类型到字段类型
   */
  private mapSchemaTypeToFieldType(schema: any): FieldType {
    if (!schema) return "string";

    const type = schema.type;
    const format = schema.format;

    switch (type) {
      case "integer":
        return "integer";
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "array":
        return "array";
      case "object":
        return "object";
      case "string":
        if (format === "date") return "date";
        if (format === "date-time") return "datetime";
        if (format === "email") return "email";
        if (format === "uri" || format === "url") return "url";
        return "string";
      default:
        return "string";
    }
  }

  /**
   * 统计操作数量
   */
  private countOperations(paths: Record<string, any>): number {
    let count = 0;
    Object.values(paths).forEach((pathItem) => {
      if (pathItem && typeof pathItem === "object") {
        const methods = [
          "get",
          "post",
          "put",
          "patch",
          "delete",
          "options",
          "head",
        ];
        methods.forEach((method) => {
          if (pathItem[method]) count++;
        });
      }
    });
    return count;
  }

  /**
   * 统计RESTful API数量
   */
  private countRESTfulAPIs(resources: ParsedResource[]): number {
    return resources.filter((r) => r.is_restful).length;
  }

  /**
   * 提取所有标签
   */
  private extractTags(api: OpenAPISpec): string[] {
    const tags = new Set<string>();

    // 从全局标签定义中提取
    if ((api as any).tags) {
      (api as any).tags.forEach((tag: any) => {
        if (tag.name) tags.add(tag.name);
      });
    }

    // 从路径操作中提取
    Object.values(api.paths).forEach((pathItem) => {
      if (pathItem && typeof pathItem === "object") {
        const methods = [
          "get",
          "post",
          "put",
          "patch",
          "delete",
          "options",
          "head",
        ];
        methods.forEach((method) => {
          const operation = pathItem[method];
          if (operation?.tags) {
            operation.tags.forEach((tag: string) => tags.add(tag));
          }
        });
      }
    });

    return Array.from(tags);
  }

  /**
   * 清除缓存
   */
  clearCache(apiId?: string): void {
    if (apiId) {
      this.cache.delete(apiId);
    } else {
      this.cache.clear();
    }
  }
}

// 导出单例实例
export const openAPIParser = new OpenAPIParserService();
