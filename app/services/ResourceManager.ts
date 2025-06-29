/**
 * 资源管理服务
 * 统一处理所有资源查找、解析和管理逻辑
 */

import type { ParsedResource } from '~/types/api';

export interface ResourceSearchOptions {
  /** 是否优先返回顶级资源 */
  preferTopLevel?: boolean;
  /** 是否包含子资源 */
  includeSubResources?: boolean;
  /** 指定父资源ID */
  parentId?: string;
}

export class ResourceManager {
  /**
   * 在资源树中查找指定名称的资源
   * 严格按照优先级：1. 顶级资源 2. 子资源（如果允许）
   */
  findByName(
    resources: ParsedResource[], 
    targetName: string, 
    options: ResourceSearchOptions = {}
  ): ParsedResource | null {
    const { preferTopLevel = true, includeSubResources = true } = options;

    if (preferTopLevel) {
      // 首先严格在当前层级查找
      for (const resource of resources) {
        if (resource.name === targetName) {
          return resource;
        }
      }
      
      // 如果需要包含子资源且当前层级没找到，再递归查找子资源
      if (includeSubResources) {
        for (const resource of resources) {
          if (resource.sub_resources?.length) {
            const found = this.findByName(resource.sub_resources, targetName, options);
            if (found) {
              return found;
            }
          }
        }
      }
    } else {
      // 深度优先搜索
      return this.findRecursive(resources, targetName);
    }

    return null;
  }

  /**
   * 根据ID查找资源
   */
  findById(resources: ParsedResource[], targetId: string): ParsedResource | null {
    return this.findRecursive(resources, targetId, 'id');
  }

  /**
   * 查找嵌套资源（通过完整路径）
   * 例如：books.notes, authors.books
   */
  findByPath(resources: ParsedResource[], resourcePath: string): ParsedResource | null {
    const pathParts = resourcePath.split('.');
    
    if (pathParts.length === 1) {
      return this.findByName(resources, pathParts[0]);
    }

    // 查找父资源
    const parentName = pathParts[0];
    const parentResource = this.findByName(resources, parentName);
    
    if (!parentResource || !parentResource.sub_resources) {
      return null;
    }

    // 递归查找子资源
    const remainingPath = pathParts.slice(1).join('.');
    return this.findByPath(parentResource.sub_resources, remainingPath);
  }

  /**
   * 获取资源的完整层级信息
   * 优先返回顶级资源的层级信息
   */
  getResourceHierarchy(
    resources: ParsedResource[], 
    targetName: string
  ): { resource: ParsedResource; path: string[]; depth: number } | null {
    // 首先查找是否有顶级资源匹配
    const topLevelResource = this.findByName(resources, targetName, { 
      preferTopLevel: true, 
      includeSubResources: false 
    });
    
    if (topLevelResource) {
      return {
        resource: topLevelResource,
        path: [topLevelResource.name],
        depth: 0
      };
    }

    // 如果没有顶级资源匹配，再查找子资源
    const result = this.findWithPath(resources, targetName);
    if (!result) return null;

    return {
      resource: result.resource,
      path: result.path.map(r => r.name),
      depth: result.path.length - 1
    };
  }

  /**
   * 获取所有顶级资源
   */
  getTopLevelResources(resources: ParsedResource[]): ParsedResource[] {
    return resources.filter(resource => !resource.parent_resource);
  }

  /**
   * 获取资源的所有子资源（扁平化）
   */
  getAllSubResources(resource: ParsedResource): ParsedResource[] {
    const result: ParsedResource[] = [];
    this.collectSubResources(resource, result);
    return result;
  }

  /**
   * 验证资源是否支持指定操作
   */
  supportsOperation(resource: ParsedResource, operation: string): boolean {
    return resource.methods?.includes(operation.toUpperCase()) || false;
  }

  /**
   * 获取资源统计信息
   */
  getStats(resources: ParsedResource[]) {
    let total = 0;
    let restful = 0;
    let withSubResources = 0;

    const count = (resourceList: ParsedResource[]) => {
      resourceList.forEach(resource => {
        total++;
        if (resource.is_restful) restful++;
        if (resource.sub_resources?.length) {
          withSubResources++;
          count(resource.sub_resources);
        }
      });
    };

    count(resources);

    return {
      total,
      restful,
      withSubResources,
      topLevel: resources.length
    };
  }

  // === 私有方法 ===

  private findRecursive(
    resources: ParsedResource[], 
    target: string, 
    field: 'name' | 'id' = 'name'
  ): ParsedResource | null {
    for (const resource of resources) {
      if (resource[field] === target) {
        return resource;
      }
      
      if (resource.sub_resources?.length) {
        const found = this.findRecursive(resource.sub_resources, target, field);
        if (found) return found;
      }
    }
    return null;
  }

  private findWithPath(
    resources: ParsedResource[], 
    targetName: string, 
    currentPath: ParsedResource[] = []
  ): { resource: ParsedResource; path: ParsedResource[] } | null {
    for (const resource of resources) {
      const newPath = [...currentPath, resource];
      
      if (resource.name === targetName) {
        return { resource, path: newPath };
      }
      
      if (resource.sub_resources?.length) {
        const found = this.findWithPath(resource.sub_resources, targetName, newPath);
        if (found) return found;
      }
    }
    return null;
  }

  private collectSubResources(resource: ParsedResource, result: ParsedResource[]): void {
    if (resource.sub_resources?.length) {
      resource.sub_resources.forEach(subResource => {
        result.push(subResource);
        this.collectSubResources(subResource, result);
      });
    }
  }
}

// 导出单例实例
export const resourceManager = new ResourceManager();
