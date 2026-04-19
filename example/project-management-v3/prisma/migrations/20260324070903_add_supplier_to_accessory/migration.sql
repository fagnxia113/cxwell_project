-- CreateTable
CREATE TABLE `approval_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_type` ENUM('equip_transfer', 'person_transfer', 'purchase', 'leave') NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `target_id` VARCHAR(36) NULL,
    `from_id` VARCHAR(36) NULL,
    `to_id` VARCHAR(36) NULL,
    `form_data` JSON NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'withdrawn') NULL DEFAULT 'pending',
    `wecom_sp_no` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_records` (
    `id` VARCHAR(36) NOT NULL,
    `employee_id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NULL,
    `date` DATE NOT NULL,
    `check_in_time` DATETIME(0) NULL,
    `check_in_location_name` VARCHAR(255) NULL,
    `check_in_latitude` DECIMAL(10, 8) NULL,
    `check_in_longitude` DECIMAL(11, 8) NULL,
    `check_in_photo` TEXT NULL,
    `check_in_status` ENUM('normal', 'late', 'outside') NULL DEFAULT 'normal',
    `check_out_time` DATETIME(0) NULL,
    `check_out_location_name` VARCHAR(255) NULL,
    `check_out_latitude` DECIMAL(10, 8) NULL,
    `check_out_longitude` DECIMAL(11, 8) NULL,
    `check_out_photo` TEXT NULL,
    `check_out_status` ENUM('normal', 'early_leave', 'outside') NULL DEFAULT 'normal',
    `work_status` ENUM('on_duty', 'off', 'leave', 'business_trip', 'overtime') NULL DEFAULT 'off',
    `is_verified` BOOLEAN NULL DEFAULT false,
    `verified_by` VARCHAR(36) NULL,
    `verified_at` DATETIME(0) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_date`(`date`),
    INDEX `idx_project`(`project_id`),
    INDEX `idx_status`(`work_status`),
    UNIQUE INDEX `uk_emp_date`(`employee_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_weekly_approvals` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `week_start_date` DATE NOT NULL,
    `week_end_date` DATE NOT NULL,
    `approver_id` VARCHAR(36) NOT NULL,
    `status` ENUM('pending', 'approved', 'archived') NULL DEFAULT 'pending',
    `summary_json` JSON NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_proj_week`(`project_id`, `week_start_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(36) NOT NULL,
    `customer_no` VARCHAR(50) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `contact` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `address` TEXT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `type` ENUM('enterprise', 'government', 'research', 'direct', 'channel', 'agent') NULL DEFAULT 'enterprise',

    UNIQUE INDEX `customer_no`(`customer_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_reports` (
    `id` VARCHAR(36) NOT NULL,
    `employee_id` VARCHAR(36) NOT NULL,
    `report_date` DATE NOT NULL,
    `summary` TEXT NOT NULL,
    `plan` TEXT NULL,
    `problems` TEXT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NULL DEFAULT 'pending',
    `reviewer_id` VARCHAR(36) NULL,
    `reviewed_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `checkload_items` JSON NULL,
    `attendance_id` VARCHAR(36) NULL,

    INDEX `idx_daily_reports_report_date`(`report_date`),
    INDEX `idx_daily_reports_status`(`status`),
    INDEX `idx_employee`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `parent_id` VARCHAR(36) NULL,
    `manager_id` VARCHAR(36) NULL,
    `manager_name` VARCHAR(100) NULL,
    `level` INTEGER NULL DEFAULT 1,
    `path` VARCHAR(500) NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NULL DEFAULT 'active',
    `description` TEXT NULL,
    `third_party_id` VARCHAR(100) NULL,
    `third_party_source` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `code`(`code`),
    INDEX `idx_departments_parent_id`(`parent_id`),
    INDEX `idx_departments_status`(`status`),
    INDEX `idx_level`(`level`),
    INDEX `idx_manager`(`manager_id`),
    INDEX `idx_parent`(`parent_id`),
    INDEX `idx_status`(`status`),
    INDEX `idx_third_party`(`third_party_id`, `third_party_source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_offboard_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `employee_id` VARCHAR(36) NOT NULL,
    `employee_name` VARCHAR(100) NULL,
    `department` VARCHAR(100) NULL,
    `position` VARCHAR(100) NULL,
    `hire_date` DATE NULL,
    `offboard_type` ENUM('voluntary', 'involuntary', 'contract_end') NOT NULL,
    `offboard_reason` TEXT NOT NULL,
    `expected_offboard_date` DATE NOT NULL,
    `handover_person_id` VARCHAR(36) NULL,
    `handover_person` VARCHAR(100) NULL,
    `actual_offboard_date` DATE NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_employee`(`employee_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_onboard_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `gender` ENUM('male', 'female') NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NULL,
    `id_card` VARCHAR(18) NOT NULL,
    `department` VARCHAR(100) NOT NULL,
    `position` VARCHAR(100) NOT NULL,
    `hire_date` DATE NOT NULL,
    `employee_type` ENUM('full_time', 'intern', 'outsource') NOT NULL,
    `employee_no` VARCHAR(50) NULL,
    `created_employee_id` VARCHAR(36) NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_department`(`department`),
    INDEX `idx_employee_onboard_orders_order_no`(`order_no`),
    INDEX `idx_employee_onboard_orders_status`(`status`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_transfer_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `employee_id` VARCHAR(36) NOT NULL,
    `employee_name` VARCHAR(100) NULL,
    `from_department` VARCHAR(100) NULL,
    `from_position` VARCHAR(100) NULL,
    `transfer_type` ENUM('department', 'branch', 'project') NOT NULL,
    `to_department` VARCHAR(100) NOT NULL,
    `to_position` VARCHAR(100) NOT NULL,
    `transfer_reason` TEXT NOT NULL,
    `effective_date` DATE NOT NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_employee`(`employee_id`),
    INDEX `idx_employee_transfer_orders_employee`(`employee_id`),
    INDEX `idx_employee_transfer_orders_order_no`(`order_no`),
    INDEX `idx_employee_transfer_orders_status`(`status`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` VARCHAR(36) NOT NULL,
    `employee_no` VARCHAR(50) NULL,
    `name` VARCHAR(100) NOT NULL,
    `gender` ENUM('male', 'female') NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) NULL,
    `department_id` VARCHAR(36) NULL,
    `position` VARCHAR(100) NOT NULL,
    `status` ENUM('active', 'resigned', 'probation') NULL DEFAULT 'active',
    `current_status` ENUM('on_duty', 'leave', 'business_trip', 'other') NULL DEFAULT 'on_duty',
    `hire_date` DATE NOT NULL,
    `leave_date` DATE NULL,
    `role` ENUM('admin', 'project_manager', 'hr_manager', 'equipment_manager', 'implementer', 'user') NULL DEFAULT 'user',
    `data_permission` ENUM('all', 'department', 'self') NULL DEFAULT 'self',
    `daily_cost` DECIMAL(10, 2) NULL,
    `skills` JSON NULL,
    `avatar_color` VARCHAR(20) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `user_id` VARCHAR(36) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `employee_no`(`employee_no`),
    INDEX `idx_dept`(`department_id`),
    INDEX `idx_employees_department_status`(`department_id`, `status`),
    INDEX `idx_employees_user_id`(`user_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_accessories` (
    `id` VARCHAR(36) NOT NULL,
    `host_equipment_id` VARCHAR(36) NOT NULL,
    `accessory_id` VARCHAR(36) NOT NULL,
    `accessory_name` VARCHAR(200) NULL,
    `accessory_model` VARCHAR(100) NULL,
    `accessory_category` ENUM('instrument', 'fake_load', 'cable') NULL,
    `quantity` INTEGER NULL DEFAULT 1,
    `is_required` BOOLEAN NULL DEFAULT false,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_accessory`(`accessory_id`),
    INDEX `idx_host_equipment`(`host_equipment_id`),
    UNIQUE INDEX `uk_host_accessory`(`host_equipment_id`, `accessory_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_accessory_instances` (
    `id` VARCHAR(36) NOT NULL,
    `accessory_name` VARCHAR(200) NOT NULL,
    `model_no` VARCHAR(100) NULL,
    `brand` VARCHAR(100) NULL,
    `category` ENUM('instrument', 'fake_load', 'cable') NOT NULL,
    `unit` VARCHAR(20) NULL DEFAULT '个',
    `quantity` INTEGER NULL DEFAULT 1,
    `serial_number` VARCHAR(100) NULL,
    `manage_code` VARCHAR(50) NULL,
    `health_status` ENUM('normal', 'affected', 'broken') NULL DEFAULT 'normal',
    `usage_status` ENUM('idle', 'in_use') NULL DEFAULT 'idle',
    `location_status` ENUM('warehouse', 'in_project', 'repairing', 'transferring') NULL DEFAULT 'warehouse',
    `location_id` VARCHAR(36) NULL,
    `host_equipment_id` VARCHAR(36) NULL,
    `keeper_id` VARCHAR(36) NULL,
    `purchase_date` DATE NULL,
    `purchase_price` DECIMAL(12, 2) NULL,
    `supplier` VARCHAR(200) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `tracking_type` ENUM('SERIALIZED', 'BATCH') NOT NULL DEFAULT 'SERIALIZED',
    `attachments` JSON NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `source_type` ENUM('inbound_bundle', 'inbound_separate') NULL DEFAULT 'inbound_separate',
    `status` ENUM('normal', 'lost', 'damaged') NULL DEFAULT 'normal',
    `bound_at` DATETIME(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `manage_code`(`manage_code`),
    INDEX `idx_accessory_name`(`accessory_name`, `model_no`),
    INDEX `idx_accessory_tracking_type`(`tracking_type`),
    INDEX `idx_host_equipment`(`host_equipment_id`),
    INDEX `idx_location`(`location_status`, `location_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_accessory_lost_records` (
    `id` VARCHAR(36) NOT NULL,
    `accessory_id` VARCHAR(36) NOT NULL,
    `equipment_id` VARCHAR(36) NULL,
    `transfer_order_id` VARCHAR(36) NULL,
    `lost_at` DATETIME(0) NOT NULL,
    `lost_by` VARCHAR(36) NOT NULL,
    `lost_by_name` VARCHAR(100) NULL,
    `lost_reason` TEXT NULL,
    `found_at` DATETIME(0) NULL,
    `found_by` VARCHAR(36) NULL,
    `found_by_name` VARCHAR(100) NULL,
    `status` ENUM('lost', 'found') NULL DEFAULT 'lost',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_accessory`(`accessory_id`),
    INDEX `idx_equipment`(`equipment_id`),
    INDEX `idx_lost_at`(`lost_at`),
    INDEX `idx_status`(`status`),
    INDEX `idx_transfer_order`(`transfer_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_images` (
    `id` VARCHAR(36) NOT NULL,
    `equipment_id` VARCHAR(36) NULL,
    `equipment_name` VARCHAR(200) NULL,
    `model_no` VARCHAR(100) NULL,
    `category` ENUM('instrument', 'fake_load', 'cable') NULL,
    `image_type` ENUM('main', 'accessory', 'transfer_shipping', 'transfer_packed', 'transfer_receiving') NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `image_name` VARCHAR(200) NULL,
    `image_size` INTEGER NULL,
    `image_format` VARCHAR(20) NULL,
    `business_type` ENUM('inbound', 'transfer', 'return', 'repair') NULL,
    `business_id` VARCHAR(36) NULL,
    `uploader_id` VARCHAR(36) NULL,
    `uploader_name` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_business`(`business_type`, `business_id`),
    INDEX `idx_equipment_id`(`equipment_id`),
    INDEX `idx_image_type`(`image_type`),
    INDEX `idx_uploader`(`uploader_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_inbound_items` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `equipment_name` VARCHAR(200) NULL,
    `serial_number` VARCHAR(100) NULL,
    `model_name` VARCHAR(100) NULL,
    `model_no` VARCHAR(100) NULL,
    `manufacturer` VARCHAR(200) NULL,
    `technical_params` TEXT NULL,
    `item_notes` TEXT NULL,
    `brand` VARCHAR(100) NULL,
    `category` VARCHAR(50) NULL,
    `unit` VARCHAR(20) NULL,
    `quantity` INTEGER NULL,
    `purchase_price` DECIMAL(10, 2) NULL,
    `supplier` VARCHAR(200) NULL,
    `serial_numbers` TEXT NULL,
    `certificate_no` VARCHAR(100) NULL,
    `certificate_issuer` VARCHAR(200) NULL,
    `certificate_expiry_date` DATE NULL,
    `accessory_desc` TEXT NULL,
    `technical_doc` TEXT NULL,
    `attachment` VARCHAR(500) NULL,
    `status` ENUM('pending', 'inbound', 'rejected') NULL DEFAULT 'pending',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_order_id`(`order_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_inbound_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `inbound_type` ENUM('purchase', 'other') NULL DEFAULT 'purchase',
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `warehouse_id` VARCHAR(36) NOT NULL,
    `warehouse_name` VARCHAR(200) NULL,
    `equipment_id` VARCHAR(36) NULL,
    `equipment_code` VARCHAR(50) NULL,
    `equipment_name` VARCHAR(200) NULL,
    `new_equipment_name` VARCHAR(200) NULL,
    `new_equipment_model` VARCHAR(100) NULL,
    `new_equipment_category` ENUM('instrument', 'fake_load') NULL,
    `new_equipment_serial` VARCHAR(100) NULL,
    `new_equipment_manufacturer` VARCHAR(200) NULL,
    `new_equipment_price` DECIMAL(12, 2) NULL,
    `new_equipment_purchase_date` DATE NULL,
    `new_equipment_calibration_cycle` INTEGER NULL,
    `inbound_reason` TEXT NOT NULL,
    `notes` TEXT NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_equipment`(`equipment_id`),
    INDEX `idx_order_no`(`order_no`),
    INDEX `idx_status`(`status`),
    INDEX `idx_warehouse`(`warehouse_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_instances` (
    `id` VARCHAR(36) NOT NULL,
    `equipment_name` VARCHAR(200) NOT NULL,
    `model_no` VARCHAR(100) NOT NULL,
    `brand` VARCHAR(100) NULL,
    `manufacturer` VARCHAR(200) NULL,
    `technical_params` TEXT NULL,
    `category` ENUM('instrument', 'fake_load', 'cable') NOT NULL,
    `unit` VARCHAR(20) NULL DEFAULT '台',
    `quantity` INTEGER NULL DEFAULT 1,
    `serial_number` VARCHAR(100) NULL,
    `factory_serial_no` VARCHAR(100) NULL,
    `manage_code` VARCHAR(50) NULL,
    `health_status` ENUM('normal', 'affected', 'broken') NULL DEFAULT 'normal',
    `usage_status` ENUM('idle', 'in_use') NULL DEFAULT 'idle',
    `location_status` ENUM('warehouse', 'in_project', 'repairing', 'transferring') NULL DEFAULT 'warehouse',
    `location_id` VARCHAR(36) NULL,
    `keeper_id` VARCHAR(36) NULL,
    `purchase_date` DATE NULL,
    `purchase_price` DECIMAL(12, 2) NULL,
    `supplier` VARCHAR(200) NULL,
    `calibration_expiry` DATE NULL,
    `certificate_no` VARCHAR(100) NULL,
    `certificate_issuer` VARCHAR(200) NULL,
    `notes` TEXT NULL,
    `technical_doc` TEXT NULL,
    `attachment` VARCHAR(500) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `tracking_type` ENUM('SERIALIZED', 'BATCH') NOT NULL DEFAULT 'SERIALIZED',
    `attachments` JSON NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `has_accessories` BOOLEAN NULL DEFAULT false,
    `accessory_count` INTEGER NULL DEFAULT 0,
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `manage_code`(`manage_code`),
    INDEX `idx_equipment`(`equipment_name`, `model_no`),
    INDEX `idx_equipment_tracking_type`(`tracking_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_outbound_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `outbound_type` ENUM('project_use', 'repair', 'scrap') NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `warehouse_id` VARCHAR(36) NOT NULL,
    `warehouse_name` VARCHAR(200) NULL,
    `equipment_id` VARCHAR(36) NOT NULL,
    `equipment_code` VARCHAR(50) NULL,
    `equipment_name` VARCHAR(200) NULL,
    `equipment_category` VARCHAR(50) NULL,
    `target_project_id` VARCHAR(36) NULL,
    `target_project_name` VARCHAR(200) NULL,
    `repair_unit` VARCHAR(200) NULL,
    `outbound_reason` TEXT NOT NULL,
    `notes` TEXT NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_equipment`(`equipment_id`),
    INDEX `idx_project`(`target_project_id`),
    INDEX `idx_status`(`status`),
    INDEX `idx_warehouse`(`warehouse_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_repair_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `equipment_id` VARCHAR(36) NOT NULL,
    `equipment_code` VARCHAR(50) NULL,
    `equipment_name` VARCHAR(200) NULL,
    `equipment_category` VARCHAR(50) NULL,
    `repair_quantity` INTEGER NULL DEFAULT 1,
    `original_location_type` VARCHAR(50) NULL,
    `original_location_id` VARCHAR(36) NULL,
    `current_host_status` VARCHAR(50) NULL,
    `fault_description` TEXT NOT NULL,
    `fault_cause` TEXT NULL,
    `repair_type` ENUM('internal', 'external') NULL,
    `repair_unit` VARCHAR(200) NULL,
    `estimated_cost` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `actual_cost` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `repair_result` ENUM('fixed', 'unfixable', 'scrapped') NULL,
    `repair_completed_at` TIMESTAMP(0) NULL,
    `repair_description` TEXT NULL,
    `from_manager_id` VARCHAR(36) NULL,
    `from_manager` VARCHAR(100) NULL,
    `ship_quantity` INTEGER NULL DEFAULT 1,
    `shipped_at` TIMESTAMP(0) NULL,
    `shipped_by` VARCHAR(36) NULL,
    `status` ENUM('draft', 'pending_ship', 'repairing', 'pending_receive', 'completed', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_equipment`(`equipment_id`),
    INDEX `idx_equipment_repair_orders_equipment`(`equipment_id`),
    INDEX `idx_equipment_repair_orders_order_no`(`order_no`),
    INDEX `idx_equipment_repair_orders_status`(`status`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_scrap_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `equipment_id` VARCHAR(36) NOT NULL,
    `equipment_code` VARCHAR(50) NULL,
    `equipment_name` VARCHAR(200) NULL,
    `equipment_category` VARCHAR(50) NULL,
    `purchase_date` DATE NULL,
    `purchase_price` DECIMAL(12, 2) NULL,
    `used_years` DECIMAL(3, 1) NULL,
    `scrap_reason` TEXT NOT NULL,
    `residual_value` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `disposal_method` ENUM('destroy', 'sell', 'donate') NULL,
    `disposed_at` TIMESTAMP(0) NULL,
    `disposal_notes` TEXT NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected', 'disposed') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_equipment`(`equipment_id`),
    INDEX `idx_equipment_scrap_orders_equipment`(`equipment_id`),
    INDEX `idx_equipment_scrap_orders_order_no`(`order_no`),
    INDEX `idx_equipment_scrap_orders_status`(`status`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_scrap_sales` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `type` ENUM('scrap', 'sale') NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATETIME(0) NOT NULL,
    `equipment_id` VARCHAR(36) NOT NULL,
    `equipment_name` VARCHAR(200) NOT NULL,
    `equipment_category` ENUM('instrument', 'fake_load', 'cable') NOT NULL,
    `scrap_sale_quantity` INTEGER NULL DEFAULT 1,
    `original_location_type` ENUM('warehouse', 'project') NOT NULL,
    `original_location_id` VARCHAR(36) NOT NULL,
    `reason` TEXT NOT NULL,
    `sale_price` DECIMAL(10, 2) NULL,
    `buyer` VARCHAR(200) NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected', 'completed') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` DATETIME(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `approval_comment` TEXT NULL,
    `processed_at` DATETIME(0) NULL,
    `processed_by` VARCHAR(36) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant_id`(`applicant_id`),
    INDEX `idx_apply_date`(`apply_date`),
    INDEX `idx_equipment_id`(`equipment_id`),
    INDEX `idx_order_no`(`order_no`),
    INDEX `idx_status`(`status`),
    INDEX `idx_type`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_transfer_order_items` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `equipment_id` VARCHAR(36) NULL,
    `equipment_name` VARCHAR(200) NOT NULL,
    `model_no` VARCHAR(100) NULL,
    `brand` VARCHAR(100) NULL,
    `category` ENUM('instrument', 'fake_load', 'cable') NOT NULL,
    `unit` VARCHAR(20) NULL DEFAULT '台',
    `manage_code` VARCHAR(50) NULL,
    `serial_number` VARCHAR(100) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `received_quantity` INTEGER NULL DEFAULT 0,
    `status` ENUM('pending', 'transferred', 'returned') NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `shipping_images` JSON NULL,
    `receiving_images` JSON NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `accessory_info` JSON NULL,
    `accessory_desc` TEXT NULL,
    `is_accessory` BOOLEAN NULL DEFAULT false,

    INDEX `idx_equipment_id`(`equipment_id`),
    INDEX `idx_order_id`(`order_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipment_transfer_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `transfer_scene` ENUM('A', 'B', 'C') NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `equipment_id` VARCHAR(36) NULL,
    `equipment_code` VARCHAR(50) NULL,
    `equipment_name` VARCHAR(200) NULL,
    `equipment_category` VARCHAR(50) NULL,
    `from_location_type` ENUM('warehouse', 'project') NOT NULL,
    `from_warehouse_id` VARCHAR(36) NULL,
    `from_warehouse_name` VARCHAR(200) NULL,
    `from_project_id` VARCHAR(36) NULL,
    `from_project_name` VARCHAR(200) NULL,
    `from_manager_id` VARCHAR(36) NULL,
    `from_manager` VARCHAR(100) NULL,
    `to_location_type` ENUM('warehouse', 'project') NOT NULL,
    `to_warehouse_id` VARCHAR(36) NULL,
    `to_warehouse_name` VARCHAR(200) NULL,
    `to_project_id` VARCHAR(36) NULL,
    `to_project_name` VARCHAR(200) NULL,
    `to_manager_id` VARCHAR(36) NULL,
    `to_manager` VARCHAR(100) NULL,
    `solution` ENUM('borrow', 'purchase') NULL,
    `estimated_arrival` DATE NULL,
    `transfer_reason` TEXT NOT NULL,
    `estimated_ship_date` DATE NULL,
    `estimated_arrival_date` DATE NULL,
    `transport_method` ENUM('land', 'air', 'express', 'self') NULL,
    `tracking_no` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `status` ENUM('pending_from', 'pending_to', 'shipping', 'receiving', 'partial_received', 'completed', 'rejected', 'cancelled', 'withdrawn') NULL DEFAULT 'pending_from',
    `approval_id` VARCHAR(36) NULL,
    `from_approved_at` TIMESTAMP(0) NULL,
    `from_approved_by` VARCHAR(36) NULL,
    `from_approval_comment` TEXT NULL,
    `to_approved_at` TIMESTAMP(0) NULL,
    `to_approved_by` VARCHAR(36) NULL,
    `to_approval_comment` TEXT NULL,
    `shipped_at` TIMESTAMP(0) NULL,
    `shipped_by` VARCHAR(36) NULL,
    `shipping_no` VARCHAR(100) NULL,
    `shipping_attachment` VARCHAR(500) NULL,
    `received_at` TIMESTAMP(0) NULL,
    `received_by` VARCHAR(36) NULL,
    `receive_comment` TEXT NULL,
    `total_received_quantity` INTEGER NULL DEFAULT 0,
    `return_comment` TEXT NULL,
    `returned_at` DATETIME(0) NULL,
    `returned_by` VARCHAR(36) NULL,
    `receive_status` ENUM('normal', 'damaged', 'missing', 'partial') NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `shipping_package_images` JSON NULL,
    `receiving_package_images` JSON NULL,
    `total_quantity` INTEGER NULL DEFAULT 0,
    `total_items` INTEGER NULL DEFAULT 1,
    `total_requested_quantity` INTEGER NULL DEFAULT 0,
    `transfer_type` ENUM('single', 'batch') NULL DEFAULT 'single',
    `total_approved_quantity` INTEGER NULL DEFAULT 0,

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_equipment`(`equipment_id`),
    INDEX `idx_from_project`(`from_project_id`),
    INDEX `idx_from_warehouse`(`from_warehouse_id`),
    INDEX `idx_status`(`status`),
    INDEX `idx_to_project`(`to_project_id`),
    INDEX `idx_to_warehouse`(`to_warehouse_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exception_tasks` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `item_id` VARCHAR(36) NULL,
    `type` ENUM('SHORTAGE', 'DAMAGE') NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'RESOLVED') NOT NULL DEFAULT 'PENDING',
    `responsible_id` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_exception_task_status`(`status`),
    INDEX `order_id`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_drafts` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `template_id` VARCHAR(255) NOT NULL,
    `template_key` VARCHAR(255) NOT NULL,
    `form_data` JSON NOT NULL,
    `status` ENUM('draft', 'auto_saved') NOT NULL DEFAULT 'draft',
    `created_at` DATETIME(0) NOT NULL,
    `updated_at` DATETIME(0) NOT NULL,
    `metadata` JSON NULL,

    INDEX `idx_form_drafts_status`(`status`),
    INDEX `idx_form_drafts_updated_at`(`updated_at` DESC),
    INDEX `idx_form_drafts_user_template`(`user_id`, `template_id`),
    INDEX `idx_status`(`status`),
    INDEX `idx_template_id`(`template_id`),
    INDEX `idx_template_key`(`template_key`),
    INDEX `idx_updated_at`(`updated_at`),
    INDEX `idx_user_id`(`user_id`),
    INDEX `idx_user_template`(`user_id`, `template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_template_versions` (
    `id` VARCHAR(255) NOT NULL,
    `template_id` VARCHAR(255) NOT NULL,
    `version` INTEGER NOT NULL,
    `fields` JSON NOT NULL,
    `status` ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'draft',
    `created_by` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL,
    `activated_at` DATETIME(0) NULL,
    `archived_at` DATETIME(0) NULL,
    `notes` TEXT NULL,
    `change_log` TEXT NULL,

    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_created_by`(`created_by`),
    INDEX `idx_form_template_versions_created_by`(`created_by`),
    INDEX `idx_form_template_versions_status`(`status`),
    INDEX `idx_form_template_versions_template_version`(`template_id`, `version` DESC),
    INDEX `idx_status`(`status`),
    INDEX `idx_template_id`(`template_id`),
    INDEX `idx_version`(`template_id`, `version`),
    UNIQUE INDEX `uk_template_version`(`template_id`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_templates` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `layout` JSON NOT NULL,
    `fields` JSON NOT NULL,
    `sections` JSON NULL,
    `style` JSON NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_name`(`name`),
    INDEX `idx_version`(`version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_requests` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `project_id` VARCHAR(36) NULL,
    `project_name` VARCHAR(200) NULL,
    `leave_type` ENUM('annual', 'sick', 'personal', 'comp') NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `leave_days` INTEGER NOT NULL,
    `leave_reason` TEXT NOT NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_project`(`project_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `user_name` VARCHAR(100) NULL,
    `type` ENUM('email', 'sms', 'push', 'in_app') NULL DEFAULT 'in_app',
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `priority` ENUM('low', 'normal', 'high', 'urgent') NULL DEFAULT 'normal',
    `link` VARCHAR(255) NULL,
    `is_read` BOOLEAN NULL DEFAULT false,
    `read_at` TIMESTAMP(0) NULL,
    `sent_at` TIMESTAMP(0) NULL,
    `status` ENUM('pending', 'sent', 'failed') NULL DEFAULT 'pending',
    `error_message` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_notifications_created_at`(`created_at` DESC),
    INDEX `idx_notifications_type`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organization` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `parent_id` VARCHAR(36) NULL,
    `level` INTEGER NOT NULL,
    `manager_id` VARCHAR(36) NULL,
    `description` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `positions` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `department_id` VARCHAR(36) NULL,
    `department_name` VARCHAR(100) NULL,
    `level` INTEGER NULL DEFAULT 1,
    `category` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `requirements` TEXT NULL,
    `status` ENUM('active', 'inactive') NULL DEFAULT 'active',
    `sort_order` INTEGER NULL DEFAULT 0,
    `third_party_id` VARCHAR(100) NULL,
    `third_party_source` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `code`(`code`),
    INDEX `idx_department`(`department_id`),
    INDEX `idx_level`(`level`),
    INDEX `idx_positions_category_status`(`category`, `status`),
    INDEX `idx_positions_department_status`(`department_id`, `status`),
    INDEX `idx_status`(`status`),
    INDEX `idx_third_party`(`third_party_id`, `third_party_source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `progress_alerts` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `project_name` VARCHAR(200) NULL,
    `entity_type` ENUM('project', 'phase', 'task') NOT NULL,
    `entity_id` VARCHAR(36) NOT NULL,
    `entity_name` VARCHAR(200) NOT NULL,
    `planned_progress` INTEGER NOT NULL,
    `actual_progress` INTEGER NOT NULL,
    `deviation` INTEGER NOT NULL,
    `deviation_threshold` INTEGER NOT NULL,
    `alert_level` ENUM('warning', 'severe') NOT NULL,
    `status` ENUM('active', 'acknowledged', 'resolved') NULL DEFAULT 'active',
    `manager_id` VARCHAR(36) NULL,
    `manager_name` VARCHAR(100) NULL,
    `resolution_note` TEXT NULL,
    `acknowledged_at` TIMESTAMP(0) NULL,
    `acknowledged_by` VARCHAR(36) NULL,
    `resolved_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_completion_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `project_name` VARCHAR(200) NULL,
    `project_manager_id` VARCHAR(36) NULL,
    `actual_start_date` DATE NULL,
    `actual_end_date` DATE NOT NULL,
    `total_duration` INTEGER NULL,
    `task_completion_status` ENUM('all', 'partial') NOT NULL,
    `incomplete_task_note` TEXT NULL,
    `project_result` TEXT NOT NULL,
    `result_report` JSON NULL,
    `acceptance_report` JSON NULL,
    `project_budget` DECIMAL(15, 2) NULL,
    `actual_cost` DECIMAL(15, 2) NOT NULL,
    `cost_variance_note` TEXT NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_project`(`project_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_locations` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `address` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `radius` INTEGER NULL DEFAULT 500,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_project`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_personnel` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `employee_id` VARCHAR(36) NOT NULL,
    `role_in_project` VARCHAR(50) NULL,
    `on_duty_status` ENUM('on_duty', 'off_duty') NULL DEFAULT 'on_duty',
    `transfer_in_date` DATE NOT NULL,
    `transfer_out_date` DATE NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uk_proj_emp`(`project_id`, `employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_personnel_transfer_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `transfer_type` ENUM('in', 'out') NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `employee_id` VARCHAR(36) NOT NULL,
    `employee_name` VARCHAR(100) NULL,
    `department` VARCHAR(100) NULL,
    `position` VARCHAR(100) NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `project_name` VARCHAR(200) NULL,
    `project_manager_id` VARCHAR(36) NULL,
    `transfer_reason` TEXT NOT NULL,
    `effective_date` DATE NOT NULL,
    `notes` TEXT NULL,
    `project_personnel_id` VARCHAR(36) NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_employee`(`employee_id`),
    INDEX `idx_project`(`project_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_phase_update_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `phase_id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NULL,
    `project_name` VARCHAR(200) NULL,
    `phase_name` VARCHAR(100) NULL,
    `current_status` VARCHAR(50) NULL,
    `update_type` ENUM('start', 'complete', 'pause', 'resume') NOT NULL,
    `new_status` ENUM('not_started', 'in_progress', 'completed', 'paused') NOT NULL,
    `actual_start_date` DATE NULL,
    `actual_end_date` DATE NULL,
    `progress` INTEGER NULL,
    `update_reason` TEXT NOT NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_phase`(`phase_id`),
    INDEX `idx_project`(`project_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_proposal_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `project_name` VARCHAR(200) NOT NULL,
    `manager_id` VARCHAR(36) NOT NULL,
    `manager` VARCHAR(100) NULL,
    `tech_manager_id` VARCHAR(36) NULL,
    `tech_manager` VARCHAR(100) NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `country` ENUM('China', 'USA', 'Singapore', 'Malaysia', 'Indonesia', 'Other') NOT NULL,
    `address` VARCHAR(300) NULL,
    `description` TEXT NULL,
    `area` DECIMAL(10, 2) NULL,
    `capacity` DECIMAL(10, 2) NULL,
    `rack_count` INTEGER NULL,
    `rack_power` DECIMAL(10, 2) NULL,
    `power_arch` TEXT NULL,
    `hvac_arch` TEXT NULL,
    `fire_arch` TEXT NULL,
    `weak_arch` TEXT NULL,
    `customer_id` VARCHAR(36) NULL,
    `customer_name` VARCHAR(200) NULL,
    `budget` DECIMAL(15, 2) NULL,
    `attachments` JSON NULL,
    `created_project_id` VARCHAR(36) NULL,
    `project_no` VARCHAR(50) NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_customer`(`customer_id`),
    INDEX `idx_manager`(`manager_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `type` ENUM('domestic', 'foreign', 'rd', 'service') NULL DEFAULT 'domestic',
    `manager_id` VARCHAR(36) NULL,
    `status` ENUM('proposal', 'in_progress', 'completed', 'paused', 'delayed') NULL DEFAULT 'proposal',
    `progress` INTEGER NULL DEFAULT 0,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `budget` DECIMAL(15, 2) NULL DEFAULT 0.00,
    `customer_id` VARCHAR(36) NULL,
    `organization_id` VARCHAR(36) NULL,
    `description` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,
    `manager` VARCHAR(100) NULL,
    `country` VARCHAR(50) NULL DEFAULT '中国',
    `address` TEXT NULL,
    `attachments` TEXT NULL,
    `phase` VARCHAR(50) NULL,
    `phase_start_date` DATE NULL,
    `phase_end_date` DATE NULL,
    `estimated_days` INTEGER NULL DEFAULT 0,
    `remaining_days` INTEGER NULL DEFAULT 0,
    `area` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `capacity` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `rack_count` INTEGER NULL DEFAULT 0,
    `rack_power` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `power_arch` TEXT NULL,
    `hvac_arch` TEXT NULL,
    `fire_arch` TEXT NULL,
    `weak_arch` TEXT NULL,
    `customer_name` VARCHAR(200) NULL,
    `building_area` DECIMAL(10, 2) NULL,
    `it_capacity` DECIMAL(10, 2) NULL,
    `cabinet_count` INTEGER NULL,
    `cabinet_power` DECIMAL(10, 2) NULL,
    `power_architecture` TEXT NULL,
    `hvac_architecture` TEXT NULL,
    `fire_architecture` TEXT NULL,
    `weak_electric_architecture` TEXT NULL,
    `approval_mode` VARCHAR(50) NULL DEFAULT 'workflow',
    `technical_lead_id` VARCHAR(36) NULL,
    `end_customer` VARCHAR(200) NULL,

    UNIQUE INDEX `code`(`code`),
    INDEX `idx_projects_country`(`country`),
    INDEX `idx_projects_customer`(`customer_id`),
    INDEX `idx_projects_manager`(`manager_id`),
    INDEX `idx_projects_status_start_date`(`status`, `start_date`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `transfer_order_id` VARCHAR(36) NULL,
    `equipment_category` ENUM('instrument', 'fake_load') NOT NULL,
    `equipment_name` VARCHAR(200) NOT NULL,
    `model_spec` VARCHAR(200) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `estimated_price` DECIMAL(12, 2) NOT NULL,
    `total_price` DECIMAL(12, 2) NULL,
    `purchase_reason` TEXT NOT NULL,
    `required_date` DATE NOT NULL,
    `purchase_status` ENUM('pending', 'ordering', 'arrived') NULL DEFAULT 'pending',
    `actual_price` DECIMAL(12, 2) NULL,
    `arrival_date` DATE NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_status`(`status`),
    INDEX `idx_transfer`(`transfer_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_requests` (
    `id` VARCHAR(36) NOT NULL,
    `request_no` VARCHAR(50) NOT NULL,
    `equipment_id` VARCHAR(36) NULL,
    `equipment_name` VARCHAR(200) NOT NULL,
    `equipment_spec` VARCHAR(500) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `reason` TEXT NOT NULL,
    `urgency` ENUM('low', 'normal', 'high', 'urgent') NULL DEFAULT 'normal',
    `status` ENUM('pending', 'approved', 'purchasing', 'arrived', 'cancelled') NULL DEFAULT 'pending',
    `requester_id` VARCHAR(36) NOT NULL,
    `requester_name` VARCHAR(100) NULL,
    `project_id` VARCHAR(36) NULL,
    `project_name` VARCHAR(200) NULL,
    `estimated_price` DECIMAL(12, 2) NULL,
    `actual_price` DECIMAL(12, 2) NULL,
    `supplier` VARCHAR(200) NULL,
    `expected_date` DATE NULL,
    `actual_date` DATE NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `request_no`(`request_no`),
    INDEX `idx_equipment`(`equipment_id`),
    INDEX `idx_project`(`project_id`),
    INDEX `idx_requester`(`requester_id`),
    INDEX `idx_status`(`status`),
    INDEX `idx_urgency`(`urgency`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_logs` (
    `id` VARCHAR(36) NOT NULL,
    `config_id` VARCHAR(36) NOT NULL,
    `platform_type` VARCHAR(50) NOT NULL,
    `sync_type` ENUM('department', 'employee', 'full') NOT NULL,
    `sync_mode` ENUM('manual', 'auto') NULL DEFAULT 'manual',
    `status` ENUM('success', 'failed', 'partial') NOT NULL,
    `total_count` INTEGER NULL DEFAULT 0,
    `success_count` INTEGER NULL DEFAULT 0,
    `failed_count` INTEGER NULL DEFAULT 0,
    `created_count` INTEGER NULL DEFAULT 0,
    `updated_count` INTEGER NULL DEFAULT 0,
    `deleted_count` INTEGER NULL DEFAULT 0,
    `start_time` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `end_time` TIMESTAMP(0) NULL,
    `duration` INTEGER NULL,
    `error_message` TEXT NULL,
    `details` JSON NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_config`(`config_id`),
    INDEX `idx_platform`(`platform_type`),
    INDEX `idx_start_time`(`start_time`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_configs` (
    `id` VARCHAR(36) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NULL,
    `description` VARCHAR(500) NULL,
    `category` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `key`(`key`),
    INDEX `idx_category`(`category`),
    INDEX `idx_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_assignment_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `project_name` VARCHAR(200) NULL,
    `phase_id` VARCHAR(36) NULL,
    `phase_name` VARCHAR(100) NULL,
    `wbs_code` VARCHAR(50) NOT NULL,
    `task_type` ENUM('milestone', 'subtask', 'process') NOT NULL,
    `task_name` VARCHAR(300) NOT NULL,
    `parent_task_id` VARCHAR(36) NULL,
    `task_level` ENUM('milestone', 'subtask', 'process') NOT NULL,
    `task_description` TEXT NULL,
    `assignee_id` VARCHAR(36) NOT NULL,
    `assignee` VARCHAR(100) NOT NULL,
    `planned_start_date` DATE NOT NULL,
    `planned_end_date` DATE NOT NULL,
    `task_requirements` TEXT NOT NULL,
    `receive_status` ENUM('pending', 'accepted', 'rejected') NULL DEFAULT 'pending',
    `received_at` TIMESTAMP(0) NULL,
    `reject_reason` TEXT NULL,
    `created_task_id` VARCHAR(36) NULL,
    `status` ENUM('draft', 'pending', 'accepted', 'rejected', 'completed') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_assignee`(`assignee_id`),
    INDEX `idx_phase`(`phase_id`),
    INDEX `idx_project`(`project_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_completion_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `applicant_id` VARCHAR(36) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `apply_date` DATE NOT NULL,
    `task_id` VARCHAR(36) NOT NULL,
    `task_name` VARCHAR(300) NULL,
    `project_id` VARCHAR(36) NULL,
    `project_name` VARCHAR(200) NULL,
    `phase_id` VARCHAR(36) NULL,
    `phase_name` VARCHAR(100) NULL,
    `assignee_id` VARCHAR(36) NULL,
    `assignee` VARCHAR(100) NULL,
    `planned_end_date` DATE NULL,
    `current_progress` INTEGER NULL,
    `actual_end_date` DATE NOT NULL,
    `final_progress` INTEGER NOT NULL DEFAULT 100,
    `task_result` TEXT NOT NULL,
    `result_attachments` JSON NULL,
    `remaining_issues` TEXT NULL,
    `quality_score` DECIMAL(2, 1) NULL,
    `efficiency_score` DECIMAL(2, 1) NULL,
    `attitude_score` DECIMAL(2, 1) NULL,
    `overall_score` DECIMAL(3, 1) NULL,
    `overall_rating` ENUM('excellent', 'good', 'qualified', 'unqualified') NULL,
    `evaluation_comment` TEXT NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected') NULL DEFAULT 'draft',
    `approval_id` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `approved_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_applicant`(`applicant_id`),
    INDEX `idx_assignee`(`assignee_id`),
    INDEX `idx_project`(`project_id`),
    INDEX `idx_status`(`status`),
    INDEX `idx_task`(`task_id`),
    INDEX `idx_task_completion_orders_order_no`(`order_no`),
    INDEX `idx_task_completion_orders_status`(`status`),
    INDEX `idx_task_completion_orders_task`(`task_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `parent_id` VARCHAR(36) NULL,
    `wbs_path` VARCHAR(255) NOT NULL,
    `wbs_code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(300) NOT NULL,
    `task_type` ENUM('milestone', 'subtask', 'process') NULL DEFAULT 'subtask',
    `description` TEXT NULL,
    `assignee_id` VARCHAR(36) NULL,
    `planned_start_date` DATE NOT NULL,
    `planned_end_date` DATE NOT NULL,
    `actual_start_date` DATE NULL,
    `actual_end_date` DATE NULL,
    `progress` INTEGER NULL DEFAULT 0,
    `status` ENUM('unassigned', 'pending_confirm', 'accepted', 'in_progress', 'completed', 'closed') NULL DEFAULT 'unassigned',
    `priority` ENUM('high', 'medium', 'low') NULL DEFAULT 'medium',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_project`(`project_id`),
    INDEX `idx_wbs`(`wbs_path`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `third_party_configs` (
    `id` VARCHAR(36) NOT NULL,
    `platform_type` ENUM('wechat_work', 'dingtalk', 'feishu') NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `corp_id` VARCHAR(100) NULL,
    `agent_id` VARCHAR(100) NULL,
    `app_id` VARCHAR(100) NULL,
    `app_secret` VARCHAR(500) NULL,
    `access_token` VARCHAR(500) NULL,
    `token_expire_time` TIMESTAMP(0) NULL,
    `sync_departments` BOOLEAN NULL DEFAULT true,
    `sync_employees` BOOLEAN NULL DEFAULT true,
    `sync_enabled` BOOLEAN NULL DEFAULT false,
    `sync_interval` INTEGER NULL DEFAULT 60,
    `last_sync_time` TIMESTAMP(0) NULL,
    `last_sync_status` ENUM('success', 'failed', 'partial') NULL,
    `config` JSON NULL,
    `status` ENUM('active', 'inactive') NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_platform`(`platform_type`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timesheet_entries` (
    `id` VARCHAR(36) NOT NULL,
    `report_id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `task_id` VARCHAR(36) NULL,
    `duration` DECIMAL(4, 1) NOT NULL,
    `work_content` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NULL,
    `role` VARCHAR(50) NULL,
    `status` ENUM('active', 'inactive') NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `username`(`username`),
    INDEX `idx_users_email`(`email`),
    INDEX `idx_users_role_status`(`role`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouses` (
    `id` VARCHAR(36) NOT NULL,
    `warehouse_no` VARCHAR(50) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `type` ENUM('main', 'branch', 'project') NULL DEFAULT 'main',
    `location` VARCHAR(200) NOT NULL,
    `address` TEXT NULL,
    `manager_id` VARCHAR(36) NULL,
    `status` ENUM('active', 'inactive') NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `warehouse_no`(`warehouse_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_approver_rules` (
    `id` VARCHAR(36) NOT NULL,
    `definition_id` VARCHAR(36) NULL,
    `node_id` VARCHAR(100) NULL,
    `rule_name` VARCHAR(200) NOT NULL,
    `approver_type` ENUM('fixed', 'role', 'department', 'superior', 'form_field', 'expression', 'previous_handler', 'initiator') NOT NULL,
    `approver_value` VARCHAR(500) NOT NULL,
    `fallback_type` VARCHAR(50) NULL,
    `fallback_value` VARCHAR(500) NULL,
    `priority` INTEGER NULL DEFAULT 0,
    `condition_expression` VARCHAR(500) NULL,
    `enabled` TINYINT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_definition`(`definition_id`),
    INDEX `idx_enabled`(`enabled`),
    INDEX `idx_node`(`node_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_definitions` (
    `id` VARCHAR(36) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `category` VARCHAR(50) NULL,
    `entity_type` VARCHAR(50) NULL,
    `bpmn_xml` MEDIUMTEXT NULL,
    `node_config` JSON NULL,
    `form_schema` JSON NULL,
    `form_template_id` VARCHAR(36) NULL,
    `variables` JSON NULL,
    `status` ENUM('draft', 'active', 'suspended', 'archived') NULL DEFAULT 'draft',
    `created_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_category`(`category`),
    INDEX `idx_entity_type`(`entity_type`),
    INDEX `idx_form_template_id`(`form_template_id`),
    INDEX `idx_status`(`status`),
    INDEX `idx_workflow_definitions_category_version`(`category`, `version` DESC),
    INDEX `idx_workflow_definitions_status`(`status`),
    UNIQUE INDEX `uk_key_version`(`key`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_execution_logs` (
    `id` VARCHAR(36) NOT NULL,
    `execution_id` VARCHAR(36) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `process_key` VARCHAR(100) NULL,
    `instance_id` VARCHAR(36) NULL,
    `task_id` VARCHAR(36) NULL,
    `node_id` VARCHAR(36) NULL,
    `node_type` VARCHAR(50) NULL,
    `business_key` VARCHAR(200) NULL,
    `initiator` JSON NULL,
    `operator` JSON NULL,
    `result` VARCHAR(50) NULL,
    `error` TEXT NULL,
    `reason` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_action`(`action`),
    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_execution_id`(`execution_id`),
    INDEX `idx_instance_id`(`instance_id`),
    INDEX `idx_process_key`(`process_key`),
    INDEX `idx_task_id`(`task_id`),
    INDEX `idx_workflow_execution_logs_action`(`action`),
    INDEX `idx_workflow_execution_logs_instance_id`(`instance_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_executions` (
    `id` VARCHAR(36) NOT NULL,
    `instance_id` VARCHAR(36) NOT NULL,
    `parent_id` VARCHAR(36) NULL,
    `node_id` VARCHAR(100) NOT NULL,
    `node_name` VARCHAR(200) NULL,
    `node_type` VARCHAR(50) NULL,
    `variables` JSON NULL,
    `status` ENUM('active', 'completed', 'cancelled') NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completed_at` TIMESTAMP(0) NULL,

    INDEX `idx_instance`(`instance_id`),
    INDEX `idx_node`(`node_id`),
    INDEX `idx_parent`(`parent_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_instance_history` (
    `id` VARCHAR(36) NOT NULL,
    `instance_id` VARCHAR(36) NOT NULL,
    `from_status` VARCHAR(50) NULL,
    `to_status` VARCHAR(50) NOT NULL,
    `operator_id` VARCHAR(36) NULL,
    `operator_name` VARCHAR(100) NULL,
    `reason` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_instance_id`(`instance_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_instances` (
    `id` VARCHAR(36) NOT NULL,
    `definition_id` VARCHAR(36) NOT NULL,
    `definition_key` VARCHAR(100) NOT NULL,
    `definition_version` INTEGER NOT NULL,
    `category` VARCHAR(50) NULL,
    `business_key` VARCHAR(100) NULL,
    `business_id` VARCHAR(36) NULL,
    `title` VARCHAR(300) NULL,
    `initiator_id` VARCHAR(36) NULL,
    `initiator_name` VARCHAR(100) NULL,
    `variables` JSON NULL,
    `status` ENUM('running', 'suspended', 'completed', 'terminated', 'rejected') NULL DEFAULT 'running',
    `start_time` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `end_time` TIMESTAMP(0) NULL,
    `duration` BIGINT NULL,
    `result` ENUM('approved', 'rejected', 'withdrawn', 'terminated', 'skipped') NULL,
    `current_node_id` VARCHAR(100) NULL,
    `current_node_name` VARCHAR(200) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_business`(`business_key`, `business_id`),
    INDEX `idx_definition`(`definition_id`),
    INDEX `idx_definition_key`(`definition_key`),
    INDEX `idx_initiator`(`initiator_id`),
    INDEX `idx_start_time`(`start_time`),
    INDEX `idx_status`(`status`),
    INDEX `idx_workflow_instances_business_key`(`business_key`),
    INDEX `idx_workflow_instances_category_status`(`category`, `status`),
    INDEX `idx_workflow_instances_created_at`(`created_at` DESC),
    INDEX `idx_workflow_instances_definition_status`(`definition_id`, `status`),
    INDEX `idx_workflow_instances_initiator_status`(`initiator_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_listeners` (
    `id` VARCHAR(36) NOT NULL,
    `definition_id` VARCHAR(36) NULL,
    `node_id` VARCHAR(100) NULL,
    `event_type` ENUM('start', 'end', 'take', 'create', 'assignment', 'complete') NOT NULL,
    `listener_type` ENUM('class', 'expression', 'delegate') NOT NULL,
    `listener_value` VARCHAR(500) NOT NULL,
    `enabled` TINYINT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_definition`(`definition_id`),
    INDEX `idx_event_type`(`event_type`),
    INDEX `idx_node`(`node_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_locks` (
    `id` VARCHAR(255) NOT NULL,
    `lock_key` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `acquired_at` DATETIME(0) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_expires_at`(`expires_at`),
    INDEX `idx_lock_key`(`lock_key`),
    INDEX `idx_owner`(`owner`),
    INDEX `idx_workflow_locks_expires_at`(`expires_at`),
    INDEX `idx_workflow_locks_key_expires`(`lock_key`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_order_items` (
    `id` VARCHAR(36) NOT NULL,
    `order_id` VARCHAR(36) NOT NULL,
    `item_type` ENUM('equipment', 'accessory') NOT NULL,
    `item_id` VARCHAR(36) NULL,
    `model_id` VARCHAR(36) NULL,
    `plan_qty` INTEGER NOT NULL,
    `actual_qty` INTEGER NULL,
    `dispatch_item_image` VARCHAR(500) NULL,
    `receive_item_image` VARCHAR(500) NULL,
    `status` ENUM('PENDING', 'DISPATCHED', 'RECEIVED', 'EXCEPTION') NOT NULL DEFAULT 'PENDING',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_workflow_order_items_order`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_orders` (
    `id` VARCHAR(36) NOT NULL,
    `order_no` VARCHAR(50) NOT NULL,
    `type` ENUM('transfer', 'repair') NOT NULL,
    `status` ENUM('CREATED', 'DISPATCHED', 'RECEIVED', 'COMPLETED', 'EXCEPTION_CONFIRMING', 'CLOSED') NOT NULL DEFAULT 'CREATED',
    `from_location_id` VARCHAR(36) NULL,
    `to_location_id` VARCHAR(36) NULL,
    `dispatcher_id` VARCHAR(36) NULL,
    `receiver_id` VARCHAR(36) NULL,
    `dispatch_overall_image` VARCHAR(500) NULL,
    `receive_overall_image` VARCHAR(500) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `order_no`(`order_no`),
    INDEX `idx_workflow_order_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_performance_metrics` (
    `id` VARCHAR(36) NOT NULL,
    `process_key` VARCHAR(100) NULL,
    `instance_id` VARCHAR(36) NULL,
    `operation` VARCHAR(100) NOT NULL,
    `duration_ms` INTEGER NOT NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_operation`(`operation`),
    INDEX `idx_process_key`(`process_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_task_history` (
    `id` VARCHAR(36) NOT NULL,
    `task_id` VARCHAR(36) NOT NULL,
    `instance_id` VARCHAR(36) NOT NULL,
    `node_id` VARCHAR(100) NOT NULL,
    `task_name` VARCHAR(200) NULL,
    `action` ENUM('create', 'assign', 'claim', 'complete', 'delegate', 'transfer', 'withdraw', 'cancel', 'skip') NOT NULL,
    `operator_id` VARCHAR(36) NULL,
    `operator_name` VARCHAR(100) NULL,
    `target_id` VARCHAR(36) NULL,
    `target_name` VARCHAR(100) NULL,
    `comment` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_action`(`action`),
    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_instance`(`instance_id`),
    INDEX `idx_operator`(`operator_id`),
    INDEX `idx_task`(`task_id`),
    INDEX `idx_workflow_task_history_created_at`(`created_at` DESC),
    INDEX `idx_workflow_task_history_instance_operator`(`instance_id`, `operator_id`),
    INDEX `idx_workflow_task_history_task_id`(`task_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_tasks` (
    `id` VARCHAR(36) NOT NULL,
    `instance_id` VARCHAR(36) NOT NULL,
    `execution_id` VARCHAR(36) NULL,
    `node_id` VARCHAR(100) NOT NULL,
    `task_def_key` VARCHAR(100) NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `assignee_id` VARCHAR(36) NULL,
    `assignee_name` VARCHAR(100) NULL,
    `candidate_users` JSON NULL,
    `candidate_groups` JSON NULL,
    `priority` INTEGER NULL DEFAULT 50,
    `due_date` TIMESTAMP(0) NULL,
    `claim_time` TIMESTAMP(0) NULL,
    `variables` JSON NULL,
    `status` ENUM('created', 'assigned', 'in_progress', 'completed', 'cancelled') NULL DEFAULT 'created',
    `result` ENUM('approved', 'rejected', 'withdrawn', 'delegated', 'transferred', 'skipped') NULL,
    `comment` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `started_at` TIMESTAMP(0) NULL,
    `completed_at` TIMESTAMP(0) NULL,
    `duration` BIGINT NULL,
    `approval_mode` VARCHAR(50) NULL DEFAULT 'workflow',
    `vote_threshold` INTEGER NULL DEFAULT 1,

    INDEX `idx_assignee`(`assignee_id`),
    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_due_date`(`due_date`),
    INDEX `idx_execution`(`execution_id`),
    INDEX `idx_instance`(`instance_id`),
    INDEX `idx_status`(`status`),
    INDEX `idx_workflow_tasks_assignee_status`(`assignee_id`, `status`),
    INDEX `idx_workflow_tasks_created_at`(`created_at` DESC),
    INDEX `idx_workflow_tasks_instance_status`(`instance_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_variable_history` (
    `id` VARCHAR(36) NOT NULL,
    `instance_id` VARCHAR(36) NOT NULL,
    `execution_id` VARCHAR(36) NULL,
    `task_id` VARCHAR(36) NULL,
    `variable_name` VARCHAR(100) NOT NULL,
    `variable_type` VARCHAR(50) NULL,
    `old_value` TEXT NULL,
    `new_value` TEXT NULL,
    `operator_id` VARCHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_instance`(`instance_id`),
    INDEX `idx_variable_name`(`variable_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `domain_events` (
    `id` VARCHAR(36) NOT NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `aggregate_id` VARCHAR(36) NOT NULL,
    `aggregate_type` VARCHAR(50) NOT NULL,
    `payload` JSON NOT NULL,
    `metadata` JSON NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `error` TEXT NULL,
    `retries` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `processed_at` TIMESTAMP(0) NULL,

    INDEX `idx_status`(`status`),
    INDEX `idx_aggregate`(`aggregate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('menu', 'button', 'api') NOT NULL,
    `parent_id` VARCHAR(36) NULL,
    `path` VARCHAR(255) NULL,
    `method` VARCHAR(20) NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `permissions_code_key`(`code`),
    INDEX `permissions_parent_id_idx`(`parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'inactive') NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` VARCHAR(36) NOT NULL,
    `permission_id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `fk_dept_manager` FOREIGN KEY (`manager_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `fk_dept_parent` FOREIGN KEY (`parent_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `employee_offboard_orders` ADD CONSTRAINT `fk_offboard_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `employee_offboard_orders` ADD CONSTRAINT `fk_offboard_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `employee_onboard_orders` ADD CONSTRAINT `fk_onboard_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `employee_transfer_orders` ADD CONSTRAINT `fk_transfer_order_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `employee_transfer_orders` ADD CONSTRAINT `fk_transfer_order_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `equipment_accessory_instances` ADD CONSTRAINT `equipment_accessory_instances_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_accessory_instances` ADD CONSTRAINT `equipment_accessory_instances_keeper_id_fkey` FOREIGN KEY (`keeper_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_accessory_instances` ADD CONSTRAINT `equipment_accessory_instances_host_equipment_id_fkey` FOREIGN KEY (`host_equipment_id`) REFERENCES `equipment_instances`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipment_inbound_items` ADD CONSTRAINT `equipment_inbound_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `equipment_inbound_orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `exception_tasks` ADD CONSTRAINT `exception_tasks_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `workflow_orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `fk_leave_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `fk_leave_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `positions` ADD CONSTRAINT `fk_position_dept` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `project_completion_orders` ADD CONSTRAINT `fk_project_comp_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `project_completion_orders` ADD CONSTRAINT `fk_project_comp_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `project_personnel_transfer_orders` ADD CONSTRAINT `fk_pp_transfer_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `project_personnel_transfer_orders` ADD CONSTRAINT `fk_pp_transfer_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `project_personnel_transfer_orders` ADD CONSTRAINT `fk_pp_transfer_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `project_proposal_orders` ADD CONSTRAINT `fk_proposal_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `project_proposal_orders` ADD CONSTRAINT `fk_proposal_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `project_proposal_orders` ADD CONSTRAINT `fk_proposal_manager` FOREIGN KEY (`manager_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `sync_logs` ADD CONSTRAINT `fk_sync_config` FOREIGN KEY (`config_id`) REFERENCES `third_party_configs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `task_completion_orders` ADD CONSTRAINT `fk_task_comp_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `task_completion_orders` ADD CONSTRAINT `fk_task_comp_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `task_completion_orders` ADD CONSTRAINT `fk_task_comp_task` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `workflow_order_items` ADD CONSTRAINT `workflow_order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `workflow_orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
