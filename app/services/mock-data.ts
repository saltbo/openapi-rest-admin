import type { 
  ParsedResource, 
  FieldDefinition, 
  ResourceDataItem, 
  APIResponse,
  FieldType 
} from '../types/api';

/**
 * Mock 数据生成服务
 * 用于开发阶段生成模拟数据
 */
export class MockDataService {
  private cache = new Map<string, ResourceDataItem[]>();

  /**
   * 为资源生成 Mock 数据
   */
  generateMockData(resource: ParsedResource, count: number = 20): ResourceDataItem[] {
    const cacheKey = `${resource.id}_${count}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const data: ResourceDataItem[] = [];
    
    for (let i = 1; i <= count; i++) {
      const item: ResourceDataItem = {
        id: i,
        ...this.generateFieldValues(resource.schema, i)
      };

      // 如果是子资源，添加父资源关联字段
      if (resource.parent_resource) {
        item.parentId = Math.floor(Math.random() * 10) + 1; // 随机父资源ID
        item.parentResource = resource.parent_resource;
        
        // 添加一些子资源特有的字段
        item.name = item.name || `${resource.name} Item ${i}`;
        item.description = item.description || `${resource.name} associated with ${resource.parent_resource}`;
        item.status = item.status || ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)];
        item.createdAt = item.createdAt || new Date(Date.now() - Math.random() * 86400000 * 30).toISOString();
        item.updatedAt = item.updatedAt || new Date(Date.now() - Math.random() * 86400000 * 7).toISOString();
        item.type = item.type || resource.name;
      }
      
      data.push(item);
    }

    this.cache.set(cacheKey, data);
    return data;
  }

  /**
   * 为子资源生成 Mock 数据
   */
  generateSubResourceMockData(
    subResource: ParsedResource, 
    parentResourceId: string,
    parentItemId: string | number,
    count: number = 10
  ): ResourceDataItem[] {
    const cacheKey = `sub_${subResource.id}_${parentResourceId}_${parentItemId}_${count}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const data: ResourceDataItem[] = [];
    
    for (let i = 1; i <= count; i++) {
      const item: ResourceDataItem = {
        id: `${subResource.name}_${parentItemId}_${i}`,
        parentId: parentItemId,
        parentResource: parentResourceId,
        ...this.generateFieldValues(subResource.schema, i),
        // 添加一些特定于子资源的字段
        name: `${subResource.name} Item ${i}`,
        description: `${subResource.name} associated with ${parentResourceId} (ID: ${parentItemId})`,
        status: ['active', 'inactive', 'pending', 'completed'][Math.floor(Math.random() * 4)],
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        type: subResource.name,
        category: `${subResource.name}_category_${(i % 3) + 1}`,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        owner: `user_${Math.floor(Math.random() * 10) + 1}`,
        tags: [`tag_${i}`, `${subResource.name}_tag`]
      };
      data.push(item);
    }

    this.cache.set(cacheKey, data);
    return data;
  }

  /**
   * 生成单个子资源项
   */
  generateSingleSubResourceItem(
    subResource: ParsedResource,
    parentResourceId: string,
    parentItemId: string | number,
    subItemId: string | number
  ): ResourceDataItem {
    const index = typeof subItemId === 'string' ? 
      parseInt(subItemId.split('_').pop() || '1') : 
      Number(subItemId);
      
    const item: ResourceDataItem = {
      id: subItemId,
      parentId: parentItemId,
      parentResource: parentResourceId,
      ...this.generateFieldValues(subResource.schema, index),
      // 添加一些特定的字段
      name: `${subResource.name} Item ${subItemId}`,
      description: `Detailed ${subResource.name} associated with ${parentResourceId} (ID: ${parentItemId})`,
      status: ['active', 'inactive', 'pending', 'completed'][index % 4],
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      lastModifiedBy: `user_${Math.floor(Math.random() * 10) + 1}`,
      type: subResource.name,
      category: `${subResource.name}_category_${(index % 3) + 1}`,
      priority: ['low', 'medium', 'high'][index % 3],
      owner: `user_${Math.floor(Math.random() * 10) + 1}`,
      tags: [`tag_${index}`, `${subResource.name}_tag`, 'detailed'],
      metadata: {
        source: 'sub_resource_generator',
        parentRef: `${parentResourceId}:${parentItemId}`,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      },
      // 添加一些可能的业务字段
      ...(Math.random() > 0.5 && { cost: Math.floor(Math.random() * 10000) }),
      ...(Math.random() > 0.5 && { duration: Math.floor(Math.random() * 100) + 1 }),
      ...(Math.random() > 0.5 && { progress: Math.floor(Math.random() * 101) }),
      ...(Math.random() > 0.5 && { rating: Math.floor(Math.random() * 5) + 1 }),
      ...(Math.random() > 0.5 && { isPublic: Math.random() > 0.5 })
    };

    return item;
  }

