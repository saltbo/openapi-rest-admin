/**
 * 响应数据转换器
 * 基于确定的 resourceSchema 进行响应数据转换，不依赖推测和 fallback
 */

import { APIError } from "./types";
import type { PaginationInfo } from "./types";
import type { OpenAPIV3 } from "openapi-types";

/**
 * Schema 确定性的响应数据转换器类
 * 要求调用方显式传入 resourceSchema，只用该 schema 去 response 里做匹配和提取数据
 */
export class ResponseTransformer {
  /**
   * 转换列表响应数据
   * 要求调用方必须传入 resourceSchema，只用 resourceSchema 匹配 response
   */
  transformListResponseData<T>(
    responseData: any,
    resourceSchema: OpenAPIV3.SchemaObject
  ): {
    data: T[];
    pagination: PaginationInfo;
  } {
    if (!resourceSchema) {
      throw new APIError(
        "resourceSchema is required for list data transformation",
        400,
        "Configuration Error"
      );
    }

    // 如果数据为空或null
    if (responseData === null || responseData === undefined) {
      throw new APIError(
        "Expected list response but got null/undefined",
        500,
        "Parse Error"
      );
    }

    // 如果直接是数组，验证数组元素是否符合 resourceSchema
    if (Array.isArray(responseData)) {
      // 检查数组中的元素是否符合 resourceSchema（检查第一个非空元素）
      if (responseData.length > 0) {
        const sampleItem = responseData.find(
          (item) => item !== null && item !== undefined
        );
        if (!sampleItem || !this.isResourceData(sampleItem, resourceSchema)) {
          throw new APIError(
            "Array elements do not match the provided resourceSchema",
            500,
            "Parse Error"
          );
        }
      }
      return {
        data: responseData as T[],
        pagination: this.createDefaultPagination(responseData.length),
      };
    }

    // 如果不是对象类型，抛出错误
    if (typeof responseData !== "object") {
      throw new APIError(
        "Expected list response to be object or array",
        500,
        "Parse Error"
      );
    }

    // 响应是包装对象，基于 schema 查找数组字段
    // 常见的数组数据字段名
    const commonArrayFields = [
      "data",
      "items",
      "list",
      "results",
      "records",
      "content",
    ];

    for (const fieldName of commonArrayFields) {
      if (fieldName in responseData && Array.isArray(responseData[fieldName])) {
        const arrayData = responseData[fieldName];
        // 验证数组中的元素是否符合 resourceSchema
        if (arrayData.length > 0) {
          const sampleItem = arrayData.find(
            (item) => item !== null && item !== undefined
          );
          if (!sampleItem || !this.isResourceData(sampleItem, resourceSchema)) {
            continue; // 不符合 schema，继续查找其他字段
          }
        }
        // 找到符合条件的数组字段
        const pagination = this.extractPaginationFromObject(responseData);
        return { data: arrayData as T[], pagination };
      }
    }

    // 如果没有找到常见字段，查找符合 schema 的数组字段
    for (const [fieldName, fieldValue] of Object.entries(responseData)) {
      if (Array.isArray(fieldValue)) {
        // 验证数组中的元素是否符合 resourceSchema
        if (fieldValue.length > 0) {
          const sampleItem = fieldValue.find(
            (item) => item !== null && item !== undefined
          );
          if (!sampleItem || !this.isResourceData(sampleItem, resourceSchema)) {
            continue; // 不符合 schema，继续查找其他字段
          }
        }
        // 找到符合条件的数组字段
        const pagination = this.extractPaginationFromObject(responseData);
        return { data: fieldValue as T[], pagination };
      }
    }

    throw new APIError(
      "Could not extract list data using provided resourceSchema",
      500,
      "Parse Error"
    );
  }

