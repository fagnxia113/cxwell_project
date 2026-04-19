# CxWell V4 前端开发与 UI 指导手册

本文档旨在规范 CxWell V4 系统的后续开发方向，确保新模块在视觉审美、交互逻辑以及系统架构上与现有核心模块保持高度一致。

---

## 1. 设计审美原则 (Visual Language)

CxWell V4 追求的是 **“高密度、沉浸式、极客感”** 的工业软件美学。

### 1.1 核心视觉特征
*   **磨砂玻璃 (Glassmorphism)**：使用 `bg-white/70 backdrop-blur-xl` 构建面板。配合 `border-slate-200/60` 的细边框，营造轻盈的层级感。
*   **高饱和度强调色**：背景使用中性的 `slate-50/900`，但关键动效、图标和进度条应使用高饱和的靛青 (`indigo-600`)、翡翠 (`emerald-500`) 和 琥珀 (`amber-500`)。
*   **极简排版**：标题统一使用 `font-black tracking-tight`，辅助文字使用 `text-[10px] font-bold uppercase tracking-widest`。

### 1.2 动效规范 (Motion)
*   **页面切换**：使用 `framer-motion` 的 `animate-fade-in` 或 `slide-in-from-top`。
*   **微交互**：按钮触发时应有 `active:scale-95` 的物理反馈；卡片悬停时应配合 `group-hover:shadow-2xl`。

---

## 2. 工具链选型 (Tech Stack)

*   **样式库**：Tailwind CSS (禁止直接在组件中写复杂的原始 CSS)。
*   **图标库**：Lucide-react (选型原则：细线条、无填充)。
*   **动效库**：Framer Motion (用于复杂序列动效)。
*   **图表库**：Recharts (轻量且易于响应式适配)。
*   **状态管理**：React Context (用于 User/Permission/Notification)。

---

## 3. 标准模块开发流程 (Development Workflow)

当您需要新增一个业务模块（如“合规审计”）时，请遵循以下四步法：

### 第一步：定义 API (src/api)
创建 `auditApi.ts`，导出 API 接口方法。必须包含 `success` 状态校验。

### 第二步：注册路由 (src/router/index.tsx)
1. 使用 `lazy` 导入页面组件。
2. 在 `routes` 数组中添加对应的 `path`。
3. 如果需要权限控制，包裹 `ProtectedRoute` 或在 `Layout.tsx` 菜单中维护 `permission`。

### 第三步：设计页面 (src/pages)
1. **Header**：统一包含标题、辅助描述及操作按钮组（Refresh/Create）。
2. **Stats区**：使用 `StatCard` 汇总关键指标。
3. **内容区**：表格使用 `DataTable` 模式（高密度、圆角阴影）；详情页使用横向分栏（Tab 或 Timeline）。

---

## 4. 关键模式规范 (Patterns)

### 4.1 权限防护
页面内部按钮操作，请统一使用 `usePermission` Hook：
```tsx
const { hasPermission } = usePermission();
{hasPermission('audit:edit') && <EditButton />}
```

### 4.2 异常与加载
*   **全局加载**：使用 `Suspense` 配合 `LoadingFallback`。
*   **空态处理**：使用 `EmptyState` 组件（带有矢量图标和文字说明）。

---

## 5. 项目风格总结
CxWell V4 的魅力在于 **“把专业功能做得像零售产品一样精致”**。在后续开发中，请始终坚持：与其堆砌功能，不如打磨每一个像素的交互。
