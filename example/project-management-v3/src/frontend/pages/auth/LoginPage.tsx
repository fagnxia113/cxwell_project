/**
 * 登录页面 - cxwell 品牌化重设计
 * 风格：高端、简洁、专业 (Light Premium)
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  User, 
  Lock, 
  ChevronRight, 
  AlertCircle, 
  Globe,
  Loader2,
  ShieldCheck,
  Languages
} from 'lucide-react'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import logo from '../../assets/logo.png'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'

export default function LoginPage() {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError(t('login.credentials_required'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.post<any>(`${API_URL.BASE}/api/auth/login`, {
        username,
        password
      })

      const loginData = response?.data || response;

      if (loginData && loginData.token) {
        localStorage.setItem('token', loginData.token)
        localStorage.setItem('user', JSON.stringify(loginData.user))
        window.dispatchEvent(new Event('storage'))
        window.location.replace('/dashboard')
      } else {
        setError(t('login.error'))
      }
    } catch (err: any) {
      setError(err.message || t('login.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-primary/20">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 bg-mesh opacity-40" />
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse-subtle" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse-subtle" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute top-8 right-8 z-50">
        <LanguageSwitcher />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[520px] relative z-10"
      >
        {/* Branding Container */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block"
          >
            <div className="w-64 h-24 mb-4 mx-auto flex items-center justify-center p-2 hover:scale-105 transition-transform duration-500">
               <img src={logo} alt="logo" className="w-full h-full object-contain" />
            </div>
          </motion.div>
        </div>

        {/* Auth Module */}
        <div className="bg-white rounded-3xl p-10 md:p-14 shadow-[0_40px_100px_-20px_rgba(5,150,105,0.12)] border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
          
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-black text-primary">{t('login.title')}</h2>
            <div className="px-4 py-1.5 bg-primary/5 rounded-full border border-primary/20 flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{t('login.secure_entry')}</span>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('login.username')}</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white outline-none transition-all text-primary font-bold placeholder:text-slate-300 shadow-inner"
                  placeholder={t('login.username')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{t('login.password')}</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white outline-none transition-all text-primary font-bold placeholder:text-slate-300 shadow-inner"
                  placeholder={t('login.password')}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-100 text-red-500 px-5 py-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-sm"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden rounded-2xl group active:scale-[0.98] transition-transform"
            >
              <div className="absolute inset-0 bg-primary hover:bg-primary-hover transition-colors" />
              <div className="relative py-5 flex items-center justify-center gap-3 text-white font-black uppercase tracking-[0.3em] text-xs">
                {loading ? (
                  <Loader2 size={20} className="animate-spin text-accent" />
                ) : (
                  <>
                    {t('login.submit')}
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform text-accent" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-12 text-center pt-8 border-t border-slate-50">
            <div className="inline-flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-primary transition-colors cursor-help">
              <Globe size={12} />
              {t('login.infrastructure')}
            </div>
          </div>
        </div>

        {/* Global Footer */}
        <p className="text-center mt-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60">
          {t('login.copyright')}
        </p>
      </motion.div>
    </div>
  )
}
