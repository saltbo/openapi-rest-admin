import { PrismaClient } from '@prisma/client';

// 创建 Prisma 客户端单例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 优雅关闭数据库连接
export async function disconnectDatabase() {
  await prisma.$disconnect();
}
