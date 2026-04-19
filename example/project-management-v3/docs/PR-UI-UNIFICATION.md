# PR: UI 风格统一化重构

## 概述

本次 PR 解决了项目中存在的 **UI 风格不一致问题**，统一了所有页面的视觉规范，并建立了 **Design Token 系统** 以确保未来 UI 的一致性和可维护性。

---

## 变更类型

- [x] **UI 优化** - 不影响功能，仅视觉调整
- [x] **基础设施** - 新增 Design Token 系统
- [ ] **Bug 修复** - 不涉及
- [ ] **破坏性变更** - 不涉及（完全向后兼容）

---

## 问题描述

经过代码审查，发现项目中存在以下 UI 不一致问题：

### 1. 页面背景色不统一

| 页面 | 修改前 | 修改后 |
|------|--------|--------|
| EquipmentListPage | `bg-slate-50` | `bg-mesh` |
| TaskBoardPage | 无特殊背景 | 保持一致 |
| DashboardPage | `bg-mesh` | 保持不变 |
| ApprovalPendingPageNew | `bg-mesh` | 保持不变 |

### 2. 主色调使用混乱

项目定义了品牌色 `#313a72`（深蓝）和 `#00cc79`（绿色），但部分页面使用了其他颜色：

- **修改前**：部分页面使用 `slate-900`、`blue-500`、`blue-600` 等非品牌色
- **修改后**：统一使用 `#313a72` 作为标题主色，`#00cc79` 作为主按钮色

### 3. 按钮样式不统一

| 按钮类型 | 统一后样式 |
|----------|-----------|
| 主按钮（新建） | `bg-accent rounded-xl shadow-accent/20` |
| 次要按钮 | `bg-primary rounded-xl shadow-primary/20` |

### 4. 模态框圆角不统一

| 页面 | 修改前 | 修改后 |
|------|--------|--------|
| PersonnelListPage | `rounded-[32px]` | `rounded-2xl` |
| CustomerListPage | `rounded-xl` | `rounded-2xl` |
| DepartmentPage | `rounded-xl` | `rounded-2xl` |
| KnowledgePage | `rounded-3xl` | 保持不变 |

### 5. 表单输入框圆角不统一

统一将 `rounded-lg` 改为 `rounded-xl`，保持与其他组件的一致性。

---

## 新增功能：Design Token 系统

### 设计目标

1. **单一数据源** - 所有设计值集中在 `design-tokens.ts` 管理
2. **主题切换支持** - 通过 CSS 变量支持未来主题切换
3. **Tailwind 集成** - 自动生成 Tailwind 配置
4. **开发体验优化** - 提供类型安全的 Token 访问

### 新增文件

| 文件路径 | 说明 |
|----------|------|
| `src/frontend/styles/design-tokens.ts` | Design Token 核心配置（单一数据源） |
| `src/frontend/styles/css-generator.ts` | CSS 变量生成器 |
| `docs/DESIGN_TOKENS.md` | Design Token 使用指南 |

### 更新的文件

| 文件路径 | 变更内容 |
|----------|----------|
| `tailwind.config.ts` | 集成 Design Token，扩展 Tailwind 主题 |
| `src/frontend/index.css` | 更新 CSS 变量定义，统一组件类 |

### Design Token 结构

```
tokens/
├── color/
│   ├── brand/        # 品牌色 (primary, accent, secondary)
│   ├── semantic/     # 语义色 (success, warning, danger, info)
│   ├── neutral/      # 中性色 (50-900)
│   └── surface/      # 表面色 (bgMesh, glass, sidebarDark)
├── radius/           # 圆角系统
├── shadow/           # 阴影系统
├── spacing/          # 间距系统
├── typography/       # 字体系统
├── animation/        # 动画系统
└── transition/       # 过渡系统
```

---

## 变更文件清单

### 新增文件

| 文件路径 | 说明 |
|----------|------|
| `src/frontend/styles/design-tokens.ts` | Design Token 核心配置 |
| `src/frontend/styles/css-generator.ts` | CSS 变量生成器 |
| `docs/DESIGN_TOKENS.md` | Design Token 使用指南 |

### 前端页面文件

| 文件路径 | 变更内容 |
|----------|----------|
| `src/frontend/pages/equipment/EquipmentListPage.tsx` | 背景色、标题色、主按钮色、hover样式 |
| `src/frontend/pages/customers/CustomerListPage.tsx` | 标题样式、主按钮色、模态框圆角、表单圆角 |
| `src/frontend/pages/organization/DepartmentPage.tsx` | 主按钮色、模态框圆角 |
| `src/frontend/pages/admin/UserManagementPage.tsx` | 标题样式、图标背景 |
| `src/frontend/pages/tasks/TaskBoardPage.tsx` | 头部背景色改为品牌色 |
| `src/frontend/pages/personnel/PersonnelListPage.tsx` | 模态框圆角 |

### 配置文件

