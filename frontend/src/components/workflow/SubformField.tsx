import React, { useRef, useState } from 'react'
import { Plus, Trash2, Paperclip, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useTranslation } from 'react-i18next'
import { FileLink } from '../common/FilePreviewModal'

interface SubformFieldProps {
  value: any[]
  onChange: (value: any[]) => void
  columns: any[]
  readonly?: boolean
  optionsMap?: Record<string, any[]>
}

const COL_WIDTH_MAP: Record<string, string> = {
  projectId: 'w-[180px] min-w-[140px]',
  category: 'w-[120px] min-w-[100px]',
  amount: 'w-[110px] min-w-[90px]',
  expenseDate: 'w-[130px] min-w-[110px]',
  reason: 'min-w-[120px]',
  attachment: 'w-[60px] min-w-[50px] text-center',
}

const SubformField: React.FC<SubformFieldProps> = ({ value = [], onChange, columns, readonly, optionsMap = {} }) => {
  const { t } = useTranslation()
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

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

  const parseFiles = (val: any): { name: string; url: string }[] => {
    if (!val) return []
    if (typeof val === 'string') { try { return JSON.parse(val) } catch { return [] } }
    if (Array.isArray(val)) return val
    return []
  }

  const handleFileUpload = async (index: number, colName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles?.length) return
    const key = `${index}-${colName}`
    setUploadingKey(key)
    const token = localStorage.getItem('token')
    const existingFiles = parseFiles(value[index]?.[colName])
    const newFiles = [...existingFiles]
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const fd = new FormData()
        fd.append('file', selectedFiles[i])
        const res = await fetch('/api/upload/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
        if (!res.ok) continue
        const data = await res.json()
        if (data.url || data.fileUrl) {
          newFiles.push({ name: data.fileName || selectedFiles[i].name, url: data.url || data.fileUrl })
        }
      }
      updateItem(index, colName, newFiles.length > 0 ? JSON.stringify(newFiles) : '')
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploadingKey(null)
      const refKey = `${index}-${colName}`
      if (fileInputRefs.current[refKey]) fileInputRefs.current[refKey]!.value = ''
    }
  }

  const removeFile = (index: number, colName: string, fileIndex: number) => {
    const existingFiles = parseFiles(value[index]?.[colName])
    const updated = existingFiles.filter((_, i) => i !== fileIndex)
    updateItem(index, colName, updated.length > 0 ? JSON.stringify(updated) : '')
  }

  const renderCellContent = (col: any, item: any, index: number) => {
    if (col.type === 'file') {
      const files = parseFiles(item[col.name])
      const refKey = `${index}-${col.name}`
      const isUploading = uploadingKey === refKey

      if (readonly) {
        return (
          <div className="flex items-center justify-center gap-1">
            {files.length > 0 ? (
              <div className="flex items-center gap-0.5 flex-wrap justify-center">
                {files.map((f: any, fi: number) => (
                  <FileLink key={fi} name={f.name} url={f.url} files={files}
                    className="text-primary hover:underline" title={f.name}>
                    <Paperclip size={13} className="text-slate-400 hover:text-primary" />
                  </FileLink>
                ))}
              </div>
            ) : (
              <span className="text-slate-300">-</span>
            )}
          </div>
        )
      }

      return (
        <div className="flex items-center justify-center gap-1 relative">
          <input
            ref={el => { fileInputRefs.current[refKey] = el }}
            type="file"
            onChange={e => handleFileUpload(index, col.name, e)}
            className="hidden"
          />
          {files.length > 0 && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 z-50 min-w-[140px] hidden group-hover/row:block">
              {files.map((f: any, fi: number) => (
                <div key={fi} className="flex items-center gap-1 px-1 py-0.5 text-[11px] hover:bg-slate-50 rounded">
                  <Paperclip size={10} className="text-slate-400 shrink-0" />
                  <FileLink name={f.name} url={f.url} files={files} className="text-primary hover:underline truncate flex-1" />
                  <button type="button" onClick={() => removeFile(index, col.name, fi)} className="text-slate-300 hover:text-rose-500 shrink-0">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRefs.current[refKey]?.click()}
            disabled={isUploading}
            className={cn(
              "p-1 rounded transition-all",
              files.length > 0
                ? "text-primary hover:bg-primary/10"
                : "text-slate-300 hover:text-primary hover:bg-primary/5"
            )}
            title={files.length > 0 ? `${files.length}个附件` : '上传附件'}
          >
            {isUploading ? (
              <span className="block w-[14px] h-[14px] border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Paperclip size={14} />
            )}
          </button>
          {files.length > 0 && (
            <span className="text-[10px] text-primary font-bold">{files.length}</span>
          )}
        </div>
      )
    }

    if (col.type === 'select' || col.type === 'project') {
      const opts = col.options || optionsMap[col.dataSource || col.dynamicOptions || col.type] || []
      return (
        <select
          disabled={readonly}
          value={item[col.name] || ''}
          onChange={e => updateItem(index, col.name, e.target.value)}
          className="w-full bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer"
        >
          <option value="">{readonly ? '-' : '请选择'}</option>
          {opts.map((opt: any) => (
            <option key={opt.value} value={opt.value}>{t(`workflow.form.option.${opt.value}`, { defaultValue: opt.label })}</option>
          ))}
        </select>
      )
    }

    if (col.type === 'number') {
      return (
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
      )
    }

    if (col.type === 'date') {
      return (
        <input
          disabled={readonly}
          type="date"
          value={item[col.name] || ''}
          onChange={e => updateItem(index, col.name, e.target.value)}
          className="w-full bg-transparent border-none text-xs font-medium text-slate-600 focus:ring-0 p-0"
        />
      )
    }

    return (
      <input
        disabled={readonly}
        type="text"
        value={item[col.name] || ''}
        onChange={e => updateItem(index, col.name, e.target.value)}
        className="w-full bg-transparent border-none text-xs font-medium text-slate-600 focus:ring-0 p-0 placeholder:text-slate-200"
        placeholder={`请输入${col.label}`}
      />
    )
  }

  return (
    <div className="space-y-3">
      {!readonly && (
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
        >
          <Plus size={13} strokeWidth={3} />
          添加明细项
        </button>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              {columns.map(col => (
                <th key={col.name} className={cn(
                  "px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest",
                  COL_WIDTH_MAP[col.name] || ''
                )}>
                  {t(`workflow.form.column.${col.name}`, { defaultValue: t(`workflow.form.field.${col.name}`, { defaultValue: col.label }) })}
                </th>
              ))}
              {!readonly && <th className="w-10 px-1"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {value.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (readonly ? 0 : 1)} className="px-4 py-6 text-center text-slate-300 italic text-xs">
                  暂无明细数据
                </td>
              </tr>
            ) : (
              value.map((item, index) => (
                <tr key={item._key || index} className="group/row hover:bg-slate-50/30 transition-colors">
                  {columns.map(col => (
                    <td key={col.name} className={cn(
                      "px-3 py-1.5",
                      COL_WIDTH_MAP[col.name] || ''
                    )}>
                      {renderCellContent(col, item, index)}
                    </td>
                  ))}
                  {!readonly && (
                    <td className="px-1 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={13} />
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
