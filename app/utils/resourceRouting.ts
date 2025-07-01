/**
 * 资源路由相关的工具函数和类型定义
 */

// 资源层次结构类型定义
export interface ResourceHierarchy {
  resourceName: string;
  itemId?: string;
}

// 解析结果类型
export interface ParsedResourcePath {
  currentResourceName: string;
  parentContext: ResourceHierarchy[] | null;
  resourceHierarchy: ResourceHierarchy[];
  isSubResource: boolean;
}

/**
 * 解析嵌套的资源路径
 * @param nestedPath 嵌套路径字符串，格式：id1/resource2/id2/resource3/id3
 * @param topLevelResource 顶级资源名称
 * @returns 解析后的资源路径信息
 */
export function parseResourcePath(
  nestedPath: string | undefined, 
  topLevelResource: string
): ParsedResourcePath {
  if (!nestedPath) {
    return {
      currentResourceName: topLevelResource,
      parentContext: null,
      resourceHierarchy: [{ resourceName: topLevelResource }],
      isSubResource: false
    };
  }
  
  const pathSegments = nestedPath.split('/').filter(Boolean);
  const resourceHierarchy: ResourceHierarchy[] = [];
  
  // 构建资源层次结构
  if (pathSegments.length === 0) {
    resourceHierarchy.push({ resourceName: topLevelResource });
  } else if (pathSegments.length === 1) {
    // 顶级资源的具体项目
    resourceHierarchy.push({ resourceName: topLevelResource, itemId: pathSegments[0] });
  } else {
    // 多级嵌套
    resourceHierarchy.push({ resourceName: topLevelResource, itemId: pathSegments[0] });
    
    // 处理嵌套的子资源
    for (let i = 1; i < pathSegments.length; i += 2) {
      const resourceName = pathSegments[i];
      const itemId = pathSegments[i + 1];
      resourceHierarchy.push({ resourceName, itemId });
    }
  }
  
  // 当前要显示的资源是最后一个资源名（如果没有对应的ID，说明是列表页）
  const lastLevel = resourceHierarchy[resourceHierarchy.length - 1];
  const currentResourceName = lastLevel.resourceName;
  const parentContext = resourceHierarchy.length > 1 ? resourceHierarchy.slice(0, -1) : null;
  const isSubResource = resourceHierarchy.length > 1;
  
  return {
    currentResourceName,
    parentContext,
    resourceHierarchy,
    isSubResource
  };
}


/**
 * 构建到指定层级的路径
 * @param serviceName 服务名称
 * @param resourceHierarchy 资源层次结构
 * @param targetIndex 目标层级索引
 * @param includeItemId 是否包含目标层级的itemId
 * @returns 路径字符串
 */
export function buildPathToLevel(
  serviceName: string,
  resourceHierarchy: ResourceHierarchy[],
  targetIndex: number,
  includeItemId: boolean = true
): string {
  if (resourceHierarchy.length === 0) return '/';
  
  let path = `/services/${encodeURIComponent(serviceName)}/resources/${resourceHierarchy[0].resourceName}`;
  
  for (let i = 0; i <= targetIndex; i++) {
    const level = resourceHierarchy[i];
    
    if (i === 0) {
      // 顶级资源
      if (level.itemId && (includeItemId || i < targetIndex)) {
        path += `/${level.itemId}`;
      }
    } else {
      // 子资源
      path += `/${level.resourceName}`;
      if (level.itemId && (includeItemId || i < targetIndex)) {
        path += `/${level.itemId}`;
      }
    }
  }
  
  return path;
}

