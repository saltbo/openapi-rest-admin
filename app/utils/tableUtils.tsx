import React from 'react';
import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import { Link } from 'react-router';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { FieldDefinition } from '~/types/api';

const { Text } = Typography;

export interface TableColumnConfig {
  fields?: FieldDefinition[];
  data?: any[];
  maxColumns?: number;
  showActions?: boolean;
  actionHandlers?: {
    onDetail?: (record: any) => string; // 返回详情页链接
    onEdit?: (record: any) => string;   // 返回编辑页链接
    onDelete?: (record: any) => void;   // 删除处理函数
  };
  columnWidthCalculator?: (fieldName: string, data: any[]) => number;
}

/**
 * 渲染字段值的通用函数
 */
export function renderFieldValue(value: any, fieldType?: string): React.ReactNode {
  if (value === null || value === undefined) return <Text type="secondary">-</Text>;
  
  switch (fieldType) {
    case 'boolean':
      return <Tag color={value ? 'green' : 'red'}>{value ? '是' : '否'}</Tag>;
    case 'date':
    case 'datetime':
      return new Date(value).toLocaleDateString();
    case 'array':
      return Array.isArray(value) ? `${value.length} 项` : '-';
    case 'object':
      if (typeof value === 'object') {
        const jsonStr = JSON.stringify(value);
        return (
          <Tooltip title={jsonStr}>
            <Tag color="blue" style={{ 
              maxWidth: '120px', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              Object
            </Tag>
          </Tooltip>
        );
      }
      return 'Object';
    default:
      const strValue = String(value);
      if (strValue.length > 50) {
        return (
          <Tooltip title={strValue}>
            <span>{strValue.substring(0, 50)}...</span>
          </Tooltip>
        );
      }
      return strValue;
  }
}

/**
 * 计算列宽度的默认函数
 */
export function calculateColumnWidth(fieldName: string, data: any[] = []): number {
  const maxLength = Math.max(
    fieldName.length,
    ...data.slice(0, 5).map(item => {
      const value = item[fieldName];
      if (value === null || value === undefined) return 1;
      return String(value).length;
    })
  );
  return Math.min(Math.max(maxLength * 8 + 32, 80), 200);
}

/**
 * 基于字段定义生成表格列配置
 */
export function generateTableColumnsFromFields(config: TableColumnConfig) {
  const { 
    fields = [], 
    maxColumns = 6, 
    showActions = true, 
    actionHandlers = {},
    columnWidthCalculator = calculateColumnWidth
  } = config;
  
  const columns = fields.slice(0, maxColumns).map(field => ({
    title: field.name,
    dataIndex: field.name,
    key: field.name,
    ellipsis: true,
    render: (value: any) => renderFieldValue(value, field.type),
  }));

  // 添加操作列
  if (showActions) {
    columns.push({
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          {actionHandlers.onDetail && (
            <Link to={actionHandlers.onDetail(record)}>
              <Button 
                type="link" 
                size="small"
                icon={<EyeOutlined />}
              >
                详情
              </Button>
            </Link>
          )}
          {actionHandlers.onEdit && (
            <Link to={actionHandlers.onEdit(record)}>
              <Button type="link" size="small" icon={<EditOutlined />}>
                编辑
              </Button>
            </Link>
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
    } as any);
  }

  return columns;
}

/**
 * 基于数据生成表格列配置（适用于动态数据）
 */
export function generateTableColumnsFromData(config: TableColumnConfig) {
  const { 
    data = [], 
    maxColumns = 4, 
    showActions = false,
    actionHandlers = {},
    columnWidthCalculator = calculateColumnWidth
  } = config;
  
  if (data.length === 0) return [];
  
  // 基于数据生成列
  const sampleData = data[0];
  const fieldNames = Object.keys(sampleData);
  
  const columns = fieldNames.slice(0, maxColumns).map((fieldName) => ({
    title: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
    dataIndex: fieldName,
    key: fieldName,
    width: columnWidthCalculator(fieldName, data),
    ellipsis: {
      showTitle: false,
    },
    render: (value: any) => renderFieldValue(value),
  }));

  // 添加操作列
  if (showActions && actionHandlers.onDetail) {
    columns.push({
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              if (actionHandlers.onDetail) {
                actionHandlers.onDetail(record);
              }
            }}
            style={{
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            查看
          </Button>
        </Space>
      ),
    } as any);
  }

  return columns;
}
