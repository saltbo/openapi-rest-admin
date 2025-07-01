import React, { useState } from 'react';
import { Card, Typography, Button, Space,  Modal } from 'antd';
import { JsonViewer } from "~/components/shared/JsonViewer";
import type { ResourceInfo } from '~/lib/api';

const { Title, Text } = Typography;

interface ResourceHeaderProps {
  resource: ResourceInfo;
  resourceData: any;
}

export const ResourceHeader: React.FC<ResourceHeaderProps> = ({
  resource,
  resourceData
}) => {
  const [showJsonModal, setShowJsonModal] = useState(false);
  const handleShowJson = () => {
    setShowJsonModal(true);
  };


  // 从资源数据中获取ID（假设使用第一个字段作为ID）
  const itemId = resourceData ? Object.values(resourceData)[0] || '' : '';
  const resourceName = resource?.name || '';
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
                ID: {String(itemId)}
              </Text>
            </div>
          </div>
        </div>
        <Space wrap size="middle">
          <Button 
            type="primary" 
            onClick={handleShowJson}
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

      {/* JSON数据模态框 */}
      <Modal
        title="原始数据"
        open={showJsonModal}
        onCancel={() => setShowJsonModal(false)}
        footer={null}
        width="80%"
        style={{ top: 20 }}
      >
        <JsonViewer data={resourceData} />
      </Modal>
    </Card>
  );
};
