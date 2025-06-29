/**
 * Resource Management Service
 * 
 * Core responsibilities:
 * - Resource discovery and traversal in hierarchical structures
 * - Resource validation and analysis
 * - Path-based resource lookup and navigation
 * - Resource relationship management
 * 
 * This service works with already-parsed resource structures and provides
 * high-level operations for resource management and discovery.
 */

import type { ParsedResource } from '~/types/api';

export interface ResourceSearchOptions {
  /** Whether to prefer top-level resources in search results */
  preferTopLevel?: boolean;
  /** Whether to include sub-resources in search */
  includeSubResources?: boolean;
  /** Parent resource ID for scoped searches */
  parentId?: string;
  /** Maximum search depth (prevents infinite recursion) */
  maxDepth?: number;
}

export interface ResourceHierarchyInfo {
  resource: ParsedResource;
  path: string[];
  depth: number;
  isTopLevel: boolean;
  hasSubResources: boolean;
}

export interface ResourceStats {
  total: number;
  topLevel: number;
  restful: number;
  withSubResources: number;
  maxDepth: number;
  operationCounts: Record<string, number>;
}

export interface ResourceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Advanced resource manager with comprehensive resource operations
 */
export class ResourceManager {
  // ===== CORE SEARCH OPERATIONS =====

  /**
   * Find resource by name with intelligent search strategy
   * Priority: 1. Top-level resources 2. Sub-resources (if enabled)
   */
  findByName(
    resources: ParsedResource[],
    targetName: string,
    options: ResourceSearchOptions = {}
  ): ParsedResource | null {
    const { 
      preferTopLevel = true, 
      includeSubResources = true, 
      maxDepth = 10 
    } = options;

    // Input validation
    if (!targetName?.trim() || !Array.isArray(resources)) {
      return null;
    }

    if (preferTopLevel) {
      // Strategy 1: Search current level first
      const topLevelMatch = resources.find(resource => resource.name === targetName);
      if (topLevelMatch) {
        return topLevelMatch;
      }

      // Strategy 2: Search sub-resources if enabled and no top-level match
      if (includeSubResources && maxDepth > 0) {
        for (const resource of resources) {
          if (resource.sub_resources?.length) {
            const found = this.findByName(
              resource.sub_resources,
              targetName,
              { ...options, maxDepth: maxDepth - 1 }
            );
            if (found) return found;
          }
        }
      }
    } else {
      // Strategy 3: Depth-first search without preference
      return this.findRecursive(resources, targetName, 'name', maxDepth);
    }

    return null;
  }

  /**
   * Find resource by ID
   */
  findById(
    resources: ParsedResource[], 
    targetId: string,
    options: ResourceSearchOptions = {}
  ): ParsedResource | null {
    const { maxDepth = 10 } = options;
    
    if (!targetId?.trim() || !Array.isArray(resources)) {
      return null;
    }
    
    return this.findRecursive(resources, targetId, 'id', maxDepth);
  }

  /**
   * Find nested resource by path (supports dot notation)
   * Examples: "users.posts", "books.chapters.comments"
   */
  findByPath(
    resources: ParsedResource[], 
    resourcePath: string,
    options: ResourceSearchOptions = {}
  ): ParsedResource | null {
    if (!resourcePath?.trim() || !Array.isArray(resources)) {
      return null;
    }

    const pathParts = resourcePath.split('.').filter(Boolean);
    
    if (pathParts.length === 0) {
      return null;
    }
    
    if (pathParts.length === 1) {
      return this.findByName(resources, pathParts[0], options);
    }

    // Multi-level path: find parent, then recurse
    const [parentName, ...remainingPath] = pathParts;
    const parentResource = this.findByName(resources, parentName, {
      ...options,
      includeSubResources: false // Only search top-level for parent
    });

    if (!parentResource?.sub_resources?.length) {
      return null;
    }

    return this.findByPath(
      parentResource.sub_resources,
      remainingPath.join('.'),
      options
    );
  }

  // ===== HIERARCHY AND ANALYSIS =====

