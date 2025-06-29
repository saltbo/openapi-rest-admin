// 前端配置接口 - 对应配置文件中的定义
export interface APIConfig {
  id: string;
  name: string;
  description: string;
  openapi_url: string;
  enabled: boolean;
  tags?: string[];
  version?: string;
  created_at: string; // ISO 日期字符串
  updated_at: string; // ISO 日期字符串
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

// Re-export types from other modules for convenience
export type {
  FieldType,
  FieldDefinition,
  ParsedResource,
  OperationInfo,
  Parameter,
  RequestBody,
  Response,
  OpenAPIAnalysis,
  OpenAPISpec,
} from "./openapi";

export type {
  APIConfigModel,
  CreateAPIConfigInput,
  UpdateAPIConfigInput,
} from "./db";
