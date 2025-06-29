import type { OpenAPIAnalysis, ResourceDataItem, APIResponse } from '~/types/api';
import { openAPIDocumentClient } from '~/lib/client';
import { BaseHTTPClient } from '~/lib/client/base-client';
import { openAPIParser } from '~/services';
import { resourceManager } from '~/services';

/**
 * 前端 API 客户端
 * 专注于业务逻辑处理，通过 openAPIDocumentClient 与后端通信
 * 继承自 BaseHTTPClient 来发起真实的 API 请求
 */
class FrontendAPIService extends BaseHTTPClient {
  private analysisCache = new Map<string, OpenAPIAnalysis>();

  constructor() {
    // 初始化时不设置 baseUrl，因为每个 API 都有不同的 baseUrl
    super();
    // 强制清除缓存以确保使用最新的解析逻辑
    this.analysisCache.clear();
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
    pageSize: number = 10,
    searchQuery: string = '',
    parentId?: string, // 父资源ID，用于嵌套资源
    resourceReference?: any // 直接传递资源对象，避免查找错误
  ): Promise<APIResponse<ResourceDataItem[]>> {
    try {
      console.log('listResources called with:', { apiId, resourceName, parentId, hasResourceReference: !!resourceReference });
      
      let resource: any;
      let analysisResponse: any;

      if (resourceReference) {
        // 如果直接提供了资源引用，使用它
        resource = resourceReference;
        console.log('Using provided resource reference:', resource.name, 'path:', resource.path);
        // 仍然需要获取分析数据来获取base_url
        analysisResponse = await this.getOpenAPIAnalysis(apiId);
      } else {
        // 原有的查找逻辑
        const result = await this.getValidatedResource(apiId, resourceName);
        analysisResponse = result.analysisResponse;
        resource = result.resource;
        console.log('Found resource via search:', resource.name, 'path:', resource.path);
      }
      
      // 验证操作支持
      this.validateOperation(resource, 'GET', resourceName);

      // 构建请求URL - 对于嵌套资源使用parentId
      const requestUrl = this.buildRequestUrl(analysisResponse.data.base_url, resource.path, parentId);
      console.log('Built request URL:', requestUrl);
      
      // 添加分页参数（如果API支持）
      const getOperation = resource.operations.get;
      const queryParams: Record<string, any> = {};
      
      // 检查API是否支持分页参数
      if (getOperation.parameters) {
        const pageParam = getOperation.parameters.find((p: any) => 
          p.in === 'query' && (p.name === 'page' || p.name === 'offset' || p.name === 'pageNumber')
        );
        const sizeParam = getOperation.parameters.find((p: any) => 
          p.in === 'query' && (p.name === 'size' || p.name === 'limit' || p.name === 'pageSize')
        );
        
        if (pageParam) {
          queryParams[pageParam.name] = page;
        }
        if (sizeParam) {
          queryParams[sizeParam.name] = pageSize;
        }
      }

      // 使用 BaseHTTPClient 的 get 方法发起请求
      const data = await this.get<any>(requestUrl, queryParams);
      
      // 处理响应数据格式
      let items: ResourceDataItem[] = [];
      
      if (Array.isArray(data)) {
        items = data;
      } else if (data.data && Array.isArray(data.data)) {
        items = data.data;
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
      } else if (data.results && Array.isArray(data.results)) {
        items = data.results;
      } else {
        // 如果响应不是数组格式，将其包装为数组
        items = [data];
      }

      return {
        data: items,
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
      // 获取和验证资源
      const { analysisResponse, resource } = await this.getValidatedResource(apiId, resourceName);
      
      // 验证操作支持
      this.validateOperation(resource, 'GET', resourceName);

      // 构建请求URL（包含itemId）
      const requestUrl = this.buildRequestUrl(analysisResponse.data.base_url, resource.path, itemId);

      // 使用 BaseHTTPClient 的 get 方法发起请求
      const data = await this.get<any>(requestUrl);
      
      return {
        data: data || {},
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to get resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 创建新资源
   */
  async createResource(
    apiId: string, 
    resourceName: string, 
    data: any
  ): Promise<APIResponse<ResourceDataItem>> {
    try {
      // 获取和验证资源
      const { analysisResponse, resource } = await this.getValidatedResource(apiId, resourceName);
      
      // 验证操作支持
      this.validateOperation(resource, 'POST', resourceName);

      // 构建请求URL
      const requestUrl = this.buildRequestUrl(analysisResponse.data.base_url, resource.path);

      // 使用 BaseHTTPClient 的 post 方法发起请求
      const responseData = await this.post<any>(requestUrl, data);
      
      return {
        data: responseData || {},
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to create resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 更新资源
   */
  async updateResource(
    apiId: string, 
    resourceName: string, 
    itemId: string,
    data: any
  ): Promise<APIResponse<ResourceDataItem>> {
    try {
      // 获取和验证资源
      const { analysisResponse, resource } = await this.getValidatedResource(apiId, resourceName);
      
      // 检查是否有PUT或PATCH操作
      const method = resource.operations.put ? 'PUT' : resource.operations.patch ? 'PATCH' : null;
      if (!method) {
        throw new Error(`Resource '${resourceName}' does not support PUT or PATCH operation`);
      }

      // 构建请求URL（包含itemId）
      const requestUrl = this.buildRequestUrl(analysisResponse.data.base_url, resource.path, itemId);

      // 使用 BaseHTTPClient 的相应方法发起请求
      let responseData;
      if (method === 'PUT') {
        responseData = await this.put<any>(requestUrl, data);
      } else {
        responseData = await this.patch<any>(requestUrl, data);
      }
      
      return {
        data: responseData || {},
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to update resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 删除资源
   */
  async deleteResource(
    apiId: string, 
    resourceName: string, 
    itemId: string
  ): Promise<APIResponse<boolean>> {
    try {
      // 获取和验证资源
      const { analysisResponse, resource } = await this.getValidatedResource(apiId, resourceName);
      
      // 验证操作支持
      this.validateOperation(resource, 'DELETE', resourceName);

      // 构建请求URL（包含itemId）
      const requestUrl = this.buildRequestUrl(analysisResponse.data.base_url, resource.path, itemId);

      // 使用 BaseHTTPClient 的 delete 方法发起请求
      await this.delete(requestUrl);

      return {
        data: true,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to delete resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取和验证资源
   */
  private async getValidatedResource(apiId: string, resourceName: string) {
    // 分析 API 获取资源定义
    const analysisResponse = await this.getOpenAPIAnalysis(apiId);
    const resource = resourceManager.findByName(analysisResponse.data.resources, resourceName);
    
    if (!resource) {
      throw new Error(`Resource '${resourceName}' not found in API '${apiId}'`);
    }

    return { analysisResponse, resource };
  }

  /**
   * 构建请求URL
   */
  private buildRequestUrl(baseUrl: string, resourcePath: string, itemId?: string): string {
    let finalPath = resourcePath;
    
    // 如果提供了itemId，替换路径参数
    if (itemId) {
      if (finalPath.includes('{id}')) {
        finalPath = finalPath.replace('{id}', itemId);
      } else if (finalPath.includes(':id')) {
        finalPath = finalPath.replace(':id', itemId);
      } else {
        // 如果路径中没有ID参数，直接添加到路径末尾
        finalPath = finalPath.endsWith('/') ? `${finalPath}${itemId}` : `${finalPath}/${itemId}`;
      }
    }
    
    return `${baseUrl}${finalPath}`;
  }

  /**
   * 验证资源操作支持
   */
  private validateOperation(resource: any, operation: string, resourceName: string): void {
    if (!resource.operations[operation.toLowerCase()]) {
      throw new Error(`Resource '${resourceName}' does not support ${operation.toUpperCase()} operation`);
    }
  }

  /**
   * 清除分析缓存
   */
  clearAnalysisCache(apiId?: string): void {
    if (apiId) {
      this.analysisCache.delete(apiId);
    } else {
      this.analysisCache.clear();
    }
    // 同时清除解析器缓存
    openAPIParser.clearCache(apiId);
  }
}

// 导出单例实例
export const frontendAPIService = new FrontendAPIService();