  /**
   * 转换单个资源响应数据
   * 要求调用方必须传入 resourceSchema，只用 resourceSchema 匹配 response
   */
  transformSingleResponseData<T>(
    responseData: any,
    resourceSchema: OpenAPIV3.SchemaObject
  ): T {
    if (!resourceSchema) {
      throw new APIError(
        "resourceSchema is required for single resource transformation",
        400,
        "Configuration Error"
      );
    }

    // 如果数据为空或null，直接返回
    if (responseData === null || responseData === undefined) {
      return responseData;
    }

    // 如果不是对象类型，直接返回
    if (typeof responseData !== "object" || Array.isArray(responseData)) {
      return responseData as T;
    }

    // 情况 1: 响应直接就是资源数据（检查是否符合 resourceSchema）
    if (this.isResourceData(responseData, resourceSchema)) {
      return responseData as T;
    }

    // 情况 2: 响应是包装对象，查找资源字段
    // 常见的单个资源数据字段名
    const commonResourceFields = [
      "data",
      "item",
      "result",
      "record",
      "content",
    ];

    for (const fieldName of commonResourceFields) {
      if (fieldName in responseData) {
        const fieldValue = responseData[fieldName];
        if (this.isResourceData(fieldValue, resourceSchema)) {
          return fieldValue as T;
        }
      }
    }

    // 如果没有找到常见字段，检查所有对象字段
    for (const [fieldName, fieldValue] of Object.entries(responseData)) {
      if (
        typeof fieldValue === "object" &&
        fieldValue !== null &&
        !Array.isArray(fieldValue)
      ) {
        if (this.isResourceData(fieldValue, resourceSchema)) {
          return fieldValue as T;
        }
      }
    }

    throw new APIError(
      "Could not extract single resource data using provided resourceSchema",
      500,
      "Parse Error"
    );
  }

  /**
   * 创建默认分页信息
   */
  private createDefaultPagination(totalItems: number): PaginationInfo {
    return {
      page: 1,
      pageSize: totalItems,
      total: totalItems,
      totalPages: 1,
    };
  }

  /**
   * 检查数据是否符合资源 schema
   * 只检查第一层字段结构，不做深度递归验证
   */
  private isResourceData(
    data: any,
    resourceSchema: OpenAPIV3.SchemaObject
  ): boolean {
    if (!data || !resourceSchema) {
      return false;
    }

    // 处理 schema 的引用
    if ("$ref" in resourceSchema) {
      // 暂时跳过引用解析，返回基本的对象检查
      return typeof data === "object" && data !== null && !Array.isArray(data);
    }

    // 根据 schema 类型进行验证
    switch (resourceSchema.type) {
      case "object":
        // 对象类型验证
        if (typeof data !== "object" || data === null || Array.isArray(data)) {
          return false;
        }

        // 如果 schema 没有定义 properties，进行基本检查
        if (!resourceSchema.properties) {
          return true;
        }

        // 只检查必需字段是否存在，不验证字段值的类型
        if (resourceSchema.required && Array.isArray(resourceSchema.required)) {
          for (const requiredField of resourceSchema.required) {
            if (!(requiredField in data)) {
              return false;
            }
          }
        }

        return true;

      case "string":
        return typeof data === "string";
      case "number":
        return typeof data === "number";
      case "integer":
        return typeof data === "number" && Number.isInteger(data);
      case "boolean":
        return typeof data === "boolean";
      case "array":
        return Array.isArray(data);
      default:
        // 如果没有指定类型，但有 properties，则认为是对象
        if (resourceSchema.properties) {
          return (
            typeof data === "object" && data !== null && !Array.isArray(data)
          );
        }
        // 其他情况进行基本的对象检查
        return (
          typeof data === "object" && data !== null && !Array.isArray(data)
        );
    }
  }

  /**
   * 从对象中提取分页信息
   * 只保留基本的分页信息提取逻辑
   */
  private extractPaginationFromObject(obj: any): PaginationInfo {
    let page = 1;
    let pageSize = 20;
    let total = 0;

    // 尝试从常见的分页字段提取信息
    if ("pagination" in obj && typeof obj.pagination === "object") {
      const paginationObj = obj.pagination;
      page = paginationObj.page || paginationObj.current || page;
      pageSize =
        paginationObj.pageSize ||
        paginationObj.size ||
        paginationObj.limit ||
        pageSize;
      total = paginationObj.total || paginationObj.totalCount || total;
    } else {
      // 从根级别字段提取
      if ("page" in obj && typeof obj.page === "number") page = obj.page;
      if ("current" in obj && typeof obj.current === "number")
        page = obj.current;
      if ("pageSize" in obj && typeof obj.pageSize === "number")
        pageSize = obj.pageSize;
      if ("size" in obj && typeof obj.size === "number") pageSize = obj.size;
      if ("limit" in obj && typeof obj.limit === "number") pageSize = obj.limit;
      if ("total" in obj && typeof obj.total === "number") total = obj.total;
      if ("totalCount" in obj && typeof obj.totalCount === "number")
        total = obj.totalCount;
      if ("count" in obj && typeof obj.count === "number") total = obj.count;
    }

    // 如果没有找到总数，使用页面大小作为总数（单页情况）
    if (total === 0) {
      total = pageSize;
    }

    const totalPages = Math.ceil(total / pageSize);

    return {
      page,
      pageSize,
      total,
      totalPages,
    };
  }
}
