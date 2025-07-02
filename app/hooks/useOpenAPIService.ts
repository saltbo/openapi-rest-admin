import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createOpenAPIService, type OpenAPIService } from '~/lib/core';

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

