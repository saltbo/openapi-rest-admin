/**
 * OpenAPIDocumentParser 完整单元测试
 * 
 * 测试范围：
 * - 文档解析和验证
 * - 资源提取和组织
 * - Schema 解析和引用解决
 * - 统计信息计算
 * - 服务器配置解析
 * - 错误处理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAPIDocumentParser } from '../OpenAPIDocumentParser';
import type { OpenAPI, OpenAPIV3 } from 'openapi-types';

// Mock fetch
global.fetch = vi.fn();

describe('OpenAPIDocumentParser', () => {
  let parser: OpenAPIDocumentParser;

  beforeEach(() => {
    parser = new OpenAPIDocumentParser();
    vi.clearAllMocks();
  });

  describe('文档解析', () => {
    it('应该解析有效的 OpenAPI 3.0 文档', async () => {
      const doc: OpenAPI.Document = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          description: 'Test description'
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' }
              }
            }
          }
        }
      };

      await parser.parseDocument(doc);

      const docInfo = parser.getDocumentInfo();
      expect(docInfo).toEqual({
        title: 'Test API',
        version: '1.0.0',
        description: 'Test description',
        openApiVersion: '3.0.0',
        servers: []
      });
    });

    it('应该解析 OpenAPI 2.0 文档', async () => {
      const doc = {
        swagger: '2.0',
        info: {
          title: 'Test API',
          version: '1.0.0'
        },
        host: 'api.test.com',
        basePath: '/v1',
        schemes: ['https'],
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            }
          }
        }
      };

      await parser.parseDocument(doc as any);

      const docInfo = parser.getDocumentInfo();
      expect(docInfo?.title).toBe('Test API');
      expect(docInfo?.openApiVersion).toBe('2.0');
      expect(docInfo?.servers).toEqual(['https://api.test.com/v1']);
    });

    it('应该从 URL 获取并解析文档', async () => {
      const mockDoc = {
        openapi: '3.0.0',
        info: { title: 'Remote API', version: '1.0.0' },
        paths: {}
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDoc
      });

      await parser.parseDocument('https://api.example.com/openapi.json');

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/openapi.json');
      const docInfo = parser.getDocumentInfo();
      expect(docInfo?.title).toBe('Remote API');
    });

    it('应该处理网络错误', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(parser.parseDocument('https://api.example.com/notfound.json'))
        .rejects.toThrow('Failed to fetch OpenAPI document: Not Found');
    });

    it('应该验证文档格式', async () => {
      const invalidDoc = {
        // 缺少必需字段
      };

      await expect(parser.parseDocument(invalidDoc as any))
        .rejects.toThrow('Invalid OpenAPI document');
    });

    it('应该验证必需的 info 字段', async () => {
      const docWithoutInfo = {
        openapi: '3.0.0',
        paths: {}
      };

      await expect(parser.parseDocument(docWithoutInfo as any))
        .rejects.toThrow('missing required info fields');
    });
  });

  describe('资源提取', () => {
    const sampleDoc: OpenAPI.Document = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            summary: 'List users',
            operationId: 'listUsers',
            tags: ['users'],
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create user',
            operationId: 'createUser',
            tags: ['users'],
            responses: { '201': { description: 'Created' } }
          }
        },
        '/users/{id}': {
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          get: {
            summary: 'Get user',
            operationId: 'getUser',
            tags: ['users'],
            responses: { '200': { description: 'Success' } }
          },
          put: {
            summary: 'Update user',
            operationId: 'updateUser',
            tags: ['users'],
            responses: { '200': { description: 'Updated' } }
          },
          delete: {
            summary: 'Delete user',
            operationId: 'deleteUser',
            tags: ['users'],
            responses: { '204': { description: 'Deleted' } }
          }
        },
        '/users/{id}/posts': {
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          get: {
            summary: 'List user posts',
            operationId: 'listUserPosts',
            tags: ['posts'],
            responses: { '200': { description: 'Success' } }
          }
        },
        '/posts': {
          get: {
            summary: 'List posts',
            operationId: 'listPosts',
            tags: ['posts'],
            responses: { '200': { description: 'Success' } }
          }
        }
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' }
            }
          }
        }
      }
    };

    beforeEach(async () => {
      await parser.parseDocument(sampleDoc);
    });

    it('应该提取所有资源', () => {
      const resources = parser.getAllResources();
      
      expect(resources).toHaveLength(2);
      expect(resources.map(r => r.name)).toEqual(expect.arrayContaining(['users', 'posts']));
    });

    it('应该正确识别 RESTful 资源', () => {
      const resources = parser.getAllResources();
      const usersResource = resources.find(r => r.name === 'users');
      
      expect(usersResource?.isRESTful).toBe(true);
      expect(usersResource?.operations).toHaveLength(5); // GET, POST, GET/{id}, PUT/{id}, DELETE/{id}
    });

    it('应该提取顶级资源', () => {
      const topLevelResources = parser.getTopLevelResources();
      
      expect(topLevelResources).toHaveLength(1); // 只有 users，posts 作为子资源
      expect(topLevelResources.map(r => r.name)).toEqual(expect.arrayContaining(['users']));
    });

    it('应该构建资源层级关系', () => {
      // 在这个例子中，posts 既有独立的 /posts 端点，也有 /users/{id}/posts 子资源端点
      const resources = parser.getAllResources();
      const usersResource = resources.find(r => r.name === 'users');
      
      expect(usersResource).toBeDefined();
      expect(usersResource?.subResources).toBeDefined();
    });

    it('应该提取操作信息', () => {
      const resources = parser.getAllResources();
      const usersResource = resources.find(r => r.name === 'users');
      
      expect(usersResource?.operations).toHaveLength(5);
      
      const getOperation = usersResource?.operations.find(op => op.method === 'GET' && !op.path.includes('{'));
      expect(getOperation).toMatchObject({
        method: 'GET',
        operationId: 'listUsers',
        summary: 'List users',
        path: '/users',
        tags: ['users']
      });
    });

    it('应该提取特定操作信息', () => {
      const operation = parser.getOperationInfo('GET', '/users');
      
      expect(operation).toMatchObject({
        method: 'GET',
        operationId: 'listUsers',
        summary: 'List users',
        path: '/users',
        tags: ['users']
      });
    });

    it('应该处理不存在的操作', () => {
      const operation = parser.getOperationInfo('PATCH', '/nonexistent');
      expect(operation).toBeNull();
    });
  });

  describe('Schema 解析', () => {
    const schemaDoc: OpenAPI.Document = {
      openapi: '3.0.0',
      info: { title: 'Schema Test API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            }
          }
        },
        '/posts': {
          get: {
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Post' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              profile: { $ref: '#/components/schemas/Profile' }
            }
          },
          Profile: {
            type: 'object',
            properties: {
              bio: { type: 'string' },
              avatar: { type: 'string' }
            }
          },
          Post: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              content: { type: 'string' }
            }
          }
        }
      }
    };

    beforeEach(async () => {
      await parser.parseDocument(schemaDoc);
    });

    it('应该获取所有资源 schemas', () => {
      const schemas = parser.getAllResourceSchemas();
      
      expect(schemas).toHaveProperty('users');
      expect(schemas).toHaveProperty('posts');
    });

    it('应该获取特定资源的 schema', () => {
      const userSchema = parser.getResourceSchema('users');
      
      expect(userSchema).toBeDefined();
      expect(userSchema?.type).toBe('object');
      expect(userSchema?.properties).toHaveProperty('id');
      expect(userSchema?.properties).toHaveProperty('name');
    });

    it('应该完全解析 schema 引用', () => {
      const userSchema = parser.getResourceSchema('users');
      
      // profile 字段应该被完全解析，不包含 $ref
      expect(userSchema?.properties?.profile).toBeDefined();
      expect(userSchema?.properties?.profile).not.toHaveProperty('$ref');
      expect((userSchema?.properties?.profile as any)?.properties?.bio).toBeDefined();
    });

    it('应该处理包装的响应格式', () => {
      const postSchema = parser.getResourceSchema('posts');
      
      expect(postSchema).toBeDefined();
      expect(postSchema?.properties).toHaveProperty('id');
      expect(postSchema?.properties).toHaveProperty('title');
    });

    it('应该处理不存在的资源 schema', () => {
      const schema = parser.getResourceSchema('nonexistent');
      expect(schema).toBeNull();
    });
  });

  describe('统计信息', () => {
    const statsDoc: OpenAPI.Document = {
      openapi: '3.0.0',
      info: { title: 'Stats API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            tags: ['users'],
            responses: { '200': { description: 'Success' } }
          },
          post: {
            tags: ['users'],
            responses: { '201': { description: 'Created' } }
          }
        },
        '/users/{id}': {
          get: {
            tags: ['users'],
            responses: { '200': { description: 'Success' } }
          },
          put: {
            tags: ['users'],
            responses: { '200': { description: 'Updated' } }
          }
        },
        '/posts': {
          get: {
            tags: ['posts'],
            responses: { '200': { description: 'Success' } }
          }
        },
        '/auth/login': {
          post: {
            tags: ['auth'],
            responses: { '200': { description: 'Success' } }
          }
        }
      }
    };

    beforeEach(async () => {
      await parser.parseDocument(statsDoc);
    });

    it('应该计算资源统计信息', () => {
      const stats = parser.getResourceStatistics();
      
      expect(stats.totalPaths).toBe(4);
      expect(stats.totalOperations).toBe(5); // 只有 users 和 posts 是 RESTful 资源
      expect(stats.totalResources).toBe(2); // users, posts
    });

    it('应该统计 HTTP 方法', () => {
      const stats = parser.getResourceStatistics();
      
      expect(stats.methodCounts.GET).toBe(3);
      expect(stats.methodCounts.POST).toBe(1); // 只有 users 的 post，auth/login 不被计入
      expect(stats.methodCounts.PUT).toBe(1);
    });

    it('应该统计标签', () => {
      const stats = parser.getResourceStatistics();
      
      expect(stats.tagCounts.users).toBe(4);
      expect(stats.tagCounts.posts).toBe(1);
    });

    it('应该缓存统计信息', () => {
      // 第一次调用
      const stats1 = parser.getResourceStatistics();
      // 第二次调用应该返回缓存的结果
      const stats2 = parser.getResourceStatistics();
      
      expect(stats1).toBe(stats2); // 同一个对象引用
    });
  });

  describe('服务器配置', () => {
    it('应该解析 OpenAPI 3.0 服务器', async () => {
      const doc: OpenAPI.Document = {
        openapi: '3.0.0',
        info: { title: 'Server Test', version: '1.0.0' },
        servers: [
          { url: 'https://api.example.com' },
          { url: 'https://staging.example.com' },
          { url: '/api/v1' } // 相对路径
        ],
        paths: {}
      };

      // 模拟 fetch 调用
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => doc
      });

      await parser.parseDocument('https://docs.example.com/openapi.json');

      const servers = parser.getServers();
      
      expect(servers).toEqual([
        'https://api.example.com',
        'https://staging.example.com',
        'https://docs.example.com/api/v1'
      ]);
    });

    it('应该解析 OpenAPI 2.0 主机和基础路径', async () => {
      const doc = {
        swagger: '2.0',
        info: { title: 'Server Test', version: '1.0.0' },
        host: 'api.example.com',
        basePath: '/v2',
        schemes: ['https', 'http'],
        paths: {}
      };

      await parser.parseDocument(doc as any);

      const servers = parser.getServers();
      expect(servers).toEqual(['https://api.example.com/v2']);
    });

    it('应该处理缺少服务器配置的情况', async () => {
      const doc: OpenAPI.Document = {
        openapi: '3.0.0',
        info: { title: 'No Server', version: '1.0.0' },
        paths: {}
      };

      await parser.parseDocument(doc);

      const servers = parser.getServers();
      expect(servers).toEqual([]);
    });
  });

  describe('错误处理', () => {
    it('应该在未解析文档时抛出错误', () => {
      expect(() => parser.getAllResourceSchemas())
        .toThrow('Document not parsed. Call parseDocument() first.');
      
      expect(() => parser.getResourceStatistics())
        .toThrow('Document not parsed. Call parseDocument() first.');
      
      expect(() => parser.getResourceSchema('users'))
        .toThrow('Document not parsed. Call parseDocument() first.');
    });

    it('应该处理循环引用', async () => {
      const docWithCircularRef: OpenAPI.Document = {
        openapi: '3.0.0',
        info: { title: 'Circular Test', version: '1.0.0' },
        paths: {
          '/nodes': {
            get: {
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Node' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          schemas: {
            Node: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                parent: { $ref: '#/components/schemas/Node' }
              }
            }
          }
        }
      };

      await parser.parseDocument(docWithCircularRef);
      
      // 应该能够处理循环引用而不会崩溃
      const schema = parser.getResourceSchema('nodes');
      expect(schema).toBeDefined();
    });

    it('应该处理无效的引用', async () => {
      const docWithInvalidRef: OpenAPI.Document = {
        openapi: '3.0.0',
        info: { title: 'Invalid Ref Test', version: '1.0.0' },
        paths: {
          '/items': {
            get: {
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/NonExistent' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        components: {
          schemas: {}
        }
      };

      await parser.parseDocument(docWithInvalidRef);
      
      // 应该优雅地处理无效引用
      const schema = parser.getResourceSchema('items');
      expect(schema).toBeDefined();
    });
  });

  describe('边缘情况', () => {
    it('应该处理空的 paths', async () => {
      const emptyDoc: OpenAPI.Document = {
        openapi: '3.0.0',
        info: { title: 'Empty API', version: '1.0.0' },
        paths: {}
      };

      await parser.parseDocument(emptyDoc);
      
      const resources = parser.getAllResources();
      const stats = parser.getResourceStatistics();
      
      expect(resources).toEqual([]);
      expect(stats.totalResources).toBe(0);
      expect(stats.totalPaths).toBe(0);
    });

    it('应该处理只有非 RESTful 端点的情况', async () => {
      const nonRestDoc: OpenAPI.Document = {
        openapi: '3.0.0',
        info: { title: 'Non-REST API', version: '1.0.0' },
        paths: {
          '/health': {
            get: {
              responses: { '200': { description: 'OK' } }
            }
          },
          '/login': {
            post: {
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      };

      await parser.parseDocument(nonRestDoc);
      
      const resources = parser.getAllResources();
      expect(resources).toEqual([]);
    });

    it('应该处理没有 GET 操作的路径', async () => {
      const noGetDoc: OpenAPI.Document = {
        openapi: '3.0.0',
        info: { title: 'No GET API', version: '1.0.0' },
        paths: {
          '/users': {
            post: {
              responses: { '201': { description: 'Created' } }
            },
            put: {
              responses: { '200': { description: 'Updated' } }
            }
          }
        }
      };

      await parser.parseDocument(noGetDoc);
      
      const resources = parser.getAllResources();
      expect(resources).toEqual([]); // 没有列表端点，不被认为是 RESTful 资源
    });
  });

  describe('缓存机制', () => {
    const cacheDoc: OpenAPI.Document = {
      openapi: '3.0.0',
      info: { title: 'Cache Test', version: '1.0.0' },
      paths: {
        '/users': {
          get: { responses: { '200': { description: 'Success' } } }
        }
      }
    };

    beforeEach(async () => {
      await parser.parseDocument(cacheDoc);
    });

    it('应该缓存资源列表', () => {
      const resources1 = parser.getAllResources();
      const resources2 = parser.getAllResources();
      
      expect(resources1).toBe(resources2); // 同一个对象引用
    });

    it('应该在重新解析文档时清空缓存', async () => {
      const resources1 = parser.getAllResources();
      const stats1 = parser.getResourceStatistics();
      
      // 重新解析
      await parser.parseDocument(cacheDoc);
      
      const resources2 = parser.getAllResources();
      const stats2 = parser.getResourceStatistics();
      
      // 应该是新的对象实例
      expect(resources1).not.toBe(resources2);
      expect(stats1).not.toBe(stats2);
    });
  });
});
