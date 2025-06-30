import type { JSONSchema7 } from 'json-schema';
import type { TableColumn, TableSchema } from './types';

/**
 * JSON Schema 到表格 Schema 的转换器
 */
export class SchemaToTableConverter {
  /**
   * 将 JSON Schema 转换为表格 Schema
   */
  static convertJsonSchemaToTableSchema(
    jsonSchema: JSONSchema7,
    options?: {
      /** 要包含的字段列表，如果不指定则包含所有字段 */
      includeFields?: string[];
      /** 要排除的字段列表 */
      excludeFields?: string[];
      /** 列配置覆盖 */
      columnOverrides?: Record<string, Partial<TableColumn>>;
      /** 是否显示操作列 */
      showActions?: boolean;
    }
  ): TableSchema {
    const { includeFields, excludeFields = [], columnOverrides = {}, showActions = false } = options || {};

    // 处理数组类型的 schema
    let itemSchema: JSONSchema7;
    if (jsonSchema.type === 'array' && jsonSchema.items && typeof jsonSchema.items === 'object') {
      itemSchema = jsonSchema.items as JSONSchema7;
    } else if (jsonSchema.properties) {
      itemSchema = jsonSchema;
    } else {
      throw new Error('Schema must be an object with properties or an array of objects');
    }

    const properties = itemSchema.properties || {};
    const required = itemSchema.required || [];

    // 生成列配置
    const columns: TableColumn[] = Object.entries(properties)
      .filter(([key]) => {
        if (includeFields && !includeFields.includes(key)) return false;
        if (excludeFields.includes(key)) return false;
        return true;
      })
      .map(([key, propSchema]) => this.convertPropertyToColumn(key, propSchema as JSONSchema7, {
        required: required.includes(key),
        overrides: columnOverrides[key]
      }));

    return {
      title: jsonSchema.title,
      description: jsonSchema.description,
      columns,
      actions: showActions ? {
        detail: true,
        edit: true,
        delete: true
      } : undefined
    };
  }

  /**
   * 将单个属性 schema 转换为表格列
   */
  private static convertPropertyToColumn(
    key: string,
    propSchema: JSONSchema7,
    options: {
      required?: boolean;
      overrides?: Partial<TableColumn>;
    } = {}
  ): TableColumn {
    const { required = false, overrides = {} } = options;

    // 基础列配置
    const column: TableColumn = {
      key,
      title: propSchema.title || this.formatFieldName(key),
      dataIndex: key,
      dataType: this.getDataType(propSchema),
      sortable: this.isSortable(propSchema),
      filterable: this.isFilterable(propSchema),
      schema: propSchema,
      ...overrides
    };

    // 根据数据类型设置默认配置
    switch (column.dataType) {
      case 'number':
        column.align = 'right';
        break;
      case 'boolean':
        column.width = 100;
        column.align = 'center';
        break;
      case 'date':
        column.width = 180;
        break;
      case 'array':
      case 'object':
        column.width = 120;
        column.align = 'center';
        break;
    }

    // 设置单元格渲染器
    column.cellRenderer = this.getCellRenderer(propSchema, column.dataType);

    return column;
  }

  /**
   * 获取数据类型
   */
  private static getDataType(schema: JSONSchema7): TableColumn['dataType'] {
    if (schema.type) {
      switch (schema.type) {
        case 'string':
          // 检查是否是日期格式
          if (schema.format === 'date' || schema.format === 'date-time') {
            return 'date';
          }
          return 'string';
        case 'number':
        case 'integer':
          return 'number';
        case 'boolean':
          return 'boolean';
        case 'array':
          return 'array';
        case 'object':
          return 'object';
        default:
          return 'string';
      }
    }

    // 通过其他属性推断类型
    if (schema.enum) return 'string';
    if (schema.properties) return 'object';
    if (schema.items) return 'array';

    return 'string';
  }

