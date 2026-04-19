-- CreateTable
CREATE TABLE "biz_knowledge" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Document',
    "content" TEXT,
    "file_url" TEXT,
    "is_folder" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" BIGINT,
    "visibility_type" TEXT NOT NULL DEFAULT 'everyone',
    "created_by" BIGINT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "del_flag" TEXT NOT NULL DEFAULT '0',
    CONSTRAINT "biz_knowledge_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "biz_knowledge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biz_knowledge_permission" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "knowledge_id" BIGINT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" BIGINT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "biz_knowledge_permission_knowledge_id_fkey" FOREIGN KEY ("knowledge_id") REFERENCES "biz_knowledge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "biz_knowledge_parent_id_idx" ON "biz_knowledge"("parent_id");

-- CreateIndex
CREATE INDEX "biz_knowledge_created_by_idx" ON "biz_knowledge"("created_by");

-- CreateIndex
CREATE INDEX "biz_knowledge_permission_knowledge_id_idx" ON "biz_knowledge_permission"("knowledge_id");

-- CreateIndex
CREATE INDEX "biz_knowledge_permission_target_type_target_id_idx" ON "biz_knowledge_permission"("target_type", "target_id");
