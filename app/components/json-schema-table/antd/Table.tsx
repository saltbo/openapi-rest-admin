import React from 'react';
import type { JSONSchema7 } from 'json-schema';
import type { JsonSchemaTableProps, TableSchema } from '../core/types';
import { SchemaToTableConverter } from '../core/SchemaToTableConverter';
import { AntdTableRenderer } from './AntdTableRenderer';

/**
 * Ant Design 主题的 JSON Schema 表格组件
 * 
 * 类似于 @rjsf/antd 的 Form 组件
 * 
 * @example
 * ```tsx
 * import { Table } from '~/components/json-schema-table/antd';
 * 
 * <Table
 *   schema={schema}
 *   data={data}
 *   actionHandlers={{
 *     onEdit: (record) => console.log('Edit', record),
 *     onDelete: (record) => console.log('Delete', record)
 *   }}
 * />
 * ```
 */
export function Table(props: JsonSchemaTableProps) {
  const {
    schema,
    data,
    renderer,
    autoGenerateColumns = true,
    columnOverrides = {},
    ...restProps
  } = props;

  // 使用 Antd 渲染器作为默认渲染器
  const tableRenderer = renderer || new AntdTableRenderer();

  // 转换 schema
  const tableSchema = React.useMemo((): TableSchema => {
    // 如果已经是 TableSchema，直接使用
    if ('columns' in schema) {
      return schema as TableSchema;
    }

    // 从 JSON Schema 转换
    if (autoGenerateColumns) {
      return SchemaToTableConverter.convertJsonSchemaToTableSchema(
        schema as JSONSchema7,
        {
          columnOverrides: columnOverrides as Record<string, Partial<any>>,
          showActions: Boolean(restProps.actionHandlers)
        }
      );
    }

    // 如果不自动生成列，返回空的表格配置
    return {
      columns: [],
      title: (schema as JSONSchema7).title,
      description: (schema as JSONSchema7).description
    };
  }, [schema, autoGenerateColumns, columnOverrides, restProps.actionHandlers]);

  return tableRenderer.render({
    schema: tableSchema,
    data,
    ...restProps
  });
}

