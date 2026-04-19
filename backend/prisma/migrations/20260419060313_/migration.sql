-- CreateTable
CREATE TABLE "sys_dept" (
    "dept_id" BIGINT NOT NULL PRIMARY KEY,
    "parent_id" BIGINT NOT NULL DEFAULT 0,
    "ancestors" TEXT NOT NULL DEFAULT '',
    "dept_name" TEXT NOT NULL DEFAULT '',
    "order_num" INTEGER NOT NULL DEFAULT 0,
    "leader" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT '0',
    "del_flag" TEXT NOT NULL DEFAULT '0',
    "create_by" TEXT NOT NULL DEFAULT '',
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" TEXT NOT NULL DEFAULT '',
    "update_time" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sys_user" (
    "user_id" BIGINT NOT NULL PRIMARY KEY,
    "dept_id" BIGINT,
    "login_name" TEXT NOT NULL,
    "user_name" TEXT NOT NULL DEFAULT '',
    "user_type" TEXT NOT NULL DEFAULT '00',
    "email" TEXT NOT NULL DEFAULT '',
    "phonenumber" TEXT NOT NULL DEFAULT '',
    "sex" TEXT NOT NULL DEFAULT '0',
    "avatar" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "salt" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '0',
    "del_flag" TEXT NOT NULL DEFAULT '0',
    "login_ip" TEXT NOT NULL DEFAULT '',
    "login_date" DATETIME,
    "create_by" TEXT NOT NULL DEFAULT '',
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" TEXT NOT NULL DEFAULT '',
    "update_time" DATETIME NOT NULL,
    "remark" TEXT
);

-- CreateTable
CREATE TABLE "sys_role" (
    "role_id" BIGINT NOT NULL PRIMARY KEY,
    "role_name" TEXT NOT NULL,
    "role_key" TEXT NOT NULL,
    "role_sort" INTEGER NOT NULL,
    "data_scope" TEXT NOT NULL DEFAULT '1',
    "status" TEXT NOT NULL,
    "del_flag" TEXT NOT NULL DEFAULT '0',
    "create_by" TEXT NOT NULL DEFAULT '',
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" TEXT NOT NULL DEFAULT '',
    "update_time" DATETIME NOT NULL,
    "remark" TEXT
);

-- CreateTable
CREATE TABLE "sys_menu" (
    "menu_id" BIGINT NOT NULL PRIMARY KEY,
    "menu_name" TEXT NOT NULL,
    "parent_id" BIGINT NOT NULL DEFAULT 0,
    "order_num" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL DEFAULT '#',
    "target" TEXT NOT NULL DEFAULT '',
    "menu_type" TEXT NOT NULL DEFAULT '',
    "visible" TEXT NOT NULL DEFAULT '0',
    "perms" TEXT,
    "icon" TEXT NOT NULL DEFAULT '#',
    "create_by" TEXT NOT NULL DEFAULT '',
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_by" TEXT NOT NULL DEFAULT '',
    "update_time" DATETIME NOT NULL,
    "remark" TEXT
);

-- CreateTable
CREATE TABLE "sys_role_menu" (
    "role_id" BIGINT NOT NULL,
    "menu_id" BIGINT NOT NULL,

    PRIMARY KEY ("role_id", "menu_id")
);

-- CreateTable
CREATE TABLE "sys_user_role" (
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,

    PRIMARY KEY ("user_id", "role_id")
);

