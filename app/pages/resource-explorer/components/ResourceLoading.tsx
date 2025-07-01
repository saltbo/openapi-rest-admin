import React from 'react';
import { Spin, Alert, Card } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface ResourceLoadingProps {
  /** 是否正在加载 */
  loading?: boolean;
  /** 错误信息 */
  error?: string | Error | null;
  /** 加载提示文本 */
  loadingText?: string;
  /** 错误标题 */
  errorTitle?: string;
  /** 是否显示重试按钮 */
  showRetry?: boolean;
  /** 重试回调函数 */
  onRetry?: () => void;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 加载时的最小高度 */
  minHeight?: string | number;
  /** 是否使用卡片包装 */
  useCard?: boolean;
  /** 卡片标题 */
  cardTitle?: string;
  /** 子组件 - 当没有加载或错误状态时渲染 */
  children?: React.ReactNode;
}

const defaultStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '200px',
  padding: '24px',
};

export const ResourceLoading: React.FC<ResourceLoadingProps> = ({
  loading = false,
  error = null,
  loadingText = '正在加载数据...',
  errorTitle = '加载失败',
  showRetry = true,
  onRetry,
  style,
  minHeight = '200px',
  useCard = false,
  cardTitle = '资源加载',
  children,
}) => {
  // 获取错误信息
  const getErrorMessage = (): string => {
    if (!error) return '';
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return '未知错误';
  };

  // 加载状态内容
  const loadingContent = (
    <div style={{ ...defaultStyle, minHeight, ...style }}>
      <div style={{ textAlign: 'center' }}>
        <Spin 
          size="large" 
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
        />
        <div style={{ 
          marginTop: '16px', 
          color: '#666', 
          fontSize: '14px' 
        }}>
          {loadingText}
        </div>
      </div>
    </div>
  );

  // 错误状态内容
  const errorContent = (
    <div style={{ ...defaultStyle, minHeight, ...style }}>
      <Alert
        message={errorTitle}
        description={getErrorMessage()}
        type="error"
        showIcon
        icon={<ExclamationCircleOutlined />}
        style={{ 
          maxWidth: '500px',
          width: '100%'
        }}
        action={
          showRetry && onRetry && (
            <button
              onClick={onRetry}
              style={{
                background: '#ff4d4f',
                border: 'none',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ff7875';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ff4d4f';
              }}
            >
              重试
            </button>
          )
        }
      />
    </div>
  );

  // 根据状态返回对应内容
  const getContent = () => {
    if (loading) return loadingContent;
    if (error) return errorContent;
    return children;
  };

  // 如果使用卡片包装
  if (useCard && (loading || error)) {
    return (
      <Card
        title={cardTitle}
        bordered={false}
        style={{
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          background: '#fff',
        }}
        bodyStyle={{ padding: 0 }}
      >
        {getContent()}
      </Card>
    );
  }

  return <>{getContent()}</>;
};

export default ResourceLoading;