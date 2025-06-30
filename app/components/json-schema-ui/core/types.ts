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
  /** 最小列宽 */
  minWidth?: number;
  /** 最大列宽 */
  maxWidth?: number;
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否可筛选 */
  filterable?: boolean;
  /** 筛选器类型 */
  filterType?: 'input' | 'select' | 'date' | 'dateRange' | 'number' | 'numberRange';
  /** 筛选选项（用于 select 类型） */
  filterOptions?: Array<{ label: string; value: any }>;
  /** 是否固定列 */
  fixed?: 'left' | 'right';
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 是否可调整大小 */
  resizable?: boolean;
  /** 是否隐藏列 */
  hidden?: boolean;
  /** 自定义渲染器 */
  cellRenderer?: CellRenderer;
  /** 列的 JSON Schema */
  schema?: JSONSchema7;
  /** 列描述/提示 */
  description?: string;
  /** 是否必填字段 */
  required?: boolean;
  /** 默认排序方向 */
  defaultSortOrder?: 'asc' | 'desc';
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
  /** 默认排序配置 */
  defaultSort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  /** 分页配置 */
  pagination?: {
    pageSize: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    showTotal?: boolean;
    pageSizeOptions?: string[];
  };
  /** 表格设置 */
  settings?: {
    /** 是否显示斑马纹 */
    striped?: boolean;
    /** 是否显示边框 */
    bordered?: boolean;
    /** 表格大小 */
    size?: 'small' | 'middle' | 'large';
    /** 是否显示表头 */
    showHeader?: boolean;
    /** 是否可拖拽排序 */
    dragSortable?: boolean;
    /** 是否可拖拽调整列宽 */
    resizable?: boolean;
    /** 是否显示列设置 */
    showColumnSettings?: boolean;
  };
  /** 多选配置 */
  selection?: {
    type?: 'checkbox' | 'radio';
    /** 是否固定选择列 */
    fixed?: boolean;
    /** 选择列宽度 */
    width?: number;
    /** 最大选择数量 */
    maxCount?: number;
  };
  /** 展开行配置 */
  expandable?: {
    /** 展开图标列宽 */
    width?: number;
    /** 是否固定展开列 */
    fixed?: boolean;
    /** 默认展开的行 */
    defaultExpandedRowKeys?: string[];
    /** 是否允许展开 */
    rowExpandable?: (record: any) => boolean;
  };
}

/**
 * 单元格渲染器
 */
export interface CellRenderer {
  /** 渲染器类型 */
  type: 'text' | 'tag' | 'link' | 'image' | 'date' | 'json' | 'number' | 'currency' | 'percentage' | 'boolean' | 'email' | 'phone' | 'url' | 'file' | 'badge' | 'progress' | 'rating' | 'custom';
  /** 渲染器配置 */
  config?: {
    /** 文本相关配置 */
    maxLength?: number;
    ellipsis?: boolean;
    copyable?: boolean;
    
    /** 标签相关配置 */
    colorMap?: Record<string, string>;
    trueText?: string;
    falseText?: string;
    trueColor?: string;
    falseColor?: string;
    showCount?: boolean;
    
    /** 日期相关配置 */
    format?: string;
    locale?: string;
    
    /** 数字相关配置 */
    precision?: number;
    separator?: string;
    prefix?: string;
    suffix?: string;
    
    /** 链接相关配置 */
    target?: '_blank' | '_self' | '_parent' | '_top';
    
    /** 图片相关配置 */
    width?: number | string;
    height?: number | string;
    fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    
    /** 进度相关配置 */
    showPercent?: boolean;
    strokeColor?: string;
    
    /** 评分相关配置 */
    max?: number;
    allowHalf?: boolean;
    disabled?: boolean;
    
    /** 通用配置 */
    [key: string]: any;
  };
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

// 用于描述渲染器的接口
export interface DescriptionRenderer {
  render: (props: { items: any[]; column?: number }) => React.ReactElement;
}

export interface DescriptionItem {
  key: string;
  label: string;
  value: any;
}
