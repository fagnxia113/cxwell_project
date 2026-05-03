import React, { useState, useEffect, useMemo } from 'react'
import { 
  Folder, 
  FileText, 
  Upload, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Download, 
  Search,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  ArrowLeft,
  X,
  File,
  Shield,
  Globe,
  Lock,
  Users,
  Check,
  AlertCircle,
  Menu,
  RotateCcw,
  ArrowRightLeft
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { knowledgeApi } from '../../api/knowledgeApi'
import { orgApi } from '../../api/orgApi'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'

interface KnowledgeItem {
  id: string;
  title: string;
  isFolder: boolean;
  parentId: string | null;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  ownerId: string;
  visibilityType: 'everyone' | 'private' | 'specified';
  createdAt: string;
  createBy?: string;
  children?: KnowledgeItem[];
  permissions?: any[];
}

const VisibilityBadge = ({ type }: { type: KnowledgeItem['visibilityType'] }) => {
  const { t } = useTranslation();
  const config = {
    everyone: { icon: Globe, color: 'text-emerald-600 bg-emerald-50', label: t('knowledge.visibility_everyone') },
    private: { icon: Lock, color: 'text-rose-600 bg-rose-50', label: t('knowledge.visibility_private') },
    specified: { icon: Users, color: 'text-indigo-600 bg-indigo-50', label: t('knowledge.visibility_specified') }
  };
  const { icon: Icon, color, label } = config[type] || config.private;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider", color)}>
      <Icon size={11} />
      {label}
    </span>
  );
};

