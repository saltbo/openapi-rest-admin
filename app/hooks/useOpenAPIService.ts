import { useQuery } from "@tanstack/react-query";
import { createOpenAPIService, type OpenAPIService } from "~/lib/core";

const openapiDocURL =
  import.meta.env.VITE_OPENAPI_DOC_URL || "/openapi/apidocs.json";

/**
 * 初始化 OpenAPI 服务的异步函数
 */
async function initializeOpenAPIService(): Promise<OpenAPIService> {
  const service = createOpenAPIService();
  console.log("Initializing with OpenAPI URL:", openapiDocURL);
  await service.initialize(openapiDocURL);
  return service;
}

/**
 * 获取和管理 OpenAPI 服务实例的 hook
 * 使用 React Query 简化异步状态管理
 */
export function useOpenAPIService() {
  const query = useQuery({
    queryKey: ["openapi-service", openapiDocURL],
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
