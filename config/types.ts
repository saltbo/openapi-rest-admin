/**
 * 运行时配置类型定义
 */
export interface RuntimeConfig {
  /** OpenAPI 文档 URL */
  openapiDocUrl: string;
  /** 应用标题 */
  appTitle?: string;
}

/**
 * 配置字段元数据
 */
export interface ConfigFieldMeta {
  /** 字段名 */
  key: keyof RuntimeConfig;
  /** 环境变量名 */
  envKey: string;
  /** 默认值 */
  defaultValue: string | boolean;
  /** 字段描述 */
  description: string;
  /** 是否必需 */
  required: boolean;
}

/**
 * 配置字段定义
 */
export const CONFIG_FIELDS: ConfigFieldMeta[] = [
  {
    key: 'openapiDocUrl',
    envKey: 'VITE_OPENAPI_DOC_URL',
    defaultValue: '/openapi/apidocs.json',
    description: 'OpenAPI 文档 URL',
    required: true,
  },
  {
    key: 'appTitle',
    envKey: 'VITE_APP_TITLE',
    defaultValue: 'OpenAPI Admin',
    description: '应用标题',
    required: false,
  },
];
