-- ============================================
-- 项目管理系统 V3 完整数据库初始化脚本
-- 数据库名称: project_mgmt_v3
-- 创建时间: 2026-03-17
-- 说明: 这是一个完全独立的新数据库
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `project_mgmt_v3` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `project_mgmt_v3`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 核心用户表
-- ============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('admin','project_manager','hr_manager','equipment_manager','implementer','user') DEFAULT 'user',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 组织架构表
-- ============================================
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `parent_id` varchar(36) DEFAULT NULL,
  `manager_id` varchar(36) DEFAULT NULL,
  `manager_name` varchar(100) DEFAULT NULL,
  `level` int DEFAULT '1',
  `path` varchar(500) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `status` enum('active','inactive') DEFAULT 'active',
  `description` text,
  `third_party_id` varchar(100) DEFAULT NULL,
  `third_party_source` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_parent` (`parent_id`),
  KEY `idx_manager` (`manager_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_dept_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `positions`;
CREATE TABLE `positions` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `department_id` varchar(36) DEFAULT NULL,
  `department_name` varchar(100) DEFAULT NULL,
  `level` int DEFAULT '1',
  `category` varchar(50) DEFAULT 'technical',
  `description` text,
  `requirements` text,
  `responsibilities` text,
  `status` enum('active','inactive') DEFAULT 'active',
  `sort_order` int DEFAULT '0',
  `third_party_id` varchar(100) DEFAULT NULL,
  `third_party_source` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_department` (`department_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 员工表
-- ============================================
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
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
  `current_status` enum('on_duty','leave','business_trip','other') DEFAULT 'on_duty',
  `hire_date` date NOT NULL,
  `leave_date` date DEFAULT NULL,
  `role` enum('admin','project_manager','hr_manager','equipment_manager','implementer','user') DEFAULT 'user',
  `daily_cost` decimal(10,2) DEFAULT NULL,
  `skills` json DEFAULT NULL,
  `avatar_color` varchar(20) DEFAULT NULL,
  `data_permission` enum('self','department','all') DEFAULT 'self',
  `employee_type` enum('full_time','part_time','outsourced') DEFAULT 'full_time',
  `third_party_id` varchar(100) DEFAULT NULL,
  `third_party_source` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_no` (`employee_no`),
  KEY `idx_dept` (`department_id`),
  KEY `idx_employees_department_status` (`department_id`,`status`),
  KEY `idx_employees_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 仓库表
