/**
 * Schema Renderer
 * 
 * 负责为页面渲染提供 schema，基于 OpenAPI schema 生成组件渲染所需的 schema
 * 使用 react-jsonschema-form 的标准格式
 */

import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import type { OpenAPIV3 } from 'openapi-types';

/**
 * 表单配置选项
 */
export interface FormSchemaOptions {
  /** 是否为只读模式 */
  readonly?: boolean;
  /** 要包含的字段 */
  includeFields?: string[];
  /** 要排除的字段 */
  excludeFields?: string[];
  /** 字段显示顺序 */
  fieldOrder?: string[];
  /** 自定义字段配置 */
  fieldConfig?: Record<string, any>;
  /** Schema 引用解析器 */
  schemaResolver?: (ref: string) => any;
}

/**
 * 表格配置选项
 */
export interface TableSchemaOptions {
  /** 要显示的列 */
  columns?: string[];
  /** 列顺序 */
  columnOrder?: string[];
  /** 可排序的列 */
  sortableColumns?: string[];
  /** 可筛选的列 */
  filterableColumns?: string[];
  /** 列宽配置 */
  columnWidths?: Record<string, number>;
  /** 自定义列渲染 */
  customRenderers?: Record<string, string>;
}

/**
 * 表单 Schema 结果
 */
export interface FormSchema {
  /** JSON Schema */
  schema: RJSFSchema;
  /** UI Schema */
  uiSchema: UiSchema;
  /** 表单数据模板 */
  formData?: any;
}

/**
 * 表格列定义
 */
export interface TableColumn {
  /** 列键 */
  key: string;
  /** 列标题 */
  title: string;
  /** 数据类型 */
  dataType: string;
  /** 是否可排序 */
  sortable: boolean;
  /** 是否可筛选 */
  filterable: boolean;
  /** 列宽 */
  width?: number;
  /** 自定义渲染器 */
  render?: string;
  /** 格式化函数 */
  format?: string;
}

/**
 * 表格 Schema 结果
 */
export interface TableSchema {
  /** 列定义 */
  columns: TableColumn[];
  /** 排序配置 */
  defaultSort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  /** 分页配置 */
  pagination?: {
    pageSize: number;
    showSizeChanger: boolean;
    showQuickJumper: boolean;
  };
}

/**
 * Schema 渲染器
 */
export class SchemaRenderer {
  
  /**
   * 获取表单 schema
   * 将 OpenAPI schema 转换为 react-jsonschema-form 可用的格式
   */
  getFormSchema(
    openApiSchema: OpenAPIV3.SchemaObject,
    options: FormSchemaOptions = {}
  ): FormSchema {
    const {
      readonly = false,
      includeFields,
      excludeFields = [],
      fieldOrder,
      fieldConfig = {},
      schemaResolver
    } = options;

    // 转换 OpenAPI schema 为 JSON Schema
    const jsonSchema = this.convertToJSONSchema(openApiSchema, {
      includeFields,
      excludeFields,
      fieldOrder,
      schemaResolver
    });

    // 生成 UI Schema
    const uiSchema = this.generateUISchema(jsonSchema, {
      readonly,
      fieldConfig,
      fieldOrder
    });

    // 生成表单数据模板
    const formData = this.generateFormDataTemplate(jsonSchema);

    return {
      schema: jsonSchema,
      uiSchema,
      formData
    };
  }

  /**
   * 获取创建表单 schema
   */
  getCreateFormSchema(
    openApiSchema: OpenAPIV3.SchemaObject,
    options: FormSchemaOptions = {}
  ): FormSchema {
    // 创建表单通常排除 ID 和时间戳字段
    const defaultExcludeFields = ['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'];
    
    return this.getFormSchema(openApiSchema, {
      ...options,
      excludeFields: [...defaultExcludeFields, ...(options.excludeFields || [])]
    });
  }

