# 汇升智合项目管理系统 (CxWell Project Management System)

专业的项目生命周期管理系统，集成工作流、人员调勤、资产管理及钉钉深度同步功能。

## 项目架构

本项目采用前后端分离架构：

- **Backend**: 基于 NestJS (Node.js) + Prisma + MySQL
- **Frontend**: 基于 React (TypeScript) + Vite + Tailwind CSS + Ant Design

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd cxwell_project
```

### 2. 后端部署 (Backend)

详细说明请参考 [backend/README.md](./backend/README.md)

1. 进入后端目录：`cd backend`
2. 安装依赖：`npm install`
3. 配置环境：复制 `.env.example` 为 `.env` 并根据实际情况修改数据库、JWT、钉钉等配置。
4. 初始化数据库：
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```
5. 启动服务：`npm run start:prod` (生产环境) 或 `npm run start:dev` (开发环境)

### 3. 前端部署 (Frontend)

详细说明请参考 [frontend/README.md](./frontend/README.md)

1. 进入前端目录：`cd frontend`
2. 安装依赖：`npm install`
3. 配置环境：复制 `.env.example` 为 `.env` 并配置 `VITE_API_BASE_URL` 指向后端地址。
4. 构建打包：`npm run build`
5. 部署产物：将 `dist` 目录下的内容部署至 Nginx 或其他静态托管服务。

## 核心功能模块

- **工作台**: 实时数据概览与快速入口。
- **项目管理**: 全生命周期监控，支持 WBS 任务、里程碑计划、风险预警及费用跟踪。
- **流程中心**: 自定义工作流引擎，支持多级审批、加签、转交等复杂逻辑。
- **人员管理**: 深度集成钉钉考勤、排班报备及汇报关系维护。
- **知识库**: 权限管控的文件资产中心。
- **通知中心**: 系统消息实时推送。

## 许可证

© 2026 汇升智合 (CxWell) 版权所有。
