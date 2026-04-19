-- ============================================
-- 全局 RBAC 权限体系安全加固补丁 (V3)
-- 目标：封堵“幽灵菜单”，精细化控制模块入口
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- 1. 补全缺失的顶层菜单权限
REPLACE INTO `permissions` (`id`, `code`, `name`, `module`, `resource`, `action`, `type`, `parent_id`, `sort_order`) VALUES
('perm-menu-proj', 'menu:project', '项目管理菜单', 'project', 'menu', 'view', 'menu', NULL, 10),
('perm-menu-wf', 'menu:workflow', '审批中心菜单', 'workflow', 'menu', 'view', 'menu', NULL, 20),
('perm-menu-psn', 'menu:personnel', '人员管理菜单', 'personnel', 'menu', 'view', 'menu', NULL, 30),
('perm-menu-equip', 'menu:equipment', '设备管理菜单', 'equipment', 'menu', 'view', 'menu', NULL, 40),
('perm-menu-org', 'menu:organization', '组织架构菜单', 'organization', 'menu', 'view', 'menu', NULL, 50);

-- 更正可能存在的错误类型
UPDATE `permissions` SET `type` = 'menu' WHERE `code` LIKE 'menu:%';

-- 2. 彻底重置并重新分配模块入口权限

-- 清理旧的模块菜单关联（防止残留）
DELETE FROM `role_permissions` WHERE `permission_id` IN (
    SELECT id FROM `permissions` WHERE `code` LIKE 'menu:%'
);

-- A. 系统管理员 (admin/super_admin): 拥有全模块入口
INSERT IGNORE INTO `role_permissions` (`id`, `role_id`, `permission_id`)
SELECT CONCAT('rp-adm-', p.id), r.id, p.id
FROM `roles` r, `permissions` p
WHERE r.code IN ('admin', 'super_admin') AND p.code LIKE 'menu:%';

-- B. 项目负责人 (project_manager): 拥有除系统管理外的全模块入口
INSERT IGNORE INTO `role_permissions` (`id`, `role_id`, `permission_id`)
SELECT CONCAT('rp-pm-', p.id), 'role-002', p.id
FROM `permissions` p
WHERE p.code IN ('menu:dashboard', 'menu:project', 'menu:workflow', 'menu:personnel', 'menu:equipment', 'menu:organization', 'menu:knowledge');

-- C. 普通员工 (employee): 最简菜单（排除设备管理和系统管理）
INSERT IGNORE INTO `role_permissions` (`id`, `role_id`, `permission_id`)
SELECT CONCAT('rp-emp-', p.id), 'role-003', p.id
FROM `permissions` p
WHERE p.code IN ('menu:dashboard', 'menu:project', 'menu:workflow', 'menu:personnel', 'menu:organization', 'menu:knowledge');

-- 3. 细化功能权限

-- 确保普通员工拥有组织架构的查看权限，但没有管理权限
INSERT IGNORE INTO `role_permissions` (`id`, `role_id`, `permission_id`)
SELECT CONCAT('rp-emp-view-org-', p.id), 'role-003', p.id
FROM `permissions` p
WHERE p.code = 'organization:view';

-- 移除普通员工可能残留的设备管理功能权限
DELETE FROM `role_permissions` 
WHERE `role_id` = 'role-003' 
AND `permission_id` IN (SELECT id FROM `permissions` WHERE `module` = 'equipment');

SELECT '全模块权限加固补丁执行成功！' AS status;