  /**
   * 生成单个资源项
   */
  generateSingleResourceItem(
    resource: ParsedResource,
    itemId: string | number
  ): ResourceDataItem {
    const index = typeof itemId === 'string' ? 
      parseInt(itemId.toString()) || 1 : 
      Number(itemId);
      
    const item: ResourceDataItem = {
      id: itemId,
      ...this.generateFieldValues(resource.schema, index),
    };

    // 如果是子资源，添加父资源关联字段
    if (resource.parent_resource) {
      item.parentId = Math.floor(Math.random() * 10) + 1; // 随机父资源ID
      item.parentResource = resource.parent_resource;
      
      // 添加一些子资源特有的字段
      item.name = item.name || `${resource.name} Item ${itemId}`;
      item.description = item.description || `${resource.name} associated with ${resource.parent_resource}`;
      item.status = item.status || ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)];
      item.createdAt = item.createdAt || new Date(Date.now() - Math.random() * 86400000 * 30).toISOString();
      item.updatedAt = item.updatedAt || new Date(Date.now() - Math.random() * 86400000 * 7).toISOString();
      item.type = item.type || resource.name;
    }

    return item;
  }

  /**
   * 生成字段值
   */
  private generateFieldValues(fields: FieldDefinition[], index: number): Record<string, any> {
    const values: Record<string, any> = {};

    fields.forEach(field => {
      values[field.name] = this.generateFieldValue(field, index);
    });

    return values;
  }

  /**
   * 生成单个字段值
   */
  private generateFieldValue(field: FieldDefinition, index: number): any {
    // 如果有示例值，有一定概率使用示例值
    if (field.example && Math.random() < 0.3) {
      return field.example;
    }

    // 如果有枚举值，随机选择一个
    if (field.enum && field.enum.length > 0) {
      return field.enum[Math.floor(Math.random() * field.enum.length)];
    }

    // 根据字段类型生成值
    switch (field.type) {
      case 'string':
        return this.generateStringValue(field, index);
      case 'integer':
        return this.generateIntegerValue(field, index);
      case 'number':
        return this.generateNumberValue(field, index);
      case 'boolean':
        return Math.random() > 0.5;
      case 'date':
        return this.generateDateValue();
      case 'datetime':
        return this.generateDateTimeValue();
      case 'email':
        return this.generateEmailValue(index);
      case 'url':
        return this.generateUrlValue(index);
      case 'array':
        return this.generateArrayValue(field, index);
      case 'object':
        return this.generateObjectValue(field, index);
      default:
        return `${field.name}_${index}`;
    }
  }

  /**
   * 生成字符串值
   */
  private generateStringValue(field: FieldDefinition, index: number): string {
    const templates = {
      name: ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Helen'],
      title: ['Manager', 'Developer', 'Designer', 'Analyst', 'Coordinator', 'Specialist'],
      description: [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.'
      ],
      status: ['active', 'inactive', 'pending', 'completed', 'cancelled'],
      category: ['Technology', 'Business', 'Design', 'Marketing', 'Sales'],
      tag: ['important', 'urgent', 'normal', 'low', 'high']
    };

    // 根据字段名称选择合适的模板
    const fieldLower = field.name.toLowerCase();
    
    if (fieldLower.includes('name')) {
      const names = templates.name;
      return names[index % names.length] + (index > names.length ? ` ${Math.floor(index / names.length)}` : '');
    }
    
    if (fieldLower.includes('title')) {
      const titles = templates.title;
      return titles[index % titles.length];
    }
    
    if (fieldLower.includes('description') || fieldLower.includes('content')) {
      const descriptions = templates.description;
      return descriptions[index % descriptions.length];
    }
    
    if (fieldLower.includes('status')) {
      const statuses = templates.status;
      return statuses[index % statuses.length];
    }
    
    if (fieldLower.includes('category') || fieldLower.includes('type')) {
      const categories = templates.category;
      return categories[index % categories.length];
    }
    
    if (fieldLower.includes('tag')) {
      const tags = templates.tag;
      return tags[index % tags.length];
    }
    
    // 默认字符串生成
    return `${field.name}_${index}`;
  }

  /**
   * 生成整数值
   */
  private generateIntegerValue(field: FieldDefinition, index: number): number {
    const fieldLower = field.name.toLowerCase();
    
    if (fieldLower.includes('age')) {
      return 20 + (index % 50);
    }
    
    if (fieldLower.includes('count') || fieldLower.includes('quantity')) {
      return 1 + (index % 100);
    }
    
    if (fieldLower.includes('price') || fieldLower.includes('amount')) {
      return 10 + (index % 1000);
    }
    
    return index;
  }

  /**
   * 生成数字值
   */
  private generateNumberValue(field: FieldDefinition, index: number): number {
    const fieldLower = field.name.toLowerCase();
    
    if (fieldLower.includes('price') || fieldLower.includes('amount')) {
      return parseFloat((10.99 + (index % 100) * 5.5).toFixed(2));
    }
    
    if (fieldLower.includes('rate') || fieldLower.includes('percentage')) {
      return parseFloat((Math.random() * 100).toFixed(2));
    }
    
    return parseFloat((index * 1.5).toFixed(2));
  }

  /**
   * 生成日期值
   */
  private generateDateValue(): string {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString().split('T')[0];
  }

  /**
   * 生成日期时间值
   */
  private generateDateTimeValue(): string {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString();
  }

  /**
   * 生成邮箱值
   */
  private generateEmailValue(index: number): string {
    const domains = ['example.com', 'test.com', 'demo.org', 'sample.net'];
    const users = ['user', 'admin', 'test', 'demo', 'sample'];
    
    const user = users[index % users.length];
    const domain = domains[index % domains.length];
    const suffix = index > users.length ? index : '';
    
    return `${user}${suffix}@${domain}`;
  }

  /**
   * 生成URL值
   */
  private generateUrlValue(index: number): string {
    const domains = ['example.com', 'test.com', 'demo.org', 'sample.net'];
    const paths = ['api', 'docs', 'admin', 'dashboard', 'profile'];
    
    const domain = domains[index % domains.length];
    const path = paths[index % paths.length];
    
    return `https://${domain}/${path}/${index}`;
  }

  /**
   * 生成数组值
   */
  private generateArrayValue(field: FieldDefinition, index: number): any[] {
    if (!field.items) return [];
    
    const length = 1 + (index % 5); // 1-5 个元素
    const array = [];
    
    for (let i = 0; i < length; i++) {
      array.push(this.generateFieldValue(field.items, index + i));
    }
    
    return array;
  }

  /**
   * 生成对象值
   */
  private generateObjectValue(field: FieldDefinition, index: number): Record<string, any> {
    if (!field.properties) return {};
    
    const obj: Record<string, any> = {};
    Object.values(field.properties).forEach(prop => {
      obj[prop.name] = this.generateFieldValue(prop, index);
    });
    
    return obj;
  }

  /**
   * 生成分页数据响应
   */
  generatePaginatedResponse<T = ResourceDataItem>(
    data: T[],
    page: number = 1,
    pageSize: number = 10
  ): APIResponse<T[]> {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = data.slice(start, end);

    return {
      data: paginatedData,
      success: true,
      total: data.length,
      page,
      pageSize
    };
  }

  /**
   * 生成单个资源响应
   */
  generateSingleResponse<T = ResourceDataItem>(data: T): APIResponse<T> {
    return {
      data,
      success: true
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 生成后备子资源数据（当无法找到资源定义时使用）
   */
  generateFallbackSubResourceData(
    subResourceName: string,
    parentResourceId: string,
    parentItemId: string | number,
    count: number = 5
  ): ResourceDataItem[] {
    const data: ResourceDataItem[] = [];
    
    for (let i = 1; i <= count; i++) {
      const item: ResourceDataItem = {
        id: `${subResourceName}_${parentItemId}_${i}`,
        parentId: parentItemId,
        parentResource: parentResourceId,
        name: `${subResourceName} Item ${i}`,
        description: `${subResourceName} associated with ${parentResourceId} (ID: ${parentItemId})`,
        status: ['active', 'inactive', 'pending', 'completed'][Math.floor(Math.random() * 4)],
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        type: subResourceName,
        category: `${subResourceName}_category`,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        owner: `user_${Math.floor(Math.random() * 10) + 1}`,
        tags: [`${subResourceName}_tag`],
        // 添加一些随机字段
        ...(Math.random() > 0.5 && { value: Math.floor(Math.random() * 1000) }),
        ...(Math.random() > 0.5 && { isEnabled: Math.random() > 0.5 })
      };
      data.push(item);
    }

    return data;
  }

  /**
   * 生成后备单个子资源项（当无法找到资源定义时使用）
   */
  generateFallbackSingleSubResourceItem(
    subResourceName: string,
    parentResourceId: string,
    parentItemId: string | number,
    subItemId: string | number
  ): ResourceDataItem {
    const index = typeof subItemId === 'string' ? 
      parseInt(subItemId.split('_').pop() || '1') : 
      Number(subItemId);
      
    const item: ResourceDataItem = {
      id: subItemId,
      parentId: parentItemId,
      parentResource: parentResourceId,
      name: `${subResourceName} Item ${subItemId}`,
      description: `${subResourceName} associated with ${parentResourceId} (ID: ${parentItemId})`,
      status: ['active', 'inactive', 'pending', 'completed'][index % 4],
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      type: subResourceName,
      category: `${subResourceName}_category`,
      priority: ['low', 'medium', 'high'][index % 3],
      owner: `user_${Math.floor(Math.random() * 10) + 1}`,
      tags: [`${subResourceName}_tag`],
      // 添加一些基本字段
      value: Math.floor(Math.random() * 1000),
      isEnabled: Math.random() > 0.5,
      lastModified: new Date().toISOString(),
      version: '1.0'
    };

    return item;
  }
}

// 导出单例实例
export const mockDataService = new MockDataService();