  /**
   * 获取编辑表单 schema
   */
  getEditFormSchema(
    openApiSchema: OpenAPIV3.SchemaObject,
    options: FormSchemaOptions = {}
  ): FormSchema {
    // 编辑表单通常排除创建时间字段，ID 字段设为只读
    const defaultExcludeFields = ['created_at', 'createdAt'];
    const defaultFieldConfig = {
      id: { 'ui:readonly': true },
      ...options.fieldConfig
    };

    return this.getFormSchema(openApiSchema, {
      ...options,
      excludeFields: [...defaultExcludeFields, ...(options.excludeFields || [])],
      fieldConfig: defaultFieldConfig
    });
  }

  /**
   * 获取表格 schema
   * 基于 OpenAPI schema 生成表格列定义
   */
  getTableSchema(
    openApiSchema: OpenAPIV3.SchemaObject,
    options: TableSchemaOptions = {}
  ): TableSchema {
    const {
      columns,
      columnOrder,
      sortableColumns,
      filterableColumns,
      columnWidths = {},
      customRenderers = {}
    } = options;

    // 提取字段定义
    const fields = this.extractFields(openApiSchema);
    
    // 生成列定义
    let tableColumns = this.generateTableColumns(fields, {
      sortableColumns,
      filterableColumns,
      columnWidths,
      customRenderers
    });

    // 过滤指定的列
    if (columns && columns.length > 0) {
      tableColumns = tableColumns.filter(col => columns.includes(col.key));
    }

    // 应用列顺序
    if (columnOrder && columnOrder.length > 0) {
      tableColumns.sort((a, b) => {
        const aIndex = columnOrder.indexOf(a.key);
        const bIndex = columnOrder.indexOf(b.key);
        
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      });
    }

    return {
      columns: tableColumns,
      defaultSort: this.getDefaultSort(tableColumns),
      pagination: {
        pageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true
      }
    };
  }

  /**
   * 私有方法：转换为 JSON Schema
   */
  private convertToJSONSchema(
    openApiSchema: OpenAPIV3.SchemaObject,
    options: {
      includeFields?: string[];
      excludeFields?: string[];
      fieldOrder?: string[];
      schemaResolver?: (ref: string) => any;
    }
  ): RJSFSchema {
    const { includeFields, excludeFields = [], fieldOrder, schemaResolver } = options;

    // 深拷贝 schema 以避免修改原始数据
    let schema = JSON.parse(JSON.stringify(openApiSchema)) as RJSFSchema;

    // 递归解析所有引用
    if (schemaResolver) {
      schema = this.resolveAllReferences(schema, schemaResolver) as RJSFSchema;
    }

    // 处理字段过滤
    if (schema.type === 'object' && schema.properties) {
      const properties = schema.properties as Record<string, any>;
      
      // 应用字段包含过滤
      if (includeFields && includeFields.length > 0) {
        Object.keys(properties).forEach(key => {
          if (!includeFields.includes(key)) {
            delete properties[key];
          }
        });
      }

      // 应用字段排除过滤
      excludeFields.forEach(field => {
        delete properties[field];
      });

      // 更新 required 字段
      if (schema.required) {
        schema.required = schema.required.filter(field => 
          !excludeFields.includes(field) && 
          (!includeFields || includeFields.includes(field))
        );
      }

      // 应用字段顺序
      if (fieldOrder && fieldOrder.length > 0) {
        const orderedProperties: Record<string, any> = {};
        
        // 按指定顺序添加字段
        fieldOrder.forEach(field => {
          if (properties[field]) {
            orderedProperties[field] = properties[field];
          }
        });

        // 添加未在顺序中指定的字段
        Object.keys(properties).forEach(field => {
          if (!fieldOrder.includes(field)) {
            orderedProperties[field] = properties[field];
          }
        });

        schema.properties = orderedProperties;
      }
    }

    // 确保基本结构
    if (!schema.type) {
      schema.type = 'object';
    }

    return schema;
  }

