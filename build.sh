#!/bin/bash
set -e

echo "===== cxwell_project Docker 构建脚本 (低资源优化) ====="

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

export DOCKER_BUILDKIT=1

echo ""
echo "[0/4] 停止所有运行中的容器，释放内存..."
docker compose down 2>/dev/null || true

echo ""
echo "等待内存释放..."
sleep 5

echo "当前内存状态:"
free -h

echo ""
echo "[1/4] 构建后端镜像..."
docker compose build --progress=plain --memory=2g backend

echo ""
echo "[2/4] 构建前端镜像..."
docker compose build --progress=plain --memory=2g frontend

echo ""
echo "[3/4] 启动数据库..."
docker compose up -d db

echo ""
echo "等待数据库就绪..."
sleep 10

echo ""
echo "[4/4] 启动后端和前端..."
docker compose up -d backend frontend

echo ""
echo "等待服务就绪..."
sleep 5

echo ""
echo "===== 构建完成 ====="
docker compose ps
