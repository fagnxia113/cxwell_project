# 前端设计规范

## 概述

本规范基于 `PositionPage` (岗位管理页面) 作为统一标准，所有新建页面和调整页面都应遵循此规范。

---

## 1. 布局规范

### 页面容器
```tsx
// 标准页面容器
<div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4">
```

| 属性 | 值 | 说明 |
|------|-----|------|
| min-h-screen | - | 最小高度为屏幕高度 |
| bg-mesh | 自定义 | 背景样式 |
| p-4 lg:p-6 | - | 内边距：移动端16px，桌面端24px |
| space-y-4 | - | 元素间距：16px |
| animate-fade-in | 自定义 | 淡入动画 |
| custom-scrollbar | 自定义 | 自定义滚动条 |

### 栅格系统
```tsx
// 统计卡片网格 - 2列(移动端) / 4列(桌面端)
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
```

---

## 2. 字体规范

### 页面标题
```tsx
<h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
  <div className="p-2 bg-primary rounded-lg text-white">
    <Icon size={20} strokeWidth={2.5} />
  </div>
  标题文字
</h1>
<p className="text-slate-500 text-sm mt-0.5">副标题</p>
```

| 元素 | 类名 | 字重 | 颜色 |
|------|------|------|------|
| 主标题 | text-2xl font-bold | 700 | text-slate-800 |
| 副标题 | text-sm | 默认 | text-slate-500 |
| 图标容器 | p-2 rounded-lg | - | bg-primary + text-white |

### 统计卡片数字
```tsx
<h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
  {value}
</h3>
```

---

## 3. 颜色规范

### 主色调
```css
/* Tailwind 配置中使用 */
primary: {
  50: '#f0f9ff',
  100: '#e0f2fe',
  500: '#0ea5e9',  /* 主色 */
  600: '#0284c7',
  700: '#0369a1',
}
```

### 状态颜色
```tsx
const colorConfig = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-100' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-100' },
  indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-100' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-100' },
}
```

### 背景与边框
```tsx
// 卡片背景
bg-white rounded-lg border border-slate-100/80 shadow-sm

// 页面背景
bg-mesh (自定义渐变背景)

// 输入框
bg-slate-50 border border-transparent focus:border-indigo-100
```

---

## 4. 组件规范

### 4.1 StatCard 统计卡片

**标准代码：**
```tsx
function StatCard({ title, value, icon: Icon, color, delay }: any) {
  const colorConfig: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600' }
  }
  const config = colorConfig[color] || colorConfig.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 25 }}
      className="bg-white p-6 rounded-lg border border-slate-100/80 shadow-sm relative overflow-hidden group"
    >
      {/* 装饰圆圈 */}
      <div className={cn(
        "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.03]",
        config.bg
      )} />

      {/* 内容区 */}
      <div className="flex items-center gap-5 relative z-10">
        <div className={cn("p-4 rounded-2xl", config.bg)}>
          <Icon size={24} strokeWidth={2.5} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">
            {title}
          </p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            {value}
          </h3>
        </div>
      </div>
    </motion.div>
  )
}
```

**规范要点：**
| 属性 | 值 |
|------|-----|
| 外边距 | p-6 |
| 圆角 | rounded-lg |
| 边框 | border border-slate-100/80 |
| 阴影 | shadow-sm |
| 图标容器 | p-4 rounded-2xl |
| 图标大小 | size={24} strokeWidth={2.5} |
| 标题字号 | text-[10px] font-black uppercase |
| 数字字号 | text-3xl font-black tracking-tighter |

### 4.2 主按钮

```tsx
<button className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110">
  <Icon size={14} />
  <span>按钮文字</span>
</button>
```

**规范要点：**
| 属性 | 值 |
|------|-----|
| 内边距 | px-4 py-2 |
| 圆角 | rounded-lg |
| 字号 | text-sm font-medium |
| 阴影 | shadow-sm |
| 图标大小 | size={14} |

### 4.3 次要按钮

```tsx
<button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:bg-slate-50">
```

### 4.4 Tab 标签

