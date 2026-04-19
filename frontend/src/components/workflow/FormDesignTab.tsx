import React from 'react'
import {
  User,
  CheckSquare
} from 'lucide-react'
import { FormField } from '../../types/workflow-designer'

interface FormDesignTabProps {
  formSchema: FormField[]
  selectedFieldIndex: number | null
  setSelectedFieldIndex: (index: number | null) => void
  addFormField: (type: FormField['type'], label: string) => void
  updateFormField: (index: number, key: keyof FormField, value: any) => void
  removeFormField: (index: number) => void
  readOnly?: boolean
}

const fieldTypeLabels: Record<string, string> = {
  text: '文本',
  number: '数字',
  date: '日期',
  select: '下拉选择',
  textarea: '多行文本',
  user: '用户',
  boolean: '开关',
  lookup: '查找引用',
  reference: '关联字段'
}

const FormDesignTab: React.FC<FormDesignTabProps> = ({
  formSchema,
  selectedFieldIndex,
  setSelectedFieldIndex,
  addFormField,
  updateFormField,
  removeFormField,
  readOnly
}) => {
  return (
    <div className="w-full h-full flex min-h-0">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">字段类型</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {[
              { type: 'text', icon: 'T', color: 'blue', label: '文本输入' },
              { type: 'number', icon: '#', color: 'green', label: '数字输入' },
              { type: 'date', icon: 'D', color: 'purple', label: '日期选择' },
              { type: 'select', icon: 'S', color: 'orange', label: '下拉选择' },
              { type: 'textarea', icon: '¶', color: 'gray', label: '多行文本' },
              { type: 'user', icon: <User className="w-4 h-4 text-indigo-600" />, color: 'indigo', label: '用户选择' },
              { type: 'boolean', icon: '✓', color: 'teal', label: '开关' },
              { type: 'reference', icon: '@', color: 'pink', label: '关联字段' }
            ].map((field) => (
              <button
                key={field.type}
                onClick={() => addFormField(field.type as FormField['type'], fieldTypeLabels[field.type] || field.label)}
                disabled={readOnly}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left bg-gray-50 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <div className={`w-8 h-8 rounded bg-${field.color}-100 flex items-center justify-center`}>
                  {typeof field.icon === 'string' ? (
                    <span className={`text-${field.color}-600 text-xs font-bold`}>{field.icon}</span>
                  ) : (
                    field.icon
                  )}
                </div>
                <span>{field.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-100 p-6 overflow-y-auto min-w-0">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">表单预览</h3>
          
          {formSchema.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无字段</p>
              <p className="text-sm mt-2">从左侧选择一个字段进行配置</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formSchema.map((field, index) => (
                <div 
                  key={index} 
                  onClick={() => setSelectedFieldIndex(index)}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedFieldIndex === index 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFormField(index)
                        if (selectedFieldIndex === index) {
                          setSelectedFieldIndex(null)
                        }
                      }}
                      disabled={readOnly}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      删除
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    字段名: {field.name} | 类型: {fieldTypeLabels[field.type] || field.type}
                  </div>
                  {field.type === 'text' && (
                    <input type="text" disabled className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50" placeholder={field.placeholder} />
                  )}
                  {field.type === 'number' && (
                    <input type="number" disabled className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50" placeholder={field.placeholder} />
                  )}
                  {field.type === 'date' && (
                    <input type="date" disabled className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50" />
                  )}
                  {field.type === 'select' && (
                    <select disabled className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50">
                      <option>请选择</option>
                    </select>
                  )}
                  {field.type === 'textarea' && (
                    <textarea disabled className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50" rows={3} placeholder={field.placeholder} />
                  )}
                  {field.type === 'boolean' && (
                    <label className="flex items-center gap-2">
                      <input type="checkbox" disabled className="rounded" />
                      <span className="text-sm text-gray-600">是/否</span>
                    </label>
                  )}
                  {field.type === 'user' && (
                    <input type="text" disabled className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50" placeholder="选择用户" />
                  )}
                  {field.type === 'reference' && (
                    <input type="text" disabled className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50" placeholder="选择关联字段" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">字段属性</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {formSchema.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              请先添加一个字段
            </div>
          ) : selectedFieldIndex === null ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              从左侧选择一个字段进行配置
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="text-xs font-medium text-gray-500 uppercase flex items-center justify-between">
                  {formSchema[selectedFieldIndex].label}
                  <span className="text-blue-500">字段 {selectedFieldIndex + 1} / {formSchema.length}</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">字段标识</label>
                  <input
                    type="text"
                    value={formSchema[selectedFieldIndex].name}
                    onChange={(e) => updateFormField(selectedFieldIndex, 'name', e.target.value)}
                    disabled={readOnly}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">字段标签</label>
                  <input
                    type="text"
                    value={formSchema[selectedFieldIndex].label}
                    onChange={(e) => updateFormField(selectedFieldIndex, 'label', e.target.value)}
                    disabled={readOnly}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">字段类型</label>
                  <select
                    value={formSchema[selectedFieldIndex].type}
                    onChange={(e) => updateFormField(selectedFieldIndex, 'type', e.target.value as FormField['type'])}
                    disabled={readOnly}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">文本</option>
                    <option value="number">数字</option>
                    <option value="date">日期</option>
                    <option value="select">下拉选择</option>
                    <option value="textarea">多行文本</option>
                    <option value="user">用户</option>
                    <option value="boolean">开关</option>
                    <option value="lookup">查找引用</option>
                    <option value="reference">关联字段</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">占位文字</label>
                  <input
                    type="text"
                    value={formSchema[selectedFieldIndex].placeholder || ''}
                    onChange={(e) => updateFormField(selectedFieldIndex, 'placeholder', e.target.value)}
                    disabled={readOnly}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formSchema[selectedFieldIndex].required || false}
                    onChange={(e) => updateFormField(selectedFieldIndex, 'required', e.target.checked)}
                    disabled={readOnly}
                    className="rounded"
                  />
                  必填
                </label>
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedFieldIndex(Math.max(0, selectedFieldIndex - 1))}
                    disabled={selectedFieldIndex === 0}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一步
                  </button>
                  <button
                    onClick={() => setSelectedFieldIndex(Math.min(formSchema.length - 1, selectedFieldIndex + 1))}
                    disabled={selectedFieldIndex === formSchema.length - 1}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一步
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FormDesignTab
