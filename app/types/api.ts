// 前端配置接口 - 对应配置文件中的定义
export interface APIConfig {
  id: string;
  name: string;
  description: string;
  openapi_url: string;
  enabled: boolean;
  tags?: string[];
  version?: string;
}

// OpenAPI 规范解析相关类型
export interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    parameters?: Record<string, any>;
    responses?: Record<string, any>;
  };
  definitions?: Record<string, any>; // Swagger 2.0
}

// 字段类型定义
export type FieldType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'date' | 'datetime' | 'email' | 'url';

// 字段定义
export interface FieldDefinition {
  name: string;
  type: FieldType;
  format?: string;
  description?: string;
  required: boolean;
  enum?: any[];
  items?: FieldDefinition; // for array type
  properties?: Record<string, FieldDefinition>; // for object type
  example?: any;
}

// 资源定义 - 基于 OpenAPI path 解析得出
export interface ParsedResource {
  id: string; // 资源唯一标识
  name: string; // 资源名称
  displayName: string; // 显示名称
  path: string; // API 路径
  basePath: string; // 基础路径，用于实际API调用
  methods: string[]; // 支持的HTTP方法
  schema: FieldDefinition[]; // 字段定义列表
  operations: Record<string, OperationInfo>; // 操作信息
  sub_resources?: ParsedResource[]; // 子资源
  is_restful: boolean; // 是否遵循RESTful规范
  parent_resource?: string; // 父资源ID
  resource_type: 'full_crud' | 'read_only' | 'custom'; // 资源类型
  tags?: string[]; // 标签
}

// 操作信息
export interface OperationInfo {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, Response>;
  tags?: string[];
}

// 参数定义
export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required: boolean;
  schema: any;
}

// 请求体定义
export interface RequestBody {
  description?: string;
  content?: Record<string, {
    schema: any;
  }>;
  required?: boolean;
}

// 响应定义
export interface Response {
  description: string;
  content?: Record<string, {
    schema: any;
  }>;
}

// OpenAPI 分析结果
export interface OpenAPIAnalysis {
  id: string; // API配置ID
  title: string;
  version: string;
  description?: string;
  base_url: string;
  servers: string[]; // 所有可用服务器
  resources: ParsedResource[];
  total_paths: number;
  total_operations: number;
  restful_apis: number;
  tags: string[]; // 所有标签
  last_parsed: string; // 最后解析时间
}

// 字段显示配置 - 用户可自定义的显示设置
export interface FieldDisplayConfig {
  name: string;
  displayName: string;
  visible: boolean;
  order: number;
  type: FieldType;
  width?: number; // 表格列宽
  sortable?: boolean; // 是否可排序
  filterable?: boolean; // 是否可过滤
}

// 资源显示配置
export interface ResourceDisplayConfig {
  resourceId: string;
  resourceName: string;
  fields: FieldDisplayConfig[];
  pageSize?: number; // 分页大小
  defaultSort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

// Mock 数据生成配置
export interface MockConfig {
  enabled: boolean;
  count: number; // 生成数据条数
  seed?: number; // 随机种子
}

// API 调用相关类型
export interface APIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  total?: number; // 用于分页
  page?: number;
  pageSize?: number;
}

// 资源数据项
export interface ResourceDataItem {
  id: string | number;
  [key: string]: any;
}

// 资源摘要信息 - 用于首页显示
export interface ResourceSummary {
  id: string;
  name: string;
  displayName?: string;
  recordCount?: number;
  apiConfigId?: string;
  apiConfigName?: string;
  [key: string]: any;
}

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
