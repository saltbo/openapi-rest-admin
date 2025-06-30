import { useState, useEffect } from 'react';
import { parseResourcePath } from '~/utils/resourceRouting';
import { useOpenAPIService, useResourceInfo } from '~/hooks/useOpenAPIService';
import type { ResourceInfo } from '~/lib/api';

interface UseResourceDetailProps {
  serviceName?: string;
  resourceName?: string;
  itemId?: string;
  nestedPath?: string;
}

export const useResourceDetail = ({ serviceName, resourceName, itemId, nestedPath }: UseResourceDetailProps) => {
  const [loading, setLoading] = useState(true);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 获取 OpenAPI 服务
  const { service, isInitialized, apiConfig } = useOpenAPIService(serviceName);

  // 解析资源路径
  const { currentResourceName } = parseResourcePath(nestedPath || '', resourceName || '');

  // 获取资源信息
  const { resource } = useResourceInfo(service, currentResourceName);

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!service || !resource || !itemId) {
        throw new Error('Missing required parameters or service not initialized');
      }
      
      // 查找 GET 单个资源的操作
      const getByIdOperation = resource.operations.find(op => 
        op.method.toLowerCase() === 'get' && 
        op.path.includes('{id}')
      );
      
      if (!getByIdOperation) {
        throw new Error(`No GET by ID operation found for resource ${resource.name}`);
      }

      // 使用新的 API 客户端获取资源详情
      const response = await service.getClient().getById(getByIdOperation, itemId);
      setCurrentItem(response.data);
      
    } catch (error) {
      console.error('Failed to load resource detail:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    if (isInitialized && service && resource && itemId) {
      loadData();
    }
  };

  useEffect(() => {
    if (isInitialized && service && resource && itemId) {
      loadData();
    }
  }, [isInitialized, service, resource, itemId]);

  return {
    loading: !isInitialized || loading,
    error,
    currentItem,
    resource,
    apiConfig,
    refetch
  };
};
