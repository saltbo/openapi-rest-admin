import { useState, useEffect } from 'react';
import { parseResourcePath } from '~/utils/resourceRouting';
import { useOpenAPIService, useResourceInfo } from '~/hooks/useOpenAPIService';
import type { ResourceInfo } from '~/lib/api';

interface UseResourceDetailAPIProps {
  sName?: string;
  rName?: string;
  splat?: string;
}

export const useResourceDetailAPI = ({ sName, rName, splat }: UseResourceDetailAPIProps) => {
  const [loading, setLoading] = useState(true);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [currentResource, setCurrentResource] = useState<ResourceInfo | null>(null);
  const [subResources, setSubResources] = useState<ResourceInfo[]>([]);
  const [subResourceData, setSubResourceData] = useState<{ [key: string]: any[] }>({});
  const [error, setError] = useState<string | null>(null);

  // 获取 OpenAPI 服务
  const { service, isInitialized, apiConfig } = useOpenAPIService(sName);

  // 解析资源路径
  const { 
    currentResourceName, 
    parentContext, 
    resourceHierarchy 
  } = parseResourcePath(splat || '', rName || '');

  const currentLevel = resourceHierarchy[resourceHierarchy.length - 1];
  const currentItemId = currentLevel.itemId || '';
  const isSubResourceDetail = resourceHierarchy.length > 1;

  // 获取资源信息
  const { resource, allResources } = useResourceInfo(service, currentResourceName);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!service || !resource || !currentItemId) {
        throw new Error('Missing required parameters or service not initialized');
      }

      setCurrentResource(resource);
      
      // 查找 GET 单个资源的操作
      const getByIdOperation = resource.operations.find(op => 
        op.method.toLowerCase() === 'get' && 
        op.path.includes('{id}')
      );
      
      if (!getByIdOperation) {
        throw new Error(`No GET by ID operation found for resource ${resource.name}`);
      }

      // 使用新的 API 客户端获取资源详情
      try {
        const response = await service.getClient().getById(getByIdOperation, currentItemId);
        setCurrentItem(response.data);
      } catch (error) {
        console.error('Failed to load resource item:', error);
        throw new Error(`Failed to load resource item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 处理子资源
      if (resource.subResources && resource.subResources.length > 0) {
        console.log('Loading sub-resources for:', resource.name, 'sub_resources:', resource.subResources.map(sr => sr.name));
        setSubResources(resource.subResources);
        
        const subResourceDataMap: { [key: string]: any[] } = {};
        
        for (const subResource of resource.subResources) {
          try {
            console.log('Loading sub-resource:', subResource.name, 'path:', subResource.pathPattern, 'parentId:', currentItemId);
            
            // 查找子资源的 GET 列表操作
            const getListOperation = subResource.operations.find(op => 
              op.method.toLowerCase() === 'get' && 
              !op.path.includes('{id}')
            );
            
            if (getListOperation) {
              // 使用新的 API 客户端获取子资源列表
              const subResourceResponse = await service.getClient().getList(getListOperation, {
                query: { parentId: currentItemId },
                page: 1,
                pageSize: 10
              });
              
              console.log('Sub-resource response for', subResource.name, ':', subResourceResponse);
              subResourceDataMap[subResource.name] = subResourceResponse.data || [];
            } else {
              console.warn(`No list operation found for sub-resource ${subResource.name}`);
              subResourceDataMap[subResource.name] = [];
            }
          } catch (error) {
            console.warn(`Failed to load sub-resource ${subResource.name}:`, error);
            subResourceDataMap[subResource.name] = [];
          }
        }
        setSubResourceData(subResourceDataMap);
      } else {
        console.log('No sub-resources found for:', resource.name);
        setSubResources([]);
        setSubResourceData({});
      }
      
    } catch (error) {
      console.error('Failed to load resource detail:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && service && resource && currentItemId) {
      loadData();
    }
  }, [isInitialized, service, resource, currentItemId]);

  // 如果服务还没有初始化，显示加载状态
  if (!isInitialized) {
    return {
      loading: true,
      error: null,
      currentItem: null,
      currentResource: null,
      subResources: [],
      subResourceData: {},
      resourceHierarchy,
      currentResourceName,
      currentItemId,
      isSubResourceDetail,
      apiConfig,
      refetch: () => {}
    };
  }

  return {
    loading,
    error,
    currentItem,
    currentResource,
    subResources,
    subResourceData,
    resourceHierarchy,
    currentResourceName,
    currentItemId,
    isSubResourceDetail,
    apiConfig,
    refetch: loadData
  };
};
