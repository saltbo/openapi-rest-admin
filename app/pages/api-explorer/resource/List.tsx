import React, { useState } from "react";
import {
  Card,
  Typography,
  Space,
  Button,
  Input,
  Tag,
  Alert,
  Drawer,
} from "antd";
import { useParams } from "react-router";
import {
  DatabaseOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { JsonViewer } from "~/components/shared/JsonViewer";
import { ResourceBreadcrumb } from "~/components/shared/ResourceBreadcrumb";
import { parseResourcePath, buildDetailLink } from "~/utils/resourceRouting";
import {
  useOpenAPIService,
  useResourceInfo,
  useResourceListData,
  useResourceTableSchema,
} from "~/hooks/useOpenAPIService";
import { Table } from '~/components/json-schema-table/antd';
import { useResourceDialogs } from "./hooks/useResourceDialogs";
import { capitalizeFirst } from "~/components";
import ResourceActionForm, { type ActionType } from './components/ResourceActionForm';
import ResourceDeleteConfirm from './components/ResourceDeleteConfirm';

const { Title, Paragraph } = Typography;
const { Search } = Input;

interface ResourceListProps {
  apiId?: string;
  resourceId?: string;
  nestedPath?: string; // 用于处理嵌套的子资源列表
}

export const ResourceList: React.FC<ResourceListProps> = ({
  apiId,
  resourceId,
  nestedPath,
}) => {
  const params = useParams<{ sName: string; rName: string }>();

  // 优先使用 props，如果没有则使用路由参数
  const sName = apiId || params.sName;
  const rName = resourceId || params.rName;

  // 使用工具函数解析嵌套路径
  const { currentResourceName, parentContext, resourceHierarchy } =
    parseResourcePath(nestedPath, rName || "");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // 使用 OpenAPI 服务
  const { service, isInitialized, apiConfig } = useOpenAPIService(sName);

  // 获取资源信息
  const { resource } = useResourceInfo(service, currentResourceName);

  // 获取资源数据
  const {
    data: resourceData,
    isLoading,
    error,
    refetch,
  } = useResourceListData(
    service,
    resource,
    currentPage,
    pageSize,
    searchQuery,
    nestedPath
  );

  // 获取表格 schema
  const tableSchema = useResourceTableSchema(service, currentResourceName);

  // 使用自定义 Hook 管理对话框状态
  const {
    showActionForm,
    currentAction,
    selectedItem,
    showDeleteConfirm,
    itemToDelete,
    handleAdd,
    handleEdit,
    handleDelete,
    handleFormSuccess,
    handleDeleteSuccess,
    closeActionForm,
    closeDeleteConfirm,
  } = useResourceDialogs(refetch);

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // 使用工具函数生成详情页面链接
  const generateDetailLink = (itemId: string | number) => {
    return buildDetailLink(sName!, rName!, nestedPath, itemId);
  };

  const actionHandlers = {
    onDetail: (record: any) => generateDetailLink(record.id),
    onEdit: (record: any) => handleEdit(record),
    onDelete: handleDelete,
  };

  if (error) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="加载失败"
          description={`无法加载资源数据: ${error.message}`}
          type="error"
          action={
            <Button size="small" onClick={() => refetch()}>
              重试
            </Button>
          }
          showIcon
        />
      </div>
    );
  }

  if (!resource || !tableSchema) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="资源不存在"
          description={`找不到资源 "${currentResourceName}" 或其表格定义`}
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <ResourceBreadcrumb
        serviceName={sName}
        topLevelResource={rName}
        nestedPath={nestedPath}
        style={{ marginBottom: "16px" }}
      />

      <div style={{ marginBottom: "24px" }}>
        <Space align="start">
          <DatabaseOutlined style={{ fontSize: "32px", color: "#1890ff" }} />
          <div>
            <Title level={2} style={{ margin: 0 }}>
              {capitalizeFirst(resource.name)}
              {parentContext && (
                <Tag color="blue" style={{ marginLeft: "8px" }}>
                  子资源
                </Tag>
              )}
            </Title>
            <Paragraph type="secondary">
              {apiConfig?.name} - {resource.pathPattern}
              {parentContext && (
                <span style={{ marginLeft: "8px" }}>
                  (属于 {parentContext[parentContext.length - 1]?.resourceName}:{" "}
                  {parentContext[parentContext.length - 1]?.itemId})
                </span>
              )}
            </Paragraph>
          </div>
        </Space>
      </div>

      <Card>
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Space>
            <Search
              placeholder="搜索数据..."
              allowClear
              style={{ width: 300 }}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
            <Button icon={<FilterOutlined />}>筛选</Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              刷新
            </Button>
          </Space>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加新项
            </Button>
          </Space>
        </div>

        <Table
          schema={tableSchema}
          data={resourceData?.data || []}
          actionHandlers={actionHandlers}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: resourceData?.pagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
        />
      </Card>

      {/* 资源操作表单 */}
      <Drawer
        title={`${currentAction === 'create' ? '添加' : '编辑'}资源`}
        placement="right"
        size="large"
        open={showActionForm}
        onClose={closeActionForm}
        destroyOnClose
        styles={{
          body: { padding: 0 }
        }}
      >
        {resource && sName && (
          <ResourceActionForm
            apiId={sName}
            resource={resource}
            action={currentAction}
            initialData={selectedItem}
            onSuccess={handleFormSuccess}
            onCancel={closeActionForm}
          />
        )}
      </Drawer>

      {/* 删除确认对话框 */}
      {resource && itemToDelete && sName && (
        <ResourceDeleteConfirm
          apiId={sName}
          resource={resource}
          item={itemToDelete}
          open={showDeleteConfirm}
          onSuccess={handleDeleteSuccess}
          onCancel={closeDeleteConfirm}
        />
      )}
    </div>
  );
};

export default ResourceList;
