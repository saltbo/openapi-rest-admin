import { useState, useEffect } from 'react';
import { parseResourcePath } from '~/utils/resourceRouting';
import { resourceManager } from '~/services/ResourceManager';
import { frontendAPIService } from '~/pages/api-explorer/services';
import { openAPIDocumentClient } from '~/lib/client';
import type { OpenAPIAnalysis, ParsedResource } from '~/types/api';

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
      const apiConfigs = await openAPIDocumentClient.getConfigs({ enabled: true });
      const apiConfig = apiConfigs.find((api: any) => 
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
      const resource = resourceManager.findByName(analysisResponse.data.resources, currentResourceName);
      console.log('Found resource:', resource?.name, 'ID:', resource?.id, 'sub_resources count:', resource?.sub_resources?.length);
      if (resource?.sub_resources) {
        console.log('Sub-resources:', resource.sub_resources.map((sr: ParsedResource) => ({ name: sr.name, id: sr.id, path: sr.path })));
      }
      if (!resource) {
        throw new Error(`Resource ${currentResourceName} not found`);
      }
      setCurrentResource(resource);
      
      // 加载当前资源项的详情
      const itemResponse = await frontendAPIService.getResource(apiConfig.id, currentResourceName, currentItemId);
      setCurrentItem(itemResponse.data);
      
      // 加载子资源数据
      if (resource.sub_resources && resource.sub_resources.length > 0) {
        console.log('Loading sub-resources for:', resource.name, 'sub_resources:', resource.sub_resources.map((sr: ParsedResource) => sr.name));
        setSubResources(resource.sub_resources);
        
        const subResourceDataMap: { [key: string]: ResourceItem[] } = {};
        for (const subResource of resource.sub_resources) {
          try {
            console.log('Loading sub-resource:', subResource.name, 'path:', subResource.path, 'parentId:', currentItemId);
            const subResourceResponse = await frontendAPIService.listResources(
              apiConfig.id, 
              subResource.name, 
              1, 
              10,
              '', // searchQuery
              currentItemId, // parentId for nested resources
              subResource // pass the actual sub-resource object
            );
            console.log('Sub-resource response for', subResource.name, ':', subResourceResponse);
            subResourceDataMap[subResource.name] = subResourceResponse.data;
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
