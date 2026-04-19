import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MapPin,
  Building2,
  ShieldCheck,
  Trash2,
  Globe,
  Contact2,
  ArrowUpRight,
  Layers,
  UserCheck,
  X
} from 'lucide-react'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'

interface Customer {
  id: string
  customer_no: string
  name: string
  type: 'direct' | 'channel' | 'agent'
  contact: string
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
}

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', damping: 25 }}
    className="premium-card p-6 relative overflow-hidden group"
  >
    <div className={cn(
      "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.03] transition-transform group-hover:scale-150",
      color === 'blue' ? 'bg-blue-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'
    )} />
    <div className="flex items-center gap-5 relative z-10">
      <div className={cn(
        "p-4 rounded-2xl shadow-inner",
        color === 'blue' ? 'bg-blue-50 text-blue-600' :
          color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
            color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
      )}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{title}</p>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{value}</h3>
      </div>
    </div>
  </motion.div>
)

export default function CustomerListPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useMessage()
  const { confirm } = useConfirm()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [keyword, setKeyword] = useState('')
  const [filterType, setFilterType] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    type: 'direct',
    contact: '',
    phone: '',
    address: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const result = await apiClient.get<any>(API_URL.DATA('customers'))
      const data = result.data?.items || result.data || result.items || []
      setCustomers(data)
    } catch (error: any) {
      showError(error.message || t('customer.load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        name: customer.name,
        type: customer.type as any,
        contact: customer.contact,
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || ''
      })
    } else {
      setEditingCustomer(null)
      setFormData({
        name: '',
        type: 'direct',
        contact: '',
        phone: '',
        address: '',
        notes: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return showError(t('customer.name_required'))

    setSubmitting(true)
    try {
      const data: any = { ...formData }
      if (!editingCustomer) {
        data.customer_no = `KH-${String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0')}`
      }

      const response: any = editingCustomer
        ? await apiClient.put(`${API_URL.DATA('customers')}/${editingCustomer.id}`, data)
        : await apiClient.post(API_URL.DATA('customers'), data)

      if (response.success || response.id) {
        setShowModal(false)
        loadCustomers()
        success(editingCustomer ? t('customer.sync_success') : t('customer.create_success'))
      }
    } catch (error: any) {
      showError(error.message || t('customer.operation_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const confirmed = await confirm({
      title: t('customer.delete_confirm_title'),
      content: t('customer.delete_confirm_content'),
      type: 'danger'
    })
    if (!confirmed) return

    try {
      await apiClient.delete(`${API_URL.DATA('customers')}/${id}`)
      success(t('customer.delete_success'))
      loadCustomers()
    } catch (error: any) {
      showError(error.message || t('customer.delete_failed'))
    }
  }

  const stats = useMemo(() => ({
    total: customers.length,
    direct: customers.filter(c => c.type === 'direct').length,
    channel: customers.filter(c => c.type === 'channel' || c.type === 'agent').length,
    recent: Math.floor(customers.length * 0.4)
  }), [customers])

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchKeyword = c.name.toLowerCase().includes(keyword.toLowerCase()) ||
        (c.customer_no && c.customer_no.toLowerCase().includes(keyword.toLowerCase())) ||
        (c.contact && c.contact.toLowerCase().includes(keyword.toLowerCase()))
      const matchType = filterType ? c.type === filterType : true
      return matchKeyword && matchType
    })
  }, [customers, keyword, filterType])

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-700">
            <div className="p-2 bg-primary text-white rounded-xl shadow-brand">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            {t('customer.page_title')}
          </h1>
          <p className="text-secondary font-bold text-sm mt-1.5 opacity-70 italic">{t('customer.page_subtitle')}</p>
        </motion.div>

        <button
          onClick={() => handleOpenModal()}
          className="btn-primary"
        >
          <UserPlus size={14} />
          <span>{t('customer.add_customer')}</span>
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('customer.total_count')} value={stats.total} icon={Users} color="blue" delay={0.1} />
        <StatCard title={t('customer.direct_count')} value={stats.direct} icon={ShieldCheck} color="emerald" delay={0.2} />
        <StatCard title={t('customer.channel_count')} value={stats.channel} icon={Globe} color="amber" delay={0.3} />
        <StatCard title={t('customer.active_count')} value={stats.recent} icon={Layers} color="indigo" delay={0.4} />
      </div>

      {/* Intelligence Filter Bar */}
      <div className="premium-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('customer.search_placeholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="input-search pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white"
          />
        </div>

        <select
          className="input-search !w-40 !py-2 text-xs font-medium"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">{t('customer.all_types')}</option>
          <option value="direct">{t('customer.type_direct')}</option>
          <option value="channel">{t('customer.type_channel')}</option>
          <option value="agent">{t('customer.type_agent')}</option>
        </select>
      </div>

      {/* Premium List Table */}
      <div className="space-y-2">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-slate-400">
          <div className="col-span-1">{t('customer.col_id')}</div>
          <div className="col-span-4">{t('customer.col_info')}</div>
          <div className="col-span-2">{t('customer.col_contact')}</div>
          <div className="col-span-2">{t('customer.col_phone')}</div>
          <div className="col-span-2 text-center">{t('customer.col_type')}</div>
          <div className="col-span-1"></div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="premium-card h-20 bg-white/40 animate-pulse" />
            ))
          ) : filteredCustomers.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-4 bg-white/30 rounded-xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Building2 size={32} />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">{t('customer.no_results')}</p>
            </motion.div>
          ) : (
            filteredCustomers.map((customer, idx) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => handleOpenModal(customer)}
                className="grid grid-cols-12 gap-4 px-8 py-5 items-center premium-card bg-white hover:bg-slate-50 cursor-pointer transition-all group"
              >
                {/* ID */}
                <div className="col-span-1">
                  <span className="text-[11px] font-mono font-black text-primary/40 tracking-tighter group-hover:text-primary transition-colors uppercase">
                    {customer.customer_no?.replace('KH-', '') || idx + 100}
                  </span>
                </div>

                {/* Name */}
                <div className="col-span-4 flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm transition-transform group-hover:rotate-6",
                    customer.type === 'direct' ? 'bg-blue-600' :
                      customer.type === 'channel' ? 'bg-emerald-600' : 'bg-indigo-600'
                  )}>
                    {customer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-none mb-1 group-hover:text-primary truncate">{customer.name}</h4>
                    <div className="flex items-center gap-2">
                      <MapPin size={10} className="text-slate-300" />
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">{customer.address || 'Global/Remote'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Contact2 size={12} />
                    </div>
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wide">{customer.contact || 'No Primary'}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-primary/50" />
                    <span className="text-[11px] font-mono font-black text-slate-500">{customer.phone || 'NO-COMM-DATA'}</span>
                  </div>
                </div>

                {/* Type */}
                <div className="col-span-2 flex justify-center">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border",
                    customer.type === 'direct' ? "bg-blue-50 text-blue-600 border-blue-100" :
                      customer.type === 'channel' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        "bg-indigo-50 text-indigo-600 border-indigo-100"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full",
                      customer.type === 'direct' ? "bg-blue-500" :
                        customer.type === 'channel' ? "bg-emerald-500" : "bg-indigo-500")} />
                    {customer.type === 'direct' ? t('customer.type_direct') : customer.type === 'channel' ? t('customer.type_channel') : t('customer.type_agent')}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button onClick={(e) => handleDelete(e, customer.id)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                  <div className="w-10 h-10 flex items-center justify-center text-slate-400 bg-white shadow-sm border border-slate-100 rounded-xl">
                    <ArrowUpRight size={18} strokeWidth={3} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modern Partner Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content max-w-xl p-0"
            >
              <div className="px-8 py-6 flex justify-between items-center bg-slate-50 border-b border-slate-100 relative">
                <div className="relative z-10">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {editingCustomer ? t('customer.edit_title') : t('customer.add_title')}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    {editingCustomer?.customer_no || t('customer.new_customer_no')}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center bg-white shadow-sm border border-slate-100 hover:bg-rose-50 hover:border-rose-100 group rounded-lg transition-all relative z-10">
                  <X size={20} className="text-slate-400 group-hover:text-rose-500 group-hover:rotate-90 transition-all" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2.5">
                  <label className="form-label">{t('customer.legal_name_label')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-control"
                    placeholder="e.g. Huawei Technologies Co., Ltd..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <label className="form-label">{t('customer.partnership_level')}</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="form-control"
                    >
                      <option value='direct'>{t('customer.type_direct')}</option>
                      <option value='channel'>{t('customer.type_channel')}</option>
                      <option value='agent'>{t('customer.type_agent')}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="form-label">{t('customer.col_contact')}</label>
                    <div className="relative">
                      <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="text"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        className="form-control pl-12"
                        placeholder={t('customer.contact_placeholder')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="form-label">{t('customer.phone_label')}</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="form-control pl-12"
                      placeholder={t('customer.phone_placeholder')}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="form-label">{t('customer.address_label')}</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3 text-slate-300" size={16} />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="form-control pl-12 min-h-[80px] resize-none"
                      placeholder={t('customer.address_placeholder')}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-slate-50">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 font-bold text-xs text-slate-400 hover:text-slate-600">{t('customer.cancel')}</button>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? t('customer.saving') : t('customer.save_changes')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
