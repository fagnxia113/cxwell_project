import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileSpreadsheet, Download, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

interface ExcelImportModalProps {
  isOpen: boolean
  onClose: () => void
  importType: 'projects' | 'equipment' | 'accessories'
  onImportSuccess: () => void
}

interface ImportResult {
  success: boolean
  message: string
  total: number
  succeeded: number
  failed: number
  errors: Array<{ row: number; message: string }>
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  importType,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  const titleMap: Record<string, string> = {
    projects: t('import.project_import'),
    equipment: t('import.equipment_import'),
    accessories: t('import.accessory_import')
  }
  const title = titleMap[importType] || t('import.data_import')
  const templateUrl = `/api/import/template/${importType}`

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (selectedFile: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    const ext = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))
    
    if (!validTypes.includes(selectedFile.type) && !['.xls', '.xlsx'].includes(ext)) {
      alert(t('import.upload_excel_only'))
      return
    }
    
    setFile(selectedFile)
    setResult(null)
  }

  const handleImport = async () => {
    if (!file) return

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/import/${importType}`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      setResult(data)

      if (data.success && data.succeeded > 0) {
        onImportSuccess()
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || t('import.import_failed'),
        total: 0,
        succeeded: 0,
        failed: 0,
        errors: []
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadTemplate = () => {
    window.open(templateUrl, '_blank')
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={handleClose} 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" 
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 flex justify-between items-center bg-slate-50 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                {t('import.batch_import_desc')}
              </p>
            </div>
            <button 
              onClick={handleClose} 
              className="w-10 h-10 flex items-center justify-center bg-white shadow-sm border border-slate-100 hover:bg-rose-50 hover:border-rose-100 group rounded-lg transition-all"
            >
              <X size={20} className="text-slate-400 group-hover:text-rose-500 group-hover:rotate-90 transition-all" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Download Template */}
            <button
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#eaf6f1] text-[#00cc79] rounded-2xl border-2 border-[#00cc79]/20 hover:bg-[#eaf6f1]/80 transition-all active:scale-95 shadow-sm"
            >
              <Download size={18} strokeWidth={2.5} />
              <span className="font-black text-sm uppercase tracking-wider">{t('import.download_template')}</span>
            </button>

            {/* Upload Area */}
            <div
              className={cn(
                "border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group",
                dragActive ? "border-[#313a72] bg-[#313a72]/5" : "border-slate-200 hover:border-[#313a72]/30 hover:bg-slate-50",
                file && "border-[#00cc79] bg-[#eaf6f1]/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet size={24} className="text-emerald-600" />
                  <div className="text-left">
                    <p className="font-bold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-bold text-slate-600">{t('import.upload_hint')}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('import.support_format')}</p>
                </>
              )}
            </div>

            {/* Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-xl",
                  result.success ? "bg-emerald-50 border border-emerald-100" : "bg-rose-50 border border-rose-100"
                )}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 size={20} className="text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle size={20} className="text-rose-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={cn("font-bold", result.success ? "text-emerald-700" : "text-rose-700")}>
                      {result.message}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-slate-500">{t('import.total')}: <strong>{result.total}</strong></span>
                      <span className="text-emerald-600">{t('import.succeeded')}: <strong>{result.succeeded}</strong></span>
                      {result.failed > 0 && (
                        <span className="text-rose-600">{t('import.failed')}: <strong>{result.failed}</strong></span>
                      )}
                    </div>
                    {result.errors.length > 0 && (
                      <div className="mt-3 max-h-32 overflow-y-auto text-xs">
                        {result.errors.slice(0, 5).map((err, i) => (
                          <p key={i} className="text-rose-600">
                            {t('import.row_error', { row: err.row, message: err.message })}
                          </p>
                        ))}
                        {result.errors.length > 5 && (
                          <p className="text-slate-400">{t('import.more_errors', { count: result.errors.length - 5 })}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleImport}
              disabled={!file || uploading}
              className={cn(
                "px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2",
                file && !uploading
                  ? "bg-[#313a72] text-white shadow-lg shadow-[#313a72]/20 hover:bg-[#313a72]/90"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('import.importing')}
                </>
              ) : (
                <>
                  <Upload size={16} />
                  {t('import.start_import')}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ExcelImportModal