  /**
   * Get complete hierarchy information for a resource
   * Returns path, depth, and context information
   */
  getResourceHierarchy(
    resources: ParsedResource[],
    targetName: string,
    options: ResourceSearchOptions = {}
  ): ResourceHierarchyInfo | null {
    if (!targetName?.trim() || !Array.isArray(resources)) {
      return null;
    }

    // First, try to find as top-level resource
    const topLevelResource = this.findByName(resources, targetName, {
      ...options,
      preferTopLevel: true,
      includeSubResources: false
    });

    if (topLevelResource) {
      return {
        resource: topLevelResource,
        path: [topLevelResource.name],
        depth: 0,
        isTopLevel: true,
        hasSubResources: Boolean(topLevelResource.sub_resources?.length)
      };
    }

    // If not top-level, search with path tracking
    const result = this.findWithPath(resources, targetName);
    if (!result) return null;

    return {
      resource: result.resource,
      path: result.path.map(r => r.name),
      depth: result.path.length - 1,
      isTopLevel: false,
      hasSubResources: Boolean(result.resource.sub_resources?.length)
    };
  }

  /**
   * Get all top-level resources
   */
  getTopLevelResources(resources: ParsedResource[]): ParsedResource[] {
    if (!Array.isArray(resources)) {
      return [];
    }
    return resources.filter(resource => !resource.parent_resource);
  }

  /**
   * Get all sub-resources of a resource (flattened)
   */
  getAllSubResources(resource: ParsedResource): ParsedResource[] {
    if (!resource) return [];
    
    const result: ParsedResource[] = [];
    this.collectSubResources(resource, result);
    return result;
  }

  /**
   * Check if resource supports specific operation
   */
  supportsOperation(resource: ParsedResource, operation: string): boolean {
    if (!resource?.methods) return false;
    return resource.methods.includes(operation.toUpperCase());
  }

  /**
   * Get comprehensive resource statistics
   */
  getStats(resources: ParsedResource[]): ResourceStats {
    if (!Array.isArray(resources)) {
      return {
        total: 0,
        topLevel: 0,
        restful: 0,
        withSubResources: 0,
        maxDepth: 0,
        operationCounts: {}
      };
    }

    let total = 0;
    let restful = 0;
    let withSubResources = 0;
    let maxDepth = 0;
    const operationCounts: Record<string, number> = {};

    const analyzeResources = (resourceList: ParsedResource[], currentDepth: number = 0) => {
      maxDepth = Math.max(maxDepth, currentDepth);
      
      resourceList.forEach(resource => {
        total++;
        
        if (resource.is_restful) restful++;
        
        if (resource.sub_resources?.length) {
          withSubResources++;
          analyzeResources(resource.sub_resources, currentDepth + 1);
        }

        // Count operations
        if (resource.methods) {
          resource.methods.forEach(method => {
            operationCounts[method] = (operationCounts[method] || 0) + 1;
          });
        }
      });
    };

    analyzeResources(resources);

    return {
      total,
      restful,
      withSubResources,
      maxDepth,
      topLevel: resources.length,
      operationCounts
    };
  }

  // ===== VALIDATION AND ANALYSIS =====

  /**
   * Validate resource structure and configuration
   */
  validateResource(resource: ParsedResource): ResourceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    if (!resource.id?.trim()) {
      errors.push('Resource ID is required');
    }

    if (!resource.name?.trim()) {
      errors.push('Resource name is required');
    }

    if (!resource.path?.trim()) {
      errors.push('Resource path is required');
    }

    if (!resource.methods?.length) {
      warnings.push('Resource has no HTTP methods defined');
    }

    // RESTful validation
    if (resource.is_restful) {
      const restfulMethods = ['GET', 'POST', 'PUT', 'DELETE'];
      const missingMethods = restfulMethods.filter(method => 
        !resource.methods?.includes(method)
      );
      
      if (missingMethods.length > 0) {
        warnings.push(`RESTful resource missing methods: ${missingMethods.join(', ')}`);
      }
    }

    // Schema validation
    if (!resource.schema?.length) {
      suggestions.push('Consider adding schema definitions for better API documentation');
    }

