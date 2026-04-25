import React, { useState, useEffect, useMemo } from 'react'
import { 
  Settings, 
  Bell, 
  ShoppingCart, 
  Package, 
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
  Send
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { cn } from '../../utils/cn'

const t = (key: string): string => {
  const map: Record<string, string> = {
    'system_settings.wecom_sync_success': '企业微信配置已保存',
    'system_settings.save_failed': '保存失败: {error}',
    'system_settings.unknown_error': '未知错误',
    'system_settings.smtp_save_success': 'SMTP配置已保存',
    'system_settings.smtp_test_success': '测试邮件发送成功',
    'system_settings.smtp_test_failed': '测试邮件发送失败: {error}',
    'system_settings.test_failed': '测试失败: {error}',
    'system_settings.params_load_failed': '加载参数失败',
    'system_settings.core_params_sync_success': '核心参数同步成功',
    'system_settings.descriptions.purchase_manager_id': '采购审批负责人',
    'system_settings.descriptions.equipment_manager_id': '设备审批负责人',
    'system_settings.descriptions.hr_manager_id': '人事审批负责人',
    'system_settings.descriptions.daily_report_reminder_time': '日报提醒时间',
    'system_settings.descriptions.progress_check_interval': '进度检查间隔(分钟)',
    'system_settings.descriptions.deviation_threshold_warning': '偏差警告阈值(%)',
    'system_settings.descriptions.deviation_threshold_severe': '偏差严重阈值(%)',
    'system_settings.core_system_params': '系统核心参数',
    'system_settings.core_system_params_desc': '配置系统的核心运行参数',
    'system_settings.global_view': '全局视图',
    'system_settings.config_entropy': '配置统计',
    'system_settings.config_warning': '修改前请确认影响范围',
    'system_settings.search_placeholder': '搜索配置项...',
    'system_settings.loading_params': '加载中...',
    'system_settings.no_matching': '无匹配项',
    'system_settings.no_matching_desc': '尝试调整搜索条件',
    'system_settings.schedulers': '定时任务',
    'system_settings.progress_check_engine': '进度检查引擎',
    'system_settings.daily_report_protocol': '日报提醒协议',
    'system_settings.equipment_maintenance': '设备维护检查',
    'system_settings.cron.hourly': '每小时执行',
    'system_settings.cron.daily_18': '每天18:00执行',
    'system_settings.cron.daily_09': '每天09:00执行',
    'system_settings.execute_now': '立即执行',
    'system_settings.smtp_config': 'SMTP邮件配置',
    'system_settings.smtp_desc': '配置发送邮件的SMTP服务器',
    'system_settings.smtp_server': 'SMTP服务器',
    'system_settings.port': '端口',
    'system_settings.username': '用户名',
    'system_settings.password': '密码',
    'system_settings.sender_address': '发件人地址',
    'system_settings.placeholder.smtp_host': 'smtp.example.com',
    'system_settings.placeholder.smtp_port': '587',
    'system_settings.placeholder.smtp_password': '输入密码',
    'system_settings.placeholder.smtp_from': 'noreply@company.com',
    'system_settings.test_connection': '测试连接',
    'system_settings.save_config': '保存配置',
    'system_settings.wecom_integration': '企业微信集成',
    'system_settings.wecom_desc': '配置与企业微信的集成',
    'system_settings.auto_sync': '自动同步',
    'system_settings.corp_id': '企业ID',
    'system_settings.agent_id': '应用AgentId',
    'system_settings.app_secret': '应用Secret',
    'system_settings.checkin_secret': '打卡Secret',
    'system_settings.placeholder.wecom_agent_id': '输入AgentId',
    'system_settings.placeholder.wecom_secret': '输入Secret',
    'system_settings.placeholder.wecom_checkin_secret': '输入打卡Secret',
    'system_settings.update_integration': '更新集成配置',
    'system_settings.local_changes': '您有未保存的修改',
    'system_settings.persist_confirm': '确认保存这些修改?',
    'system_settings.discard_changes': '放弃修改',
    'system_settings.sync_persist': '同步保存',
  }
  return map[key] || key
}

interface SystemConfig {
  id: string
  key: string
  value: string
  description: string
  category: string
}

export default function SystemSettingsPage() {
  const categoryConfig = {
    general: { label: '通用设置', icon: Settings, color: 'blue' },
    notification: { label: '通知设置', icon: Bell, color: 'rose' },
    smtp: { label: '邮件设置', icon: Mail, color: 'indigo' },
    integration: { label: '集成设置', icon: Zap, color: 'emerald' },
  }
  const message = useMessage()
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('general')
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')

  // SMTP 配置状态
  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: '587', user: '', pass: '', from: '' })
  const [smtpLoading, setSmtpLoading] = useState(false)
  const [smtpTesting, setSmtpTesting] = useState(false)
  const [smtpSaving, setSmtpSaving] = useState(false)

  // 企微配置状态
  const [wecomConfig, setWecomConfig] = useState({ corpId: '', agentId: '', appSecret: '', checkinSecret: '', syncEnabled: true })
  const [wecomLoading, setWecomLoading] = useState(false)
  const [wecomSaving, setWecomSaving] = useState(false)

  useEffect(() => {
    loadConfigs()
  }, [])

  useEffect(() => {
    if (activeCategory === 'smtp') {
      loadSmtpConfig()
    } else if (activeCategory === 'integration') {
      loadWecomConfig()
    }
  }, [activeCategory])

  const loadWecomConfig = async () => {
    setWecomLoading(true)
    try {
      const res = await apiClient.get<any>('/api/system-config/wechat-work')
      if (res?.data) {
        setWecomConfig({
          corpId: res.data.corpId || '',
          agentId: res.data.agentId || '',
          appSecret: '', // 不回显
          checkinSecret: '', // 不回显
          syncEnabled: res.data.syncEnabled ?? true
        })
      }
    } catch (e) {
      // ignore
    } finally {
      setWecomLoading(false)
    }
  }

  const handleWecomSave = async () => {
    setWecomSaving(true)
    try {
      await apiClient.post('/api/system-config/wechat-work', wecomConfig)
      message.success(t('system_settings.wecom_sync_success'))
    } catch (e: any) {
      message.error(`保存失败: ${e.message || '未知错误'}`)
    } finally {
      setWecomSaving(false)
    }
  }

  const loadSmtpConfig = async () => {
    setSmtpLoading(true)
    try {
      const res = await apiClient.get<any>('/api/system-config/smtp')
      if (res?.data) {
        setSmtpConfig({
          host: res.data.host || '',
          port: String(res.data.port || 587),
          user: res.data.user || '',
          pass: '', // 密码不回显
          from: res.data.from || ''
        })
      }
    } catch (e) {
      // ignore - not configured yet
    } finally {
      setSmtpLoading(false)
    }
  }

  const handleSmtpSave = async () => {
    setSmtpSaving(true)
    try {
      await apiClient.post('/api/system-config/smtp', smtpConfig)
      message.success(t('system_settings.smtp_save_success'))
    } catch (e: any) {
      message.error(`保存失败: ${e.message || '未知错误'}`)
    } finally {
      setSmtpSaving(false)
    }
  }

  const handleSmtpTest = async () => {
    setSmtpTesting(true)
    try {
      const res = await apiClient.post<any>('/api/system-config/smtp/test', {})
      if (res?.success) {
        message.success(t('system_settings.smtp_test_success'))
      } else {
        message.error(`测试邮件发送失败: ${res?.message || ''}`)
      }
    } catch (e: any) {
      message.error(`测试失败: ${e.message || ''}`)
    } finally {
      setSmtpTesting(false)
    }
  }

  const loadConfigs = async () => {
    try {
      setLoading(true)
      // Attempt using apiClient for consistency, fallback to fetch if needed for specific data URLs
      const res = await apiClient.get<any>(API_URL.DATA('system_configs'))
      if (res) {
        setConfigs(res.items || res || [])
      }
    } catch (error) {
      console.error(t('system_settings.params_load_failed'), error)
      // Fallback data for empty DBs
      setConfigs([
        { id: '4', key: 'daily_report_reminder_time', value: '18:00', description: t('system_settings.descriptions.daily_report_reminder_time'), category: 'notification' },
        { id: '5', key: 'progress_check_interval', value: '60', description: t('system_settings.descriptions.progress_check_interval'), category: 'notification' },
        { id: '6', key: 'deviation_threshold_warning', value: '5', description: t('system_settings.descriptions.deviation_threshold_warning'), category: 'notification' },
        { id: '7', key: 'deviation_threshold_severe', value: '15', description: t('system_settings.descriptions.deviation_threshold_severe'), category: 'notification' },
      ])
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
      message.success(t('system_settings.core_params_sync_success'))
      setEditedValues({})
      await loadConfigs()
    } catch (error) {
      console.error(t('system_settings.save_failed'), error)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }))
  }

  const getValue = (config: SystemConfig) => {
    return editedValues[config.key] !== undefined ? editedValues[config.key] : config.value
  }

  const filteredConfigs = useMemo(() => {
    return configs.filter(c => {
      const matchCategory = c.category === activeCategory || activeCategory === 'all'
      const matchSearch = c.description.toLowerCase().includes(searchQuery.toLowerCase()) || c.key.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [configs, activeCategory, searchQuery])

  const hasChanges = Object.keys(editedValues).length > 0

  const schedulerTasks = [
    { type: 'progress_check', label: t('system_settings.progress_check_engine'), cron: t('system_settings.cron.hourly'), icon: Zap },
    { type: 'daily_report_reminder', label: t('system_settings.daily_report_protocol'), cron: t('system_settings.cron.daily_18'), icon: Bell },
    { type: 'equipment_maintenance_check', label: t('system_settings.equipment_maintenance'), cron: t('system_settings.cron.daily_09'), icon: Package },
  ]

  const triggerTask = async (taskType: string) => {
    try {
      await apiClient.post(API_URL.NOTIFICATIONS.SCHEDULER_TRIGGER, { task_type: taskType })
      message.success(`任务 ${taskType} 已加入队列`)
    } catch (error) {
      console.error('Trigger failed:', error)
    }
  }

  return (
    <div className="max-w-full mx-auto space-y-8 animate-fade-in pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
              <Settings size={20} strokeWidth={2.5} />
            </div>
            {t('system_settings.core_system_params')}
          </h1>
          <p className="text-slate-500 font-medium">{t('system_settings.core_system_params_desc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="premium-card p-2 bg-white flex flex-col gap-1">
            <button
               onClick={() => setActiveCategory('all')}
               className={cn(
                 "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                 activeCategory === 'all' ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
               )}
            >
              <Settings size={18} />
              {t('system_settings.global_view')}
            </button>
            <div className="h-px bg-slate-50 my-1 mx-2"></div>
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                    activeCategory === key
                      ? `bg-${config.color}-50 text-${config.color}-600 border border-${config.color}-100`
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Icon size={18} />
                  {config.label}
                </button>
              )
            })}
          </div>

          {/* Quick Stats/Info */}
          <div className="premium-card p-6 bg-indigo-600 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="text-sm font-black uppercase tracking-widest mb-1 opacity-80">{t('system_settings.config_entropy')}</h4>
              <div className="text-3xl font-black">{configs.length}</div>
              <p className="text-[10px] mt-4 font-bold opacity-70 leading-relaxed uppercase">
                {t('system_settings.config_warning')}
              </p>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Info size={80} />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8">
          {/* Search Bar */}
          <div className="premium-card p-3 bg-white/70 backdrop-blur-md">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('system_settings.search_placeholder')}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:bg-white outline-none transition-all text-sm font-bold shadow-inner"
              />
            </div>
          </div>

          <div className="premium-card bg-white overflow-hidden border border-slate-100 p-0">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest">{t('system_settings.loading_params')}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredConfigs.length === 0 ? (
                  <div className="py-20 text-center px-4">
                    <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-sm font-black text-slate-900 uppercase">{t('system_settings.no_matching')}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">{t('system_settings.no_matching_desc')}</p>
                  </div>
                ) : (
                  filteredConfigs.map((config) => (
                    <div key={config.id} className="p-8 group hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              editedValues[config.key] ? "bg-amber-500 animate-pulse" : "bg-slate-200"
                            )}></span>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{config.description}</h4>
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 font-bold ml-3.5 uppercase">标识符: {config.key}</p>
                        </div>
                        <div className="md:w-72 relative">
                          <input
                            type="text"
                            value={getValue(config)}
                            onChange={(e) => handleChange(config.key, e.target.value)}
                            className={cn(
                              "w-full px-4 py-3 bg-slate-100 border-none rounded-xl text-sm font-black transition-all outline-none focus:ring-4 focus:bg-white",
                              editedValues[config.key] ? "text-amber-600 ring-amber-500/10 bg-amber-50" : "text-slate-700 focus:ring-slate-900/5 focus:bg-white"
                            )}
                          />
                          {editedValues[config.key] && (
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex gap-1">
                              <button onClick={() => {
                                const newEdited = {...editedValues};
                                delete newEdited[config.key];
                                setEditedValues(newEdited);
                              }} className="p-1 bg-white text-rose-500 rounded-full shadow-sm border border-rose-100">
                                <RotateCcw size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Schedulers Layer */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Zap size={20} className="text-slate-900" />
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('system_settings.schedulers')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedulerTasks.map((task) => (
                <div key={task.type} className="premium-card bg-white p-6 border border-slate-100 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      <task.icon size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{task.label}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        <Clock size={12} />
                        {task.cron}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => triggerTask(task.type)}
                    className="p-3 bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all active:scale-95"
                    title={t('system_settings.execute_now')}
                  >
                    <Play size={18} fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SMTP Configuration Section */}
          {activeCategory === 'smtp' && (
            <div className="premium-card bg-white border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t('system_settings.smtp_config')}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{t('system_settings.smtp_desc')}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {smtpLoading ? (
                  <div className="py-10 flex justify-center">
                    <div className="w-6 h-6 border-3 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('system_settings.smtp_server')}</label>
                        <input type="text" value={smtpConfig.host} onChange={(e) => setSmtpConfig({...smtpConfig, host: e.target.value})} placeholder={t('system_settings.placeholder.smtp_host')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('system_settings.port')}</label>
                        <input type="text" value={smtpConfig.port} onChange={(e) => setSmtpConfig({...smtpConfig, port: e.target.value})} placeholder={t('system_settings.placeholder.smtp_port')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('system_settings.username')}</label>
                        <input type="text" value={smtpConfig.user} onChange={(e) => setSmtpConfig({...smtpConfig, user: e.target.value})} placeholder="your-email@company.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('system_settings.password')}</label>
                        <input type="password" value={smtpConfig.pass} onChange={(e) => setSmtpConfig({...smtpConfig, pass: e.target.value})} placeholder={t('system_settings.placeholder.smtp_password')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('system_settings.sender_address')}</label>
                      <input type="text" value={smtpConfig.from} onChange={(e) => setSmtpConfig({...smtpConfig, from: e.target.value})} placeholder={t('system_settings.placeholder.smtp_from')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all" />
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <button onClick={handleSmtpTest} disabled={smtpTesting || !smtpConfig.host} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 disabled:opacity-50 transition-all flex items-center gap-2">
                        {smtpTesting ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin"></div> : <Send size={14} />}
                        {t('system_settings.test_connection')}
                      </button>
                      <button onClick={handleSmtpSave} disabled={smtpSaving || !smtpConfig.host} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                        {smtpSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={14} />}
                        {t('system_settings.save_config')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* WeChat Work / Third Party Integration Section */}
          {activeCategory === 'integration' && (
            <div className="premium-card bg-white border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t('system_settings.wecom_integration')}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{t('system_settings.wecom_desc')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-slate-400">{t('system_settings.auto_sync')}</span>
                  <button 
                    onClick={() => setWecomConfig({...wecomConfig, syncEnabled: !wecomConfig.syncEnabled})}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      wecomConfig.syncEnabled ? "bg-emerald-500" : "bg-slate-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                      wecomConfig.syncEnabled ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {wecomLoading ? (
                  <div className="py-10 flex justify-center">
                    <div className="w-6 h-6 border-3 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('system_settings.corp_id')}</label>
                        <input type="text" value={wecomConfig.corpId} onChange={(e) => setWecomConfig({...wecomConfig, corpId: e.target.value})} placeholder="wwa39cc1..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('system_settings.agent_id')}</label>
                        <input type="text" value={wecomConfig.agentId} onChange={(e) => setWecomConfig({...wecomConfig, agentId: e.target.value})} placeholder={t('system_settings.placeholder.wecom_agent_id')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('system_settings.app_secret')}</label>
                        <input type="password" value={wecomConfig.appSecret} onChange={(e) => setWecomConfig({...wecomConfig, appSecret: e.target.value})} placeholder={t('system_settings.placeholder.wecom_secret')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('system_settings.checkin_secret')}</label>
                        <input type="password" value={wecomConfig.checkinSecret} onChange={(e) => setWecomConfig({...wecomConfig, checkinSecret: e.target.value})} placeholder={t('system_settings.placeholder.wecom_checkin_secret')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" />
                      </div>
                    </div>
                    <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                      <button onClick={handleWecomSave} disabled={wecomSaving || !wecomConfig.corpId} className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20">
                        {wecomSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={14} />}
                        {t('system_settings.update_integration')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Save Action Bar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-8 py-4 bg-slate-900 text-white rounded-3xl shadow-2xl flex items-center gap-12 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 animate-pulse">
                <AlertCircle size={24} />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest leading-none">{t('system_settings.local_changes')}</div>
                <div className="text-[10px] font-bold opacity-60 mt-1 uppercase">{t('system_settings.persist_confirm')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditedValues({})}
                className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                {t('system_settings.discard_changes')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-2.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-2 shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {t('system_settings.sync_persist')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
