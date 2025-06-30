/**
 * 数据提取工具类
 * 
 * 提供统一的数据提取逻辑，用于从 API 响应和 OpenAPI Schema 中提取实际的资源数据
 */

import type { OpenAPIV3 } from 'openapi-types';

/**
 * 数据提取选项
 */
export interface DataExtractionOptions {
  /** 是否期望分页信息 */
  expectPagination?: boolean;
  /** 自定义数据字段名 */
  customDataFields?: string[];
  /** Schema 引用解析器 */
  schemaResolver?: (ref: string) => any;
}

/**
 * 提取结果
 */
export interface ExtractedData<T = any> {
  /** 提取的数据 */
  data: T;
  /** 数据字段名（如果找到） */
  dataFieldName?: string;
  /** 是否为数组数据 */
  isArray?: boolean;
}

/**
 * 数据提取工具类
 */
export class DataExtractor {
  /** 默认的数据字段名 */
  private static readonly DEFAULT_DATA_FIELDS = [
    'data', 'items', 'list', 'results', 'records'
  ];

  /**
   * 从对象中提取数据
   * 适用于 API 响应数据提取
   */
  static extractDataFromObject<T = any>(
    obj: any,
    options: DataExtractionOptions = {}
  ): ExtractedData<T> {
    const {
      expectPagination = false,
      customDataFields = []
    } = options;

    // 如果数据为空或null
    if (obj === null || obj === undefined) {
      return { data: obj };
    }

    // 如果不是对象类型，直接返回
    if (typeof obj !== 'object' || Array.isArray(obj)) {
      return { 
        data: obj,
        isArray: Array.isArray(obj)
      };
    }

    // 合并默认字段名和自定义字段名
    const dataFields = [...customDataFields, ...this.DEFAULT_DATA_FIELDS];
    
    let data: T | undefined;
    let dataFieldName: string | undefined;

    // 1. 先尝试常见的数据字段名
    for (const field of dataFields) {
      if (field in obj) {
        data = obj[field];
        dataFieldName = field;
        break;
      }
    }

    // 2. 如果没找到，尝试寻找数组字段
    if (data === undefined) {
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          data = value as T;
          dataFieldName = key;
          break;
        }
      }
    }

    // 3. 如果还没找到且不期望分页，直接返回整个对象
    if (data === undefined && !expectPagination) {
      return { data: obj as T };
    }

    // 4. 如果期望分页但没找到数据字段，抛出错误
    if (data === undefined && expectPagination) {
      throw new Error('Could not find data field in paginated response');
    }

    return {
      data: data!,
      dataFieldName,
      isArray: Array.isArray(data)
    };
  }

  /**
   * 从 OpenAPI Schema 中提取实际的资源 Schema
   * 适用于 Schema 数据提取
   */
  static extractSchemaFromResponse(
    responseSchema: any,
    options: DataExtractionOptions = {}
  ): any {
    const { schemaResolver } = options;

    // 处理 schema 引用
    let schema = schemaResolver ? this.resolveSchemaRef(responseSchema, schemaResolver) : responseSchema;
    
    // 如果不是对象类型，直接返回
    if (typeof schema !== 'object' || Array.isArray(schema)) {
      return schema;
    }

    // 如果是数组类型的 schema
    if (schema.type === 'array' && schema.items) {
      return schemaResolver ? this.resolveSchemaRef(schema.items, schemaResolver) : schema.items;
    }

    // 如果是对象类型，尝试提取数据字段
    if (schema.type === 'object' && schema.properties) {
      const dataFields = [...(options.customDataFields || []), ...this.DEFAULT_DATA_FIELDS];
      
      // 1. 先尝试常见的数据字段名
      for (const field of dataFields) {
        if (schema.properties[field]) {
          const dataSchema = schemaResolver ? 
            this.resolveSchemaRef(schema.properties[field], schemaResolver) : 
            schema.properties[field];
          
          // 如果数据字段是数组，返回数组项的 schema
          if (dataSchema.type === 'array' && dataSchema.items) {
            return schemaResolver ? 
              this.resolveSchemaRef(dataSchema.items, schemaResolver) : 
              dataSchema.items;
          }
          
          // 如果数据字段是对象，直接返回
          if (dataSchema.type === 'object') {
            return dataSchema;
          }
        }
      }

      // 2. 如果没找到常见数据字段，寻找数组类型的字段
      for (const [key, value] of Object.entries(schema.properties)) {
        const resolvedValue = schemaResolver ? this.resolveSchemaRef(value, schemaResolver) : value;
        if (typeof resolvedValue === 'object' && resolvedValue !== null && 
            resolvedValue.type === 'array' && resolvedValue.items) {
          return schemaResolver ? 
            this.resolveSchemaRef(resolvedValue.items, schemaResolver) : 
            resolvedValue.items;
        }
      }
    }

    // 3. 如果都没找到，返回原始 schema
    return schema;
  }

  /**
   * 解析 schema 引用
   */
  private static resolveSchemaRef(schema: any, resolver: (ref: string) => any): any {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }

    // 如果包含 $ref，使用解析器解析引用
    if (schema.$ref && typeof schema.$ref === 'string') {
      const resolved = resolver(schema.$ref);
      return resolved || schema;
    }

    return schema;
  }

  /**
   * 检查数据是否包含分页信息
   */
  static hasPaginationInfo(obj: any): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    // 检查常见的分页字段
    const paginationFields = [
      'pagination', 'page', 'pageSize', 'total', 'totalCount', 
      'count', 'totalElements', 'size', 'limit', 'perPage'
    ];

    return paginationFields.some(field => field in obj);
  }

  /**
   * 获取默认数据字段名列表
   */
  static getDefaultDataFields(): string[] {
    return [...this.DEFAULT_DATA_FIELDS];
  }

  /**
   * 创建带有自定义配置的数据提取器实例
   */
  static createExtractor(config: {
    dataFields?: string[];
    schemaResolver?: (ref: string) => any;
  }) {
    return {
      extractDataFromObject: <T = any>(obj: any, options: DataExtractionOptions = {}) => {
        return DataExtractor.extractDataFromObject<T>(obj, {
          ...options,
          customDataFields: [...(options.customDataFields || []), ...(config.dataFields || [])]
        });
      },
      extractSchemaFromResponse: (responseSchema: any, options: DataExtractionOptions = {}) => {
        return DataExtractor.extractSchemaFromResponse(responseSchema, {
          ...options,
          schemaResolver: options.schemaResolver || config.schemaResolver
        });
      }
    };
  }
}
