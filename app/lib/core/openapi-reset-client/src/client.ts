/**
 * Resource Operation Client
 *
 * 专门为 ResourceOperation 服务的客户端
 * 提供简化的接口，直接请求操作即可获得对应的资源数据
 */

import type { OpenAPIV3 } from "openapi-types";
import type { ResourceOperation } from "../../OpenAPIDocumentParser";
import type {
  ResourceRequestOptions,
  ListRequestOptions,
  ResourceResponse,
  PaginatedResponse,
} from "../lib/types";
import { ResponseTransformer } from "../lib/transformer";
import { BaseOpenapiClient } from "./base";

export class OpenapiRestClient extends BaseOpenapiClient {
  private responseTransformer: ResponseTransformer;

  constructor(baseURL: string) {
    super(baseURL);
    this.responseTransformer = new ResponseTransformer();
  }

  /**
   * 请求资源操作
   * 根据操作类型自动处理响应数据格式
   * 要求调用方显式传入 resourceSchema
   */
  async request<T = any>(
    operation: ResourceOperation,
    resourceSchema: OpenAPIV3.SchemaObject,
    options: ResourceRequestOptions = {}
  ): Promise<ResourceResponse<T> | PaginatedResponse<T>> {
    // 判断是否为列表操作
    const isListOperation = this.isListOperation(operation);
    if (isListOperation) {
      // 对于列表操作，返回分页结果
      return await this.requestList<T>(
        operation,
        resourceSchema,
        options as ListRequestOptions
      );
    } else {
      // 对于单个资源操作，返回普通结果
      return await this.requestSingle<T>(operation, resourceSchema, options);
    }
  }

  /**
   * 请求资源列表
   * 专门用于处理列表操作，自动处理分页
   * 要求调用方显式传入 resourceSchema
   */
  async requestList<T = any>(
    operation: ResourceOperation,
    resourceSchema: OpenAPIV3.SchemaObject,
    options: ListRequestOptions = {}
  ): Promise<PaginatedResponse<T>> {
    const {
      page = 1,
      pageSize = 20,
      sort,
      order,
      filters,
      query = {},
      ...requestOptions
    } = options;

    // 构建查询参数
    const queryParams: Record<string, any> = {
      ...query,
      page,
      pageSize,
    };

    if (sort) {
      queryParams.sort = sort;
      if (order) {
        queryParams.order = order;
      }
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams[key] = value;
        }
      });
    }

    const response = await this.executeRequest<T[]>(operation, {
      ...requestOptions,
      query: queryParams,
    });

    // 使用专门的列表转换器解析响应数据
    const transformedData =
      this.responseTransformer.transformListResponseData<T>(
        response.data,
        resourceSchema
      );

    return {
      ...response,
      data: transformedData.data,
      pagination: transformedData.pagination,
    };
  }

  /**
   * 请求单个资源
   * 用于处理获取、创建、更新、删除操作
   * 要求调用方显式传入 resourceSchema
   */
  async requestSingle<T = any>(
    operation: ResourceOperation,
    resourceSchema: OpenAPIV3.SchemaObject,
    options: ResourceRequestOptions = {}
  ): Promise<ResourceResponse<T>> {
    const response = await this.executeRequest<T>(operation, options);

    // 使用专门的单个资源转换器解析响应数据
    const transformedData =
      this.responseTransformer.transformSingleResponseData<T>(
        response.data,
        resourceSchema
      );

    return {
      ...response,
      data: transformedData,
    };
  }

  /**
   * 判断是否为列表操作
   */
  private isListOperation(operation: ResourceOperation): boolean {
    // 判断是否为GET方法且路径不包含参数（表示获取列表）
    if (operation.method.toUpperCase() !== "GET") {
      return false;
    }

    // 结尾不包含参数的认定为列表操作
    return !operation.path.endsWith("}");
  }
}