```tsx
<button className={cn(
  "flex items-center gap-2 px-5 py-3 border-b-2 transition-all relative",
  activeTab === tab.key
    ? "border-indigo-500 text-indigo-600 bg-white rounded-t-lg"
    : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-t-lg"
)}
>
  <Icon size={16} />
  <span className="text-sm font-semibold">{label}</span>
</button>
```

**规范要点：**
| 属性 | 值 |
|------|-----|
| 内边距 | px-5 py-3 |
| 圆角 | rounded-lg (顶部) |
| 激活边框 | border-b-2 border-indigo-500 |
| 图标大小 | size={16} |

### 4.5 列表卡片

```tsx
<div className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group">
  <div className="flex items-center gap-4">
    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
      <Icon size={18} />
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-800">标题</h3>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span>描述文字</span>
      </div>
    </div>
  </div>
</div>
```

**规范要点：**
| 属性 | 值 |
|------|-----|
| 内边距 | p-4 |
| 圆角 | rounded-xl |
| 图标容器 | w-11 h-11 rounded-xl |
| 标题字号 | text-sm font-bold |
| 描述字号 | text-xs |

---

## 5. 间距规范

### 标准间距
| 类名 | 值 | 使用场景 |
|------|-----|---------|
| space-y-4 | 16px | 页面元素垂直间距 |
| gap-3 | 12px | 卡片网格间距 |
| gap-4 | 16px | 表单项间距 |
| gap-2 | 8px | 按钮间距 |

### 内边距
| 类名 | 值 | 使用场景 |
|------|-----|---------|
| p-4 | 16px | 移动端容器内边距 |
| p-5/p-6 | 20px/24px | 桌面端容器内边距 |
| p-6 | 24px | StatCard 内边距 |

---

## 6. 阴影规范

| 类名 | 强度 | 使用场景 |
|------|------|---------|
| shadow-sm | 微弱 | 卡片、按钮默认阴影 |
| shadow-md | 中等 | 悬浮状态卡片 |
| shadow-lg | 较强 | 弹窗、模态框 |
| 无阴影 | - | 尽量避免使用过重阴影 |

---

## 7. 圆角规范

| 类名 | 值 | 使用场景 |
|------|-----|---------|
| rounded-lg | 8px | 按钮、卡片、输入框 |
| rounded-xl | 12px | 大卡片、列表项 |
| rounded-2xl | 16px | StatCard 图标容器 |
| rounded-full | - | 避免使用全圆角 |

---

## 8. 图标规范

### 图标大小
| 场景 | 大小 | strokeWidth |
|------|------|-------------|
| 页面标题图标 | size={20} | 2.5 |
| StatCard 图标 | size={24} | 2.5 |
| Tab 图标 | size={16} | 默认 |
| 按钮图标 | size={14} | 默认 |
| 列表图标 | size={18} | 默认 |

### 图标颜色
- 主色图标：`text-primary` 或 `text-white`
- 状态图标：使用对应的状态色如 `text-emerald-600`

---

## 9. 动画规范

### 页面加载动画
```tsx
<motion.div
  initial={{ x: -20, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
>
```

### 卡片动画
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1, type: 'spring', damping: 25 }}
>
```

---

## 10. 快速参考清单

新建或调整页面时，检查以下要点：

- [ ] 页面容器：`min-h-screen bg-mesh p-4 lg:p-6 space-y-4`
- [ ] 标题：`text-2xl font-bold` + `p-2 rounded-lg` 图标
- [ ] StatCard：`p-6 rounded-lg` + `text-3xl font-black` 数字
- [ ] 按钮：`px-4 py-2 rounded-lg text-sm font-medium`
- [ ] Tab：`rounded-lg` + `text-sm font-semibold`
- [ ] 间距：优先使用 `gap-3`、`space-y-4`
- [ ] 阴影：优先使用 `shadow-sm`
- [ ] 圆角：优先使用 `rounded-lg` / `rounded-xl`

---

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-04-21 | v1.0 | 初始规范，基于 PositionPage |
