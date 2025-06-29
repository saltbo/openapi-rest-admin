import type { OpenAPIAnalysis, ResourceDataItem, APIResponse } from '~/types/api';
import { openAPIDocumentClient } from '~/lib/client';
import { openAPIParser, mockDataService } from './';

/**
 * 前端 API 客户端
 * 专注于业务逻辑处理，通过 openAPIDocumentClient 与后端通信
 */
class FrontendAPIService {
  private analysisCache = new Map<string, OpenAPIAnalysis>();

  /**
   * 递归查找资源（包括嵌套资源）
   */
  private findResourceByName(resources: any[], resourceName: string): any | null {
    for (const resource of resources) {
      if (resource.name === resourceName) {
        return resource;
      }
      
      // 递归查找子资源
      if (resource.sub_resources && resource.sub_resources.length > 0) {
        const found = this.findResourceByName(resource.sub_resources, resourceName);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * 获取 OpenAPI 分析结果
   */
  async getOpenAPIAnalysis(apiId: string): Promise<APIResponse<OpenAPIAnalysis>> {
    // 检查缓存
    if (this.analysisCache.has(apiId)) {
      const cached = this.analysisCache.get(apiId);
      if (cached) {
        return {
          data: cached,
          success: true
        };
      }
    }

    try {
      // 获取 API 配置
      const config = await openAPIDocumentClient.getConfig(apiId);
      
      // 解析 OpenAPI 文档
      const analysis = await openAPIParser.parseOpenAPI(apiId, config.openapi_url);
      
      // 缓存结果
      this.analysisCache.set(apiId, analysis);
      
      return {
        data: analysis,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to get OpenAPI analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 列出资源数据
   */
  async listResources(
    apiId: string, 
    resourceName: string, 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<APIResponse<ResourceDataItem[]>> {
    try {
      // 分析 API 获取资源定义
      const analysisResponse = await this.getOpenAPIAnalysis(apiId);
      const resource = this.findResourceByName(analysisResponse.data.resources, resourceName);
      
      if (!resource) {
        throw new Error(`Resource '${resourceName}' not found in API '${apiId}'`);
      }

      // 目前直接使用模拟数据
      const mockData = mockDataService.generateMockData(resource, pageSize);
      return {
        data: mockData,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to list resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取单个资源
   */
  async getResource(
    apiId: string, 
    resourceName: string, 
    itemId: string
  ): Promise<APIResponse<ResourceDataItem>> {
    try {
      // 分析 API 获取资源定义
      const analysisResponse = await this.getOpenAPIAnalysis(apiId);
      const resource = this.findResourceByName(analysisResponse.data.resources, resourceName);
      
      if (!resource) {
        throw new Error(`Resource '${resourceName}' not found in API '${apiId}'`);
      }

      // 目前直接使用模拟数据
      const mockData = mockDataService.generateMockData(resource, 1)[0];
      if (mockData) {
        // 设置请求的 ID
        mockData.id = itemId;
      }
      
      return {
        data: mockData || {},
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to get resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// 导出单例实例
export const frontendAPIService = new FrontendAPIService();
