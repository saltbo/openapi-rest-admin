import React from 'react';
import JsonView from '@uiw/react-json-view';

interface JsonViewerProps {
  data: any;
  collapsed?: boolean;
  style?: React.CSSProperties;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ 
  data, 
  collapsed = 1,
  style = {} 
}) => {
  return (
    <div style={{ maxHeight: '400px', overflow: 'auto', ...style }}>
      <JsonView
        value={data}
        collapsed={collapsed}
        style={{
          backgroundColor: '#f8f9fa',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
        }}
      />
    </div>
  );
};
