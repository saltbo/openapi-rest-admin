/**
 * OpenAPI Document Parser Service
 * 
 * Core responsibilities:
 * - Parse OpenAPI/Swagger documents
 * - Extract and normalize API schema information
 * - Convert OpenAPI paths to structured resource definitions
 * - Handle references resolution and schema mapping
 * 
 * This is a pure parsing service with no state management or business logic.
 */

import type {
  OpenAPISpec,
  OpenAPIAnalysis,
  ParsedResource,
  FieldDefinition,
  OperationInfo,
  FieldType,
} from "~/types/openapi";

export interface ParsedPath {
  path: string;
  resourceChain: string[];
  operations: Record<string, any>;
  schemas: FieldDefinition[];
}

export interface ParseOptions {
  /** Whether to include sub-resources in parsing */
  includeSubResources?: boolean;
  /** Maximum nesting depth for sub-resources */
  maxDepth?: number;
  /** Custom resource name extraction function */
  resourceNameExtractor?: (path: string) => string[];
}

/**
 * Pure OpenAPI document parser
 * Converts OpenAPI specs into normalized resource structures
 */
export class OpenAPIParser {
  private static readonly DEFAULT_OPTIONS: Required<ParseOptions> = {
    includeSubResources: true,
    maxDepth: 5,
    resourceNameExtractor: (path: string) => OpenAPIParser.extractResourceChain(path),
  };

  /**
   * Parse an OpenAPI document from URL or object
   */
  static async parseDocument(
    source: string | OpenAPISpec,
    options: ParseOptions = {}
  ): Promise<OpenAPIAnalysis> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    let spec: OpenAPISpec;
    
    if (typeof source === 'string') {
      spec = await this.fetchSpec(source);
    } else {
      spec = source;
    }

