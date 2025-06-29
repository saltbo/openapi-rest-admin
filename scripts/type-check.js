#!/usr/bin/env node

/**
 * 简单的类型检查脚本
 */

import { execSync } from 'child_process';

try {
  console.log('🔍 Running TypeScript type check...');
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'inherit' });
  console.log('✅ TypeScript type check passed!');
} catch (error) {
  console.error('❌ TypeScript type check failed');
  process.exit(1);
}
