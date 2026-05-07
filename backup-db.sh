#!/bin/bash
set -euo pipefail

# ============================================================
# cxwell_project 数据库备份脚本
# 功能：mysqldump → gzip → 本地保留7天 → 上传 OSS
# 用法：手动 ./backup-db.sh 或 cron 定时执行
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$PROJECT_DIR/data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="cxwell_db_${TIMESTAMP}.sql.gz"
OSS_BACKUP_PATH="backups/db/${BACKUP_FILE}"

DB_CONTAINER="cxwell_db"
DB_USER="cxwell_user"
DB_PASSWORD="cxwell_password"
DB_NAME="cxwell_db"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ===== 数据库备份开始 ====="

mkdir -p "$BACKUP_DIR"

# ---- 检查数据库容器 ----
if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${DB_CONTAINER}$"; then
  echo "[ERROR] 数据库容器 ${DB_CONTAINER} 未运行"
  exit 1
fi

# ---- mysqldump + gzip ----
echo "[INFO] 导出数据库 ${DB_NAME} ..."
docker exec "$DB_CONTAINER" mysqldump \
  -u"$DB_USER" -p"$DB_PASSWORD" \
  --single-transaction --quick --routines --triggers --events \
  "$DB_NAME" 2>/dev/null | gzip > "$BACKUP_DIR/$BACKUP_FILE"

echo "[INFO] 本地备份: ${BACKUP_FILE} ($(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1))"

# ---- 上传到 OSS（通过 Docker 容器内的 ali-oss） ----
if [ -f "$PROJECT_DIR/.env" ] && grep -q "OSS_ACCESS_KEY_ID" "$PROJECT_DIR/.env" 2>/dev/null; then
  echo "[INFO] 上传到 OSS ${OSS_BACKUP_PATH} ..."
  
  docker run --rm \
    --env-file "$PROJECT_DIR/.env" \
    -v "${BACKUP_DIR}/${BACKUP_FILE}:/tmp/backup.sql.gz:ro" \
    cxwell_project-backend \
    node -e "
      (async () => {
        const OSS = require('ali-oss');
        try {
          const client = new OSS({
            region: process.env.OSS_REGION || 'oss-cn-beijing',
            accessKeyId: process.env.OSS_ACCESS_KEY_ID,
            accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
            bucket: process.env.OSS_BUCKET || 'cxwell-files',
            internal: process.env.OSS_INTERNAL !== 'false',
            secure: true,
          });
          await client.put('${OSS_BACKUP_PATH}', '/tmp/backup.sql.gz', {
            headers: { 'x-oss-object-acl': 'private' },
          });
          console.log('OSS_UPLOAD_OK');
        } catch(e) {
          console.log('OSS_UPLOAD_ERR:' + e.message);
          process.exit(1);
        }
      })();
    " 2>&1
  
  if [ $? -eq 0 ]; then
    echo "[INFO] OSS 上传成功"
  else
    echo "[WARN] OSS 上传失败，本地备份已保留"
  fi
else
  echo "[WARN] 未配置 OSS，跳过远程备份"
fi

# ---- 清理 7 天前的本地备份 ----
find "$BACKUP_DIR" -name "cxwell_db_*.sql.gz" -mtime +7 -delete 2>/dev/null || true

echo "[INFO] 本地备份数量: $(find "$BACKUP_DIR" -name 'cxwell_db_*.sql.gz' | wc -l)"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ===== 备份完成 ====="
