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
        path: '/books/{id}/notes',
        basePath: 'http://localhost:3000/api/books/{id}/notes',
        methods: ['GET', 'POST'],
        schema: [],
        operations: {},
        is_restful: true,
        resource_type: 'custom',
        tags: ['Books'],
        sub_resources: [],
        parent_resource: 'books'
      }
    ]
  },
  {
    id: 'notes',
    name: 'notes',
    path: '/notes',
    basePath: 'http://localhost:3000/api/notes',
    methods: ['GET', 'DELETE'],
    schema: [],
    operations: {},
    is_restful: true,
    resource_type: 'custom',
    tags: ['Notes'],
    sub_resources: [
      {
        id: 'notes.reviews',
        name: 'reviews',
        path: '/notes/{id}/reviews',
        basePath: 'http://localhost:3000/api/notes/{id}/reviews',
        methods: ['GET'],
        schema: [],
        operations: {},
        is_restful: false,
        resource_type: 'read_only',
        tags: ['Notes'],
        sub_resources: [],
        parent_resource: 'notes'
      }
    ]
  }
];

describe('ResourceManager', () => {
  let resourceManager: ResourceManager;

  beforeEach(() => {
    resourceManager = new ResourceManager();
  });

  describe('findByName', () => {
    it('should find resource by exact name', () => {
      const resource = resourceManager.findByName(mockResources, 'books');
      expect(resource).toBeDefined();
      expect(resource?.name).toBe('books');
    });

    it('should return null for non-existent resource', () => {
      const resource = resourceManager.findByName(mockResources, 'nonexistent');
      expect(resource).toBeNull();
    });

    it('should find nested resource', () => {
      const resource = resourceManager.findByName(mockResources, 'reviews');
      expect(resource).toBeDefined();
      expect(resource?.name).toBe('reviews');
      expect(resource?.parent_resource).toBe('notes');
    });

    it('should handle empty resources array', () => {
      const resource = resourceManager.findByName([], 'books');
      expect(resource).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find resource by ID', () => {
      const resource = resourceManager.findById(mockResources, 'books');
      expect(resource).toBeDefined();
      expect(resource?.id).toBe('books');
    });

    it('should find nested resource by ID', () => {
      const resource = resourceManager.findById(mockResources, 'authors.books');
      expect(resource).toBeDefined();
      expect(resource?.id).toBe('authors.books');
    });

    it('should return null for non-existent ID', () => {
      const resource = resourceManager.findById(mockResources, 'nonexistent');
      expect(resource).toBeNull();
    });
  });

  describe('getTopLevelResources', () => {
    it('should return only top-level resources', () => {
      const results = resourceManager.getTopLevelResources(mockResources);
      expect(results.length).toBe(3); // authors, books, notes
      expect(results.every(r => !r.parent_resource)).toBe(true);
    });

    it('should handle empty array', () => {
      const results = resourceManager.getTopLevelResources([]);
      expect(results).toEqual([]);
    });
  });

  describe('getAllSubResources', () => {
    it('should return all sub-resources recursively', () => {
      const booksResource = resourceManager.findByName(mockResources, 'books')!;
      const subResources = resourceManager.getAllSubResources(booksResource);
      expect(subResources.length).toBe(1); // notes
      expect(subResources[0].name).toBe('notes');
    });

    it('should handle resource without sub-resources', () => {
      const notesResource = resourceManager.findByName(mockResources, 'reviews')!;
      const subResources = resourceManager.getAllSubResources(notesResource);
      expect(subResources).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should calculate correct statistics', () => {
      const stats = resourceManager.getStats(mockResources);
      
      expect(stats.total).toBe(6); // All resources including nested ones
      expect(stats.topLevel).toBe(3); // authors, books, notes
      expect(stats.restful).toBeGreaterThan(0);
      expect(stats.withSubResources).toBe(3); // authors, books, notes have sub-resources
      expect(stats.maxDepth).toBeGreaterThan(0);
      expect(stats.operationCounts).toBeDefined();
    });

    it('should handle empty resources array', () => {
      const stats = resourceManager.getStats([]);
      expect(stats.total).toBe(0);
      expect(stats.topLevel).toBe(0);
      expect(stats.restful).toBe(0);
      expect(stats.withSubResources).toBe(0);
      expect(stats.maxDepth).toBe(0);
    });

    it('should handle invalid input', () => {
      const stats = resourceManager.getStats(null as any);
      expect(stats.total).toBe(0);
    });
  });

  describe('complex hierarchy tests', () => {
    const complexResources: ParsedResource[] = [
      {
        id: 'library',
        name: 'library',
        path: '/library',
        basePath: 'http://localhost:3000/api/library',
        methods: ['GET'],
        schema: [],
        operations: {},
        is_restful: false,
        resource_type: 'read_only',
        tags: ['Library'],
        sub_resources: [
          {
            id: 'library.books',
            name: 'books',
            path: '/library/books',
            basePath: 'http://localhost:3000/api/library/books',
            methods: ['GET', 'POST'],
            schema: [],
            operations: {},
            is_restful: true,
            resource_type: 'custom',
            tags: ['Library'],
            parent_resource: 'library',
            sub_resources: [
              {
                id: 'library.books.reviews',
                name: 'reviews',
                path: '/library/books/{id}/reviews',
                basePath: 'http://localhost:3000/api/library/books/{id}/reviews',
                methods: ['GET', 'POST', 'DELETE'],
                schema: [],
                operations: {},
                is_restful: true,
                resource_type: 'custom',
                tags: ['Library'],
                parent_resource: 'library.books',
                sub_resources: []
              }
            ]
          }
        ]
      }
    ];

    it('should handle complex nested hierarchy', () => {
      const topLevel = resourceManager.getTopLevelResources(complexResources);
      expect(topLevel.length).toBe(1);
      expect(topLevel[0].name).toBe('library');
    });

    it('should find deeply nested resources', () => {
      const reviews = resourceManager.findByName(complexResources, 'reviews');
      expect(reviews).toBeDefined();
      expect(reviews?.parent_resource).toBe('library.books');
    });

    it('should calculate depth correctly', () => {
      const stats = resourceManager.getStats(complexResources);
      expect(stats.maxDepth).toBe(2); // library -> books -> reviews
    });
  });

  describe('performance tests', () => {
    it('should handle large number of resources efficiently', () => {
      const largeResourceSet: ParsedResource[] = [];
      
      // Generate 1000 resources
      for (let i = 0; i < 1000; i++) {
        largeResourceSet.push({
          id: `resource_${i}`,
          name: `resource_${i}`,
          path: `/resource_${i}`,
          basePath: `http://localhost:3000/api/resource_${i}`,
          methods: ['GET'],
          schema: [],
          operations: {},
          is_restful: false,
          resource_type: 'read_only',
          tags: [`Tag${i % 10}`],
          sub_resources: i % 10 === 0 ? [
            {
              id: `resource_${i}.sub`,
              name: 'sub',
              path: `/resource_${i}/sub`,
              basePath: `http://localhost:3000/api/resource_${i}/sub`,
              methods: ['GET'],
              schema: [],
              operations: {},
              is_restful: false,
              resource_type: 'read_only',
              tags: [`Tag${i % 10}`],
              sub_resources: [],
              parent_resource: `resource_${i}`
            }
          ] : []
        });
      }

      const startTime = performance.now();
      
      // Test available operations
      const found = resourceManager.findByName(largeResourceSet, 'resource_500');
      const topLevel = resourceManager.getTopLevelResources(largeResourceSet);
      const stats = resourceManager.getStats(largeResourceSet);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Verify results
      expect(found).toBeDefined();
      expect(topLevel.length).toBe(1000);
      expect(stats.total).toBeGreaterThan(1000);
      
      // Performance should be reasonable (less than 100ms for 1000 resources)
      expect(executionTime).toBeLessThan(100);
    });
  });
});
