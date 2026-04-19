-- ============================================
-- 项目管理系统 V3 初始化数据库脚本
-- 生成时间: 2026-03-17
-- 包含表结构和初始数据
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 核心用户表
-- ----------------------------
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
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` VALUES 
('1','admin','$2b$10$nKQkVqOgqoZqfj9B3D/CEumepwF5HOonLqKqOqwI5bdF7viORYceO','管理员','admin@company.com','admin','active','2026-03-17 02:52:04','2026-03-17 02:52:04'),
('abc3f59e-25a5-408c-b492-54d008b04171','youshuang','123456','游爽','youshuang@allstewards.net','user','active','2026-03-17 06:46:51','2026-03-17 06:46:51');

-- ----------------------------
-- 组织架构表
-- ----------------------------
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
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `departments` VALUES 
('dept-001','BM-00001','总部',NULL,NULL,NULL,1,'/总部',1,'active','公司总部',NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('dept-002','BM-00002','技术部','dept-001',NULL,NULL,2,'/总部/技术部',1,'active','技术研发部门',NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('dept-003','BM-00003','市场部','dept-001',NULL,NULL,2,'/总部/市场部',2,'active','市场营销部门',NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('dept-004','BM-00004','财务部','dept-001',NULL,NULL,2,'/总部/财务部',3,'active','财务管理部门',NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('dept-005','BM-00005','人力资源部','dept-001',NULL,NULL,2,'/总部/人力资源部',4,'active','人力资源管理',NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('dept-006','BM-00006','运营部','dept-001',NULL,NULL,2,'/总部/运营部',5,'active','运营管理部门',NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `positions` VALUES 
('pos-001','GW-00001','总经理','dept-001',NULL,1,'management',NULL,NULL,NULL,'active',1,NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('pos-002','GW-00002','技术总监','dept-002',NULL,2,'management',NULL,NULL,NULL,'active',1,NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('pos-003','GW-00003','高级工程师','dept-002',NULL,3,'technical',NULL,NULL,NULL,'active',2,NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('pos-004','GW-00004','工程师','dept-002',NULL,4,'technical',NULL,NULL,NULL,'active',3,NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('pos-005','GW-00005','市场总监','dept-003',NULL,2,'management',NULL,NULL,NULL,'active',1,NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('pos-006','GW-00006','市场经理','dept-003',NULL,3,'sales',NULL,NULL,NULL,'active',2,NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('pos-007','GW-00007','财务总监','dept-004',NULL,2,'management',NULL,NULL,NULL,'active',1,NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('pos-008','GW-00008','会计','dept-004',NULL,4,'technical',NULL,NULL,NULL,'active',2,NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('pos-009','GW-00009','HR总监','dept-005',NULL,2,'management',NULL,NULL,NULL,'active',1,NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('pos-010','GW-00010','HR专员','dept-005',NULL,4,'support',NULL,NULL,NULL,'active',2,NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('pos-011','GW-00011','运营总监','dept-006',NULL,2,'management',NULL,NULL,NULL,'active',1,NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37'),
('pos-012','GW-00012','项目经理','dept-002',NULL,3,'management',NULL,NULL,NULL,'active',4,NULL,NULL,'2026-03-17 02:28:37','2026-03-17 02:28:37');

-- ----------------------------
-- 员工表
-- ----------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` varchar(36) NOT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `department_id` varchar(36) DEFAULT NULL,
  `department_name` varchar(100) DEFAULT NULL,
  `position_id` varchar(36) DEFAULT NULL,
  `position_name` varchar(100) DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `hire_date` date DEFAULT NULL,
  `employee_type` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_department` (`department_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- 仓库表
-- ----------------------------
DROP TABLE IF EXISTS `warehouses`;
CREATE TABLE `warehouses` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(20) DEFAULT 'default',
  `address` text,
  `manager_id` varchar(36) DEFAULT NULL,
  `manager_name` varchar(100) DEFAULT NULL,
  `contact` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_manager` (`manager_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- 客户表
