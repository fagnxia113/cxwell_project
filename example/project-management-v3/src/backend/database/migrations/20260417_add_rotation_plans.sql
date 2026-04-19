-- Add Personnel Rotation Plans Table
CREATE TABLE IF NOT EXISTS `personnel_rotation_plans` (
  `id` varchar(36) NOT NULL,
  `employee_id` varchar(36) NOT NULL,
  `year_month` varchar(7) NOT NULL, 
  `schedule_data` json NOT NULL,    
  `status` enum('submitted', 'updated') DEFAULT 'submitted',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_month` (`employee_id`, `year_month`),
  CONSTRAINT `fk_rotation_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Add a comment table for PM feedback (if needed later)
