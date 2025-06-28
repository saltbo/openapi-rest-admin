import type { APIConfig, OpenAPIAnalysis, ResourceDataItem, APIResponse, ParsedResource } from '../types/api';
import { API_CONFIGS, getAPIConfig, getEnabledAPIConfigs } from '../../config/apis';
import { openAPIParser } from './openapi-parser';
import { mockDataService } from './mock-data';

/**
 * 主要的 API 服务
 * 提供前端应用所需的所有 API 接口
 */
class APIService {
  private analysisCache = new Map<string, OpenAPIAnalysis>();

  /**
   * 获取所有 API 配置
   */
  async getAPIConfigs(): Promise<APIResponse<APIConfig[]>> {
    // 模拟网络延迟
    await this.delay(300);
    
    return {
      data: getEnabledAPIConfigs(),
      success: true
    };
  }

  /**
   * 获取单个 API 配置
   */
  async getAPIConfig(id: string): Promise<APIResponse<APIConfig>> {
    await this.delay(200);
    
    const config = getAPIConfig(id);
    if (!config) {
      throw new Error(`API configuration with id "${id}" not found`);
    }

    return {
      data: config,
      success: true
    };
  }

  /**
   * 解析 OpenAPI 文档
   */
  async getOpenAPIAnalysis(apiId: string): Promise<APIResponse<OpenAPIAnalysis>> {
    const config = getAPIConfig(apiId);
    if (!config) {
      throw new Error(`API configuration with id "${apiId}" not found`);
    }

    try {
      // 检查缓存
      if (this.analysisCache.has(apiId)) {
        return {
          data: this.analysisCache.get(apiId)!,
          success: true
        };
      }

      // 解析 OpenAPI 文档
      const analysis = await openAPIParser.parseOpenAPI(apiId, config.openapi_url);
      
      // 缓存结果
      this.analysisCache.set(apiId, analysis);
      
      return {
        data: analysis,
        success: true
      };
    } catch (error) {
      console.error(`Failed to parse OpenAPI for ${apiId}:`, error);
      throw error;
    }
  }

  /**
   * 获取资源数据列表
   */
  async getResourceData(
    apiId: string, 
    resourceId: string, 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<APIResponse<ResourceDataItem[]>> {
    await this.delay(500);

    try {
      // 获取 API 分析结果
      const analysisResponse = await this.getOpenAPIAnalysis(apiId);
      const analysis = analysisResponse.data;
      
      // 找到对应的资源
      const resource = analysis.resources.find(r => r.id === resourceId);
      if (!resource) {
        throw new Error(`Resource "${resourceId}" not found in API "${apiId}"`);
      }

      // 生成 Mock 数据
      const allData = mockDataService.generateMockData(resource, 50);
      
      // 返回分页数据
      return mockDataService.generatePaginatedResponse(allData, page, pageSize);
    } catch (error) {
      console.error(`Failed to get resource data for ${apiId}/${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * 获取API的所有资源列表
   */
  async getResources(apiId: string): Promise<ParsedResource[]> {
    try {
      // 获取 API 分析结果
      const analysisResponse = await this.getOpenAPIAnalysis(apiId);
      const analysis = analysisResponse.data;
      
      return analysis.resources;
    } catch (error) {
      console.error(`Failed to get resources for API ${apiId}:`, error);
      throw error;
    }
  }

  /**
   * 获取单个资源详情
   */
  async getResourceItem(
    apiId: string, 
    resourceId: string, 
    itemId: string | number
  ): Promise<APIResponse<ResourceDataItem>> {
    await this.delay(300);

    try {
      // 获取资源数据列表
      const listResponse = await this.getResourceData(apiId, resourceId, 1, 50);
      const items = listResponse.data;
      
      // 查找指定的项目
      const item = items.find(item => item.id.toString() === itemId.toString());
      if (!item) {
        throw new Error(`Item "${itemId}" not found in resource "${resourceId}"`);
      }

      return mockDataService.generateSingleResponse(item);
    } catch (error) {
      console.error(`Failed to get resource item for ${apiId}/${resourceId}/${itemId}:`, error);
      throw error;
    }
  }

  /**
   * 创建资源项目
   */
  async createResourceItem(
    apiId: string, 
    resourceId: string, 
    data: Partial<ResourceDataItem>
  ): Promise<APIResponse<ResourceDataItem>> {
    await this.delay(400);

    // 生成新的 ID
    const newId = Date.now();
    const newItem: ResourceDataItem = {
      id: newId,
      ...data
    };

    return mockDataService.generateSingleResponse(newItem);
  }

  /**
   * 更新资源项目
   */
  async updateResourceItem(
    apiId: string, 
    resourceId: string, 
    itemId: string | number,
    data: Partial<ResourceDataItem>
  ): Promise<APIResponse<ResourceDataItem>> {
    await this.delay(400);

    // 模拟更新
    const updatedItem: ResourceDataItem = {
      id: itemId,
      ...data
    };

    return mockDataService.generateSingleResponse(updatedItem);
  }

  /**
   * 删除资源项目
   */
  async deleteResourceItem(
    apiId: string, 
    resourceId: string, 
    itemId: string | number
  ): Promise<APIResponse<{ id: string | number }>> {
    await this.delay(300);

    return mockDataService.generateSingleResponse({ id: itemId });
  }

  /**
   * 搜索资源数据
   */
  async searchResourceData(
    apiId: string, 
    resourceId: string, 
    query: string,
    page: number = 1, 
    pageSize: number = 10
  ): Promise<APIResponse<ResourceDataItem[]>> {
    await this.delay(600);

    try {
      // 获取所有数据
      const allDataResponse = await this.getResourceData(apiId, resourceId, 1, 100);
      const allData = allDataResponse.data;
      
      // 简单的文本搜索
      const filteredData = allData.filter(item => {
        const searchableText = Object.values(item)
          .filter(value => typeof value === 'string' || typeof value === 'number')
          .join(' ')
          .toLowerCase();
        return searchableText.includes(query.toLowerCase());
      });

      return mockDataService.generatePaginatedResponse(filteredData, page, pageSize);
    } catch (error) {
      console.error(`Failed to search resource data for ${apiId}/${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.analysisCache.clear();
    openAPIParser.clearCache();
    mockDataService.clearCache();
  }

  /**
   * 清除解析器缓存
   */
  clearParserCache(apiId?: string): void {
    if (apiId) {
      this.analysisCache.delete(apiId);
      openAPIParser.clearCache(apiId);
    } else {
      this.analysisCache.clear();
      openAPIParser.clearCache();
    }
  }

  /**
   * 模拟网络延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const apiService = new APIService();
