/**
 * RESTfulAPIClient 响应转换测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RESTfulAPIClient, APIError } from '../RESTfulAPIClient';
import type { ResponseTransformer, PaginationInfo } from '../RESTfulAPIClient';

describe('RESTfulAPIClient Response Transformation', () => {
  let client: RESTfulAPIClient;

  beforeEach(() => {
    client = new RESTfulAPIClient('https://api.test.com');
  });

  describe('Default Response Transformer', () => {
    it('应该正确处理直接返回的数组（期望分页）', () => {
      const mockData = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
      
      const result = (client as any).defaultResponseTransformer(mockData, true);
      
      expect(result.data).toEqual(mockData);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 2,
        total: 2,
        totalPages: 1
      });
    });

    it('应该正确处理包装在data字段中的响应', () => {
      const mockResponse = {
        data: [{ id: 1, name: 'Item 1' }],
        total: 100,
        page: 2,
        pageSize: 20
      };
      
      const result = (client as any).defaultResponseTransformer(mockResponse, true);
      
      expect(result.data).toEqual(mockResponse.data);
      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 20,
        total: 100,
        totalPages: 5
      });
    });

    it('应该正确处理包装在items字段中的响应', () => {
      const mockResponse = {
        items: [{ id: 1, name: 'Item 1' }],
        total: 50,
        current: 3,
        size: 10
      };
      
      const result = (client as any).defaultResponseTransformer(mockResponse, true);
      
      expect(result.data).toEqual(mockResponse.items);
      expect(result.pagination).toEqual({
        page: 3,
        pageSize: 10,
        total: 50,
        totalPages: 5
      });
    });

    it('应该正确处理pagination对象中的分页信息', () => {
      const mockResponse = {
        list: [{ id: 1 }, { id: 2 }],
        pagination: {
          current: 1,
          size: 20,
          total: 100
        }
      };
      
      const result = (client as any).defaultResponseTransformer(mockResponse, true);
      
      expect(result.data).toEqual(mockResponse.list);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 100,
        totalPages: 5
      });
    });

    it('应该正确处理page对象中的分页信息', () => {
      const mockResponse = {
        results: [{ id: 1 }],
        page: {
          number: 2,
          size: 15,
          totalElements: 75
        }
      };
      
      const result = (client as any).defaultResponseTransformer(mockResponse, true);
      
      expect(result.data).toEqual(mockResponse.results);
      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 15,
        total: 75,
        totalPages: 5
      });
    });

    it('应该正确处理非期望分页的单个对象响应', () => {
      const mockData = { id: 1, name: 'Single Item' };
      
      const result = (client as any).defaultResponseTransformer(mockData, false);
      
      expect(result.data).toEqual(mockData);
      expect(result.pagination).toBeUndefined();
    });

    it('当期望分页但找不到分页信息时应该抛出错误', () => {
      const mockResponse = {
        data: [{ id: 1 }]
        // 缺少分页信息
      };
      
      expect(() => {
        (client as any).defaultResponseTransformer(mockResponse, true);
      }).toThrow('Could not find pagination information in response');
    });

    it('当期望分页但找不到数据字段时应该抛出错误', () => {
      const mockResponse = {
        total: 100,
        page: 1
        // 缺少数据字段
      };
      
      expect(() => {
        (client as any).defaultResponseTransformer(mockResponse, true);
      }).toThrow('Could not find data field in paginated response');
    });
  });

  describe('Custom Response Transformer', () => {
    it('应该使用自定义转换器', () => {
      const customTransformer: ResponseTransformer = (responseData: any) => {
        return {
          data: responseData.custom_data,
          pagination: {
            page: responseData.current_page,
            pageSize: responseData.per_page,
            total: responseData.total_items,
            totalPages: Math.ceil(responseData.total_items / responseData.per_page)
          }
        };
      };

      const clientWithCustomTransformer = new RESTfulAPIClient('https://api.test.com', customTransformer);
      
      const mockResponse = {
        custom_data: [{ id: 1 }],
        current_page: 2,
        per_page: 10,
        total_items: 50
      };
      
      const result = (clientWithCustomTransformer as any).transformResponseData(mockResponse, true);
      
      expect(result.data).toEqual(mockResponse.custom_data);
      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 10,
        total: 50,
        totalPages: 5
      });
    });

    it('应该能够设置和移除自定义转换器', () => {
      const customTransformer: ResponseTransformer = (responseData: any) => {
        return { data: responseData.transformed };
      };

      client.setResponseTransformer(customTransformer);
      
      const result1 = (client as any).transformResponseData({ transformed: 'test' }, false);
      expect(result1.data).toBe('test');

      client.removeResponseTransformer();
      
      const result2 = (client as any).transformResponseData({ transformed: 'test' }, false);
      expect(result2.data).toEqual({ transformed: 'test' });
    });
  });

  describe('Edge Cases', () => {
    it('应该处理null响应', () => {
      expect(() => {
        (client as any).defaultResponseTransformer(null, true);
      }).toThrow('Expected paginated response but got null/undefined');
    });

    it('应该处理undefined响应', () => {
      const result = (client as any).defaultResponseTransformer(undefined, false);
      expect(result.data).toBeUndefined();
      expect(result.pagination).toBeUndefined();
    });

    it('应该处理空数组', () => {
      const result = (client as any).defaultResponseTransformer([], true);
      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 0,
        total: 0,
        totalPages: 1
      });
    });

    it('应该处理字符串响应', () => {
      const result = (client as any).defaultResponseTransformer('test string', false);
      expect(result.data).toBe('test string');
      expect(result.pagination).toBeUndefined();
    });

    it('应该处理数字响应', () => {
      const result = (client as any).defaultResponseTransformer(42, false);
      expect(result.data).toBe(42);
      expect(result.pagination).toBeUndefined();
    });
  });

  describe('Pagination Information Extraction', () => {
    it('应该优先使用pagination字段中的信息', () => {
      const mockResponse = {
        data: [{ id: 1 }],
        pagination: {
          current: 5,
          size: 25,
          total: 200
        },
        // 这些字段应该被忽略，因为有pagination对象
        page: 1,
        pageSize: 10,
        total: 100
      };
      
      const result = (client as any).defaultResponseTransformer(mockResponse, true);
      
      expect(result.pagination).toEqual({
        page: 5,
        pageSize: 25,
        total: 200,
        totalPages: 8
      });
    });

    it('应该处理各种分页字段名称', () => {
      const testCases = [
        {
          response: { data: [], pageNum: 3, limit: 15, totalCount: 90 },
          expected: { page: 3, pageSize: 15, total: 90, totalPages: 6 }
        },
        {
          response: { items: [], current: 2, perPage: 30, count: 120 },
          expected: { page: 2, pageSize: 30, total: 120, totalPages: 4 }
        },
        {
          response: { list: [], page: 4, size: 5, totalElements: 100 },
          expected: { page: 4, pageSize: 5, total: 100, totalPages: 20 }
        }
      ];

      testCases.forEach((testCase, index) => {
        const result = (client as any).defaultResponseTransformer(testCase.response, true);
        expect(result.pagination).toEqual(testCase.expected);
      });
    });
  });
});
