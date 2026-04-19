-- ============================================
-- RBAC 权限系统 V2 迁移脚本
-- 简化版：3种角色 + 按钮级权限 + 个人级数据权限
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ============================================
-- 1. 修改 roles 表，添加新字段
-- ============================================
ALTER TABLE `roles`
ADD COLUMN IF NOT EXISTS `is_system` tinyint(1) DEFAULT 0 COMMENT '是否系统内置角色' AFTER `description`;

ALTER TABLE `roles`
ADD COLUMN IF NOT EXISTS `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- ============================================
-- 2. 创建 permissions 表
-- ============================================
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `code` varchar(100) NOT NULL UNIQUE COMMENT '权限码，格式: module:resource:action',
  `name` varchar(100) NOT NULL COMMENT '权限显示名称',
  `module` varchar(50) NOT NULL COMMENT '所属模块',
  `resource` varchar(50) NOT NULL COMMENT '资源名称',
  `action` varchar(50) NOT NULL COMMENT '操作类型',
  `type` enum('menu', 'button', 'api') NOT NULL DEFAULT 'button' COMMENT '权限类型',
  `parent_id` varchar(36) DEFAULT NULL COMMENT '父权限ID，用于构建权限树',
  `sort_order` int DEFAULT 0 COMMENT '排序号',
  `status` enum('active', 'inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_perm_code` (`code`),
  KEY `idx_perm_module` (`module`),
  KEY `idx_perm_type` (`type`),
  KEY `idx_perm_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限定义表';

-- ============================================
-- 3. 创建 role_permissions 表
-- ============================================
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `role_id` varchar(36) NOT NULL,
  `permission_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_role_perm` (`role_id`, `permission_id`),
  KEY `idx_rp_role` (`role_id`),
  KEY `idx_rp_perm` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- ============================================
-- 4. 创建 user_roles 表
-- ============================================
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `user_id` varchar(36) NOT NULL,
  `role_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_ur_user` (`user_id`),
  KEY `idx_ur_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- ============================================
-- 5. 创建 data_permissions 表
-- ============================================
CREATE TABLE IF NOT EXISTS `data_permissions` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `role_id` varchar(36) NOT NULL,
  `entity_type` varchar(50) NOT NULL COMMENT '实体类型',
  `scope` enum('all', 'department', 'self') NOT NULL DEFAULT 'self' COMMENT '数据范围',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_role_entity` (`role_id`, `entity_type`),
  KEY `idx_dp_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据权限配置表';

-- ============================================
-- 6. 插入预设角色（使用 REPLACE 处理重复）
-- ============================================
REPLACE INTO `roles` (`id`, `code`, `name`, `description`, `is_system`, `status`) VALUES
('role-001', 'admin', '系统管理员', '拥有系统全部权限，可管理所有用户和角色', 1, 'active'),
('role-002', 'project_manager', '项目负责人', '管理项目、任务，可查看部门员工', 1, 'active'),
('role-003', 'employee', '普通员工', '基础权限，只能操作自己的数据', 1, 'active');

-- ============================================
-- 7. 插入权限定义
-- ============================================
REPLACE INTO `permissions` (`id`, `code`, `name`, `module`, `resource`, `action`, `type`, `parent_id`, `sort_order`) VALUES
-- 系统管理模块
('perm-sys-001', 'system:user:view', '查看用户', 'system', 'user', 'view', 'button', NULL, 1),
('perm-sys-002', 'system:user:create', '创建用户', 'system', 'user', 'create', 'button', 'perm-sys-001', 2),
('perm-sys-003', 'system:user:edit', '编辑用户', 'system', 'user', 'edit', 'button', 'perm-sys-001', 3),
('perm-sys-004', 'system:user:delete', '删除用户', 'system', 'user', 'delete', 'button', 'perm-sys-001', 4),
('perm-sys-005', 'system:role:view', '查看角色', 'system', 'role', 'view', 'button', NULL, 5),
('perm-sys-006', 'system:role:manage', '管理角色', 'system', 'role', 'manage', 'button', 'perm-sys-005', 6),
('perm-sys-007', 'system:menu:view', '查看菜单', 'system', 'menu', 'view', 'button', NULL, 7),

-- 项目管理模块
('perm-proj-001', 'project:view', '查看项目', 'project', 'project', 'view', 'button', NULL, 10),
('perm-proj-002', 'project:create', '创建项目', 'project', 'project', 'create', 'button', 'perm-proj-001', 11),
('perm-proj-003', 'project:edit', '编辑项目', 'project', 'project', 'edit', 'button', 'perm-proj-001', 12),
('perm-proj-004', 'project:delete', '删除项目', 'project', 'project', 'delete', 'button', 'perm-proj-001', 13),
('perm-proj-005', 'project:approve', '审批项目', 'project', 'project', 'approve', 'button', 'perm-proj-001', 14),

-- 任务管理模块
('perm-task-001', 'task:view', '查看任务', 'task', 'task', 'view', 'button', NULL, 20),
('perm-task-002', 'task:create', '创建任务', 'task', 'task', 'create', 'button', 'perm-task-001', 21),
('perm-task-003', 'task:edit', '编辑任务', 'task', 'task', 'edit', 'button', 'perm-task-001', 22),
('perm-task-004', 'task:delete', '删除任务', 'task', 'task', 'delete', 'button', 'perm-task-001', 23),
('perm-task-005', 'task:assign', '分配任务', 'task', 'task', 'assign', 'button', 'perm-task-001', 24),

