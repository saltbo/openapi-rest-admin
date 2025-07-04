import { useQuery } from "@tanstack/react-query";
import type { RuntimeConfig } from "../../config/types";

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
 * 获取和管理运行时配置的 hook
 * 使用 React Query 缓存配置数据
 */
export function useRuntimeConfig() {
  const query = useQuery({
    queryKey: ["runtime-config"],
    queryFn: getRuntimeConfig,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
    gcTime: 10 * 60 * 1000, // 10分钟后清理缓存
  });

  return {
    config: query.data || {},
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
