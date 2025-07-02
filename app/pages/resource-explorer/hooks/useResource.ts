import { useMemo } from 'react';
import { useParams } from 'react-router';
import { useOpenAPIService } from '~/hooks/useOpenAPIService';
import type { OpenAPIService, ResourceInfo } from '~/lib/core';

/**
 * 资源标识符信息
 */
export interface ResourceIdentifier {
  serviceName: string;
}

/**
 * 资源 hook 的返回类型
 */
export interface UseResourceReturn {
  // OpenAPI 服务实例
  service: OpenAPIService | null;

  // OpenAPI 资源信息
  resource: ResourceInfo | null;
  
  // 当前资源的路径: 例如 /books, /books/123, /books/123/authors
  resourcePath: string | undefined;
  
  // 状态
  isLoading: boolean;
}

/**
 * useResource Hook
 * 
 * 获取当前页面的资源信息，包括：
 * 1. 从路由参数获取服务名称和资源名称
 * 2. 从 OpenAPI 获取实际的资源定义 (ResourceInfo)
 * 3. 使用 PathParamResolver 提取路径参数
 * 
 * 路由格式：/r/:rName/*
 * - sName: 服务名称
 * - rName: 资源名称  
 * - *: 嵌套路径，用于提取路径参数
 */
export function useResource(): UseResourceReturn {
  const params = useParams<{rName: string; '*': string }>();
  const { service, isLoading } = useOpenAPIService();
  
  return useMemo(() => {
    const resourceName = params.rName || '';
    const resourcePath = params['*']; // splat parameter
    
    // 获取 OpenAPI 资源信息
    let resource: ResourceInfo | null = null;
    if (service && resourceName) {
      resource = service.getResource(resourceName);
    }
    
    return {
      service,
      resource,
      resourcePath,
      isLoading,
    };
  }, [params.rName, params['*'], service, isLoading]);
}