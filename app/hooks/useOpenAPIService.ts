import { useState, useEffect } from 'react';
import { createOpenAPIService, type OpenAPIService } from '~/lib/core';

const openapiDocURL = import.meta.env.VITE_OPENAPI_DOC_URL || '/openapi/apidocs.json';
/**
 * 获取和管理 OpenAPI 服务实例的 hook
 */
export function useOpenAPIService() {
  const [service, setService] = useState<OpenAPIService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);


  // 初始化服务
  useEffect(() => {
    const initService = async () => {
      try {
        const newService = createOpenAPIService();
        console.log('Initializing with OpenAPI URL:', openapiDocURL);
        await newService.initialize(openapiDocURL);
        
        setService(newService);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize OpenAPI service:', error);
        setService(null);
        setIsInitialized(false);
      }
    };

    initService();
  }, [openapiDocURL]);

  return {
    service,
    isInitialized,
  };
}

