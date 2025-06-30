import { Button, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import type { ColumnsType } from 'antd/es/table';
import type { TableColumn, TableSchema } from '~/lib/api';

/**
 * 将 OpenAPI 表格 schema 转换为 Antd Table 列配置
 */
export function convertTableSchemaToAntdColumns(
  tableSchema: TableSchema | null,
  actionHandlers?: {
    onDetail?: (record: any) => string;
    onEdit?: (record: any) => void;
    onDelete?: (record: any) => void;
  }
): ColumnsType<any> {
  if (!tableSchema) {
    return [];
  }

  const columns: ColumnsType<any> = tableSchema.columns.map((column: TableColumn) => {
    const antdColumn: any = {
      title: column.title,
      dataIndex: column.key,
      key: column.key,
      width: column.width,
      sorter: column.sortable,
      filterDropdown: column.filterable ? {} : undefined,
    };

    // 根据数据类型设置渲染器
    switch (column.dataType) {
      case 'boolean':
        antdColumn.render = (value: boolean) => (
          <Tag color={value ? 'green' : 'red'}>
            {value ? '是' : '否'}
          </Tag>
        );
        break;
      case 'number':
        antdColumn.align = 'right';
        break;
      case 'array':
        antdColumn.render = (value: any[]) => (
          <Tag>{Array.isArray(value) ? `${value.length} 项` : '0 项'}</Tag>
        );
        break;
      case 'object':
        antdColumn.render = (value: any) => (
          <Tag color="blue">对象</Tag>
        );
        break;
      default:
        // 字符串类型，处理长文本
        antdColumn.render = (text: string) => {
          if (typeof text === 'string' && text.length > 50) {
            return (
              <span title={text}>
                {text.substring(0, 50)}...
              </span>
            );
          }
          return text;
        };
    }

    return antdColumn;
  });

  // 添加操作列
  if (actionHandlers) {
    columns.push({
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {actionHandlers.onDetail && (
            <Link to={actionHandlers.onDetail(record)}>
              <Button type="link" size="small" icon={<EyeOutlined />}>
                详情
              </Button>
            </Link>
          )}
          {actionHandlers.onEdit && (
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => actionHandlers.onEdit!(record)}
            >
              编辑
            </Button>
          )}
          {actionHandlers.onDelete && (
            <Button 
              type="link" 
              size="small" 
              danger 
              icon={<DeleteOutlined />}
              onClick={() => actionHandlers.onDelete!(record)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    });
  }

  return columns;
}

