import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import {
  PathParamResolver,
  type OpenAPIService,
  type ResourceInfo,
} from "~/lib/core";
import type { PaginatedResponse } from "~/lib/core/openapi-reset-client/lib/types";

/**
 * 获取资源数据的 hook
 * 支持顶级资源和子资源（通过 pathParams 传递路径参数）
 */
export function useResourceList(
  service: OpenAPIService | null,
  resource: ResourceInfo | null,
  currentPage: number = 1,
  pageSize: number = 10,
  searchQuery: string = ""
) {
  const location = useLocation();
  const resourcePath = location.pathname.substring(2); // 去掉前缀 "/r"
  return useQuery({
    queryKey: [
      "resourceListData",
      resource?.name,
      currentPage,
      pageSize,
      searchQuery,
    ],
    staleTime: 5,
    refetchOnMount: "always",
    queryFn: async (): Promise<PaginatedResponse<any>> => {
      if (!service || !resource) {
        throw new Error("Service or resource not available");
      }

      const listOperation = resource.operations.find(
        (op) => op.method.toLowerCase() === "get" && !op.path.endsWith("}")
      );
      if (!listOperation) {
        throw new Error(
          `No GET list operation found for resource ${resource.name}`
        );
      }

      const pathParams = PathParamResolver.extractPathParams(
        resourcePath,
        listOperation.path
      );

      // 构建查询参数
      const query: Record<string, any> = {};
      if (searchQuery) {
        query.search = searchQuery;
      }

      // 使用客户端获取数据
      return service.getClient().requestList(listOperation, resource.schema!, {
        pathParams, // 传递路径参数（用于子资源）
        page: currentPage,
        pageSize,
        query,
      });
    },
    enabled: !!service && !!resource,
  });
}
