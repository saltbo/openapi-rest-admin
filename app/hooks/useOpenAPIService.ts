import { useQuery } from "@tanstack/react-query";
import { createOpenAPIService, type OpenAPIService } from "~/lib/core";
import type { RuntimeConfig } from "../../config/types";
import { initApiClientWithAuth } from "../lib/auth/apiAuthHelper";

/**
 * 获取运行时配置
 */
async function getRuntimeConfig(): Promise<Partial<RuntimeConfig>> {
  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to load runtime config, using defaults:', error);
    return {};
  }
}

/**
 * 初始化 OpenAPI 服务的异步函数
 */
async function initializeOpenAPIService(): Promise<OpenAPIService> {
  const config = await getRuntimeConfig();
  const openapiDocURL = config.openapiDocUrl || 
    import.meta.env.VITE_OPENAPI_DOC_URL || 
    "/openapi/apidocs.json";
  
  let service = createOpenAPIService();
  console.log("Initializing with OpenAPI URL:", openapiDocURL);
  console.log("Runtime config loaded:", config);
  await service.initialize(openapiDocURL);
  
  // 初始化API客户端并设置认证令牌
  if (service.apiClient) {
    service.apiClient = initApiClientWithAuth(service.apiClient);
  }
  
  return service;
}

/**
 * 获取和管理 OpenAPI 服务实例的 hook
 * 使用 React Query 简化异步状态管理
 */
export function useOpenAPIService() {
  const query = useQuery({
    queryKey: ["openapi-service"],
    queryFn: initializeOpenAPIService,
    retry: false,
  });

  if (query.isError) {
    throw new Error(`Failed to initialize OpenAPI service: ${query.error}`);
  }

  return {
    service: query.data || null,
    isLoading: query.isLoading,
    refetch: query.refetch, // 提供手动重试功能
  };
}
