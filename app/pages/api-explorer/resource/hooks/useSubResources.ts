import { useState, useEffect } from 'react';
import { parseResourcePath } from '~/utils/resourceRouting';
import { useOpenAPIService, useResourceInfo } from '~/hooks/useOpenAPIService';
import type { ResourceInfo } from '~/lib/api';

interface UseSubResourcesProps {
  serviceName?: string;
  resourceName?: string;
  itemId?: string;
  nestedPath?: string;
}

export const useSubResources = ({ serviceName, resourceName, itemId, nestedPath }: UseSubResourcesProps) => {
  const [loading, setLoading] = useState(true);
  const [subResources, setSubResources] = useState<ResourceInfo[]>([]);
  const [subResourceData, setSubResourceData] = useState<{ [key: string]: any[] }>({});
  const [error, setError] = useState<string | null>(null);

  // 获取 OpenAPI 服务
  const { service, isInitialized } = useOpenAPIService(serviceName);

  // 解析资源路径
  const { currentResourceName } = parseResourcePath(nestedPath || '', resourceName || '');

  // 获取资源信息
  const { resource } = useResourceInfo(service, currentResourceName);

  // 加载子资源数据
  const loadSubResourcesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!service || !resource || !itemId) {
        setSubResources([]);
        setSubResourceData({});
        return;
      }

      // 处理子资源
      if (resource.subResources && resource.subResources.length > 0) {
        setSubResources(resource.subResources);
        
        const subResourceDataMap: { [key: string]: any[] } = {};
        
        for (const subResource of resource.subResources) {
          try {
            // 查找子资源的 GET 列表操作
            const getListOperation = subResource.operations.find(op => {
              const isGet = op.method.toLowerCase() === 'get';
              const pathEndsWithId = op.path.endsWith('{id}') || op.path.endsWith(`{${subResource.name}Id}`);
              return isGet && !pathEndsWithId;
            });
            
            if (getListOperation) {
              // 构建路径参数
              const pathParams: Record<string, any> = {};
              
              if (getListOperation.path.includes('{id}')) {
                pathParams['id'] = itemId;
              } else if (getListOperation.path.includes(`{${resource.name}Id}`)) {
                pathParams[`${resource.name}Id`] = itemId;
              } else if (getListOperation.path.includes('{parentId}')) {
                pathParams['parentId'] = itemId;
              }
              
              // 使用新的 API 客户端获取子资源列表
              const subResourceResponse = await service.getClient().getList(getListOperation, {
                pathParams,
                page: 1,
                pageSize: 10
              });
              
              subResourceDataMap[subResource.name] = subResourceResponse.data || [];
            } else {
              subResourceDataMap[subResource.name] = [];
            }
          } catch (error) {
            console.warn(`Failed to load sub-resource ${subResource.name}:`, error);
            subResourceDataMap[subResource.name] = [];
          }
        }
        setSubResourceData(subResourceDataMap);
      } else {
        setSubResources([]);
        setSubResourceData({});
      }
      
    } catch (error) {
      console.error('Failed to load sub-resources:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    if (isInitialized && service && resource && itemId) {
      loadSubResourcesData();
    }
  };

  useEffect(() => {
    if (isInitialized && service && resource && itemId) {
      loadSubResourcesData();
    }
  }, [isInitialized, service, resource, itemId]);

  return {
    loading: !isInitialized || loading,
    error,
    subResources,
    subResourceData,
    refetch
  };
};
