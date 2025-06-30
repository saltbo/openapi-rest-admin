# JSON Schema Table 组件

基于 JSON Schema 自动生成表格的 React 组件库，支持多种主题渲染器。

## 特性

- 🚀 **自动生成**: 从 JSON Schema 自动生成表格结构
- 🎨 **多主题支持**: 目前支持 Ant Design 主题
- 🔧 **高度可定制**: 支持列配置覆盖、自定义渲染器
- 📋 **丰富的单元格类型**: 支持文本、标签、链接、图片、日期、JSON 等
- ⚡ **操作支持**: 内置查看、编辑、删除等操作
- 📄 **分页和选择**: 支持分页、行选择等表格功能

## 架构设计

```
json-schema-table/
├── core/                    # 核心逻辑
│   ├── types.ts            # 类型定义
│   ├── SchemaToTableConverter.ts  # Schema 转换器
│   └── index.ts            # 核心导出
├── antd/                   # Ant Design 主题
│   ├── Table.tsx           # 主组件
│   ├── AntdTableRenderer.tsx   # Antd 渲染器
│   └── index.ts            # Antd 导出
└── index.ts                # 顶层导出
```

## 快速开始

### 基础使用

```tsx
import { AntdTable } from '~/components/json-schema-table';

// 定义 JSON Schema
const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'number', title: 'ID' },
      name: { type: 'string', title: '姓名' },
      email: { type: 'string', title: '邮箱' },
      status: {
        type: 'string',
        title: '状态',
        enum: ['active', 'inactive']
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        title: '创建时间'
      }
    }
  }
};

// 表格数据
const data = [
  {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    status: 'active',
    createdAt: '2023-01-01T00:00:00Z'
  },
  // ... 更多数据
];

function UserTable() {
  return (
    <AntdTable
      schema={schema}
      data={data}
      actionHandlers={{
        onEdit: (record) => console.log('编辑', record),
        onDelete: (record) => console.log('删除', record),
        onDetail: (record) => console.log('查看', record)
      }}
    />
  );
}
```

### 自定义列配置

```tsx
<AntdTable
  schema={schema}
  data={data}
  columnOverrides={{
    email: {
      cellRenderer: {
        type: 'link',
        config: {
          href: (value) => `mailto:${value}`,
          text: (value) => value
        }
      }
    },
    status: {
      width: 120,
      cellRenderer: {
        type: 'tag',
        config: {
          colorMap: {
            active: 'green',
            inactive: 'red'
          }
        }
      }
    }
  }}
/>
```

### 分页和选择

```tsx
function PaginatedTable() {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 100
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  return (
    <AntdTable
      schema={schema}
      data={data}
      pagination={{
        ...pagination,
        onChange: (page, pageSize) => {
          setPagination({ ...pagination, current: page, pageSize });
        }
      }}
      rowSelection={{
        selectedRowKeys,
        onChange: (keys, rows) => {
          setSelectedRowKeys(keys as string[]);
          console.log('选中的行:', rows);
        }
      }}
    />
  );
}
```

## API 参考

### JsonSchemaTableProps

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| schema | `JSONSchema7 \| TableSchema` | - | JSON Schema 或表格 Schema |
| data | `any[]` | - | 表格数据 |
| renderer | `TableRenderer` | `AntdTableRenderer` | 表格渲染器 |
| autoGenerateColumns | `boolean` | `true` | 是否自动生成列 |
| columnOverrides | `Record<string, Partial<TableColumn>>` | `{}` | 列配置覆盖 |
| loading | `boolean` | `false` | 加载状态 |
| pagination | `PaginationConfig` | - | 分页配置 |
| actionHandlers | `ActionHandler` | - | 操作处理器 |
| rowSelection | `RowSelectionConfig` | - | 行选择配置 |

### TableColumn

| 属性 | 类型 | 说明 |
|------|------|------|
| key | `string` | 列的唯一标识 |
| title | `string` | 列标题 |
| dataIndex | `string \| string[]` | 数据索引 |
| dataType | `'string' \| 'number' \| 'boolean' \| 'array' \| 'object' \| 'date'` | 数据类型 |
| width | `number \| string` | 列宽 |
| sortable | `boolean` | 是否可排序 |
| filterable | `boolean` | 是否可筛选 |
| cellRenderer | `CellRenderer` | 单元格渲染器 |

### CellRenderer

内置的单元格渲染器类型：

#### text
文本渲染器，支持长度截断。
```tsx
{
  type: 'text',
  config: {
    maxLength: 100  // 最大显示长度
  }
}
```

