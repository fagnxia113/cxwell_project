import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import DataTable, { Pagination, SearchBox } from '../../components/DataTable'
import { API_URL } from '../../config/api'

interface Warehouse {
  id: string
  warehouse_no: string
  name: string
  type: 'main' | 'branch' | 'project'
  location: string
  address?: string
  manager_id?: string
  manager_name?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  total_equipment?: number
  available_equipment?: number
  in_use_equipment?: number
}

interface Equipment {
  id: string
  model_id: string
  model_name: string
  model_no: string
  brand: string
  category: 'instrument' | 'fake_load' | 'accessory'
  serial_number: string | null
  manage_code: string
  health_status: 'normal' | 'affected' | 'broken'
  usage_status: 'idle' | 'in_use'
  location_status: 'warehouse' | 'in_project' | 'repairing' | 'transferring'
  keeper_id: string | null
  keeper_name: string | null
  purchase_date: string | null
  purchase_price: number | null
  calibration_expiry: string | null
  notes: string | null
  created_at: string
}

interface ApiResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function WarehouseDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (id) {
      loadWarehouseData()
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadEquipment()
    }
  }, [id, page, searchTerm])

  const loadWarehouseData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL.BASE}/api/warehouses/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })

      if (!response.ok) {
        throw new Error(t('warehouse_detail.load_failed'))
      }

      const result = await response.json()
      if (result.success && result.data) {
        setWarehouse(result.data)
      } else {
        throw new Error(t('warehouse_detail.not_exist'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('warehouse_detail.load_error'))
    } finally {
      setLoading(false)
    }
  }

  const loadEquipment = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`${API_URL.BASE}/api/warehouses/${id}/equipment?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setEquipment(result.data || [])
          setTotalPages(result.totalPages || 1)
          setTotal(result.total || 0)
        }
      }
    } catch (err) {
      console.error('加载设备列表失败:', err)
    }
  }

  const handleSearch = () => {
    setPage(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  const getHealthStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      normal: 'bg-green-100 text-green-700',
      affected: 'bg-yellow-100 text-yellow-700',
      broken: 'bg-red-100 text-red-700'
    }
    const labels: Record<string, string> = {
      normal: t('warehouse_detail.health_normal'),
      affected: t('warehouse_detail.health_affected'),
      broken: t('warehouse_detail.health_broken')
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.normal}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getUsageStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      idle: 'bg-green-100 text-green-700',
      in_use: 'bg-blue-100 text-blue-700'
    }
    const labels: Record<string, string> = {
      idle: t('warehouse_detail.usage_idle'),
      in_use: t('warehouse_detail.usage_in_use')
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.idle}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      main: t('warehouse_detail.type_main'),
      branch: t('warehouse_detail.type_branch'),
      project: t('warehouse_detail.type_project')
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !warehouse) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-red-700 mb-4">{error || t('warehouse_detail.not_exist')}</p>
          <button
            onClick={() => navigate('/warehouses')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            t('warehouse_detail.back_to_list')
          </button>
        </div>
      </div>
    )
  }

  const columns = [
    {
      key: 'model_name' as keyof Equipment,
      header: t('warehouse_detail.col_equipment_name'),
      render: (value: string, row: Equipment) => (
        <button
          onClick={() => window.location.href = `/equipment/${row.id}`}
          className="font-medium text-blue-600 hover:text-blue-800 text-left"
        >
          {value}
        </button>
      )
    },
    {
      key: 'manage_code' as keyof Equipment,
      header: t('warehouse_detail.col_manage_code'),
      render: (value: string) => value
    },
    {
      key: 'serial_number' as keyof Equipment,
      header: t('warehouse_detail.col_serial'),
      render: (value: string | null) => value || '-'
    },
    {
      key: 'health_status' as keyof Equipment,
      header: t('warehouse_detail.col_health'),
      render: (value: string) => getHealthStatusBadge(value)
    },
    {
      key: 'usage_status' as keyof Equipment,
      header: t('warehouse_detail.col_usage'),
      render: (value: string) => getUsageStatusBadge(value)
    },
    {
      key: 'purchase_price' as keyof Equipment,
      header: t('warehouse_detail.col_price'),
      render: (value: number | null) => formatCurrency(value)
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/warehouses')}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {t('warehouse_detail.back_to_list')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-700">{t('warehouse_detail.page_title')}</h1>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('warehouse_detail.basic_info')}</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">{t('warehouse_detail.warehouse_code')}</label>
                    <div className="text-sm font-medium text-gray-900">{warehouse.warehouse_no}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t('warehouse_detail.warehouse_name')}</label>
                    <div className="text-sm font-medium text-gray-900">{warehouse.name}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t('warehouse_detail.warehouse_type')}</label>
                    <div className="text-sm font-medium text-gray-900">{getTypeLabel(warehouse.type)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t('warehouse_detail.location')}</label>
                    <div className="text-sm font-medium text-gray-900">{warehouse.location}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t('warehouse_detail.manager')}</label>
                    <div className="text-sm font-medium text-gray-900">{warehouse.manager_name || '-'}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t('warehouse_detail.status')}</label>
                    <div className="text-sm font-medium text-gray-900">
                      {warehouse.status === 'active' ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{t('warehouse_detail.active')}</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{t('warehouse_detail.inactive')}</span>
                      )}
                    </div>
                  </div>
                </div>
                {warehouse.address && (
                  <div>
                    <label className="text-sm text-gray-500">{t('warehouse_detail.address')}</label>
                    <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{warehouse.address}</div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('warehouse_detail.inventory_stats')}</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-600">{t('warehouse_detail.total_equipment')}</div>
                  <div className="text-3xl font-bold text-blue-700 mt-2">{warehouse.total_equipment || 0}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-600">{t('warehouse_detail.available_equipment')}</div>
                  <div className="text-3xl font-bold text-green-700 mt-2">{warehouse.available_equipment || 0}</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-sm text-orange-600">{t('warehouse_detail.in_use_equipment')}</div>
                  <div className="text-3xl font-bold text-orange-700 mt-2">{warehouse.in_use_equipment || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('warehouse_detail.system_info')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">{t('warehouse_detail.warehouse_id')}</label>
                <div className="text-sm font-medium text-gray-900">{warehouse.id}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">{t('warehouse_detail.created_at')}</label>
                <div className="text-sm font-medium text-gray-900">{formatDate(warehouse.created_at)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('warehouse_detail.equipment_list')}</h2>
        </div>
        <div className="p-6">
          <SearchBox
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('warehouse_detail.search_placeholder')}
            onSearch={handleSearch}
          />

          <DataTable
            data={equipment}
            columns={columns}
            loading={false}
            emptyMessage={searchTerm ? t('warehouse_detail.no_match') : t('warehouse_detail.no_data')}
            rowKey="id"
          />

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </div>
  )
}
