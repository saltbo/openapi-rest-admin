import { useQuery } from "@tanstack/react-query";
import type {
  OpenAPIService,
  PaginatedResponse,
  ResourceInfo,
} from "~/lib/api";

/**
 * 获取资源数据的 hook
 * 支持顶级资源和子资源（通过 pathParams 传递路径参数）
 */
export function useResourceList(
  service: OpenAPIService | null,
  resource: ResourceInfo | null,
  currentPage: number = 1,
  pageSize: number = 10,
  searchQuery: string = "",
  pathParams: Record<string, string> = {}
) {
  return useQuery({
    queryKey: [
      "resourceListData",
      resource?.name,
      pathParams,
      currentPage,
      pageSize,
      searchQuery,
    ],
    queryFn: async (): Promise<PaginatedResponse<any>> => {
      if (!service || !resource) {
        throw new Error("Service or resource not available");
      }

      // 找到 GET 操作
      // 对于子资源，找不带 ID 参数的端点（列表操作）
      // 对于顶级资源，找到任何 GET 操作
      const getOperation = resource.operations.find(
        (op) => {
          if (op.method.toLowerCase() !== "get") return false;
          
          // 如果有路径参数，说明是子资源，找不以 } 结尾的路径（列表操作）
          if (Object.keys(pathParams).length > 0) {
            return !op.path.endsWith('}');
          }
          
          // 顶级资源，找到任何 GET 操作
          return true;
        }
      );
      if (!getOperation) {
        const resourceType = Object.keys(pathParams).length > 0 ? 'sub-resource' : 'resource';
        throw new Error(`No GET operation found for ${resourceType} ${resource.name}`);
      }

      // 构建查询参数
      const query: Record<string, any> = {};
      if (searchQuery) {
        query.search = searchQuery;
      }

      // 使用客户端获取数据
      return service.getClient().getList(getOperation, {
        pathParams, // 传递路径参数（用于子资源）
        page: currentPage,
        pageSize,
        query,
      });
    },
    enabled: !!service && !!resource && (Object.keys(pathParams).length === 0 || Object.keys(pathParams).length > 0),
  });
}
