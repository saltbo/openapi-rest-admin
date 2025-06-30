import { prisma } from './connection';
import type { 
  OpenAPIDocument, 
  OpenAPIDocumentModel, 
  CreateOpenAPIDocumentInput, 
  UpdateOpenAPIDocumentInput,
} from '../../types/api';

/**
 * OpenAPI 文档数据库服务
 * 处理所有与 OpenAPI 文档相关的数据库操作
 */
export class OpenAPIDocumentService {
  
  /**
   * 获取所有 OpenAPI 文档配置
   */
  async getAllConfigs(): Promise<OpenAPIDocument[]> {
    const configs = await prisma.openAPIDocument.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return configs.map(this.mapToOpenAPIDocument);
  }

  /**
   * 获取启用的 OpenAPI 文档配置
   */
  async getEnabledConfigs(): Promise<OpenAPIDocument[]> {
    const configs = await prisma.openAPIDocument.findMany({
      where: { enabled: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return configs.map(this.mapToOpenAPIDocument);
  }

  /**
   * 根据 ID 获取单个 OpenAPI 文档配置
   */
  async getConfigById(id: string): Promise<OpenAPIDocument | null> {
    const config = await prisma.openAPIDocument.findUnique({
      where: { id }
    });
    
    if (!config) {
      return null;
    }
    
    return this.mapToOpenAPIDocument(config);
  }

  /**
   * 创建新的 OpenAPI 文档配置
   */
  async createConfig(input: CreateOpenAPIDocumentInput): Promise<OpenAPIDocument> {
    const config = await prisma.openAPIDocument.create({
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
    
    return this.mapToOpenAPIDocument(config);
  }

  /**
   * 更新 OpenAPI 文档配置
   */
  async updateConfig(id: string, input: UpdateOpenAPIDocumentInput): Promise<OpenAPIDocument | null> {
    try {
      const config = await prisma.openAPIDocument.update({
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
      
      return this.mapToOpenAPIDocument(config);
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
      await prisma.openAPIDocument.delete({
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
    const count = await prisma.openAPIDocument.count({
      where: { id }
    });
    return count > 0;
  }

  /**
   * 批量启用/禁用 API 配置
   */
  async updateMultipleConfigsStatus(ids: string[], enabled: boolean): Promise<number> {
    const result = await prisma.openAPIDocument.updateMany({
      where: { id: { in: ids } },
      data: { enabled }
    });
    
    return result.count;
  }

  /**
   * 根据标签搜索 OpenAPI 文档配置
   */
  async searchConfigsByTags(tags: string[]): Promise<OpenAPIDocument[]> {
    const configs = await prisma.openAPIDocument.findMany({
      where: {
        OR: tags.map(tag => ({
          tags: { contains: tag }
        }))
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return configs.map(this.mapToOpenAPIDocument);
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
      prisma.openAPIDocument.count(),
      prisma.openAPIDocument.count({ where: { enabled: true } })
    ]);
    
    return {
      total,
      enabled,
      disabled: total - enabled
    };
  }

  /**
   * 将数据库模型映射为前端 OpenAPI 文档配置
   */
  private mapToOpenAPIDocument(model: OpenAPIDocumentModel): OpenAPIDocument {
    return {
      id: model.id,
      name: model.name,
      description: model.description,
      openapi_url: model.openapiUrl,
      enabled: model.enabled,
      tags: model.tags ? JSON.parse(model.tags) : undefined,
      version: model.version || undefined,
      created_at: model.createdAt.toISOString(),
      updated_at: model.updatedAt.toISOString(),
    };
  }
}

// 导出单例实例
export const openAPIDocumentService = new OpenAPIDocumentService();
