#!/bin/bash

# 简单REST服务器启动脚本

echo "🚀 启动Simple REST Server..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 检查安装是否成功
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 启动服务器
echo "🎯 启动服务器..."
npm start
