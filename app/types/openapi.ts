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
  // OpenAPI validation constraints
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  multipleOf?: number;
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

// 资源定义 - 基于 OpenAPI path 解析得出
export interface ParsedResource {
  id: string; // 资源唯一标识
  name: string; // 资源名称
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
