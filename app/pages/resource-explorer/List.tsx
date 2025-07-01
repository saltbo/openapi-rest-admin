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
  Spin,
} from "antd";
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
import { Table } from "~/components/json-schema-ui/themes/antd";
import { useResourceDialogs } from "./hooks/useResourceDialogs";
import { capitalizeFirst } from "~/components";
import ResourceActionForm from "./components/ResourceActionForm";
import ResourceDeleteConfirm from "./components/ResourceDeleteConfirm";
import { useResource } from "./hooks/useResource";
import { PathParamResolver } from "~/lib/api";
import { useResourceList } from "./hooks/useResourceList";
import type { ResourceDataItem } from "~/types/api";

const { Title, Paragraph } = Typography;
const { Search } = Input;

interface ResourceListProps {
  serviceName?: string;
}

// 定义资源数据的类型
type ResourceData = ResourceDataItem;

interface ResourceListProps {
  serviceName?: string;
}

export const ResourceList: React.FC<ResourceListProps> = ({ serviceName }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const { service, resource, isInitialized } = useResource();

  // 获取资源数据
  const {
    data: resourceData,
    isLoading,
    error,
    refetch,
  } = useResourceList(
    service,
    resource,
    currentPage,
    pageSize,
    searchQuery,
    {}
  );

  // 获取表格 schema
  const tableSchema = service?.getResourceTableSchema(resource?.name!);

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

  const actionHandlers = {
    onDetail: (record: ResourceData) => {
      const itemId = service?.getResourceIdentifier(resource?.name!, record);
      if (!itemId) {
        throw new Error(`无法获取资源标识符: ${resource?.name}`);
      }
      if (!serviceName) {
        throw new Error("服务名称未提供");
      }

      return `/services/${serviceName}/resources/${resource?.name}/${itemId}`;
    },
    onEdit: (record: ResourceData) => handleEdit(record),
    onDelete: handleDelete,
  };

  // 如果服务还没有初始化，显示加载状态
  if (!isInitialized) {
    return (
      <div
        style={{
          padding: "24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // 资源不存在的状态
  if (!resource) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="资源不存在"
          description="请检查URL是否正确或返回上一页"
          type="warning"
          showIcon
        />
      </div>
    );
  }

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

  if (!tableSchema) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert
          message="表格配置缺失"
          description={`找不到资源 "${resource.name}" 的表格定义`}
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <ResourceBreadcrumb style={{ marginBottom: "16px" }} />
      <div style={{ marginBottom: "24px" }}>
        <Space align="start">
          <DatabaseOutlined style={{ fontSize: "32px", color: "#1890ff" }} />
          <div>
            <Title level={2} style={{ margin: 0 }}>
              {capitalizeFirst(resource.name)}
            </Title>
            <Paragraph type="secondary">{resource.pathPattern}</Paragraph>
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
        title={`${currentAction === "create" ? "添加" : "编辑"}资源`}
        placement="right"
        size="large"
        open={showActionForm}
        onClose={closeActionForm}
        destroyOnClose
        styles={{
          body: { padding: 0 },
        }}
      >
        {resource && (
          <ResourceActionForm
            service={service!}
            resource={resource}
            action={currentAction}
            initialData={selectedItem}
            onSuccess={handleFormSuccess}
            onCancel={closeActionForm}
          />
        )}
      </Drawer>

      {/* 删除确认对话框 */}
      {resource && itemToDelete && (
        <ResourceDeleteConfirm
          service={service!}
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