-- ----------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `type` enum('enterprise','government','individual') DEFAULT 'enterprise',
  `industry` varchar(100) DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `address` text,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- 项目表
-- ----------------------------
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id` varchar(36) NOT NULL,
  `project_no` varchar(50) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `customer_id` varchar(36) DEFAULT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `department_id` varchar(36) DEFAULT NULL,
  `department_name` varchar(100) DEFAULT NULL,
  `manager_id` varchar(36) DEFAULT NULL,
  `manager` varchar(100) DEFAULT NULL,
  `version` int DEFAULT 0,
  `status` enum('draft','in_progress','completed','suspended','cancelled') DEFAULT 'draft',
  `priority` int DEFAULT 5,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT 0.00,
  `progress` int DEFAULT 0,
  `country` varchar(50) DEFAULT '中国',
  `address` text,
  `phase` varchar(50) DEFAULT NULL,
  `phase_start_date` date DEFAULT NULL,
  `phase_end_date` date DEFAULT NULL,
  `estimated_days` int DEFAULT 0,
  `remaining_days` int DEFAULT 0,
  `area` decimal(10,2) DEFAULT 0.00,
  `capacity` decimal(10,2) DEFAULT 0.00,
  `rack_count` int DEFAULT 0,
  `rack_power` decimal(5,2) DEFAULT 0.00,
  `power_arch` text,
  `hvac_arch` text,
  `fire_arch` text,
  `weak_arch` text,
  `customer_name` varchar(200) DEFAULT NULL,
  `building_area` decimal(10,2) DEFAULT 0.00,
  `it_capacity` decimal(10,2) DEFAULT 0.00,
  `cabinet_count` int DEFAULT 0,
  `cabinet_power` decimal(10,2) DEFAULT 0.00,
  `power_architecture` text,
  `hvac_architecture` text,
  `fire_architecture` text,
  `weak_electric_architecture` text,
  `approval_mode` varchar(50) DEFAULT 'workflow',
  `technical_lead_id` varchar(36) DEFAULT NULL,
  `end_customer` varchar(200) DEFAULT NULL,
  `description` text,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_no` (`project_no`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_department` (`department_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- 流程引擎表
-- ----------------------------
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
  PRIMARY KEY (`id`),
  KEY `idx_key` (`key`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `workflow_definitions` (`id`, `key`, `name`, `version`, `category`, `node_config`, `status`) VALUES
('wf-project-init-001', 'project_init', '项目立项审批', 1, 'project', '{"nodes":[{"id":"start","name":"开始","type":"startEvent"},{"id":"dept_manager","name":"部门经理审批","type":"userTask"},{"id":"end","name":"结束","type":"endEvent"}],"edges":[{"id":"e1","source":"start","target":"dept_manager"},{"id":"e2","source":"dept_manager","target":"end"}]}', 'active');

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
  PRIMARY KEY (`id`),
  KEY `idx_definition` (`definition_id`),
  KEY `idx_business_key` (`business_key`),
  KEY `idx_initiator` (`initiator_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `workflow_locks`;
CREATE TABLE `workflow_locks` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `lock_key` VARCHAR(200) NOT NULL,
  `owner` VARCHAR(100) NOT NULL,
  `acquired_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  INDEX `idx_workflow_locks_key_expires` (`lock_key`, `expires_at`),
  INDEX `idx_workflow_locks_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- 表单模板表
-- ----------------------------
DROP TABLE IF EXISTS `form_templates`;
CREATE TABLE `form_templates` (
  `id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `key` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `schema` json NOT NULL,
  `version` int DEFAULT 1,
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- 设备管理表
-- ----------------------------
DROP TABLE IF EXISTS `equipment_instances`;
CREATE TABLE `equipment_instances` (
  `id` varchar(36) NOT NULL,
  `equipment_no` varchar(50) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `warranty_expire_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `warehouse_id` varchar(36) DEFAULT NULL,
  `warehouse_name` varchar(100) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `project_id` varchar(36) DEFAULT NULL,
  `project_name` varchar(200) DEFAULT NULL,
  `technical_params` json DEFAULT NULL,
  `images` json DEFAULT NULL,
  `description` text,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `equipment_no` (`equipment_no`),
  KEY `idx_warehouse` (`warehouse_id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `equipment_inbound_orders`;
CREATE TABLE `equipment_inbound_orders` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `type` varchar(20) DEFAULT 'purchase',
  `warehouse_id` varchar(36) DEFAULT NULL,
  `warehouse_name` varchar(100) DEFAULT NULL,
  `supplier` varchar(200) DEFAULT NULL,
  `total_amount` decimal(15,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT 'draft',
  `remark` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `idx_warehouse` (`warehouse_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `equipment_transfer_orders`;
CREATE TABLE `equipment_transfer_orders` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `from_warehouse_id` varchar(36) DEFAULT NULL,
  `from_warehouse_name` varchar(100) DEFAULT NULL,
  `to_warehouse_id` varchar(36) DEFAULT NULL,
  `to_warehouse_name` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'draft',
  `shipping_date` date DEFAULT NULL,
  `shipping_no` varchar(100) DEFAULT NULL,
  `remark` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `equipment_transfer_order_items`;
CREATE TABLE `equipment_transfer_order_items` (
  `id` varchar(36) NOT NULL,
  `order_id` varchar(36) NOT NULL,
  `equipment_id` varchar(36) DEFAULT NULL,
  `equipment_name` varchar(200) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `quantity` int DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `equipment_repair_orders`;
CREATE TABLE `equipment_repair_orders` (
  `id` varchar(36) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `equipment_id` varchar(36) DEFAULT NULL,
  `equipment_name` varchar(200) DEFAULT NULL,
  `fault_description` text,
  `repair_type` varchar(50) DEFAULT NULL,
  `estimated_cost` decimal(15,2) DEFAULT 0.00,
  `actual_cost` decimal(15,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT 'pending',
  `repair_date` date DEFAULT NULL,
  `completed_date` date DEFAULT NULL,
  `remark` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `equipment_accessories`;
CREATE TABLE `equipment_accessories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `specification` varchar(100) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `unit_price` decimal(15,2) DEFAULT 0.00,
  `category` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `equipment_accessory_instances`;
CREATE TABLE `equipment_accessory_instances` (
  `id` varchar(36) NOT NULL,
  `accessory_id` varchar(36) NOT NULL,
  `equipment_id` varchar(36) DEFAULT NULL,
  `quantity` int DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_accessory` (`accessory_id`),
  KEY `idx_equipment` (`equipment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `equipment_images`;
CREATE TABLE `equipment_images` (
  `id` varchar(36) NOT NULL,
  `equipment_id` varchar(36) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `image_type` varchar(20) DEFAULT 'other',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_equipment` (`equipment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- 任务与报表表
-- ----------------------------
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` varchar(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `project_id` varchar(36) DEFAULT NULL,
  `assignee_id` varchar(36) DEFAULT NULL,
  `assignee_name` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `priority` int DEFAULT 5,
  `due_date` date DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_assignee` (`assignee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `daily_reports`;
CREATE TABLE `daily_reports` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `report_date` date NOT NULL,
  `content` text,
  `project_id` varchar(36) DEFAULT NULL,
  `project_name` varchar(200) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_date` (`report_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text,
  `is_read` tinyint DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- 可选表 (有数据时才需要)
-- ----------------------------
DROP TABLE IF EXISTS `project_personnel`;
CREATE TABLE `project_personnel` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) NOT NULL,
  `employee_id` varchar(36) DEFAULT NULL,
  `employee_name` varchar(100) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `attendance_records`;
CREATE TABLE `attendance_records` (
  `id` varchar(36) NOT NULL,
  `employee_id` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `status` varchar(20) DEFAULT 'absent',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `system_configs`;
CREATE TABLE `system_configs` (
  `id` varchar(36) NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` text,
  `description` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
