/**
 * 资源查找和操作相关的工具函数
 */

import type { ParsedResource } from '~/types/api';

/**
 * 在资源树中递归查找指定名称的资源
 * @param resources 资源数组
 * @param targetName 目标资源名称
 * @returns 找到的资源对象，未找到返回null
 */
export function findResourceInAll(resources: ParsedResource[], targetName: string): ParsedResource | null {
  for (const resource of resources) {
    if (resource.name === targetName) {
      return resource;
    }
    // 递归查找子资源
    if (resource.sub_resources && resource.sub_resources.length > 0) {
      const found = findResourceInAll(resource.sub_resources, targetName);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * 在资源树中查找指定ID的资源
 * @param resources 资源数组
 * @param targetId 目标资源ID
 * @returns 找到的资源对象，未找到返回null
 */
export function findResourceById(resources: ParsedResource[], targetId: string): ParsedResource | null {
  for (const resource of resources) {
    if (resource.id === targetId) {
      return resource;
    }
    // 递归查找子资源
    if (resource.sub_resources && resource.sub_resources.length > 0) {
      const found = findResourceById(resource.sub_resources, targetId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * 获取资源的完整路径（从根到当前资源）
 * @param resources 资源数组
 * @param targetName 目标资源名称
 * @param currentPath 当前路径（递归用）
 * @returns 资源路径数组，未找到返回null
 */
export function getResourcePath(
  resources: ParsedResource[], 
  targetName: string, 
  currentPath: ParsedResource[] = []
): ParsedResource[] | null {
  for (const resource of resources) {
    const newPath = [...currentPath, resource];
    
    if (resource.name === targetName) {
      return newPath;
    }
    
    // 递归查找子资源
    if (resource.sub_resources && resource.sub_resources.length > 0) {
      const found = getResourcePath(resource.sub_resources, targetName, newPath);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * 获取所有顶级资源
 * @param resources 资源数组
 * @returns 顶级资源数组
 */
export function getTopLevelResources(resources: ParsedResource[]): ParsedResource[] {
  return resources.filter(resource => !resource.parent_resource);
}

/**
 * 获取指定资源的所有子资源（扁平化）
 * @param resource 资源对象
 * @returns 子资源数组
 */
export function getAllSubResources(resource: ParsedResource): ParsedResource[] {
  const subResources: ParsedResource[] = [];
  
  function collectSubResources(res: ParsedResource) {
    if (res.sub_resources && res.sub_resources.length > 0) {
      res.sub_resources.forEach(subRes => {
        subResources.push(subRes);
        collectSubResources(subRes);
      });
    }
  }
  
  collectSubResources(resource);
  return subResources;
}

/**
 * 检查资源是否为RESTful资源
 * @param resource 资源对象
 * @returns true表示RESTful资源
 */
export function isRestfulResource(resource: ParsedResource): boolean {
  return resource.is_restful || false;
}

/**
 * 获取资源支持的操作方法
 * @param resource 资源对象
 * @returns 操作方法数组
 */
export function getSupportedMethods(resource: ParsedResource): string[] {
  return resource.methods || [];
}

/**
 * 检查资源是否支持指定操作
 * @param resource 资源对象
 * @param method 操作方法（GET, POST, PUT, DELETE等）
 * @returns true表示支持该操作
 */
export function supportsMethod(resource: ParsedResource, method: string): boolean {
  return getSupportedMethods(resource).includes(method.toUpperCase());
}

/**
 * 获取资源的显示名称
 * @param resource 资源对象
 * @returns 显示名称
 */
export function getResourceDisplayName(resource: ParsedResource): string {
  return resource.displayName || resource.name;
}

/**
 * 获取资源类型的显示文本
 * @param resourceType 资源类型
 * @returns 显示文本
 */
export function getResourceTypeDisplayText(resourceType: string): string {
  const typeMap: Record<string, string> = {
    'full_crud': '完整CRUD',
    'read_only': '只读',
    'custom': '自定义'
  };
  return typeMap[resourceType] || resourceType;
}

/**
 * 统计资源相关信息
 * @param resources 资源数组
 * @returns 统计信息
 */
export function getResourceStats(resources: ParsedResource[]) {
  let totalResources = 0;
  let restfulResources = 0;
  let totalSubResources = 0;
  
  function countResources(resourceList: ParsedResource[]) {
    resourceList.forEach(resource => {
      totalResources++;
      if (isRestfulResource(resource)) {
        restfulResources++;
      }
      
      if (resource.sub_resources && resource.sub_resources.length > 0) {
        totalSubResources += resource.sub_resources.length;
        countResources(resource.sub_resources);
      }
    });
  }
  
  countResources(resources);
  
  return {
    totalResources,
    restfulResources,
    totalSubResources,
    topLevelResources: resources.length
  };
}
