-- DropForeignKey
ALTER TABLE `equipment_accessory_instances` DROP FOREIGN KEY `equipment_accessory_instances_location_id_fkey`;

-- AlterTable
ALTER TABLE `employees` ADD COLUMN `employee_type` ENUM('full_time', 'part_time', 'contract', 'intern') NULL DEFAULT 'full_time';

-- AlterTable
ALTER TABLE `equipment_accessory_instances` MODIFY `category` ENUM('instrument', 'fake_load', 'cable', 'accessory') NOT NULL;

-- AlterTable
ALTER TABLE `equipment_images` MODIFY `category` ENUM('instrument', 'fake_load', 'cable', 'accessory') NULL;

-- AlterTable
ALTER TABLE `equipment_inbound_orders` MODIFY `new_equipment_category` ENUM('instrument', 'fake_load', 'cable', 'accessory') NULL;

-- AlterTable
ALTER TABLE `equipment_instances` MODIFY `category` ENUM('instrument', 'fake_load', 'cable', 'accessory') NOT NULL,
    MODIFY `usage_status` ENUM('idle', 'in_use', 'scrapped', 'sold') NULL DEFAULT 'idle';

-- AlterTable
ALTER TABLE `equipment_repair_orders` ADD COLUMN `shipping_images` JSON NULL,
    ADD COLUMN `shipping_no` VARCHAR(100) NULL,
    ADD COLUMN `shipping_remark` TEXT NULL;

-- AlterTable
ALTER TABLE `equipment_scrap_sales` ADD COLUMN `from_manager` VARCHAR(100) NULL,
    ADD COLUMN `from_manager_id` VARCHAR(36) NULL,
    ADD COLUMN `items` JSON NULL;

-- AlterTable
ALTER TABLE `equipment_transfer_order_items` MODIFY `category` ENUM('instrument', 'fake_load', 'cable', 'accessory') NOT NULL;

-- AlterTable
ALTER TABLE `workflow_tasks` ADD COLUMN `delegated_from` VARCHAR(36) NULL;

-- CreateTable
CREATE TABLE `project_milestones` (
    `id` VARCHAR(36) NOT NULL,
    `project_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `planned_start_date` DATE NOT NULL,
    `planned_end_date` DATE NOT NULL,
    `actual_end_date` DATE NULL,
    `weight` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_milestone_project`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `milestone_resources` (
    `id` VARCHAR(36) NOT NULL,
    `milestone_id` VARCHAR(36) NOT NULL,
    `resource_name` VARCHAR(200) NOT NULL,
    `required_count` INTEGER NOT NULL DEFAULT 1,
    `collected_count` INTEGER NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `status` ENUM('incomplete', 'complete') NOT NULL DEFAULT 'incomplete',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_resource_milestone`(`milestone_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `project_milestones` ADD CONSTRAINT `project_milestones_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `milestone_resources` ADD CONSTRAINT `milestone_resources_milestone_id_fkey` FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
