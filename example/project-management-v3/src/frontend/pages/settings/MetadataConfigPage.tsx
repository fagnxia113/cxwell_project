/**
 * 元数据配置页�?
 */
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '../../utils/apiClient'

interface FieldDef {
  type: string;
  label: string;
  primaryKey?: boolean;
  required?: boolean;
}

interface EntityDef {
  name: string;
  label?: string;
  fields: Record<string, FieldDef>;
}

export default function MetadataConfigPage() {
  const { t } = useTranslation()
  const [entities, setEntities] = useState<{name: string, label: string, fieldsCount: number}[]>([])
  const [selectedEntity, setSelectedEntity] = useState('Project')
  const [entityDetail, setEntityDetail] = useState<EntityDef | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  // 获取实体列表
  useEffect(() => {
    const fetchEntities = async () => {
      setLoading(true)
      try {
        const res = await apiClient.get<any>('/api/metadata/entities')
        // 兼容处理：apiClient 可能返回 {success, data} 或者直接返回数�?
        const data = res?.data || res
        
        if (data && typeof data === 'object') {
          const entityList = Object.entries(data).map(([name, def]: [string, any]) => ({
            name,
            label: def.name || name,
            fieldsCount: Object.keys(def.fields || {}).length
          }))
          setEntities(entityList)
          
          // 如果当前选中的实体不在列表中，选中第一�?
          if (entityList.length > 0 && !entityList.find(e => e.name === selectedEntity)) {
            setSelectedEntity(entityList[0].name)
          }
        }
      } catch (e) {
        console.error(t('metadata_config.load_entity_failed'), e)
      } finally {
        setLoading(false)
      }
    }
    fetchEntities()
  }, [])

  // 获取选中实体的详细字�?
  useEffect(() => {
    const fetchEntityDetail = async () => {
      if (!selectedEntity) return
      setDetailLoading(true)
      try {
        const res = await apiClient.get<any>(`/api/metadata/entities/${selectedEntity}`)
        const data = res?.data || res
        if (data) {
          setEntityDetail(data)
        }
      } catch (e) {
        console.error(t('metadata_config.load_entity_detail_failed'), e)
      } finally {
        setDetailLoading(false)
      }
    }
    fetchEntityDetail()
  }, [selectedEntity])

  return (
    <div className="flex h-full -m-6 min-h-[calc(100vh-120px)] overflow-hidden">
      {/* 左侧实体列表 */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200 bg-white">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">{t('metadata_config.entity_list')}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">ENTITIES EXPLORER</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <div className="text-[10px] text-slate-400 font-black uppercase">Loading...</div>
            </div>
          ) : (
            entities.map(entity => (
              <button
                key={entity.name}
                onClick={() => setSelectedEntity(entity.name)}
                className={`w-full group relative flex flex-col p-4 rounded-2xl transition-all duration-300 ${
                  selectedEntity === entity.name
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 ring-1 ring-blue-400'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[13px] font-black truncate ${selectedEntity === entity.name ? 'text-white' : 'text-slate-900'}`}>{entity.label}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                    selectedEntity === entity.name ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {entity.fieldsCount}
                  </span>
                </div>
                <span className={`text-[10px] font-mono opacity-50 truncate ${selectedEntity === entity.name ? 'text-blue-100' : 'text-slate-400'}`}>
                  {entity.name}
                </span>
                
                {selectedEntity === entity.name && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-l-full"></div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 右侧字段配置 */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* 页眉 */}
        <div className="p-8 border-b border-slate-100">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-700">
                  {entities.find(e => e.name === selectedEntity)?.label || selectedEntity}
                  <span className="text-slate-300 font-normal ml-3 text-xl">{t('metadata_config.field_definition')}</span>
                </h1>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Configure schema properties, data types and validation rules</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-xs font-black rounded-2xl hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all active:scale-95 uppercase tracking-widest">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              {t('metadata_config.add_new_field')}
            </button>
          </div>
        </div>

        {/* 字段列表容器 */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
          <div className="max-w-6xl mx-auto">
            {detailLoading ? (
              <div className="py-32 text-center">
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse">Fetching Metadata...</div>
              </div>
            ) : entityDetail ? (
              <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-2xl shadow-slate-200/50 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="pl-8 pr-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Property Identifier</th>
                      <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Display Label</th>
                      <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Schema</th>
                      <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Constraint</th>
                      <th className="pl-4 pr-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(entityDetail.fields).map(([name, field]) => (
                      <tr key={name} className="hover:bg-blue-50/30 transition-all duration-300 group">
                        <td className="pl-8 pr-4 py-6">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{name}</span>
                            {field.primaryKey && (
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-md tracking-tighter uppercase">Primary</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <span className="text-sm font-bold text-slate-600">{field.label}</span>
                        </td>
                        <td className="px-4 py-6">
                          <div className="flex">
                            <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-colors ${
                              field.type === 'uuid' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                              field.type === 'enum' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                              field.type === 'number' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              field.type === 'datetime' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                              {field.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          {field.required ? (
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                              <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">Required</span>
                            </div>
                          ) : (
                            <span className="text-slate-200 text-sm font-black">-</span>
                          )}
                        </td>
                        <td className="pl-4 pr-8 py-6 text-right">
                          <button className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white hover:rotate-90 transition-all duration-500 shadow-sm border border-slate-100">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-slate-400 text-sm font-bold">No Metadata Found</div>
              </div>
            )}
            
            {/* 统计页脚 */}
            {!detailLoading && entityDetail && (
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Total Properties: {Object.keys(entityDetail.fields).length}</span>
                <span>System Synchronized: {new Date().toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
