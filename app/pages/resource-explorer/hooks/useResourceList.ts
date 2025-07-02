import { useQuery } from "@tanstack/react-query";
import {
  PathParamResolver,
  type OpenAPIService,
  type PaginatedResponse,
  type ResourceInfo,
} from "~/lib/core";

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
  return useQuery({
    queryKey: [
      "resourceListData",
      resource?.name,
      currentPage,
      pageSize,
      searchQuery,
    ],
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
