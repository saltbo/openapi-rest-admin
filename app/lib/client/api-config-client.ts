import { BaseHTTPClient } from './base-client';
import type { APIResponse } from './base-client';
import type { APIConfig, CreateAPIConfigInput, UpdateAPIConfigInput } from '~/types/api';

/**
 * API 配置客户端
 * 统一处理 API 配置相关的 HTTP 请求
 */
export class APIConfigClient extends BaseHTTPClient {
  constructor(baseUrl: string = '/api') {
    super(baseUrl);
  }

  /**
   * 获取所有 API 配置
   */
  async getConfigs(params?: { enabled?: boolean }): Promise<APIConfig[]> {
    return this.get<APIConfig[]>('/configs', params);
  }

  /**
   * 获取单个 API 配置
   */
  async getConfig(id: string): Promise<APIConfig> {
    try {
      console.log(`[APIConfigClient] 请求配置: ${id}`);
      const result = await this.get<APIConfig>(`/configs/${id}`);
      console.log(`[APIConfigClient] 返回数据:`, result);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error(`API configuration '${id}' not found`);
      }
      throw error;
    }
  }

  /**
   * 创建 API 配置
   */
  async createConfig(data: CreateAPIConfigInput): Promise<APIConfig> {
    return this.post<APIConfig>('/configs', data);
  }

  /**
   * 更新 API 配置
   */
  async updateConfig(id: string, data: UpdateAPIConfigInput): Promise<APIConfig> {
    return this.put<APIConfig>(`/configs/${id}`, data);
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
   * 搜索 API 配置
   */
  async searchConfigs(query: string, params?: Record<string, any>): Promise<APIConfig[]> {
    return this.get<APIConfig[]>('/search', { q: query, ...params });
  }
}

// 导出单例实例
export const apiConfigClient = new APIConfigClient();
