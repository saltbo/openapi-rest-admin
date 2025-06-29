import React from 'react';
import { Breadcrumb } from 'antd';
import { Link, useParams } from 'react-router';
import { parseResourcePath, buildPathToLevel } from '~/utils/resourceRouting';
import type { ResourceHierarchy } from '~/utils/resourceRouting';

interface ResourceBreadcrumbProps {
  /** 服务名称 */
  serviceName?: string;
  /** 顶级资源名称 */
  topLevelResource?: string;
  /** 嵌套路径 (splat 参数) */
  nestedPath?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 资源页面通用面包屑组件
 * 根据 URL 路径自动生成面包屑导航
 * 
 * URL 格式：/services/{serviceName}/resources/{topLevelResource}/{nestedPath}
 * nestedPath 格式：{id1}/{resource2}/{id2}/{resource3}/{id3}/...
 */
export const ResourceBreadcrumb: React.FC<ResourceBreadcrumbProps> = ({
  serviceName,
  topLevelResource,
  nestedPath,
  style
}) => {
  const params = useParams<{ sName: string; rName: string; '*': string }>();
  
  // 使用参数或从路由参数获取
  const sName = serviceName || params.sName;
  const rName = topLevelResource || params.rName;
  const splat = nestedPath || params['*'] || '';
  
  // 使用工具函数解析资源层次结构
  const { resourceHierarchy } = parseResourcePath(splat, rName || '');
  
  // 判断是否为最后一个项目
  const isLastItem = (index: number, hasItemId: boolean) => {
    return index === resourceHierarchy.length - 1 && hasItemId;
  };
  
  // 判断是否为当前列表页面
  const isCurrentListPage = (index: number) => {
    return index === resourceHierarchy.length - 1 && !resourceHierarchy[index].itemId;
  };

  return (
    <Breadcrumb style={style}>
      {/* 首页 */}
      <Breadcrumb.Item>
        <Link to="/" style={{ color: '#1890ff' }}>首页</Link>
      </Breadcrumb.Item>
      
      {/* 服务名称 */}
      <Breadcrumb.Item>
        <Link to={`/services/${encodeURIComponent(sName!)}`} style={{ color: '#1890ff' }}>
          {sName}
        </Link>
      </Breadcrumb.Item>
      
      {/* 动态生成资源层级面包屑 */}
      {resourceHierarchy.map((level, index) => {
        const hasItemId = !!level.itemId;
        const isLast = isLastItem(index, hasItemId);
        const isCurrent = isCurrentListPage(index);
        
        if (index === 0) {
          // 顶级资源
          return (
            <React.Fragment key={`resource-${index}`}>
              {/* 资源名称 */}
              <Breadcrumb.Item>
                {isCurrent ? (
                  level.resourceName
                ) : (
                  <Link 
                    to={`/services/${encodeURIComponent(sName!)}/resources/${level.resourceName}`}
                    style={{ color: '#1890ff' }}
                  >
                    {level.resourceName}
                  </Link>
                )}
              </Breadcrumb.Item>
              
              {/* 资源项目ID */}
              {hasItemId && (
                <Breadcrumb.Item>
                  {isLast ? (
                    level.itemId
                  ) : (
                    <Link 
                      to={buildPathToLevel(sName!, resourceHierarchy, index, true)}
                      style={{ color: '#1890ff' }}
                    >
                      {level.itemId}
                    </Link>
                  )}
                </Breadcrumb.Item>
              )}
            </React.Fragment>
          );
        } else {
          // 子资源
          return (
            <React.Fragment key={`resource-${index}`}>
              {/* 子资源名称 */}
              <Breadcrumb.Item>
                {isCurrent ? (
                  level.resourceName
                ) : (
                  <Link 
                    to={buildPathToLevel(sName!, resourceHierarchy, index - 1, true) + `/${level.resourceName}`}
                    style={{ color: '#1890ff' }}
                  >
                    {level.resourceName}
                  </Link>
                )}
              </Breadcrumb.Item>
              
              {/* 子资源项目ID */}
              {hasItemId && (
                <Breadcrumb.Item>
                  {isLast ? (
                    level.itemId
                  ) : (
                    <Link 
                      to={buildPathToLevel(sName!, resourceHierarchy, index, true)}
                      style={{ color: '#1890ff' }}
                    >
                      {level.itemId}
                    </Link>
                  )}
                </Breadcrumb.Item>
              )}
            </React.Fragment>
          );
        }
      })}
    </Breadcrumb>
  );
};

export default ResourceBreadcrumb;
