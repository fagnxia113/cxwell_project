SELECT project_id, dingtalk_group_id, is_enabled FROM biz_project_attendance_config;
SELECT e.employee_id, e.name, e.dingtalk_user_id, pm.project_id FROM sys_employee e JOIN biz_project_member pm ON pm.employee_id = e.employee_id WHERE e.dingtalk_user_id IS NOT NULL;
