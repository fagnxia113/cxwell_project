import React from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useFormDesigner } from '../../hooks/useFormDesigner'

// Sub-components
import DesignerHeader from '../../components/forms/designer/DesignerHeader'
import DesignerStructureSidebar from '../../components/forms/designer/DesignerStructureSidebar'
import DesignerPropertyPanel from '../../components/forms/designer/DesignerPropertyPanel'
import DesignerCanvas from '../../components/forms/designer/DesignerCanvas'
import DesignerPreviewOverlay from '../../components/forms/designer/DesignerPreviewOverlay'

/**
 * 表单设计器 (重构版)
 * 核心设计：三栏式沉浸交互 + Hook 驱动的数据流
 */
const FormDesignerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  
  const {
    templateName,
    layoutType,
    layoutColumns,
    fields,
    selectedFieldIndex,
    previewMode,
    previewData,
    loading,
    saving,
    setTemplateName,
    setLayoutType,
    setLayoutColumns,
    setSelectedFieldIndex,
    setPreviewMode,
    setPreviewData,
    addField,
    updateField,
    deleteField,
    moveField,
    saveTemplate
  } = useFormDesigner(id)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-mesh gap-12 overflow-hidden animate-fade-in">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin mx-auto" />
        <div className="space-y-2 text-center">
           <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">正在初始化设计引擎</p>
           <p className="text-xs text-slate-400 font-medium">正在恢复架构数据流...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50/50">
      {/* 1. 顶部工具栏 (Global Utils) */}
      <DesignerHeader 
        templateName={templateName}
        setTemplateName={setTemplateName}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        saving={saving}
        onSave={saveTemplate}
      />

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* 2. 左侧结构侧边栏 (Navigation / Setup) */}
        {!previewMode && (
          <div className="w-80 shrink-0">
            <DesignerStructureSidebar 
              layoutType={layoutType}
              setLayoutType={setLayoutType}
              layoutColumns={layoutColumns}
              setLayoutColumns={setLayoutColumns}
              fields={fields}
              selectedFieldIndex={selectedFieldIndex}
              onSelectField={setSelectedFieldIndex}
              onAddField={addField}
              onMoveField={moveField}
              onDeleteField={deleteField}
            />
          </div>
        )}

        {/* 3. 中间主设计画布 (Drafting Canvas) */}
        <div className="flex-1 flex flex-col min-w-0">
          <DesignerCanvas 
            fields={fields}
            layoutType={layoutType}
            layoutColumns={layoutColumns}
            selectedFieldIndex={selectedFieldIndex}
            onSelectField={setSelectedFieldIndex}
          />
        </div>

        {/* 4. 右侧属性面板 (Property Matrix) */}
        {!previewMode && (
          <div className="w-80 shrink-0">
            <DesignerPropertyPanel 
              field={selectedFieldIndex !== null ? fields[selectedFieldIndex] : null}
              onUpdate={(updates) => {
                if (selectedFieldIndex !== null) updateField(selectedFieldIndex, updates)
              }}
            />
          </div>
        )}
      </div>

      {/* 5. 实时模拟仿真层 (Runtime Simulation Overlay) */}
      <AnimatePresence>
        {previewMode && (
          <DesignerPreviewOverlay 
            fields={fields}
            layoutType={layoutType}
            layoutColumns={layoutColumns}
            previewData={previewData}
            setPreviewData={setPreviewData}
            onClose={() => setPreviewMode(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default FormDesignerPage