#### tag
标签渲染器，支持颜色映射。
```tsx
{
  type: 'tag',
  config: {
    colorMap: {
      'active': 'green',
      'inactive': 'red'
    },
    // 布尔值配置
    trueText: '是',
    falseText: '否',
    trueColor: 'green',
    falseColor: 'red',
    // 数组计数
    showCount: true
  }
}
```

#### link
链接渲染器。
```tsx
{
  type: 'link',
  config: {
    href: (value) => `https://example.com/${value}`,
    text: (value) => value,
    target: '_blank'
  }
}
```

#### image
图片渲染器。
```tsx
{
  type: 'image',
  config: {
    width: 60,
    height: 60,
    alt: 'image'
  }
}
```

#### date
日期渲染器。
```tsx
{
  type: 'date',
  config: {
    format: 'YYYY-MM-DD HH:mm:ss'
  }
}
```

#### json
JSON 渲染器，支持格式化显示。
```tsx
{
  type: 'json',
  config: {
    maxLength: 50  // 超过长度显示省略号和悬浮提示
  }
}
```

#### custom
自定义渲染器。
```tsx
{
  type: 'custom',
  render: (value, record, index) => {
    return <div>自定义内容</div>;
  }
}
```

### ActionHandler

| 属性 | 类型 | 说明 |
|------|------|------|
| onDetail | `(record: any) => void \| string` | 查看详情，返回字符串时会跳转到该 URL |
| onEdit | `(record: any) => void` | 编辑记录 |
| onDelete | `(record: any) => void` | 删除记录 |
| onCustomAction | `(action: string, record: any) => void` | 自定义操作 |

## 高级用法

### 自定义渲染器

可以创建自己的表格渲染器：

```tsx
import { TableRenderer, TableRendererProps } from '~/components/json-schema-table/core';

class CustomTableRenderer implements TableRenderer {
  render(props: TableRendererProps): React.ReactElement {
    // 实现自定义渲染逻辑
    return <div>自定义表格</div>;
  }
}

// 使用自定义渲染器
<AntdTable
  schema={schema}
  data={data}
  renderer={new CustomTableRenderer()}
/>
```

### 从 Schema 转换

如果需要直接操作 Schema 转换：

```tsx
import { SchemaToTableConverter } from '~/components/json-schema-table/core';

const tableSchema = SchemaToTableConverter.convertJsonSchemaToTableSchema(
  jsonSchema,
  {
    includeFields: ['id', 'name', 'email'],  // 只包含指定字段
    excludeFields: ['password'],              // 排除指定字段
    showActions: true,                        // 显示操作列
    columnOverrides: {
      email: {
        cellRenderer: {
          type: 'link',
          config: { href: (v) => `mailto:${v}` }
        }
      }
    }
  }
);
```

## 最佳实践

### 1. Schema 设计
```tsx
// 推荐：为字段添加 title 和描述
const schema = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      title: 'ID',
      description: '用户唯一标识'
    },
    status: {
      type: 'string',
      title: '状态',
      enum: ['active', 'inactive', 'pending'],
      description: '用户当前状态'
    }
  }
};
```

### 2. 性能优化
```tsx
// 对于大量数据，使用 React.memo 优化
const OptimizedTable = React.memo(() => (
  <AntdTable
    schema={schema}
    data={data}
    pagination={{ pageSize: 50 }} // 适当的分页大小
  />
));
```

### 3. 错误处理
```tsx
function SafeTable() {
  try {
    return (
      <AntdTable
        schema={schema}
        data={data}
        loading={loading}
      />
    );
  } catch (error) {
    console.error('表格渲染错误:', error);
    return <div>表格加载失败</div>;
  }
}
```

## 类型安全

组件完全基于 TypeScript 构建，提供完整的类型支持：

```tsx
import type {
  JsonSchemaTableProps,
  TableColumn,
  CellRenderer,
  ActionHandler
} from '~/components/json-schema-table';

// 类型安全的配置
const columnConfig: Partial<TableColumn> = {
  width: 200,
  cellRenderer: {
    type: 'tag',
    config: { colorMap: { active: 'green' } }
  }
};
```

## 故障排除

### 常见问题

**Q: 表格没有显示数据？**
A: 检查 `schema` 是否正确定义了 `properties`，以及 `data` 数组中的对象是否包含对应的字段。

**Q: 自定义渲染器不生效？**
A: 确保在 `columnOverrides` 中正确设置了 `cellRenderer`，并且字段名与 schema 中的属性名一致。

**Q: 操作按钮不显示？**
A: 确保传入了 `actionHandlers` 参数，并且至少包含一个操作处理函数。

**Q: 分页不工作？**
A: 检查 `pagination` 配置是否包含 `total` 字段，以及 `onChange` 回调是否正确更新了分页状态。
