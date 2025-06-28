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
 * 判断URL路径是详情页还是列表页
 * @param splat URL的splat参数
 * @returns true表示详情页，false表示列表页
 */
export function isDetailPage(splat: string | undefined): boolean {
  if (!splat) return false;
  const pathSegments = splat.split('/').filter(Boolean);
  // 如果路径段数为奇数，说明最后一段是具体的资源ID，显示详情页
  return pathSegments.length % 2 === 1;
}

/**
 * 构建资源详情页面的链接
 * @param serviceName 服务名称
 * @param topLevelResource 顶级资源名称
 * @param nestedPath 嵌套路径
 * @param itemId 资源项ID
 * @returns 完整的链接路径
 */
export function buildDetailLink(
  serviceName: string,
  topLevelResource: string,
  nestedPath: string | undefined,
  itemId: string | number
): string {
  if (nestedPath) {
    // 嵌套路径：构建完整的嵌套链接
    return `/services/${encodeURIComponent(serviceName)}/resources/${topLevelResource}/${nestedPath}/${itemId}`;
  } else {
    // 顶级资源：简单链接
    return `/services/${encodeURIComponent(serviceName)}/resources/${topLevelResource}/${itemId}`;
  }
}

/**
 * 构建资源列表页面的链接
 * @param serviceName 服务名称
 * @param topLevelResource 顶级资源名称
 * @param nestedPath 嵌套路径（不包含最后的资源名）
 * @param resourceName 要显示的资源名称
 * @returns 完整的链接路径
 */
export function buildListLink(
  serviceName: string,
  topLevelResource: string,
  nestedPath: string | undefined,
  resourceName: string
): string {
  if (nestedPath) {
    return `/services/${encodeURIComponent(serviceName)}/resources/${topLevelResource}/${nestedPath}/${resourceName}`;
  } else {
    return `/services/${encodeURIComponent(serviceName)}/resources/${resourceName}`;
  }
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

/**
 * 生成资源的完整父级上下文路径
 * @param resourceHierarchy 资源层次结构
 * @returns 父级上下文字符串
 */
export function buildParentContextPath(resourceHierarchy: ResourceHierarchy[]): string {
  if (resourceHierarchy.length <= 1) return '';
  
  const parentLevels = resourceHierarchy.slice(0, -1);
  const pathSegments: string[] = [];
  
  parentLevels.forEach((level, index) => {
    if (index === 0 && level.itemId) {
      pathSegments.push(level.itemId);
    } else if (index > 0) {
      pathSegments.push(level.resourceName);
      if (level.itemId) {
        pathSegments.push(level.itemId);
      }
    }
  });
  
  return pathSegments.join('/');
}

/**
 * 构建子资源详情页面的链接
 * @param serviceName 服务名称
 * @param resourceHierarchy 当前资源层次结构
 * @param subResourceName 子资源名称
 * @param itemId 子资源项ID
 * @returns 完整的子资源详情链接
 */
export function buildSubResourceDetailLink(
  serviceName: string,
  resourceHierarchy: ResourceHierarchy[],
  subResourceName: string,
  itemId: string | number
): string {
  if (resourceHierarchy.length === 0) {
    return `/services/${encodeURIComponent(serviceName)}/resources/${subResourceName}/${itemId}`;
  }
  
  let path = `/services/${encodeURIComponent(serviceName)}/resources/${resourceHierarchy[0].resourceName}`;
  
  // 添加所有现有层级的路径
  for (let i = 0; i < resourceHierarchy.length; i++) {
    if (i === 0 && resourceHierarchy[i].itemId) {
      path += `/${resourceHierarchy[i].itemId}`;
    } else if (i > 0) {
      path += `/${resourceHierarchy[i].resourceName}`;
      if (resourceHierarchy[i].itemId) {
        path += `/${resourceHierarchy[i].itemId}`;
      }
    }
  }
  
  // 添加新的子资源层级
  path += `/${subResourceName}/${itemId}`;
  
  return path;
}

/**
 * 构建新建资源页面的链接，包含父资源上下文
 * @param serviceName 服务名称
 * @param resourceName 要新建的资源名称
 * @param resourceHierarchy 父资源层次结构
 * @returns 完整的新建页面链接（包含query参数）
 */
export function buildNewResourceLink(
  serviceName: string,
  resourceName: string,
  resourceHierarchy: ResourceHierarchy[]
): string {
  const baseUrl = `/services/${encodeURIComponent(serviceName)}/resources/${resourceName}/new`;
  
  if (resourceHierarchy.length === 0) {
    return baseUrl;
  }
  
  // 构建父资源链（支持多级嵌套）
  const parentChain = resourceHierarchy.map((level, index) => {
    if (index === 0) {
      return `parent=${level.resourceName}&parentId=${level.itemId}`;
    } else {
      return `parent${index}=${level.resourceName}&parentId${index}=${level.itemId}`;
    }
  }).join('&');
  
  return `${baseUrl}?${parentChain}`;
}