const TreeNode = ({ 
  item, 
  level, 
  currentId, 
  onSelect, 
  expandedNodes, 
  toggleExpand 
}: { 
  item: KnowledgeItem; 
  level: number; 
  currentId: string | null; 
  onSelect: (id: string) => void;
  expandedNodes: Set<string>;
  toggleExpand: (id: string) => void;
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedNodes.has(item.id);
  const isSelected = currentId === item.id;

  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all group",
          isSelected ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-500 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 hover:text-slate-900"
        )}
        style={{ marginLeft: `${level * 16}px` }}
        onClick={() => {
          onSelect(item.id);
          if (hasChildren) toggleExpand(item.id);
        }}
      >
        <div className="shrink-0">
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />
          ) : (
            <div className="w-3.5" />
          )}
        </div>
        <Folder size={18} className={cn("shrink-0", isSelected ? "text-indigo-400" : "text-amber-400")} fill={isSelected ? "currentColor" : "none"} />
        <span className="text-[13px] font-bold truncate flex-1 tracking-tight">{item.title}</span>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="animate-in slide-in-from-top-1 duration-300">
          {item.children!.map(child => (
            <TreeNode 
              key={child.id} 
              item={child} 
              level={level + 1} 
              currentId={currentId} 
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function KnowledgePage() {
  const { t } = useTranslation()
  const { success, error: showError } = useMessage()
  const { confirm } = useConfirm()
  
  const [folders, setFolders] = useState<KnowledgeItem[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false)
  
  // States
  const [newFolderName, setNewFolderName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [fileNames, setFileNames] = useState<Record<number, string>>({})
  const [uploadTargetFolder, setUploadTargetFolder] = useState<string>('current')
  
  // Selection
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
  const [visibilityType, setVisibilityType] = useState<'everyone' | 'private' | 'specified'>('everyone')
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([])
  const [deptSearch, setDeptSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  
  const [allDepts, setAllDepts] = useState<any[]>([])
  const [allEmployees, setAllEmployees] = useState<any[]>([])
  const [transferTarget, setTransferTarget] = useState<string>('')
  const [transferSearch, setTransferSearch] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored))
      } catch {}
    }
    loadData()
    loadOptions()
  }, [])

  const mapDates = (items: any[]): KnowledgeItem[] => {
    return items.map(item => ({
      ...item,
      createdAt: item.createTime || item.createdAt,
      createBy: item.createBy,
      children: item.children ? mapDates(item.children) : undefined
    }))
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await knowledgeApi.getTree()
      const data = Array.isArray(res) ? res : (res.data || [])
      setFolders(mapDates(data))
    } catch (error: any) {
      showError(error.message || t('knowledge.load_error'))
    } finally {
      setLoading(false)
    }
  }

  const loadOptions = async () => {
    try {
      const [depts, users] = await Promise.all([
        orgApi.getDeptTree(),
        orgApi.getEmployees({ pageSize: 1000 })
      ])
      setAllDepts(depts.data || [])
      setAllEmployees(users.data?.list || users.data || [])
    } catch (error) {
      console.error('Failed to load options', error)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const flatFolders = useMemo(() => {
    const list: KnowledgeItem[] = [];
    const flatten = (items: KnowledgeItem[]) => {
      items.forEach(item => {
        if (item.isFolder) {
          list.push(item);
          if (item.children) flatten(item.children);
        }
      });
    };
    flatten(folders);
    return list;
  }, [folders]);

  const canEditPermissions = (item: KnowledgeItem) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'general_manager') return true;
    if (item.createBy && currentUser.loginName && item.createBy === currentUser.loginName) return true;
    return false;
  }

  const currentContent = useMemo(() => {
    const findFolder = (list: KnowledgeItem[]): KnowledgeItem | undefined => {
      for (const item of list) { 
        if (item.id === currentFolderId) return item;
        if (item.children) {
          const found = findFolder(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    const items = currentFolderId ? findFolder(folders)?.children || [] : folders;
    return items.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [folders, currentFolderId, searchTerm]);

  const path = useMemo(() => {
    if (!currentFolderId) return [];
    const p: KnowledgeItem[] = [];
    const find = (list: KnowledgeItem[], targetId: string): boolean => {
      for (const item of list) {
        if (item.id === targetId) {
          p.push(item);
          return true;
        }
        if (item.children && find(item.children, targetId)) {
          p.unshift(item);
          return true;
        }
      }
      return false;
    };
    find(folders, currentFolderId);
    return p;
  }, [folders, currentFolderId]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    try {
      const data = {
        title: newFolderName,
        isFolder: true,
        parentId: currentFolderId,
        visibilityType,
        permissions: visibilityType === 'specified' ? [
          ...selectedDepartments.map(id => ({ targetType: 'DEPT', targetId: id })),
          ...selectedPersonnel.map(id => ({ targetType: 'USER', targetId: id }))
        ] : []
      }
      await knowledgeApi.create(data)
      success(t('knowledge.folder_created'))
      setIsFolderModalOpen(false)
      setNewFolderName('')
      loadData()
    } catch (error: any) {
      showError(error.message || t('knowledge.folder_error'))
    }
  }

  const handleBatchUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    try {
      const targetId = uploadTargetFolder === 'current' ? currentFolderId : uploadTargetFolder;
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('parentId', targetId || '')
        formData.append('title', file.name)
        await knowledgeApi.upload(formData)
      }
      success(t('knowledge.upload_success'))
      setIsUploadModalOpen(false)
      setFiles([])
      loadData()
    } catch (error: any) {
      showError(error.message || t('knowledge.upload_error'))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('common.confirm_delete'),
      content: t('knowledge.delete_confirm_desc'),
      type: 'danger'
    })
    if (confirmed) {
      try {
        await knowledgeApi.delete(id)
        success(t('common.delete_success'))
        loadData()
      } catch (error: any) {
        showError(error.message || t('common.delete_error'))
      }
    }
  }

  const openPermissionModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setVisibilityType(item.visibilityType || 'everyone');
    setSelectedDepartments(item.permissions?.filter(p => p.targetType === 'DEPT').map(p => p.targetId) || []);
    setSelectedPersonnel(item.permissions?.filter(p => p.targetType === 'USER').map(p => p.targetId) || []);
    setTransferTarget('');
    setIsPermissionModalOpen(true);
  }

  const handleUpdatePermissions = async () => {
    if (!editingItem) return;
    try {
      const data = {
        visibilityType,
        permissions: visibilityType === 'specified' ? [
          ...selectedDepartments.map(id => ({ targetType: 'DEPT', targetId: id })),
          ...selectedPersonnel.map(id => ({ targetType: 'USER', targetId: id }))
        ] : []
      };
      await knowledgeApi.updatePermissions(editingItem.id, data);
      success(t('knowledge.perm_updated'));
      setIsPermissionModalOpen(false);
      loadData();
    } catch (error: any) {
      showError(error.message || t('knowledge.perm_error'));
    }
  }

  const handleTransferOwner = async () => {
    if (!editingItem || !transferTarget) return;
    const targetEmp = allEmployees.find(e => e.employeeId === transferTarget);
    if (!targetEmp?.loginName) {
      showError(t('knowledge.transfer_no_login'));
      return;
    }
    const confirmed = await confirm({
      title: t('knowledge.transfer_confirm_title'),
      content: t('knowledge.transfer_confirm_desc', { name: targetEmp.name }),
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await knowledgeApi.transferOwner(editingItem.id, targetEmp.loginName);
      success(t('knowledge.transfer_success'));
      setIsPermissionModalOpen(false);
      setTransferTarget('');
      loadData();
    } catch (error: any) {
      showError(error.message || t('knowledge.transfer_error'));
    }
  }

  return (
    <div className="h-screen bg-slate-50 flex animate-fade-in overflow-hidden">
      {/* Sidebar - Tree Navigation */}
      <motion.div 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shrink-0 shadow-sm z-20"
      >
        <div className="p-8 border-b border-slate-50">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('knowledge.sidebar_title')}</h2>
                <p className="text-[18px] font-black text-slate-900 mt-1 tracking-tighter">{t('knowledge.title')}</p>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 lg:hidden"><ArrowLeft size={16} /></button>
           </div>
           
           <button 
             onClick={() => setCurrentFolderId(null)}
             className={cn(
               "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all border",
               !currentFolderId ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
             )}
           >
             <Globe size={18} />
             <span>{t('knowledge.sidebar_root')}</span>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
           {folders.filter(f => f.isFolder).map(folder => (
             <TreeNode 
               key={folder.id} 
               item={folder} 
               level={0} 
               currentId={currentFolderId} 
               onSelect={setCurrentFolderId}
               expandedNodes={expandedNodes}
               toggleExpand={toggleExpand}
             />
           ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-5">
               {!isSidebarOpen && (
                 <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all shadow-sm"><Menu size={20} /></button>
               )}
               <div className="hidden md:block">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-900 rounded-2xl text-white shadow-lg shadow-slate-200"><Folder size={20} strokeWidth={2.5} /></div>
                    <div>
                      <h1 className="text-[20px] font-black text-slate-900 tracking-tight leading-none">{t('knowledge.title')}</h1>
                      <div className="flex items-center gap-2 mt-1.5 overflow-hidden max-w-[400px]">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest shrink-0">{t('knowledge.subtitle')}</span>
                        <ChevronRight size={10} className="text-slate-300" />
                        <span className="text-[10px] font-bold text-indigo-500 truncate uppercase">{currentFolderId ? flatFolders.find(f => f.id === currentFolderId)?.title : t('knowledge.sidebar_root')}</span>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex-1 max-w-xl relative group">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
               <input 
                 type="text" 
                 placeholder={t('knowledge.search_placeholder')}
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] pl-12 pr-4 py-3 text-sm font-bold focus:bg-white focus:border-indigo-100 focus:ring-0 transition-all outline-none"
               />
            </div>

            <div className="flex items-center gap-3">
               <button onClick={() => setIsFolderModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95">
                 <FolderPlus size={16} />
                 <span className="hidden lg:inline">{t('knowledge.btn_new_folder')}</span>
               </button>
               <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95">
                 <Upload size={16} />
                 <span className="hidden lg:inline">{t('knowledge.btn_upload')}</span>
               </button>
            </div>
          </div>

          {/* New Modern Breadcrumbs */}
          <nav className="flex items-center gap-1.5 mt-8 p-1.5 bg-slate-50 rounded-2xl w-fit">
             <button onClick={() => setCurrentFolderId(null)} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all", !currentFolderId ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:bg-white/50")}>
               <Globe size={14} />
               {t('knowledge.sidebar_root')}
             </button>
             {path.map((item, index) => (
               <React.Fragment key={item.id}>
                 <ChevronRight size={12} className="text-slate-300 mx-0.5" />
                 <button onClick={() => setCurrentFolderId(item.id)} className={cn("px-4 py-1.5 rounded-xl text-xs font-bold transition-all", index === path.length - 1 ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:bg-white/50")}>
                   {item.title}
                 </button>
               </React.Fragment>
             ))}
          </nav>
        </header>

        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
               <div className="w-12 h-12 border-[5px] border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
               <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('common.loading')}</p>
            </div>
          ) : currentContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-sm mx-auto">
               <div className="w-24 h-24 bg-white rounded-[40px] shadow-xl shadow-slate-200/50 flex items-center justify-center text-slate-200 mb-8 animate-bounce-slow">
                  <Folder size={48} />
               </div>
               <h3 className="text-lg font-black text-slate-900 mb-3">{t('knowledge.empty_title')}</h3>
               <p className="text-sm text-slate-400 font-medium leading-relaxed">{t('knowledge.empty_desc')}</p>
            </div>
          ) : (
            <div className="space-y-4">
               <div className="grid grid-cols-12 gap-6 px-10 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <div className="col-span-6">{t('knowledge.col_name')}</div>
                  <div className="col-span-2">{t('knowledge.col_visibility')}</div>
                  <div className="col-span-2">{t('knowledge.col_date')}</div>
                  <div className="col-span-2 text-right">{t('knowledge.col_actions')}</div>
               </div>

               <div className="space-y-2">
                 {currentContent.map((item, i) => (
                   <motion.div 
                     key={item.id}
                     initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                     className="grid grid-cols-12 gap-6 px-10 py-5 bg-white rounded-[24px] border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group items-center"
                   >
                     <div className="col-span-6 flex items-center gap-5">
                        <div onClick={() => item.isFolder && setCurrentFolderId(item.id)} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all cursor-pointer", item.isFolder ? "bg-amber-50 text-amber-500 group-hover:bg-amber-100 group-hover:rotate-6" : "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100 group-hover:-rotate-6")}>
                           {item.isFolder ? <Folder size={24} fill="currentColor" /> : <FileText size={24} />}
                        </div>
                        <div className="min-w-0">
                           <h4 onClick={() => item.isFolder && setCurrentFolderId(item.id)} className="text-[15px] font-black text-slate-900 truncate hover:text-indigo-600 cursor-pointer transition-colors tracking-tight">{item.title}</h4>
                           {!item.isFolder && <p className="text-[11px] text-slate-400 font-black uppercase mt-1">{(item.fileSize ? (item.fileSize / 1024 / 1024).toFixed(2) : 0)} MB • {item.fileType?.toUpperCase()}</p>}
                        </div>
                     </div>
                     <div className="col-span-2"><VisibilityBadge type={item.visibilityType} /></div>
                     <div className="col-span-2"><span className="text-[13px] font-bold text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span></div>
                     <div className="col-span-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        {item.isFolder && canEditPermissions(item) && <button onClick={() => openPermissionModal(item)} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-slate-400 transition-all" title={t('knowledge.perm_edit')}><Shield size={18} /></button>}
                        {!item.isFolder && <button onClick={() => item.fileUrl && window.open(item.fileUrl)} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-slate-400 transition-all"><Download size={18} /></button>}
                        <button onClick={() => handleDelete(item.id)} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-400 transition-all"><Trash2 size={18} /></button>
                     </div>
                   </motion.div>
                 ))}
               </div>
            </div>
          )}
        </main>
      </div>

      {/* Permission Modal */}
      <AnimatePresence>
        {isPermissionModalOpen && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white w-full max-w-lg rounded-xl shadow-lg overflow-hidden"
             >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                   <div>
                      <h3 className="text-lg font-bold text-slate-800">{t('knowledge.perm_edit')}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Folder size={12} className="text-amber-500" fill="currentColor" />
                        <p className="text-xs text-slate-400 font-medium">{editingItem.title}</p>
                      </div>
                   </div>
                   <button onClick={() => setIsPermissionModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.permissions_title')}</label>
                      <div className="flex gap-2">
                         {(['everyone', 'private', 'specified'] as const).map((mode) => (
                            <button key={mode} type="button" onClick={() => setVisibilityType(mode)} className={cn("flex-1 py-3 px-3 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-2", visibilityType === mode ? "bg-indigo-50 border-indigo-500 text-indigo-600" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300")}>
                               {mode === 'everyone' && <Globe size={14} />}
                               {mode === 'private' && <Lock size={14} />}
                               {mode === 'specified' && <Users size={14} />}
                               {t(`knowledge.visibility_${mode}`)}
                            </button>
                         ))}
                      </div>
                   </div>

                   {visibilityType === 'specified' && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-indigo-500" />
                            <span className="text-xs font-semibold text-slate-600">
                              {t('knowledge.perm_selected_count', { count: selectedDepartments.length + selectedPersonnel.length })}
                            </span>
                          </div>
                          {(selectedDepartments.length > 0 || selectedPersonnel.length > 0) && (
                            <button onClick={() => { setSelectedDepartments([]); setSelectedPersonnel([]); }} className="text-[10px] font-semibold text-rose-500 hover:underline flex items-center gap-1">
                              <RotateCcw size={10} />
                              {t('knowledge.perm_clear_all')}
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.perm_depts')}</label>
                           <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-3 bg-slate-50 rounded-lg border border-slate-100 custom-scrollbar">
                              {allDepts.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase())).map(dept => (
                                 <button key={dept.id} type="button" onClick={() => setSelectedDepartments(prev => prev.includes(dept.id) ? prev.filter(i => i !== dept.id) : [...prev, dept.id])} className={cn("px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border", selectedDepartments.includes(dept.id) ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300")}>
                                    {selectedDepartments.includes(dept.id) && <Check size={10} />}
                                    {dept.name}
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.perm_users')}</label>
                           <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-3 bg-slate-50 rounded-lg border border-slate-100 custom-scrollbar">
                              {allEmployees.filter(e => e.name.toLowerCase().includes(userSearch.toLowerCase())).map(emp => (
                                 <button key={emp.employeeId} type="button" onClick={() => setSelectedPersonnel(prev => prev.includes(emp.employeeId) ? prev.filter(i => i !== emp.employeeId) : [...prev, emp.employeeId])} className={cn("px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border", selectedPersonnel.includes(emp.employeeId) ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300")}>
                                    {selectedPersonnel.includes(emp.employeeId) && <Check size={10} />}
                                    {emp.name}
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>
                   )}

                   <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft size={14} className="text-amber-500" />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.transfer_owner')}</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={transferTarget} onChange={e => setTransferTarget(e.target.value)} className="flex-1 bg-slate-50 border border-transparent focus:border-indigo-100 rounded-lg px-3 py-2.5 text-sm font-medium focus:bg-white transition-all outline-none">
                          <option value="">{t('knowledge.transfer_select_placeholder')}</option>
                          {allEmployees.filter(e => e.name.toLowerCase().includes(transferSearch.toLowerCase())).map(emp => (
                            <option key={emp.employeeId} value={emp.employeeId}>{emp.name}{emp.loginName ? ` (${emp.loginName})` : ''}</option>
                          ))}
                        </select>
                        <button onClick={handleTransferOwner} disabled={!transferTarget} className="px-4 py-2.5 bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed">{t('knowledge.transfer_btn')}</button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{t('knowledge.transfer_tip')}</p>
                   </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                   <button onClick={() => setIsPermissionModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-all">{t('common.cancel')}</button>
                   <button onClick={handleUpdatePermissions} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm hover:brightness-110 transition-all">{t('common.save')}</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Folder Modal */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="text-lg font-bold text-slate-800">{t('knowledge.folder_new')}</h3>
                   <button onClick={() => setIsFolderModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"><X size={18} /></button>
                </div>
                <form onSubmit={handleCreateFolder} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.folder_name')}</label>
                       <input autoFocus type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder={t('knowledge.folder_placeholder')} className="w-full bg-slate-50 border border-transparent focus:border-indigo-100 rounded-lg px-4 py-3 text-sm font-medium focus:bg-white transition-all outline-none" />
                   </div>

                   <div className="space-y-3 pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.permissions_title')}</label>
                      <div className="flex gap-2">
                         {(['everyone', 'private', 'specified'] as const).map((mode) => (
                            <button key={mode} type="button" onClick={() => setVisibilityType(mode)} className={cn("flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-1.5", visibilityType === mode ? "bg-indigo-50 border-indigo-500 text-indigo-600" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300")}>
                               {mode === 'everyone' && <Globe size={12} />}
                               {mode === 'private' && <Lock size={12} />}
                               {mode === 'specified' && <Users size={12} />}
                               {t(`knowledge.visibility_${mode}`)}
                            </button>
                         ))}
                      </div>

                      {visibilityType === 'specified' && (
                         <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.perm_depts')}</label>
                               <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto p-2.5 bg-slate-50 rounded-lg border border-slate-100 custom-scrollbar">
                                  {allDepts.map(dept => (
                                     <button key={dept.id} type="button" onClick={() => setSelectedDepartments(prev => prev.includes(dept.id) ? prev.filter(i => i !== dept.id) : [...prev, dept.id])} className={cn("px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border", selectedDepartments.includes(dept.id) ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300")}>
                                        {dept.name}
                                     </button>
                                  ))}
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.perm_users')}</label>
                               <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto p-2.5 bg-slate-50 rounded-lg border border-slate-100 custom-scrollbar">
                                  {allEmployees.map(emp => (
                                     <button key={emp.employeeId} type="button" onClick={() => setSelectedPersonnel(prev => prev.includes(emp.employeeId) ? prev.filter(i => i !== emp.employeeId) : [...prev, emp.employeeId])} className={cn("px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border", selectedPersonnel.includes(emp.employeeId) ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300")}>
                                        {emp.name}
                                     </button>
                                  ))}
                               </div>
                            </div>
                         </div>
                      )}
                   </div>

                   <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                      <button type="button" onClick={() => setIsFolderModalOpen(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-all">{t('common.cancel')}</button>
                      <button type="submit" disabled={!newFolderName.trim()} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium shadow-sm hover:brightness-110 transition-all disabled:opacity-40">{t('common.save')}</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-lg rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                   <div>
                     <h3 className="text-lg font-bold text-slate-800">{t('knowledge.upload_title')}</h3>
                     <p className="text-xs text-slate-400 font-medium mt-0.5">{t('knowledge.upload_subtitle')}</p>
                   </div>
                   <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-5">
                   <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }} className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group cursor-pointer relative">
                      <input type="file" multiple onChange={e => e.target.files && setFiles(prev => [...prev, ...Array.from(e.target.files!)])} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-all"><Upload size={28} /></div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-700">{t('knowledge.upload_drop_title')}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('knowledge.upload_drop_desc')}</p>
                      </div>
                   </div>
                   {files.length > 0 && (
                     <div className="space-y-2 max-h-32 overflow-y-auto p-3 bg-slate-50 rounded-lg custom-scrollbar">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg shrink-0"><File size={14} /></div>
                              <span className="text-sm font-medium text-slate-700 truncate">{f.name}</span>
                            </div>
                            <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-1.5 text-slate-300 hover:text-rose-500 shrink-0"><X size={14} /></button>
                          </div>
                        ))}
                     </div>
                   )}
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.upload_target')}</label>
                      <select value={uploadTargetFolder} onChange={e => setUploadTargetFolder(e.target.value)} className="w-full bg-slate-50 border border-transparent focus:border-indigo-100 rounded-lg px-3 py-2.5 text-sm font-medium focus:bg-white transition-all outline-none">
                         <option value="current">{currentFolderId ? flatFolders.find(f => f.id === currentFolderId)?.title : t('knowledge.sidebar_root')}</option>
                         {flatFolders.map(folder => (<option key={folder.id} value={folder.id}>{folder.title}</option>))}
                      </select>
                   </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                   <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-all">{t('common.cancel')}</button>
                   <button disabled={uploading || files.length === 0} onClick={handleBatchUpload} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-40">
                     {uploading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                     {t('knowledge.upload_submit')}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
