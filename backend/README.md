# CxWell Backend

基于 NestJS 框架构建的企业级后端服务。

## 技术栈

- **框架**: NestJS (v10+)
- **ORM**: Prisma
- **数据库**: MySQL 8.0+
- **鉴权**: JWT + Casbin (RBAC)
- **集成**: 钉钉 (DingTalk) 开放平台

## 环境配置

1. 复制环境模板：
   ```bash
   cp .env.example .env
   ```
2. 编辑 `.env` 文件，填入以下关键参数：
   - `DATABASE_URL`: MySQL 连接字符串
   - `JWT_SECRET`: 安全密钥
   - `DINGTALK_APP_KEY/SECRET/AGENT_ID`: 钉钉应用凭证
   - `FRONTEND_URL`: 前端访问地址（用于消息跳转）

## 安装与初始化

```bash
# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 同步数据库结构
npx prisma db push

# (可选) 初始化工作流模版
npm run seed:workflows
```

## 运行

```bash
# 开发环境
npm run start:dev

# 生产环境编译
npm run build
# 生产环境运行
npm run start:prod
```

## 目录结构说明

- `src/modules`: 核心业务模块（项目、通知、上传等）
- `src/workflow`: 工作流引擎核心逻辑
- `src/system`: 系统基础模块（用户、部门、角色、权限）
- `prisma/`: 数据库模型定义与迁移脚本
- `sql/`: 数据库初始化 SQL 脚本
