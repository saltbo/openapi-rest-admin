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
}
