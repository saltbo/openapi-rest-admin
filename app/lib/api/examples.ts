/**
 * OpenAPI 服务使用示例
 * 
 * 展示如何使用新的 OpenAPI 服务架构
 */

import { createOpenAPIService } from './index';

/**
 * 基本用法示例
 */
async function basicUsageExample() {
  // 1. 创建服务实例
  const apiService = createOpenAPIService('https://api.example.com');
  
  try {
    // 2. 初始化 - 解析 OpenAPI 文档
    await apiService.initialize('https://api.example.com/openapi.json');
    
    // 3. 获取文档信息
    const docInfo = apiService.getDocumentInfo();
    console.log('API Document:', docInfo);
    
    // 4. 获取资源统计
    const stats = apiService.getResourceStatistics();
    console.log('Resource Statistics:', stats);
    
    // 5. 获取所有资源的 schemas
    const schemas = apiService.getAllResourceSchemas();
    console.log('Available Resources:', Object.keys(schemas));
    
  } catch (error) {
    console.error('Failed to initialize API service:', error);
  }
}

/**
 * 表单渲染示例
 */
async function formRenderingExample() {
  const apiService = createOpenAPIService('https://api.example.com');
  await apiService.initialize('https://api.example.com/openapi.json');
  
  try {
    // 获取用户创建表单的 schema
    const createFormSchema = apiService.getResourceFormSchema('users', {
      excludeFields: ['id', 'created_at', 'updated_at'],
      fieldOrder: ['name', 'email', 'age'],
      fieldConfig: {
        email: { 'ui:widget': 'email' },
        age: { 'ui:widget': 'updown' }
      }
    });
    
    console.log('Create User Form Schema:', createFormSchema);
    
    // 获取用户编辑表单的 schema
    const editFormSchema = apiService.getResourceFormSchema('users', {
      excludeFields: ['created_at'],
      fieldConfig: {
        id: { 'ui:readonly': true },
        email: { 'ui:widget': 'email' }
      }
    });
    
    console.log('Edit User Form Schema:', editFormSchema);
    
  } catch (error) {
    console.error('Failed to generate form schemas:', error);
  }
}

/**
 * 表格渲染示例
 */
async function tableRenderingExample() {
  const apiService = createOpenAPIService('https://api.example.com');
  await apiService.initialize('https://api.example.com/openapi.json');
  
  try {
    // 获取用户列表表格的 schema
    const tableSchema = apiService.getResourceTableSchema('users', {
      columns: ['id', 'name', 'email', 'created_at'],
      columnOrder: ['id', 'name', 'email', 'created_at'],
      sortableColumns: ['id', 'name', 'created_at'],
      filterableColumns: ['name', 'email'],
      columnWidths: {
        id: 80,
        name: 150,
        email: 200,
        created_at: 120
      }
    });
    
    console.log('Users Table Schema:', tableSchema);
    
  } catch (error) {
    console.error('Failed to generate table schema:', error);
  }
}

/**
 * API 请求示例
 */
async function apiRequestExample() {
  const apiService = createOpenAPIService('https://api.example.com');
  await apiService.initialize('https://api.example.com/openapi.json');
  
  // 设置认证
  apiService.setAuth('your-jwt-token');
  
  const client = apiService.getClient();
  const parser = apiService.getParser();
  
  try {
    // 获取用户列表操作
    const listOperation = parser.getOperationInfo('GET', '/users');
    if (listOperation) {
      const response = await client.getList(listOperation, {
        page: 1,
        pageSize: 10,
        filters: {
          status: 'active'
        },
        sort: 'created_at',
        order: 'desc'
      });
      
      console.log('Users List:', response.data);
      console.log('Pagination:', response.pagination);
    }
    
    // 获取单个用户
    const getOperation = parser.getOperationInfo('GET', '/users/{id}');
    if (getOperation) {
      const userResponse = await client.getById(getOperation, '123');
      console.log('User Detail:', userResponse.data);
    }
    
    // 创建新用户
    const createOperation = parser.getOperationInfo('POST', '/users');
    if (createOperation) {
      const newUser = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };
      
      const createResponse = await client.create(createOperation, newUser);
      console.log('Created User:', createResponse.data);
    }
    
    // 更新用户
    const updateOperation = parser.getOperationInfo('PUT', '/users/{id}');
    if (updateOperation) {
      const updatedData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 25
      };
      
      const updateResponse = await client.update(updateOperation, '123', updatedData);
      console.log('Updated User:', updateResponse.data);
    }
    
    // 删除用户
    const deleteOperation = parser.getOperationInfo('DELETE', '/users/{id}');
    if (deleteOperation) {
      await client.delete(deleteOperation, '123');
      console.log('User deleted successfully');
    }
    
  } catch (error) {
    console.error('API request failed:', error);
    
    // 错误处理示例
    if (client.isValidationError(error)) {
      console.error('Validation errors:', error.validationErrors);
    } else if (client.isAuthError(error)) {
      console.error('Authentication required');
    } else if (client.isNetworkError(error)) {
      console.error('Network connection failed');
    } else if (client.isServerError(error)) {
      console.error('Server error occurred');
    }
  }
}

/**
 * 高级用法示例
 */
async function advancedUsageExample() {
  const apiService = createOpenAPIService('https://api.example.com');
  await apiService.initialize('https://api.example.com/openapi.json');
  
  const parser = apiService.getParser();
  const renderer = apiService.getRenderer();
  const client = apiService.getClient();
  
  // 获取所有资源的详细信息
  const schemas = parser.getAllResourceSchemas();
  
  for (const [resourceName, schema] of Object.entries(schemas)) {
    console.log(`\n=== Resource: ${resourceName} ===`);
    
    // 生成创建表单
    const createForm = renderer.getCreateFormSchema(schema);
    console.log('Create Form:', createForm.schema.properties);
    
    // 生成编辑表单
    const editForm = renderer.getEditFormSchema(schema);
    console.log('Edit Form:', editForm.schema.properties);
    
    // 生成表格
    const table = renderer.getTableSchema(schema);
    console.log('Table Columns:', table.columns.map(col => col.key));
  }
  
  // 自定义请求头
  client.setDefaultHeaders({
    'X-API-Version': '2.0',
    'X-Client-Type': 'web'
  });
  
  // 获取统计信息
  const stats = parser.getResourceStatistics();
  console.log('\n=== API Statistics ===');
  console.log(`Total Resources: ${stats.totalResources}`);
  console.log(`RESTful Resources: ${stats.restfulResources}`);
  console.log(`Total Operations: ${stats.totalOperations}`);
  console.log('HTTP Methods:', stats.methodCounts);
  console.log('Tags:', stats.tagCounts);
}

// 导出示例函数供外部调用
export {
  basicUsageExample,
  formRenderingExample,
  tableRenderingExample,
  apiRequestExample,
  advancedUsageExample
};