    return this.parseSpec(spec, opts);
  }

  /**
   * Parse OpenAPI spec object into analysis result
   */
  static parseSpec(spec: OpenAPISpec, options: ParseOptions = {}): OpenAPIAnalysis {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    const baseInfo = this.extractBaseInfo(spec);
    const parsedPaths = this.parsePaths(spec, opts);
    const resources = this.buildResourceHierarchy(parsedPaths, opts);
    const stats = this.calculateStats(spec, resources);
    
    return {
      id: '', // Will be set by the calling service
      ...baseInfo,
      resources,
      ...stats,
      last_parsed: new Date().toISOString(),
    };
  }

  /**
   * Extract basic information from OpenAPI spec
   */
  private static extractBaseInfo(spec: OpenAPISpec) {
    const servers = this.extractServers(spec);
    const baseUrl = servers[0] || '';
    
    return {
      title: spec.info.title,
      version: spec.info.version,
      description: spec.info.description,
      base_url: baseUrl,
      servers,
      tags: this.extractAllTags(spec),
    };
  }

  /**
   * Parse all paths in the OpenAPI spec
   */
  private static parsePaths(spec: OpenAPISpec, options: ParseOptions): Map<string, ParsedPath> {
    const pathMap = new Map<string, ParsedPath>();
    
    Object.entries(spec.paths).forEach(([pathString, pathItem]) => {
      if (!pathItem || typeof pathItem !== 'object') return;
      
      const resourceChain = options.resourceNameExtractor!(pathString);
      if (resourceChain.length === 0) return;
      
      // Check depth limit
      if (resourceChain.length > options.maxDepth!) return;
      
      const operations = this.extractOperations(pathItem);
      const schemas = this.extractSchemasFromPath(pathItem, spec);
      
      pathMap.set(pathString, {
        path: pathString,
        resourceChain,
        operations,
        schemas,
      });
    });
    
    return pathMap;
  }

  /**
   * Build hierarchical resource structure from parsed paths
   */
  private static buildResourceHierarchy(
    pathMap: Map<string, ParsedPath>,
    options: ParseOptions
  ): ParsedResource[] {
    // Group paths by resource chain
    const resourceGroups = new Map<string, ParsedPath[]>();
    
    pathMap.forEach((parsedPath) => {
      const resourceKey = parsedPath.resourceChain.join('.');
      if (!resourceGroups.has(resourceKey)) {
        resourceGroups.set(resourceKey, []);
      }
      resourceGroups.get(resourceKey)!.push(parsedPath);
    });
    
    // Create resource objects
    const allResources = new Map<string, ParsedResource>();
    
    resourceGroups.forEach((paths, resourceKey) => {
      const resourceChain = resourceKey.split('.');
      const resourceName = resourceChain[resourceChain.length - 1];
      const parentResourceName = resourceChain.length > 1 
        ? resourceChain.slice(0, -1).join('.')
        : undefined;
      
      const resource = this.createResource(resourceKey, resourceName, paths, parentResourceName);
      allResources.set(resourceKey, resource);
    });
    
    // Build hierarchy
    return this.organizeResourceHierarchy(allResources, options);
  }

  /**
   * Create a single resource from grouped paths
   */
  private static createResource(
    id: string,
    name: string,
    paths: ParsedPath[],
    parentId?: string
  ): ParsedResource {
    // Select the main path (simplest one)
    const mainPath = this.selectMainPath(paths.map(p => p.path));
    
    // Merge operations from all paths
    const operations: Record<string, OperationInfo> = {};
    const methods: string[] = [];
    const allSchemas: FieldDefinition[] = [];
    const tags = new Set<string>();
    
    paths.forEach(parsedPath => {
      Object.entries(parsedPath.operations).forEach(([method, operation]) => {
        if (!methods.includes(method.toUpperCase())) {
          methods.push(method.toUpperCase());
        }
        operations[method] = operation;
        
        // Collect tags
        if (operation.tags) {
          operation.tags.forEach((tag: string) => tags.add(tag));
        }
      });
      
      // Merge schemas (deduplicate by name)
      parsedPath.schemas.forEach(schema => {
        if (!allSchemas.find(s => s.name === schema.name)) {
          allSchemas.push(schema);
        }
      });
    });
    
    const resourceType = this.determineResourceType(methods);
    const isRestful = this.isRESTfulResource(methods);
    
    return {
      id,
      name,
      displayName: this.generateDisplayName(name),
      path: mainPath,
      basePath: '', // Will be set with base_url later
      methods,
      schema: allSchemas,
      operations,
      sub_resources: [],
      is_restful: isRestful,
      parent_resource: parentId,
      resource_type: resourceType,
      tags: Array.from(tags),
    };
  }

  /**
   * Organize resources into hierarchical structure
   */
  private static organizeResourceHierarchy(
    allResources: Map<string, ParsedResource>,
    options: ParseOptions
  ): ParsedResource[] {
    const rootResources: ParsedResource[] = [];
    
    // Sort by depth to ensure parent resources are processed first
    const sortedResources = Array.from(allResources.values()).sort((a, b) => {
      const aDepth = a.id.split('.').length;
      const bDepth = b.id.split('.').length;
      return aDepth - bDepth;
    });
    
    sortedResources.forEach(resource => {
      if (!resource.parent_resource) {
        // Top-level resource
        rootResources.push(resource);
      } else if (options.includeSubResources) {
        // Find parent and attach as sub-resource
        const parent = allResources.get(resource.parent_resource);
        if (parent) {
          parent.sub_resources = parent.sub_resources || [];
          parent.sub_resources.push(resource);
        } else {
          // Parent not found, treat as top-level
          rootResources.push(resource);
        }
      }
    });
    
    return rootResources;
  }

  /**
   * Extract resource chain from path
   * e.g., "/users/{id}/posts/{postId}/comments" -> ["users", "posts", "comments"]
   */
  private static extractResourceChain(path: string): string[] {
    // Remove parameters and split into segments
    const cleanPath = path.replace(/[{:][^}/:]+[}]?/g, '');
    const segments = cleanPath.split('/').filter(Boolean);
    
    if (segments.length === 0) return [];
    
    // Filter out common action segments that aren't resources
    const actionSegments = new Set([
      'actions', 'action', 'status', 'health', 'metrics', 'search',
      'login', 'logout', 'refresh', 'validate', 'verify'
    ]);
    
    return segments.filter(segment => !actionSegments.has(segment.toLowerCase()));
  }

  /**
   * Extract operations from path item
   */
  private static extractOperations(pathItem: any): Record<string, OperationInfo> {
    const operations: Record<string, OperationInfo> = {};
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    
    httpMethods.forEach(method => {
      const operation = pathItem[method];
      if (operation) {
        operations[method] = {
          operationId: operation.operationId,
          summary: operation.summary,
          description: operation.description,
          parameters: operation.parameters || [],
          requestBody: operation.requestBody,
          responses: operation.responses || {},
          tags: operation.tags || [],
        };
      }
    });
    
    return operations;
  }

  /**
   * Extract schemas from path operations
   */
  private static extractSchemasFromPath(pathItem: any, spec: OpenAPISpec): FieldDefinition[] {
    const schemas: FieldDefinition[] = [];
    const processedSchemas = new Set<string>();
    
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];
    
    httpMethods.forEach(method => {
      const operation = pathItem[method];
      if (!operation) return;
      
      // Extract from responses
      Object.values(operation.responses || {}).forEach((response: any) => {
        if (response.content) {
          Object.values(response.content).forEach((content: any) => {
            if (content.schema) {
              const extracted = this.extractFieldsFromSchema(content.schema, spec);
              extracted.forEach(field => {
                if (!processedSchemas.has(field.name)) {
                  schemas.push(field);
                  processedSchemas.add(field.name);
                }
              });
            }
          });
        }
      });
      
      // Extract from request body
      if (operation.requestBody?.content) {
        Object.values(operation.requestBody.content).forEach((content: any) => {
          if (content.schema) {
            const extracted = this.extractFieldsFromSchema(content.schema, spec);
            extracted.forEach(field => {
              if (!processedSchemas.has(field.name)) {
                schemas.push(field);
                processedSchemas.add(field.name);
              }
            });
          }
        });
      }
    });
    
    return schemas;
  }

  /**
   * Extract fields from schema object
   */
  private static extractFieldsFromSchema(
    schema: any,
    spec: OpenAPISpec,
    required: string[] = []
  ): FieldDefinition[] {
    const fields: FieldDefinition[] = [];
    
    if (!schema) return fields;
    
    // Handle references
    if (schema.$ref) {
      const resolvedSchema = this.resolveReference(schema.$ref, spec);
      if (resolvedSchema) {
        return this.extractFieldsFromSchema(resolvedSchema, spec, required);
      }
    }
    
    // Handle object type
    if (schema.type === 'object' && schema.properties) {
      const requiredFields = schema.required || required;
      
      // Special handling for paginated responses
      if (this.isPaginatedResponse(schema)) {
        const dataSchema = schema.properties.data;
        if (dataSchema?.items) {
          return this.extractFieldsFromSchema(dataSchema.items, spec, required);
        }
      }
      
      Object.entries(schema.properties).forEach(([fieldName, fieldSchema]: [string, any]) => {
        const field = this.createFieldDefinition(fieldName, fieldSchema, requiredFields, spec);
        fields.push(field);
      });
    }
    
    return fields;
  }

  /**
   * Create field definition from schema
   */
  private static createFieldDefinition(
    name: string,
    schema: any,
    requiredFields: string[],
    spec: OpenAPISpec
  ): FieldDefinition {
    const field: FieldDefinition = {
      name,
      type: this.mapSchemaTypeToFieldType(schema),
      format: schema.format,
      description: schema.description,
      required: requiredFields.includes(name),
      example: schema.example,
    };
    
    // Handle enum
    if (schema.enum) {
      field.enum = schema.enum;
    }
    
    // Handle array items
    if (schema.type === 'array' && schema.items) {
      field.items = {
        name: 'item',
        type: this.mapSchemaTypeToFieldType(schema.items),
        required: false,
      };
    }
    
    // Handle nested objects
    if (schema.type === 'object' && schema.properties) {
      field.properties = {};
      const nestedFields = this.extractFieldsFromSchema(schema, spec);
      nestedFields.forEach(nestedField => {
        field.properties![nestedField.name] = nestedField;
      });
    }
    
    return field;
  }

  /**
   * Check if schema represents a paginated response
   */
  private static isPaginatedResponse(schema: any): boolean {
    return schema.properties?.data?.type === 'array' &&
           (schema.properties?.total !== undefined ||
            schema.properties?.page !== undefined ||
            schema.properties?.pageSize !== undefined ||
            schema.properties?.hasMore !== undefined);
  }

  /**
   * Resolve schema reference
   */
  private static resolveReference(ref: string, spec: OpenAPISpec): any {
    const path = ref.replace('#/', '').split('/');
    let current: any = spec;
    
    for (const segment of path) {
      if (current && typeof current === 'object' && segment in current) {
        current = current[segment];
      } else {
        return null;
      }
    }
    
    return current;
  }

  /**
   * Map schema type to field type
   */
  private static mapSchemaTypeToFieldType(schema: any): FieldType {
    if (!schema) return 'string';
    
    const type = schema.type;
    const format = schema.format;
    
    switch (type) {
      case 'integer':
        return 'integer';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      case 'string':
        if (format === 'date') return 'date';
        if (format === 'date-time') return 'datetime';
        if (format === 'email') return 'email';
        if (format === 'uri' || format === 'url') return 'url';
        return 'string';
      default:
        return 'string';
    }
  }

  /**
   * Determine resource type based on available methods
   */
  private static determineResourceType(methods: string[]): 'full_crud' | 'read_only' | 'custom' {
    const methodSet = new Set(methods.map(m => m.toLowerCase()));
    
    if (methodSet.has('get') && methodSet.has('post') && 
        methodSet.has('put') && methodSet.has('delete')) {
      return 'full_crud';
    }
    
    if (methodSet.has('get') && methodSet.size === 1) {
      return 'read_only';
    }
    
    return 'custom';
  }

  /**
   * Check if resource follows RESTful conventions
   */
  private static isRESTfulResource(methods: string[]): boolean {
    const methodSet = new Set(methods.map(m => m.toLowerCase()));
    const restfulMethods = ['get', 'post', 'put', 'delete'];
    
    return restfulMethods.some(method => methodSet.has(method));
  }

  /**
   * Generate display name from resource name
   */
  private static generateDisplayName(resourceName: string): string {
    return resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  }

  /**
   * Select the most appropriate main path from multiple paths
   */
  private static selectMainPath(paths: string[]): string {
    if (paths.length === 1) return paths[0];
    
    // Sort by complexity: prefer paths with fewer segments and parameters
    return paths.sort((a, b) => {
      const aSegments = a.replace(/[{:][^}/:]+[}]?/g, '').split('/').filter(Boolean);
      const bSegments = b.replace(/[{:][^}/:]+[}]?/g, '').split('/').filter(Boolean);
      
      // Prefer fewer segments
      if (aSegments.length !== bSegments.length) {
        return aSegments.length - bSegments.length;
      }
      
      // Prefer paths without parameters
      const aHasParams = /[{:]/.test(a);
      const bHasParams = /[{:]/.test(b);
      
      if (aHasParams && !bHasParams) return 1;
      if (!aHasParams && bHasParams) return -1;
      
      // Lexicographic order
      return a.localeCompare(b);
    })[0];
  }

  /**
   * Extract server URLs from OpenAPI spec
   */
  private static extractServers(spec: OpenAPISpec): string[] {
    // OpenAPI 3.x
    if (spec.servers?.length) {
      return spec.servers.map(server => server.url);
    }
    
    // Swagger 2.0
    if (spec.swagger) {
      const swaggerSpec = spec as any;
      const host = swaggerSpec.host || 'localhost';
      const basePath = swaggerSpec.basePath || '';
      const schemes = swaggerSpec.schemes || ['http'];
      return schemes.map((scheme: string) => `${scheme}://${host}${basePath}`);
    }
    
    return [];
  }

  /**
   * Extract all tags from OpenAPI spec
   */
  private static extractAllTags(spec: OpenAPISpec): string[] {
    const tags = new Set<string>();
    
    // From global tag definitions
    if ((spec as any).tags) {
      (spec as any).tags.forEach((tag: any) => {
        if (tag.name) tags.add(tag.name);
      });
    }
    
    // From path operations
    Object.values(spec.paths).forEach(pathItem => {
      if (pathItem && typeof pathItem === 'object') {
        const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
        httpMethods.forEach(method => {
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
   * Calculate statistics from spec and parsed resources
   */
  private static calculateStats(spec: OpenAPISpec, resources: ParsedResource[]) {
    const totalPaths = Object.keys(spec.paths).length;
    const totalOperations = this.countOperations(spec.paths);
    const restfulApis = resources.filter(r => r.is_restful).length;
    
    return {
      total_paths: totalPaths,
      total_operations: totalOperations,
      restful_apis: restfulApis,
    };
  }

  /**
   * Count total operations in paths
   */
  private static countOperations(paths: Record<string, any>): number {
    let count = 0;
    Object.values(paths).forEach(pathItem => {
      if (pathItem && typeof pathItem === 'object') {
        const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
        httpMethods.forEach(method => {
          if (pathItem[method]) count++;
        });
      }
    });
    return count;
  }

  /**
   * Fetch OpenAPI spec from URL
   */
  private static async fetchSpec(url: string): Promise<OpenAPISpec> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAPI document: ${response.statusText}`);
    }
    return response.json();
  }
}

/**
 * OpenAPI Parser Service with caching and state management
 * This service layer adds caching and business logic on top of the pure parser
 */
export class OpenAPIParserService {
  private cache = new Map<string, OpenAPIAnalysis>();

  constructor() {
    // Force clear cache to ensure latest parsing logic
    this.cache.clear();
  }

  /**
   * Parse OpenAPI document with caching
   */
  async parseOpenAPI(apiId: string, url: string): Promise<OpenAPIAnalysis> {
    // Check cache first
    if (this.cache.has(apiId)) {
      return this.cache.get(apiId)!;
    }

    console.log(`Parsing OpenAPI document: ${url}`);

    try {
      const analysis = await OpenAPIParser.parseDocument(url);
      
      // Set the API ID
      analysis.id = apiId;
      
      // Set base paths for all resources
      this.setBasePaths(analysis.resources, analysis.base_url);
      
      // Cache the result
      this.cache.set(apiId, analysis);
      
      console.log(`Parsing completed: ${analysis.title}, found ${analysis.resources.length} resources`);
      
      return analysis;
    } catch (error) {
      console.error('Failed to parse OpenAPI document:', error);
      throw new Error(
        `Failed to parse OpenAPI document: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Set base paths for all resources recursively
   */
  private setBasePaths(resources: ParsedResource[], baseUrl: string): void {
    resources.forEach(resource => {
      resource.basePath = baseUrl + resource.path;
      if (resource.sub_resources) {
        this.setBasePaths(resource.sub_resources, baseUrl);
      }
    });
  }

  /**
   * Clear cache for specific API or all APIs
   */
  clearCache(apiId?: string): void {
    if (apiId) {
      this.cache.delete(apiId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Reload OpenAPI document (clear cache and re-parse)
   */
  async reloadOpenAPI(apiId: string, url: string): Promise<OpenAPIAnalysis> {
    this.clearCache(apiId);
    return this.parseOpenAPI(apiId, url);
  }

  /**
   * Get cached analysis if available
   */
  getCachedAnalysis(apiId: string): OpenAPIAnalysis | null {
    return this.cache.get(apiId) || null;
  }

  /**
   * Check if analysis is cached
   */
  isCached(apiId: string): boolean {
    return this.cache.has(apiId);
  }
}

// Export singleton instance for backward compatibility
export const openAPIParser = new OpenAPIParserService();
