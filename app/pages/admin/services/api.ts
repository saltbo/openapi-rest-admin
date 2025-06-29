import type { APIConfig, CreateAPIConfigInput, UpdateAPIConfigInput, APIResponse } from '../../../types/api';
import { apiConfigService } from '../../../lib/db';

/**
 * 后端 API 服务
 * 仅在服务器端使用，负责数据库操作和业务逻辑
 * 不包含前端的 OpenAPI 解析和 Mock 数据生成
 */
class APIService {

  /**
   * 获取所有 API 配置
   */
  async getAPIConfigs(): Promise<APIResponse<APIConfig[]>> {
    try {
      const configs = await apiConfigService.getEnabledConfigs();
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
      const config = await apiConfigService.getConfigById(id);
      if (!config) {
        throw new Error(`API configuration with id "${id}" not found`);
      }

      return {
        data: config,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to fetch API configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 更新 API 配置
   */
  async updateAPIConfig(id: string, updates: UpdateAPIConfigInput): Promise<APIResponse<APIConfig>> {
    try {
      const updatedConfig = await apiConfigService.updateConfig(id, updates);
      if (!updatedConfig) {
        throw new Error(`API configuration with id "${id}" not found`);
      }
      
      return {
        data: updatedConfig,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to update API configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 删除 API 配置
   */
  async deleteAPIConfig(id: string): Promise<APIResponse<void>> {
    try {
      const deleted = await apiConfigService.deleteConfig(id);
      if (!deleted) {
        throw new Error(`API configuration with id "${id}" not found`);
      }
      
      return {
        data: undefined,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to delete API configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 创建新的 API 配置
   */
  async createAPIConfig(input: CreateAPIConfigInput): Promise<APIResponse<APIConfig>> {
    try {
      const newConfig = await apiConfigService.createConfig(input);
      return {
        data: newConfig,
        success: true
      };
    } catch (error) {
      throw new Error(`Failed to create API configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取配置统计信息
   */
  async getConfigStats() {
    try {
      return await apiConfigService.getConfigStats();
    } catch (error) {
      throw new Error(`Failed to get config stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// 导出单例实例
export const apiService = new APIService();
