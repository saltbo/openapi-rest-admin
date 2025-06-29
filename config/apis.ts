/**
 * 默认 API 配置
 * 这个文件用于初始化数据库数据
 */

export const API_CONFIGS = [
  {
    id: 'multi-resources-demo',
    name: 'Multi Resources Demo',
    description: 'A comprehensive demo API with multiple standard RESTful resources',
    openapi_url: 'http://localhost:5173/multi-resources-api.json',
    enabled: true,
    tags: ['demo', 'multi-resource'],
    version: '1.0.0'
  },
  {
    id: 'simple-rest-demo',
    name: 'Simple REST Demo',
    description: 'A simple REST API demo with authors, books, and notes',
    openapi_url: 'http://localhost:5173/example/simple-rest-server/scripts/openapi.json',
    enabled: true,
    tags: ['demo', 'simple'],
    version: '1.0.0'
  },
  {
    id: 'single-resource-demo',
    name: 'Single Resource Demo',
    description: 'A demo API with single resource type for testing',
    openapi_url: 'http://localhost:5173/single-resource-api.json',
    enabled: true,
    tags: ['demo', 'single-resource'],
    version: '1.0.0'
  }
];
