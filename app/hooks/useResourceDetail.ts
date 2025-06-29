import { useState, useEffect } from 'react';
import { parseResourcePath } from '../utils/resourceRouting';
import { findResourceInAll } from '../utils/resourceUtils';
import { frontendAPIService } from '../pages/api-explorer/services';
import type { OpenAPIAnalysis, ParsedResource } from '../types/api';

interface ResourceItem {
  id: string | number;
  [key: string]: any;
}

interface UseResourceDetailProps {
  sName?: string;
  rName?: string;
  splat?: string;
}

export const useResourceDetail = ({ sName, rName, splat }: UseResourceDetailProps) => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<OpenAPIAnalysis | null>(null);
  const [currentItem, setCurrentItem] = useState<ResourceItem | null>(null);
  const [currentResource, setCurrentResource] = useState<ParsedResource | null>(null);
  const [subResources, setSubResources] = useState<ParsedResource[]>([]);
  const [subResourceData, setSubResourceData] = useState<{ [key: string]: ResourceItem[] }>({});
  const [error, setError] = useState<string | null>(null);

  // 解析资源路径
  const { 
    currentResourceName, 
    parentContext, 
    resourceHierarchy 
  } = parseResourcePath(splat || '', rName || '');

  const currentLevel = resourceHierarchy[resourceHierarchy.length - 1];
  const currentItemId = currentLevel.itemId || '';
  const isSubResourceDetail = resourceHierarchy.length > 1;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!sName || !currentResourceName || !currentItemId) {
        throw new Error('Missing required parameters');
      }
      
      // 获取API配置
      const apiConfigsResponse = await frontendAPIService.getAPIConfigs();
      const apiConfig = apiConfigsResponse.data.find((api: any) => 
        api.name === sName || 
        api.id === sName ||
        api.name.toLowerCase().replace(/\s+/g, '-') === sName.toLowerCase() ||
        api.name.toLowerCase().replace(/\s+/g, '') === sName.toLowerCase()
      );
      
      if (!apiConfig) {
        throw new Error(`Service ${sName} not found`);
      }
      
      // 获取分析数据
      const analysisResponse = await frontendAPIService.getOpenAPIAnalysis(apiConfig.id);
      setAnalysis(analysisResponse.data);
      
      // 查找当前资源
      const resource = findResourceInAll(analysisResponse.data.resources, currentResourceName);
      if (!resource) {
        throw new Error(`Resource ${currentResourceName} not found`);
      }
      setCurrentResource(resource);
      
      // 加载当前资源项的详情
      const itemResponse = await frontendAPIService.getResource(apiConfig.id, currentResourceName, currentItemId);
      setCurrentItem(itemResponse.data);
      
      // 加载子资源数据
      if (resource.sub_resources && resource.sub_resources.length > 0) {
        setSubResources(resource.sub_resources);
        
        const subResourceDataMap: { [key: string]: ResourceItem[] } = {};
        for (const subResource of resource.sub_resources) {
          const subResourceResponse = await frontendAPIService.listResources(
            apiConfig.id, 
            subResource.name, 
            1, 
            10
          );
          subResourceDataMap[subResource.name] = subResourceResponse.data;
        }
        setSubResourceData(subResourceDataMap);
      } else {
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
    if (sName && currentResourceName && currentItemId) {
      loadData();
    }
  }, [sName, currentResourceName, currentItemId]);

  return {
    loading,
    error,
    analysis,
    currentItem,
    currentResource,
    subResources,
    subResourceData,
    resourceHierarchy,
    currentResourceName,
    currentItemId,
    isSubResourceDetail,
    refetch: loadData
  };
};
