import type { APIConfig, OpenAPIAnalysis, ResourceDataItem, APIResponse, ParsedResource } from '../../../types/api';
import { openAPIParser, mockDataService } from './';

/**
 * 前端 API 客户端
 * 通过 HTTP 请求与后端 API 通信，不直接访问数据库
 */
class FrontendAPIService {
  private analysisCache = new Map<string, OpenAPIAnalysis>();
  private baseUrl = '';

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
   * 获取所有启用的 API 配置
   */
  async getAPIConfigs(): Promise<APIResponse<APIConfig[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/configs?enabled=true`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const configs = await response.json();
      return {
        data: configs,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to fetch API configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取单个 API 配置
   */
  async getAPIConfig(id: string): Promise<APIResponse<APIConfig>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/configs/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`API configuration '${id}' not found`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const config = await response.json();
      return {
        data: config,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to fetch API configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 分析 OpenAPI 文档并缓存结果
   */
  async analyzeOpenAPI(apiId: string): Promise<OpenAPIAnalysis> {
    // 检查缓存
    if (this.analysisCache.has(apiId)) {
      const cached = this.analysisCache.get(apiId);
      if (cached) return cached;
    }

    try {
      // 获取 API 配置
      const configResponse = await this.getAPIConfig(apiId);
      const config = configResponse.data;

      // 解析 OpenAPI 文档
      const analysis = await openAPIParser.parseOpenAPI(apiId, config.openapi_url);
      
      // 缓存结果
      this.analysisCache.set(apiId, analysis);
      
      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze OpenAPI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取资源列表数据
   */
  async getResourceData(
    apiId: string, 
    resourceName: string, 
    params?: Record<string, any>
  ): Promise<APIResponse<ResourceDataItem[]>> {
    try {
      // 分析 API 获取资源定义
      const analysis = await this.analyzeOpenAPI(apiId);
      const resource = this.findResourceByName(analysis.resources, resourceName);
      
      if (!resource) {
        throw new Error(`Resource '${resourceName}' not found in API '${apiId}'`);
      }

      // 如果有真实的 API 端点，可以在这里添加逻辑
      // 目前直接使用模拟数据
      const mockData = mockDataService.generateMockData(resource, 10);
      return {
        data: mockData,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to get resource data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取单个资源项详情
   */
  async getResourceItem(
    apiId: string, 
    resourceName: string, 
    itemId: string
  ): Promise<APIResponse<ResourceDataItem>> {
    try {
      // 分析 API 获取资源定义
      const analysis = await this.analyzeOpenAPI(apiId);
      const resource = this.findResourceByName(analysis.resources, resourceName);
      
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
      throw new Error(`Failed to get resource item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取嵌套资源数据
   */
  async getNestedResourceData(
    apiId: string,
    parentResource: string,
    parentId: string,
    childResource: string,
    params?: Record<string, any>
  ): Promise<APIResponse<ResourceDataItem[]>> {
    try {
      // 分析 API 获取资源定义
      const analysis = await this.analyzeOpenAPI(apiId);
      // 查找嵌套资源（简化实现）
      const resource = this.findResourceByName(analysis.resources, childResource);
      
      if (!resource) {
        throw new Error(`Nested resource '${childResource}' under '${parentResource}' not found in API '${apiId}'`);
      }

      // 生成模拟数据（实际实现中可以调用真实 API）
      const mockData = mockDataService.generateMockData(resource, 5);
      return {
        data: mockData,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to get nested resource data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取 OpenAPI 分析结果（兼容原 apiService 接口）
   */
  async getOpenAPIAnalysis(apiId: string): Promise<APIResponse<OpenAPIAnalysis>> {
    try {
      const analysis = await this.analyzeOpenAPI(apiId);
      return {
        data: analysis,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to get OpenAPI analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 列出资源数据（兼容原 apiService 接口）
   */
  async listResources(
    apiId: string, 
    resourceName: string, 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<APIResponse<ResourceDataItem[]>> {
    try {
      // 调用内部 getResourceData 方法
      const result = await this.getResourceData(apiId, resourceName, { page, pageSize });
      return result;
    } catch (error) {
      throw new Error(`Failed to list resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取单个资源（兼容原 apiService 接口）
   */
  async getResource(
    apiId: string, 
    resourceName: string, 
    itemId: string
  ): Promise<APIResponse<ResourceDataItem>> {
    try {
      // 调用内部 getResourceItem 方法
      const result = await this.getResourceItem(apiId, resourceName, itemId);
      return result;
    } catch (error) {
      throw new Error(`Failed to get resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 搜索资源数据（兼容原 apiService 接口）
   */
  async searchResources(
    apiId: string, 
    resourceName: string, 
    searchQuery: string,
    page: number = 1, 
    pageSize: number = 10
  ): Promise<APIResponse<ResourceDataItem[]>> {
    try {
      // 调用内部 getResourceData 方法，添加搜索参数
      const result = await this.getResourceData(apiId, resourceName, { 
        page, 
        pageSize, 
        search: searchQuery 
      });
      
      // 简单的客户端搜索过滤（实际应该在服务端处理）
      if (searchQuery && result.data) {
        const filteredData = result.data.filter((item: any) => {
          return Object.values(item).some((value: any) => 
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
          );
        });
        result.data = filteredData;
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to search resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 清除分析缓存
   */
  clearCache(apiId?: string): void {
    if (apiId) {
      this.analysisCache.delete(apiId);
    } else {
      this.analysisCache.clear();
    }
  }
}

// 导出单例实例
export const frontendAPIService = new FrontendAPIService();
