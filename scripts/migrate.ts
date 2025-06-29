import { prisma } from '../app/lib/db/connection';
import { API_CONFIGS } from '../config/apis';

/**
 * 数据迁移脚本
 * 将现有的配置文件数据迁移到数据库中
 */
async function migrateAPIConfigs() {
  console.log('开始迁移 API 配置数据...');

  try {
    // 清空现有数据（可选）
    await prisma.aPIConfig.deleteMany();
    console.log('已清空现有数据');

    // 迁移配置数据
    for (const config of API_CONFIGS) {
      await prisma.aPIConfig.create({
        data: {
          id: config.id,
          name: config.name,
          description: config.description,
          openapiUrl: config.openapi_url,
          enabled: config.enabled,
          tags: config.tags ? JSON.stringify(config.tags) : null,
          version: config.version || null,
        }
      });
      console.log(`已迁移配置: ${config.name}`);
    }

    console.log(`迁移完成！共迁移了 ${API_CONFIGS.length} 个配置`);
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

/**
 * 检查数据库连接和表结构
 */
async function checkDatabase() {
  try {
    await prisma.$connect();
    console.log('数据库连接成功');

    const count = await prisma.aPIConfig.count();
    console.log(`当前数据库中有 ${count} 个 API 配置`);
  } catch (error) {
    console.error('数据库检查失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDatabase()
    .then(() => migrateAPIConfigs())
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

export { migrateAPIConfigs, checkDatabase };
