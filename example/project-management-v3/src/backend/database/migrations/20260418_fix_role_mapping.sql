-- ============================================
-- 确保旧账号的角色映射到新的 RBAC 系统
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- 1. 将所有在 users 表中角色为 'user' 的用户，在 user_roles 表中映射为 'employee' (role-003)
INSERT IGNORE INTO `user_roles` (`id`, `user_id`, `role_id`, `created_at`)
SELECT UUID(), u.id, 'role-003', NOW()
FROM `users` u
WHERE u.role = 'user' AND u.id NOT IN (SELECT user_id FROM user_roles);

-- 2. 检查是否有用户既没有 RBAC 角色也没有 'admin' 身份，统一设为 'employee'
INSERT IGNORE INTO `user_roles` (`id`, `user_id`, `role_id`, `created_at`)
SELECT UUID(), u.id, 'role-003', NOW()
FROM `users` u
WHERE u.id NOT IN (SELECT user_id FROM user_roles);

-- 3. 再次确保 'employee' 角色拥有 'menu:knowledge' 权限 (防止刚才执行失败)
INSERT IGNORE INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT UUID(), 'role-003', p.id, NOW()
FROM `permissions` p 
WHERE p.code = 'menu:knowledge' AND 'role-003' NOT IN (SELECT role_id FROM role_permissions WHERE permission_id = p.id);

SELECT '用户角色映射与权限补全成功！' AS status;
