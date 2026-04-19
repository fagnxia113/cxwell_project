import React from 'react'
import { createPortal } from 'react-dom'
import { FormField, FieldPermissionConfig } from '../../types/workflow'
import { API_URL } from '../../config/api'
import {
  User, Settings, Calendar, Type, Hash, FileText, Mail, Phone, ChevronDown,
  Layout, Layers, Package, Image as ImageIcon, Upload, Plus, Trash2,
  CheckCircle, AlertCircle, MoreVertical, MinusCircle, Search, X,
  Box, Tag, Info, Archive, Filter, Download, ArrowRight, Table,
  ClipboardList
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'
import { useFetch } from '../../hooks/useReactQuery'
import { useTranslation } from 'react-i18next'

interface FormTemplateRendererProps {
  fields: FormField[]
  data?: Record<string, any>
  formData?: Record<string, any>
  onFieldChange: (name: string, value: any) => void
  nodeId?: string
  currentNodeId?: string
  mode?: 'create' | 'edit' | 'view' | 'approval'
  isReadonly?: boolean
  userMap?: Record<string, string>
  departmentMap?: Record<string, string>
  warehouseMap?: Record<string, string>
  projectMap?: Record<string, string>
  positionMap?: Record<string, string>
  customerMap?: Record<string, string>
  repairOrder?: any
}

interface EquipmentOption {
  id: string
  equipment_name?: string
  accessory_name?: string
  model_no: string
  category: string
  manage_code?: string
  unit?: string
  quantity?: number
  accessories?: any[]
  main_image?: string
  available_quantity?: number
}

/**
 * Ultimate visual solution - Portal-based high-level rendering for candidates
 */
const SearchableDropdown: React.FC<{
  label: string
  value: string
  options?: { label: string; value: string }[]
  dynamicUrl?: string | null
  dynamicConfig?: { labelField?: string, valueField?: string }
  onChange: (val: string) => void
  onSearch?: (q: string) => void
  onFocus?: () => void
  placeholder?: string
  isReadonly?: boolean
  allowManualInput?: boolean
}> = React.memo(({ label, value, options: staticOptions = [], dynamicUrl, dynamicConfig, onChange, onSearch, onFocus, placeholder, isReadonly, allowManualInput }) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  
  // Load dynamic options using React Query
  const { data: dynamicData, isLoading } = useFetch(
    dynamicUrl ? ['dynamic-options', dynamicUrl] : [],
    dynamicUrl || '',
    { enabled: !!dynamicUrl }
  )

  const remoteOptions = React.useMemo(() => {
    if (!dynamicData?.data || !Array.isArray(dynamicData.data)) return []
    return dynamicData.data.map((item: any) => {
      if (typeof item === 'string') return { label: item, value: item }
      const labelField = dynamicConfig?.labelField || 'name'
      const valueField = dynamicConfig?.valueField || 'id'
      return {
        label: String(item[labelField] || item.label || ''),
        value: String(item[valueField] || item.value || '')
      }
    })
  }, [dynamicData, dynamicConfig])

  const options = React.useMemo(() => [...staticOptions, ...remoteOptions], [staticOptions, remoteOptions])

  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)
  const displayValue = isOpen ? search : (selected?.label || value || '')

  const filtered = options.filter(o => {
    const labelStr = String(o.label || '').toLowerCase()
    const searchStr = String(search || '').toLowerCase()
    return !searchStr || labelStr.includes(searchStr)
  }).slice(0, 100)

  const updateCoords = React.useCallback(() => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      updateCoords()
      window.addEventListener('scroll', updateCoords, true)
      window.addEventListener('resize', updateCoords)
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [isOpen, updateCoords])

  const commitValue = (val: string) => {
    // If not in options, only submit current search term if allowManualInput is true
    const match = options.find(o => o.label === val || o.value === val)
    if (match) {
      onChange(match.value)
    } else if (allowManualInput && val.trim()) {
      onChange(val.trim())
    } else if (!val.trim()) {
      onChange('')
    }
    setSearch('')
    setIsOpen(false)
  }

  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        const portal = document.getElementById('searchable-portal-container')
        if (portal && portal.contains(e.target as Node)) return

        if (isOpen) {
          // On blur, if manual input is supported, try to submit current search box content
          commitValue(search)
        }
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isOpen, search, options, allowManualInput])

  if (isReadonly) return <div className={readonlyInputClass}>{selected?.label || value || '-'}</div>

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          value={displayValue}
          placeholder={placeholder ? t(placeholder) : `${t('common.search')} ${t(label)}...`}
          onFocus={() => {
            setIsOpen(true)
            setSearch(String(value || ''))
            onFocus?.()
          }}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true)
              onFocus?.()
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitValue(search)
            }
          }}
          onChange={(e) => {
            setSearch(e.target.value)
            if (!isOpen) setIsOpen(true)
            onSearch?.(e.target.value)
          }}
          className={cn(
            baseInputClass,
            "!cursor-text transition-all",
            isOpen && "border-indigo-500 ring-4 ring-indigo-50 shadow-sm"
          )}
        />
      </div>

      {isOpen && createPortal(
        <div
          id="searchable-portal-container"
          style={{
            position: 'absolute',
            top: coords.top + 8,
            left: coords.left,
            width: coords.width,
            zIndex: 999999,
          }}
          className="bg-white border border-slate-200 rounded-xl shadow-[0_25px_70px_-20px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center px-5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {search ? `${t('common.matches')}: ${filtered.length}` : `${t('common.total')}: ${options.length}`}
            </span>
            {allowManualInput && <span className="text-[9px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-black">{t('workflow.manual_input_supported')}</span>}
          </div>

          <div className="max-h-72 overflow-y-auto custom-scrollbar p-1.5">
            {isLoading ? (
              <div className="py-16 text-center text-slate-300 flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-100 border-t-indigo-500 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">{t('common.loading')}</span>
              </div>
            ) : options.length === 0 && !allowManualInput ? (
              <div className="py-16 text-center text-slate-300 flex flex-col items-center gap-3">
                <Search size={32} className="opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">{t('common.noData')}</span>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid gap-1">
                {filtered.map(opt => (
                  <div
                    key={opt.value}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      onChange(opt.value)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    className={cn(
                      "px-5 py-4 text-[14px] font-bold rounded-lg cursor-pointer transition-all flex items-center justify-between",
                      opt.value === value
                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span>{opt.label}</span>
                    {opt.value === value && <CheckCircle size={16} />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-200 flex flex-col items-center gap-4">
                <Search size={48} className="opacity-10" />
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-black uppercase tracking-widest italic">
                    {allowManualInput ? t('workflow.manual_input_hint') : t('common.noMatches')}
                  </span>
                  {allowManualInput && <span className="text-[10px] text-indigo-400 font-bold mt-2">{t('workflow.manual_input_new_value_hint', { search })}</span>}
                </div>
              </div>
            )}
          </div>
          <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-50 text-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] opacity-80">{t('common.system_name')}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
})

// Global Styling Tokens
const baseInputClass = "w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 text-[13px] font-medium transition-all duration-300 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 hover:border-slate-300 placeholder:text-slate-300 shadow-sm"
const readonlyInputClass = "w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 text-[13px] font-semibold italic shadow-inner select-none cursor-default"
const labelClass = "flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2 px-1"
const selectIconClass = "absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none transition-transform group-focus-within:rotate-180 duration-300"

const generateManageCode = (category: string) => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const rand = Math.random().toString(36).substr(2, 4).toUpperCase()
    const prefix = category === 'instrument' ? 'INS' : (category === 'accessory' ? 'ACC' : 'EQ')
    return `${prefix}-${date}-${rand}`
}

const FormTemplateRenderer: React.FC<FormTemplateRendererProps> = ({
  fields,
  data,
  formData: formDataProp,
  onFieldChange,
  nodeId,
  currentNodeId,
  mode = 'create',
  isReadonly: isReadonlyProp,
  userMap = {},
  departmentMap = {},
  warehouseMap = {},
  projectMap = {},
  positionMap = {},
  customerMap = {},
  repairOrder
}) => {
  const { t } = useTranslation()
  const formData = formDataProp || data || {}
  const effectiveNodeId = currentNodeId || nodeId || 'start'
  const isReadonly = isReadonlyProp ?? (mode === 'view' || mode === 'approval')

  // Internal State
  const [equipmentOptions, setEquipmentOptions] = React.useState<EquipmentOption[]>([])
  const [loadingEquipment, setLoadingEquipment] = React.useState(false)
  const [isSelectorModalOpen, setIsSelectorModalOpen] = React.useState(false)
  const [selectorTargetFieldName, setSelectorTargetFieldName] = React.useState('')
  const [modalSearchTerm, setModalSearchTerm] = React.useState('')
  const [modalCategory, setModalCategory] = React.useState<string>('')
  const [modalSelectedIds, setModalSelectedIds] = React.useState<Set<string>>(new Set())
  const [modalSelectedQuantities, setModalSelectedQuantities] = React.useState<Record<string, number>>({})

  // --- Dynamic Options Mapping ---
  // Refactored: SearchableDropdown now fetches and caches via useFetch; parent no longer maintains local store
  // Only retention of category normalization logic here


  // Data Handlers
  const loadEquipmentOptions = React.useCallback(async (locationId?: string, category?: string) => {
    setLoadingEquipment(true)
    try {
      const params = new URLSearchParams()
      if (locationId) params.append('locationId', locationId)
      if (category) params.append('category', category)
      const queryString = params.toString()
      const endpoint = `${API_URL.BASE}/api/stock/summary${queryString ? '?' + queryString : ''}`
      const res = await fetch(endpoint)
      const result = await res.json()
      if (result.success) setEquipmentOptions(result.data || [])
    } finally {
      setLoadingEquipment(false)
    }
  }, [])

  const locationId = formData.location_id || formData.fromLocationId || formData.from_warehouse_id || formData.locationId
  React.useEffect(() => {
    if (isSelectorModalOpen) {
      loadEquipmentOptions(locationId, modalCategory)
    }
  }, [isSelectorModalOpen, locationId, modalCategory, loadEquipmentOptions])

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const token = localStorage.getItem('token')
      // Try both common endpoints just in case
      let res = await fetch(`${API_URL.BASE}/api/upload/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: fd
      })
      const result = await res.json()
      console.log('--- SYSTEM: Upload Result Raw:', result)

      if (result.success) {
        // BACKEND FIX: Aligned with 'fileUrl' key from upload.ts
        return result.fileUrl || result.url || result.data?.url || null
      } else {
        console.error('--- SYSTEM: Upload Server Error:', result.error || result.message)
        return null
      }
    } catch (e) {
      console.error('Upload error:', e)
      return null
    }
  }

  const getFieldPermissions = (field: FormField) => {
    const nodeConfig = field.permissions?.nodePermissions?.[effectiveNodeId]
    const defaultConfig = field.permissions?.default

    // Priority: Node Config > Default Config > Array Config (visibleOn/editableOn) > Field attributes
    let visible = nodeConfig?.visible ?? defaultConfig?.visible
    if (visible === undefined && (field as any).visibleOn) {
      visible = (field as any).visibleOn.includes(effectiveNodeId)
    }
    if (visible === undefined) visible = !field.hidden

    // readonly/disabled attributes have highest priority; forcing non-editable
    if (field.readonly === true || field.disabled === true) {
      let editable = false
      let required = nodeConfig?.required ?? defaultConfig?.required ?? field.required
      if (mode === 'view') {
        editable = false
      }
      return { visible, editable, required }
    }

    let editable = nodeConfig?.editable ?? defaultConfig?.editable ?? (field as any).editable
    if (editable === undefined && (field as any).editableOn) {
      editable = (field as any).editableOn.includes(effectiveNodeId)
    }
    if (editable === undefined) {
      // Unified rule in approval mode: default to read-only
      editable = (!field.readonly && !field.disabled && !(field as any).autoGenerate)
    }

    if (mode === 'approval' && nodeConfig?.editable === undefined && defaultConfig?.editable === undefined && (field as any).editableOn === undefined) {
      editable = false
    }

    let required = nodeConfig?.required ?? defaultConfig?.required ?? field.required

    // If in view mode, forcing non-editable
    if (mode === 'view') {
      editable = false
    }

    return { visible, editable, required }
  }

  const normalizeCategory = (v: any) => {
    const s = String(v || '').trim()
    if (s === t('equipment.category.fake_load') || s === 'fake_load') return 'fake_load'
    if (s === t('equipment.category.accessory') || s === 'accessory') return 'accessory'
    if (s === t('equipment.category.instrument') || s === 'instrument') return 'instrument'
    return s
  }

  const checkVisibleWhen = (visibleWhen: any, currentData: any, fieldName?: string) => {
    if (!visibleWhen) return true
    const { field, equals, notEquals, in: inList, notIn } = visibleWhen
    const val = normalizeCategory(currentData[field])
    if (fieldName === 'manufacturer') {
      console.log('[DEBUG checkVisibleWhen manufacturer]', { fieldName, field, equals, inList, val, currentData })
    }

    const nEquals = equals !== undefined ? normalizeCategory(equals) : undefined
    const nNotEquals = notEquals !== undefined ? normalizeCategory(notEquals) : undefined

    if (nEquals !== undefined && val !== nEquals) return false
    if (nNotEquals !== undefined && val === nNotEquals) return false
    if (inList !== undefined && !inList.map(normalizeCategory).includes(val)) return false
    if (notIn !== undefined && notIn.map(normalizeCategory).includes(val)) return false
    return true
  }

  // Field Wrapper Component
  const fieldWrapper = (field: FormField, children: React.ReactNode, options: { showRequired?: boolean, isAutoGenerate?: boolean } = {}) => {
    const iconMap: Record<string, any> = {
      user: User, date: Calendar, number: Hash, currency: Layers,
      text: Type, email: Mail, phone: Phone, textarea: FileText,
      array: Package, select: Settings, files: Archive, images: ImageIcon
    }
    const Icon = iconMap[field.type] || Info

    const isFullWidthField = field.layout?.width === 'full' || ['array', 'textarea', 'images', 'files'].includes(field.type)
    return (
      <div key={field.name} className={cn("form-field-group mb-6 group/field", isFullWidthField ? 'col-span-full' : 'sm:col-span-1')}>
        <label className={labelClass}>
          <div className="p-1.5 bg-slate-50 rounded-lg group-hover/field:bg-indigo-50 transition-colors shadow-sm">
            <Icon size={12} className="text-slate-400 group-hover/field:text-indigo-500 transition-colors" />
          </div>
          <span className="flex-1">{t(field.label)}</span>
          {options.showRequired && <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shadow-sm shadow-rose-200" title={t('common.required')} />}
          {options.isAutoGenerate && <span className="text-[8px] bg-indigo-50 text-indigo-400 px-1.5 py-0.5 rounded-full font-black">{t('common.autoGenerate')}</span>}
        </label>
        <div className="relative overflow-hidden">
          {children}
        </div>
        {/* {field.description && <span className="text-[10px] text-slate-400 mt-2 block px-2 leading-relaxed opacity-60 font-medium italic">/ {field.description}</span>} */}
      </div>
    )
  }

  // CORE RENDERING DISPATCHER
  const renderFieldInput = (
    field: FormField,
    val: any,
    onFieldChange: (name: string, value: any) => void,
    isReadonly: boolean,
    parentData: any,
    rowIndex?: number // Add row index for ID stability
  ): React.ReactNode => {
    switch (field.type) {
      case 'text':
      case 'phone':
      case 'email':
        return (
          <input
            type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : 'text'}
            value={val}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder ? t(field.placeholder) : t('common.inputPlaceholder')}
            readOnly={isReadonly}
            className={isReadonly ? readonlyInputClass : baseInputClass}
          />
        )

      case 'number':
      case 'currency':
        return (
          <div className="relative">
            <input
              type="number"
              value={val}
              onChange={(e) => onFieldChange(field.name, e.target.value ? Number(e.target.value) : '')}
              placeholder={field.placeholder ? t(field.placeholder) : (field.type === 'currency' ? '0.00' : '0')}
              readOnly={isReadonly}
              className={cn(isReadonly ? readonlyInputClass : baseInputClass, field.type === 'currency' && "pl-8")}
            />
            {field.type === 'currency' && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">{t('common.currency_symbol')}</span>}
          </div>
        )

      case 'textarea':
        return (
          <textarea
            value={val}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder ? t(field.placeholder) : t('common.inputPlaceholder')}
            readOnly={isReadonly}
            rows={field.rows || 4}
            className={cn(isReadonly ? readonlyInputClass : baseInputClass, "resize-none")}
          />
        )

      case 'date':
        return (
          <div className="relative group/date">
            <input
              type="date"
              value={val}
              onChange={(e) => onFieldChange(field.name, e.target.value)}
              readOnly={isReadonly}
              className={cn(isReadonly ? readonlyInputClass : baseInputClass, "block")}
            />
            {!isReadonly && <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within/date:text-indigo-500 transition-colors" size={14} />}
          </div>
        )

      case 'datetime':
        return (
          <div className="relative group/datetime">
            <input
              type="datetime-local"
              value={val ? String(val).replace('Z', '').substring(0, 16) : ''}
              onChange={(e) => onFieldChange(field.name, e.target.value ? e.target.value + ':00' : '')}
              readOnly={isReadonly}
              className={cn(isReadonly ? readonlyInputClass : baseInputClass, "block")}
            />
            {!isReadonly && <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within/datetime:text-indigo-500 transition-colors" size={14} />}
          </div>
        )

      case 'select':
      case 'user':
      case 'department':
      case 'project':
      case 'warehouse':
      case 'customer':
      case 'position':
      case 'lookup':
        const bizConfig = field.businessConfig
        let dynamicType = field.dynamicOptions || field.type || (bizConfig?.entityType?.toLowerCase())

        // Resolve dynamic type from form data if it's a field reference (e.g. fromLocationType)
        if (dynamicType && typeof dynamicType === 'string' && parentData && parentData[dynamicType]) {
          console.log(`[FormTemplateRenderer] Resolving dynamicType for ${field.name} from field ${dynamicType}:`, parentData[dynamicType]);
          dynamicType = parentData[dynamicType];
        }

        let map: Record<string, string> = {}
        const dType = String(dynamicType).toLowerCase()

        // Match entity mapping table
        if (dType === 'user' || dType === 'employee') map = userMap || {}
        else if (dType === 'department') map = departmentMap || {}
        else if (dType === 'project') map = projectMap || {}
        else if (dType === 'warehouse') map = warehouseMap || {}
        else if (dType === 'customer') map = customerMap || {}
        else if (dType === 'position') map = positionMap || {}
        else if (bizConfig?.entityType === 'Customer') map = customerMap || {}
        else if (bizConfig?.entityType === 'Employee') map = userMap || {}

        const staticOptions = field.options?.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt) || []
        
        // Determine if dynamic URL is used to load options
        // If dynamicOptionsConfig.source is configured, prioritize it over map to avoid duplicates
        const hasDynamicUrl = field.dynamicOptionsConfig?.source
        const optSource = hasDynamicUrl ? [] : Object.entries(map).map(([id, name]) => ({ label: String(name), value: id })) || []

        if (isReadonly) {
           const label = [...optSource, ...staticOptions].find(o => String(o.value) === String(val))?.label || val || '-'
           return <div className={readonlyInputClass}>{label}</div>
        }

        return (
          <SearchableDropdown
            label={field.label}
            value={val ?? ''}
            options={[...optSource, ...staticOptions].map(o => ({ ...o, label: t(o.label) }))}
            dynamicUrl={(() => {
                const config = field.dynamicOptionsConfig
                if (!config || !config.source) return null
                const normalizedCat = normalizeCategory(parentData?.category)
                let sourceUrl = config.source
                if (field.name === 'accessory_name' || (field.name === 'equipment_name' && normalizedCat === 'accessory')) sourceUrl = '/api/equipment/accessories/names'
                else if (field.name === 'accessory_model' || (field.name === 'model_no' && normalizedCat === 'accessory')) sourceUrl = '/api/equipment/accessories/models'
                
                const params = new URLSearchParams()
                if (field.dependsOn) {
                  field.dependsOn.forEach(dep => {
                    if (parentData[dep]) {
                      let pk = dep
                      if (dep === 'equipment_name' || dep === 'accessory_name') pk = (field.name === 'model_no' || field.name === 'accessory_model') ? 'equipment_name' : dep
                      params.append(pk, String(parentData[dep]))
                    }
                  })
                }
                const qs = params.toString()
                return `${sourceUrl}${qs ? '?' + qs : ''}`
            })()}
            dynamicConfig={field.dynamicOptionsConfig}
            onChange={(v) => onFieldChange(field.name, v)}
            placeholder={field.placeholder ? t(field.placeholder) : undefined}
            isReadonly={isReadonly}
            allowManualInput={!!field.dynamicOptionsConfig?.allowManualInput}
          />
        )

      case 'array':
        const isReceivingNode = ['receiving', 'qc', 'partial_received', 'to-location-manager', 'unreceived-review', 'partial-receiving-confirm'].includes(effectiveNodeId || '')
        const isShippingNode = ['location-manager-ship', 'from-location-manager', 'shipping'].includes(effectiveNodeId || '')
        const items = Array.isArray(val) ? val : []
        const subFields = field.arrayConfig?.fields || []
        const isTransfer = field.arrayConfig?.modalSelector === true

        if (isTransfer) {
          return (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/80 backdrop-blur-md">
                        {(() => {
                          const headers = [
                            t('common.index'), 
                            t('common.details'), 
                            t('workflow.fields.manage_code'), 
                            t('common.category'), 
                            t('common.quantity')
                          ]
                          if (isReceivingNode) {
                            headers.push(t('workflow.fields.received_quantity'), t('workflow.fields.receiving_images'))
                          } else if (isShippingNode) {
                            headers.push(t('workflow.fields.shipping_images'))
                          }
                          headers.push(t('common.remark'), "")
                          
                          return headers.map((h, i) => (
                            <th key={i} className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{h}</th>
                          ))
                        })()}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {items.map((item: any, idx: number) => {
                        const catVal = String(item.category || '')
                        const isFakeLoad = catVal === 'fake_load'
                        const isAccessory = catVal === 'accessory'
                        const isInstrument = catVal === 'instrument'

                        return (
                          <tr key={item.id || idx} className="hover:bg-indigo-50/20 transition-colors group/row">
                            <td className="px-5 py-5 text-xs font-bold text-slate-300">{idx + 1}</td>
                            <td className="px-5 py-5">
                              <div className="flex items-center gap-3">
                                {item.main_image ? (
                                  <img src={item.main_image} className="w-10 h-10 rounded-xl object-cover shadow-sm bg-slate-100" />
                                ) : (
                                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                                    <Package size={16} />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-700 font-sans">{item.equipment_name || item.name || t('common.noData')}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{item.model_no || t('common.noData')}</span>
                                  </div>
                                  {/* Accessory Tags Section */}
                                  {item.accessory_list && item.accessory_list.length > 0 && (
                                    <div className="mt-2 flex flex-col gap-1.5">
                                      <div className="flex items-center gap-1.5 opacity-60">
                                        <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.accessory_list')} ({item.accessory_list.length})</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {item.accessory_list.map((acc: any, i: number) => (
                                          <div key={i} className="flex items-center gap-1 bg-slate-50 border border-slate-100/50 px-1.5 py-0.5 rounded-lg group/acc hover:border-indigo-200 transition-colors">
                                            <div className="w-1 h-1 rounded-full bg-slate-300 group-hover/acc:bg-indigo-400 transition-colors" />
                                            <span className="text-[8px] font-bold text-slate-500 group-hover/acc:text-indigo-600 transition-colors">
                                              <span className="text-[8px] font-bold text-slate-500 group-hover/acc:text-indigo-600 transition-colors">
                                              {acc.accessory_name} <span className="text-slate-300 mx-0.5">/</span> {acc.accessory_quantity || 1} {t('equipment.unit.default')}
                                            </span>
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-5">
                              {!isFakeLoad && (
                                <span className={cn(
                                  "px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-xl border truncate max-w-[120px] inline-block",
                                  item.manage_code ? "text-indigo-500 bg-indigo-50/50 border-indigo-100/50" : "text-slate-400 bg-slate-50 border-slate-100"
                                )}>
                                  {item.manage_code || t('common.toGenerate')}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-5">
                              <span className={cn(
                                "px-2 py-0.5 text-[9px] font-black uppercase rounded-lg tracking-tighter shadow-sm",
                                isInstrument ? "text-amber-600 bg-amber-50" :
                                  isFakeLoad ? "text-purple-600 bg-purple-50" :
                                    isAccessory ? "text-blue-600 bg-blue-50" : "text-slate-600 bg-slate-50"
                              )}>
                                {isInstrument ? t('equipment.category.instrument') : isFakeLoad ? t('equipment.category.fake_load') : isAccessory ? t('equipment.category.accessory') : t('equipment.category.accessory')}
                              </span>
                            </td>
                            <td className="px-5 py-5">
                              {(isReadonly || item.manage_code || isReceivingNode) ? (
                                <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                                  <Archive size={12} className="text-slate-300" />
                                  {item.quantity} <span className="text-[10px] text-slate-400">{item.unit || t('equipment.unit.default')}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    min={1}
                                    max={item.available_quantity || 9999}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newArr = [...items]
                                      newArr[idx] = { ...newArr[idx], quantity: Math.max(1, Number(e.target.value)) }
                                      onFieldChange(field.name, newArr)
                                    }}
                                    className="w-16 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                  />
                                  <span className="text-[10px] font-bold text-slate-400">{item.unit || t('equipment.unit.default')}</span>
                                </div>
                              )}
                            </td>
                            {isReceivingNode && (
                              <>
                                <td className="px-5 py-5">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="number" 
                                      min={0}
                                      max={item.quantity}
                                      value={item.received_quantity ?? item.quantity}
                                      readOnly={mode === 'view' || effectiveNodeId === 'partial_received'}
                                      onChange={(e) => {
                                        const newArr = [...items]
                                        newArr[idx] = { ...newArr[idx], received_quantity: Number(e.target.value) }
                                        onFieldChange(field.name, newArr)
                                      }}
                                      className={cn(
                                        "w-16 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all",
                                        (mode === 'view' || effectiveNodeId === 'partial_received') && "bg-transparent border-transparent"
                                      )}
                                    />
                                  </div>
                                </td>
                                <td className="px-5 py-5">
                                  <div className="flex items-center gap-1 flex-wrap max-w-[120px]">
                                    {(item.receiving_images || []).map((img: string, i: number) => (
                                      <div key={i} className="relative group/img">
                                        <img src={img} className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
                                        {(mode !== 'view' && effectiveNodeId !== 'partial_received') && (
                                          <button 
                                            onClick={() => {
                                              const newArr = [...items]
                                              newArr[idx].receiving_images = item.receiving_images.filter((_: any, k: number) => k !== i)
                                              onFieldChange(field.name, newArr)
                                            }}
                                            className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                          >
                                            <X size={8} />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    {(mode !== 'view' && effectiveNodeId !== 'partial_received') && (
                                      <label className="w-8 h-8 rounded-lg border border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-all">
                                        <Upload size={12} className="text-slate-300" />
                                        <input 
                                          type="file" 
                                          multiple
                                          className="hidden" 
                                          onChange={async (e) => {
                                            const files = Array.from(e.target.files || [])
                                            const urls = await Promise.all(files.map(handleFileUpload))
                                            const validUrls = urls.filter(Boolean) as string[]
                                            const newArr = [...items]
                                            newArr[idx] = { 
                                              ...newArr[idx], 
                                              receiving_images: [...(item.receiving_images || []), ...validUrls] 
                                            }
                                            onFieldChange(field.name, newArr)
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </td>
                              </>
                            )}
                            {isShippingNode && (
                              <td className="px-5 py-5">
                                <div className="flex items-center gap-1 flex-wrap max-w-[120px]">
                                  {(item.shipping_images || []).map((img: string, i: number) => (
                                    <div key={i} className="relative group/img">
                                      <img src={img} className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
                                      {!isReadonly && (
                                        <button 
                                          onClick={() => {
                                            const newArr = [...items]
                                            newArr[idx].shipping_images = item.shipping_images.filter((_: any, k: number) => k !== i)
                                            onFieldChange(field.name, newArr)
                                          }}
                                          className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                        >
                                          <X size={8} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  {!isReadonly && (
                                    <label className="w-8 h-8 rounded-lg border border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-all">
                                      <Upload size={12} className="text-slate-300" />
                                      <input 
                                        type="file" 
                                        multiple
                                        className="hidden" 
                                        onChange={async (e) => {
                                          const files = Array.from(e.target.files || [])
                                          const urls = await Promise.all(files.map(handleFileUpload))
                                          const validUrls = urls.filter(Boolean) as string[]
                                          const newArr = [...items]
                                          newArr[idx] = { 
                                            ...newArr[idx], 
                                            shipping_images: [...(item.shipping_images || []), ...validUrls] 
                                          }
                                          onFieldChange(field.name, newArr)
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                              </td>
                            )}
                            <td className="px-5 py-5">
                              {isReadonly ? (
                                <span className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed italic">{item.notes || '-'}</span>
                              ) : (
                                <input 
                                  type="text"
                                  value={item.notes || ''}
                                  placeholder={t('common.addRemark')}
                                  onChange={(e) => {
                                    const newArr = [...items]
                                    newArr[idx] = { ...newArr[idx], notes: e.target.value }
                                    onFieldChange(field.name, newArr)
                                  }}
                                  className="w-full bg-transparent border-b border-transparent hover:border-slate-100 focus:border-indigo-500 outline-none text-[10px] text-slate-600 font-medium transition-all"
                                />
                              )}
                            </td>
                            <td className="px-5 py-5 text-right">
                              {!isReadonly && (
                                <button
                                  type="button"
                                  onClick={() => onFieldChange(field.name, items.filter((_, i) => i !== idx))}
                                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover/row:opacity-100 scale-90 hover:scale-110"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-24 text-center">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-100 animate-pulse">
                                <ClipboardList size={32} />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-300">{t('common.noData')}</span>
                                <span className="text-[9px] text-slate-400 font-medium">{t('common.clickToAdd')}</span>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {!isReadonly && (
                <button
                  type="button"
                  onClick={() => { 
                    setSelectorTargetFieldName(field.name); 
                    const existingCat = items.find((it: any) => it.category)?.category;
                    if (existingCat) setModalCategory(existingCat);
                    setIsSelectorModalOpen(true); 
                  }}
                  className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-200/50 hover:-translate-y-1 active:scale-95 group"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-black uppercase tracking-[0.1em]">{field.name === 'items' ? t('workflow.action.add_resource_from_index') : t('workflow.action.batch_fetch_index')}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-50">Enterprise Resource Planning</span>
                  </div>
                  <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>
              )}
            </div>
          )
        }

        return (
          <div className="space-y-6">
            <div className="grid gap-8 grid-cols-1">
              {items.map((item: any, idx: number) => (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="premium-card p-6 bg-slate-50/50 border-slate-100 group/array relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                        <Layout size={16} className="text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t('workflow.fields.item_info_entry')}</span>
                        <span className="text-xs font-black text-slate-700">{field.label}</span>
                      </div>
                    </div>
                    {!isReadonly && (
                      <button
                        type="button"
                        onClick={() => onFieldChange(field.name, items.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-x-5 gap-y-4">
                    {subFields.map((sf: any) => {
                      const rowCategory = normalizeCategory(item.category)
                      const isIndependent = item.is_independent_code ?? (
                        rowCategory === 'fake_load' ? false : 
                        (rowCategory === 'accessory' ? !!(item.manage_code || item.accessory_manage_code) : true)
                      )

                      const hideForFakeLoad = ['manage_code', 'serial_numbers', 'manufacturer', 'accessory_list', 'certificate_no', 'certificate_issuer', 'calibration_expiry']
                      if (rowCategory === 'fake_load' && hideForFakeLoad.includes(sf.name)) {
                        return null
                      }

                      if (sf.name === 'is_independent_code' && item.category && (rowCategory === 'instrument' || rowCategory === 'fake_load')) {
                        return null
                      }

                      if (rowCategory === 'accessory' && sf.name === 'serial_numbers') {
                        return null
                      }

                      if (!checkVisibleWhen(sf.visibleWhen, item, sf.name)) return null

                      const sfWithKey = { ...sf }

                      return (
                        <div key={sf.name} className={cn("flex flex-col gap-2", (sf.layout?.width === 'full' || sf.type === 'textarea' || sf.type === 'images' || sf.type === 'files' || sf.type === 'array') ? "col-span-full" : "col-span-1 md:col-span-3 lg:col-span-4")}>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">{sf.label}</label>
                          {(() => {
                            let sfVal = item[sf.name]
                            let sfReadonly = isReadonly

                            if ((sf.name === 'quantity' || sf.name === 'accessory_quantity') && item.is_independent_code !== false) {
                              sfVal = 1
                              sfReadonly = true
                            }

                            const isRowAccessory = rowCategory === 'accessory'
                            const isIndepCodeField = sf.name === 'manage_code' || sf.name === 'accessory_manage_code'
                            const isSerialField = sf.name === 'serial_numbers'
                            const isIndepToggle = item.is_independent_code === false

                            if (isIndepToggle && (isIndepCodeField || isSerialField)) {
                              sfVal = ''
                              sfReadonly = true
                            }
                            return renderFieldInput(sfWithKey, sfVal, (n, v) => {
                              const newArr = [...items]
                              const oldItem = { ...newArr[idx] }

                              const normalizedField = n
                              const normalizedVal = n === 'category' ? normalizeCategory(v) : v

                              if (normalizedField === 'category') {
                                oldItem.manage_code = ''
                                oldItem.serial_numbers = ''
                                oldItem.accessory_list = []
                                oldItem.manufacturer = ''
                                
                                if (normalizedVal === 'instrument') {
                                  oldItem.is_independent_code = true
                                  oldItem.quantity = 1
                                  oldItem.manage_code = generateManageCode('instrument')
                                } else if (normalizedVal === 'fake_load') {
                                  oldItem.is_independent_code = false
                                  if (!oldItem.quantity) oldItem.quantity = 1
                                } else if (normalizedVal === 'accessory') {
                                  oldItem.is_independent_code = false
                                  oldItem.manage_code = ''
                                  if (!oldItem.quantity) oldItem.quantity = 1
                                }
                              }

                              if (normalizedField === 'is_independent_code') {
                                if (v === true) {
                                  const isNestedAcc = 'accessory_manage_code' in oldItem
                                  const targetField = isNestedAcc ? 'accessory_manage_code' : 'manage_code'
                                  const targetQtyField = isNestedAcc ? 'accessory_quantity' : 'quantity'
                                  const prefix = isNestedAcc ? 'accessory' : normalizeCategory(item.category)
                                  
                                  oldItem[targetQtyField] = 1
                                  if (!oldItem[targetField]) {
                                    oldItem[targetField] = generateManageCode(prefix)
                                  }
                                } else {
                                  if ('accessory_manage_code' in oldItem) oldItem.accessory_manage_code = ''
                                  else oldItem.manage_code = ''
                                }
                              }

                              newArr[idx] = { ...oldItem, [normalizedField]: v }

                              const dependents = subFields.filter((f: any) => f.dependsOn?.includes(n))
                              dependents.forEach((dep: any) => {
                                newArr[idx][dep.name] = ''
                              })

                              onFieldChange(field.name, newArr)
                            }, sfReadonly, item, idx)
                          })()}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
            {!isReadonly && (
              <button
                type="button"
                onClick={() => {
                  const newItem: any = { id: `${field.name}-${Date.now()}` }
                  subFields.forEach((f: any) => {
                    const dv = f.defaultValue ?? ''
                    newItem[f.name] = dv
                  })
                  onFieldChange(field.name, [...items, newItem])
                }}
                className="w-full py-5 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all font-black text-[11px] uppercase tracking-widest group shadow-sm bg-white"
              >
                <Plus size={14} />
                {field.name === 'accessory_list' ? t('workflow.action.add_accessory') : field.name === 'items' ? t('workflow.action.add_item') : t('workflow.action.add_record')}
              </button>
            )}
          </div>
        )

      case 'images':
      case 'files':
        let fileItems: any[] = []
        if (Array.isArray(val)) {
          fileItems = val
        } else if (val && typeof val === 'object') {
          const arrays = Object.values(val).filter(Array.isArray) as any[][]
          if (arrays.length > 0) {
            fileItems = arrays.flat()
          } else {
            fileItems = [val]
          }
        }
        
        const isImgs = field.type === 'images'
        const inputId = `file-upload-${field.name}-${rowIndex ?? 'top'}`

        return (
          <div className="space-y-4">
            <div className={cn(
              isImgs ? "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3" : "flex flex-col gap-2"
            )}>
              {fileItems.map((f: any, i: number) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -2 }}
                  className={cn(
                    "relative overflow-hidden border border-slate-100 shadow-sm bg-white group",
                    isImgs ? "aspect-square rounded-2xl" : "rounded-xl p-3 flex items-center justify-between"
                  )}
                >
                  <div className={cn("flex items-center gap-3", !isImgs && "flex-1")}>
                    {isImgs ? (
                      <img src={typeof f === 'string' ? f : f.url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <>
                        <div className="p-2 bg-slate-50 rounded-lg text-indigo-500">
                          <FileText size={18} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 truncate max-w-[200px]">
                          {typeof f === 'string' ? f.split('/').pop() : f.name}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 relative z-20">
                    <a
                      href={typeof f === 'string' ? f : f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                      title={t('common.open_preview')}
                    >
                      <Download size={14} />
                    </a>
                    {!isReadonly && (
                      <button
                        type="button"
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onFieldChange(field.name, fileItems.filter((_, idx) => idx !== i))
                        }}
                        title={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  {isImgs && (
                    <a
                      href={typeof f === 'string' ? f : f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 z-10 cursor-zoom-in"
                    />
                  )}
                </motion.div>
              ))}
              {!isReadonly && (
                <label
                  htmlFor={inputId}
                  style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
                  className={cn(
                    "flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-300 transition-all group overflow-hidden",
                    isImgs ? "aspect-square" : "py-10 bg-slate-50/30"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    <Plus size={16} />
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t('common.add')} {isImgs ? t('common.image') : t('common.file')}</span>
                  <input
                    id={inputId}
                    type="file"
                    multiple
                    accept={isImgs ? "image/*" : "*"}
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || [])
                      const urls = await Promise.all(files.map(handleFileUpload))
                      const newItems = urls.filter(Boolean).map((url, idx) => isImgs ? url : { url, name: files[idx].name })
                      onFieldChange(field.name, [...fileItems, ...newItems])
                      e.target.value = ''
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={cn(
                "w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-500",
                val ? "bg-slate-900 border-slate-900 shadow-lg shadow-slate-200" : "bg-white border-slate-200 group-hover:border-indigo-400"
              )}
              onClick={() => !isReadonly && onFieldChange(field.name, !val)}
            >
              <AnimatePresence>
                {val && (
                  <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                    <CheckCircle className="text-white" size={16} strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{field.label}</span>
              <span className="text-[10px] text-slate-400 font-medium">{val ? t('common.yes') : t('common.no')}</span>
            </div>
          </label>
        )

      default:
        return (
          <input
            type="text"
            value={val}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder || '...'}
            readOnly={isReadonly}
            className={isReadonly ? readonlyInputClass : baseInputClass}
          />
        )
    }
  }

  const renderField = (field: FormField) => {
    const permissions = getFieldPermissions(field)
    if (!permissions.visible || !checkVisibleWhen(field.visibleWhen, formData)) return null

    let val = formData[field.name]
    let isFieldReadonly = !permissions.editable
    const isFieldRequired = permissions.required

    return fieldWrapper(field, renderFieldInput(field, val, (n, v) => {
      onFieldChange(n, v)
    }, isFieldReadonly, formData), {
      showRequired: isFieldRequired,
      isAutoGenerate: (field as any).autoGenerate
    })
  }

  return (
    <div className="premium-form-renderer w-full max-w-[1600px] mx-auto py-12 px-12">
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-12 gap-x-12 gap-y-2 p-1"
      >
        {(() => {
          const groups: Record<string, FormField[]> = {}
          fields.forEach(f => {
            const isVisible = checkVisibleWhen(f.visibleWhen, formData, f.name)
            if (isVisible) {
              const g = (f as any).group || t('common.basicInfo')
              if (!groups[g]) groups[g] = []
              groups[g].push(f)
            }
          })

          const visibleGroupEntries = Object.entries(groups).filter(([groupName, groupFields]) => {
            return groupFields.some(f => {
              const permissions = getFieldPermissions(f);
              const isVisibleWhen = checkVisibleWhen(f.visibleWhen, formData);
              return permissions.visible && isVisibleWhen;
            });
          });

          return visibleGroupEntries.map(([groupName, groupFields], gIdx) => (
            <div key={groupName} className="col-span-full mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-1.5 bg-indigo-600 rounded-md shadow-lg shadow-indigo-100" />
                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-3">
                  {groupName}
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-black rounded-md uppercase tracking-widest">Section {gIdx + 1}</span>
                </h2>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-slate-100 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-2 px-2">
                {groupFields.map((f) => {
                  const permissions = getFieldPermissions(f);
                  if (!permissions.visible || !checkVisibleWhen(f.visibleWhen, formData)) return null;

                  const isFullWidth = f.layout?.width === 'full' || f.type === 'textarea' || f.type === 'array' || f.type === 'images' || f.type === 'files';
                  const colSpan = isFullWidth ? 'col-span-full' : 'col-span-1 md:col-span-6 lg:col-span-4';

                  return (
                    <div key={f.name} className={colSpan}>
                      {renderField(f)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        })()}
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {isSelectorModalOpen && (
            <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-8 overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSelectorModalOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className="relative w-full max-w-5xl h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
              >
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <Archive size={20} />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-bold text-slate-800 leading-tight">{t('workflow.selector.title')}</h2>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-60">Enterprise Asset Inventory Indexer</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSelectorModalOpen(false)}
                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="px-6 py-3 bg-slate-50/50 flex flex-col md:flex-row gap-3 items-center border-b border-slate-100">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input
                      type="text"
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      placeholder={t('workflow.selector.search_placeholder')}
                      className="w-80 pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 p-1.5 bg-slate-50/80 rounded-xl border border-slate-100/50">
                    {[
                      { label: t('common.all'), value: '' },
                      { label: t('equipment.category.instrument'), value: 'instrument' },
                      { label: t('equipment.category.fake_load'), value: 'fake_load' },
                      { label: t('equipment.category.accessory'), value: 'accessory' }
                    ].map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setModalCategory(cat.value)}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all",
                          modalCategory === cat.value
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar bg-white">
                  <div className="flex flex-col gap-2.5">
                    {loadingEquipment ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">{t('common.loading')}</span>
                      </div>
                    ) : (equipmentOptions
                      .filter(o => {
                        if (modalCategory && o.category !== modalCategory) return false;
                        if (!modalSearchTerm) return true;
                        const term = modalSearchTerm.toLowerCase();
                        return (o.equipment_name || o.accessory_name || '').toLowerCase().includes(term) ||
                               (o.model_no || '').toLowerCase().includes(term) ||
                               (o.manage_code || '').toLowerCase().includes(term);
                      }).length === 0 ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-40 text-slate-200">
                          <Search size={64} className="mb-6 opacity-20" />
                          <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">{t('common.noMatches')}</h3>
                          <span className="text-[9px] font-medium text-slate-400 mt-2 opacity-60 italic">{t('workflow.manual_input_hint')}</span>
                        </motion.div>
                      ) : (equipmentOptions
                        .filter(o => {
                          if (modalCategory && o.category !== modalCategory) return false;
                          if (!modalSearchTerm) return true;
                          const term = modalSearchTerm.toLowerCase();
                          return (o.equipment_name || o.accessory_name || '').toLowerCase().includes(term) ||
                                 (o.model_no || '').toLowerCase().includes(term) ||
                                 (o.manage_code || '').toLowerCase().includes(term);
                        })
                        .map((opt) => {
                          const isSelected = modalSelectedIds.has(opt.id)
                          const accessories = opt.accessories || []
                          
                          return (
                            <div
                              key={opt.id}
                              className={cn(
                                "flex items-center gap-4 p-3 rounded-xl border-2 transition-all cursor-pointer group",
                                isSelected
                                  ? "bg-indigo-50/40 border-indigo-600"
                                  : "bg-white border-slate-50 hover:border-slate-200 hover:bg-slate-50/30"
                              )}
                              onClick={() => {
                                const newSet = new Set(modalSelectedIds)
                                if (isSelected) newSet.delete(opt.id)
                                else newSet.add(opt.id)
                                setModalSelectedIds(newSet)
                              }}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm border overflow-hidden",
                                isSelected ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-300 border-slate-100"
                              )}>
                                {isSelected ? (
                                  <CheckCircle size={20} />
                                ) : (
                                  opt.main_image ? (
                                    <img src={opt.main_image} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Box size={18} />
                                  )
                                )}
                              </div>

                              <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-12 md:col-span-5 flex flex-col min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={cn(
                                      "px-2 py-0.5 text-[8px] font-black uppercase rounded-lg tracking-tight",
                                      opt.category === 'instrument' ? "text-amber-600 bg-amber-50" :
                                        opt.category === 'fake_load' ? "text-purple-600 bg-purple-50" : "text-blue-600 bg-blue-50"
                                    )}>
                                      {opt.category === 'instrument' ? t('equipment.category.instrument') : opt.category === 'fake_load' ? t('equipment.category.fake_load') : t('equipment.category.accessory')}
                                    </span>
                                    <span className="text-[9px] font-mono font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/50">{opt.manage_code}</span>
                                  </div>
                                  <h3 className="text-sm font-bold text-slate-700 truncate">{opt.equipment_name || opt.accessory_name || t('common.undefined_asset_name')}</h3>
                                  <span className="text-[10px] font-bold text-slate-400 truncate">{opt.model_no || 'MODEL_N/A'}</span>
                                </div>

                                <div className="col-span-6 md:col-span-2 flex flex-col items-end">
                                  <span className="text-[9px] font-bold text-slate-300 uppercase leading-none mb-1">{t('equipment.fields.stock_balance')}</span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-slate-700 leading-none">{(opt.quantity || 0) + (opt.available_quantity || 0)}</span>
                                    <span className="text-[9px] font-bold text-slate-400">{opt.unit || t('equipment.unit.default')}</span>
                                  </div>
                                </div>

                                <div className="col-span-6 md:col-span-5 border-l border-slate-100 pl-4 flex flex-col min-w-0">
                                  <span className="text-[9px] font-bold text-slate-300 uppercase mb-1">{t('equipment.fields.accessory_list')} ({accessories.length})</span>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {accessories.length > 0 ? (
                                      accessories.slice(0, 3).map((acc: any, i: number) => (
                                        <span key={i} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate max-w-[80px]">
                                          {acc.accessory_name || acc.name}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[10px] font-bold text-slate-200 italic">EMPTY_SET</span>
                                    )}
                                    {accessories.length > 3 && (
                                      <span className="text-[10px] p-0.5 font-bold text-indigo-400">+{accessories.length - 3}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    {modalSelectedIds.size > 0 ? (
                      <span className="text-[11px] font-bold text-slate-700 italic">{t('workflow.selector.locked_count', { count: modalSelectedIds.size })}</span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-300 italic uppercase tracking-widest">{t('workflow.selector.select_hint')}</span>
                    )}
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setIsSelectorModalOpen(false)}
                      className="px-8 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      disabled={modalSelectedIds.size === 0}
                      onClick={() => {
                        const currentArray = formData[selectorTargetFieldName] || []
                        const selectedToAdd = equipmentOptions
                          .filter(o => modalSelectedIds.has(o.id))
                          .map(o => ({
                            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            equipment_id: o.id,
                            equipment_name: o.equipment_name || o.accessory_name,
                            model_no: o.model_no,
                            category: o.category,
                            unit: o.unit || t('equipment.unit.default'),
                            manage_code: o.manage_code,
                            quantity: modalSelectedQuantities[o.id] || 1,
                            available_quantity: (o.quantity || 0) + (o.available_quantity || 0),
                            main_image: o.main_image,
                            is_independent_code: o.category === 'fake_load' ? false : !!o.manage_code,
                            accessory_list: (o.accessories || []).map((acc: any) => ({
                              id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              accessory_name: acc.accessory_name,
                              accessory_model: acc.model_no,
                              accessory_manage_code: acc.manage_code,
                              accessory_quantity: acc.quantity || 1,
                              is_independent_code: !!acc.manage_code
                            }))
                          }))
                        onFieldChange(selectorTargetFieldName, [...currentArray, ...selectedToAdd])
                        setIsSelectorModalOpen(false)
                        setModalSelectedIds(new Set())
                        setModalSelectedQuantities({})
                      }}
                      className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all flex items-center gap-3 disabled:bg-slate-200 disabled:shadow-none"
                    >
                      <CheckCircle size={18} />
                      <span>{t('workflow.selector.confirm')}</span>
                    </button>
                  </div>
                </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        .premium-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 1rem;
        }
        .premium-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.2);
          background: white;
        }
      `}</style>
    </div>
  )
}

export default FormTemplateRenderer