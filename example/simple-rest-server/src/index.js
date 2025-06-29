const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const authorsRouter = require('./routes/authors');
const booksRouter = require('./routes/books');
const notesRouter = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Simple REST API',
      version: '1.0.0',
      description: '一个标准的RESTful演示服务，包含Authors、Books、Notes等资源',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Author: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            id: {
              type: 'string',
              description: '作者ID',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
            },
            name: {
              type: 'string',
              description: '作者姓名',
              example: '张三'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '作者邮箱',
              example: 'zhangsan@example.com'
            },
            bio: {
              type: 'string',
              description: '作者简介',
              example: '资深作家，已出版多部畅销小说'
            },
            birthDate: {
              type: 'string',
              format: 'date',
              description: '出生日期',
              example: '1980-01-01'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '创建时间'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新时间'
            }
          }
        },
        Book: {
          type: 'object',
          required: ['title', 'authorId'],
          properties: {
            id: {
              type: 'string',
              description: '书籍ID',
              example: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890'
            },
            title: {
              type: 'string',
              description: '书籍标题',
              example: '西游记'
            },
            authorId: {
              type: 'string',
              description: '作者ID',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
            },
            isbn: {
              type: 'string',
              description: 'ISBN号码',
              example: '978-3-16-148410-0'
            },
            genre: {
              type: 'string',
              description: '书籍类型',
              example: '古典文学'
            },
            publishedDate: {
              type: 'string',
              format: 'date',
              description: '出版日期',
              example: '2020-01-01'
            },
            description: {
              type: 'string',
              description: '书籍描述',
              example: '中国古典四大名著之一'
            },
            price: {
              type: 'number',
              format: 'float',
              description: '价格',
              example: 29.99
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '创建时间'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新时间'
            }
          }
        },
        Note: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            id: {
              type: 'string',
              description: '笔记ID',
              example: 'n1b2c3d4-e5f6-7890-abcd-ef1234567890'
            },
            title: {
              type: 'string',
              description: '笔记标题',
              example: '读书笔记'
            },
            content: {
              type: 'string',
              description: '笔记内容',
              example: '这本书让我深受启发...'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: '标签',
              example: ['读书', '学习', '成长']
            },
            bookId: {
              type: 'string',
              description: '关联的书籍ID',
              example: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890'
            },
            authorId: {
              type: 'string',
              description: '笔记作者ID',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '创建时间'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新时间'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: '错误信息'
            },
            message: {
              type: 'string',
              description: '详细错误描述'
            }
          }
        }
      },
      responses: {
        NotFound: {
          description: '资源未找到',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        BadRequest: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// API文档路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// OpenAPI JSON文档端点
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// API路由
app.use('/api/authors', authorsRouter);
app.use('/api/books', booksRouter);
app.use('/api/notes', notesRouter);

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用Simple REST API',
    documentation: `http://localhost:${PORT}/api-docs`,
    openapi: `http://localhost:${PORT}/openapi.json`,
    endpoints: {
      authors: `http://localhost:${PORT}/api/authors`,
      books: `http://localhost:${PORT}/api/books`,
      notes: `http://localhost:${PORT}/api/notes`
    }
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `路径 ${req.originalUrl} 未找到`
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📚 API文档: http://localhost:${PORT}/api-docs`);
});

module.exports = app;
