import type { JSONSchema7 } from 'json-schema';

/**
 * 表格列定义
 */
export interface TableColumn {
  /** 列的唯一标识 */
  key: string;
  /** 列标题 */
  title: string;
  /** 数据索引 */
  dataIndex: string | string[];
  /** 数据类型 */
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  /** 列宽 */
  width?: number | string;
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否可筛选 */
  filterable?: boolean;
  /** 是否固定列 */
  fixed?: 'left' | 'right';
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 自定义渲染器 */
  cellRenderer?: CellRenderer;
  /** 列的 JSON Schema */
  schema?: JSONSchema7;
}

/**
 * 表格 Schema 定义
 */
export interface TableSchema {
  /** 表格标题 */
  title?: string;
  /** 表格描述 */
  description?: string;
  /** 列定义 */
  columns: TableColumn[];
  /** 主键字段 */
  primaryKey?: string;
  /** 行操作配置 */
  actions?: {
    detail?: boolean;
    edit?: boolean;
    delete?: boolean;
    custom?: Array<{
      key: string;
      title: string;
      icon?: string;
      type?: 'primary' | 'default' | 'danger';
    }>;
  };
}

/**
 * 单元格渲染器
 */
export interface CellRenderer {
  /** 渲染器类型 */
  type: 'text' | 'tag' | 'link' | 'image' | 'date' | 'json' | 'custom';
  /** 渲染器配置 */
  config?: Record<string, any>;
  /** 自定义渲染函数 */
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

/**
 * 操作处理器
 */
export interface ActionHandler {
  /** 查看详情 */
  onDetail?: (record: any) => void | string;
  /** 编辑记录 */
  onEdit?: (record: any) => void;
  /** 删除记录 */
  onDelete?: (record: any) => void;
  /** 自定义操作 */
  onCustomAction?: (action: string, record: any) => void;
}

/**
 * 表格渲染器接口
 */
export interface TableRenderer {
  /** 渲染表格 */
  render: (props: TableRendererProps) => React.ReactElement;
}

/**
 * 表格渲染器属性
 */
export interface TableRendererProps {
  /** 表格 Schema */
  schema: TableSchema;
  /** 表格数据 */
  data: any[];
  /** 是否加载中 */
  loading?: boolean;
  /** 分页配置 */
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    onChange?: (page: number, pageSize: number) => void;
  };
  /** 操作处理器 */
  actionHandlers?: ActionHandler;
  /** 表格选择配置 */
  rowSelection?: {
    type?: 'checkbox' | 'radio';
    selectedRowKeys?: string[] | number[];
    onChange?: (selectedRowKeys: string[] | number[], selectedRows: any[]) => void;
  };
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 表格大小 */
  size?: 'small' | 'middle' | 'large';
  /** 是否显示边框 */
  bordered?: boolean;
}

/**
 * JsonSchemaTable 组件属性
 */
export interface JsonSchemaTableProps extends Omit<TableRendererProps, 'schema'> {
  /** JSON Schema 定义 */
  schema: JSONSchema7 | TableSchema;
  /** 表格渲染器 */
  renderer?: TableRenderer;
  /** 是否自动从 schema 生成列 */
  autoGenerateColumns?: boolean;
  /** 列配置覆盖 */
  columnOverrides?: Partial<Record<string, Partial<TableColumn>>>;
}
