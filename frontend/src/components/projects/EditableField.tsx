// ============================================================
// 📦 通用可编辑字段组件
// 精简点：原来侧边栏的 manager / tech_manager / 日期 / 技术规格
//         每个字段都写了一遍 isEditing ? <input> : <display>，
//         共重复了 12+ 次。现在用一个组件统一处理。
// ============================================================

import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface EditableFieldProps {
  /** 字段标签 */
  label: string
  /** 标签前的图标 */
  icon?: LucideIcon
  /** 当前值（展示用） */
  value: string | number | undefined | null
  /** 值后面的单位文字，如 m²、kW */
  unit?: string
  /** 是否处于编辑模式 */
  isEditing: boolean
  /** 输入框类型 */
  inputType?: 'text' | 'number' | 'date' | 'textarea'
  /** 编辑模式下的当前表单值 */
  editValue: string | number | undefined
  /** 表单值变化回调 */
  onChange: (value: string | number) => void
  /** 输入框占位文本 */
  placeholder?: string
  /** 未设置时的默认展示文本 */
  emptyText?: string
  /** 展示模式：'text' 正常文字, 'badge' 带背景的标签, 'metric' 大数字+单位, 'detailed' 大段文字卡片 */
  displayMode?: 'text' | 'badge' | 'metric' | 'detailed'
}

export default function EditableField({
  label,
  icon: Icon,
  value,
  unit,
  isEditing,
  inputType = 'text',
  editValue,
  onChange,
  placeholder,
  emptyText = '--',
  displayMode = 'text',
}: EditableFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(inputType === 'number' ? Number(e.target.value) : e.target.value)
  }

  // 通用标签行
  const labelEl = (
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1.5 group-hover/spec:text-emerald-500 transition-colors">
      {Icon && <Icon size={10} className="text-emerald-400" />}
      {label}
    </label>
  )

  if (isEditing) {
    return (
      <div className="group/spec">
        {labelEl}
        {inputType === 'textarea' ? (
          <textarea
            value={editValue ?? ''}
            onChange={handleChange as any}
            placeholder={placeholder}
            rows={4}
            className="w-full bg-slate-50 border-none rounded-xl text-xs font-medium p-3 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none resize-none leading-relaxed"
          />
        ) : (
          <input
            type={inputType}
            value={editValue ?? (inputType === 'number' ? 0 : '')}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full bg-slate-50 border-none rounded-xl text-xs font-black p-2.5 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
          />
        )}
      </div>
    )
  }

  // 展示模式
  const displayValue = value ?? emptyText

  return (
    <div className="group/spec">
      {labelEl}
      {displayMode === 'metric' ? (
        <div className="flex items-baseline gap-1.5">
          <p className="text-base font-black text-slate-900">{displayValue}</p>
          {unit && (
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {unit}
            </span>
          )}
        </div>
      ) : displayMode === 'badge' ? (
        <div className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 shadow-sm leading-relaxed">
          {displayValue}
        </div>
      ) : displayMode === 'detailed' ? (
        <div className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-3 rounded-lg border border-slate-100/50 overflow-y-auto max-h-32">
          {displayValue}
        </div>
      ) : (
        <p className="text-sm font-bold text-slate-700 leading-relaxed">{displayValue}</p>
      )}
    </div>
  )
}