-- CreateTable
CREATE TABLE "sys_employee" (
    "employee_id" BIGINT NOT NULL PRIMARY KEY,
    "employee_no" TEXT,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "dept_id" BIGINT,
    "position" TEXT,
    "education" TEXT,
    "university" TEXT,
    "user_id" BIGINT,
    "status" TEXT NOT NULL DEFAULT '0',
    "hire_date" DATETIME,
    "leave_date" DATETIME,
    "avatar_color" TEXT,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sys_post" (
    "post_id" BIGINT NOT NULL PRIMARY KEY,
    "post_code" TEXT NOT NULL,
    "post_name" TEXT NOT NULL,
    "post_level" INTEGER NOT NULL DEFAULT 1,
    "post_sort" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT '0',
    "remark" TEXT,
    "create_by" TEXT,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "biz_customer" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "customer_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT '0',
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "biz_project" (
    "project_id" BIGINT NOT NULL PRIMARY KEY,
    "project_code" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "project_type" TEXT DEFAULT 'domestic',
    "customer_id" BIGINT,
    "manager_id" BIGINT,
    "status" TEXT NOT NULL DEFAULT '1',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "budget" DECIMAL NOT NULL DEFAULT 0.00,
    "description" TEXT,
    "create_by" TEXT,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" DATETIME NOT NULL,
    "del_flag" TEXT NOT NULL DEFAULT '0',
    CONSTRAINT "biz_project_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "biz_customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biz_project_member" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "project_id" BIGINT NOT NULL,
    "employee_id" BIGINT NOT NULL,
    "role_name" TEXT,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "join_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "biz_project_member_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "biz_project" ("project_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "biz_project_member_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "sys_employee" ("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biz_task" (
    "task_id" BIGINT NOT NULL PRIMARY KEY,
    "project_id" BIGINT NOT NULL,
    "task_name" TEXT NOT NULL,
    "task_type" TEXT,
    "assignee_id" BIGINT,
    "status" TEXT NOT NULL DEFAULT '0',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "wbs_code" TEXT,
    CONSTRAINT "biz_task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "biz_project" ("project_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biz_project_milestone" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "project_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "planned_date" DATETIME NOT NULL,
    "actual_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT '0',
    CONSTRAINT "biz_project_milestone_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "biz_project" ("project_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biz_project_risk" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "project_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "owner_name" TEXT,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" DATETIME NOT NULL,
    CONSTRAINT "biz_project_risk_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "biz_project" ("project_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biz_project_expense" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "project_id" BIGINT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'manual',
    "source_id" BIGINT,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" DATETIME NOT NULL,
    CONSTRAINT "biz_project_expense_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "biz_project" ("project_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biz_project_staffing_plan" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "project_id" BIGINT NOT NULL,
    "role" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" DATETIME NOT NULL,
    CONSTRAINT "biz_project_staffing_plan_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "biz_project" ("project_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biz_project_report" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "project_id" BIGINT NOT NULL,
    "milestone_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "remarks" TEXT,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" DATETIME NOT NULL,
    CONSTRAINT "biz_project_report_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "biz_project" ("project_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biz_project_report_attachment" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "report_id" BIGINT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "biz_project_report_attachment_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "biz_project_report" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biz_form_template" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "template_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "fields" TEXT NOT NULL,
    "layout" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT '0',
    "create_by" TEXT,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "biz_form_draft" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "template_key" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "form_data" TEXT NOT NULL,
    "create_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "casbin_rule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ptype" TEXT NOT NULL,
    "v0" TEXT,
    "v1" TEXT,
    "v2" TEXT,
    "v3" TEXT,
    "v4" TEXT,
    "v5" TEXT
);

-- CreateTable
CREATE TABLE "flow_definition" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "flow_code" TEXT NOT NULL,
    "flow_name" TEXT NOT NULL,
    "model_value" TEXT NOT NULL DEFAULT 'CLASSICS',
    "category" TEXT,
    "version" TEXT NOT NULL,
    "is_publish" INTEGER NOT NULL DEFAULT 0,
    "form_custom" TEXT DEFAULT 'N',
    "form_path" TEXT,
    "activity_status" INTEGER NOT NULL DEFAULT 1,
    "listener_type" TEXT,
    "listener_path" TEXT,
    "ext" TEXT,
    "create_time" DATETIME,
    "create_by" TEXT DEFAULT '',
    "update_time" DATETIME,
    "update_by" TEXT DEFAULT '',
    "del_flag" TEXT DEFAULT '0',
    "tenant_id" TEXT
);

-- CreateTable
CREATE TABLE "flow_node" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "node_type" INTEGER NOT NULL,
    "definition_id" BIGINT NOT NULL,
    "node_code" TEXT NOT NULL,
    "node_name" TEXT,
    "permission_flag" TEXT,
    "node_ratio" DECIMAL,
    "coordinate" TEXT,
    "any_node_skip" TEXT,
    "listener_type" TEXT,
    "listener_path" TEXT,
    "handler_type" TEXT,
    "handler_path" TEXT,
    "form_custom" TEXT DEFAULT 'N',
    "form_path" TEXT,
    "version" TEXT NOT NULL,
    "create_time" DATETIME,
    "create_by" TEXT DEFAULT '',
    "update_time" DATETIME,
    "update_by" TEXT DEFAULT '',
    "ext" TEXT,
    "del_flag" TEXT DEFAULT '0',
    "tenant_id" TEXT
);

-- CreateTable
CREATE TABLE "flow_skip" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "definition_id" BIGINT NOT NULL,
    "now_node_code" TEXT NOT NULL,
    "now_node_type" INTEGER,
    "next_node_code" TEXT NOT NULL,
    "next_node_type" INTEGER,
    "skip_name" TEXT,
    "skip_type" TEXT,
    "skip_condition" TEXT,
    "coordinate" TEXT,
    "create_time" DATETIME,
    "create_by" TEXT DEFAULT '',
    "update_time" DATETIME,
    "update_by" TEXT DEFAULT '',
    "del_flag" TEXT DEFAULT '0',
    "tenant_id" TEXT
);

-- CreateTable
CREATE TABLE "flow_instance" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "definition_id" BIGINT NOT NULL,
    "business_id" TEXT NOT NULL,
    "node_type" INTEGER NOT NULL,
    "node_code" TEXT NOT NULL,
    "node_name" TEXT,
    "variable" TEXT,
    "flow_status" TEXT NOT NULL,
    "activity_status" INTEGER NOT NULL DEFAULT 1,
    "def_json" TEXT,
    "create_time" DATETIME,
    "create_by" TEXT DEFAULT '',
    "update_time" DATETIME,
    "update_by" TEXT DEFAULT '',
    "ext" TEXT,
    "del_flag" TEXT DEFAULT '0',
    "tenant_id" TEXT
);

