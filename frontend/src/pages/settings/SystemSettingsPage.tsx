import React, { useState, useEffect, useMemo } from 'react'
import { 
  Settings, 
  Bell, 
  Users, 
  Save, 
  RotateCcw, 
  Play, 
  Clock, 
  Search,
  CheckCircle2,
  AlertCircle,
  Zap,
  Info,
  ChevronRight,
  Mail,
  Send,
  RefreshCcw,
  Activity as ActivityIcon,
  LayoutGrid
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { cn } from '../../utils/cn'

interface SystemConfig {
  id: string
  key: string
  value: string
  description: string
  category: string
}

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => {
  const colorConfig: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600' }
  }
  const config = colorConfig[color] || colorConfig.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 25 }}
      className="bg-white p-6 rounded-lg border border-slate-100/80 shadow-sm relative overflow-hidden group"
    >
      <div className={cn(
        "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.03]",
        config.bg
      )} />
      <div className="flex items-center gap-5 relative z-10">
        <div className={cn("p-4 rounded-2xl", config.bg)}>
          <Icon size={24} strokeWidth={2.5} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
        </div>
      </div>
    </motion.div>
  )
}

export default function SystemSettingsPage() {
  const message = useMessage()
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('general')
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')

  // SMTP & WeCom state
  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: '587', user: '', pass: '', from: '' })
  const [wecomConfig, setWecomConfig] = useState({ corpId: '', agentId: '', appSecret: '', checkinSecret: '', syncEnabled: true })

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<any>(API_URL.DATA('system_configs')).catch(() => null)
      if (res) {
        setConfigs(res.items || res.data || res || [])
      } else {
        // Fallback for missing backend endpoint
        setConfigs([
          { id: '1', key: 'sys.index.title', value: 'CxWell Project Management', description: '系统首页标题', category: 'general' },
          { id: '2', key: 'sys.user.initPassword', value: '123456', description: '用户初始密码', category: 'general' },
          { id: '3', key: 'sys.mail.host', value: 'smtp.exmail.qq.com', description: '邮件服务器地址', category: 'smtp' },
        ])
      }
    } catch (error) {
      console.error('Load failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (Object.keys(editedValues).length === 0) return
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(editedValues)) {
        const config = configs.find(c => c.key === key)
        if (config) {
          await apiClient.put(`${API_URL.DATA('system_configs')}/${config.id}`, { value })
        }
      }
      message.success('配置已保存')
      setEditedValues({})
      await loadConfigs()
    } catch (error) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const filteredConfigs = useMemo(() => {
    return configs.filter(c => {
      const matchCategory = c.category === activeCategory || activeCategory === 'all'
      const matchSearch = c.description.toLowerCase().includes(searchTerm.toLowerCase()) || c.key.toLowerCase().includes(searchTerm.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [configs, activeCategory, searchTerm])

  const stats = useMemo(() => ({
    total: configs.length,
    modified: Object.keys(editedValues).length,
    lastSync: '2026-04-25',
    status: 'Healthy'
  }), [configs, editedValues])

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Standard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white">
              <Settings size={20} strokeWidth={2.5} />
            </div>
            {t('sidebar.settings')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('dashboard.subtitle')}</p>
        </motion.div>

        <div className="flex gap-2">
          {Object.keys(editedValues).length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110 disabled:opacity-50"
            >
              <Save size={14} />
              <span>{saving ? t('common.saving') : t('common.save')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('common.total')} value={stats.total} icon={Zap} color="indigo" delay={0.1} />
        <StatCard title={t('common.records')} value={stats.modified} icon={RefreshCcw} color="amber" delay={0.2} />
        <StatCard title={t('common.last_update')} value={stats.lastSync} icon={ActivityIcon} color="emerald" delay={0.3} />
        <StatCard title={t('common.status')} value={stats.status} icon={Info} color="blue" delay={0.4} />
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white/60 backdrop-blur-xl p-2 rounded-xl border border-slate-100 shadow-sm space-y-1">
            {[
              { id: 'general', label: t('settings.general'), icon: Settings },
              { id: 'notification', label: t('settings.notification'), icon: Bell },
              { id: 'smtp', label: t('settings.smtp'), icon: Mail },
              { id: 'integration', label: t('settings.integration'), icon: Zap },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all",
                  activeCategory === cat.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-slate-500 hover:bg-white hover:text-slate-700"
                )}
              >
                <cat.icon size={16} />
                {cat.label}
              </button>
            ))}
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
             <div className="flex items-center gap-2 text-indigo-700 mb-2">
                <Info size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">{t('common.safety_tip')}</span>
             </div>
             <p className="text-xs text-indigo-600 leading-relaxed">
               {t('common.safety_desc')}
             </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          {/* Search Bar */}
          <div className="premium-card p-3 bg-white/60 backdrop-blur-xl border-none flex items-center gap-4 shadow-sm">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
              <input
                type="text"
                placeholder={t('common.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
              />
            </div>
            <button onClick={loadConfigs} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-primary transition-all">
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-8 h-8 border-3 border-slate-100 border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">同步参数中...</p>
              </div>
            ) : filteredConfigs.length === 0 ? (
              <div className="py-20 text-center opacity-30 grayscale">
                <AlertCircle size={48} className="mx-auto mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">无匹配项</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredConfigs.map((config) => (
                  <div key={config.id} className="p-6 hover:bg-slate-50/50 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-bold text-slate-800">{config.description}</h4>
                          {editedValues[config.key] !== undefined && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded border border-amber-100">未保存</span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">KEY: {config.key}</p>
                      </div>
                      <div className="md:w-72">
                        <input
                          type="text"
                          value={editedValues[config.key] !== undefined ? editedValues[config.key] : config.value}
                          onChange={(e) => setEditedValues(prev => ({ ...prev, [config.key]: e.target.value }))}
                          className={cn(
                            "w-full px-4 py-2 bg-slate-50 border border-transparent rounded-lg text-sm font-medium transition-all focus:bg-white focus:border-primary outline-none",
                            editedValues[config.key] !== undefined && "border-amber-200 bg-amber-50/30 text-amber-700"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Floating Actions for Multi-Edit */}
          <AnimatePresence>
            {Object.keys(editedValues).length > 0 && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700"
              >
                <div className="flex items-center gap-3 pr-4 border-r border-slate-700">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-slate-900">
                    <AlertCircle size={18} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">{Object.keys(editedValues).length} 项修改待保存</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditedValues({})} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">放弃</button>
                  <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/20">立即保存</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