  /**
   * 判断字段是否可排序
   */
  private static isSortable(schema: JSONSchema7): boolean {
    const sortableTypes = ['string', 'number', 'integer', 'boolean'];
    return schema.type ? sortableTypes.includes(schema.type as string) : false;
  }

  /**
   * 判断字段是否可筛选
   */
  private static isFilterable(schema: JSONSchema7): boolean {
    // 枚举类型、布尔类型通常可以筛选
    if (schema.enum || schema.type === 'boolean') return true;
    
    // 字符串和数字类型也可以筛选
    if (schema.type === 'string' || schema.type === 'number' || schema.type === 'integer') {
      return true;
    }

    return false;
  }

  /**
   * 获取单元格渲染器
   */
  private static getCellRenderer(schema: JSONSchema7, dataType: TableColumn['dataType']) {
    // 处理枚举类型
    if (schema.enum) {
      return {
        type: 'tag' as const,
        config: {
          colorMap: this.generateColorMap(schema.enum)
        }
      };
    }

    // 根据 format 和 dataType 选择渲染器
    if (schema.format) {
      switch (schema.format) {
        case 'email':
          return {
            type: 'email' as const,
            config: {
              copyable: true
            }
          };
        case 'uri':
        case 'url':
          return {
            type: 'url' as const,
            config: {
              target: '_blank' as '_blank'
            }
          };
        case 'date':
          return {
            type: 'date' as const,
            config: {
              format: 'YYYY-MM-DD'
            }
          };
        case 'date-time':
          return {
            type: 'date' as const,
            config: {
              format: 'YYYY-MM-DD HH:mm:ss'
            }
          };
      }
    }

    // 根据数据类型选择渲染器
    switch (dataType) {
      case 'boolean':
        return {
          type: 'boolean' as const,
          config: {
            trueText: '是',
            falseText: '否',
            trueColor: 'green',
            falseColor: 'red'
          }
        };
      case 'number':
        return {
          type: 'number' as const,
          config: {
            precision: schema.multipleOf ? this.getPrecisionFromMultiple(schema.multipleOf) : 2,
            separator: ',',
            ...(schema.minimum !== undefined && { min: schema.minimum }),
            ...(schema.maximum !== undefined && { max: schema.maximum })
          }
        };
      case 'date':
        return {
          type: 'date' as const,
          config: {
            format: 'YYYY-MM-DD HH:mm:ss'
          }
        };
      case 'array':
        return {
          type: 'tag' as const,
          config: {
            showCount: true,
            maxLength: 3
          }
        };
      case 'object':
        return {
          type: 'json' as const,
          config: {
            maxLength: 50,
            ellipsis: true
          }
        };
      case 'string':
      default:
        return {
          type: 'text' as const,
          config: {
            maxLength: schema.maxLength || 100,
            ellipsis: true,
            copyable: !!(schema.maxLength && schema.maxLength > 50)
          }
        };
    }
  }

  /**
   * 根据 multipleOf 推断小数精度
   */
  private static getPrecisionFromMultiple(multipleOf: number): number {
    if (!multipleOf || multipleOf >= 1) return 0;
    const str = multipleOf.toString();
    if (str.indexOf('.') === -1) return 0;
    return str.split('.')[1].length;
  }

  /**
   * 为枚举值生成颜色映射
   */
  private static generateColorMap(enumValues: readonly unknown[]): Record<string, string> {
    const colors = ['blue', 'green', 'orange', 'red', 'purple', 'cyan', 'magenta', 'lime'];
    const colorMap: Record<string, string> = {};
    
    enumValues.forEach((value, index) => {
      colorMap[String(value)] = colors[index % colors.length];
    });

    return colorMap;
  }

  /**
   * 格式化字段名为显示标题
   */
  private static formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1') // 驼峰转空格
      .replace(/[_-]/g, ' ') // 下划线和连字符转空格
      .replace(/\b\w/g, char => char.toUpperCase()) // 首字母大写
      .trim();
  }
}