| 文件路径 | 变更内容 |
|----------|----------|
| `tailwind.config.ts` | 集成 Design Token，扩展 Tailwind 主题 |
| `src/frontend/index.css` | 更新 CSS 变量，添加新的全局组件类 |

---

## 设计规范（统一后）

### 色彩系统

| 用途 | 色值 | CSS 变量 | Tailwind 类 |
|------|------|---------|-------------|
| 品牌主色 | `#313a72` | `--primary` | `text-primary` / `bg-primary` |
| 强调色 | `#00cc79` | `--accent` | `text-accent` / `bg-accent` |
| 副标题色 | `#4b648c` | `--secondary` | `text-secondary` |
| 背景色 | mesh | CSS | `bg-mesh` |

### 组件规范

| 组件 | 规范 | 全局类名 |
|------|------|---------|
| 页面标题 | 标题样式 | - |
| 图标容器 | 统一图标背景 | - |
| 主按钮 | 绿色强调 | `btn-primary` |
| 次要按钮 | 深蓝主色 | `btn-secondary` |
| 幽灵按钮 | 白底边框 | `btn-ghost` |
| 模态框 | 圆角 + 阴影 | `modal-content` |
| 表单输入框 | 统一输入框 | `form-control` |
| 搜索框 | 搜索框样式 | `input-search` |
| 统计卡片 | 统一卡片 | `stat-card` |

---

## 组件使用示例

### 按钮

```tsx
<button className="btn-primary">
  <Plus size={16} /> 新建
</button>

<button className="btn-secondary">
  编辑
</button>

<button className="btn-ghost">
  取消
</button>
```

### 表单

```tsx
<label className="form-label">用户名</label>
<input className="form-control" placeholder="请输入" />
<input className="input-search" placeholder="搜索..." />
```

### 卡片

```tsx
<div className="premium-card p-6">
  内容
</div>

<div className="stat-card">
  <Icon />
  <div>统计数据</div>
</div>
```

### 模态框

```tsx
<div className="modal-overlay">
  <div className="modal-content max-w-xl p-6">
    模态框内容
  </div>
</div>
```

---

## 迁移指南

### 旧代码迁移

| 旧写法 | 新写法 |
|--------|--------|
| `bg-[#313a72]` | `bg-primary` |
| `bg-[#00cc79]` | `bg-accent` |
| `text-[#313a72]` | `text-primary` |
| `text-[#4b648c]` | `text-secondary` |
| `shadow-lg shadow-[#313a72]/20` | `shadow-brand` |
| `shadow-lg shadow-[#00cc79]/20` | `shadow-accent` |
| 硬编码颜色值 | 使用 CSS 变量 `var(--primary)` |

### 迁移检查清单

- [ ] 将硬编码颜色替换为 Design Token
- [ ] 将硬编码阴影替换为 Design Token
- [ ] 确保圆角使用统一规范
- [ ] 检查按钮是否使用 `btn-primary` / `btn-secondary` / `btn-ghost`
- [ ] 检查表单是否使用 `form-control` / `input-search`

---

## 视觉预览

### 修改前

```
┌─────────────────────────────────────────────────────┐
│  Equipment List (slate-900 标题)                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ [+ 新建] (blue-600)                              ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ 数据表格 ...                                     ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 修改后

```
┌─────────────────────────────────────────────────────┐
│  ┌────┐  Equipment List (primary 标题)             │
│  │ 📦 │                                               │
│  └────┘                                               │
│  ┌─────────────────────────────────────────────────┐│
│  │ [+ 新建] (accent)                                ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ 数据表格 ...                                     ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 测试建议

- [ ] 验证 EquipmentListPage 页面显示正确
- [ ] 验证 CustomerListPage 新建客户弹窗样式正确
- [ ] 验证 DepartmentPage 部门管理页面按钮样式正确
- [ ] 验证 UserManagementPage 用户管理页面标题正确
- [ ] 验证 TaskBoardPage 头部区域显示正确
- [ ] 验证 PersonnelListPage 编辑员工弹窗圆角正确
- [ ] 检查所有页面背景色是否一致（应为 `bg-mesh` 或白色）
- [ ] 验证按钮 hover 状态正常
- [ ] 验证 Design Token 在 TypeScript 中的类型提示正常
- [ ] 验证 Tailwind 类名（如 `text-primary`、`shadow-brand`）正常工作

---

## 相关文档

- [Design Token 使用指南](DESIGN_TOKENS.md)

---

## 相关 Issue

- Issue: UI 风格不统一（用户反馈）

---

## 备注

- 本次变更仅涉及 CSS/Tailwind 样式类名调整，不影响任何业务逻辑
- Design Token 系统完全向后兼容，渐进式迁移
- 所有设计值集中在 `design-tokens.ts` 管理，便于未来维护
- CSS 变量定义支持未来主题切换（如深色模式）

---

## 分支信息

- **源分支**: `feature/ui-unification`
- **目标分支**: `develop`
- **审查人**: 待指定
- **预计合并时间**: 2026-04-17
