/**
 * ResourceManager 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceManager } from '../ResourceManager';
import type { ParsedResource } from '~/types/api';

// 测试数据
const mockResources: ParsedResource[] = [
  {
    id: 'authors',
    name: 'authors',
    displayName: 'Authors',
    path: '/authors',
    basePath: 'http://localhost:3000/api/authors',
    methods: ['GET', 'POST'],
    schema: [],
    operations: {},
    is_restful: true,
    resource_type: 'full_crud',
    tags: ['Authors'],
    sub_resources: [
      {
        id: 'authors.books',
        name: 'books',
        displayName: 'Books',
        path: '/authors/{id}/books',
        basePath: 'http://localhost:3000/api/authors/{id}/books',
        methods: ['GET'],
        schema: [],
        operations: {},
        is_restful: false,
        resource_type: 'read_only',
        tags: ['Authors'],
        sub_resources: [],
        parent_resource: 'authors'
      }
    ]
  },
  {
    id: 'books',
    name: 'books',
    displayName: 'Books',
    path: '/books',
    basePath: 'http://localhost:3000/api/books',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    schema: [],
    operations: {},
    is_restful: true,
    resource_type: 'full_crud',
    tags: ['Books'],
    sub_resources: [
      {
        id: 'books.notes',
        name: 'notes',
        displayName: 'Notes',
        path: '/books/{id}/notes',
        basePath: 'http://localhost:3000/api/books/{id}/notes',
        methods: ['GET'],
        schema: [],
        operations: {},
        is_restful: false,
        resource_type: 'read_only',
        tags: ['Books'],
        sub_resources: [],
        parent_resource: 'books'
      }
    ]
  },
  {
    id: 'notes',
    name: 'notes',
    displayName: 'Notes',
    path: '/notes',
    basePath: 'http://localhost:3000/api/notes',
    methods: ['GET', 'POST'],
    schema: [],
    operations: {},
    is_restful: true,
    resource_type: 'full_crud',
    tags: ['Notes'],
    sub_resources: []
  }
];

describe('ResourceManager', () => {
  let resourceManager: ResourceManager;

  beforeEach(() => {
    resourceManager = new ResourceManager();
  });

  describe('findByName', () => {
    it('应该优先返回顶级资源', () => {
      const result = resourceManager.findByName(mockResources, 'books');
      
      expect(result).toBeTruthy();
      expect(result?.id).toBe('books');
      expect(result?.path).toBe('/books');
    });

    it('应该在顶级资源中找不到时查找子资源', () => {
      // 创建一个新的资源数组，包含reviews子资源
      const reviewsSubResource: ParsedResource = {
        id: 'books.reviews',
        name: 'reviews',
        displayName: 'Reviews',
        path: '/books/{id}/reviews',
        basePath: 'http://localhost:3000/api/books/{id}/reviews',
        methods: ['GET'],
        schema: [],
        operations: {},
        is_restful: false,
        resource_type: 'read_only',
        tags: ['Books'],
        sub_resources: [],
        parent_resource: 'books'
      };

      const booksWithReviews: ParsedResource = {
        ...mockResources[1],
        sub_resources: [...(mockResources[1].sub_resources || []), reviewsSubResource]
      };

      const resourcesWithReviews = [
        mockResources[0], // authors
        booksWithReviews,  // books with reviews
        mockResources[2]   // notes
      ];

      const result = resourceManager.findByName(resourcesWithReviews, 'reviews');
      
      expect(result).toBeTruthy();
      expect(result?.id).toBe('books.reviews');
      expect(result?.parent_resource).toBe('books');
    });

    it('应该支持只查找顶级资源的选项', () => {
      const result = resourceManager.findByName(
        mockResources, 
        'books', 
        { includeSubResources: false }
      );
      
      expect(result).toBeTruthy();
      expect(result?.id).toBe('books');
    });

    it('应该支持深度优先搜索', () => {
      const result = resourceManager.findByName(
        mockResources, 
        'books', 
        { preferTopLevel: false }
      );
      
      // 在深度优先搜索中，可能会先找到 authors.books
      expect(result).toBeTruthy();
      expect(['books', 'authors.books']).toContain(result?.id);
    });
  });

  describe('findById', () => {
    it('应该根据ID找到正确的资源', () => {
      const result = resourceManager.findById(mockResources, 'books.notes');
      
      expect(result).toBeTruthy();
      expect(result?.id).toBe('books.notes');
      expect(result?.name).toBe('notes');
      expect(result?.parent_resource).toBe('books');
    });

    it('应该找不到不存在的ID', () => {
      const result = resourceManager.findById(mockResources, 'nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('findByPath', () => {
    it('应该通过路径找到嵌套资源', () => {
      const result = resourceManager.findByPath(mockResources, 'books.notes');
      
      expect(result).toBeTruthy();
      expect(result?.id).toBe('books.notes');
      expect(result?.name).toBe('notes');
    });

    it('应该通过路径找到顶级资源', () => {
      const result = resourceManager.findByPath(mockResources, 'books');
      
      expect(result).toBeTruthy();
      expect(result?.id).toBe('books');
    });

    it('应该找不到不存在的路径', () => {
      const result = resourceManager.findByPath(mockResources, 'books.nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('getResourceHierarchy', () => {
    it('应该返回顶级资源的层级信息', () => {
      const result = resourceManager.getResourceHierarchy(mockResources, 'books');
      
      expect(result).toBeTruthy();
      expect(result?.resource.id).toBe('books');
      expect(result?.path).toEqual(['books']);
      expect(result?.depth).toBe(0);
    });

    it('应该返回子资源的层级信息', () => {
      const result = resourceManager.getResourceHierarchy(mockResources, 'notes');
      
      expect(result).toBeTruthy();
      // 应该找到顶级的 notes 资源
      expect(result?.resource.id).toBe('notes');
      expect(result?.path).toEqual(['notes']);
      expect(result?.depth).toBe(0);
    });
  });

  describe('getTopLevelResources', () => {
    it('应该返回所有顶级资源', () => {
      const result = resourceManager.getTopLevelResources(mockResources);
      
      expect(result).toHaveLength(3);
      expect(result.map((r: ParsedResource) => r.name)).toEqual(['authors', 'books', 'notes']);
    });
  });

  describe('getAllSubResources', () => {
    it('应该返回资源的所有子资源', () => {
      const booksResource = mockResources.find(r => r.name === 'books')!;
      const result = resourceManager.getAllSubResources(booksResource);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('notes');
      expect(result[0].id).toBe('books.notes');
    });

    it('应该返回空数组如果没有子资源', () => {
      const notesResource = mockResources.find(r => r.name === 'notes')!;
      const result = resourceManager.getAllSubResources(notesResource);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('supportsOperation', () => {
    it('应该正确检查操作支持', () => {
      const booksResource = mockResources.find(r => r.name === 'books')!;
      
      expect(resourceManager.supportsOperation(booksResource, 'GET')).toBe(true);
      expect(resourceManager.supportsOperation(booksResource, 'POST')).toBe(true);
      expect(resourceManager.supportsOperation(booksResource, 'PUT')).toBe(true);
      expect(resourceManager.supportsOperation(booksResource, 'DELETE')).toBe(true);
      expect(resourceManager.supportsOperation(booksResource, 'PATCH')).toBe(false);
    });

    it('应该不区分大小写', () => {
      const booksResource = mockResources.find(r => r.name === 'books')!;
      
      expect(resourceManager.supportsOperation(booksResource, 'get')).toBe(true);
      expect(resourceManager.supportsOperation(booksResource, 'Get')).toBe(true);
    });
  });

  describe('getStats', () => {
    it('应该返回正确的统计信息', () => {
      const result = resourceManager.getStats(mockResources);
      
      expect(result.total).toBe(5); // 3个顶级 + 2个子资源
      expect(result.restful).toBe(3); // authors, books, notes
      expect(result.withSubResources).toBe(2); // authors, books
      expect(result.topLevel).toBe(3); // authors, books, notes
    });
  });

  describe('边界情况和冲突场景', () => {
    const conflictResources: ParsedResource[] = [
      {
        id: 'reviews',
        name: 'reviews',
        displayName: 'Reviews',
        path: '/reviews',
        basePath: 'http://localhost:3000/api/reviews',
        methods: ['GET', 'POST'],
        schema: [],
        operations: {},
        is_restful: true,
        resource_type: 'full_crud',
        tags: ['Reviews'],
        sub_resources: []
      },
      {
        id: 'books',
        name: 'books',
        displayName: 'Books',
        path: '/books',
        basePath: 'http://localhost:3000/api/books',
        methods: ['GET', 'POST'],
        schema: [],
        operations: {},
        is_restful: true,
        resource_type: 'full_crud',
        tags: ['Books'],
        sub_resources: [
          {
            id: 'books.reviews',
            name: 'reviews',
            displayName: 'Book Reviews',
            path: '/books/{id}/reviews',
            basePath: 'http://localhost:3000/api/books/{id}/reviews',
            methods: ['GET'],
            schema: [],
            operations: {},
            is_restful: false,
            resource_type: 'read_only',
            tags: ['Books'],
            sub_resources: [],
            parent_resource: 'books'
          }
        ]
      }
    ];

    it('应该优先返回顶级资源而不是同名子资源', () => {
      const result = resourceManager.findByName(conflictResources, 'reviews');
      
      expect(result).toBeTruthy();
      expect(result?.id).toBe('reviews'); // 顶级资源，不是 books.reviews
      expect(result?.parent_resource).toBeUndefined();
    });

    it('应该在查找层级时优先返回顶级资源', () => {
      const result = resourceManager.getResourceHierarchy(conflictResources, 'reviews');
      
      expect(result).toBeTruthy();
      expect(result?.resource.id).toBe('reviews');
      expect(result?.depth).toBe(0);
    });

    it('应该处理空资源数组', () => {
      const result = resourceManager.findByName([], 'reviews');
      expect(result).toBeNull();
    });

    it('应该处理 null/undefined 子资源', () => {
      const resourcesWithNull: ParsedResource[] = [
        {
          id: 'test',
          name: 'test',
          displayName: 'Test',
          path: '/test',
          basePath: 'http://localhost:3000/api/test',
          methods: ['GET'],
          schema: [],
          operations: {},
          is_restful: true,
          resource_type: 'read_only',
          tags: ['Test'],
          sub_resources: undefined as any
        }
      ];

      const result = resourceManager.findByName(resourcesWithNull, 'test');
      expect(result).toBeTruthy();
      expect(result?.id).toBe('test');
    });

    it('应该正确处理深度嵌套的资源结构', () => {
      const deepNested: ParsedResource[] = [
        {
          id: 'level1',
          name: 'level1',
          displayName: 'Level 1',
          path: '/level1',
          basePath: 'http://localhost:3000/api/level1',
          methods: ['GET'],
          schema: [],
          operations: {},
          is_restful: true,
          resource_type: 'read_only',
          tags: ['Level1'],
          sub_resources: [
            {
              id: 'level1.level2',
              name: 'level2',
              displayName: 'Level 2',
              path: '/level1/{id}/level2',
              basePath: 'http://localhost:3000/api/level1/{id}/level2',
              methods: ['GET'],
              schema: [],
              operations: {},
              is_restful: false,
              resource_type: 'read_only',
              tags: ['Level1'],
              sub_resources: [
                {
                  id: 'level1.level2.level3',
                  name: 'level3',
                  displayName: 'Level 3',
                  path: '/level1/{id}/level2/{id}/level3',
                  basePath: 'http://localhost:3000/api/level1/{id}/level2/{id}/level3',
                  methods: ['GET'],
                  schema: [],
                  operations: {},
                  is_restful: false,
                  resource_type: 'read_only',
                  tags: ['Level1'],
                  sub_resources: [],
                  parent_resource: 'level2'
                }
              ],
              parent_resource: 'level1'
            }
          ]
        }
      ];

      const result = resourceManager.findByPath(deepNested, 'level1.level2.level3');
      expect(result).toBeTruthy();
      expect(result?.id).toBe('level1.level2.level3');
    });
  });

  describe('性能和可扩展性', () => {
    // 创建大量资源进行性能测试
    const generateLargeResourceTree = (count: number): ParsedResource[] => {
      const resources: ParsedResource[] = [];
      
      for (let i = 0; i < count; i++) {
        resources.push({
          id: `resource${i}`,
          name: `resource${i}`,
          displayName: `Resource ${i}`,
          path: `/resource${i}`,
          basePath: `http://localhost:3000/api/resource${i}`,
          methods: ['GET'],
          schema: [],
          operations: {},
          is_restful: true,
          resource_type: 'read_only',
          tags: [`Resource${i}`],
          sub_resources: i < 10 ? [
            {
              id: `resource${i}.sub`,
              name: 'sub',
              displayName: 'Sub Resource',
              path: `/resource${i}/{id}/sub`,
              basePath: `http://localhost:3000/api/resource${i}/{id}/sub`,
              methods: ['GET'],
              schema: [],
              operations: {},
              is_restful: false,
              resource_type: 'read_only',
              tags: [`Resource${i}`],
              sub_resources: [],
              parent_resource: `resource${i}`
            }
          ] : []
        });
      }
      
      return resources;
    };

    it('应该在大量资源中快速查找', () => {
      const largeResourceTree = generateLargeResourceTree(1000);
      
      const startTime = performance.now();
      const result = resourceManager.findByName(largeResourceTree, 'resource500');
      const endTime = performance.now();
      
      expect(result).toBeTruthy();
      expect(result?.id).toBe('resource500');
      expect(endTime - startTime).toBeLessThan(10); // 应该在10ms内完成
    });

    it('应该快速生成统计信息', () => {
      const largeResourceTree = generateLargeResourceTree(1000);
      
      const startTime = performance.now();
      const stats = resourceManager.getStats(largeResourceTree);
      const endTime = performance.now();
      
      expect(stats.total).toBe(1010); // 1000个顶级 + 10个子资源
      expect(stats.topLevel).toBe(1000);
      expect(stats.withSubResources).toBe(10);
      expect(endTime - startTime).toBeLessThan(20); // 应该在20ms内完成
    });
  });
});
