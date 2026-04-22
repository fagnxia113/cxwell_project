import React, { useState, useRef } from 'react'
import { Upload, Paperclip, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface FileUploadFieldProps {
  value: any
  onChange: (value: any) => void
  readonly?: boolean
}

const readonlyInputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 text-sm font-semibold italic shadow-inner select-none cursor-default"

const FileUploadField: React.FC<FileUploadFieldProps> = ({ value, onChange, readonly }) => {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const files: { name: string; url: string }[] = (() => {
    if (!value) return []
    if (typeof value === 'string') { try { return JSON.parse(value) } catch { return [] } }
    if (Array.isArray(value)) return value
    return []
  })()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles?.length) return
    setUploading(true)
    const token = localStorage.getItem('token')
    const newFiles: { name: string; url: string }[] = [...files]
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const fd = new FormData()
        fd.append('file', selectedFiles[i])
        const uploadUrl = '/api/upload/upload'
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
        if (!res.ok) {
          const text = await res.text()
          console.error('Upload HTTP error:', res.status, text)
          continue
        }
        const data = await res.json()
        if (data.url || data.fileUrl) {
          newFiles.push({ name: data.fileName || selectedFiles[i].name, url: data.url || data.fileUrl })
        } else {
          console.error('Upload response missing url:', data)
        }
      }
      onChange(JSON.stringify(newFiles))
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    onChange(updated.length > 0 ? JSON.stringify(updated) : '')
  }

  if (readonly) {
    return (
      <div className="space-y-1">
        {files.length === 0 ? <div className={readonlyInputClass}>-</div> : files.map((f, i) => (
          <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors">
            <Paperclip size={14} /><span className="truncate">{f.name}</span>
          </a>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
        <Upload size={16} />
        {uploading ? t('common.uploading', { defaultValue: '上传中...' }) : t('common.select_file', { defaultValue: '选择文件' })}
      </button>
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm">
              <Paperclip size={12} className="text-slate-400 shrink-0" />
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex-1">{f.name}</a>
              <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-rose-500 transition-colors shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUploadField