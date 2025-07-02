import React from 'react';
import { Result, Button, Typography, Collapse, Space } from 'antd';
import { 
  ExclamationCircleOutlined, 
  ReloadOutlined, 
  HomeOutlined,
  BugOutlined 
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

export interface ErrorPageProps {
  status?: number;
  title?: string;
  message?: string;
  stack?: string;
  showReload?: boolean;
  showHome?: boolean;
  showDetails?: boolean;
}

export function ErrorPage({
  status,
  title,
  message,
  stack,
  showReload = true,
  showHome = true,
  showDetails = true
}: ErrorPageProps) {
  const navigate = useNavigate();

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getErrorConfig = () => {
    switch (status) {
      case 404:
        return {
          status: '404' as const,
          title: title || '页面未找到',
          subTitle: message || '抱歉，您访问的页面不存在。',
          icon: <ExclamationCircleOutlined />
        };
      case 403:
        return {
          status: '403' as const,
          title: title || '访问被拒绝',
          subTitle: message || '抱歉，您没有权限访问此页面。',
          icon: <ExclamationCircleOutlined />
        };
      case 500:
        return {
          status: '500' as const,
          title: title || '服务器错误',
          subTitle: message || '抱歉，服务器出现了一些问题。',
          icon: <ExclamationCircleOutlined />
        };
      default:
        return {
          status: 'error' as const,
          title: title || '出现了错误',
          subTitle: message || '抱歉，应用程序遇到了意外错误。',
          icon: <BugOutlined />
        };
    }
  };

  const errorConfig = getErrorConfig();

  const actions = [];
  
  if (showReload) {
    actions.push(
      <Button key="reload" type="primary" icon={<ReloadOutlined />} onClick={handleReload}>
        重新加载
      </Button>
    );
  }
  
  if (showHome) {
    actions.push(
      <Button key="home" icon={<HomeOutlined />} onClick={handleGoHome}>
        返回首页
      </Button>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full">
        <Result
          status={errorConfig.status}
          title={errorConfig.title}
          subTitle={errorConfig.subTitle}
          icon={errorConfig.icon}
          extra={actions}
        />
        
        {showDetails && (stack || message) && (
          <div className="mt-8">
            <Collapse ghost>
              <Panel 
                header={
                  <Space>
                    <BugOutlined />
                    <Text type="secondary">查看错误详情</Text>
                  </Space>
                } 
                key="error-details"
              >
                {message && (
                  <div className="mb-4">
                    <Text strong>错误信息：</Text>
                    <Paragraph className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                      <Text type="danger">{message}</Text>
                    </Paragraph>
                  </div>
                )}
                
                {stack && (
                  <div>
                    <Text strong>堆栈跟踪：</Text>
                    <pre className="mt-2 p-3 bg-gray-100 border border-gray-200 rounded overflow-x-auto text-xs">
                      <code>{stack}</code>
                    </pre>
                  </div>
                )}
              </Panel>
            </Collapse>
          </div>
        )}
      </div>
    </div>
  );
}

// 404 页面组件
export function NotFoundPage() {
  return (
    <ErrorPage
      status={404}
      showDetails={false}
    />
  );
}

// 通用错误页面组件
export function GeneralErrorPage({ error }: { error: Error }) {
  return (
    <ErrorPage
      title="应用程序错误"
      message={error.message}
      stack={import.meta.env.DEV ? error.stack : undefined}
    />
  );
}

// 网络错误页面组件
export function NetworkErrorPage({ message }: { message?: string }) {
  return (
    <ErrorPage
      title="网络连接错误"
      message={message || "无法连接到服务器，请检查您的网络连接。"}
      showDetails={false}
    />
  );
}

// 权限错误页面组件
export function PermissionErrorPage({ message }: { message?: string }) {
  return (
    <ErrorPage
      status={403}
      message={message}
      showDetails={false}
    />
  );
}
