import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { frontendAPIService } from '~/pages/api-explorer/services';
import { openAPIDocumentClient } from '~/lib/client';
import type { OpenAPIAnalysis } from '~/types/api';

/**
 * 获取 API 配置的自定义 hook
 */
export function useAPIConfig(serviceName: string | undefined) {
  return useQuery({
    queryKey: ['apiConfig', serviceName],
    queryFn: () => openAPIDocumentClient.getConfig(serviceName!),
    enabled: !!serviceName,
  });
}

/**
 * 获取 API 分析结果的自定义 hook
 */
export function useAPIAnalysis(serviceName: string | undefined) {
  return useQuery({
    queryKey: ['openApiAnalysis', serviceName],
    queryFn: () => frontendAPIService.getOpenAPIAnalysis(serviceName!).then(res => res.data),
    enabled: !!serviceName,
  });
}

/**
 * 获取资源数据的自定义 hook
 */
export function useResourceData(
  serviceName: string | undefined,
  resourceName: string | undefined,
  currentPage: number = 1,
  pageSize: number = 10,
  searchQuery: string = '',
  nestedPath?: string
) {
  return useQuery({
    queryKey: ['resourceData', serviceName, resourceName, currentPage, pageSize, searchQuery, nestedPath],
    queryFn: () => {
      return frontendAPIService.listResources(serviceName!, resourceName!, currentPage, pageSize);
    },
    enabled: !!serviceName && !!resourceName,
  });
}

/**
 * 获取单个资源详情的自定义 hook
 */
export function useResourceDetail(
  serviceName: string | undefined,
  resourceName: string | undefined,
  itemId: string | undefined
) {
  return useQuery({
    queryKey: ['resourceDetail', serviceName, resourceName, itemId],
    queryFn: () => frontendAPIService.getResource(serviceName!, resourceName!, itemId!),
    enabled: !!serviceName && !!resourceName && !!itemId,
  });
}

/**
 * 组合 hook：获取服务的基础信息（配置 + 分析）
 */
export function useServiceData(serviceName: string | undefined) {
  const apiConfigQuery = useAPIConfig(serviceName);
  const analysisQuery = useAPIAnalysis(serviceName);
  
  return {
    apiConfig: apiConfigQuery.data,
    analysis: analysisQuery.data,
    isLoading: apiConfigQuery.isLoading || analysisQuery.isLoading,
    error: apiConfigQuery.error || analysisQuery.error,
    refetch: () => {
      apiConfigQuery.refetch();
      analysisQuery.refetch();
    }
  };
}

/**
 * ResourceDetail 页面专用的数据加载 hook
 */
export function useResourceDetailData(
  serviceName: string | undefined,
  resourceName: string | undefined,
  itemId: string | undefined
) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<OpenAPIAnalysis | null>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [currentResource, setCurrentResource] = useState<any>(null);
  const [subResources, setSubResources] = useState<any[]>([]);
  const [subResourceData, setSubResourceData] = useState<{ [key: string]: any[] }>({});
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!serviceName || !resourceName || !itemId) {
        console.error('Missing required parameters');
        return;
      }
      
      // 获取API配置
      const apiConfigs = await openAPIDocumentClient.getConfigs({ enabled: true });
      
      const apiConfig = apiConfigs.find((api: any) => 
        api.name === serviceName || 
        api.id === serviceName ||
        api.name.toLowerCase().replace(/\s+/g, '-') === serviceName.toLowerCase() ||
        api.name.toLowerCase().replace(/\s+/g, '') === serviceName.toLowerCase()
      );
      
      if (!apiConfig) {
        throw new Error(`Service ${serviceName} not found`);
      }
      
      // 获取分析数据
      const analysisResponse = await frontendAPIService.getOpenAPIAnalysis(apiConfig.id);
      setAnalysis(analysisResponse.data);
      
      // 使用工具函数查找当前资源
      const { findResourceInAll } = await import('~/utils/resourceUtils');
      const resource = findResourceInAll(analysisResponse.data.resources, resourceName);
      if (!resource) {
        throw new Error(`Resource ${resourceName} not found`);
      }
      setCurrentResource(resource);
      
      // 加载当前资源项的详情
      const itemResponse = await frontendAPIService.getResource(apiConfig.id, resourceName, itemId);
      setCurrentItem(itemResponse.data);
      
      // 处理子资源数据
      if (resource.sub_resources && resource.sub_resources.length > 0) {
        setSubResources(resource.sub_resources);
        
        // 并行加载所有子资源的数据
        const subResourceDataMap: { [key: string]: any[] } = {};
        const subResourcePromises = resource.sub_resources.map(async (subResource: any) => {
          try {
            const subDataResponse = await frontendAPIService.listResources(apiConfig.id, subResource.name, 1, 10);
            subResourceDataMap[subResource.name] = subDataResponse.data || [];
          } catch (error) {
            console.warn(`Failed to load sub-resource ${subResource.name}:`, error);
            subResourceDataMap[subResource.name] = [];
          }
        });
        
        await Promise.all(subResourcePromises);
        setSubResourceData(subResourceDataMap);
      } else {
        setSubResources([]);
        setSubResourceData({});
      }
      
    } catch (error) {
      console.error('Failed to load resource detail:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    analysis,
    currentItem,
    currentResource,
    subResources,
    subResourceData,
    error,
    loadData,
    setAnalysis,
    setCurrentItem,
    setCurrentResource,
    setSubResources,
    setSubResourceData,
    setLoading
  };
}
