import React from 'react';
import { Card, Typography, Descriptions, Tooltip, Tag } from 'antd';

const { Text } = Typography;

interface ResourceItem {
  id: string | number;
  [key: string]: any;
}

interface ResourceInfoCardProps {
  data: ResourceItem;
}

export const ResourceInfoCard: React.FC<ResourceInfoCardProps> = ({ data }) => {
  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) {
      return <Text type="secondary">-</Text>;
    }
    
    if (typeof value === 'object') {
      const jsonStr = JSON.stringify(value, null, 2);
      return (
        <Tooltip title="复杂对象数据，请查看原始数据">
          <Tag 
            color="processing"
            style={{ 
              cursor: 'pointer',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
              borderRadius: '8px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}
          >
            {JSON.stringify(value).substring(0, 50)}...
          </Tag>
        </Tooltip>
      );
    }
    
    const textStr = String(value);
    if (textStr.length > 100) {
      return (
        <Tooltip title={textStr}>
          <Text 
            style={{ 
              display: 'block',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '100px',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            {textStr.substring(0, 100)}...
          </Text>
        </Tooltip>
      );
    }
    
    // 特殊字段的格式化
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
      try {
        const date = new Date(textStr);
        if (!isNaN(date.getTime())) {
          return (
            <Tooltip title={`原始值: ${textStr}`}>
              <Text>{date.toLocaleString()}</Text>
            </Tooltip>
          );
        }
      } catch (e) {
        // 如果不是有效日期，按普通文本处理
      }
    }
    
    if (key.toLowerCase().includes('email')) {
      return <Text copyable>{textStr}</Text>;
    }
    
    if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
      return (
        <a href={textStr} target="_blank" rel="noopener noreferrer">
          {textStr}
        </a>
      );
    }
    
    return <Text copyable={textStr.length > 20}>{textStr}</Text>;
  };

  const generateDescriptions = () => {
    return Object.entries(data).map(([key, value]) => (
      <Descriptions.Item 
        label={
          <Text strong>
            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
          </Text>
        } 
        key={key}
      >
        {formatValue(key, value)}
      </Descriptions.Item>
    ));
  };

  return (
    <Card 
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          padding: '8px 0'
        }}>
          <div style={{
            width: '4px',
            height: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '2px'
          }} />
          <Text style={{ fontSize: '18px', fontWeight: '600', color: '#262626' }}>
            基本信息
          </Text>
        </div>
      }
      bordered={false}
      style={{
        marginBottom: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)',
        background: '#fff'
      }}
      headStyle={{
        borderBottom: '1px solid #f0f0f0',
        padding: '16px 24px'
      }}
      bodyStyle={{
        padding: '24px'
      }}
    >
      <Descriptions 
        bordered 
        size="middle" 
        column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}
        labelStyle={{ 
          backgroundColor: '#fafafa',
          fontWeight: 600,
          width: '140px',
          color: '#262626',
          borderRight: '1px solid #e8e8e8'
        }}
        contentStyle={{
          backgroundColor: '#fff',
          padding: '12px 16px'
        }}
        style={{
          background: '#fff'
        }}
      >
        {generateDescriptions()}
      </Descriptions>
    </Card>
  );
};
