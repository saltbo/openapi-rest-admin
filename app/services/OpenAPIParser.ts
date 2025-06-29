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
  FieldDefinition, 
  FieldType, 
  Parameter, 
  OperationInfo, 
  ParsedResource, 
  OpenAPIAnalysis 
} from '~/types/openapi';

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
    
    // Validate specification structure
    if (!this.validateOpenAPISpec(spec)) {
      throw new Error('Invalid OpenAPI specification structure');
    }
    
    const baseInfo = this.extractBaseInfo(spec);
    const parsedPaths = this.parsePaths(spec, opts);
    const resources = this.buildResourceHierarchy(parsedPaths, opts, spec);
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
   * Extract resources from RESTful GET endpoints' response bodies
   */
  private static buildResourceHierarchy(
    pathMap: Map<string, ParsedPath>,
    options: ParseOptions,
    spec: OpenAPISpec
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
    
    // Create resource objects from RESTful list endpoints
    const allResources = new Map<string, ParsedResource>();
    
    resourceGroups.forEach((paths, resourceKey) => {
      const resourceChain = resourceKey.split('.');
      const resourceName = resourceChain[resourceChain.length - 1];
      const parentResourceName = resourceChain.length > 1 
        ? resourceChain.slice(0, -1).join('.')
        : undefined;
      
      const resource = this.createResourceFromListEndpoint(resourceKey, resourceName, paths, parentResourceName, spec);
      if (resource) {
        allResources.set(resourceKey, resource);
      }
    });
    
    // Build hierarchy
    return this.organizeResourceHierarchy(allResources, options);
  }

  /**
   * Create a resource from RESTful list endpoint (GET /resources)
   * Extract resource schema from response body according to RESTful conventions
   */
  private static createResourceFromListEndpoint(
    id: string,
    name: string,
    paths: ParsedPath[],
    parentId?: string,
    spec?: OpenAPISpec
  ): ParsedResource | null {
    // Find the list endpoint (GET method on collection path)
    const listPath = this.findListEndpoint(paths);
    if (!listPath) {
      console.warn(`No RESTful list endpoint found for resource: ${name}`);
      return null;
    }

    // Extract schema from GET operation response
    const getOperation = listPath.operations['get'];
    if (!getOperation || !getOperation.responses) {
      console.warn(`No GET operation or responses found for list endpoint: ${listPath.path}`);
      return null;
    }

    // Extract schema from 200 response
    const successResponse = getOperation.responses['200'] || getOperation.responses['default'];
    if (!successResponse) {
      console.warn(`No success response found for list endpoint: ${listPath.path}`);
      return null;
    }

    // Get response schema and extract resource fields
    const resourceSchema = this.extractResourceSchemaFromResponse(successResponse, name, spec);
    
    // Collect all operations from paths
    const operations: Record<string, OperationInfo> = {};
    const methods: string[] = [];
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
    });

    // Only include RESTful resources
    if (!this.isRESTfulResource(methods)) {
      console.warn(`Resource ${name} is not RESTful, skipping`);
      return null;
    }

    const mainPath = this.selectMainPath(paths.map(p => p.path));
    const resourceType = this.determineResourceType(methods);
    
    return {
      id,
      name,
      path: mainPath,
      basePath: '', // Will be set with base_url later
      methods,
      schema: resourceSchema,
      operations,
      sub_resources: [],
      is_restful: true, // We only process RESTful resources
      parent_resource: parentId,
      resource_type: resourceType,
      tags: Array.from(tags),
    };
  }

  /**
   * Find the list endpoint (GET /resources) from paths
   */
  private static findListEndpoint(paths: ParsedPath[]): ParsedPath | null {
    // Look for GET operation on collection path (path without ID parameter at the end)
    return paths.find(path => {
      // Check if this path has GET operation
      if (!path.operations['get']) return false;
      
      // Collection path should not end with ID parameter
      // e.g., /users is collection, /users/{id} is item
      const segments = path.path.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      
      // If last segment is a parameter, this is likely an item endpoint
      if (lastSegment && /^[{:]/.test(lastSegment)) {
        return false;
      }
      
      return true;
    }) || null;
  }

  /**
   * Extract resource schema from list endpoint response
   * Handle common response formats: array, {data: array}, {list: array}, {items: array}
   */
  private static extractResourceSchemaFromResponse(response: any, resourceName: string, spec?: OpenAPISpec): FieldDefinition[] {
    // Get response content schema
    let responseSchema = null;
    
    // OpenAPI 3.x format
    if (response.content) {
      const jsonContent = response.content['application/json'];
      if (jsonContent?.schema) {
        responseSchema = jsonContent.schema;
      }
    }
    // Swagger 2.0 format
    else if (response.schema) {
      responseSchema = response.schema;
    }
    
    if (!responseSchema) {
      console.warn(`No response schema found for resource: ${resourceName}`);
      return [];
    }

    return this.extractResourceFieldsFromResponseSchema(responseSchema, resourceName, spec);
  }

  /**
   * Extract resource fields from response schema
   * Handle different response formats
   */
  private static extractResourceFieldsFromResponseSchema(
    responseSchema: any, 
    resourceName: string,
    spec?: OpenAPISpec
  ): FieldDefinition[] {
    // Case 1: Response is directly an array
    if (responseSchema.type === 'array' && responseSchema.items) {
      return this.extractFieldsFromSchema(responseSchema.items, spec || {} as OpenAPISpec);
    }
    
    // Case 2: Response is an object containing an array
    if (responseSchema.type === 'object' && responseSchema.properties) {
      const properties = responseSchema.properties;
      
      // Try common array property names
      const arrayPropertyNames = ['data', 'list', 'items', resourceName];
      
      for (const propName of arrayPropertyNames) {
        const property = properties[propName];
        if (property && property.type === 'array' && property.items) {
          return this.extractFieldsFromSchema(property.items, spec || {} as OpenAPISpec);
        }
      }
      
      // If no array property found, try to find the first array property
      for (const [propName, property] of Object.entries(properties)) {
        if ((property as any).type === 'array' && (property as any).items) {
          console.log(`Using array property '${propName}' for resource schema extraction`);
          return this.extractFieldsFromSchema((property as any).items, spec || {} as OpenAPISpec);
        }
      }
    }
    
    // Case 3: Handle $ref in response schema
    if (responseSchema.$ref && spec) {
      const resolvedSchema = this.resolveReference(responseSchema.$ref, spec);
      if (resolvedSchema) {
        return this.extractResourceFieldsFromResponseSchema(resolvedSchema, resourceName, spec);
      }
    }
    
    console.warn(`Unable to extract resource schema from response format for: ${resourceName}`);
    return [];
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
   * Detect OpenAPI version from spec
   */
  private static getOpenAPIVersion(spec: OpenAPISpec): 'v2' | 'v3' {
    if (spec.openapi) {
      return 'v3'; // OpenAPI 3.x
    } else if (spec.swagger) {
      return 'v2'; // Swagger 2.0
    }
    
    // Default to v3 if unclear
    return 'v3';
  }

  /**
   * Get schemas location based on OpenAPI version
   */
  private static getSchemasFromSpec(spec: OpenAPISpec): Record<string, any> {
    const version = this.getOpenAPIVersion(spec);
    
    if (version === 'v3') {
      return spec.components?.schemas || {};
    } else {
      return spec.definitions || {};
    }
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
          parameters: this.normalizeParameters(operation.parameters || []),
          requestBody: operation.requestBody, // OpenAPI 3.x style
          responses: operation.responses || {},
          tags: operation.tags || [],
        };
        
        // Handle Swagger 2.0 body parameters
        if (operation.parameters) {
          const bodyParam = operation.parameters.find((param: any) => param.in === 'body');
          if (bodyParam && !operations[method].requestBody) {
            operations[method].requestBody = {
              description: bodyParam.description,
              required: bodyParam.required,
              content: {
                'application/json': {
                  schema: bodyParam.schema
                }
              }
            };
          }
        }
      }
    });
    
    return operations;
  }

  /**
   * Normalize parameters to consistent format
   */
  private static normalizeParameters(parameters: any[]): Parameter[] {
    return parameters
      .filter(param => param.in !== 'body') // Body params handled separately
      .map(param => ({
        name: param.name,
        in: param.in,
        description: param.description,
        required: param.required || false,
        schema: param.schema || {
          type: param.type,
          format: param.format,
          enum: param.enum,
          items: param.items,
        }
      }));
  }

  /**
   * Extract schemas from path operations according to OpenAPI specification
   */
  private static extractSchemasFromPath(pathItem: any, spec: OpenAPISpec): FieldDefinition[] {
    const schemas: FieldDefinition[] = [];
    const processedSchemas = new Set<string>();
    
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    
    httpMethods.forEach(method => {
      const operation = pathItem[method];
      if (!operation) return;
      
      // Extract from responses according to OpenAPI spec
      Object.values(operation.responses || {}).forEach((response: any) => {
        const version = this.getOpenAPIVersion(spec);
        const content = this.normalizeResponseContent(response, version);
        
        if (content) {
          const mediaSchemas = this.extractMediaTypeSchemas(content);
          mediaSchemas.forEach(responseSchema => {
            const extracted = this.extractFieldsFromSchema(responseSchema, spec);
            extracted.forEach(field => {
              if (!processedSchemas.has(field.name)) {
                schemas.push(field);
                processedSchemas.add(field.name);
              }
            });
          });
        }
      });
      
      // Extract from request body according to OpenAPI spec
      let requestBodySchema = null;
      
      // OpenAPI 3.x format
      if (operation.requestBody?.content) {
        Object.values(operation.requestBody.content).forEach((content: any) => {
          if (content.schema) {
            requestBodySchema = content.schema;
          }
        });
      }
      // Swagger 2.0 format - parameters with 'in: body'
      else if (operation.parameters) {
        const bodyParam = operation.parameters.find((param: any) => param.in === 'body');
        if (bodyParam?.schema) {
          requestBodySchema = bodyParam.schema;
        }
      }
      
      if (requestBodySchema) {
        const extracted = this.extractFieldsFromSchema(requestBodySchema, spec);
        extracted.forEach(field => {
          if (!processedSchemas.has(field.name)) {
            schemas.push(field);
            processedSchemas.add(field.name);
          }
        });
      }
      
      // Extract from parameters according to OpenAPI spec
      if (operation.parameters) {
        operation.parameters.forEach((param: any) => {
          if (param.in !== 'body') { // Skip body parameters (handled above)
            let paramSchema = null;
            
            // OpenAPI 3.x format
            if (param.schema) {
              paramSchema = param.schema;
            }
            // Swagger 2.0 format
            else {
              paramSchema = {
                type: param.type,
                format: param.format,
                enum: param.enum,
                items: param.items
              };
            }
            
            if (paramSchema && param.name) {
              const field = this.createFieldDefinition(
                param.name,
                paramSchema,
                param.required ? [param.name] : [],
                spec
              );
              if (!processedSchemas.has(field.name)) {
                schemas.push(field);
                processedSchemas.add(field.name);
              }
            }
          }
        });
      }
    });
    
    return schemas;
  }

  /**
   * Extract fields from schema object according to OpenAPI specification
   */
  private static extractFieldsFromSchema(
    schema: any,
    spec: OpenAPISpec,
    required: string[] = []
  ): FieldDefinition[] {
    const fields: FieldDefinition[] = [];
    
    if (!schema) return fields;
    
    // Handle references according to OpenAPI spec
    if (schema.$ref) {
      const resolvedSchema = this.resolveReference(schema.$ref, spec);
      if (resolvedSchema) {
        return this.extractFieldsFromSchema(resolvedSchema, spec, required);
      }
    }
    
    // Handle allOf, oneOf, anyOf according to OpenAPI spec
    if (schema.allOf) {
      schema.allOf.forEach((subSchema: any) => {
        const subFields = this.extractFieldsFromSchema(subSchema, spec, required);
        subFields.forEach(field => {
          if (!fields.find(f => f.name === field.name)) {
            fields.push(field);
          }
        });
      });
      return fields;
    }
    
    if (schema.oneOf || schema.anyOf) {
      const schemas = schema.oneOf || schema.anyOf;
      // For oneOf/anyOf, we'll extract fields from the first schema
      // In a real implementation, you might want to handle this differently
      if (schemas.length > 0) {
        return this.extractFieldsFromSchema(schemas[0], spec, required);
      }
    }
    
    // Handle object type according to OpenAPI spec
    if (schema.type === 'object' && schema.properties) {
      const requiredFields = schema.required || required;
      
      Object.entries(schema.properties).forEach(([fieldName, fieldSchema]: [string, any]) => {
        const field = this.createFieldDefinition(fieldName, fieldSchema, requiredFields, spec);
        fields.push(field);
      });
    }
    
    // Handle array type
    if (schema.type === 'array' && schema.items) {
      return this.extractFieldsFromSchema(schema.items, spec, required);
    }
    
    return fields;
  }

  /**
   * Create field definition from schema according to OpenAPI specification
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
    
    // Handle enum according to OpenAPI spec
    if (schema.enum) {
      field.enum = schema.enum;
    }
    
    // Handle array items according to OpenAPI spec
    if (schema.type === 'array' && schema.items) {
      field.items = {
        name: 'item',
        type: this.mapSchemaTypeToFieldType(schema.items),
        required: false,
        format: schema.items.format,
        description: schema.items.description,
      };
      
      // Handle nested object in array items
      if (schema.items.type === 'object' && schema.items.properties) {
        field.items.properties = {};
        const nestedFields = this.extractFieldsFromSchema(schema.items, spec);
        nestedFields.forEach(nestedField => {
          field.items!.properties![nestedField.name] = nestedField;
        });
      }
    }
    
    // Handle nested objects according to OpenAPI spec
    if ((schema.type === 'object' || (!schema.type && schema.properties)) && schema.properties) {
      field.properties = {};
      const nestedFields = this.extractFieldsFromSchema(schema, spec);
      nestedFields.forEach(nestedField => {
        field.properties![nestedField.name] = nestedField;
      });
    }
    
    // Handle $ref in field
    if (schema.$ref) {
      const resolvedSchema = this.resolveReference(schema.$ref, spec);
      if (resolvedSchema) {
        // Merge resolved schema properties
        if (resolvedSchema.properties) {
          field.properties = {};
          const nestedFields = this.extractFieldsFromSchema(resolvedSchema, spec);
          nestedFields.forEach(nestedField => {
            field.properties![nestedField.name] = nestedField;
          });
        }
      }
    }
    
    // Handle constraints according to OpenAPI spec
    if (schema.minimum !== undefined) field.minimum = schema.minimum;
    if (schema.maximum !== undefined) field.maximum = schema.maximum;
    if (schema.minLength !== undefined) field.minLength = schema.minLength;
    if (schema.maxLength !== undefined) field.maxLength = schema.maxLength;
    if (schema.pattern !== undefined) field.pattern = schema.pattern;
    if (schema.minItems !== undefined) field.minItems = schema.minItems;
    if (schema.maxItems !== undefined) field.maxItems = schema.maxItems;
    if (schema.uniqueItems !== undefined) field.uniqueItems = schema.uniqueItems;
    if (schema.multipleOf !== undefined) field.multipleOf = schema.multipleOf;
    
    return field;
  }

  /**
   * Resolve schema reference according to OpenAPI specification
   */
  private static resolveReference(ref: string, spec: OpenAPISpec): any {
    // Handle external references (not implemented in this basic version)
    if (!ref.startsWith('#/')) {
      console.warn(`External references not supported: ${ref}`);
      return null;
    }
    
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
   * Map schema type to field type according to OpenAPI specification
   */
  private static mapSchemaTypeToFieldType(schema: any): FieldType {
    if (!schema) return 'string';
    
    const type = schema.type;
    const format = schema.format;
    
    // Handle schema without type but with properties (implicit object)
    if (!type && schema.properties) {
      return 'object';
    }
    
    // Handle schema with $ref
    if (schema.$ref) {
      return 'object'; // Assume referenced schemas are objects
    }
    
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
        // Handle string formats according to OpenAPI spec
        switch (format) {
          case 'date':
            return 'date';
          case 'date-time':
            return 'datetime';
          case 'email':
            return 'email';
          case 'uri':
          case 'url':
            return 'url';
          case 'binary':
          case 'byte':
          case 'password':
          default:
            return 'string';
        }
      case 'null':
        return 'string'; // Treat null as string for UI purposes
      default:
        // Handle missing type - infer from other properties
        if (schema.enum) return 'string';
        if (schema.properties) return 'object';
        if (schema.items) return 'array';
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
   * Get parameter definition according to OpenAPI specification
   */
  private static getParameterDefinition(param: any, spec: OpenAPISpec): any {
    // Handle parameter references
    if (param.$ref) {
      return this.resolveReference(param.$ref, spec);
    }
    
    return param;
  }

  /**
   * Extract server URLs from OpenAPI spec according to specification
   */
  private static extractServers(spec: OpenAPISpec): string[] {
    const version = this.getOpenAPIVersion(spec);
    
    if (version === 'v3') {
      // OpenAPI 3.x
      if (spec.servers?.length) {
        return spec.servers.map(server => server.url);
      }
    } else {
      // Swagger 2.0
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

  /**
   * Validate OpenAPI specification structure
   */
  private static validateOpenAPISpec(spec: OpenAPISpec): boolean {
    // Basic structure validation
    if (!spec.info || !spec.info.title || !spec.info.version) {
      console.warn('Invalid OpenAPI spec: missing required info fields');
      return false;
    }
    
    if (!spec.paths || typeof spec.paths !== 'object') {
      console.warn('Invalid OpenAPI spec: missing or invalid paths');
      return false;
    }
    
    // Version-specific validation
    const version = this.getOpenAPIVersion(spec);
    if (version === 'v3' && !spec.openapi) {
      console.warn('Invalid OpenAPI 3.x spec: missing openapi field');
      return false;
    }
    
    if (version === 'v2' && !spec.swagger) {
      console.warn('Invalid Swagger 2.0 spec: missing swagger field');
      return false;
    }
    
    return true;
  }

  /**
   * Normalize response content according to OpenAPI specification
   */
  private static normalizeResponseContent(response: any, version: 'v2' | 'v3'): any {
    if (version === 'v3') {
      // OpenAPI 3.x format - response.content
      return response.content;
    } else {
      // Swagger 2.0 format - response.schema
      if (response.schema) {
        return {
          'application/json': {
            schema: response.schema
          }
        };
      }
    }
    
    return null;
  }

  /**
   * Extract media type schemas according to OpenAPI specification
   */
  private static extractMediaTypeSchemas(content: any): any[] {
    if (!content || typeof content !== 'object') {
      return [];
    }
    
    const schemas: any[] = [];
    Object.entries(content).forEach(([mediaType, mediaContent]: [string, any]) => {
      if (mediaContent.schema) {
        schemas.push(mediaContent.schema);
      }
    });
    
    return schemas;
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
      console.log(999, analysis);
            
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
