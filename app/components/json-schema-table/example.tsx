import React, { useState } from 'react';
import { Space, Button } from 'antd';
import { AntdTable } from '~/components/json-schema-table';
import type { JSONSchema7 } from 'json-schema';

// 示例 Schema
const userSchema: JSONSchema7 = {
  type: 'array',
  title: '用户列表',
  items: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        title: 'ID'
      },
      name: {
        type: 'string',
        title: '姓名'
      },
      email: {
        type: 'string',
        title: '邮箱',
        format: 'email'
      },
      status: {
        type: 'string',
        title: '状态',
        enum: ['active', 'inactive', 'pending']
      },
      age: {
        type: 'number',
        title: '年龄'
      },
      isVip: {
        type: 'boolean',
        title: 'VIP 用户'
      },
      tags: {
        type: 'array',
        title: '标签',
        items: { type: 'string' }
      },
      profile: {
        type: 'object',
        title: '个人资料',
        properties: {
          avatar: { type: 'string' },
          bio: { type: 'string' }
        }
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        title: '创建时间'
      }
    },
    required: ['id', 'name', 'email']
  }
};

// 示例数据
const userData = [
  {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    status: 'active',
    age: 28,
    isVip: true,
    tags: ['前端', '全栈'],
    profile: {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      bio: '资深前端工程师'
    },
    createdAt: '2023-01-15T08:30:00Z'
  },
  {
    id: 2,
    name: '李四',
    email: 'lisi@example.com',
    status: 'inactive',
    age: 32,
    isVip: false,
    tags: ['后端'],
    profile: {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      bio: '后端架构师'
    },
    createdAt: '2023-02-20T14:15:00Z'
  },
  {
    id: 3,
    name: '王五',
    email: 'wangwu@example.com',
    status: 'pending',
    age: 25,
    isVip: true,
    tags: ['设计', 'UI/UX'],
    profile: {
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
      bio: '产品设计师'
    },
    createdAt: '2023-03-10T10:45:00Z'
  }
];

/**
 * JSON Schema Table 使用示例
 */
export function JsonSchemaTableExample() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: userData.length
  });

  return (
    <div style={{ padding: '24px' }}>
      <h1>JSON Schema Table 组件示例</h1>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* 基础使用 */}
        <div>
          <h2>基础使用</h2>
          <AntdTable
            schema={userSchema}
            data={userData}
          />
        </div>

        {/* 带操作的表格 */}
        <div>
          <h2>带操作的表格</h2>
          <AntdTable
            schema={userSchema}
            data={userData}
            actionHandlers={{
              onDetail: (record) => {
                console.log('查看用户:', record);
                alert(`查看用户: ${record.name}`);
              },
              onEdit: (record) => {
                console.log('编辑用户:', record);
                alert(`编辑用户: ${record.name}`);
              },
              onDelete: (record) => {
                console.log('删除用户:', record);
                if (confirm(`确定删除用户 ${record.name} 吗？`)) {
                  alert('删除成功');
                }
              }
            }}
          />
        </div>

        {/* 自定义列配置 */}
        <div>
          <h2>自定义列配置</h2>
          <AntdTable
            schema={userSchema}
            data={userData}
            columnOverrides={{
              email: {
                cellRenderer: {
                  type: 'link',
                  config: {
                    href: (value: string) => `mailto:${value}`,
                    text: (value: string) => value
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
                      inactive: 'red',
                      pending: 'orange'
                    }
                  }
                }
              },
              profile: {
                cellRenderer: {
                  type: 'custom',
                  render: (value: any) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={value?.avatar} 
                        alt="avatar" 
                        style={{ width: 32, height: 32, borderRadius: '50%' }}
                      />
                      <span>{value?.bio}</span>
                    </div>
                  )
                }
              }
            }}
            actionHandlers={{
              onEdit: (record) => alert(`编辑: ${record.name}`)
            }}
          />
        </div>

        {/* 分页和选择 */}
        <div>
          <h2>分页和选择</h2>
          <div style={{ marginBottom: '16px' }}>
            <span>已选中: {selectedRowKeys.length} 项</span>
            {selectedRowKeys.length > 0 && (
              <Button 
                type="primary" 
                style={{ marginLeft: '16px' }}
                onClick={() => {
                  alert(`批量操作: ${selectedRowKeys.join(', ')}`);
                }}
              >
                批量操作
              </Button>
            )}
          </div>
          <AntdTable
            schema={userSchema}
            data={userData}
            pagination={{
              ...pagination,
              onChange: (page, pageSize) => {
                setPagination({
                  ...pagination,
                  current: page,
                  pageSize: pageSize!
                });
                console.log('分页变化:', { page, pageSize });
              }
            }}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys, rows) => {
                setSelectedRowKeys(keys as string[]);
                console.log('选择变化:', { keys, rows });
              }
            }}
            bordered
            size="small"
          />
        </div>

        {/* 特殊字段类型展示 */}
        <div>
          <h2>特殊字段类型展示</h2>
          <AntdTable
            schema={{
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', title: 'ID' },
                  name: { type: 'string', title: '姓名' },
                  avatar: { type: 'string', title: '头像' },
                  tags: { type: 'array', title: '标签' },
                  metadata: { type: 'object', title: '元数据' },
                  isActive: { type: 'boolean', title: '激活状态' },
                  website: { type: 'string', title: '网站' }
                }
              }
            }}
            data={[
              {
                id: 1,
                name: '示例用户',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
                tags: ['React', 'TypeScript', 'Node.js'],
                metadata: { role: 'admin', permissions: ['read', 'write'] },
                isActive: true,
                website: 'https://example.com'
              }
            ]}
            columnOverrides={{
              avatar: {
                cellRenderer: {
                  type: 'image',
                  config: { width: 40, height: 40 }
                }
              },
              website: {
                cellRenderer: {
                  type: 'link',
                  config: {
                    href: (value: string) => value,
                    text: () => '访问网站',
                    target: '_blank'
                  }
                }
              }
            }}
          />
        </div>

      </Space>
    </div>
  );
}

export default JsonSchemaTableExample;
