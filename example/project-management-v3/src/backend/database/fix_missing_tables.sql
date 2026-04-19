-- ============================================
-- 补全缺失表和字段的临时脚本 (修正转义)
-- ============================================

USE `project_mgmt_v3`;

-- 1. 系统配置表
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` varchar(36) NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` text DEFAULT NULL,
  `description` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 项目里程碑表
CREATE TABLE IF NOT EXISTS `project_milestones` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `planned_start_date` date DEFAULT NULL,
  `planned_end_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT 0.00,
  `progress` int DEFAULT 0,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `sort_order` int DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  CONSTRAINT `fk_milestone_project_fix_v2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 里程碑资料清单表
CREATE TABLE IF NOT EXISTS `milestone_resources` (
  `id` varchar(36) NOT NULL,
  `milestone_id` varchar(36) NOT NULL,
  `resource_name` varchar(200) NOT NULL,
  `required_count` int DEFAULT 1,
  `collected_count` int DEFAULT 0,
  `status` enum('incomplete','complete') DEFAULT 'incomplete',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_milestone` (`milestone_id`),
  CONSTRAINT `fk_resource_milestone_fix_v2` FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 里程碑文件表
CREATE TABLE IF NOT EXISTS `milestone_documents` (
  `id` varchar(36) NOT NULL,
  `milestone_id` varchar(36) NOT NULL,
  `resource_id` varchar(36) DEFAULT NULL,
  `file_name` varchar(500) NOT NULL,
  `file_path` varchar(1000) NOT NULL,
  `file_size` bigint DEFAULT 0,
  `uploaded_by` varchar(36) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_milestone` (`milestone_id`),
  CONSTRAINT `fk_doc_milestone_fix_v2` FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 补全员工表字段
SET @dbname = DATABASE();
SET @tablename = 'employees';

SET @columnname = 'third_party_id';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE employees ADD COLUMN third_party_id varchar(100) DEFAULT NULL'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @columnname = 'third_party_source';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE employees ADD COLUMN third_party_source varchar(50) DEFAULT NULL'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. 插入或更新工作流定义 (使用双斜杠转义引号)
INSERT INTO `workflow_definitions` (`id`, `key`, `name`, `version`, `category`, `node_config`, `status`) VALUES
('wf-milestone-completion-001', 'milestone_completion', '里程碑结项审批', 1, 'project', 
 '{"nodes":[{"id":"start","name":"提交结项申请","type":"startEvent"},{"id":"admin_approve","name":"管理员审批","type":"userTask"},{"id":"complete_milestone","name":"结项处理","type":"serviceTask","config":{"serviceType":"completeMilestone"}},{"id":"end_approved","name":"结项通过","type":"endEvent"},{"id":"end_rejected","name":"结项驳回","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"admin_approve"},{"id":"e2","source":"admin_approve","target":"complete_milestone","condition":"${action === \\"approve\\"}"},{"id":"e3","source":"admin_approve","target":"end_rejected","condition":"${action === \\"reject\\"}"},{"id":"e4","source":"complete_milestone","target":"end_approved"}]}', 
 'active'),
('wf-project-completion-001', 'project_completion', '项目结项审批', 1, 'project', 
 '{"nodes":[{"id":"start","name":"提交结项申请","type":"startEvent"},{"id":"admin_approve","name":"管理员审批","type":"userTask"},{"id":"complete_project","name":"结项处理","type":"serviceTask","config":{"serviceType":"completeProject"}},{"id":"end_approved","name":"结项通过","type":"endEvent"},{"id":"end_rejected","name":"结项驳回","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"admin_approve"},{"id":"e2","source":"admin_approve","target":"complete_project","condition":"${action === \\"approve\\"}"},{"id":"e3","source":"admin_approve","target":"end_rejected","condition":"${action === \\"reject\\"}"},{"id":"e4","source":"complete_project","target":"end_approved"}]}', 
 'active'),
('wf-personnel-transfer-001', 'personnel_project_transfer', '人员项目调拨审批', 1, 'personnel', 
 '{"nodes":[{"id":"start","name":"提交调拨申请","type":"startEvent"},{"id":"admin_approve","name":"管理员审批","type":"userTask"},{"id":"do_transfer","name":"执行调拨","type":"serviceTask","config":{"serviceType":"transferProjectPersonnel"}},{"id":"end_approved","name":"调拨完成","type":"endEvent"},{"id":"end_rejected","name":"调拨驳回","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"admin_approve"},{"id":"e2","source":"admin_approve","target":"do_transfer","condition":"${action === \\"approve\\"}"},{"id":"e3","source":"admin_approve","target":"end_rejected","condition":"${action === \\"reject\\"}"},{"id":"e4","source":"do_transfer","target":"end_approved"}]}', 
 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