  /**
   * 私有方法：生成 UI Schema
   */
  private generateUISchema(
    jsonSchema: RJSFSchema,
    options: {
      readonly?: boolean;
      fieldConfig?: Record<string, any>;
      fieldOrder?: string[];
    }
  ): UiSchema {
    const { readonly = false, fieldConfig = {}, fieldOrder } = options;
    const uiSchema: UiSchema = {};

    if (jsonSchema.type === 'object' && jsonSchema.properties) {
      const properties = jsonSchema.properties as Record<string, any>;

      Object.keys(properties).forEach(fieldName => {
        const fieldSchema = properties[fieldName];
        const fieldUI = this.generateFieldUISchema(fieldSchema, readonly);
        
        // 应用自定义字段配置
        if (fieldConfig[fieldName]) {
          Object.assign(fieldUI, fieldConfig[fieldName]);
        }

        uiSchema[fieldName] = fieldUI;
      });
    }

    // 应用字段顺序
    if (fieldOrder && fieldOrder.length > 0) {
      uiSchema['ui:order'] = fieldOrder;
    }

    return uiSchema;
  }

  /**
   * 私有方法：生成字段 UI Schema
   */
  private generateFieldUISchema(fieldSchema: any, readonly: boolean): any {
    const uiSchema: any = {};

    if (readonly) {
      uiSchema['ui:readonly'] = true;
    }

    // 根据字段类型设置特定的 UI 配置
    switch (fieldSchema.type) {
      case 'string':
        if (fieldSchema.format === 'date') {
          uiSchema['ui:widget'] = 'date';
        } else if (fieldSchema.format === 'date-time') {
          uiSchema['ui:widget'] = 'datetime';
        } else if (fieldSchema.format === 'email') {
          uiSchema['ui:widget'] = 'email';
        } else if (fieldSchema.format === 'uri') {
          uiSchema['ui:widget'] = 'uri';
        } else if (fieldSchema.enum) {
          uiSchema['ui:widget'] = 'select';
        } else if (fieldSchema.maxLength && fieldSchema.maxLength > 100) {
          uiSchema['ui:widget'] = 'textarea';
        }
        break;

      case 'number':
      case 'integer':
        uiSchema['ui:widget'] = 'updown';
        break;

      case 'boolean':
        uiSchema['ui:widget'] = 'checkbox';
        break;

      case 'array':
        if (fieldSchema.items && fieldSchema.items.enum) {
          uiSchema['ui:widget'] = 'checkboxes';
        }
        break;
    }

    // 设置字段描述
    if (fieldSchema.description) {
      uiSchema['ui:description'] = fieldSchema.description;
    }

    // 设置占位符
    if (fieldSchema.example) {
      uiSchema['ui:placeholder'] = String(fieldSchema.example);
    }

    return uiSchema;
  }

  /**
   * 私有方法：生成表单数据模板
   */
  private generateFormDataTemplate(jsonSchema: RJSFSchema): any {
    if (jsonSchema.type !== 'object' || !jsonSchema.properties) {
      return {};
    }

    const formData: any = {};
    const properties = jsonSchema.properties as Record<string, any>;

    Object.keys(properties).forEach(fieldName => {
      const fieldSchema = properties[fieldName];
      
      if (fieldSchema.default !== undefined) {
        formData[fieldName] = fieldSchema.default;
      } else if (fieldSchema.example !== undefined) {
        formData[fieldName] = fieldSchema.example;
      }
    });

    return formData;
  }

