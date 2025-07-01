import React from 'react';
import { Descriptions, Tooltip, Typography, Tag } from 'antd';
import type { DescriptionsItem, DescriptionsRenderer } from '../../core';

const { Text } = Typography;

function formatValue(key: string, value: any) {
  if (value === null || value === undefined) return <Text type="secondary">-</Text>;
  if (Array.isArray(value)) {
    return (
      <Tooltip title={JSON.stringify(value)}>
        <Tag>{JSON.stringify(value).substring(0, 50)}...</Tag>
      </Tooltip>
    );
  }
  const textStr = String(value);
  if (textStr.length > 100) {
    return (
      <Tooltip title={textStr}>
        <Text style={{ display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '100px', overflow: 'hidden', cursor: 'pointer' }}>
          {textStr.substring(0, 100)}...
        </Text>
      </Tooltip>
    );
  }
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
    } catch (e) {}
  }
  if (key.toLowerCase().includes('email')) {
    return <Text copyable>{textStr}</Text>;
  }
  if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
    return (
      <a href={textStr} target="_blank" rel="noopener noreferrer">{textStr}</a>
    );
  }
  return <Text copyable={textStr.length > 20}>{textStr}</Text>;
}

export class AntdDescriptionRenderer implements DescriptionsRenderer {
  render({ items, column }: { items: DescriptionsItem[]; column?: number }) {
    return (
      <Descriptions bordered column={column} size="middle">
        {items.map((item: DescriptionsItem) => (
          <Descriptions.Item label={item.label} key={item.key}>
            {formatValue(item.key, item.value)}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  }
}

export { formatValue }; 