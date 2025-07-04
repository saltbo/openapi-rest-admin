#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔄 ${description}...`, 'blue');
  try {
    const output = execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} 完成`, 'green');
    return output;
  } catch (error) {
    log(`❌ ${description} 失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

function checkNpmLogin() {
  try {
    execSync('npm whoami', { stdio: 'pipe' });
    log('✅ 已登录 npm', 'green');
  } catch (error) {
    log('❌ 未登录 npm，请先运行: npm login', 'red');
    process.exit(1);
  }
}

function updateVersion(isDryRun = false) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  log(`当前版本: ${packageJson.version}`, 'yellow');
  
  // 获取版本类型，排除 --dry-run 参数
  const args = process.argv.slice(2).filter(arg => arg !== '--dry-run');
  const versionType = args[0] || 'patch';
  
  if (!['major', 'minor', 'patch'].includes(versionType)) {
    log('❌ 版本类型必须是: major, minor, patch', 'red');
    process.exit(1);
  }
  
  if (isDryRun) {
    log(`⚠️  Dry-run 模式，跳过版本更新 (${versionType})`, 'yellow');
  } else {
    runCommand(`npm version ${versionType}`, `更新版本 (${versionType})`);
  }
}

function getRegistry() {
  try {
    const output = execSync('npm config get registry', { encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    return 'https://registry.npmjs.org/';
  }
}

function setRegistry(registryUrl, description) {
  runCommand(`npm config set registry ${registryUrl}`, description);
}

function restoreRegistry(originalRegistry) {
  if (originalRegistry && originalRegistry !== 'https://registry.npmjs.org/') {
    runCommand(`npm config set registry ${originalRegistry}`, '恢复原始 registry');
  }
}

function main() {
  log('🚀 开始 npm 发布流程', 'blue');
  
  const isDryRun = process.argv.includes('--dry-run');
  
  // 保存当前 registry
  const originalRegistry = getRegistry();
  log(`当前 registry: ${originalRegistry}`, 'yellow');
  
  // 检查是否需要切换到官方 registry
  const isUsingMirror = originalRegistry.includes('npmmirror.com') || 
                       originalRegistry.includes('cnpmjs.org') || 
                       originalRegistry.includes('taobao.org');
  
  const publishRegistry = isUsingMirror ? 'https://registry.npmjs.org/' : originalRegistry;
  
  if (isUsingMirror) {
    log('⚠️  检测到使用镜像源，将使用官方 registry 进行发布', 'yellow');
    log(`📡 发布 registry: ${publishRegistry}`, 'blue');
  }
  
  try {
    // 检查是否登录 npm (dry-run 模式跳过)
    if (!isDryRun) {
      // 临时切换到发布 registry 来检查登录状态
      if (isUsingMirror) {
        setRegistry(publishRegistry, '临时切换到官方 npm registry');
      }
      checkNpmLogin();
    } else {
      log('⚠️  Dry-run 模式，跳过 npm 登录检查', 'yellow');
    }
    
    // 更新版本
    updateVersion(isDryRun);
    
    // 清理之前的构建
    runCommand('rm -rf dist', '清理之前的构建');
    
    // 构建项目
    runCommand('npm run build:publish', '构建项目');
    
    // 复制发布用的 README
    if (fs.existsSync('NPM_README.md')) {
      fs.copyFileSync('NPM_README.md', 'dist/README.md');
      log('📄 复制 NPM README', 'blue');
    }
    
    // 检查构建产物
    if (!fs.existsSync('dist/assets')) {
      log('❌ 构建产物不存在: dist/assets', 'red');
      process.exit(1);
    }
    
    const assets = fs.readdirSync('dist/assets');
    const jsFiles = assets.filter(file => file.endsWith('.js'));
    const cssFiles = assets.filter(file => file.endsWith('.css'));
    
    log(`\n📦 构建产物:`, 'yellow');
    log(`  JS 文件: ${jsFiles.length} 个`, 'blue');
    jsFiles.forEach(file => log(`    - ${file}`, 'blue'));
    log(`  CSS 文件: ${cssFiles.length} 个`, 'blue');
    cssFiles.forEach(file => log(`    - ${file}`, 'blue'));
    
    // 发布到 npm，使用 --registry 参数指定发布源
    if (isDryRun) {
      log(`发布时使用 registry: ${publishRegistry}`, 'blue');
      runCommand(`npm publish --dry-run --registry ${publishRegistry}`, '模拟发布 (dry run)');
      log('🎉 模拟发布完成！运行 npm run publish:npm 进行实际发布', 'green');
    } else {
      log(`发布时使用 registry: ${publishRegistry}`, 'blue');
      runCommand(`npm publish --registry ${publishRegistry}`, '发布到 npm');
      log('🎉 发布成功！', 'green');
      
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      log(`📦 包名: ${packageJson.name}`, 'blue');
      log(`🏷️  版本: ${packageJson.version}`, 'blue');
      log(`🔗 安装命令: npm install ${packageJson.name}`, 'yellow');
    }
  } finally {
    // 恢复原始 registry（如果之前切换过）
    if (isUsingMirror && !isDryRun) {
      restoreRegistry(originalRegistry);
      log(`✅ 已恢复原始 registry: ${originalRegistry}`, 'green');
    }
  }
}

main();
