/**
 * 测试新的资源提取逻辑的不同响应格式支持
 */

import { describe, test, expect } from 'vitest';
import { OpenAPIParser } from '~/services/OpenAPIParser';
import type { OpenAPISpec } from '~/types/openapi';

describe('OpenAPIParser - Response Format Tests', () => {
  
  test('should extract schema from direct array response', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/products': {
          get: {
            summary: 'List products',
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
                          name: { type: 'string' },
                          price: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create product',
            responses: { '201': { description: 'Created' } }
          }
        }
      }
    };

    const result = OpenAPIParser.parseSpec(spec);
    const productsResource = result.resources.find(r => r.name === 'products');
    
    expect(productsResource).toBeDefined();
    expect(productsResource?.schema.length).toBe(3);
    
    const fieldNames = productsResource?.schema.map(f => f.name) || [];
    expect(fieldNames).toContain('id');
    expect(fieldNames).toContain('name');
    expect(fieldNames).toContain('price');
  });

  test('should extract schema from {data: array} response', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
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
                              username: { type: 'string' },
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
            responses: { '201': { description: 'Created' } }
          }
        }
      }
    };

    const result = OpenAPIParser.parseSpec(spec);
    const usersResource = result.resources.find(r => r.name === 'users');
    
    expect(usersResource).toBeDefined();
    expect(usersResource?.schema.length).toBe(3);
    
    const fieldNames = usersResource?.schema.map(f => f.name) || [];
    expect(fieldNames).toContain('id');
    expect(fieldNames).toContain('username');
    expect(fieldNames).toContain('email');
    expect(fieldNames).not.toContain('data'); // Should not include wrapper
  });

  test('should extract schema from {list: array} response', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/orders': {
          get: {
            summary: 'List orders',
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        list: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              total: { type: 'number' },
                              status: { type: 'string' }
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
            summary: 'Create order',
            responses: { '201': { description: 'Created' } }
          }
        }
      }
    };

    const result = OpenAPIParser.parseSpec(spec);
    const ordersResource = result.resources.find(r => r.name === 'orders');
    
    expect(ordersResource).toBeDefined();
    expect(ordersResource?.schema.length).toBe(3);
    
    const fieldNames = ordersResource?.schema.map(f => f.name) || [];
    expect(fieldNames).toContain('id');
    expect(fieldNames).toContain('total');
    expect(fieldNames).toContain('status');
    expect(fieldNames).not.toContain('list'); // Should not include wrapper
  });

  test('should extract schema from {items: array} response', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/categories': {
          get: {
            summary: 'List categories',
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'integer' },
                              name: { type: 'string' },
                              description: { type: 'string' }
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
            summary: 'Create category',
            responses: { '201': { description: 'Created' } }
          }
        }
      }
    };

    const result = OpenAPIParser.parseSpec(spec);
    const categoriesResource = result.resources.find(r => r.name === 'categories');
    
    expect(categoriesResource).toBeDefined();
    expect(categoriesResource?.schema.length).toBe(3);
    
    const fieldNames = categoriesResource?.schema.map(f => f.name) || [];
    expect(fieldNames).toContain('id');
    expect(fieldNames).toContain('name');
    expect(fieldNames).toContain('description');
    expect(fieldNames).not.toContain('items'); // Should not include wrapper
  });

  test('should extract schema from {resourceName: array} response', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/books': {
          get: {
            summary: 'List books',
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        books: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              isbn: { type: 'string' },
                              title: { type: 'string' },
                              author: { type: 'string' },
                              pages: { type: 'integer' }
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
            summary: 'Create book',
            responses: { '201': { description: 'Created' } }
          }
        }
      }
    };

    const result = OpenAPIParser.parseSpec(spec);
    const booksResource = result.resources.find(r => r.name === 'books');
    
    expect(booksResource).toBeDefined();
    expect(booksResource?.schema.length).toBe(4);
    
    const fieldNames = booksResource?.schema.map(f => f.name) || [];
    expect(fieldNames).toContain('isbn');
    expect(fieldNames).toContain('title');
    expect(fieldNames).toContain('author');
    expect(fieldNames).toContain('pages');
    expect(fieldNames).not.toContain('books'); // Should not include wrapper
  });

  test('should skip non-RESTful endpoints', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/search': {
          get: {
            summary: 'Search endpoint - not RESTful',
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
                          title: { type: 'string' }
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
            summary: 'Health check - not RESTful',
            responses: {
              '200': { description: 'OK' }
            }
          }
        }
      }
    };

    const result = OpenAPIParser.parseSpec(spec);
    
    // These should be filtered out as they're not RESTful (no POST/PUT/DELETE)
    expect(result.resources.length).toBe(0);
  });

  test('should handle missing response schemas gracefully', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/incomplete': {
          get: {
            summary: 'Incomplete endpoint',
            responses: {
              '200': {
                description: 'Success'
                // No content/schema defined
              }
            }
          },
          post: {
            summary: 'Create incomplete',
            responses: { '201': { description: 'Created' } }
          }
        }
      }
    };

    const result = OpenAPIParser.parseSpec(spec);
    
    // Should create resource even if no schema can be extracted (still RESTful)
    const incompleteResource = result.resources.find(r => r.name === 'incomplete');
    expect(incompleteResource).toBeDefined();
    expect(incompleteResource?.schema).toEqual([]); // Empty schema array
    expect(incompleteResource?.is_restful).toBe(true);
  });

});