-- ============================================
DROP TABLE IF EXISTS `warehouses`;
CREATE TABLE `warehouses` (
  `id` varchar(36) NOT NULL,
  `warehouse_no` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `type` enum('main','branch','project') DEFAULT 'main',
  `location` varchar(200) DEFAULT NULL,
  `address` text,
  `manager_id` varchar(36) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `warehouse_no` (`warehouse_no`),
  KEY `idx_manager` (`manager_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 客户表
-- ============================================
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` varchar(36) NOT NULL,
  `customer_no` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `contact` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `type` enum('enterprise','government','individual') DEFAULT 'enterprise',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_no` (`customer_no`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 项目表
-- ============================================
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `type` enum('domestic','overseas') DEFAULT 'domestic',
  `customer_id` varchar(36) DEFAULT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `manager_id` varchar(36) DEFAULT NULL,
  `manager` varchar(100) DEFAULT NULL,
  `technical_lead_id` varchar(36) DEFAULT NULL,
  `status` enum('proposal','in_progress','completed','paused','delayed') DEFAULT 'proposal',
  `progress` int DEFAULT '0',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT '0.00',
  `country` varchar(50) DEFAULT '中国',
  `address` text,
  `description` text,
  `attachments` text,
  `organization_id` varchar(36) DEFAULT NULL,
  `approval_mode` varchar(50) DEFAULT 'workflow',
  `phase` varchar(50) DEFAULT NULL,
  `phase_start_date` date DEFAULT NULL,
  `phase_end_date` date DEFAULT NULL,
  `estimated_days` int DEFAULT '0',
  `remaining_days` int DEFAULT '0',
  `area` decimal(10,2) DEFAULT '0.00',
  `capacity` decimal(10,2) DEFAULT '0.00',
  `rack_count` int DEFAULT '0',
  `rack_power` decimal(5,2) DEFAULT '0.00',
  `power_arch` text,
  `hvac_arch` text,
  `fire_arch` text,
  `weak_arch` text,
  `building_area` decimal(10,2) DEFAULT NULL,
  `it_capacity` decimal(10,2) DEFAULT NULL,
  `cabinet_count` int DEFAULT NULL,
  `cabinet_power` decimal(10,2) DEFAULT NULL,
  `power_architecture` text,
  `hvac_architecture` text,
  `fire_architecture` text,
  `weak_electric_architecture` text,
  `end_customer` varchar(200) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_projects_country` (`country`),
  KEY `idx_projects_customer` (`customer_id`),
  KEY `idx_projects_manager` (`manager_id`),
  KEY `idx_projects_status_start_date` (`status`,`start_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 工作流引擎表
-- ============================================
DROP TABLE IF EXISTS `workflow_definitions`;
CREATE TABLE `workflow_definitions` (
  `id` varchar(36) NOT NULL,
  `key` varchar(100) NOT NULL,
  `name` varchar(200) NOT NULL,
  `version` int NOT NULL DEFAULT 1,
  `category` varchar(50) DEFAULT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `bpmn_xml` mediumtext,
  `node_config` json DEFAULT NULL,
  `form_schema` json DEFAULT NULL,
  `variables` json DEFAULT NULL,
  `status` enum('draft','active','suspended','archived') DEFAULT 'draft',
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `form_template_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_key` (`key`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_form_template_id` (`form_template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `workflow_instances`;
CREATE TABLE `workflow_instances` (
  `id` varchar(36) NOT NULL,
  `definition_id` varchar(36) NOT NULL,
  `definition_key` varchar(100) NOT NULL,
  `definition_version` int NOT NULL,
  `business_key` varchar(100) DEFAULT NULL,
  `business_id` varchar(36) DEFAULT NULL,
  `title` varchar(300) DEFAULT NULL,
  `initiator_id` varchar(36) DEFAULT NULL,
  `initiator_name` varchar(100) DEFAULT NULL,
  `variables` json DEFAULT NULL,
  `status` enum('running','suspended','completed','terminated') DEFAULT 'running',
  `current_node` varchar(100) DEFAULT NULL,
  `current_node_id` varchar(100) DEFAULT NULL,
  `current_node_name` varchar(200) DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL,
  `duration` bigint DEFAULT NULL,
  `result` enum('approved','rejected','withdrawn','terminated') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_definition` (`definition_id`),
  KEY `idx_business_key` (`business_key`),
  KEY `idx_initiator` (`initiator_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `workflow_tasks`;
CREATE TABLE `workflow_tasks` (
  `id` varchar(36) NOT NULL,
  `instance_id` varchar(36) NOT NULL,
  `execution_id` varchar(36) DEFAULT NULL,
  `node_id` varchar(100) NOT NULL,
  `task_def_key` varchar(100) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `assignee_id` varchar(36) DEFAULT NULL,
  `assignee_name` varchar(100) DEFAULT NULL,
  `candidate_users` json DEFAULT NULL,
  `candidate_groups` json DEFAULT NULL,
  `priority` int DEFAULT 50,
  `due_date` timestamp NULL DEFAULT NULL,
  `claim_time` timestamp NULL DEFAULT NULL,
  `variables` json DEFAULT NULL,
  `status` enum('created','assigned','in_progress','completed','cancelled') DEFAULT 'created',
  `approval_mode` varchar(20) DEFAULT 'or_sign',
  `vote_threshold` int DEFAULT 1,
  `delegated_from` varchar(36) DEFAULT NULL,
  `result` enum('approved','rejected','withdrawn','delegated','transferred','skipped') DEFAULT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `duration` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_instance` (`instance_id`),
  KEY `idx_assignee` (`assignee_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `workflow_executions`;
CREATE TABLE `workflow_executions` (
  `id` varchar(36) NOT NULL,
  `instance_id` varchar(36) NOT NULL,
  `parent_id` varchar(36) DEFAULT NULL,
  `node_id` varchar(100) NOT NULL,
  `node_name` varchar(200) DEFAULT NULL,
  `node_type` varchar(50) DEFAULT NULL,
  `variables` json DEFAULT NULL,
  `status` enum('active','completed','cancelled') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_instance` (`instance_id`),
  KEY `idx_node` (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `workflow_locks`;
CREATE TABLE `workflow_locks` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `lock_key` VARCHAR(200) NOT NULL,
  `owner` VARCHAR(100) NOT NULL,
  `acquired_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  INDEX `idx_workflow_locks_key_expires` (`lock_key`, `expires_at`),
  INDEX `idx_workflow_locks_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `workflow_task_history`;
CREATE TABLE `workflow_task_history` (
  `id` varchar(36) NOT NULL,
  `task_id` varchar(36) NOT NULL,
  `instance_id` varchar(36) NOT NULL,
  `node_id` varchar(100) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `operator_id` varchar(36) DEFAULT NULL,
  `operator_name` varchar(100) DEFAULT NULL,
  `result` varchar(20) DEFAULT NULL,
  `comment` text,
  `variables` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task` (`task_id`),
  KEY `idx_instance` (`instance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `workflow_approver_rules`;
CREATE TABLE `workflow_approver_rules` (
  `id` varchar(36) NOT NULL,
  `workflow_key` varchar(100) NOT NULL,
  `node_id` varchar(100) DEFAULT NULL,
  `rule_type` varchar(50) NOT NULL,
  `rule_config` json NOT NULL,
  `priority` int DEFAULT 0,
  `enabled` tinyint DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_workflow` (`workflow_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 表单模板表
-- ============================================
DROP TABLE IF EXISTS `form_templates`;
CREATE TABLE `form_templates` (
  `id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `key` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `fields` json NOT NULL,
  `layout` json DEFAULT NULL,
  `sections` json DEFAULT NULL,
  `style` json DEFAULT NULL,
  `version` int DEFAULT 1,
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 设备管理表
-- ============================================
DROP TABLE IF EXISTS `equipment_instances`;
CREATE TABLE `equipment_instances` (
  `id` varchar(36) NOT NULL,
  `manage_code` varchar(50) DEFAULT NULL,
  `equipment_name` varchar(200) NOT NULL,
  `model_no` varchar(100) NOT NULL,
  `category` enum('instrument','fake_load','cable','accessory') NOT NULL,
  `manufacturer` varchar(200) DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `factory_serial_no` varchar(100) DEFAULT NULL,
  `tracking_type` enum('SERIALIZED','BATCH') DEFAULT 'SERIALIZED',
  `quantity` int DEFAULT '1',
  `unit` varchar(20) DEFAULT '台',
  `location_id` varchar(36) DEFAULT NULL,
  `location_status` enum('warehouse','in_project','in_transit','maintenance','scrapped') DEFAULT 'warehouse',
  `health_status` enum('normal','affected','broken','scrapped') DEFAULT 'normal',
  `usage_status` enum('idle','in_use','lost','scrapped','sold') DEFAULT 'idle',
  `keeper_id` varchar(36) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_price` decimal(12,2) DEFAULT NULL,
  `calibration_expiry` date DEFAULT NULL,
  `certificate_no` varchar(100) DEFAULT NULL,
  `certificate_issuer` varchar(200) DEFAULT NULL,
  `supplier` varchar(200) DEFAULT NULL,
  `technical_params` text,
  `technical_doc` text,
  `attachment` varchar(500) DEFAULT NULL,
  `attachments` json DEFAULT NULL,
  `notes` text,
  `has_accessories` tinyint(1) DEFAULT '0',
  `accessory_count` int DEFAULT '0',
  `version` int NOT NULL DEFAULT '1',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `manage_code` (`manage_code`),
  KEY `idx_equipment` (`equipment_name`,`model_no`),
  KEY `idx_equipment_tracking_type` (`tracking_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `equipment_inbound_orders`;
CREATE TABLE `equipment_inbound_orders` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `type` varchar(20) DEFAULT 'purchase',
  `warehouse_id` varchar(36) DEFAULT NULL,
  `warehouse_name` varchar(100) DEFAULT NULL,
  `supplier` varchar(200) DEFAULT NULL,
  `total_amount` decimal(15,2) DEFAULT 0.00,
  `status` enum('draft','pending','completed','cancelled') DEFAULT 'draft',
  `remark` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_warehouse` (`warehouse_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `equipment_inbound_items`;
CREATE TABLE `equipment_inbound_items` (
  `id` varchar(36) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `equipment_name` varchar(200) NOT NULL,
  `model` varchar(100) DEFAULT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `quantity` int DEFAULT 1,
  `unit_price` decimal(15,2) DEFAULT 0.00,
  `category` varchar(50) DEFAULT NULL,
  `technical_params` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `equipment_transfer_orders`;
CREATE TABLE `equipment_transfer_orders` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `from_warehouse_id` varchar(36) DEFAULT NULL,
  `from_warehouse_name` varchar(100) DEFAULT NULL,
  `to_warehouse_id` varchar(36) DEFAULT NULL,
  `to_warehouse_name` varchar(100) DEFAULT NULL,
  `status` enum('draft','pending','in_transit','completed','cancelled') DEFAULT 'draft',
  `transfer_date` date DEFAULT NULL,
  `remark` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_from_warehouse` (`from_warehouse_id`),
  KEY `idx_to_warehouse` (`to_warehouse_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `equipment_repair_orders`;
CREATE TABLE `equipment_repair_orders` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `equipment_id` varchar(36) NOT NULL,
  `equipment_name` varchar(200) DEFAULT NULL,
  `fault_description` text,
  `repair_type` varchar(50) DEFAULT NULL,
  `estimated_cost` decimal(15,2) DEFAULT 0.00,
  `actual_cost` decimal(15,2) DEFAULT 0.00,
  `status` enum('draft','pending','in_repair','completed','cancelled') DEFAULT 'draft',
  `repair_date` date DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `remark` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_equipment` (`equipment_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `equipment_scrap_sales`;
CREATE TABLE `equipment_scrap_sales` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `equipment_id` varchar(36) NOT NULL,
  `equipment_name` varchar(200) DEFAULT NULL,
  `scrap_reason` text,
  `sale_price` decimal(15,2) DEFAULT 0.00,
  `buyer` varchar(200) DEFAULT NULL,
  `status` enum('draft','pending','completed','cancelled') DEFAULT 'draft',
  `scrap_date` date DEFAULT NULL,
  `remark` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_equipment` (`equipment_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `equipment_accessories`;
CREATE TABLE `equipment_accessories` (
  `id` varchar(36) NOT NULL,
  `accessory_no` varchar(50) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `quantity` int DEFAULT 0,
  `unit` varchar(20) DEFAULT '个',
  `warehouse_id` varchar(36) DEFAULT NULL,
  `warehouse_name` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accessory_no` (`accessory_no`),
  KEY `idx_warehouse` (`warehouse_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 任务管理表
-- ============================================
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `name` varchar(300) NOT NULL,
  `description` text,
  `assignee_id` varchar(36) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'unassigned',
  `priority` varchar(50) DEFAULT 'medium',
  `progress` int DEFAULT 0,
  `parent_id` varchar(36) DEFAULT NULL,
  `planned_start_date` date NOT NULL,
  `planned_end_date` date NOT NULL,
  `actual_start_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `task_type` varchar(50) DEFAULT 'subtask',
  `wbs_code` varchar(50) NOT NULL,
  `wbs_path` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_wbs` (`wbs_path`),
  KEY `idx_assignee` (`assignee_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 通知和提醒表
-- ============================================
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` varchar(50) DEFAULT 'in_app',
  `title` varchar(200) NOT NULL,
  `content` text,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `error_message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `link` varchar(255) DEFAULT NULL,
  `priority` varchar(20) DEFAULT 'normal',
  `sent_at` timestamp NULL DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `user_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `alerts`;
CREATE TABLE `alerts` (
  `id` varchar(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `severity` enum('info','warning','error','critical') DEFAULT 'info',
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` varchar(36) DEFAULT NULL,
  `status` enum('active','resolved','dismissed') DEFAULT 'active',
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolved_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 审批订单表
-- ============================================
DROP TABLE IF EXISTS `approval_orders`;
CREATE TABLE `approval_orders` (
  `id` varchar(36) NOT NULL,
  `order_type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `applicant_id` varchar(36) NOT NULL,
  `target_id` varchar(36) DEFAULT NULL,
  `from_id` varchar(36) DEFAULT NULL,
  `to_id` varchar(36) DEFAULT NULL,
  `form_data` json DEFAULT NULL,
  `status` enum('pending','approved','rejected','withdrawn') DEFAULT 'pending',
  `wecom_sp_no` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_applicant` (`applicant_id`),
  KEY `idx_status` (`status`),
  KEY `idx_order_type` (`order_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 员工入职订单表
-- ============================================
DROP TABLE IF EXISTS `employee_onboard_orders`;
CREATE TABLE `employee_onboard_orders` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `applicant_id` varchar(36) NOT NULL,
  `applicant` varchar(100) NOT NULL,
  `apply_date` date NOT NULL,
  `name` varchar(100) NOT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `id_card` varchar(18) NOT NULL,
  `department` varchar(100) NOT NULL,
  `position` varchar(100) NOT NULL,
  `hire_date` date NOT NULL,
  `employee_type` varchar(20) NOT NULL,
  `employee_no` varchar(50) DEFAULT NULL,
  `created_employee_id` varchar(36) DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected','withdrawn') DEFAULT 'draft',
  `approval_id` varchar(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_applicant` (`applicant_id`),
  KEY `idx_department` (`department`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 员工离职订单表
-- ============================================
DROP TABLE IF EXISTS `employee_offboard_orders`;
CREATE TABLE `employee_offboard_orders` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `applicant_id` varchar(36) NOT NULL,
  `applicant` varchar(100) NOT NULL,
  `apply_date` date NOT NULL,
  `employee_id` varchar(36) NOT NULL,
  `employee_name` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `offboard_type` varchar(50) NOT NULL,
  `offboard_reason` text NOT NULL,
  `expected_offboard_date` date NOT NULL,
  `handover_person_id` varchar(36) DEFAULT NULL,
  `handover_person` varchar(100) DEFAULT NULL,
  `actual_offboard_date` date DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected','withdrawn') DEFAULT 'draft',
  `approval_id` varchar(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_applicant` (`applicant_id`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 员工调岗订单表
-- ============================================
DROP TABLE IF EXISTS `employee_transfer_orders`;
CREATE TABLE `employee_transfer_orders` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `applicant_id` varchar(36) NOT NULL,
  `applicant` varchar(100) NOT NULL,
  `apply_date` date NOT NULL,
  `employee_id` varchar(36) NOT NULL,
  `employee_name` varchar(100) DEFAULT NULL,
  `from_department` varchar(100) DEFAULT NULL,
  `from_position` varchar(100) DEFAULT NULL,
  `transfer_type` varchar(50) NOT NULL,
  `to_department` varchar(100) NOT NULL,
  `to_position` varchar(100) NOT NULL,
  `transfer_reason` text NOT NULL,
  `effective_date` date NOT NULL,
  `status` enum('draft','pending','approved','rejected','withdrawn') DEFAULT 'draft',
  `approval_id` varchar(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_applicant` (`applicant_id`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 考勤记录表
-- ============================================
DROP TABLE IF EXISTS `attendance_records`;
CREATE TABLE `attendance_records` (
  `id` varchar(36) NOT NULL,
  `employee_id` varchar(36) NOT NULL,
  `project_id` varchar(36) DEFAULT NULL,
  `date` date NOT NULL,
  `check_in_time` timestamp NULL DEFAULT NULL,
  `check_in_location_name` varchar(255) DEFAULT NULL,
  `check_in_latitude` decimal(10,8) DEFAULT NULL,
  `check_in_longitude` decimal(11,8) DEFAULT NULL,
  `check_in_photo` text DEFAULT NULL,
  `check_in_status` enum('normal','late','early_leave','absent') DEFAULT 'normal',
  `check_out_time` timestamp NULL DEFAULT NULL,
  `check_out_location_name` varchar(255) DEFAULT NULL,
  `check_out_latitude` decimal(10,8) DEFAULT NULL,
  `check_out_longitude` decimal(11,8) DEFAULT NULL,
  `check_out_photo` text DEFAULT NULL,
  `check_out_status` enum('normal','late','early_leave','absent') DEFAULT 'normal',
  `work_status` enum('off','on','half_day') DEFAULT 'off',
  `is_verified` tinyint DEFAULT 0,
  `verified_by` varchar(36) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_date` (`employee_id`, `date`),
  KEY `idx_date` (`date`),
  KEY `idx_project` (`project_id`),
  KEY `idx_status` (`work_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `attendance_weekly_approvals`;
CREATE TABLE `attendance_weekly_approvals` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `week_start_date` date NOT NULL,
  `week_end_date` date NOT NULL,
  `approver_id` varchar(36) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `summary_json` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_proj_week` (`project_id`, `week_start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 日报表
-- ============================================
DROP TABLE IF EXISTS `daily_reports`;
CREATE TABLE `daily_reports` (
  `id` varchar(36) NOT NULL,
  `employee_id` varchar(36) NOT NULL,
  `report_date` date NOT NULL,
  `summary` text NOT NULL,
  `plan` text DEFAULT NULL,
  `problems` text DEFAULT NULL,
  `status` enum('pending','reviewed','rejected') DEFAULT 'pending',
  `reviewer_id` varchar(36) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `checkload_items` json DEFAULT NULL,
  `attendance_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_daily_reports_report_date` (`report_date`),
  KEY `idx_daily_reports_status` (`status`),
  KEY `idx_employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 项目提案订单表
-- ============================================
DROP TABLE IF EXISTS `project_proposal_orders`;
CREATE TABLE `project_proposal_orders` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `applicant_id` varchar(36) NOT NULL,
  `applicant` varchar(100) NOT NULL,
  `apply_date` date NOT NULL,
  `project_name` varchar(200) NOT NULL,
  `customer_id` varchar(36) DEFAULT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `project_type` varchar(50) DEFAULT NULL,
  `estimated_budget` decimal(15,2) DEFAULT 0.00,
  `estimated_start_date` date DEFAULT NULL,
  `estimated_end_date` date DEFAULT NULL,
  `description` text,
  `status` enum('draft','pending','approved','rejected','withdrawn') DEFAULT 'draft',
  `approval_id` varchar(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_applicant` (`applicant_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 项目完成订单表
-- ============================================
DROP TABLE IF EXISTS `project_completion_orders`;
CREATE TABLE `project_completion_orders` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `applicant_id` varchar(36) NOT NULL,
  `applicant` varchar(100) NOT NULL,
  `apply_date` date NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `project_name` varchar(200) DEFAULT NULL,
  `completion_summary` text,
  `completion_date` date DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected','withdrawn') DEFAULT 'draft',
  `approval_id` varchar(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_applicant` (`applicant_id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 采购请求表
-- ============================================
DROP TABLE IF EXISTS `purchase_requests`;
CREATE TABLE `purchase_requests` (
  `id` varchar(36) NOT NULL,
  `request_no` varchar(50) NOT NULL,
  `requester_id` varchar(36) NOT NULL,
  `requester_name` varchar(100) NOT NULL,
  `request_date` date NOT NULL,
  `project_id` varchar(36) DEFAULT NULL,
  `project_name` varchar(200) DEFAULT NULL,
  `total_amount` decimal(15,2) DEFAULT 0.00,
  `urgency` enum('low','medium','high','urgent') DEFAULT 'medium',
  `reason` text,
  `status` enum('draft','pending','approved','rejected','ordered','completed') DEFAULT 'draft',
  `approval_id` varchar(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `request_no` (`request_no`),
  KEY `idx_requester` (`requester_id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 采购订单表
-- ============================================
DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE `purchase_orders` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `request_id` varchar(36) DEFAULT NULL,
  `supplier` varchar(200) NOT NULL,
  `order_date` date NOT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `total_amount` decimal(15,2) DEFAULT 0.00,
  `status` enum('draft','ordered','partial_delivered','delivered','cancelled') DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_request` (`request_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 工时记录表
-- ============================================
DROP TABLE IF EXISTS `work_time_records`;
CREATE TABLE `work_time_records` (
  `id` varchar(36) NOT NULL,
  `employee_id` varchar(36) NOT NULL,
  `project_id` varchar(36) DEFAULT NULL,
  `task_id` varchar(36) DEFAULT NULL,
  `date` date NOT NULL,
  `hours` decimal(5,2) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_task` (`task_id`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 审计日志表
-- ============================================
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` varchar(36) DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 表单草稿表
-- ============================================
DROP TABLE IF EXISTS `form_drafts`;
CREATE TABLE `form_drafts` (
  `id` varchar(36) NOT NULL,
  `form_key` varchar(100) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `form_data` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_form_key_user` (`form_key`, `user_id`),
  KEY `idx_updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 表单模板版本表
-- ============================================
DROP TABLE IF EXISTS `form_template_versions`;
CREATE TABLE `form_template_versions` (
  `id` varchar(36) NOT NULL,
  `template_id` varchar(36) NOT NULL,
  `version` int NOT NULL,
  `schema` json NOT NULL,
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_version` (`template_id`, `version`),
  KEY `idx_template` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 初始化数据
-- ============================================

-- 插入默认管理员用户
INSERT INTO `users` (`id`, `username`, `password`, `name`, `email`, `role`, `status`) VALUES
('1', 'admin', '$2b$10$nKQkVqOgqoZqfj9B3D/CEumepwF5HOonLqKqOqwI5bdF7viORYceO', '系统管理员', 'admin@project-management-v3.com', 'admin', 'active');

-- 插入默认部门
INSERT INTO `departments` (`id`, `code`, `name`, `parent_id`, `level`, `path`, `sort_order`, `status`, `description`) VALUES
('dept-001', 'BM-00001', '总部', NULL, 1, '/总部', 1, 'active', '公司总部'),
('dept-002', 'BM-00002', '技术部', 'dept-001', 2, '/总部/技术部', 1, 'active', '技术研发部门'),
('dept-003', 'BM-00003', '市场部', 'dept-001', 2, '/总部/市场部', 2, 'active', '市场营销部门'),
('dept-004', 'BM-00004', '财务部', 'dept-001', 2, '/总部/财务部', 3, 'active', '财务管理部门'),
('dept-005', 'BM-00005', '人力资源部', 'dept-001', 2, '/总部/人力资源部', 4, 'active', '人力资源管理'),
('dept-006', 'BM-00006', '运营部', 'dept-001', 2, '/总部/运营部', 5, 'active', '运营管理部门');

-- 插入默认职位
INSERT INTO `positions` (`id`, `code`, `name`, `department_id`, `level`, `category`, `status`, `sort_order`) VALUES
('pos-001', 'GW-00001', '总经理', 'dept-001', 1, 'management', 'active', 1),
('pos-002', 'GW-00002', '技术总监', 'dept-002', 2, 'management', 'active', 1),
('pos-003', 'GW-00003', '高级工程师', 'dept-002', 3, 'technical', 'active', 2),
('pos-004', 'GW-00004', '工程师', 'dept-002', 4, 'technical', 'active', 3),
('pos-005', 'GW-00005', '市场总监', 'dept-003', 2, 'management', 'active', 1),
('pos-006', 'GW-00006', '市场经理', 'dept-003', 3, 'sales', 'active', 2),
('pos-007', 'GW-00007', '财务总监', 'dept-004', 2, 'management', 'active', 1),
('pos-008', 'GW-00008', '会计', 'dept-004', 4, 'technical', 'active', 2),
('pos-009', 'GW-00009', 'HR总监', 'dept-005', 2, 'management', 'active', 1),
('pos-010', 'GW-00010', 'HR专员', 'dept-005', 4, 'support', 'active', 2),
('pos-011', 'GW-00011', '运营总监', 'dept-006', 2, 'management', 'active', 1),
('pos-012', 'GW-00012', '项目经理', 'dept-002', 3, 'management', 'active', 4);

-- 插入默认仓库
INSERT INTO `warehouses` (`id`, `warehouse_no`, `name`, `type`, `manager_id`, `status`) VALUES
('wh-001', 'CK-00001', '主仓库', 'default', NULL, 'active'),
('wh-002', 'CK-00002', '备件仓库', 'spare_parts', NULL, 'active');

-- 插入默认工作流定义 (标准 V3 格式)
INSERT INTO `workflow_definitions` (`id`, `key`, `name`, `version`, `category`, `entity_type`, `node_config`, `status`) VALUES
('wf-project-approval-1', 'project-approval', '项目审批流程', 1, 'project', 'Project', '{"nodes":[{"id":"start","name":"开始","type":"startEvent"},{"id":"dept-manager","name":"部门经理审批","type":"userTask"},{"id":"project-ledger","name":"项目写入台账","type":"serviceTask","config":{"serviceType":"projectLedger"}},{"id":"end","name":"结束","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"dept-manager"},{"id":"e2","source":"dept-manager","target":"project-ledger","condition":"${action === \\"approve\\"}"},{"id":"e3","source":"project-ledger","target":"end"},{"id":"e4","source":"dept-manager","target":"end","condition":"${action === \\"reject\\"}"}]}', '[{"name":"name","label":"项目名称","type":"text","required":true,"layout":{"width":"full"}},{"name":"manager_id","label":"项目经理","type":"select","required":true,"dynamicOptions":"employee","layout":{"width":"half"}},{"name":"technical_lead_id","label":"技术负责人","type":"select","required":true,"dynamicOptions":"employee","layout":{"width":"half"}},{"name":"start_date","label":"计划开始日期","type":"date","required":true,"layout":{"width":"half"}},{"name":"end_date","label":"计划结束日期","type":"date","layout":{"width":"half"}},{"name":"budget","label":"初始预算(万元)","type":"number","layout":{"width":"half"}},{"name":"building_area","label":"建筑面积(㎡)","type":"number","layout":{"width":"half"}},{"name":"it_capacity","label":"IT总容量(kW)","type":"number","layout":{"width":"half"}},{"name":"cabinet_count","label":"机柜数量(架)","type":"number","layout":{"width":"half"}},{"name":"cabinet_power","label":"单机柜功率(kW)","type":"number","layout":{"width":"half"}},{"name":"power_architecture","label":"供电架构","type":"text","layout":{"width":"half"}},{"name":"hvac_architecture","label":"空调架构","type":"text","layout":{"width":"half"}},{"name":"fire_architecture","label":"消防架构","type":"text","layout":{"width":"half"}},{"name":"description","label":"项目简述","type":"textarea","layout":{"width":"full"}}]', 'active'),
('wf-personnel-onboard-1', 'personnel-onboard', '人员入职流程', 1, 'personnel', 'Employee', '{"nodes":[{"id":"start","name":"开始","type":"startEvent"},{"id":"hr-manager","name":"HR经理审批","type":"userTask"},{"id":"end","name":"结束","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"hr-manager"},{"id":"e2","source":"hr-manager","target":"end"}]}', 'active'),
('wf-equipment-transfer-1', 'equipment-transfer', '设备调拨流程', 1, 'equipment', 'EquipmentTransfer', '{"nodes":[{"id":"start","name":"开始","type":"startEvent"},{"id":"manager","name":"经理审批","type":"userTask"},{"id":"end","name":"结束","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"manager"},{"id":"e2","source":"manager","target":"end"}]}', 'active'),
('wf-milestone-completion-1', 'milestone-completion', '里程碑结项审批流程', 1, 'project', 'Milestone', '{"nodes":[{"id":"start","name":"提交结项申请","type":"startEvent"},{"id":"admin-approve","name":"管理员审批","type":"userTask"},{"id":"complete-milestone","name":"结项处理","type":"serviceTask","config":{"serviceType":"completeMilestone"}},{"id":"end-approved","name":"结项通过","type":"endEvent"},{"id":"end-rejected","name":"结项驳回","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"admin-approve"},{"id":"e2","source":"admin-approve","target":"complete-milestone","condition":"${action === \\"approve\\"}"},{"id":"e3","source":"admin-approve","target":"end-rejected","condition":"${action === \\"reject\\"}"},{"id":"e4","source":"complete-milestone","target":"end-approved"}]}', 'active'),
('wf-project-completion-1', 'project-completion', '项目结项审批流程', 1, 'project', 'Project', '{"nodes":[{"id":"start","name":"提交结项申请","type":"startEvent"},{"id":"admin-approve","name":"管理员审批","type":"userTask"},{"id":"complete-project","name":"结项处理","type":"serviceTask","config":{"serviceType":"completeProject"}},{"id":"end-approved","name":"结项通过","type":"endEvent"},{"id":"end-rejected","name":"结项驳回","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"admin-approve"},{"id":"e2","source":"admin-approve","target":"complete-project","condition":"${action === \\"approve\\"}"},{"id":"e3","source":"admin-approve","target":"end-rejected","condition":"${action === \\"reject\\"}"},{"id":"e4","source":"complete-project","target":"end-approved"}]}', 'active'),
('wf-personnel-project-transfer-1', 'personnel-project-transfer', '人员项目调拨审批流程', 1, 'personnel', 'EmployeeProjectTransfer', '{"nodes":[{"id":"start","name":"提交调拨申请","type":"startEvent"},{"id":"admin-approve","name":"管理员审批","type":"userTask"},{"id":"do-transfer","name":"执行调拨","type":"serviceTask","config":{"serviceType":"transferProjectPersonnel"}},{"id":"end-approved","name":"调拨完成","type":"endEvent"},{"id":"end-rejected","name":"调拨驳回","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"admin-approve"},{"id":"e2","source":"admin-approve","target":"do-transfer","condition":"${action === \\"approve\\"}"},{"id":"e3","source":"admin-approve","target":"end-rejected","condition":"${action === \\"reject\\"}"},{"id":"e4","source":"do-transfer","target":"end-approved"}]}', 'active');


-- ============================================
-- 系统配置表 (迁移脚本补全)
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
-- 项目里程碑和资料表
-- ============================================
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
  CONSTRAINT `fk_milestone_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT `fk_resource_milestone` FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT `fk_doc_milestone` FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 数据库初始化完成
-- ============================================
SELECT '数据库 project_mgmt_v3 初始化完成！' AS message;