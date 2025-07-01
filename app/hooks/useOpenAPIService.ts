import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createOpenAPIService, type OpenAPIService, type ResourceInfo } from '~/lib/api';
import type { PaginatedResponse } from '~/lib/api';

/**
 * 获取和管理 OpenAPI 服务实例的 hook
 */
export function useOpenAPIService(serviceName: string | undefined) {
  const [service, setService] = useState<OpenAPIService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 获取 API 配置
  const { data: apiConfig, error: configError } = useQuery({
    queryKey: ['apiConfig', serviceName],
    queryFn: async () => {
      // 从配置中获取 API 文档 URL
      const response = await fetch(`/api/configs/${serviceName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch API config');
      }
      const config = await response.json();
      console.log('API Config loaded:', config);
      return config;
    },
    enabled: !!serviceName,
  });

  // 初始化服务
  useEffect(() => {
    if (!apiConfig || !serviceName) {
      setService(null);
      setIsInitialized(false);
      return;
    }

    const initService = async () => {
      try {
        console.log('Initializing service with config:', apiConfig);
        
        if (!apiConfig.openapi_url) {
          throw new Error(`OpenAPI URL not found for service ${serviceName}`);
        }
        
        // 从 openapi_url 推断 baseURL，或者使用默认值
        const baseURL = apiConfig.baseURL || new URL(apiConfig.openapi_url).origin;
        console.log('Using baseURL:', baseURL);
        
        const newService = createOpenAPIService(baseURL);
        console.log('Initializing with OpenAPI URL:', apiConfig.openapi_url);
        await newService.initialize(apiConfig.openapi_url);
        
        setService(newService);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize OpenAPI service:', error);
        setService(null);
        setIsInitialized(false);
      }
    };

    initService();
  }, [apiConfig, serviceName]);

  return {
    service,
    isInitialized,
    apiConfig,
  };
}

/**
 * 获取资源信息的 hook
 */
export function useResourceInfo(service: OpenAPIService | null, resourceName: string | undefined) {
  return useMemo(() => {
    if (!service || !resourceName) {
      console.log('useResourceInfo: service or resourceName is null', { service: !!service, resourceName });
      return { resource: null, allResources: [] };
    }

    console.log('useResourceInfo: Looking for resource:', resourceName);
    const resource = service.getResource(resourceName);
    console.log('useResourceInfo: Found resource:', resource);

    return { resource };
  }, [service, resourceName]);
}

/**
 * 获取资源数据的 hook
 */
export function useResourceListData(
  service: OpenAPIService | null,
  resource: ResourceInfo | null,
  currentPage: number = 1,
  pageSize: number = 10,
  searchQuery: string = '',
  nestedPath?: string
) {
  return useQuery({
    queryKey: ['resourceListData', resource?.name, currentPage, pageSize, searchQuery, nestedPath],
    queryFn: async (): Promise<PaginatedResponse<any>> => {
      if (!service || !resource) {
        throw new Error('Service or resource not available');
      }

      // 找到 GET 操作
      const getOperation = resource.operations.find(op => op.method.toLowerCase() === 'get');
      if (!getOperation) {
        throw new Error(`No GET operation found for resource ${resource.name}`);
      }

      // 构建查询参数
      const query: Record<string, any> = {};
      if (searchQuery) {
        query.search = searchQuery;
      }

      // 使用客户端获取数据
      return service.getClient().getList(getOperation, {
        page: currentPage,
        pageSize,
        query,
      });
    },
    enabled: !!service && !!resource,
  });
}

/**
 * 获取资源表格 schema 的 hook
 */
export function useResourceTableSchema(service: OpenAPIService | null, resourceName: string | undefined) {
  return useMemo(() => {
    if (!service || !resourceName) {
      return null;
    }

    try {
      return service.getResourceTableSchema(resourceName);
    } catch (error) {
      console.error('Failed to generate table schema:', error);
      return null;
    }
  }, [service, resourceName]);
}
