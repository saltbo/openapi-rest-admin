import React, { useState, useEffect, useMemo } from "react";
import {
  Layout,
  Menu,
  Typography,
  theme,
  Button,
  Space,
  Spin,
  Select,
} from "antd";
import { Link, useLocation, useNavigate } from "react-router";
import {
  HomeOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { capitalizeFirst, ErrorPage, GeneralErrorPage } from "../shared";
import { useOpenAPIService } from "~/hooks/useOpenAPIService";
import ResourceLoading from "~/pages/resource-explorer/components/ResourceLoading";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

interface FrontendLayoutProps {
  children: React.ReactNode;
}

export const FrontendLayout: React.FC<FrontendLayoutProps> = ({ children }) => {
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { service, isLoading } = useOpenAPIService();
  if (!service) {
    return <ResourceLoading />;
  }

  // 获取文档信息和资源统计
  let resources;
  resources = service.getTopLevelResources();
  const showSidebar = true;
  return (
    <Layout style={{ minHeight: "100vh" }}>
      {showSidebar && (
        <Sider
          width={250}
          style={{
            background: colorBgContainer,
            borderRight: "1px solid #f0f0f0",
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
            <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
              Openapi Admin
            </Title>
          </div>

          {/* 菜单区域 */}
          <div
            style={{
              height: "calc(100% - 73px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* 资源菜单 */}
            {isLoading ? (
              <div style={{ padding: "24px", textAlign: "center", flex: 1 }}>
                <Spin />
                <div style={{ marginTop: "8px" }}>加载资源中...</div>
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <Menu
                  mode="inline"
                  selectedKeys={
                    location.pathname.startsWith("/r/")
                      ? [location.pathname]
                      : []
                  }
                  style={{ border: "none" }}
                  items={
                    resources?.map((resource: any) => ({
                      key: `/r/${resource.name}`,
                      icon: <DatabaseOutlined />,
                      label: (
                        <Link to={`/r/${resource.name}`}>
                          {capitalizeFirst(resource.name)}
                        </Link>
                      ),
                    })) || []
                  }
                />
              </div>
            )}
          </div>
        </Sider>
      )}
      <Layout>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
