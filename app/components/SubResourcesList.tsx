import React from 'react';
import { Card, Typography, Button, Space, Tag, Table } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { generateTableColumnsFromData } from '../utils/tableUtils';
import type { ParsedResource } from '../types/api';
import type { ResourceHierarchy } from '../utils/resourceRouting';

const { Title, Text } = Typography;

interface ResourceItem {
  id: string | number;
  [key: string]: any;
}

interface SubResourcesListProps {
  subResources: ParsedResource[];
  subResourceData: { [key: string]: ResourceItem[] };
  serviceName: string;
  resourceHierarchy: ResourceHierarchy[];
  onItemClick: (subResourceName: string, record: ResourceItem) => void;
  onCreateNew: (subResourceName: string) => void;
}

export const SubResourcesList: React.FC<SubResourcesListProps> = ({
  subResources,
  subResourceData,
  serviceName,
  resourceHierarchy,
  onItemClick,
  onCreateNew
}) => {
  const generateSubResourceColumns = (subResourceName: string, data: ResourceItem[]) => {
    return generateTableColumnsFromData({
      data,
      maxColumns: 4,
      showActions: true,
      actionHandlers: {
        onDetail: (record: ResourceItem) => {
          onItemClick(subResourceName, record);
          return '';
        }
      }
    });
  };

  if (subResources.length === 0) {
    return null;
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        marginBottom: '20px' 
      }}>
        <div style={{
          width: '4px',
          height: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '2px'
        }} />
        <Title level={3} style={{ 
          margin: 0, 
          color: '#262626',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          关联资源
        </Title>
      </div>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        {subResources.map((subResource) => {
          const data = subResourceData[subResource.name] || [];
          return (
            <Card 
              key={subResource.name}
              title={
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '4px 0'
                }}>
                  <Space align="center">
                    <Text style={{ fontSize: '16px', fontWeight: '600', color: '#262626' }}>
                      {subResource.name}
                    </Text>
                    <Tag 
                      color="processing" 
                      style={{ 
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {data.length} 项
                    </Tag>
                  </Space>
                  <Button 
                    type="primary" 
                    size="middle" 
                    icon={<PlusOutlined />}
                    onClick={() => onCreateNew(subResource.name)}
                    style={{
                      borderRadius: '8px',
                      fontWeight: '500',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    新增
                  </Button>
                </div>
              }
              bordered={false}
              style={{ 
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)',
                background: '#fff',
                overflow: 'hidden'
              }}
              headStyle={{
                borderBottom: '1px solid #f0f0f0',
                background: '#fafafa',
                padding: '16px 24px'
              }}
              bodyStyle={{
                padding: '0'
              }}
            >
              <div style={{ padding: '0 24px 24px 24px' }}>
                <Table
                  columns={generateSubResourceColumns(subResource.name, data)}
                  dataSource={data}
                  rowKey="id"
                  size="middle"
                  scroll={{ x: 'max-content' }}
                  pagination={{ 
                    pageSize: 5, 
                    showSizeChanger: false,
                    showTotal: (total, range) => 
                      `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                    style: { 
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #f0f0f0'
                    }
                  }}
                  onRow={(record) => ({
                    style: { cursor: 'pointer' },
                    onClick: () => onItemClick(subResource.name, record),
                  })}
                  style={{
                    background: '#fff'
                  }}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
