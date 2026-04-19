# 知识库权限管理完善计划

## 一、现状分析

### 1.1 现有代码库状态
- **后端**：知识库控制器 (`knowledge.controller.ts`) 基本为空，仅返回空数组
- **数据库**：Prisma schema 已有完整的系统管理模块（用户、角色、菜单、部门等），参照 RuoYi 设计
- **前端**：已有知识库页面 UI，包含权限设置界面（everyone/private/specified 三种模式）
- **权限基础**：已有 RBAC 模型基础和 Casbin 支持

### 1.2 RuoYi 权限管理设计参考
- **RBAC 模型**：用户 - 角色 - 菜单（权限）三层结构
- **数据权限范围**：1=所有数据, 2=自定义数据, 3=本部门数据, 4=本部门及以下, 5=仅本人
- **关联表**：`sys_user_role` (用户-角色), `sys_role_menu` (角色-菜单), `sys_role_dept` (角色-部门数据权限)
- **权限验证**：通过注解和服务层验证用户权限

## 二、设计方案

### 2.1 数据模型设计

#### 新增表结构

1. **知识库文档表** (`biz_knowledge`)
```
- id: 主键
- title: 标题
- type: 类型（文档/视频/SOP等）
- content: 内容
- file_url: 文件地址
- is_folder: 是否文件夹
- parent_id: 父文件夹ID
- visibility_type: 可见性类型（everyone/private/specified）
- created_by: 创建者
- created_at: 创建时间
- updated_at: 更新时间
- del_flag: 删除标记
```

2. **知识库权限关联表** (`biz_knowledge_permission`)
```
- id: 主键
- knowledge_id: 知识库文档/文件夹ID
- target_type: 权限目标类型（user/dept/role/post）
- target_id: 权限目标ID
- permission: 权限类型（view/edit/delete/admin）
- created_at: 创建时间
```

### 2.2 权限设计逻辑

- **everyone**：所有用户可见
- **private**：仅创建者和管理员可见
- **specified**：指定的用户/部门/角色/岗位可见
- **权限继承**：文件夹权限默认继承给子文件夹和文档，也可单独覆盖
- **多级权限**：view (查看) < edit (编辑) < delete (删除) < admin (管理)

## 三、实施步骤

### 步骤 1：数据库模型更新
- 更新 Prisma schema 添加知识库相关表
- 生成 Prisma Client
- 创建数据库迁移

### 步骤 2：后端服务层开发
- 创建 Knowledge 实体和 DTO
- 实现 KnowledgeService 服务类
- 实现权限验证中间件/守卫
- 实现 KnowledgePermissionService 权限服务

### 步骤 3：后端控制器开发
- 完善 KnowledgeController 控制器
- 实现 CRUD 接口
- 实现权限管理接口
- 实现文件上传接口

### 步骤 4：前端更新
- 完善前端 API 调用
- 添加缺失的国际化翻译
- 优化权限设置交互

### 步骤 5：集成和测试
- 前后端联调
- 权限验证测试
- 边界情况测试

## 四、文件修改清单

### 后端修改
1. `/workspace/backend/prisma/schema.prisma` - 添加知识库相关模型
2. `/workspace/backend/src/modules/knowledge/knowledge.controller.ts` - 完善控制器
3. `/workspace/backend/src/modules/knowledge/knowledge.module.ts` - 完善模块
4. 新增：`knowledge.service.ts` - 知识库服务
5. 新增：`knowledge.permission.service.ts` - 权限服务
6. 新增：DTO 文件 - 数据传输对象
7. `/workspace/backend/src/app.module.ts` - 确保模块正确导入

### 前端修改
1. `/workspace/frontend/src/pages/knowledge/KnowledgePage.tsx` - 优化和完善
2. `/workspace/frontend/src/locales/zh-CN.json` - 添加缺失翻译
3. `/workspace/frontend/src/config/api.ts` - 确认 API 路径

## 五、风险和注意事项

1. **权限安全**：确保权限验证在服务层严格执行，防止越权访问
2. **数据一致性**：处理好文件夹删除、权限继承的边界情况
3. **性能优化**：考虑知识库数据量大时的查询性能，合理使用索引
4. **兼容性**：确保与现有用户、角色等模块正确集成
5. **国际化**：完整覆盖所有界面文本的 i18n
