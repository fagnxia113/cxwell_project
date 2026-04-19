-- ============================================
-- 补全系统缺失权限码及安全加固
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- 1. 插入缺失的权限码
REPLACE INTO `permissions` (`id`, `code`, `name`, `module`, `resource`, `action`, `type`, `parent_id`, `sort_order`) VALUES
-- 菜单类
('perm-menu-dash', 'menu:dashboard', '仪表盘菜单', 'system', 'menu', 'view', 'menu', NULL, 0),
('perm-menu-know', 'menu:knowledge', '知识库菜单', 'knowledge', 'menu', 'view', 'menu', NULL, 80),
('perm-menu-admin', 'menu:admin', '管理后台菜单', 'system', 'menu', 'view', 'menu', NULL, 100),

-- 知识库功能
('perm-know-001', 'knowledge:view', '查看知识库', 'knowledge', 'knowledge', 'view', 'button', NULL, 81),
('perm-know-002', 'knowledge:manage', '管理知识库', 'knowledge', 'knowledge', 'manage', 'button', 'perm-know-001', 82),

-- 人员统计功能细化
('perm-psn-att', 'personnel:attendance:view', '查看出勤统计', 'personnel', 'attendance', 'view', 'button', NULL, 45),
('perm-psn-rot', 'personnel:rotation:view', '查看旋转计划', 'personnel', 'rotation', 'view', 'button', NULL, 46),
('perm-psn-ovw', 'personnel:attendance-overview:view', '查看预计出行总表', 'personnel', 'attendance', 'view', 'button', NULL, 47);

-- 2. 分配权限给角色

-- 为 Admin (role-001) 分配所有新权限
INSERT IGNORE INTO `role_permissions` (`id`, `role_id`, `permission_id`)
SELECT CONCAT('rp-admin-', p.id), 'role-001', p.id
FROM `permissions` p WHERE p.code IN ('menu:dashboard', 'menu:knowledge', 'menu:admin', 'knowledge:view', 'knowledge:manage', 'personnel:attendance:view', 'personnel:rotation:view', 'personnel:attendance-overview:view');

-- 为 Project Manager (role-002) 分配权限
INSERT IGNORE INTO `role_permissions` (`id`, `role_id`, `permission_id`)
SELECT CONCAT('rp-pm-', p.id), 'role-002', p.id
FROM `permissions` p WHERE p.code IN ('menu:dashboard', 'menu:knowledge', 'knowledge:view', 'knowledge:manage', 'personnel:attendance:view', 'personnel:rotation:view', 'personnel:attendance-overview:view');

-- 为 Employee (role-003) 分配权限 (限制为只读和工作台，剔除总表试图)
INSERT IGNORE INTO `role_permissions` (`id`, `role_id`, `permission_id`)
SELECT CONCAT('rp-emp-', p.id), 'role-003', p.id
FROM `permissions` p WHERE p.code IN ('menu:dashboard', 'menu:knowledge', 'knowledge:view', 'personnel:rotation:view', 'personnel:attendance:view');


-- 3. 数据权限加固 (确保普通员工只能看到自己)
-- 检查并更新数据权限配置
REPLACE INTO `data_permissions` (`id`, `role_id`, `entity_type`, `scope`) VALUES
('dp-emp-rotation', 'role-003', 'rotation_plan', 'self'),
('dp-emp-personnel', 'role-003', 'employee', 'self');

-- 4. 清理之前可能存在的重复项（如果ID不一致但CODE一致）
-- (在实际生产环境应更谨慎，这里作为补丁执行)

SELECT '权限补全完成！' AS status;
