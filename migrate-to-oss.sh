#!/bin/bash
set -euo pipefail

# ============================================================
# 本地文件迁移到 OSS 脚本
# 功能：扫描本地 uploads 目录，上传到 OSS，更新数据库 URL
# 用法：./migrate-to-oss.sh [--dry-run]
#   --dry-run  仅显示将要执行的操作，不实际上传/修改
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
UPLOAD_DIR="$PROJECT_DIR/data/uploads"
ENV_FILE="$PROJECT_DIR/.env"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "[DRY-RUN] 模拟运行，不会实际上传或修改数据"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ===== 本地文件迁移到 OSS 开始 ====="

# ---- 检查 .env ----
if [ ! -f "$ENV_FILE" ]; then
  echo "[ERROR] .env 文件不存在: $ENV_FILE"
  exit 1
fi

source <(grep -E '^OSS_|^STORAGE_TYPE|^FILE_URL_PREFIX|^DATABASE' "$ENV_FILE" | sed 's/^/export /')

if [ "${STORAGE_TYPE:-local}" != "oss" ]; then
  echo "[ERROR] 当前 STORAGE_TYPE 不是 oss，请先在 .env 中设置 STORAGE_TYPE=oss"
  exit 1
fi

if [ -z "${OSS_REGION:-}" ] || [ -z "${OSS_BUCKET:-}" ] || [ -z "${OSS_ACCESS_KEY_ID:-}" ] || [ -z "${OSS_ACCESS_KEY_SECRET:-}" ]; then
  echo "[ERROR] OSS 配置不完整，请检查 .env 中的 OSS_REGION, OSS_BUCKET, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET"
  exit 1
fi

OSS_PREFIX="${FILE_URL_PREFIX:-https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com}"
LOCAL_PREFIX="/api/files"

echo "[INFO] OSS 前缀: $OSS_PREFIX"
echo "[INFO] 本地前缀: $LOCAL_PREFIX"
echo "[INFO] 上传目录: $UPLOAD_DIR"

# ---- 检查本地文件 ----
if [ ! -d "$UPLOAD_DIR" ]; then
  echo "[WARN] 本地上传目录不存在: $UPLOAD_DIR，无需迁移"
  exit 0
fi

FILE_COUNT=$(find "$UPLOAD_DIR" -type f ! -path "*/tmp/*" | wc -l)
echo "[INFO] 发现 $FILE_COUNT 个本地文件"

if [ "$FILE_COUNT" -eq 0 ]; then
  echo "[INFO] 没有需要迁移的文件"
  exit 0
fi

# ---- 上传文件到 OSS ----
echo ""
echo "===== 第1步：上传本地文件到 OSS ====="

UPLOADED=0
FAILED=0
SKIPPED=0

