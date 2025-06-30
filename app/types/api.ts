// 前端配置接口 - 对应配置文件中的定义
export interface OpenAPIDocument {
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

// 资源数据项
export interface ResourceDataItem {
  id: string | number;
  [key: string]: any;
}

export type {
  OpenAPIDocumentModel,
  CreateOpenAPIDocumentInput,
  UpdateOpenAPIDocumentInput,
} from "./db";
