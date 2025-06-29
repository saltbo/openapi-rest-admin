#!/usr/bin/env node

/**
 * 数据库重置脚本
 * 用于重置数据库并重新导入默认数据
 */

import { prisma } from '../app/lib/db/connection';
import { API_CONFIGS } from '../config/apis';

async function resetDatabase() {
  console.log('🗑️  重置数据库...');
  
  try {
    // 删除所有现有数据
    await prisma.openAPIDocument.deleteMany();
    console.log('   ✅ 清理现有数据完成');

    // 重新导入默认配置
    console.log('📥 导入默认配置...');
    
    for (const config of API_CONFIGS) {
      const created = await prisma.openAPIDocument.create({
        data: {
          id: config.id,
          name: config.name,
          description: config.description,
          openapiUrl: config.openapi_url,
          enabled: config.enabled,
          tags: config.tags ? JSON.stringify(config.tags) : null,
          version: config.version || null,
        },
      });
      console.log(`   ✅ 导入: ${created.name} (${created.id})`);
    }

    console.log(`\n🎉 数据库重置完成！共导入 ${API_CONFIGS.length} 个配置`);
    
  } catch (error) {
    console.error('❌ 数据库重置失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
