import { useMemo } from 'react';
import { useParams } from 'react-router';
import { useOpenAPIService } from '~/hooks/useOpenAPIService';
import { PathParamResolver } from '~/lib/api/PathParamResolver';
import type { OpenAPIService, ResourceInfo } from '~/lib/api';

/**
 * 资源标识符信息
 */
export interface ResourceIdentifier {
  serviceName: string;
  resourceName: string;
  pathParams: Record<string, string>;
}

/**
 * 资源 hook 的返回类型
 */
export interface UseResourceReturn {
  // OpenAPI 服务实例
  service: OpenAPIService | null;

  // OpenAPI 资源信息
  resource: ResourceInfo | null;
  
  // 路径参数
  pathParams: Record<string, string>;
  
  // 资源标识符
  resourceIdentifier: ResourceIdentifier;
  
  // 状态
  isInitialized: boolean;
}

/**
 * useResource Hook
 * 
 * 获取当前页面的资源信息，包括：
 * 1. 从路由参数获取服务名称和资源名称
 * 2. 从 OpenAPI 获取实际的资源定义 (ResourceInfo)
 * 3. 使用 PathParamResolver 提取路径参数
 * 
 * 路由格式：/services/:sName/resources/:rName/*
 * - sName: 服务名称
 * - rName: 资源名称  
 * - *: 嵌套路径，用于提取路径参数
 */
export function useResource(): UseResourceReturn {
  const params = useParams<{ sName: string; rName: string; '*': string }>();
  const { service, isInitialized } = useOpenAPIService(params.sName);
  
  return useMemo(() => {
    const serviceName = params.sName || '';
    const resourceName = params.rName || '';
    const nestedPath = params['*']; // splat parameter
    
    // 解析当前资源名称和ID
    let currentResourceName = resourceName;
    let currentItemId: string | undefined;
    
    if (nestedPath) {
      const pathSegments = nestedPath.split('/').filter(Boolean);
      
      if (pathSegments.length === 1) {
        // 只有一个段，是顶级资源的ID
        currentItemId = pathSegments[0];
      } else if (pathSegments.length >= 2) {
        // 多个段，可能有子资源
        // 格式：id1/subResource/id2/...
        currentItemId = pathSegments[0]; // 第一个总是ID
        
        // 检查是否有子资源
        if (pathSegments.length >= 2) {
          const subResourceName = pathSegments[1];
          if (pathSegments.length === 2) {
            // 只到子资源列表
            currentResourceName = subResourceName;
            currentItemId = undefined;
          } else if (pathSegments.length >= 3) {
            // 子资源的具体项
            currentResourceName = subResourceName;
            currentItemId = pathSegments[2];
          }
        }
      }
    }
    
    // 获取 OpenAPI 资源信息
    let resource: ResourceInfo | null = null;
    if (service && currentResourceName) {
      resource = service.getResource(currentResourceName);
      console.log(`useResource - 获取资源: ${currentResourceName}`, resource);
    }
    
    // 提取路径参数
    let pathParams: Record<string, string> = {};
    if (resource?.pathPattern && currentItemId) {
      pathParams = PathParamResolver.extractPathParams(resource.pathPattern);
      // 只有当我们有有效的 currentItemId 时才设置标识符字段
      if (resource.identifierField && currentItemId) {
        pathParams[resource.identifierField] = currentItemId;
      }
    }
    
    // 构建资源标识符
    const resourceIdentifier: ResourceIdentifier = {
      serviceName,
      resourceName: currentResourceName,
      pathParams,
    };
    
    return {
      service,
      resource,
      pathParams,
      resourceIdentifier,
      isInitialized,
    };
  }, [params.sName, params.rName, params['*'], service, isInitialized]);
}