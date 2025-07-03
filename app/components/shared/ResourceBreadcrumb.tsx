import React from "react";
import { Breadcrumb } from "antd";
import { Link, useParams, useLocation } from "react-router";

interface ResourceBreadcrumbProps {
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 重构后的面包屑组件
 * 分为两部分：
 * 1. 全局部分：基于 routes 中定义的路由结构
 * 2. Resource Explorer 部分：基于 PathParamResolver 的逻辑生成
 *
 * URL 格式：/r/{topLevelResource}/{nestedPath}
 */
export const ResourceBreadcrumb: React.FC<ResourceBreadcrumbProps> = ({
  style,
}) => {
  const params = useParams<{ rName: string; "*": string }>();
  const location = useLocation();
  const resourcePath = location.pathname.substring(2); // 去掉前缀 "/r"

  const { rName } = params;
  const splat = params["*"] || "";

  // 生成全局面包屑项
  const generateGlobalBreadcrumbs = () => {
    const items = [];

    // 首页
    items.push(
      <Breadcrumb.Item key="home">
        <Link to="/" style={{ color: "#1890ff" }}>
          首页
        </Link>
      </Breadcrumb.Item>
    );

    return items;
  };

  // 生成资源浏览器面包屑项
  const generateResourceBreadcrumbs = () => {
    if (!rName) return [];

    const items = [];

    // 解析路径段
    const pathSegments = resourcePath.split("/").filter(Boolean);

    // 生成面包屑项
    let currentPath = `/r`;

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const isLast = i === pathSegments.length - 1;
      const isId = i % 2 === 1; // 奇数位置是ID，偶数位置是资源名

      currentPath += `/${segment}`;

      if (isId) {
        // 资源ID - 如果是最后一个，不加链接
        items.push(
          <Breadcrumb.Item key={`id-${i}`}>
            {isLast ? (
              segment
            ) : (
              <Link to={currentPath} style={{ color: "#1890ff" }}>
                {segment}
              </Link>
            )}
          </Breadcrumb.Item>
        );
      } else {
        // 资源名 - 如果是最后一个且没有后续ID，不加链接
        const hasSubsequentId = i + 1 < pathSegments.length;
        const shouldAddLink = !isLast || hasSubsequentId;

        items.push(
          <Breadcrumb.Item key={`resource-${i}`}>
            {shouldAddLink ? (
              <Link to={currentPath} style={{ color: "#1890ff" }}>
                {segment}
              </Link>
            ) : (
              segment
            )}
          </Breadcrumb.Item>
        );
      }
    }

    return items;
  };

  return (
    <Breadcrumb style={style}>
      {/* 全局面包屑 */}
      {generateGlobalBreadcrumbs()}

      {/* 资源浏览器面包屑 */}
      {generateResourceBreadcrumbs()}
    </Breadcrumb>
  );
};

export default ResourceBreadcrumb;
