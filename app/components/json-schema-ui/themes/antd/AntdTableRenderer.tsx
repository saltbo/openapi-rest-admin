import React from 'react';
import { Table, Button, Space, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import type { Key } from 'react';
import type { TableRenderer, TableRendererProps, TableColumn, CellRenderer } from '../../core/types';

/**
 * Antd Table 渲染器
 */
export class AntdTableRenderer implements TableRenderer {
  render(props: TableRendererProps): React.ReactElement {
    const {
      schema,
      data,
      loading = false,
      pagination,
      actionHandlers,
      rowSelection,
      className,
      style,
      size = 'middle',
      bordered = false
    } = props;

    // 转换列配置
    const columns = this.convertToAntdColumns(schema.columns, actionHandlers);

    // 处理分页
    const paginationConfig = pagination ? {
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
      showSizeChanger: pagination.showSizeChanger,
      showQuickJumper: pagination.showQuickJumper,
      showTotal: (total: number, range: [number, number]) => 
        `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
      onChange: pagination.onChange,
    } : false;

    // 处理行选择
    const rowSelectionConfig = rowSelection ? {
      type: rowSelection.type || 'checkbox' as const,
      selectedRowKeys: rowSelection.selectedRowKeys as Key[],
      onChange: (selectedRowKeys: Key[], selectedRows: any[]) => {
        rowSelection.onChange?.(selectedRowKeys as any, selectedRows);
      },
    } : undefined;

    return (
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={paginationConfig}
        rowSelection={rowSelectionConfig}
        className={className}
        style={style}
        size={size}
        bordered={bordered}
        scroll={{ x: 'max-content' }}
        rowKey={(record) => record.id || record.key || Math.random().toString(36)}
      />
    );
  }

  /**
   * 将表格列配置转换为 Antd 列配置
   */
  private convertToAntdColumns(
    columns: TableColumn[],
    actionHandlers?: TableRendererProps['actionHandlers']
  ): ColumnsType<any> {
    const antdColumns: ColumnsType<any> = columns.map(column => {
      const col: ColumnType<any> = {
        title: column.title,
        dataIndex: column.dataIndex,
        key: column.key,
        width: column.width,
        align: column.align,
        fixed: column.fixed,
        sorter: column.sortable,
        render: (value: any, record: any, index: number) => 
          this.renderCell(value, record, index, column.cellRenderer)
      };

      // 只有在可筛选时才添加 filterDropdown
      if (column.filterable) {
        col.filterDropdown = true;
      }

      return col;
    });

    // 添加操作列
    if (actionHandlers && Object.keys(actionHandlers).length > 0) {
      antdColumns.push({
        title: '操作',
        key: 'actions',
        width: 200,
        fixed: 'right',
        render: (_, record) => this.renderActions(record, actionHandlers)
      });
    }

    return antdColumns;
  }

  /**
   * 渲染单元格
   */
  private renderCell(
    value: any,
    record: any,
    index: number,
    cellRenderer?: CellRenderer
  ): React.ReactNode {
    if (!cellRenderer) {
      return this.renderDefaultCell(value);
    }

    // 自定义渲染函数
    if (cellRenderer.render) {
      return cellRenderer.render(value, record, index);
    }

    // 内置渲染器
    switch (cellRenderer.type) {
      case 'tag':
        return this.renderTagCell(value, cellRenderer.config);
      case 'link':
        return this.renderLinkCell(value, cellRenderer.config);
      case 'image':
        return this.renderImageCell(value, cellRenderer.config);
      case 'date':
        return this.renderDateCell(value, cellRenderer.config);
      case 'json':
        return this.renderJsonCell(value, cellRenderer.config);
      case 'text':
      default:
        return this.renderTextCell(value, cellRenderer.config);
    }
  }

  /**
   * 渲染默认单元格
   */
  private renderDefaultCell(value: any): React.ReactNode {
    if (value === null || value === undefined) {
      return <span style={{ color: '#ccc' }}>-</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <Tag color={value ? 'green' : 'red'}>
          {value ? '是' : '否'}
        </Tag>
      );
    }

    if (Array.isArray(value)) {
      return <Tag>{value.length} 项</Tag>;
    }

    if (typeof value === 'object') {
      return <Tag color="blue">对象</Tag>;
    }

    return String(value);
  }

  /**
   * 渲染标签单元格
   */
  private renderTagCell(value: any, config?: any): React.ReactNode {
    if (value === null || value === undefined) {
      return <span style={{ color: '#ccc' }}>-</span>;
    }

    // 布尔值标签
    if (typeof value === 'boolean') {
      const trueText = config?.trueText || '是';
      const falseText = config?.falseText || '否';
      const trueColor = config?.trueColor || 'green';
      const falseColor = config?.falseColor || 'red';
      
      return (
        <Tag color={value ? trueColor : falseColor}>
          {value ? trueText : falseText}
        </Tag>
      );
    }

    // 数组计数标签
    if (Array.isArray(value) && config?.showCount) {
      return <Tag>{value.length} 项</Tag>;
    }

    // 枚举值标签
    if (config?.colorMap) {
      const color = config.colorMap[String(value)] || 'default';
      return <Tag color={color}>{String(value)}</Tag>;
    }

    return <Tag>{String(value)}</Tag>;
  }

  /**
   * 渲染链接单元格
   */
  private renderLinkCell(value: any, config?: any): React.ReactNode {
    if (!value) return <span style={{ color: '#ccc' }}>-</span>;

    const href = config?.href ? config.href(value) : value;
    const text = config?.text ? config.text(value) : value;

    return (
      <a href={href} target={config?.target || '_blank'} rel="noopener noreferrer">
        {text}
      </a>
    );
  }

  /**
   * 渲染图片单元格
   */
  private renderImageCell(value: any, config?: any): React.ReactNode {
    if (!value) return <span style={{ color: '#ccc' }}>-</span>;

    const width = config?.width || 60;
    const height = config?.height || 60;

    return (
      <img
        src={value}
        alt={config?.alt || 'image'}
        style={{
          width,
          height,
          objectFit: 'cover',
          borderRadius: '4px'
        }}
      />
    );
  }

  /**
   * 渲染日期单元格
   */
  private renderDateCell(value: any, config?: any): React.ReactNode {
    if (!value) return <span style={{ color: '#ccc' }}>-</span>;

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return String(value);
    }

    const format = config?.format || 'YYYY-MM-DD HH:mm:ss';
    
    // 简单的日期格式化
    if (format === 'YYYY-MM-DD') {
      return date.toLocaleDateString('zh-CN');
    } else if (format === 'YYYY-MM-DD HH:mm:ss') {
      return date.toLocaleString('zh-CN');
    }

    return date.toLocaleString('zh-CN');
  }

  /**
   * 渲染 JSON 单元格
   */
  private renderJsonCell(value: any, config?: any): React.ReactNode {
    if (value === null || value === undefined) {
      return <span style={{ color: '#ccc' }}>-</span>;
    }

    const jsonString = typeof value === 'string' ? value : JSON.stringify(value);
    const maxLength = config?.maxLength || 50;

    if (jsonString.length <= maxLength) {
      return <code>{jsonString}</code>;
    }

    return (
      <Tooltip title={<pre>{JSON.stringify(value, null, 2)}</pre>}>
        <code>{jsonString.substring(0, maxLength)}...</code>
      </Tooltip>
    );
  }

  /**
   * 渲染文本单元格
   */
  private renderTextCell(value: any, config?: any): React.ReactNode {
    if (value === null || value === undefined) {
      return <span style={{ color: '#ccc' }}>-</span>;
    }

    const text = String(value);
    const maxLength = config?.maxLength || 100;

    if (text.length <= maxLength) {
      return text;
    }

    return (
      <Tooltip title={text}>
        <span>{text.substring(0, maxLength)}...</span>
      </Tooltip>
    );
  }

  /**
   * 渲染操作按钮
   */
  private renderActions(record: any, actionHandlers: TableRendererProps['actionHandlers']): React.ReactNode {
    if (!actionHandlers) return null;

    return (
      <Space size="small">
        {actionHandlers.onDetail && (
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              const result = actionHandlers.onDetail!(record);
              if (typeof result === 'string') {
                window.location.href = result;
              }
            }}
            style={{
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            查看
          </Button>
        )}
        {actionHandlers.onEdit && (
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => actionHandlers.onEdit!(record)}
            style={{
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            编辑
          </Button>
        )}
        {actionHandlers.onDelete && (
          <Button
            type="primary"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => actionHandlers.onDelete!(record)}
            style={{
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            删除
          </Button>
        )}
      </Space>
    );
  }
}
