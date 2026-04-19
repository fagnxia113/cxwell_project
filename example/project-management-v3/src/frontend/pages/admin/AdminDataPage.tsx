import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../../config/api'

const t = (key: string): string => {
  const map: Record<string, string> = {
    'admin_data.page_title': '系统数据',
    'admin_data.page_subtitle': '查看和管理系统数据库表',
    'admin_data.total_records': '总记录数',
    'admin_data.data_tables': '数据表',
    'admin_data.today_updates': '今日更新',
    'admin_data.system_status': '系统状态',
    'admin_data.running_normal': '运行正常',
    'admin_data.table_list': '数据表列表',
    'admin_data.loading': '加载中...',
    'admin_data.quick_actions': '快捷操作',
    'admin_data.export_all': '导出所有数据',
    'admin_data.refresh_stats': '刷新统计',
    'admin_data.system_settings': '系统设置',
    'admin_data.data_preview': '数据预览',
    'admin_data.select_table_hint': '请选择一个数据表查看',
    'admin_data.add_new': '新增',
    'admin_data.export': '导出',
    'admin_data.click_to_view': '点击左侧数据表查看数据',
    'admin_data.col_actions': '操作',
    'admin_data.edit': '编辑',
    'admin_data.showing_top': '显示前 {total} 条记录',
  }
  return map[key] || key
}

interface TableInfo {
  name: string
  count: number
  lastUpdated: string
}

export default function AdminDataPage() {
  const { t } = useTranslation()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => { loadTables() }, [])

  const loadTables = async () => {
    setLoading(true)
    try {
      const entities = ['Project', 'Task', 'Employee', 'Equipment', 'Customer', 'Warehouse', 'DailyReport', 'ApprovalOrder']
      const results = await Promise.all(
        entities.map(async (entity) => {
          try {
            const res = await fetch(API_URL.DATA(entity))
            const data = await res.json()
            return { name: entity, count: data.items?.length || data.length || 0, lastUpdated: new Date().toISOString() }
          } catch {
            return { name: entity, count: 0, lastUpdated: '-' }
          }
        })
      )
      setTables(results)
    } catch (e) {
      console.error(e)
      setTables([
        { name: 'Project', count: 15, lastUpdated: '2026-02-19 22:00' },
        { name: 'Task', count: 48, lastUpdated: '2026-02-19 21:30' },
        { name: 'Employee', count: 32, lastUpdated: '2026-02-19 20:00' },
        { name: 'Equipment', count: 86, lastUpdated: '2026-02-19 18:00' },
        { name: 'Customer', count: 12, lastUpdated: '2026-02-18 15:00' },
        { name: 'Warehouse', count: 5, lastUpdated: '2026-02-17 10:00' },
        { name: 'DailyReport', count: 156, lastUpdated: '2026-02-19 22:00' },
        { name: 'ApprovalOrder', count: 23, lastUpdated: '2026-02-19 21:00' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadTableData = async (tableName: string) => {
    setSelectedTable(tableName)
    setDataLoading(true)
    try {
      const res = await fetch(API_URL.DATA(tableName))
      const data = await res.json()
      setTableData(data.items || data || [])
    } catch (e) {
      console.error(e)
      setTableData(getMockData(tableName))
    } finally {
      setDataLoading(false)
    }
  }

  const getMockData = (_tableName: string): any[] => {
    return [{ id: '1', name: 'Sample Data', created_at: '2026-02-19' }]
  }

  const getTableLabel = (name: string) => {
    const keyMap: Record<string, string> = {
      'Project': 'table_project', 'Task': 'table_task', 'Employee': 'table_employee',
      'Equipment': 'table_equipment', 'Customer': 'table_customer', 'Warehouse': 'table_warehouse',
      'DailyReport': 'table_daily_report', 'ApprovalOrder': 'table_approval_order'
    }
    return keyMap[name] ? t(`admin_data.${keyMap[name]}`) : name
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-700">{t('admin_data.page_title')}</h1>
        <p className="text-gray-500 mt-1">{t('admin_data.page_subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">{t('admin_data.total_records')}</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{tables.reduce((a, b) => a + b.count, 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">{t('admin_data.data_tables')}</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{tables.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">{t('admin_data.today_updates')}</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">12</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500">{t('admin_data.system_status')}</p>
          <p className="text-lg font-bold text-green-600 mt-2">{t('admin_data.running_normal')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{t('admin_data.table_list')}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-4 text-center text-gray-500">{t('admin_data.loading')}</div>
              ) : (
                tables.map(table => (
                  <div
                    key={table.name}
                    onClick={() => loadTableData(table.name)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedTable === table.name ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{getTableLabel(table.name)}</p>
                        <p className="text-xs text-gray-500">{table.name}</p>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">{table.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t('admin_data.quick_actions')}</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg">📊 {t('admin_data.export_all')}</button>
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg">🔄 {t('admin_data.refresh_stats')}</button>
              <button className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg">⚙️ {t('admin_data.system_settings')}</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">
                {selectedTable ? `${getTableLabel(selectedTable)} ${t('admin_data.data_preview')}` : t('admin_data.select_table_hint')}
              </h3>
              {selectedTable && (
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">{t('admin_data.add_new')}</button>
                  <button className="px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100">{t('admin_data.export')}</button>
                </div>
              )}
            </div>
            <div className="p-4">
              {!selectedTable ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <p>{t('admin_data.click_to_view')}</p>
                </div>
              ) : dataLoading ? (
                <div className="text-center py-12 text-gray-500">{t('admin_data.loading')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {tableData.length > 0 && Object.keys(tableData[0]).map(key => (
                          <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{key}</th>
                        ))}
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('admin_data.col_actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tableData.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="px-4 py-3 text-sm text-gray-900">{typeof val === 'object' ? JSON.stringify(val) : String(val).slice(0, 50)}</td>
                          ))}
                          <td className="px-4 py-3 text-right">
                            <button className="text-blue-600 text-sm hover:underline">{t('admin_data.edit')}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tableData.length > 10 && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      {t('admin_data.showing_top', { total: tableData.length })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
