/**
 * Schema Renderer
 * 
 * 负责为页面渲染提供 schema，基于 OpenAPI schema 生成组件渲染所需的 schema
 * 使用 react-jsonschema-form 的标准格式
 */

import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import type { OpenAPIV3 } from 'openapi-types';
import type { 
  TableSchema as JsonSchemaTableSchema, 
  TableColumn as JsonSchemaTableColumn, 
  CellRenderer 
} from '~/components/json-schema-ui/core/types';
import { SchemaToTableConverter } from '~/components/json-schema-ui/core/SchemaToTableConverter';
import type { JSONSchema7 } from 'json-schema';

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
  includeFields?: string[];
  /** 要排除的列 */
  excludeFields?: string[];
  /** 列配置覆盖 */
  columnOverrides?: Record<string, Partial<JsonSchemaTableColumn>>;
  /** 是否显示操作列 */
  showActions?: boolean;
  /** 操作列配置 */
  actionsConfig?: {
    detail?: boolean;
    edit?: boolean;
    delete?: boolean;
    custom?: Array<{
      key: string;
      title: string;
      icon?: string;
      type?: 'primary' | 'default' | 'danger';
    }>;
  };
  /** 主键字段 */
  primaryKey?: string;
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
 * 表格 Schema 结果（使用 json-schema-table 的类型）
 */
export type TableSchema = JsonSchemaTableSchema;

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
   * 基于 OpenAPI schema 生成表格列定义，使用 json-schema-table 组件
   */
  getTableSchema(
    openApiSchema: OpenAPIV3.SchemaObject,
    options: TableSchemaOptions = {}
  ): TableSchema {
    const {
      includeFields,
      excludeFields,
      columnOverrides,
      showActions = false,
      actionsConfig,
      primaryKey
    } = options;

    // 将 OpenAPI schema 转换为 JSON Schema
    const jsonSchema = this.convertOpenAPISchemaToJSONSchema(openApiSchema);

    // 使用 SchemaToTableConverter 生成表格 schema
    const tableSchema = SchemaToTableConverter.convertJsonSchemaToTableSchema(jsonSchema, {
      includeFields,
      excludeFields,
      columnOverrides,
      showActions
    });

    // 应用自定义配置
    if (actionsConfig) {
      tableSchema.actions = actionsConfig;
    }

    if (primaryKey) {
      tableSchema.primaryKey = primaryKey;
    }

    return tableSchema;
  }

  /**
   * 私有方法：将 OpenAPI Schema 转换为 JSON Schema
   */
  private convertOpenAPISchemaToJSONSchema(openApiSchema: OpenAPIV3.SchemaObject): JSONSchema7 {
    // 深拷贝避免修改原始数据
    const jsonSchema = JSON.parse(JSON.stringify(openApiSchema)) as JSONSchema7;
    
    // OpenAPI schema 与 JSON Schema 基本兼容，只需要做少量转换
    // 移除 OpenAPI 特有的属性
    const openApiOnlyFields = ['discriminator', 'xml', 'externalDocs', 'example'];
    openApiOnlyFields.forEach(field => {
      delete (jsonSchema as any)[field];
    });

    return jsonSchema;
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
