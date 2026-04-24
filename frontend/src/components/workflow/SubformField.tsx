import React from 'react'
import { Plus, Trash2, Paperclip, DollarSign } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useTranslation } from 'react-i18next'

interface SubformFieldProps {
  value: any[]
  onChange: (value: any[]) => void
  columns: any[]
  readonly?: boolean
  optionsMap?: Record<string, any[]>
}

const SubformField: React.FC<SubformFieldProps> = ({ value = [], onChange, columns, readonly, optionsMap = {} }) => {
  const { t } = useTranslation()
  const addItem = () => {
    const newItem = columns.reduce((acc, col) => ({ ...acc, [col.name]: col.defaultValue || '' }), { _key: Math.random().toString(36).substr(2, 9) })
    onChange([...value, newItem])
  }

  const removeItem = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  const updateItem = (index: number, fieldName: string, val: any) => {
    const newValue = [...value]
    newValue[index] = { ...newValue[index], [fieldName]: val }
    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      {!readonly && (
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
        >
          <Plus size={14} strokeWidth={3} />
          添加明细项
        </button>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              {columns.map(col => (
                <th key={col.name} className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {col.label}
                </th>
              ))}
              {!readonly && <th className="w-12"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {value.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (readonly ? 0 : 1)} className="px-4 py-8 text-center text-slate-300 italic text-xs">
                  暂无明细数据
                </td>
              </tr>
            ) : (
              value.map((item, index) => (
                <tr key={item._key || index} className="group hover:bg-slate-50/30 transition-colors">
                  {columns.map(col => (
                    <td key={col.name} className="px-4 py-2">
                      {(col.type === 'select' || col.type === 'project') ? (
                        <select
                          disabled={readonly}
                          value={item[col.name] || ''}
                          onChange={e => updateItem(index, col.name, e.target.value)}
                          className="w-full bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer"
                        >
                          <option value="">{readonly ? '-' : '请选择'}</option>
                          {(col.options || optionsMap[col.dataSource || col.dynamicOptions || col.type] || []).map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{t(opt.label, { defaultValue: opt.label })}</option>
                          ))}
                        </select>
                      ) : col.type === 'number' ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-300 text-[10px]">￥</span>
                          <input
                            disabled={readonly}
                            type="number"
                            value={item[col.name] || ''}
                            onChange={e => updateItem(index, col.name, Number(e.target.value))}
                            className="w-full bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 p-0"
                            placeholder="0.00"
                          />
                        </div>
                      ) : col.type === 'date' ? (
                        <input
                          disabled={readonly}
                          type="date"
                          value={item[col.name] || ''}
                          onChange={e => updateItem(index, col.name, e.target.value)}
                          className="w-full bg-transparent border-none text-xs font-medium text-slate-600 focus:ring-0 p-0"
                        />
                      ) : (
                        <input
                          disabled={readonly}
                          type="text"
                          value={item[col.name] || ''}
                          onChange={e => updateItem(index, col.name, e.target.value)}
                          className="w-full bg-transparent border-none text-xs font-medium text-slate-600 focus:ring-0 p-0 placeholder:text-slate-200"
                          placeholder={`请输入${col.label}`}
                        />
                      )}
                    </td>
                  ))}
                  {!readonly && (
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SubformField