  /**
   * 私有方法：提取字段定义
   */
  private extractFields(schema: OpenAPIV3.SchemaObject): Array<{
    name: string;
    type: string;
    title: string;
    description?: string;
    required: boolean;
    format?: string;
    enum?: any[];
  }> {
    const fields: any[] = [];

    if (schema.type === 'object' && schema.properties) {
      const required = schema.required || [];
      
      Object.entries(schema.properties).forEach(([name, fieldSchema]) => {
        if (typeof fieldSchema === 'object' && !('$ref' in fieldSchema)) {
          fields.push({
            name,
            type: fieldSchema.type || 'string',
            title: fieldSchema.title || this.humanizeFieldName(name),
            description: fieldSchema.description,
            required: required.includes(name),
            format: fieldSchema.format,
            enum: fieldSchema.enum
          });
        }
      });
    }

    return fields;
  }

  /**
   * 私有方法：生成表格列
   */
  private generateTableColumns(
    fields: any[],
    options: {
      sortableColumns?: string[];
      filterableColumns?: string[];
      columnWidths?: Record<string, number>;
      customRenderers?: Record<string, string>;
    }
  ): TableColumn[] {
    const {
      sortableColumns = [],
      filterableColumns = [],
      columnWidths = {},
      customRenderers = {}
    } = options;

    return fields.map(field => ({
      key: field.name,
      title: field.title,
      dataType: field.type,
      sortable: sortableColumns.includes(field.name) || this.isDefaultSortable(field.type),
      filterable: filterableColumns.includes(field.name) || this.isDefaultFilterable(field.type),
      width: columnWidths[field.name],
      render: customRenderers[field.name],
      format: this.getDefaultFormat(field.type, field.format)
    }));
  }

  /**
   * 私有方法：获取默认排序
   */
  private getDefaultSort(columns: TableColumn[]): { field: string; order: 'asc' | 'desc' } | undefined {
    // 优先选择 ID 字段
    const idColumn = columns.find(col => col.key === 'id');
    if (idColumn) {
      return { field: 'id', order: 'asc' };
    }

    // 选择第一个可排序的字段
    const sortableColumn = columns.find(col => col.sortable);
    if (sortableColumn) {
      return { field: sortableColumn.key, order: 'asc' };
    }

    return undefined;
  }

  /**
   * 私有方法：是否默认可排序
   */
  private isDefaultSortable(type: string): boolean {
    return ['string', 'number', 'integer', 'boolean'].includes(type);
  }

  /**
   * 私有方法：是否默认可筛选
   */
  private isDefaultFilterable(type: string): boolean {
    return ['string', 'boolean'].includes(type);
  }

  /**
   * 私有方法：获取默认格式
   */
  private getDefaultFormat(type: string, format?: string): string | undefined {
    if (format === 'date') return 'date';
    if (format === 'date-time') return 'datetime';
    if (format === 'email') return 'email';
    if (format === 'uri') return 'url';
    
    if (type === 'number' || type === 'integer') return 'number';
    if (type === 'boolean') return 'boolean';
    
    return undefined;
  }

  /**
   * 私有方法：人性化字段名
   */
  private humanizeFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1') // 在大写字母前添加空格
      .replace(/[_-]/g, ' ') // 将下划线和连字符替换为空格
      .replace(/\b\w/g, l => l.toUpperCase()) // 首字母大写
      .trim();
  }

  /**
   * 私有方法：递归解析所有引用
   */
  private resolveAllReferences(schema: any, resolver: (ref: string) => any): any {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }

    // 如果是数组，递归处理每个元素
    if (Array.isArray(schema)) {
      return schema.map(item => this.resolveAllReferences(item, resolver));
    }

    // 如果包含 $ref，解析引用
    if (schema.$ref && typeof schema.$ref === 'string') {
      const resolved = resolver(schema.$ref);
      if (resolved) {
        // 递归解析解析出来的 schema
        return this.resolveAllReferences(resolved, resolver);
      }
      // 如果无法解析，保持原样
      return schema;
    }

    // 递归处理对象的所有属性
    const result: any = {};
    for (const [key, value] of Object.entries(schema)) {
      result[key] = this.resolveAllReferences(value, resolver);
    }

    return result;
  }
}
