#!/usr/bin/env tsx

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadEnv } from 'vite';
import { CONFIG_FIELDS, type RuntimeConfig } from '../config/types.js';

/**
 * 生成运行时配置文件
 */
function generateRuntimeConfig(mode: string = 'development'): RuntimeConfig {
  // 加载环境变量（从 .env 文件）
  const env = loadEnv(mode, process.cwd(), '');
  
  const config: Partial<RuntimeConfig> = {};

  CONFIG_FIELDS.forEach(field => {
    // 优先使用 process.env，其次使用 .env 文件中的值
    const envValue = process.env[field.envKey] || env[field.envKey];
    
    if (envValue !== undefined) {
      // 处理不同类型的值
      if (typeof field.defaultValue === 'boolean') {
        (config as any)[field.key] = envValue.toLowerCase() === 'true';
      } else {
        (config as any)[field.key] = envValue;
      }
    } else if (field.required) {
      (config as any)[field.key] = field.defaultValue;
    } else if (field.defaultValue !== undefined) {
      (config as any)[field.key] = field.defaultValue;
    }
  });

  return config as RuntimeConfig;
}

/**
 * 生成示例配置文件
 */
function generateExampleConfig(): RuntimeConfig {
  const config: Partial<RuntimeConfig> = {};

  CONFIG_FIELDS.forEach(field => {
    (config as any)[field.key] = field.defaultValue;
  });

  return config as RuntimeConfig;
}

/**
 * 生成配置文件的主函数
 */
function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'runtime'; // 'runtime' 或 'example'

  // 确保 public 目录存在
  const publicDir = join(process.cwd(), 'public');
  try {
    mkdirSync(publicDir, { recursive: true });
  } catch (error) {
    // 目录已存在，忽略错误
  }

  if (mode === 'example') {
    // 生成示例配置文件
    const exampleConfig = generateExampleConfig();
    const examplePath = join(publicDir, 'config-example.json');
    
    writeFileSync(examplePath, JSON.stringify(exampleConfig, null, 2) + '\n');
    console.log(`✅ Generated example config: ${examplePath}`);
    
  } else {
    // 生成运行时配置文件
    const mode = 'development'; // 默认使用开发模式
    const env = loadEnv(mode, process.cwd(), '');
    const runtimeConfig = generateRuntimeConfig(mode);
    const configPath = join(publicDir, 'config.json');
    
    writeFileSync(configPath, JSON.stringify(runtimeConfig, null, 2) + '\n');
    console.log(`✅ Generated runtime config: ${configPath}`);
    console.log('Current config values:');
    CONFIG_FIELDS.forEach(field => {
      const value = runtimeConfig[field.key];
      const processEnvValue = process.env[field.envKey];
      const envFileValue = env[field.envKey];
      
      let source = 'default';
      if (processEnvValue) {
        source = `env:${field.envKey}`;
      } else if (envFileValue) {
        source = `.env:${field.envKey}`;
      }
      
      console.log(`  ${field.key}: ${value} (${source})`);
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
