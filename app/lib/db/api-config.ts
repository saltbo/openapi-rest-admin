import { prisma } from './connection';
import type { 
  APIConfig, 
  APIConfigModel, 
  CreateAPIConfigInput, 
  UpdateAPIConfigInput,
  APIResponse 
} from '../../types/api';

/**
 * API 配置数据库服务
 * 处理所有与 API 配置相关的数据库操作
 */
export class APIConfigService {
  
  /**
   * 获取所有 API 配置
   */
  async getAllConfigs(): Promise<APIConfig[]> {
    const configs = await prisma.aPIConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return configs.map(this.mapToAPIConfig);
  }

  /**
   * 获取启用的 API 配置
   */
  async getEnabledConfigs(): Promise<APIConfig[]> {
    const configs = await prisma.aPIConfig.findMany({
      where: { enabled: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return configs.map(this.mapToAPIConfig);
  }

  /**
   * 根据 ID 获取单个 API 配置
   */
  async getConfigById(id: string): Promise<APIConfig | null> {
    const config = await prisma.aPIConfig.findUnique({
      where: { id }
    });
    
    if (!config) {
      return null;
    }
    
    return this.mapToAPIConfig(config);
  }

  /**
   * 创建新的 API 配置
   */
  async createConfig(input: CreateAPIConfigInput): Promise<APIConfig> {
    const config = await prisma.aPIConfig.create({
      data: {
        id: input.id,
        name: input.name,
        description: input.description,
        openapiUrl: input.openapiUrl,
        enabled: input.enabled ?? true,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        version: input.version || null,
      }
    });
    
    return this.mapToAPIConfig(config);
  }

  /**
   * 更新 API 配置
   */
  async updateConfig(id: string, input: UpdateAPIConfigInput): Promise<APIConfig | null> {
    try {
      const config = await prisma.aPIConfig.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.openapiUrl !== undefined && { openapiUrl: input.openapiUrl }),
          ...(input.enabled !== undefined && { enabled: input.enabled }),
          ...(input.tags !== undefined && { tags: input.tags ? JSON.stringify(input.tags) : null }),
          ...(input.version !== undefined && { version: input.version }),
        }
      });
      
      return this.mapToAPIConfig(config);
    } catch (error: any) {
      if (error?.code === 'P2025') {
        // 记录未找到
        return null;
      }
      throw error;
    }
  }

  /**
   * 删除 API 配置
   */
  async deleteConfig(id: string): Promise<boolean> {
    try {
      await prisma.aPIConfig.delete({
        where: { id }
      });
      return true;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        // 记录未找到
        return false;
      }
      throw error;
    }
  }

  /**
   * 检查 API 配置是否存在
   */
  async configExists(id: string): Promise<boolean> {
    const count = await prisma.aPIConfig.count({
      where: { id }
    });
    return count > 0;
  }

  /**
   * 批量启用/禁用 API 配置
   */
  async updateMultipleConfigsStatus(ids: string[], enabled: boolean): Promise<number> {
    const result = await prisma.aPIConfig.updateMany({
      where: { id: { in: ids } },
      data: { enabled }
    });
    
    return result.count;
  }

  /**
   * 根据标签搜索 API 配置
   */
  async searchConfigsByTags(tags: string[]): Promise<APIConfig[]> {
    const configs = await prisma.aPIConfig.findMany({
      where: {
        OR: tags.map(tag => ({
          tags: { contains: tag }
        }))
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return configs.map(this.mapToAPIConfig);
  }

  /**
   * 获取配置统计信息
   */
  async getConfigStats(): Promise<{
    total: number;
    enabled: number;
    disabled: number;
  }> {
    const [total, enabled] = await Promise.all([
      prisma.aPIConfig.count(),
      prisma.aPIConfig.count({ where: { enabled: true } })
    ]);
    
    return {
      total,
      enabled,
      disabled: total - enabled
    };
  }

  /**
   * 将数据库模型映射为前端 API 配置
   */
  private mapToAPIConfig(model: APIConfigModel): APIConfig {
    return {
      id: model.id,
      name: model.name,
      description: model.description,
      openapi_url: model.openapiUrl,
      enabled: model.enabled,
      tags: model.tags ? JSON.parse(model.tags) : undefined,
      version: model.version || undefined,
    };
  }
}

// 导出单例实例
export const apiConfigService = new APIConfigService();
