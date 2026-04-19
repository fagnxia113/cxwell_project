-- ============================================
-- 迁移脚本 002: 里程碑表 + 审批流补全
-- 创建时间: 2026-04-10
-- ============================================

USE `project_mgmt_v3`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 项目里程碑表
-- ============================================
CREATE TABLE IF NOT EXISTS `project_milestones` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `planned_start_date` date DEFAULT NULL,
  `planned_end_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT 0.00 COMMENT '占项目总进度的权重百分比',
  `progress` int DEFAULT 0 COMMENT '里程碑自身完成度 0-100',
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `sort_order` int DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_milestone_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 里程碑资料清单表（项目经理定义应上传哪些资料）
-- ============================================
CREATE TABLE IF NOT EXISTS `milestone_resources` (
  `id` varchar(36) NOT NULL,
  `milestone_id` varchar(36) NOT NULL,
  `resource_name` varchar(200) NOT NULL COMMENT '资料名称，如"施工图纸"',
  `required_count` int DEFAULT 1 COMMENT '要求数量',
  `collected_count` int DEFAULT 0 COMMENT '已收集数量',
  `notes` text DEFAULT NULL,
  `status` enum('incomplete','complete') DEFAULT 'incomplete',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_milestone` (`milestone_id`),
  CONSTRAINT `fk_resource_milestone` FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 里程碑文件表（资料区实际上传的文件）
-- ============================================
CREATE TABLE IF NOT EXISTS `milestone_documents` (
  `id` varchar(36) NOT NULL,
  `milestone_id` varchar(36) NOT NULL,
  `resource_id` varchar(36) DEFAULT NULL COMMENT '关联的资料清单项',
  `file_name` varchar(500) NOT NULL,
  `file_path` varchar(1000) NOT NULL,
  `file_size` bigint DEFAULT 0,
  `file_type` varchar(100) DEFAULT NULL,
  `uploaded_by` varchar(36) DEFAULT NULL,
  `uploaded_by_name` varchar(100) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_milestone` (`milestone_id`),
  KEY `idx_resource` (`resource_id`),
  CONSTRAINT `fk_doc_milestone` FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 考勤记录表增加来源和第三方关联字段
-- ============================================
ALTER TABLE `attendance_records`
  ADD COLUMN `source` varchar(20) DEFAULT 'manual' COMMENT '数据来源: wecom/manual',
  ADD COLUMN `third_party_id` varchar(100) DEFAULT NULL COMMENT '第三方打卡记录ID，去重用',
  ADD COLUMN `location_name` varchar(200) DEFAULT NULL COMMENT '打卡地点名称',
  ADD COLUMN `exception_type` varchar(100) DEFAULT NULL COMMENT '异常类型',
  ADD UNIQUE KEY `uk_third_party` (`third_party_id`);

-- ============================================
-- 系统配置表（用于存储SMTP等动态配置）
-- ============================================
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

-- ============================================
-- 新增审批流工作流定义
-- ============================================

-- 里程碑结项审批
INSERT INTO `workflow_definitions` (`id`, `key`, `name`, `version`, `category`, `node_config`, `status`) VALUES
('wf-milestone-completion-001', 'milestone_completion', '里程碑结项审批', 1, 'project', 
 '{"nodes":[{"id":"start","name":"提交结项申请","type":"startEvent"},{"id":"admin_approve","name":"管理员审批","type":"userTask"},{"id":"complete_milestone","name":"结项处理","type":"serviceTask","config":{"serviceType":"completeMilestone"}},{"id":"end_approved","name":"结项通过","type":"endEvent"},{"id":"end_rejected","name":"结项驳回","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"admin_approve"},{"id":"e2","source":"admin_approve","target":"complete_milestone","condition":"${action === \\"approve\\"}"},{"id":"e3","source":"admin_approve","target":"end_rejected","condition":"${action === \\"reject\\"}"},{"id":"e4","source":"complete_milestone","target":"end_approved"}]}', 
 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 项目结项审批
INSERT INTO `workflow_definitions` (`id`, `key`, `name`, `version`, `category`, `node_config`, `status`) VALUES
('wf-project-completion-001', 'project_completion', '项目结项审批', 1, 'project', 
 '{"nodes":[{"id":"start","name":"提交结项申请","type":"startEvent"},{"id":"admin_approve","name":"管理员审批","type":"userTask"},{"id":"complete_project","name":"结项处理","type":"serviceTask","config":{"serviceType":"completeProject"}},{"id":"end_approved","name":"结项通过","type":"endEvent"},{"id":"end_rejected","name":"结项驳回","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"admin_approve"},{"id":"e2","source":"admin_approve","target":"complete_project","condition":"${action === \\"approve\\"}"},{"id":"e3","source":"admin_approve","target":"end_rejected","condition":"${action === \\"reject\\"}"},{"id":"e4","source":"complete_project","target":"end_approved"}]}', 
 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 人员项目调拨审批
INSERT INTO `workflow_definitions` (`id`, `key`, `name`, `version`, `category`, `node_config`, `status`) VALUES
('wf-personnel-transfer-001', 'personnel_project_transfer', '人员项目调拨审批', 1, 'personnel', 
 '{"nodes":[{"id":"start","name":"提交调拨申请","type":"startEvent"},{"id":"admin_approve","name":"管理员审批","type":"userTask"},{"id":"do_transfer","name":"执行调拨","type":"serviceTask","config":{"serviceType":"transferProjectPersonnel"}},{"id":"end_approved","name":"调拨完成","type":"endEvent"},{"id":"end_rejected","name":"调拨驳回","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"admin_approve"},{"id":"e2","source":"admin_approve","target":"do_transfer","condition":"${action === \\"approve\\"}"},{"id":"e3","source":"admin_approve","target":"end_rejected","condition":"${action === \\"reject\\"}"},{"id":"e4","source":"do_transfer","target":"end_approved"}]}', 
 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

SET FOREIGN_KEY_CHECKS = 1;

SELECT '迁移 002 完成: 里程碑表+审批流定义' AS message;
