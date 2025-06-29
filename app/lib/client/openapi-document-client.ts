import { BaseHTTPClient } from './base-client';
import type { APIResponse } from './base-client';
import type { OpenAPIDocument, CreateOpenAPIDocumentInput, UpdateOpenAPIDocumentInput } from '~/types/api';

/**
 * OpenAPI 文档配置客户端
 * 统一处理 OpenAPI 文档配置相关的 HTTP 请求
 */
export class OpenAPIDocumentClient extends BaseHTTPClient {
  constructor(baseUrl: string = '/api') {
    super(baseUrl);
  }

  /**
   * 获取所有 OpenAPI 文档配置
   */
  async getConfigs(params?: { enabled?: boolean }): Promise<OpenAPIDocument[]> {
    return this.get<OpenAPIDocument[]>('/configs', params);
  }

  /**
   * 获取单个 OpenAPI 文档配置
   */
  async getConfig(id: string): Promise<OpenAPIDocument> {
    try {
      console.log(`[OpenAPIDocumentClient] 请求配置: ${id}`);
      const result = await this.get<OpenAPIDocument>(`/configs/${id}`);
      console.log(`[OpenAPIDocumentClient] 返回数据:`, result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error(`OpenAPI document configuration '${id}' not found`);
      }
      throw error;
    }
  }

  /**
   * 创建 OpenAPI 文档配置
   */
  async createConfig(data: CreateOpenAPIDocumentInput): Promise<OpenAPIDocument> {
    return this.post<OpenAPIDocument>('/configs', data);
  }

  /**
   * 更新 OpenAPI 文档配置
   */
  async updateConfig(id: string, data: UpdateOpenAPIDocumentInput): Promise<OpenAPIDocument> {
    return this.put<OpenAPIDocument>(`/configs/${id}`, data);
  }

  /**
   * 删除 API 配置
   */
  async deleteConfig(id: string): Promise<void> {
    return this.delete<void>(`/configs/${id}`);
  }

  /**
   * 批量更新状态
   */
  async batchUpdateStatus(ids: string[], enabled: boolean): Promise<{ updatedCount: number }> {
    return this.patch<{ updatedCount: number }>('/configs', {
      action: 'updateStatus',
      ids,
      data: { enabled }
    });
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<any> {
    return this.get<any>('/stats');
  }

  /**
   * 搜索 OpenAPI 文档配置
   */
  async searchConfigs(query: string, params?: Record<string, any>): Promise<OpenAPIDocument[]> {
    return this.get<OpenAPIDocument[]>('/search', { q: query, ...params });
  }
}

// 导出单例实例
export const openAPIDocumentClient = new OpenAPIDocumentClient();
