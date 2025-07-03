import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { createOpenAPIService, type OpenAPIService } from "~/lib/core";
import { initApiClientWithAuth } from "../lib/auth/apiAuthHelper";
import { useAuth } from "../components/auth/AuthContext";
import { useRuntimeConfig } from "./useRuntimeConfig";

/**
 * 初始化 OpenAPI 服务的异步函数
 */
async function initializeOpenAPIService(
  config: Record<string, any>,
  navigate: NavigateFunction
): Promise<OpenAPIService> {
  const openapiDocURL =
    config.openapiDocUrl ||
    import.meta.env.VITE_OPENAPI_DOC_URL ||
    "/openapi/apidocs.json";

  let service = createOpenAPIService();
  console.log("Initializing with OpenAPI URL:", openapiDocURL);
  console.log("Runtime config loaded:", config);
  await service.initialize(openapiDocURL);

  // 初始化API客户端并设置认证令牌，确保等待完成
  if (service.apiClient) {
    service.apiClient = await initApiClientWithAuth(service.apiClient);
    service.apiClient.setUnauthenticatedErrorHandler(() => navigate("/login"));
  }

  return service;
}

/**
 * 获取和管理 OpenAPI 服务实例的 hook
 * 使用 React Query 简化异步状态管理
 */
export function useOpenAPIService() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const {
    config,
    isLoading: isConfigLoading,
    isError: isConfigError,
    error: configError,
  } = useRuntimeConfig();

  const query = useQuery({
    queryKey: ["openapi-service", config],
    queryFn: () => initializeOpenAPIService(config, navigate),
    retry: false,
    enabled: !isConfigLoading && !isConfigError, // 只有在配置加载完成且没有错误时才执行
  });

  // 当认证状态变化时，重新配置API客户端的认证
  useEffect(() => {
    if (query.data?.apiClient) {
      // 重新初始化API客户端的认证配置
      const reconfigureAuth = async () => {
        if (query.data?.apiClient) {
          query.data.apiClient = await initApiClientWithAuth(
            query.data.apiClient
          );
        }
      };

      reconfigureAuth();
    }
  }, [isAuthenticated, user, query.data?.apiClient]);

  if (isConfigError) {
    throw new Error(`Failed to load runtime config: ${configError}`);
  }

  if (query.isError) {
    throw new Error(`Failed to initialize OpenAPI service: ${query.error}`);
  }

  return {
    service: query.data || null,
    isLoading: isConfigLoading || query.isLoading,
    refetch: query.refetch, // 提供手动重试功能
  };
}
