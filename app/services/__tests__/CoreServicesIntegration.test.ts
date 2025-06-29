/**
 * Integration tests for the refactored core services
 * Tests the OpenAPIParser and ResourceManager working together
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { OpenAPIParser, resourceManager, ResourceQuery } from '~/services';
import type { OpenAPISpec, ParsedResource } from '~/types/openapi';

// Sample OpenAPI spec for testing
const sampleOpenAPISpec: OpenAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sample API',
    version: '1.0.0',
    description: 'A sample API for testing'
  },
  servers: [
    { url: 'https://api.example.com/v1' }
  ],
  paths: {
    '/users': {
      get: {
        summary: 'List users',
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
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                          email: { type: 'string', format: 'email' }
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
      post: {
        summary: 'Create user',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' }
                },
                required: ['name', 'email']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Created' }
        }
      }
    },
    '/users/{id}': {
      get: {
        summary: 'Get user',
        responses: {
          '200': { description: 'Success' }
        }
      },
      put: {
        summary: 'Update user',
        responses: {
          '200': { description: 'Success' }
        }
      },
      delete: {
        summary: 'Delete user',
        responses: {
          '204': { description: 'Success' }
        }
      }
    },
    '/users/{id}/posts': {
      get: {
        summary: 'List user posts',
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
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          title: { type: 'string' },
                          content: { type: 'string' },
                          user_id: { type: 'integer' }
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
      post: {
        summary: 'Create user post',
        responses: {
          '201': { description: 'Created' }
        }
      }
    },
    '/users/{id}/posts/{postId}/comments': {
      get: {
        summary: 'List post comments',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      content: { type: 'string' },
                      author: { type: 'string' },
                      post_id: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': { description: 'OK' }
        }
      }
    }
  }
};

describe('Core Services Integration', () => {
  let parsedAnalysis: any;
  let resources: ParsedResource[];

  beforeAll(async () => {
    // Parse the sample OpenAPI spec
    parsedAnalysis = OpenAPIParser.parseSpec(sampleOpenAPISpec);
    resources = parsedAnalysis.resources;
  });

  describe('OpenAPIParser', () => {
    test('should parse OpenAPI spec correctly', () => {
      expect(parsedAnalysis.title).toBe('Sample API');
      expect(parsedAnalysis.version).toBe('1.0.0');
      expect(parsedAnalysis.base_url).toBe('https://api.example.com/v1');
      expect(resources).toBeDefined();
      expect(Array.isArray(resources)).toBe(true);
    });

    test('should extract proper resource hierarchy', () => {
      // Should have top-level users resource
      const usersResource = resources.find(r => r.name === 'users');
      expect(usersResource).toBeDefined();
      expect(usersResource?.methods).toContain('GET');
      expect(usersResource?.methods).toContain('POST');
      expect(usersResource?.methods).toContain('PUT');
      expect(usersResource?.methods).toContain('DELETE');
      expect(usersResource?.is_restful).toBe(true);
      expect(usersResource?.resource_type).toBe('full_crud');

      // Should have sub-resources
      expect(usersResource?.sub_resources).toBeDefined();
      expect(usersResource?.sub_resources?.length).toBeGreaterThan(0);
    });

    test('should extract schema information', () => {
      const usersResource = resources.find(r => r.name === 'users');
      expect(usersResource?.schema).toBeDefined();
      expect(usersResource?.schema.length).toBeGreaterThan(0);
      
      // Should have fields from the resource object (extracted from array items)
      const fields = usersResource?.schema || [];
      const fieldNames = fields.map(f => f.name);
      
      // Should have resource fields extracted from GET /users response array items
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('email');
      
      // Should NOT have wrapper fields like 'data' since we extract from array items
      expect(fieldNames).not.toContain('data');
      
      // Verify field types
      const idField = fields.find(f => f.name === 'id');
      const nameField = fields.find(f => f.name === 'name');
      const emailField = fields.find(f => f.name === 'email');
      
      expect(idField?.type).toBe('integer');
      expect(nameField?.type).toBe('string');
      expect(emailField?.type).toBe('email');
    });

    test('should filter out non-resource paths', () => {
      // Health endpoint should be filtered out as it's not a resource
      // The current implementation filters out common action endpoints
      const allResourceNames = resources.map(r => r.name);
      
      // Health should be filtered out by the action segments filter
      expect(allResourceNames).not.toContain('health');
      
      // But we should have users resource
      expect(allResourceNames).toContain('users');
    });
  });

  describe('ResourceManager', () => {
    test('should find resources by name', () => {
      const usersResource = resourceManager.findByName(resources, 'users');
      expect(usersResource).toBeDefined();
      expect(usersResource?.name).toBe('users');

      const postsResource = resourceManager.findByName(resources, 'posts');
      expect(postsResource).toBeDefined();
      expect(postsResource?.name).toBe('posts');
    });

    test('should prefer top-level resources', () => {
      const usersResource = resourceManager.findByName(resources, 'users', {
        preferTopLevel: true
      });
      expect(usersResource).toBeDefined();
      expect(usersResource?.parent_resource).toBeUndefined();
    });

    test('should find resources by path', () => {
      const postsResource = resourceManager.findByPath(resources, 'users.posts');
      expect(postsResource).toBeDefined();
      expect(postsResource?.name).toBe('posts');

      const commentsResource = resourceManager.findByPath(resources, 'users.posts.comments');
      expect(commentsResource).toBeDefined();
      expect(commentsResource?.name).toBe('comments');
    });

    test('should get resource hierarchy', () => {
      const hierarchy = resourceManager.getResourceHierarchy(resources, 'posts');
      expect(hierarchy).toBeDefined();
      expect(hierarchy?.resource.name).toBe('posts');
      expect(hierarchy?.path).toEqual(['users', 'posts']);
      expect(hierarchy?.depth).toBe(1);
      expect(hierarchy?.isTopLevel).toBe(false);
    });

    test('should validate resources', () => {
      const usersResource = resourceManager.findByName(resources, 'users');
      if (usersResource) {
        const validation = resourceManager.validateResource(usersResource);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      }
    });

    test('should calculate statistics', () => {
      const stats = resourceManager.getStats(resources);
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.topLevel).toBeGreaterThan(0);
      expect(stats.restful).toBeGreaterThan(0);
      expect(stats.operationCounts).toBeDefined();
      expect(stats.operationCounts['GET']).toBeGreaterThan(0);
    });

    test('should find resources by operation', () => {
      const getResources = resourceManager.findResourcesByOperation(resources, 'GET');
      expect(getResources.length).toBeGreaterThan(0);
      
      const postResources = resourceManager.findResourcesByOperation(resources, 'POST');
      expect(postResources.length).toBeGreaterThan(0);
    });
  });

  describe('ResourceQuery', () => {
    test('should create queries fluently', () => {
      const query = new ResourceQuery(resources);
      expect(query).toBeDefined();
    });

    test('should filter by name', () => {
      const results = new ResourceQuery(resources)
        .byName('users')
        .execute();
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.name.includes('users'))).toBe(true);
    });

    test('should filter by operations', () => {
      const results = new ResourceQuery(resources)
        .withOperation('POST')
        .execute();
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.methods?.includes('POST'))).toBe(true);
    });

    test('should filter by RESTful status', () => {
      const restfulResults = new ResourceQuery(resources)
        .isRESTful(true)
        .execute();
      
      expect(restfulResults.length).toBeGreaterThan(0);
      expect(restfulResults.every(r => r.is_restful)).toBe(true);
    });

    test('should chain filters', () => {
      const results = new ResourceQuery(resources)
        .withOperation('GET')
        .isRESTful(true)
        .sortByName()
        .limit(5)
        .execute();
      
      expect(results.length).toBeLessThanOrEqual(5);
      expect(results.every(r => r.is_restful && r.methods?.includes('GET'))).toBe(true);
    });

    test('should count results', () => {
      const count = new ResourceQuery(resources)
        .withOperation('GET')
        .count();
      
      expect(count).toBeGreaterThan(0);
    });

    test('should check existence', () => {
      const exists = new ResourceQuery(resources)
        .byName('users')
        .exists();
      
      expect(exists).toBe(true);

      const notExists = new ResourceQuery(resources)
        .byName('nonexistent')
        .exists();
      
      expect(notExists).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', () => {
      expect(resourceManager.findByName([], 'test')).toBeNull();
      expect(resourceManager.findByName(resources, '')).toBeNull();
      expect(resourceManager.findByPath(resources, '')).toBeNull();
      expect(resourceManager.getResourceHierarchy([], 'test')).toBeNull();
    });

    test('should handle deep nesting limits', () => {
      // Find comments resource which is nested: users -> posts -> comments
      const result = resourceManager.findByName(resources, 'comments', {
        maxDepth: 1 // Should not find deeply nested comments (depth > 1)
      });
      expect(result).toBeNull();

      const resultWithDepth = resourceManager.findByName(resources, 'comments', {
        maxDepth: 10 // Should find deeply nested comments 
      });
      expect(resultWithDepth).toBeDefined();
      expect(resultWithDepth?.name).toBe('comments');
    });
  });
});