    // Sub-resource validation
    if (resource.sub_resources?.length) {
      resource.sub_resources.forEach((subResource, index) => {
        const subValidation = this.validateResource(subResource);
        errors.push(...subValidation.errors.map(err => `Sub-resource[${index}]: ${err}`));
        warnings.push(...subValidation.warnings.map(warn => `Sub-resource[${index}]: ${warn}`));
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Find resources by operation support
   */
  findResourcesByOperation(
    resources: ParsedResource[], 
    operation: string,
    options: ResourceSearchOptions = {}
  ): ParsedResource[] {
    const results: ParsedResource[] = [];
    const { includeSubResources = true, maxDepth = 10 } = options;

    const searchResources = (resourceList: ParsedResource[], currentDepth: number = 0) => {
      if (currentDepth >= maxDepth) return;

      resourceList.forEach(resource => {
        if (this.supportsOperation(resource, operation)) {
          results.push(resource);
        }

        if (includeSubResources && resource.sub_resources?.length) {
          searchResources(resource.sub_resources, currentDepth + 1);
        }
      });
    };

    searchResources(resources);
    return results;
  }

  /**
   * Find resources by tag
   */
  findResourcesByTag(
    resources: ParsedResource[], 
    tag: string,
    options: ResourceSearchOptions = {}
  ): ParsedResource[] {
    const results: ParsedResource[] = [];
    const { includeSubResources = true, maxDepth = 10 } = options;

    const searchResources = (resourceList: ParsedResource[], currentDepth: number = 0) => {
      if (currentDepth >= maxDepth) return;

      resourceList.forEach(resource => {
        if (resource.tags?.includes(tag)) {
          results.push(resource);
        }

        if (includeSubResources && resource.sub_resources?.length) {
          searchResources(resource.sub_resources, currentDepth + 1);
        }
      });
    };

    searchResources(resources);
    return results;
  }

  // ===== PRIVATE HELPER METHODS =====

  private findRecursive(
    resources: ParsedResource[],
    target: string,
    field: 'name' | 'id' = 'name',
    maxDepth: number = 10,
    currentDepth: number = 0
  ): ParsedResource | null {
    if (currentDepth >= maxDepth) return null;

    for (const resource of resources) {
      if (resource[field] === target) {
        return resource;
      }

      if (resource.sub_resources?.length) {
        const found = this.findRecursive(
          resource.sub_resources, 
          target, 
          field, 
          maxDepth, 
          currentDepth + 1
        );
        if (found) return found;
      }
    }
    return null;
  }

  private findWithPath(
    resources: ParsedResource[],
    targetName: string,
    currentPath: ParsedResource[] = [],
    maxDepth: number = 10
  ): { resource: ParsedResource; path: ParsedResource[] } | null {
    if (currentPath.length >= maxDepth) return null;

    for (const resource of resources) {
      const newPath = [...currentPath, resource];

      if (resource.name === targetName) {
        return { resource, path: newPath };
      }

      if (resource.sub_resources?.length) {
        const found = this.findWithPath(
          resource.sub_resources, 
          targetName, 
          newPath, 
          maxDepth
        );
        if (found) return found;
      }
    }
    return null;
  }

  private collectSubResources(
    resource: ParsedResource, 
    result: ParsedResource[]
  ): void {
    if (resource.sub_resources?.length) {
      resource.sub_resources.forEach(subResource => {
        result.push(subResource);
        this.collectSubResources(subResource, result);
      });
    }
  }
}

/**
 * Specialized resource query builder for complex searches
 */
export class ResourceQuery {
  private resources: ParsedResource[];
  private filters: Array<(resource: ParsedResource) => boolean> = [];
  private sortFn?: (a: ParsedResource, b: ParsedResource) => number;
  private limitCount?: number;
  private includeSubResources = true;

  constructor(resources: ParsedResource[]) {
    this.resources = resources;
  }

  /**
   * Filter by name (supports regex)
   */
  byName(pattern: string | RegExp): this {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    this.filters.push(resource => regex.test(resource.name));
    return this;
  }

  /**
   * Filter by supported operations
   */
  withOperation(operation: string): this {
    this.filters.push(resource => 
      resource.methods?.includes(operation.toUpperCase()) || false
    );
    return this;
  }

  /**
   * Filter by RESTful status
   */
  isRESTful(restful: boolean = true): this {
    this.filters.push(resource => resource.is_restful === restful);
    return this;
  }

  /**
   * Filter by resource type
   */
  ofType(type: 'full_crud' | 'read_only' | 'custom'): this {
    this.filters.push(resource => resource.resource_type === type);
    return this;
  }

  /**
   * Filter by tag
   */
  withTag(tag: string): this {
    this.filters.push(resource => resource.tags?.includes(tag) || false);
    return this;
  }

  /**
   * Filter by having sub-resources
   */
  hasSubResources(hasSubResources: boolean = true): this {
    this.filters.push(resource => 
      Boolean(resource.sub_resources?.length) === hasSubResources
    );
    return this;
  }

  /**
   * Include/exclude sub-resources in search
   */
  includeNested(include: boolean = true): this {
    this.includeSubResources = include;
    return this;
  }

  /**
   * Sort results
   */
  sortBy(fn: (a: ParsedResource, b: ParsedResource) => number): this {
    this.sortFn = fn;
    return this;
  }

  /**
   * Sort by name
   */
  sortByName(ascending: boolean = true): this {
    return this.sortBy((a, b) => 
      ascending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
  }

  /**
   * Limit results
   */
  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  /**
   * Execute the query and return results
   */
  execute(): ParsedResource[] {
    const results: ParsedResource[] = [];

    const searchResources = (resourceList: ParsedResource[]) => {
      resourceList.forEach(resource => {
        // Apply all filters
        const matches = this.filters.every(filter => filter(resource));
        
        if (matches) {
          results.push(resource);
        }

        // Search sub-resources if enabled
        if (this.includeSubResources && resource.sub_resources?.length) {
          searchResources(resource.sub_resources);
        }
      });
    };

    searchResources(this.resources);

    // Apply sorting
    if (this.sortFn) {
      results.sort(this.sortFn);
    }

    // Apply limit
    if (this.limitCount) {
      return results.slice(0, this.limitCount);
    }

    return results;
  }

  /**
   * Get count of matching resources
   */
  count(): number {
    return this.execute().length;
  }

  /**
   * Check if any resources match
   */
  exists(): boolean {
    return this.count() > 0;
  }
}

/**
 * Enhanced resource manager with query capabilities
 */
export class EnhancedResourceManager extends ResourceManager {
  /**
   * Create a new resource query
   */
  query(resources: ParsedResource[]): ResourceQuery {
    return new ResourceQuery(resources);
  }

  /**
   * Find resources with advanced filtering
   */
  findResources(
    resources: ParsedResource[],
    filter: (resource: ParsedResource) => boolean,
    options: ResourceSearchOptions = {}
  ): ParsedResource[] {
    return this.query(resources)
      .includeNested(options.includeSubResources ?? true)
      .execute()
      .filter(filter);
  }

  /**
   * Get resource suggestions based on partial name
   */
  getSuggestions(
    resources: ParsedResource[],
    partial: string,
    limit: number = 5
  ): ParsedResource[] {
    if (!partial.trim()) return [];

    return this.query(resources)
      .byName(new RegExp(partial, 'i'))
      .sortByName()
      .limit(limit)
      .execute();
  }

  /**
   * Analyze resource relationships
   */
  analyzeRelationships(resources: ParsedResource[]) {
    const relationships = new Map<string, string[]>();
    const parentChildMap = new Map<string, ParsedResource[]>();

    const analyzeResource = (resource: ParsedResource, parentId?: string) => {
      if (parentId) {
        if (!relationships.has(parentId)) {
          relationships.set(parentId, []);
        }
        relationships.get(parentId)!.push(resource.id);

        if (!parentChildMap.has(parentId)) {
          parentChildMap.set(parentId, []);
        }
        parentChildMap.get(parentId)!.push(resource);
      }

      if (resource.sub_resources?.length) {
        resource.sub_resources.forEach(subResource => {
          analyzeResource(subResource, resource.id);
        });
      }
    };

    resources.forEach(resource => analyzeResource(resource));

    return {
      relationships: Object.fromEntries(relationships),
      parentChildMap: Object.fromEntries(parentChildMap),
      orphanedResources: resources.filter(r => r.parent_resource && !relationships.has(r.parent_resource))
    };
  }
}

// Export instances
export const resourceManager = new ResourceManager();
export const enhancedResourceManager = new EnhancedResourceManager();
