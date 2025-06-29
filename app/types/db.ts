// 数据库模型类型 - 对应 Prisma schema
export interface APIConfigModel {
  id: string;
  name: string;
  description: string;
  openapiUrl: string;
  enabled: boolean;
  tags: string | null; // JSON 字符串
  version: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 创建 API 配置的输入类型
export interface CreateAPIConfigInput {
  id: string;
  name: string;
  description: string;
  openapiUrl: string;
  enabled?: boolean;
  tags?: string[];
  version?: string;
}

// 更新 API 配置的输入类型
export interface UpdateAPIConfigInput {
  name?: string;
  description?: string;
  openapiUrl?: string;
  enabled?: boolean;
  tags?: string[];
  version?: string;
}
