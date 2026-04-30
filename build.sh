#!/bin/bash
set -e

echo "===== cxwell_project Docker 构建脚本 (低资源优化) ====="

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

export DOCKER_BUILDKIT=1

echo ""
echo "[1/3] 构建后端镜像..."
docker compose build --progress=plain --memory=2g backend

echo ""
echo "[2/3] 构建前端镜像..."
docker compose build --progress=plain --memory=2g frontend

echo ""
echo "[3/3] 重启服务..."
docker compose up -d backend frontend

echo ""
echo "===== 构建完成 ====="
docker compose ps
