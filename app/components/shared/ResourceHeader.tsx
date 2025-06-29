import React from 'react';
import { Card, Typography, Button, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ResourceHierarchy } from '../../utils/resourceRouting';

const { Title, Text } = Typography;

interface ResourceHeaderProps {
  resourceName: string;
  itemId: string;
  isSubResourceDetail: boolean;
  resourceHierarchy: ResourceHierarchy[];
  onShowJson: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ResourceHeader: React.FC<ResourceHeaderProps> = ({
  resourceName,
  itemId,
  isSubResourceDetail,
  resourceHierarchy,
  onShowJson,
  onEdit,
  onDelete
}) => {
  return (
    <Card 
      bordered={false}
      style={{
        marginBottom: '24px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        overflow: 'hidden'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          flex: 1, 
          minWidth: '300px' 
        }}>
          <div>
            <Title level={1} style={{ 
              margin: 0, 
              marginBottom: '8px', 
              color: '#fff',
              fontSize: '32px',
              fontWeight: '600'
            }}>
              {resourceName}
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px' }}>
                ID: {itemId}
              </Text>
              {isSubResourceDetail && (
                <Tag color="rgba(255, 255, 255, 0.2)" style={{ 
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '2px 8px'
                }}>
                  {resourceHierarchy.length > 2 ? `${resourceHierarchy.length}级子资源` : '子资源'}
                </Tag>
              )}
            </div>
          </div>
        </div>
        <Space wrap size="middle">
          {onEdit && (
            <Button 
              icon={<EditOutlined />} 
              size="large"
              onClick={onEdit}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff'
              }}
            >
              编辑
            </Button>
          )}
          {onDelete && (
            <Button 
              danger 
              icon={<DeleteOutlined />}
              size="large"
              onClick={onDelete}
              style={{
                background: 'rgba(255, 77, 79, 0.8)',
                border: '1px solid rgba(255, 77, 79, 0.3)',
                color: '#fff'
              }}
            >
              删除
            </Button>
          )}
          <Button 
            type="primary" 
            onClick={onShowJson}
            size="large"
            style={{
              background: '#fff',
              color: '#667eea',
              border: 'none',
              fontWeight: '500'
            }}
          >
            查看原始数据
          </Button>
        </Space>
      </div>
    </Card>
  );
};
