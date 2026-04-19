import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Link,
  Plus,
  Trash2,
  Save,
  Play,
  Settings,
  Database,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import { API_URL } from '../config/api'

interface LinkageRule {
  id: string
  name: string
  sourceEntity: string
  sourceField: string
  targetEntity: string
  targetField: string
  linkageType: 'filter' | 'cascade' | 'calculate' | 'default'
  condition?: string
  mapping?: Record<string, any>
  isActive: boolean
  description?: string
}

interface EntityConfig {
  name: string
  label: string
  fields: { name: string; label: string; type: string }[]
}

interface DataLinkageConfiguratorProps {
  onSave?: (rules: LinkageRule[]) => void
}

const DataLinkageConfigurator: React.FC<DataLinkageConfiguratorProps> = ({ onSave }) => {
  const { t } = useTranslation()
  const [rules, setRules] = useState<LinkageRule[]>([])

  const ENTITY_CONFIGS: Record<string, EntityConfig> = {
    department: {
      name: 'department',
      label: t('data_linkage_configurator.entity_department'),
      fields: [
        { name: 'id', label: 'ID', type: 'id' },
        { name: 'code', label: t('data_linkage_configurator.dept_code'), type: 'string' },
        { name: 'name', label: t('data_linkage_configurator.dept_name'), type: 'string' },
        { name: 'manager_id', label: t('data_linkage_configurator.dept_manager'), type: 'reference' }
      ]
    },
    position: {
      name: 'position',
      label: t('data_linkage_configurator.entity_position'),
      fields: [
        { name: 'id', label: 'ID', type: 'id' },
        { name: 'code', label: t('data_linkage_configurator.position_code'), type: 'string' },
        { name: 'name', label: t('data_linkage_configurator.position_name'), type: 'string' },
        { name: 'department_id', label: t('data_linkage_configurator.position_department'), type: 'reference' },
        { name: 'level', label: t('data_linkage_configurator.position_level'), type: 'string' }
      ]
    },
    employee: {
      name: 'employee',
      label: t('data_linkage_configurator.entity_employee'),
      fields: [
        { name: 'id', label: 'ID', type: 'id' },
        { name: 'code', label: t('data_linkage_configurator.employee_code'), type: 'string' },
        { name: 'name', label: t('data_linkage_configurator.employee_name'), type: 'string' },
        { name: 'department_id', label: t('data_linkage_configurator.position_department'), type: 'reference' },
        { name: 'position_id', label: t('data_linkage_configurator.position_department'), type: 'reference' },
        { name: 'phone', label: t('data_linkage_configurator.employee_phone'), type: 'string' },
        { name: 'email', label: t('data_linkage_configurator.employee_email'), type: 'string' }
      ]
    },
    project: {
      name: 'project',
      label: t('data_linkage_configurator.entity_project'),
      fields: [
        { name: 'id', label: 'ID', type: 'id' },
        { name: 'code', label: t('data_linkage_configurator.project_code'), type: 'string' },
        { name: 'name', label: t('data_linkage_configurator.project_name'), type: 'string' },
        { name: 'manager_id', label: t('data_linkage_configurator.project_manager'), type: 'reference' },
        { name: 'status', label: t('data_linkage_configurator.project_status'), type: 'string' }
      ]
    },
    equipment: {
      name: 'equipment',
      label: t('data_linkage_configurator.entity_equipment'),
      fields: [
        { name: 'id', label: 'ID', type: 'id' },
        { name: 'code', label: t('data_linkage_configurator.equipment_code'), type: 'string' },
        { name: 'name', label: t('data_linkage_configurator.equipment_name'), type: 'string' },
        { name: 'type', label: t('data_linkage_configurator.equipment_type'), type: 'string' },
        { name: 'project_id', label: t('data_linkage_configurator.equipment_project'), type: 'reference' },
        { name: 'status', label: t('data_linkage_configurator.equipment_status'), type: 'string' }
      ]
    }
  }

  const LINKAGE_TYPES = [
    { value: 'filter', label: t('data_linkage_configurator.type_filter'), description: t('data_linkage_configurator.type_filter_desc') },
    { value: 'cascade', label: t('data_linkage_configurator.type_cascade'), description: t('data_linkage_configurator.type_cascade_desc') },
    { value: 'calculate', label: t('data_linkage_configurator.type_calculate'), description: t('data_linkage_configurator.type_calculate_desc') },
    { value: 'default', label: t('data_linkage_configurator.type_default'), description: t('data_linkage_configurator.type_default_desc') }
  ]
  const [selectedRule, setSelectedRule] = useState<LinkageRule | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [showTestPanel, setShowTestPanel] = useState(false)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL.BASE}/api/data-linkage/rules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setRules(data.data || [])
        }
      }
    } catch (error) {
      console.error(t('data_linkage_configurator.load_failed'), error)
    }
  }

  const addRule = useCallback(() => {
    const newRule: LinkageRule = {
      id: `rule_${Date.now()}`,
      name: t('data_linkage_configurator.new_rule_name'),
      sourceEntity: '',
      sourceField: '',
      targetEntity: '',
      targetField: '',
      linkageType: 'filter',
      isActive: true,
      description: ''
    }
    setRules(prev => [...prev, newRule])
    setSelectedRule(newRule)
    setShowConfig(true)
  }, [])

  const deleteRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId))
    if (selectedRule?.id === ruleId) {
      setSelectedRule(null)
      setShowConfig(false)
    }
  }, [selectedRule])

  const updateRule = useCallback((ruleId: string, updates: Partial<LinkageRule>) => {
    setRules(prev =>
      prev.map(rule => {
        if (rule.id === ruleId) {
          return { ...rule, ...updates }
        }
        return rule
      })
    )
    if (selectedRule?.id === ruleId) {
      setSelectedRule(prev => prev ? { ...prev, ...updates } : null)
    }
  }, [selectedRule])

  const handleSave = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL.BASE}/api/data-linkage/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rules })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          alert(t('data_linkage_configurator.save_success'))
          onSave?.(rules)
        } else {
          alert(t('data_linkage_configurator.save_failed') + ': ' + (data.error || t('data_linkage_configurator.unknown_error')))
        }
      }
    } catch (error) {
      console.error(t('data_linkage_configurator.save_failed'), error)
      alert(t('data_linkage_configurator.save_failed_retry'))
    }
  }, [rules, onSave])

  const testRule = useCallback(async (rule: LinkageRule, testValue: any) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL.BASE}/api/data-linkage/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rule,
          testValue
        })
      })

      if (res.ok) {
        const data = await res.json()
        setTestResult(data)
      }
    } catch (error) {
      console.error(t('data_linkage_configurator.test_failed'), error)
      setTestResult({ success: false, error: t('data_linkage_configurator.test_failed') })
    }
  }, [])

  const getEntityLabel = (entityName: string) => {
    return ENTITY_CONFIGS[entityName]?.label || entityName
  }

  const getFieldLabel = (entityName: string, fieldName: string) => {
    const entity = ENTITY_CONFIGS[entityName]
    if (!entity) return fieldName
    const field = entity.fields.find(f => f.name === fieldName)
    return field?.label || fieldName
  }

  return (
    <div className="flex h-full">
      {/* 左侧规则列表 */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">{t('data_linkage_configurator.rules_title')}</h3>
          <button
            onClick={addRule}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {rules.map(rule => (
            <div
              key={rule.id}
              onClick={() => {
                setSelectedRule(rule)
                setShowConfig(true)
              }}
              className={`p-3 bg-white border rounded-lg cursor-pointer transition-all ${
                selectedRule?.id === rule.id
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{rule.name}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {rule.isActive ? t('data_linkage_configurator.active') : t('data_linkage_configurator.inactive')}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {getEntityLabel(rule.sourceEntity)}.{getFieldLabel(rule.sourceEntity, rule.sourceField)}
                <ArrowRight className="w-3 h-3 inline mx-1" />
                {getEntityLabel(rule.targetEntity)}.{getFieldLabel(rule.targetEntity, rule.targetField)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                  {LINKAGE_TYPES.find(t => t.value === rule.linkageType)?.label}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteRule(rule.id)
                  }}
                  className="ml-auto p-1 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Link className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">{t('data_linkage_configurator.no_rules')}</p>
              <p className="text-xs mt-1">{t('data_linkage_configurator.add_rule_hint')}</p>
            </div>
          )}
        </div>
      </div>

      {/* 中间配置区域 */}
      <div className="flex-1 p-6 overflow-y-auto">
        {showConfig && selectedRule ? (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('data_linkage_configurator.config_title')}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTestPanel(!showTestPanel)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {t('data_linkage_configurator.test')}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t('data_linkage_configurator.save')}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('data_linkage_configurator.basic_info')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      t('data_linkage_configurator.rule_name')
                    </label>
                    <input
                      type="text"
                      value={selectedRule.name}
                      onChange={(e) => updateRule(selectedRule.id, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('data_linkage_configurator.rule_name_placeholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      t('data_linkage_configurator.rule_description')
                    </label>
                    <textarea
                      value={selectedRule.description || ''}
                      onChange={(e) => updateRule(selectedRule.id, { description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder={t('data_linkage_configurator.rule_description_placeholder')}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={selectedRule.isActive}
                      onChange={(e) => updateRule(selectedRule.id, { isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      t('data_linkage_configurator.enable_rule')
                    </label>
                  </div>
                </div>
              </div>

              {/* t('data_linkage_configurator.source_config') */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  t('data_linkage_configurator.source_config')
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      t('data_linkage_configurator.source_entity')
                    </label>
                    <select
                      value={selectedRule.sourceEntity}
                      onChange={(e) => updateRule(selectedRule.id, { 
                        sourceEntity: e.target.value,
                        sourceField: ''
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('data_linkage_configurator.select_source_entity')}</option>
                      {Object.entries(ENTITY_CONFIGS).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  {selectedRule.sourceEntity && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        t('data_linkage_configurator.source_field')
                      </label>
                      <select
                        value={selectedRule.sourceField}
                        onChange={(e) => updateRule(selectedRule.id, { sourceField: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{t('data_linkage_configurator.select_source_field')}</option>
                        {ENTITY_CONFIGS[selectedRule.sourceEntity]?.fields.map(field => (
                          <option key={field.name} value={field.name}>{field.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* t('data_linkage_configurator.linkage_type') */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  t('data_linkage_configurator.linkage_type')
                </h3>
                <div className="space-y-3">
                  {LINKAGE_TYPES.map(type => (
                    <label
                      key={type.value}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedRule.linkageType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="linkageType"
                        value={type.value}
                        checked={selectedRule.linkageType === type.value}
                        onChange={(e) => updateRule(selectedRule.id, { linkageType: e.target.value as any })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* t('data_linkage_configurator.target_config') */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  t('data_linkage_configurator.target_config')
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      t('data_linkage_configurator.target_entity')
                    </label>
                    <select
                      value={selectedRule.targetEntity}
                      onChange={(e) => updateRule(selectedRule.id, { 
                        targetEntity: e.target.value,
                        targetField: ''
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('data_linkage_configurator.select_target_entity')}</option>
                      {Object.entries(ENTITY_CONFIGS).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  {selectedRule.targetEntity && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        t('data_linkage_configurator.target_field')
                      </label>
                      <select
                        value={selectedRule.targetField}
                        onChange={(e) => updateRule(selectedRule.id, { targetField: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{t('data_linkage_configurator.select_target_field')}</option>
                        {ENTITY_CONFIGS[selectedRule.targetEntity]?.fields.map(field => (
                          <option key={field.name} value={field.name}>{field.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* 高级配置 */}
              {selectedRule.linkageType === 'filter' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('data_linkage_configurator.filter_conditions')}</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      t('data_linkage_configurator.filter_expression')
                    </label>
                    <textarea
                      value={selectedRule.condition || ''}
                      onChange={(e) => updateRule(selectedRule.id, { condition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows={3}
                      placeholder={t('data_linkage_configurator.filter_expression_placeholder')}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      {t('data_linkage_configurator.source_value_ref')}
                    </p>
                  </div>
                </div>
              )}

              {selectedRule.linkageType === 'calculate' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('data_linkage_configurator.calc_formula')}</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      t('data_linkage_configurator.calc_expression')
                    </label>
                    <textarea
                      value={selectedRule.condition || ''}
                      onChange={(e) => updateRule(selectedRule.id, { condition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows={3}
                      placeholder={t('data_linkage_configurator.calc_expression_placeholder')}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      {t('data_linkage_configurator.calc_expression_hint')}
                    </p>
                  </div>
                </div>
              )}

              {selectedRule.linkageType === 'default' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('data_linkage_configurator.default_value_config')}</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      t('data_linkage_configurator.default_value_label')
                    </label>
                    <input
                      type="text"
                      value={selectedRule.condition || ''}
                      onChange={(e) => updateRule(selectedRule.id, { condition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('data_linkage_configurator.default_value_placeholder')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <Link className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">{t('data_linkage_configurator.select_rule_hint')}</p>
              <p className="text-sm mt-2">{t('data_linkage_configurator.create_rule_hint')}</p>
            </div>
          </div>
        )}
      </div>

      {/* 右侧测试面板 */}
      {showTestPanel && selectedRule && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">{t('data_linkage_configurator.test_title')}</h3>
            <button
              onClick={() => setShowTestPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('data_linkage_configurator.test_value')}
              </label>
              <input
                type="text"
                id="testValue"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('data_linkage_configurator.test_value_placeholder')}
              />
            </div>
            <button
              onClick={() => {
                const input = document.getElementById('testValue') as HTMLInputElement
                testRule(selectedRule, input.value)
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {t('data_linkage_configurator.execute_test')}
            </button>

            {testResult && (
              <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResult.success ? t('data_linkage_configurator.test_success') : t('data_linkage_configurator.test_failed')}
                  </span>
                </div>
                {testResult.data && (
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
                {testResult.error && (
                  <p className="text-sm text-red-600">{testResult.error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DataLinkageConfigurator