-- ============================================
-- 迁移脚本 003: 补全员工表第三方同步字段
-- 创建时间: 2026-04-10
-- ============================================

USE `project_mgmt_v3`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 为 employees 表增加第三方关联字段
ALTER TABLE `employees`
  ADD COLUMN `third_party_id` varchar(100) DEFAULT NULL COMMENT '第三方系统UserID (如企微userid)',
  ADD COLUMN `third_party_source` varchar(50) DEFAULT NULL COMMENT '第三方来源 (wechat_work, dingtalk, etc.)',
  ADD UNIQUE KEY `uk_employee_third_party` (`third_party_source`, `third_party_id`);

SET FOREIGN_KEY_CHECKS = 1;

SELECT '迁移 003 完成: 员工表第三方字段已补全' AS message;
