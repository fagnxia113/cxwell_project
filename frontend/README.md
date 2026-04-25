# CxWell Frontend

基于 React + TypeScript + Vite 构建的项目管理系统前端。

## 技术栈

- **框架**: React 19
- **构建工具**: Vite 8
- **UI 组件库**: Ant Design (v6)
- **样式**: Tailwind CSS
- **状态管理**: Redux Toolkit
- **国际化**: i18next (支持中英文切换)
- **图表**: ECharts & Recharts

## 环境配置

1. 复制环境模板：
   ```bash
   cp .env.example .env
   ```
2. 编辑 `.env` 文件：
   - `VITE_API_BASE_URL`: 后端 API 基础地址（例如 `http://api.cxwell.com`）
   - `VITE_PORT`: 本地开发端口（默认 3000）
   - `VITE_ALLOWED_HOSTS`: 允许访问的主机名（部署至 Sealos 等环境时需要设置，例如 `jlxayywgrwee.sealosbja.site`）

## 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产环境打包
npm run build

# 预览生产环境产物
npm run preview
```

## 目录结构

- `src/pages`: 业务页面
- `src/components`: 通用组件库
- `src/locales`: 国际化语言包 (zh-CN.json, en-US.json)
- `src/store`: Redux 状态管理
- `src/services`: API 请求封装
- `src/hooks`: 自定义 React Hooks
- `src/config`: 全局配置（API 路径等）
