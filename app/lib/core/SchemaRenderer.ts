/**
 * Schema Renderer
 *
 * 负责为页面渲染提供 schema，基于 OpenAPI schema 生成组件渲染所需的 schema
 * 使用 react-jsonschema-form 的标准格式
 */

import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { OpenAPIV3 } from "openapi-types";
import type {
  TableSchema as JsonSchemaTableSchema,
  TableColumn as JsonSchemaTableColumn,
} from "~/components/json-schema-ui/core/types";
import { SchemaToTableConverter } from "~/components/json-schema-ui/core/SchemaToTableConverter";

// 常量定义
const DEFAULT_CREATE_EXCLUDE_FIELDS = [
  "id",
  "uid",
  "created_at",
  "createdAt",
  "updatedAt",
  "updated_at",
] as const;
const DEFAULT_EDIT_EXCLUDE_FIELDS = [
  "created_at",
  "createdAt",
  "updatedAt",
  "updated_at",
] as const;
const OPENAPI_ONLY_FIELDS = [
  "discriminator",
  "xml",
  "externalDocs",
  "example",
] as const;

// 字段 UI 组件映射
const FIELD_TYPE_WIDGET_MAP = {
  string: {
    date: "date",
    "date-time": "datetime",
    email: "email",
    uri: "uri",
  },
  number: "updown",
  integer: "updown",
  boolean: "checkbox",
} as const;

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
  fieldConfig?: Record<string, UiSchema>;
  /** Schema 引用解析器 */
  schemaResolver?: (ref: string) => OpenAPIV3.SchemaObject | null;
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
      type?: "primary" | "default" | "danger";
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
  formData: Record<string, unknown>;
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
   * 深拷贝对象的工具方法
   */
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepClone(item)) as unknown as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }

    return cloned;
  }

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
      schemaResolver,
    } = options;

    // 转换 OpenAPI schema 为 JSON Schema
    const jsonSchema = this.convertToJSONSchema(openApiSchema, {
      includeFields,
      excludeFields,
      fieldOrder,
      schemaResolver,
    });

    // 生成 UI Schema
    const uiSchema = this.generateUISchema(jsonSchema, {
      readonly,
      fieldConfig,
      fieldOrder,
    });

    // 生成表单数据模板
    const formData = this.generateFormDataTemplate(jsonSchema);

    return {
      schema: jsonSchema,
      uiSchema,
      formData,
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
    return this.getFormSchema(openApiSchema, {
      ...options,
      excludeFields: [
        ...DEFAULT_CREATE_EXCLUDE_FIELDS,
        ...(options.excludeFields || []),
      ],
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
    const defaultFieldConfig: Record<string, UiSchema> = {
      id: { "ui:readonly": true },
      ...options.fieldConfig,
    };

    return this.getFormSchema(openApiSchema, {
      ...options,
      excludeFields: [
        ...DEFAULT_EDIT_EXCLUDE_FIELDS,
        ...(options.excludeFields || []),
      ],
      fieldConfig: defaultFieldConfig,
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
      primaryKey,
    } = options;

    // 将 OpenAPI schema 转换为 JSON Schema
    const jsonSchema = this.convertToJSONSchema(openApiSchema, {
      includeFields,
      excludeFields,
    });

    // 使用 SchemaToTableConverter 生成表格 schema
    const tableSchema = SchemaToTableConverter.convertJsonSchemaToTableSchema(
      jsonSchema,
      {
        includeFields,
        excludeFields,
        columnOverrides,
        showActions,
      }
    );

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
   * 将 OpenAPI Schema 转换为 JSON Schema（统一方法）
   */
  private convertToJSONSchema(
    openApiSchema: OpenAPIV3.SchemaObject,
    options: {
      includeFields?: string[];
      excludeFields?: string[];
      fieldOrder?: string[];
      schemaResolver?: (ref: string) => OpenAPIV3.SchemaObject | null;
    } = {}
  ): RJSFSchema {
    const {
      includeFields,
      excludeFields = [],
      fieldOrder,
      schemaResolver,
    } = options;

    // 深拷贝 schema 以避免修改原始数据
    let schema = this.deepClone(openApiSchema) as RJSFSchema;

    // 移除 OpenAPI 特有的属性
    OPENAPI_ONLY_FIELDS.forEach((field) => {
      delete (schema as any)[field];
    });

    // 递归解析所有引用
    if (schemaResolver) {
      schema = this.resolveAllReferences(schema, schemaResolver) as RJSFSchema;
    }

    // 处理字段过滤
    if (schema.type === "object" && schema.properties) {
      schema = this.processObjectFields(schema, {
        includeFields,
        excludeFields,
        fieldOrder,
      });
    }

    // 确保基本结构
    if (!schema.type) {
      schema.type = "object";
    }

    return schema;
  }

  /**
   * 处理对象字段的过滤和排序
   */
  private processObjectFields(
    schema: RJSFSchema,
    options: {
      includeFields?: string[];
      excludeFields?: string[];
      fieldOrder?: string[];
    }
  ): RJSFSchema {
    const { includeFields, excludeFields = [], fieldOrder } = options;
    const properties = schema.properties as Record<string, any>;

    // 应用字段包含过滤
    if (includeFields && includeFields.length > 0) {
      Object.keys(properties).forEach((key) => {
        if (!includeFields.includes(key)) {
          delete properties[key];
        }
      });
    }

    // 应用字段排除过滤
    excludeFields.forEach((field) => {
      delete properties[field];
    });

    // 更新 required 字段
    if (schema.required) {
      schema.required = schema.required.filter(
        (field) =>
          !excludeFields.includes(field) &&
          (!includeFields || includeFields.includes(field))
      );
    }

    // 应用字段顺序
    if (fieldOrder && fieldOrder.length > 0) {
      const orderedProperties: Record<string, any> = {};

      // 按指定顺序添加字段
      fieldOrder.forEach((field) => {
        if (properties[field]) {
          orderedProperties[field] = properties[field];
        }
      });

      // 添加未在顺序中指定的字段
      Object.keys(properties).forEach((field) => {
        if (!fieldOrder.includes(field)) {
          orderedProperties[field] = properties[field];
        }
      });

      schema.properties = orderedProperties;
    }

    return schema;
  }

  /**
   * 生成 UI Schema
   */
  private generateUISchema(
    jsonSchema: RJSFSchema,
    options: {
      readonly?: boolean;
      fieldConfig?: Record<string, UiSchema>;
      fieldOrder?: string[];
    }
  ): UiSchema {
    const { readonly = false, fieldConfig = {}, fieldOrder } = options;
    const uiSchema: UiSchema = {};

    if (jsonSchema.type === "object" && jsonSchema.properties) {
      const properties = jsonSchema.properties as Record<string, any>;

      Object.keys(properties).forEach((fieldName) => {
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
      uiSchema["ui:order"] = fieldOrder;
    }

    return uiSchema;
  }

  /**
   * 生成字段 UI Schema
   */
  private generateFieldUISchema(fieldSchema: any, readonly: boolean): UiSchema {
    const uiSchema: UiSchema = {};

    if (readonly) {
      uiSchema["ui:readonly"] = true;
    }

    // 设置基础 widget
    this.setFieldWidget(uiSchema, fieldSchema);

    // 设置字段描述
    if (fieldSchema.description) {
      uiSchema["ui:description"] = fieldSchema.description;
    }

    // 设置占位符
    if (fieldSchema.example) {
      uiSchema["ui:placeholder"] = String(fieldSchema.example);
    }

    return uiSchema;
  }

  /**
   * 设置字段组件类型
   */
  private setFieldWidget(uiSchema: UiSchema, fieldSchema: any): void {
    const fieldType = fieldSchema.type;

    if (fieldType === "string") {
      this.setStringFieldWidget(uiSchema, fieldSchema);
    } else if (fieldType === "number" || fieldType === "integer") {
      uiSchema["ui:widget"] = FIELD_TYPE_WIDGET_MAP.number;
    } else if (fieldType === "boolean") {
      uiSchema["ui:widget"] = FIELD_TYPE_WIDGET_MAP.boolean;
    } else if (fieldType === "array") {
      this.setArrayFieldWidget(uiSchema, fieldSchema);
    }
  }

  /**
   * 设置字符串字段的组件类型
   */
  private setStringFieldWidget(uiSchema: UiSchema, fieldSchema: any): void {
    const format = fieldSchema.format;
    const stringWidgets = FIELD_TYPE_WIDGET_MAP.string;

    if (format && format in stringWidgets) {
      uiSchema["ui:widget"] =
        stringWidgets[format as keyof typeof stringWidgets];
    } else if (fieldSchema.enum) {
      uiSchema["ui:widget"] = "select";
    } else if (fieldSchema.maxLength && fieldSchema.maxLength > 100) {
      uiSchema["ui:widget"] = "textarea";
    }
  }

  /**
   * 设置数组字段的组件类型
   */
  private setArrayFieldWidget(uiSchema: UiSchema, fieldSchema: any): void {
    if (fieldSchema.items && fieldSchema.items.enum) {
      uiSchema["ui:widget"] = "checkboxes";
    }
  }

  /**
   * 生成表单数据模板
   */
  private generateFormDataTemplate(
    jsonSchema: RJSFSchema
  ): Record<string, unknown> {
    if (jsonSchema.type !== "object" || !jsonSchema.properties) {
      return {};
    }

    const formData: Record<string, unknown> = {};
    const properties = jsonSchema.properties as Record<string, any>;

    Object.keys(properties).forEach((fieldName) => {
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
   * 递归解析所有引用
   */
  private resolveAllReferences(
    schema: any,
    resolver: (ref: string) => OpenAPIV3.SchemaObject | null
  ): any {
    if (!schema || typeof schema !== "object") {
      return schema;
    }

    // 如果是数组，递归处理每个元素
    if (Array.isArray(schema)) {
      return schema.map((item) => this.resolveAllReferences(item, resolver));
    }

    // 如果包含 $ref，解析引用
    if (schema.$ref && typeof schema.$ref === "string") {
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
