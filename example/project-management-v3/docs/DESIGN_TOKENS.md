# Design Token 系统使用指南

## 概述

Design Token 是设计系统的核心原子，用于存储视觉设计语言的所有设计决策。通过集中管理这些值，确保 UI 的一致性。

---

## 页面标准布局

所有页面应使用统一的标准布局结构：

```tsx
<div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
  {/* 页面头部 */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
      <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        页面标题
      </h1>
      <p className="text-slate-500 text-sm mt-0.5">副标题描述</p>
    </motion.div>

    <div className="flex items-center gap-3">
      {/* 操作按钮 */}
    </div>
  </div>

  {/* 统计栏（可选） */}
  <div className="stats-bar">
    <div className="flex items-center gap-3">
      <div className="stats-item">
        <div className="stats-dot bg-primary"></div>
        <span className="stats-label">总数:</span>
        <span className="stats-value">100</span>
      </div>
    </div>
  </div>

  {/* 过滤栏 */}
  <div className="premium-card p-4">
    {/* 过滤控件 */}
  </div>

  {/* 内容区域 */}
  <div className="premium-card p-4">
    {/* 内容 */}
  </div>
</div>
```

---

## 颜色系统

### 品牌色 (Brand Colors)

| Token | 值 | 用途 |
|-------|-----|------|
| `primary` | `#313a72` | 主色，用于图标背景、重要文字 |
| `secondary` | `#4b648c` | 副标题、辅助文字 |
| `accent` | `#00cc79` | 强调色，用于成功状态、主按钮 |

### 语义色 (Semantic Colors)

| Token | 值 | 用途 |
|-------|-----|------|
| `success` | `#10b981` | 成功状态 |
| `warning` | `#f59e0b` | 警告状态 |
| `danger` | `#ef4444` | 危险/错误状态 |
| `info` | `#3b82f6` | 信息提示 |

### 中性色 (Neutral Colors)

使用 Tailwind 内置的 `slate-*` 颜色，优先使用：

| 用途 | Tailwind 类 |
|------|------------|
| 页面标题 | `text-slate-700` |
| 正文文字 | `text-slate-600` |
| 次要文字 | `text-slate-500` |
| 占位符/辅助 | `text-slate-400` |
| 边框/分割线 | `border-slate-100` / `border-slate-200` |
| 卡片背景 | `bg-white` |

---

## 组件规范

### 页面标题

```tsx
<h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
  <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
    <Icon size={20} strokeWidth={2.5} />
  </div>
  页面标题
</h1>
```

- 字体大小：`text-2xl` (24px)
- 字体粗细：`font-bold` (700)
- 颜色：`text-slate-700`
- 图标容器：`p-2 bg-primary rounded-lg text-white shadow-brand`

### 统计栏

```tsx
<div className="stats-bar">
  <div className="flex items-center gap-3">
    <div className="stats-item">
      <div className="stats-dot bg-primary"></div>
      <span className="stats-label">总数:</span>
      <span className="stats-value">100</span>
    </div>
    <div className="w-px h-4 bg-slate-200"></div>
    <div className="stats-item">
      <div className="stats-dot bg-amber-500"></div>
      <span className="stats-label">风险:</span>
      <span className="stats-value text-amber-600">5</span>
    </div>
  </div>
</div>
```

### 按钮

```tsx
// 主按钮（创建等操作）
<button className="btn-primary">
  <Plus size={16} /> 新建
</button>

// 次要按钮
<button className="btn-secondary">
  编辑
</button>

// 幽灵按钮
<button className="btn-ghost">
  取消
</button>

// 强调按钮（成功/通过）
<button className="btn-accent">
  <Check size={16} /> 确认
</button>
```

### 卡片

```tsx
// 标准卡片
<div className="premium-card p-4">
  内容
</div>

// 统计卡片
<div className="stat-card">
  <Icon className="text-primary" />
  <div>
    <span className="text-xs text-slate-400">标题</span>
    <span className="text-xl font-bold text-slate-900">100</span>
  </div>
</div>
```

### 表单

```tsx
// 标签
<label className="form-label">用户名</label>

// 输入框
<input className="form-control" placeholder="请输入" />

// 搜索框
<input className="input-search" placeholder="搜索..." />
```

### 模态框

```tsx
<div className="modal-overlay">
  <div className="modal-content max-w-xl p-6">
    模态框内容
  </div>
</div>
```

### 过滤栏

```tsx
<div className="premium-card p-4 flex flex-wrap items-center gap-4">
  {/* 搜索框 */}
  <div className="flex-1 min-w-[200px] relative group">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
    <input className="input-search" placeholder="搜索..." />
  </div>

  {/* 过滤按钮组 */}
  <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
    <button className="px-3 py-1.5 text-xs font-medium rounded bg-primary text-white">
      全部
    </button>
    <button className="px-3 py-1.5 text-xs font-medium rounded text-slate-400">
      进行中
    </button>
  </div>
</div>
```

---

## Tailwind CSS 类名映射

### 颜色

| 用途 | Tailwind 类名 |
|------|---------------|
| 品牌主色 | `text-primary` / `bg-primary` |
| 强调色 | `text-accent` / `bg-accent` |
| 标题文字 | `text-slate-700` |
| 正文文字 | `text-slate-600` |
| 次要文字 | `text-slate-500` |

### 圆角

| 用途 | Tailwind 类名 |
|------|---------------|
| 按钮/输入框 | `rounded-lg` |
| 卡片 | `rounded-xl` |

### 阴影

| 用途 | Tailwind 类名 |
|------|---------------|
| 品牌色阴影 | `shadow-brand` |
| 强调色阴影 | `shadow-accent` |
| 轻量阴影 | `shadow-sm` |

---

## CSS 变量

在 `index.css` 中定义，可在任何 CSS 文件中使用：

```css
.my-component {
  color: var(--primary);
  background: var(--accent-soft);
}
```

---

## 迁移指南

### 旧代码迁移

| 旧写法 | 新写法 |
|--------|--------|
| `bg-[#313a72]` | `bg-primary` |
| `text-[#313a72]` | `text-primary` |
| `text-[#4b648c]` | `text-secondary` |
| `text-3xl font-black text-[#313a72]` | `text-2xl font-bold text-slate-700` |
| `shadow-lg shadow-[#313a72]/20` | `shadow-brand` |
| `rounded-[2.5rem]` | `rounded-xl` |
| `bg-slate-50` | 保持或使用 `bg-mesh` |

### 迁移检查清单

- [ ] 标题使用 `text-2xl font-bold text-slate-700`
- [ ] 图标容器使用 `p-2 bg-primary rounded-lg text-white shadow-brand`
- [ ] 按钮使用 `btn-primary` / `btn-secondary` / `btn-ghost`
- [ ] 卡片使用 `premium-card`
- [ ] 过滤栏使用 `premium-card p-4`
- [ ] 表单使用 `form-control` / `input-search`
- [ ] 使用 `slate-*` 而非其他颜色

---

## 注意事项

1. **不要使用硬编码的颜色值** - 使用 Tailwind 内置颜色或 Design Token
2. **不要使用深色 Hero 区域** - 页面应使用 `bg-mesh` 背景
3. **保持标题简洁** - 使用 `text-2xl font-bold` 而非 `text-3xl font-black`
4. **统一使用 `premium-card`** - 卡片样式保持一致
