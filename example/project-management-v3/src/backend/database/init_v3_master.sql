-- ============================================
-- 项目管理系统 V3 - 全量期初初始化脚本 (Full-Fidelity Master)
-- 版本: 2026-04-18 Master Final Audited
-- 说明: 100% 还原 Prisma Schema 中的所有模型与逻辑
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- 创建并使用数据库
CREATE DATABASE IF NOT EXISTS `project_mgmt_v3` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `project_mgmt_v3`;

-- ============================================
-- 1. 系统与架构 (Infrastructure & RBAC)
-- ============================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'user',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `is_system` tinyint(1) DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `level` int DEFAULT '0',
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `permissions` (
  `id` varchar(36) NOT NULL,
  `code` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `resource` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `type` enum('menu','button','api') DEFAULT 'button',
  `parent_id` varchar(36) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` varchar(36) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `permission_id` varchar(36) NOT NULL,
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_perm` (`role_id`,`permission_id`),
  CONSTRAINT `fk_role_perm_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_perm_perm` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `field_permissions` (
  `id` varchar(36) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `field_name` varchar(50) NOT NULL,
  `can_view` tinyint(1) DEFAULT '1',
  `can_edit` tinyint(1) DEFAULT '1',
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_field` (`role_id`,`entity_type`,`field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. 组织与人员 (Org & People)
-- ============================================

CREATE TABLE IF NOT EXISTS `departments` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `parent_id` varchar(36) DEFAULT NULL,
  `level` int DEFAULT '1',
  `path` varchar(500) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `employees` (
  `id` varchar(36) NOT NULL,
  `employee_no` varchar(50) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `department_id` varchar(36) DEFAULT NULL,
  `position` varchar(100) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `status` enum('active','resigned','probation') DEFAULT 'active',
  `hire_date` date NOT NULL,
  `third_party_id` varchar(100) DEFAULT NULL,
  `third_party_source` varchar(50) DEFAULT NULL,
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_no` (`employee_no`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. 项目与业务 (Projects & Business)
-- ============================================

CREATE TABLE IF NOT EXISTS `projects` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `status` enum('proposal','in_progress','completed','paused','delayed') DEFAULT 'proposal',
  `progress` int DEFAULT '0',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT '0.00',
  `manager_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project_members` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('owner','manager','member','viewer') DEFAULT 'member',
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_user` (`project_id`,`user_id`),
  CONSTRAINT `fk_pm_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project_milestones` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `planned_end_date` date NOT NULL,
  `status` enum('pending','in_progress','completed') DEFAULT 'pending',
  `weight` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_milestone_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `name` varchar(300) NOT NULL,
  `status` enum('unassigned','pending_confirm','accepted','in_progress','completed','closed') DEFAULT 'unassigned',
  `planned_start_date` date NOT NULL,
  `planned_end_date` date NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_task_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. 资产管理 (Equipment & Warehouse)
-- ============================================

CREATE TABLE IF NOT EXISTS `warehouses` (
  `id` varchar(36) NOT NULL,
  `warehouse_no` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `warehouse_no` (`warehouse_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `equipment_instances` (
  `id` varchar(36) NOT NULL,
  `manage_code` varchar(50) NOT NULL,
  `equipment_name` varchar(200) NOT NULL,
  `category` enum('instrument','fake_load','cable','accessory') NOT NULL,
  `location_id` varchar(36) DEFAULT NULL,
  `usage_status` enum('idle','in_use','scrapped','sold') DEFAULT 'idle',
  PRIMARY KEY (`id`),
  UNIQUE KEY `manage_code` (`manage_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `equipment_accessories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `equipment_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. 流程引擎 (Workflow Engine)
-- ============================================

CREATE TABLE IF NOT EXISTS `workflow_definitions` (
  `id` varchar(36) NOT NULL,
  `key` varchar(100) NOT NULL,
  `name` varchar(200) NOT NULL,
  `version` int DEFAULT '1',
  `status` enum('draft','active','suspended','archived') DEFAULT 'draft',
  `node_config` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key_version` (`key`,`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workflow_instances` (
  `id` varchar(36) NOT NULL,
  `definition_id` varchar(36) NOT NULL,
  `status` enum('running','suspended','completed','terminated','rejected') DEFAULT 'running',
  `initiator_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workflow_tasks` (
  `id` varchar(36) NOT NULL,
  `instance_id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `status` enum('created','assigned','in_progress','completed','cancelled') DEFAULT 'created',
  `assignee_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_wf_task_instance` FOREIGN KEY (`instance_id`) REFERENCES `workflow_instances` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workflow_executions` (
  `id` varchar(36) NOT NULL,
  `instance_id` varchar(36) NOT NULL,
  `node_id` varchar(100) NOT NULL,
  `status` enum('active','completed','cancelled') DEFAULT 'active',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_wf_exec_instance` FOREIGN KEY (`instance_id`) REFERENCES `workflow_instances` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. 其它模块 (Knowledge, Rotation, Sync)
-- ============================================

CREATE TABLE IF NOT EXISTS `knowledge_base_items` (
  `id` varchar(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `type` varchar(20) NOT NULL,
  `author` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `is_mandatory` tinyint(1) DEFAULT '0',
  `url` varchar(500) DEFAULT NULL,
  `project_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` timestamp(0) DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  `is_folder` tinyint(1) DEFAULT '0',
  `parent_id` varchar(36) DEFAULT NULL,
  `creator_id` varchar(36) DEFAULT NULL,
  `visibility_type` enum('everyone','private','specified') DEFAULT 'everyone',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `knowledge_item_permissions` (
  `id` varchar(36) NOT NULL,
  `item_id` varchar(36) NOT NULL,
  `target_type` varchar(20) NOT NULL, -- 'department', 'position', 'user'
  `target_id` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_target` (`target_type`, `target_id`),
  CONSTRAINT `fk_know_perm_item` FOREIGN KEY (`item_id`) REFERENCES `knowledge_base_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `personnel_rotation_plans` (
  `id` varchar(36) NOT NULL,
  `employee_id` varchar(36) NOT NULL,
  `year_month` varchar(7) NOT NULL,
  `schedule_data` json NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_month` (`employee_id`,`year_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. 种子数据 (Metadata Seeds)
-- ============================================

INSERT IGNORE INTO `roles` (`id`, `code`, `name`, `level`, `is_system`, `status`) VALUES
('role-000', 'super_admin', '超级管理员', 0, 1, 'active'),
('role-001', 'admin', '管理员', 1, 1, 'active'),
('role-002', 'project_manager', '项目经理', 2, 1, 'active'),
('role-003', 'employee', '普通员工', 3, 1, 'active');

INSERT IGNORE INTO `permissions` (`id`, `code`, `name`, `type`, `sort_order`, `module`, `resource`, `action`) VALUES
('menu-001', 'menu:dashboard', '仪表盘', 'menu', 1, 'dashboard', 'menu', 'view'),
('menu-002', 'menu:project', '项目管理', 'menu', 2, 'project', 'menu', 'view'),
('menu-003', 'menu:workflow', '审批中心', 'menu', 3, 'workflow', 'menu', 'view'),
('menu-004', 'menu:personnel', '人员管理', 'menu', 4, 'personnel', 'menu', 'view'),
('menu-005', 'menu:equipment', '资产管理', 'menu', 5, 'equipment', 'menu', 'view'),
('menu-006', 'menu:organization', '组织架构', 'menu', 6, 'organization', 'menu', 'view'),
('menu-007', 'menu:knowledge', '知识库', 'menu', 7, 'knowledge', 'menu', 'view'),
('menu-008', 'menu:admin', '系统管理', 'menu', 8, 'admin', 'menu', 'view');

-- 固定 Admin 账号 (123456)
INSERT IGNORE INTO `users` (`id`, `username`, `password`, `name`, `role`, `status`) VALUES
('user-admin-001', 'admin', '$2b$10$nKQkVqOgqoZqfj9B3D/CEumepwF5HOonLqKqOqwI5bdF7viORYceO', '系统管理员', 'admin', 'active');

INSERT IGNORE INTO `user_roles` (`id`, `user_id`, `role_id`) VALUES
('ur-001', 'user-admin-001', 'role-000');

-- 全量权限绑定 (演示用)
INSERT IGNORE INTO `role_permissions` (`id`, `role_id`, `permission_id`)
SELECT UUID(), 'role-000', id FROM permissions;

SET FOREIGN_KEY_CHECKS = 1;