-- 设备管理模块
('perm-equip-001', 'equipment:view', '查看设备', 'equipment', 'equipment', 'view', 'button', NULL, 30),
('perm-equip-002', 'equipment:create', '创建设备', 'equipment', 'equipment', 'create', 'button', 'perm-equip-001', 31),
('perm-equip-003', 'equipment:edit', '编辑设备', 'equipment', 'equipment', 'edit', 'button', 'perm-equip-001', 32),
('perm-equip-004', 'equipment:delete', '删除设备', 'equipment', 'equipment', 'delete', 'button', 'perm-equip-001', 33),
('perm-equip-005', 'equipment:transfer', '调拨设备', 'equipment', 'equipment', 'transfer', 'button', 'perm-equip-001', 34),
('perm-equip-006', 'equipment:repair', '维修设备', 'equipment', 'equipment', 'repair', 'button', 'perm-equip-001', 35),
('perm-equip-007', 'equipment:scrap', '报废设备', 'equipment', 'equipment', 'scrap', 'button', 'perm-equip-001', 36),

-- 人员管理模块
('perm-emp-001', 'employee:view', '查看员工', 'employee', 'employee', 'view', 'button', NULL, 40),
('perm-emp-002', 'employee:create', '创建员工', 'employee', 'employee', 'create', 'button', 'perm-emp-001', 41),
('perm-emp-003', 'employee:edit', '编辑员工', 'employee', 'employee', 'edit', 'button', 'perm-emp-001', 42),
('perm-emp-004', 'employee:delete', '删除员工', 'employee', 'employee', 'delete', 'button', 'perm-emp-001', 43),

-- 工作流模块
('perm-wf-001', 'workflow:view', '查看工作流', 'workflow', 'workflow', 'view', 'button', NULL, 50),
('perm-wf-002', 'workflow:approve', '审批任务', 'workflow', 'workflow', 'approve', 'button', 'perm-wf-001', 51),
('perm-wf-003', 'workflow:start', '发起流程', 'workflow', 'workflow', 'start', 'button', 'perm-wf-001', 52),

-- 组织架构模块
('perm-org-001', 'organization:view', '查看组织', 'organization', 'organization', 'view', 'button', NULL, 60),
('perm-org-002', 'organization:manage', '管理组织', 'organization', 'organization', 'manage', 'button', 'perm-org-001', 61),

-- 仓库管理模块
('perm-wh-001', 'warehouse:view', '查看仓库', 'warehouse', 'warehouse', 'view', 'button', NULL, 70),
('perm-wh-002', 'warehouse:manage', '管理仓库', 'warehouse', 'warehouse', 'manage', 'button', 'perm-wh-001', 71),

-- 报表模块
('perm-report-001', 'report:view', '查看报表', 'report', 'report', 'view', 'button', NULL, 80),
('perm-report-002', 'report:export', '导出报表', 'report', 'report', 'export', 'button', 'perm-report-001', 81);

-- ============================================
-- 8. 清空并重新插入角色权限
-- ============================================
TRUNCATE TABLE `role_permissions`;

-- Admin: 拥有所有权限
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`)
SELECT CONCAT('rp-admin-', p.id), 'role-001', p.id
FROM `permissions` p WHERE p.status = 'active';

-- Project Manager: 项目管理 + 任务管理 + 设备查看 + 人员查看 + 工作流
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`)
SELECT CONCAT('rp-pm-', p.id), 'role-002', p.id
FROM `permissions` p
WHERE p.status = 'active'
AND (
  p.module IN ('project', 'task', 'workflow', 'report')
  OR p.code LIKE 'equipment:view'
  OR p.code LIKE 'employee:view'
  OR p.code LIKE 'organization:view'
  OR p.code LIKE 'warehouse:view'
);

-- Employee: 基础查看权限
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`)
SELECT CONCAT('rp-emp-', p.id), 'role-003', p.id
FROM `permissions` p
WHERE p.status = 'active'
AND p.action IN ('view', 'start')
AND p.module NOT IN ('system');

-- ============================================
-- 9. 插入数据权限配置
-- ============================================
TRUNCATE TABLE `data_permissions`;

INSERT INTO `data_permissions` (`id`, `role_id`, `entity_type`, `scope`) VALUES
('dp-admin-001', 'role-001', 'project', 'all'),
('dp-admin-002', 'role-001', 'equipment', 'all'),
('dp-admin-003', 'role-001', 'employee', 'all'),
('dp-admin-004', 'role-001', 'task', 'all'),
('dp-pm-001', 'role-002', 'project', 'department'),
('dp-pm-002', 'role-002', 'task', 'department'),
('dp-pm-003', 'role-002', 'equipment', 'self'),
('dp-pm-004', 'role-002', 'employee', 'self'),
('dp-emp-001', 'role-003', 'project', 'self'),
('dp-emp-002', 'role-003', 'task', 'self'),
('dp-emp-003', 'role-003', 'equipment', 'self'),
('dp-emp-004', 'role-003', 'employee', 'self');

-- ============================================
-- 10. 为现有 admin 用户分配 admin 角色
-- ============================================
INSERT IGNORE INTO `user_roles` (`id`, `user_id`, `role_id`)
SELECT 'ur-admin-001', u.id, 'role-001'
FROM `users` u
WHERE u.role = 'admin' OR u.username = 'admin';

-- ============================================
-- 11. 输出迁移结果
-- ============================================
SELECT '迁移完成！' AS status;
SELECT '角色列表:' AS info;
SELECT id, code, name, is_system FROM roles;
SELECT '权限数量:' AS info;
SELECT COUNT(*) AS total_permissions FROM permissions;
SELECT '管理员权限数量:' AS info;
SELECT COUNT(*) AS admin_permissions FROM role_permissions WHERE role_id = 'role-001';
