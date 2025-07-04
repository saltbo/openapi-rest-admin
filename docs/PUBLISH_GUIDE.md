# NPM 发布指南

## 可用的命令

### 1. 模拟发布（推荐先使用）
```bash
npm run publish:dry-run
```
这个命令会模拟整个发布过程，但不会真正发布到 npm。用于检查一切是否正常。

### 2. 发布新的补丁版本（默认）
```bash
npm run publish:npm
# 或者
npm run publish:patch
```
这会增加版本号的最后一位（如 1.0.0 -> 1.0.1）

### 3. 发布新的次要版本
```bash
npm run publish:minor
```
这会增加版本号的中间一位（如 1.0.0 -> 1.1.0）

### 4. 发布新的主要版本
```bash
npm run publish:major  
```
这会增加版本号的第一位（如 1.0.0 -> 2.0.0）

## 发布前准备

1. **登录 npm**
   ```bash
   npm login
   ```

2. **检查包名是否可用**
   ```bash
   npm view openapi-rest-admin
   ```
   如果包名已存在，你需要在 package.json 中修改包名。

3. **更新包信息**
   编辑 package.json 中的以下字段：
   - `author`: 你的名字
   - `repository.url`: 你的 Git 仓库地址
   - `description`: 包描述

## 发布流程

脚本会自动执行以下步骤：

1. ✅ 检查 npm 登录状态
2. � 检测当前 registry（自动处理镜像源）
3. �🔄 更新版本号
4. 🧹 清理之前的构建
5. 🔨 构建项目（standalone 模式）
6. 📄 复制文档文件
7. 📦 发布到 npm（自动使用官方源）

## Registry 自动处理

脚本会智能处理不同的 npm registry 配置：

- **检测镜像源**: 自动识别 npmmirror.com、cnpmjs.org、taobao.org 等镜像
- **自动切换**: 发布时自动使用官方 npm registry (`https://registry.npmjs.org/`)
- **保持配置**: 发布完成后保持你的本地 registry 配置不变
- **无需手动**: 不需要手动切换 registry，脚本会处理一切

这意味着你可以继续使用国内镜像加速下载，同时正常发布包到官方 npm。

## 发布后

包发布成功后，其他人可以这样安装：

```bash
npm install openapi-rest-admin
```

然后在他们的项目中使用构建好的 JS 和 CSS 文件。

## 注意事项

- 确保在发布前测试构建是否成功
- 版本号一旦发布就不能修改，只能发布新版本
- 使用 `publish:dry-run` 可以预览将要发布的内容
- 包会包含 `dist/assets/` 目录中的所有构建文件