while IFS= read -r -d '' LOCAL_FILE; do
  RELATIVE_PATH="${LOCAL_FILE#$UPLOAD_DIR/}"
  
  if $DRY_RUN; then
    echo "[DRY-RUN] 将上传: $RELATIVE_PATH"
    ((SKIPPED++)) || true
    continue
  fi

  echo -n "[INFO] 上传: $RELATIVE_PATH ... "
  
  RESULT=$(docker run --rm \
    --env-file "$ENV_FILE" \
    -v "${LOCAL_FILE}:/tmp/upload_file:ro" \
    cxwell_project-backend \
    node -e "
      (async () => {
        const OSS = require('ali-oss');
        try {
          const client = new OSS({
            region: process.env.OSS_REGION,
            accessKeyId: process.env.OSS_ACCESS_KEY_ID,
            accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
            bucket: process.env.OSS_BUCKET,
            secure: true,
            timeout: 120000,
          });
          const fs = require('fs');
          const stat = fs.statSync('/tmp/upload_file');
          const ossPath = '${RELATIVE_PATH}';
          if (stat.size > 10 * 1024 * 1024) {
            const stream = fs.createReadStream('/tmp/upload_file');
            await client.multipartUpload(ossPath, stream, {
              headers: { 'x-oss-object-acl': 'public-read' },
              partSize: 5 * 1024 * 1024,
              parallel: 3,
            });
          } else {
            await client.put(ossPath, '/tmp/upload_file', {
              headers: { 'x-oss-object-acl': 'public-read' },
            });
          }
          console.log('OK');
        } catch(e) {
          console.log('ERR:' + e.message);
          process.exit(1);
        }
      })();
    " 2>&1)

  if echo "$RESULT" | grep -q "OK"; then
    echo "✓"
    ((UPLOADED++)) || true
  else
    echo "✗ ($RESULT)"
    ((FAILED++)) || true
  fi

done < <(find "$UPLOAD_DIR" -type f ! -path "*/tmp/*" -print0)

echo ""
echo "[INFO] 上传结果: 成功=$UPLOADED, 失败=$FAILED, 跳过=$SKIPPED"

if [ "$FAILED" -gt 0 ]; then
  echo "[WARN] 有 $FAILED 个文件上传失败，请检查后重试"
  echo "[WARN] 数据库 URL 不会更新，直到所有文件上传成功"
  exit 1
fi

# ---- 更新数据库 URL ----
echo ""
echo "===== 第2步：更新数据库中的文件 URL ====="

DB_CONTAINER="cxwell_db"
DB_USER="${DB_USER:-cxwell_user}"
DB_PASSWORD="${DB_PASSWORD:-cxwell_password}"
DB_NAME="${DB_NAME:-cxwell_db}"

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${DB_CONTAINER}$"; then
  echo "[ERROR] 数据库容器 ${DB_CONTAINER} 未运行"
  exit 1
fi

# 更新 biz_knowledge 表
echo "[INFO] 更新 biz_knowledge 表中的 fileUrl ..."
if $DRY_RUN; then
  echo "[DRY-RUN] 将执行: UPDATE biz_knowledge SET fileUrl = REPLACE(fileUrl, '$LOCAL_PREFIX/', '$OSS_PREFIX/') WHERE fileUrl LIKE '$LOCAL_PREFIX/%'"
else
  docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e \
    "UPDATE biz_knowledge SET fileUrl = REPLACE(fileUrl, '${LOCAL_PREFIX}/', '${OSS_PREFIX}/') WHERE fileUrl LIKE '${LOCAL_PREFIX}/%';" 2>/dev/null
  echo "[INFO] biz_knowledge 更新完成"
fi

# 更新 biz_report_attachment 表（如果存在）
echo "[INFO] 检查并更新 biz_report_attachment 表 ..."
TABLE_EXISTS=$(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sse \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME' AND table_name='biz_report_attachment';" 2>/dev/null)

if [ "$TABLE_EXISTS" -gt 0 ]; then
  if $DRY_RUN; then
    echo "[DRY-RUN] 将执行: UPDATE biz_report_attachment SET fileUrl = REPLACE(fileUrl, '$LOCAL_PREFIX/', '$OSS_PREFIX/') WHERE fileUrl LIKE '$LOCAL_PREFIX/%'"
  else
    docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e \
      "UPDATE biz_report_attachment SET fileUrl = REPLACE(fileUrl, '${LOCAL_PREFIX}/', '${OSS_PREFIX}/') WHERE fileUrl LIKE '${LOCAL_PREFIX}/%';" 2>/dev/null
    echo "[INFO] biz_report_attachment 更新完成"
  fi
fi

echo ""
echo "===== 第3步：验证 ====="

if ! $DRY_RUN; then
  REMAINING_LOCAL=$(docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sse \
    "SELECT COUNT(*) FROM biz_knowledge WHERE fileUrl LIKE '${LOCAL_PREFIX}/%' AND delFlag='0';" 2>/dev/null)
  
  if [ "${REMAINING_LOCAL:-0}" -eq 0 ]; then
    echo "[INFO] ✓ 所有知识库文件的 URL 已指向 OSS"
  else
    echo "[WARN] 仍有 $REMAINING_LOCAL 条知识库记录的 URL 指向本地"
  fi
fi

echo ""
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ===== 迁移完成 ====="

if ! $DRY_RUN; then
  echo ""
  echo "[提示] 迁移成功后，可以安全删除本地文件："
  echo "  rm -rf $UPLOAD_DIR/knowledge $UPLOAD_DIR/uploads $UPLOAD_DIR/reports"
  echo "  (保留 $UPLOAD_DIR/tmp 目录，它是上传临时目录)"
fi
