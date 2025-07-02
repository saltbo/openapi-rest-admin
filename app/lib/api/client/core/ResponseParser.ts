/**
 * 响应解析器
 * 负责解析HTTP响应并处理错误
 */

import type { ResourceOperation } from '../../OpenAPIDocumentParser';
import { APIError } from '../types';
import type { ResourceResponse } from '../types';

/**
 * 响应解析器类
 */
export class ResponseParser {
  /**
   * 解析响应
   */
  static async parseResponse<T>(
    response: Response,
    operation: ResourceOperation
  ): Promise<ResourceResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // 检查响应状态
    if (!response.ok) {
      let errorData: any;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType?.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
      } catch {
        errorData = 'Failed to parse error response';
      }

      throw new APIError(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText,
        errorData
      );
    }

    // 解析响应数据
    let data: T;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (response.status === 204 || operation.method === 'DELETE') {
      data = undefined as any;
    } else {
      data = (await response.text()) as any;
    }

    // 直接返回原始数据，不在这里做转换
    return {
      data: data,
      status: response.status,
      statusText: response.statusText,
      headers,
      raw: response
    };
  }
}