-- CreateTable
CREATE TABLE "flow_task" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "definition_id" BIGINT NOT NULL,
    "instance_id" BIGINT NOT NULL,
    "node_code" TEXT NOT NULL,
    "node_name" TEXT,
    "node_type" INTEGER NOT NULL,
    "flow_status" TEXT NOT NULL,
    "form_custom" TEXT DEFAULT 'N',
    "form_path" TEXT,
    "create_time" DATETIME,
    "create_by" TEXT DEFAULT '',
    "update_time" DATETIME,
    "update_by" TEXT DEFAULT '',
    "del_flag" TEXT DEFAULT '0',
    "tenant_id" TEXT
);

-- CreateTable
CREATE TABLE "flow_his_task" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "definition_id" BIGINT NOT NULL,
    "instance_id" BIGINT NOT NULL,
    "task_id" BIGINT NOT NULL,
    "node_code" TEXT,
    "node_name" TEXT,
    "node_type" INTEGER,
    "target_node_code" TEXT,
    "target_node_name" TEXT,
    "approver" TEXT,
    "cooperate_type" INTEGER NOT NULL DEFAULT 0,
    "collaborator" TEXT,
    "skip_type" TEXT,
    "flow_status" TEXT NOT NULL,
    "form_custom" TEXT DEFAULT 'N',
    "form_path" TEXT,
    "ext" TEXT,
    "message" TEXT,
    "variable" TEXT,
    "create_time" DATETIME,
    "update_time" DATETIME,
    "del_flag" TEXT DEFAULT '0',
    "tenant_id" TEXT
);

-- CreateTable
CREATE TABLE "flow_user" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "processed_by" TEXT,
    "associated" BIGINT NOT NULL,
    "create_time" DATETIME,
    "create_by" TEXT DEFAULT '',
    "update_time" DATETIME,
    "update_by" TEXT DEFAULT '',
    "del_flag" TEXT DEFAULT '0',
    "tenant_id" TEXT
);

-- CreateTable
CREATE TABLE "flow_form" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "form_name" TEXT NOT NULL,
    "form_code" TEXT NOT NULL,
    "form_content" TEXT NOT NULL,
    "create_by" TEXT DEFAULT '',
    "create_time" DATETIME,
    "update_by" TEXT DEFAULT '',
    "update_time" DATETIME,
    "del_flag" TEXT DEFAULT '0',
    "tenant_id" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_login_name_key" ON "sys_user"("login_name");

-- CreateIndex
CREATE UNIQUE INDEX "sys_employee_employee_no_key" ON "sys_employee"("employee_no");

-- CreateIndex
CREATE UNIQUE INDEX "sys_employee_user_id_key" ON "sys_employee"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_post_post_code_key" ON "sys_post"("post_code");

-- CreateIndex
CREATE UNIQUE INDEX "biz_customer_customer_no_key" ON "biz_customer"("customer_no");

-- CreateIndex
CREATE UNIQUE INDEX "biz_project_project_code_key" ON "biz_project"("project_code");

-- CreateIndex
CREATE UNIQUE INDEX "biz_project_member_project_id_employee_id_key" ON "biz_project_member"("project_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "biz_form_template_template_key_key" ON "biz_form_template"("template_key");

-- CreateIndex
CREATE INDEX "user_processed_type" ON "flow_user"("processed_by", "type");

-- CreateIndex
CREATE INDEX "user_associated_idx" ON "flow_user"("associated");

-- CreateIndex
CREATE UNIQUE INDEX "flow_form_form_code_key" ON "flow_form"("form_code");
