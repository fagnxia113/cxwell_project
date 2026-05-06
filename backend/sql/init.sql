-- ============================================================
-- 汇升智合项目管理平台 - 期初数据库脚本
-- 版本: v1.0.0
-- 适用于: MySQL 8.0+
-- 说明: 包含所有业务表、工作流表、通知表及种子数据
-- 部署到云服务器时执行此脚本即可完成数据库初始化
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 第一部分：系统权限与用户相关表
-- ------------------------------------------------------------

-- 租户表
CREATE TABLE IF NOT EXISTS `sys_tenant` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '租户ID',
  `name` varchar(100) NOT NULL COMMENT '租户名称',
  `code` varchar(50) NOT NULL COMMENT '租户编码',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态(0正常 1停用)',
  `expire_time` datetime DEFAULT NULL COMMENT '过期时间',
  `package_count` int DEFAULT NULL COMMENT '套餐并发数',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租户表';

-- 部门表
CREATE TABLE IF NOT EXISTS `sys_dept` (
  `dept_id` bigint NOT NULL AUTO_INCREMENT COMMENT '部门id',
  `parent_id` bigint NOT NULL DEFAULT 0 COMMENT '父部门id',
  `ancestors` varchar(1000) DEFAULT '' COMMENT '祖籍列表',
  `dept_name` varchar(100) NOT NULL COMMENT '部门名称',
  `order_num` int DEFAULT 0 COMMENT '显示顺序',
  `leader` varchar(64) DEFAULT NULL COMMENT '负责人',
  `phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '部门状态(0正常 1停用)',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- 用户表
CREATE TABLE IF NOT EXISTS `sys_user` (
  `user_id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `dept_id` bigint DEFAULT NULL COMMENT '部门ID',
  `login_name` varchar(50) NOT NULL COMMENT '登录账号',
  `user_name` varchar(100) NOT NULL COMMENT '用户昵称',
  `user_type` varchar(2) DEFAULT '00' COMMENT '用户类型',
  `email` varchar(100) DEFAULT '' COMMENT '用户邮箱',
  `phone` varchar(20) DEFAULT '' COMMENT '手机号码',
  `sex` char(1) DEFAULT '0' COMMENT '用户性别(0男 1女 2未知)',
  `avatar` varchar(1000) DEFAULT '' COMMENT '头像地址',
  `password` varchar(100) DEFAULT '' COMMENT '密码',
  `salt` varchar(10) DEFAULT NULL COMMENT '盐加密',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '帐号状态(0正常 1停用)',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `login_ip` varchar(50) DEFAULT NULL COMMENT '最后登录IP',
  `login_date` datetime DEFAULT NULL COMMENT '最后登录时间',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_login_name` (`login_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 角色表
CREATE TABLE IF NOT EXISTS `sys_role` (
  `role_id` bigint NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_name` varchar(30) NOT NULL COMMENT '角色名称',
  `role_key` varchar(100) NOT NULL COMMENT '角色权限字符串',
  `role_sort` int NOT NULL COMMENT '显示顺序',
  `data_scope` char(1) DEFAULT '1' COMMENT '数据范围',
  `status` char(1) NOT NULL COMMENT '角色状态(0正常 1停用)',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uk_role_key` (`role_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 菜单权限表
CREATE TABLE IF NOT EXISTS `sys_menu` (
  `menu_id` bigint NOT NULL AUTO_INCREMENT COMMENT '菜单ID',
  `menu_name` varchar(50) NOT NULL COMMENT '菜单名称',
  `parent_id` bigint DEFAULT 0 COMMENT '父菜单ID',
  `order_num` int DEFAULT 0 COMMENT '显示顺序',
  `path` varchar(200) DEFAULT '' COMMENT '路由地址',
  `component` varchar(255) DEFAULT NULL COMMENT '组件路径',
  `is_frame` int DEFAULT 1 COMMENT '是否为外链(0是 1否)',
  `menu_type` char(1) DEFAULT '' COMMENT '菜单类型(M目录 C菜单 F按钮)',
  `visible` char(1) DEFAULT '0' COMMENT '菜单状态(0显示 1隐藏)',
  `status` char(1) DEFAULT '0' COMMENT '菜单状态(0正常 1停用)',
  `perms` varchar(100) DEFAULT NULL COMMENT '权限标识',
  `icon` varchar(100) DEFAULT '#' COMMENT '菜单图标',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` varchar(500) DEFAULT '' COMMENT '备注',
  PRIMARY KEY (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单权限表';

-- 用户和角色关联表
CREATE TABLE IF NOT EXISTS `sys_user_role` (
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `role_id` bigint NOT NULL COMMENT '角色ID',
  PRIMARY KEY (`user_id`,`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户和角色关联表';

-- 角色和菜单关联表
CREATE TABLE IF NOT EXISTS `sys_role_menu` (
  `role_id` bigint NOT NULL COMMENT '角色ID',
  `menu_id` bigint NOT NULL COMMENT '菜单ID',
  PRIMARY KEY (`role_id`,`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色和菜单关联表';

-- 岗位表
CREATE TABLE IF NOT EXISTS `sys_post` (
  `post_id` bigint NOT NULL AUTO_INCREMENT COMMENT '岗位ID',
  `post_code` varchar(64) NOT NULL COMMENT '岗位编码',
  `post_name` varchar(50) NOT NULL COMMENT '岗位名称',
  `post_level` int DEFAULT 1 COMMENT '岗位级别',
  `post_sort` int DEFAULT 0 COMMENT '显示顺序',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态(0正常 1停用)',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`post_id`),
  UNIQUE KEY `uk_post_code` (`post_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位表';

-- 预置岗位数据
INSERT INTO `sys_post` (`post_id`, `post_code`, `post_name`, `post_level`, `post_sort`, `status`, `create_by`, `create_time`) VALUES
(1, 'POST001', '总经理', 1, 1, '0', 'system', NOW()),
(2, 'POST002', '部门经理', 2, 2, '0', 'system', NOW()),
(3, 'POST003', '项目经理', 3, 3, '0', 'system', NOW()),
(4, 'POST004', '技术总监', 3, 4, '0', 'system', NOW()),
(5, 'POST005', '高级工程师', 4, 5, '0', 'system', NOW()),
(6, 'POST006', '工程师', 4, 6, '0', 'system', NOW()),
(7, 'POST007', '初级工程师', 4, 7, '0', 'system', NOW()),
(8, 'POST008', '人事专员', 3, 8, '0', 'system', NOW()),
(9, 'POST009', '行政专员', 4, 9, '0', 'system', NOW()),
(10, 'POST010', '财务专员', 3, 10, '0', 'system', NOW()),
(11, 'POST011', '商务专员', 4, 11, '0', 'system', NOW()),
(12, 'POST012', '实习生', 5, 12, '0', 'system', NOW());

-- 员工表
CREATE TABLE IF NOT EXISTS `sys_employee` (
  `employee_id` bigint NOT NULL AUTO_INCREMENT COMMENT '员工ID',
  `employee_no` varchar(50) DEFAULT NULL COMMENT '员工工号',
  `name` varchar(100) NOT NULL COMMENT '姓名',
  `gender` char(1) DEFAULT NULL COMMENT '性别',
  `phone` varchar(20) NOT NULL COMMENT '手机号',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `dept_id` bigint DEFAULT NULL COMMENT '部门ID',
  `position` varchar(100) DEFAULT NULL COMMENT '职位',
  `user_id` bigint DEFAULT NULL COMMENT '关联用户ID',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态(0在职 1离职)',
  `hire_date` datetime DEFAULT NULL COMMENT '入职日期',
  `leave_date` datetime DEFAULT NULL COMMENT '离职日期',
  `avatar_color` varchar(20) DEFAULT NULL COMMENT '头像颜色',
  `education` varchar(100) DEFAULT NULL COMMENT '学历',
  `university` varchar(200) DEFAULT NULL COMMENT '毕业院校',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_employee_no` (`employee_no`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  PRIMARY KEY (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='员工表';

-- ------------------------------------------------------------
-- 第二部分：业务表
-- ------------------------------------------------------------

-- 客户表
CREATE TABLE IF NOT EXISTS `biz_customer` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '客户ID',
  `customer_no` varchar(50) NOT NULL COMMENT '客户编号',
  `name` varchar(200) NOT NULL COMMENT '客户名称',
  `contact` varchar(100) DEFAULT NULL COMMENT '联系人',
  `phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `address` text COMMENT '客户地址',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态(0正常 1暂停合作)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_customer_no` (`customer_no`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户表';

-- 项目表
CREATE TABLE IF NOT EXISTS `biz_project` (
  `project_id` bigint NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `project_code` varchar(50) NOT NULL COMMENT '项目编号',
  `project_name` varchar(200) NOT NULL COMMENT '项目名称',
  `project_type` varchar(50) DEFAULT 'domestic' COMMENT '项目类型(domestic国内/overseas海外)',
  `country` varchar(100) DEFAULT NULL COMMENT '所属国家',
  `address` varchar(500) DEFAULT NULL COMMENT '详细地址',
  `attachments` text COMMENT '附件(JSON)',
  `customer_id` bigint DEFAULT NULL COMMENT '客户ID',
  `manager_id` bigint DEFAULT NULL COMMENT '项目经理ID',
  `status` char(1) NOT NULL DEFAULT '1' COMMENT '状态(0筹备中 1进行中 2已完成 3已终止)',
  `start_date` datetime NOT NULL COMMENT '开始日期',
  `end_date` datetime DEFAULT NULL COMMENT '结束日期',
  `budget` decimal(15,2) DEFAULT 0.00 COMMENT '预算金额(万元)',
  `description` text COMMENT '项目描述',
  `progress` int DEFAULT 0 COMMENT '项目进度(0-100)',
  `building_area` decimal(12,2) DEFAULT NULL COMMENT '建筑面积(m²)',
  `cabinet_count` int DEFAULT NULL COMMENT '机柜数量',
  `cabinet_power` decimal(8,2) DEFAULT NULL COMMENT '单机柜功率(KW)',
  `fire_architecture` text COMMENT '消防架构',
  `hvac_architecture` text COMMENT '暖通架构',
  `it_capacity` decimal(10,2) DEFAULT NULL COMMENT 'IT容量(MW)',
  `power_architecture` text COMMENT '供电架构',
  `weak_electric_architecture` text COMMENT '弱电架构',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  UNIQUE KEY `uk_project_code` (`project_code`),
  KEY `idx_customer_id` (`customer_id`),
  PRIMARY KEY (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目表';

-- 项目成员表
CREATE TABLE IF NOT EXISTS `biz_project_member` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `project_id` bigint NOT NULL COMMENT '项目ID',
  `employee_id` bigint NOT NULL COMMENT '员工ID',
  `role_type` varchar(50) DEFAULT NULL COMMENT '在项目中的角色',
  `join_date` datetime DEFAULT NULL COMMENT '加入日期',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目成员表';

-- 项目里程碑表
CREATE TABLE IF NOT EXISTS `biz_project_milestone` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '里程碑ID',
  `project_id` bigint NOT NULL COMMENT '项目ID',
  `milestone_name` varchar(200) NOT NULL COMMENT '里程碑名称',
  `planned_date` datetime DEFAULT NULL COMMENT '计划完成日期',
  `actual_date` datetime DEFAULT NULL COMMENT '实际完成日期',
  `status` char(1) DEFAULT '0' COMMENT '状态(0未完成 1已完成)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY `idx_project_id` (`project_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目里程碑表';

-- 项目费用表
CREATE TABLE IF NOT EXISTS `biz_project_expense` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '费用ID',
  `project_id` bigint NOT NULL COMMENT '项目ID',
  `expense_type` varchar(50) DEFAULT NULL COMMENT '费用类型',
  `amount` decimal(15,2) DEFAULT NULL COMMENT '金额',
  `expense_date` datetime DEFAULT NULL COMMENT '费用日期',
  `description` varchar(500) DEFAULT NULL COMMENT '费用说明',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  KEY `idx_project_id` (`project_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目费用表';

-- 项目风险表
CREATE TABLE IF NOT EXISTS `biz_project_risk` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '风险ID',
  `project_id` bigint NOT NULL COMMENT '项目ID',
  `risk_name` varchar(200) NOT NULL COMMENT '风险名称',
  `risk_level` varchar(20) DEFAULT 'medium' COMMENT '风险等级(high/medium/low)',
  `probability` varchar(20) DEFAULT 'medium' COMMENT '发生概率(high/medium/low)',
  `impact` varchar(20) DEFAULT 'medium' COMMENT '影响程度(high/medium/low)',
  `mitigation` text COMMENT '应对措施',
  `status` char(1) DEFAULT '0' COMMENT '状态(0开放 1已解决)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY `idx_project_id` (`project_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目风险表';

-- 项目汇报表
CREATE TABLE IF NOT EXISTS `biz_project_report` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '汇报ID',
  `project_id` bigint NOT NULL COMMENT '项目ID',
  `report_type` varchar(50) DEFAULT 'weekly' COMMENT '汇报类型(weekly周报/monthly月报/milestone里程碑)',
  `report_date` datetime DEFAULT NULL COMMENT '汇报日期',
  `progress` int DEFAULT 0 COMMENT '完成进度(0-100)',
  `content` text COMMENT '汇报内容',
  `next_plan` text COMMENT '下周计划',
  `issues` text COMMENT '问题与阻塞',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY `idx_project_id` (`project_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目汇报表';

-- 项目人员配置表
CREATE TABLE IF NOT EXISTS `biz_project_staffing_plan` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `project_id` bigint NOT NULL COMMENT '项目ID',
  `position_name` varchar(100) NOT NULL COMMENT '岗位名称',
  `quantity` int DEFAULT 1 COMMENT '需求人数',
  `skills` varchar(500) DEFAULT NULL COMMENT '技能要求',
  `status` char(1) DEFAULT '0' COMMENT '状态(0待招聘 1招聘中 2已到位)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY `idx_project_id` (`project_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目人员配置表';

-- 业务任务表
CREATE TABLE IF NOT EXISTS `biz_task` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `project_id` bigint DEFAULT NULL COMMENT '项目ID',
  `task_name` varchar(200) NOT NULL COMMENT '任务名称',
  `task_type` varchar(50) DEFAULT NULL COMMENT '任务类型',
  `assignee_id` bigint DEFAULT NULL COMMENT '负责人ID',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态(0待开始 1进行中 2已完成 3已取消)',
  `priority` char(1) DEFAULT 'normal' COMMENT '优先级(high/normal/low)',
  `planned_start` datetime DEFAULT NULL COMMENT '计划开始时间',
  `planned_end` datetime DEFAULT NULL COMMENT '计划结束时间',
  `actual_start` datetime DEFAULT NULL COMMENT '实际开始时间',
  `actual_end` datetime DEFAULT NULL COMMENT '实际结束时间',
  `description` text COMMENT '任务描述',
  `progress` int DEFAULT 0 COMMENT '完成进度(0-100)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  KEY `idx_project_id` (`project_id`),
  KEY `idx_assignee_id` (`assignee_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='业务任务表';

-- 设备表
CREATE TABLE IF NOT EXISTS `biz_equipment` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '设备ID',
  `equipment_no` varchar(50) NOT NULL COMMENT '设备编号',
  `equipment_name` varchar(200) NOT NULL COMMENT '设备名称',
  `equipment_type` varchar(50) DEFAULT NULL COMMENT '设备类型',
  `specification` varchar(200) DEFAULT NULL COMMENT '规格型号',
  `manufacturer` varchar(200) DEFAULT NULL COMMENT '生产厂家',
  `purchase_date` datetime DEFAULT NULL COMMENT '购买日期',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态(0库存 1使用中 2维修中 3已报废)',
  `location` varchar(200) DEFAULT NULL COMMENT '当前位置',
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  UNIQUE KEY `uk_equipment_no` (`equipment_no`),
  KEY `idx_project_id` (`project_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备表';

-- 设备调拨记录表
CREATE TABLE IF NOT EXISTS `biz_equipment_transfer` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '调拨ID',
  `equipment_id` bigint NOT NULL COMMENT '设备ID',
  `transfer_no` varchar(50) NOT NULL COMMENT '调拨单号',
  `from_location` varchar(200) DEFAULT NULL COMMENT '调出地点',
  `to_location` varchar(200) DEFAULT NULL COMMENT '调入地点',
  `from_project_id` bigint DEFAULT NULL COMMENT '调出项目ID',
  `to_project_id` bigint DEFAULT NULL COMMENT '调入项目ID',
  `transfer_date` datetime DEFAULT NULL COMMENT '调拨日期',
  `handler_id` bigint DEFAULT NULL COMMENT '经办人ID',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态(0待审批 1已发货 2已收货 3已取消)',
  `shipping_time` datetime DEFAULT NULL COMMENT '发货时间',
  `receiving_time` datetime DEFAULT NULL COMMENT '收货时间',
  `remark` text COMMENT '备注',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  UNIQUE KEY `uk_transfer_no` (`transfer_no`),
  KEY `idx_equipment_id` (`equipment_id`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备调拨记录表';

-- ------------------------------------------------------------
-- 第三部分：工作流核心表 (基于 Warm-Flow)
-- ------------------------------------------------------------

-- 流程定义表
CREATE TABLE IF NOT EXISTS `flow_definition` (
  `id` bigint NOT NULL COMMENT '主键ID',
  `flow_code` varchar(40) NOT NULL COMMENT '流程编码',
  `flow_name` varchar(100) NOT NULL COMMENT '流程名称',
  `model_value` varchar(40) NOT NULL DEFAULT 'CLASSICS' COMMENT '设计器模型',
  `category` varchar(100) DEFAULT NULL COMMENT '流程类别',
  `version` varchar(20) NOT NULL COMMENT '流程版本',
  `is_publish` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否发布(0未发布 1已发布 9失效)',
  `form_custom` char(1) DEFAULT 'N' COMMENT '审批表单是否自定义(Y是 N否)',
  `form_path` varchar(100) DEFAULT NULL COMMENT '审批表单路径',
  `activity_status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '流程激活状态(0挂起 1激活)',
  `listener_type` varchar(100) DEFAULT NULL COMMENT '监听器类型',
  `listener_path` varchar(400) DEFAULT NULL COMMENT '监听器路径',
  `ext` varchar(500) DEFAULT NULL COMMENT '业务详情JSON',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `tenant_id` varchar(40) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程定义表';

-- 流程节点表
CREATE TABLE IF NOT EXISTS `flow_node` (
  `id` bigint NOT NULL COMMENT '主键ID',
  `node_type` tinyint(1) NOT NULL COMMENT '节点类型(0开始 1中间 2结束 3互斥网关 4并行网关)',
  `definition_id` bigint NOT NULL COMMENT '流程定义ID',
  `node_code` varchar(100) NOT NULL COMMENT '流程节点编码',
  `node_name` varchar(100) DEFAULT NULL COMMENT '流程节点名称',
  `permission_flag` varchar(200) DEFAULT NULL COMMENT '权限标识(权限类型:权限标识)',
  `node_ratio` decimal(6,3) DEFAULT NULL COMMENT '流程签署比例值',
  `coordinate` varchar(100) DEFAULT NULL COMMENT '坐标',
  `any_node_skip` varchar(100) DEFAULT NULL COMMENT '任意结点跳转',
  `listener_type` varchar(100) DEFAULT NULL COMMENT '监听器类型',
  `listener_path` varchar(400) DEFAULT NULL COMMENT '监听器路径',
  `handler_type` varchar(100) DEFAULT NULL COMMENT '处理器类型',
  `handler_path` varchar(400) DEFAULT NULL COMMENT '处理器路径',
  `form_custom` char(1) DEFAULT 'N' COMMENT '审批表单是否自定义',
  `form_path` varchar(100) DEFAULT NULL COMMENT '审批表单路径',
  `version` varchar(20) NOT NULL COMMENT '版本',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `ext` text COMMENT '节点扩展属性',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `tenant_id` varchar(40) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程节点表';

-- 节点跳转关联表
CREATE TABLE IF NOT EXISTS `flow_skip` (
  `id` bigint NOT NULL COMMENT '主键ID',
  `definition_id` bigint NOT NULL COMMENT '流程定义ID',
  `now_node_code` varchar(100) NOT NULL COMMENT '当前流程节点编码',
  `now_node_type` tinyint(1) DEFAULT NULL COMMENT '当前节点类型',
  `next_node_code` varchar(100) NOT NULL COMMENT '下一个流程节点编码',
  `next_node_type` tinyint(1) DEFAULT NULL COMMENT '下一个节点类型',
  `skip_name` varchar(100) DEFAULT NULL COMMENT '跳转名称',
  `skip_type` varchar(40) DEFAULT NULL COMMENT '跳转类型(PASS审批通过 REJECT退回)',
  `skip_condition` varchar(200) DEFAULT NULL COMMENT '跳转条件',
  `coordinate` varchar(100) DEFAULT NULL COMMENT '坐标',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `tenant_id` varchar(40) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='节点跳转关联表';

-- 流程实例表
CREATE TABLE IF NOT EXISTS `flow_instance` (
  `id` bigint NOT NULL COMMENT '主键ID',
  `definition_id` bigint NOT NULL COMMENT '对应flow_definition表的ID',
  `business_id` varchar(40) NOT NULL COMMENT '业务ID',
  `node_type` tinyint(1) NOT NULL COMMENT '节点类型(0开始 1中间 2结束)',
  `node_code` varchar(40) NOT NULL COMMENT '流程节点编码',
  `node_name` varchar(100) DEFAULT NULL COMMENT '流程节点名称',
  `variable` text COMMENT '任务变量',
  `flow_status` varchar(20) NOT NULL COMMENT '流程状态(running进行中 finished已完成 rejected已驳回)',
  `activity_status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '流程激活状态(0挂起 1激活)',
  `def_json` text COMMENT '流程定义JSON',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `ext` text COMMENT '扩展字段',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `tenant_id` varchar(40) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程实例表';

-- 待办任务表
CREATE TABLE IF NOT EXISTS `flow_task` (
  `id` bigint NOT NULL COMMENT '主键ID',
  `definition_id` bigint NOT NULL COMMENT '对应flow_definition表的ID',
  `instance_id` bigint NOT NULL COMMENT '对应flow_instance表的ID',
  `node_code` varchar(100) NOT NULL COMMENT '节点编码',
  `node_name` varchar(100) DEFAULT NULL COMMENT '节点名称',
  `node_type` tinyint(1) NOT NULL COMMENT '节点类型(0开始 1中间 2结束)',
  `flow_status` varchar(20) NOT NULL COMMENT '任务状态(todo待处理)',
  `form_custom` char(1) DEFAULT 'N' COMMENT '审批表单是否自定义',
  `form_path` varchar(100) DEFAULT NULL COMMENT '审批表单路径',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `tenant_id` varchar(40) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='待办任务表';

-- 历史任务记录表
CREATE TABLE IF NOT EXISTS `flow_his_task` (
  `id` bigint NOT NULL COMMENT '主键ID',
  `definition_id` bigint NOT NULL COMMENT '对应flow_definition表的ID',
  `instance_id` bigint NOT NULL COMMENT '对应flow_instance表的ID',
  `task_id` bigint NOT NULL COMMENT '对应flow_task表的ID',
  `node_code` varchar(100) DEFAULT NULL COMMENT '开始节点编码',
  `node_name` varchar(100) DEFAULT NULL COMMENT '开始节点名称',
  `node_type` tinyint(1) DEFAULT NULL COMMENT '开始节点类型',
  `target_node_code` varchar(200) DEFAULT NULL COMMENT '目标节点编码',
  `target_node_name` varchar(200) DEFAULT NULL COMMENT '结束节点名称',
  `approver` varchar(40) DEFAULT NULL COMMENT '审批人',
  `cooperate_type` smallint NOT NULL DEFAULT 0 COMMENT '协作方式(1审批 2转办 3委派 4会签 5票签 6加签 7减签)',
  `collaborator` varchar(500) DEFAULT NULL COMMENT '协作人',
  `skip_type` varchar(10) NOT NULL COMMENT '流转类型(PASS通过 REJECT退回 NONE无动作 auto_skip自动跳过)',
  `flow_status` varchar(20) NOT NULL COMMENT '流程状态',
  `form_custom` char(1) DEFAULT 'N' COMMENT '审批表单是否自定义',
  `form_path` varchar(100) DEFAULT NULL COMMENT '审批表单路径',
  `message` varchar(500) DEFAULT NULL COMMENT '审批意见',
  `variable` text COMMENT '任务变量',
  `ext` text COMMENT '业务详情JSON',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '任务开始时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '审批完成时间',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `tenant_id` varchar(40) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='历史任务记录表';

-- 流程用户表
CREATE TABLE IF NOT EXISTS `flow_user` (
  `id` bigint NOT NULL COMMENT '主键ID',
  `type` char(1) NOT NULL COMMENT '人员类型(1待办审批人 2转办人 3委托人)',
  `processed_by` varchar(80) DEFAULT NULL COMMENT '权限人',
  `associated` bigint NOT NULL COMMENT '关联任务ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `tenant_id` varchar(40) DEFAULT NULL COMMENT '租户ID',
  PRIMARY KEY (`id`),
  KEY `user_processed_type` (`processed_by`, `type`),
  KEY `user_associated_idx` (`associated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程用户表';

-- ------------------------------------------------------------
-- 第四部分：通知表
-- ------------------------------------------------------------

-- 系统通知表
CREATE TABLE IF NOT EXISTS `sys_notification` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `user_id` varchar(64) NOT NULL COMMENT '通知用户ID',
  `title` varchar(200) NOT NULL COMMENT '通知标题',
  `content` text COMMENT '通知内容',
  `type` varchar(20) NOT NULL DEFAULT 'workflow' COMMENT '通知类型(workflow工作流 system系统)',
  `priority` varchar(20) NOT NULL DEFAULT 'normal' COMMENT '优先级(high高 normal普通 low低)',
  `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已读(0未读 1已读)',
  `action_url` varchar(500) DEFAULT NULL COMMENT '点击跳转URL',
  `related_id` varchar(100) DEFAULT NULL COMMENT '关联业务ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  PRIMARY KEY (`id`),
  KEY `notif_user_read_idx` (`user_id`, `is_read`),
  KEY `notif_create_time_idx` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统通知表';

-- ------------------------------------------------------------
-- 第五部分：工作流种子数据
-- ------------------------------------------------------------

-- 预置角色数据
INSERT INTO `sys_role` (`role_id`, `role_name`, `role_key`, `role_sort`, `data_scope`, `status`, `del_flag`, `remark`) VALUES
(1, '超级管理员', 'admin', 1, '1', '0', '0', '系统超级管理员'),
(2, '总经理', 'general_manager', 2, '1', '0', '0', '总经理角色'),
(3, '部门经理', 'dept_manager', 3, '2', '0', '0', '部门经理角色'),
(4, '人事专员', 'hr', 4, '2', '0', '0', '人事专员角色'),
(5, '项目经理', 'project_manager', 5, '2', '0', '0', '项目经理角色'),
(6, '普通员工', 'employee', 6, '5', '0', '0', '普通员工角色');

-- 预置测试用户 (密码均为 Cxwell-2026-01)
INSERT INTO `sys_user` (`user_id`, `login_name`, `user_name`, `user_type`, `password`, `salt`, `status`, `del_flag`) VALUES
(1, 'admin', '系统管理员', '00', '$2b$10$5isxXfcKK.zTmYFre3F7jO/zYaB.XR3Fj2HaLb96V5UsOmcymZG2m', 'Cxwell202601', '0', '0'),
(2, 'gm001', '张三', '00', '$2b$10$5isxXfcKK.zTmYFre3F7jO/zYaB.XR3Fj2HaLb96V5UsOmcymZG2m', 'Cxwell202601', '0', '0'),
(3, 'dm001', '李四', '00', '$2b$10$5isxXfcKK.zTmYFre3F7jO/zYaB.XR3Fj2HaLb96V5UsOmcymZG2m', 'Cxwell202601', '0', '0'),
(4, 'hr001', '王五', '00', '$2b$10$5isxXfcKK.zTmYFre3F7jO/zYaB.XR3Fj2HaLb96V5UsOmcymZG2m', 'Cxwell202601', '0', '0'),
(5, 'pm001', '赵六', '00', '$2b$10$5isxXfcKK.zTmYFre3F7jO/zYaB.XR3Fj2HaLb96V5UsOmcymZG2m', 'Cxwell202601', '0', '0');

-- 用户角色关联
INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES
(1, 1), (1, 2), -- admin 同时拥有 admin 和 general_manager 角色
(2, 2), -- 张三 - 总经理
(3, 3), -- 李四 - 部门经理
(4, 4), -- 王五 - 人事专员
(5, 5); -- 赵六 - 项目经理

-- 预置部门
INSERT INTO `sys_dept` (`dept_id`, `parent_id`, `ancestors`, `dept_name`, `order_num`, `status`, `del_flag`) VALUES
(1, 0, '0', '汇升智合科技有限公司', 0, '0', '0'),
(100, 1, '0,1', '总经办', 1, '0', '0'),
(101, 1, '0,1', '技术部', 2, '0', '0'),
(102, 1, '0,1', '人事部', 3, '0', '0'),
(103, 1, '0,1', '商务部', 4, '0', '0');

-- 预置员工数据
INSERT INTO `sys_employee` (`employee_id`, `employee_no`, `name`, `gender`, `phone`, `email`, `dept_id`, `position`, `user_id`, `status`, `hire_date`, `avatar_color`) VALUES
(1, 'EMP001', '系统管理员', '0', '13800000000', 'admin@cxwell.com', 1, '系统管理员', 1, '0', NOW(), '#3b82f6'),
(2, 'EMP002', '张三', '0', '13800000001', 'gm@cxwell.com', 100, '总经理', 2, '0', NOW(), '#10b981'),
(3, 'EMP003', '李四', '0', '13800000002', 'dm@cxwell.com', 101, '部门经理', 3, '0', NOW(), '#f59e0b'),
(4, 'EMP004', '王五', '1', '13800000003', 'hr@cxwell.com', 102, '人事专员', 4, '0', NOW(), '#ec4899'),
(5, 'EMP005', '赵六', '0', '13800000004', 'pm@cxwell.com', 101, '项目经理', 5, '0', NOW(), '#8b5cf6');

-- ------------------------------------------------------------
-- 预置流程定义1: 人员入职审批流 (ID: 20240419001)
-- ------------------------------------------------------------
INSERT INTO `flow_definition` (`id`, `flow_code`, `flow_name`, `version`, `is_publish`, `category`, `create_by`, `create_time`, `ext`) VALUES
(20240419001, 'employee_onboarding', '人员入职审批流', '1.0', 1, 'personnel', 'system', NOW(), '{"form_schema":[{"name":"employeeName","label":"姓名","type":"text","required":true,"placeholder":"请输入员工姓名","group":"基本信息"},{"name":"gender","label":"性别","type":"select","required":true,"options":[{"label":"男","value":"male"},{"label":"女","value":"female"}],"group":"基本信息"},{"name":"phone","label":"手机号","type":"text","required":true,"placeholder":"请输入手机号","group":"基本信息"},{"name":"email","label":"邮箱","type":"text","required":false,"placeholder":"请输入邮箱","group":"基本信息"},{"name":"education","label":"学历","type":"select","required":false,"options":[{"label":"初中","value":"junior_high"},{"label":"高中","value":"high_school"},{"label":"中专","value":"secondary"},{"label":"大专","value":"associate"},{"label":"本科","value":"bachelor"},{"label":"硕士","value":"master"},{"label":"博士","value":"doctoral"}],"group":"教育背景"},{"name":"university","label":"就读大学","type":"text","required":false,"placeholder":"请输入毕业院校名称","group":"教育背景"},{"name":"departmentId","label":"入职部门","type":"select","required":true,"placeholder":"请选择入职部门","dynamicOptions":"department","group":"入职岗位信息"},{"name":"position","label":"入职岗位","type":"select","required":true,"placeholder":"请选择岗位","dynamicOptions":"post","group":"入职岗位信息"},{"name":"employeeType","label":"员工性质","type":"select","required":true,"options":[{"label":"正式","value":"regular"},{"label":"实习","value":"intern"},{"label":"外包","value":"outsourced"}],"group":"入职岗位信息"},{"name":"startDate","label":"入职日期","type":"date","required":true,"group":"入职岗位信息"},{"name":"description","label":"备注","type":"textarea","required":false,"placeholder":"请输入备注信息","rows":3,"group":"补充说明"}]}');

-- 节点: 开始 → 总经理审批 → 人事处理(服务节点-创建员工) → 结束
INSERT INTO `flow_node` (`id`, `node_type`, `definition_id`, `node_code`, `node_name`, `permission_flag`, `handler_type`, `handler_path`, `version`, `create_time`) VALUES
(1001, 0, 20240419001, 'start', '开始', 'role:admin', NULL, NULL, '1.0', NOW()),
(1002, 1, 20240419001, 'gm_approve', '总经理审批', 'role:general_manager', NULL, NULL, '1.0', NOW()),
(1003, 1, 20240419001, 'hr_approve', '人事处理', NULL, 'service', 'employee-onboarding', '1.0', NOW()),
(1004, 2, 20240419001, 'end', '结束', '', NULL, NULL, '1.0', NOW());

-- 跳转规则
INSERT INTO `flow_skip` (`id`, `definition_id`, `now_node_code`, `next_node_code`, `skip_name`, `skip_type`, `create_time`) VALUES
(2001, 20240419001, 'start', 'gm_approve', '提交申请', 'pass', NOW()),
(2002, 20240419001, 'gm_approve', 'hr_approve', '同意', 'pass', NOW()),
(2003, 20240419001, 'gm_approve', 'start', '驳回', 'reject', NOW()),
(2004, 20240419001, 'hr_approve', 'end', '归档', 'pass', NOW()),
(2005, 20240419001, 'hr_approve', 'gm_approve', '退回重审', 'reject', NOW());

-- ------------------------------------------------------------
-- 预置流程定义2: 项目立项审批流 (ID: 20240419002)
-- ------------------------------------------------------------
INSERT INTO `flow_definition` (`id`, `flow_code`, `flow_name`, `version`, `is_publish`, `category`, `create_by`, `create_time`, `ext`) VALUES
(20240419002, 'project_approval', '项目立项审批流', '1.0', 1, 'project', 'system', NOW(), '{"form_schema":[{"name":"projectName","label":"项目名称","type":"text","required":true},{"name":"projectType","label":"项目类型","type":"select","options":[{"label":"国内项目","value":"domestic"},{"label":"海外项目","value":"overseas"}]},{"name":"managerId","label":"项目经理","type":"select","dynamicOptions":"employee"},{"name":"startDate","label":"开始日期","type":"date"},{"name":"budget","label":"预算金额(万元)","type":"number"},{"name":"description","label":"项目描述","type":"textarea"}]}');

-- 节点: 开始 → 部门经理审批 → 总经理审批 → 项目创建(服务节点) → 结束
INSERT INTO `flow_node` (`id`, `node_type`, `definition_id`, `node_code`, `node_name`, `permission_flag`, `handler_type`, `handler_path`, `version`, `create_time`) VALUES
(3001, 0, 20240419002, 'start', '提交申请', 'role:admin', NULL, NULL, '1.0', NOW()),
(3002, 1, 20240419002, 'dept_manager_approve', '部门经理审批', 'role:general_manager', NULL, NULL, '1.0', NOW()),
(3003, 1, 20240419002, 'gm_approve', '总经理审批', 'role:admin', NULL, NULL, '1.0', NOW()),
(3004, 1, 20240419002, 'create_project', '项目创建', NULL, 'service', 'project-approval', '1.0', NOW()),
(3005, 2, 20240419002, 'end', '审批通过', '', NULL, NULL, '1.0', NOW());

-- 跳转规则
INSERT INTO `flow_skip` (`id`, `definition_id`, `now_node_code`, `next_node_code`, `skip_name`, `skip_type`, `create_time`) VALUES
(4001, 20240419002, 'start', 'dept_manager_approve', '提交申请', 'pass', NOW()),
(4002, 20240419002, 'dept_manager_approve', 'gm_approve', '同意(需总经理)', 'pass', NOW()),
(4003, 20240419002, 'dept_manager_approve', 'end', '同意(直接通过)', 'reject', NOW()),
(4004, 20240419002, 'dept_manager_approve', 'start', '驳回', 'reject', NOW()),
(4005, 20240419002, 'gm_approve', 'create_project', '同意', 'pass', NOW()),
(4006, 20240419002, 'gm_approve', 'start', '驳回', 'reject', NOW()),
(4007, 20240419002, 'create_project', 'end', '完成', 'pass', NOW());

-- ============================================================
-- 脚本执行完成
-- 如需验证，可执行以下查询:
-- SELECT COUNT(*) FROM flow_definition; -- 应返回 2
-- SELECT COUNT(*) FROM flow_node;      -- 应返回 8
-- SELECT COUNT(*) FROM flow_skip;      -- 应返回 11
-- SELECT COUNT(*) FROM sys_notification; -- 应返回 0 (空表)
-- ============================================================
