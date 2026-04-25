import React from 'react'
import { useParams } from 'react-router-dom'
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
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-6">
        <div className="w-24 h-24 relative flex items-center justify-center">
           <div className="absolute inset-0 border-[6px] border-indigo-100 rounded-full" />
           <div className="absolute inset-0 border-[6px] border-indigo-600 rounded-full border-t-transparent animate-spin" />
           <div className="w-8 h-8 bg-indigo-600 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-2 text-center">
           <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">正在初始化设计器</p>
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">正在从安全归档中恢复架构...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* 1. 顶部工具栏 (Global Utils) */}
      <DesignerHeader 
        templateName={templateName}
        setTemplateName={setTemplateName}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        saving={saving}
        onSave={saveTemplate}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* 2. 左侧结构侧边栏 (Navigation / Setup) */}
        {!previewMode && (
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
        )}

        {/* 3. 中间主设计画布 (Drafting Canvas) */}
        <DesignerCanvas 
          fields={fields}
          layoutType={layoutType}
          layoutColumns={layoutColumns}
          selectedFieldIndex={selectedFieldIndex}
          onSelectField={setSelectedFieldIndex}
        />

        {/* 4. 右侧属性面板 (Property Matrix) */}
        {!previewMode && (
          <DesignerPropertyPanel 
            field={selectedFieldIndex !== null ? fields[selectedFieldIndex] : null}
            onUpdate={(updates) => {
              if (selectedFieldIndex !== null) updateField(selectedFieldIndex, updates)
            }}
          />
        )}
      </div>

      {/* 5. 实时模拟仿真层 (Runtime Simulation Overlay) */}
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
    </div>
  )
}

export default FormDesignerPage
