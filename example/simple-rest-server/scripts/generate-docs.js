const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

// Swagger配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Simple REST API',
      version: '1.0.0',
      description: '一个标准的RESTful演示服务，包含Authors、Books、Notes等资源',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

// 生成OpenAPI规范
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// 输出到文件
const outputPath = path.join(__dirname, 'openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

console.log(`✅ OpenAPI规范已生成到: ${outputPath}`);
console.log(`📚 在线查看文档: http://localhost:3000/api-docs`);

// 输出一些统计信息
const paths = Object.keys(swaggerSpec.paths || {});
const totalEndpoints = paths.reduce((count, path) => {
  return count + Object.keys(swaggerSpec.paths[path]).length;
}, 0);

console.log(`📊 API统计信息:`);
console.log(`   - 路径数量: ${paths.length}`);
console.log(`   - 端点数量: ${totalEndpoints}`);
console.log(`   - 模型数量: ${Object.keys(swaggerSpec.components?.schemas || {}).length}`);
