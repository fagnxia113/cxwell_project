import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  BookOpen, Search, Plus, Download, PlayCircle, FileText, 
   Award, Folder, ChevronRight, ChevronDown, 
  Trash2, Pencil, Home, Upload, X, File,
  MoreHorizontal, ChevronLeft, FolderPlus, FileUp
} from 'lucide-react'
import { apiClient } from '../../utils/apiClient'
import { cn } from '../../utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { useMessage } from '../../hooks/useMessage'
import { usePermission } from '../../contexts/PermissionContext'
import { useConfirm } from '../../contexts/ConfirmContext'

interface KnowledgeItem {
  id: string
  title: string
  type: 'SOP' | 'Video' | 'Document' | 'Folder'
  author?: string
  createTime: string
  fileUrl?: string
  isFolder: boolean
  parentId: string | null
}

const FolderTreeItem: React.FC<{
  folder: KnowledgeItem
  allFolders: KnowledgeItem[]
  currentFolderId: string | null
  onSelect: (id: string | null) => void
  level: number
}> = ({ folder, allFolders, currentFolderId, onSelect, level }) => {
  const [isOpen, setIsOpen] = useState(false)
  const children = allFolders.filter(f => f.parentId === folder.id)
  const isActive = currentFolderId === folder.id

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <div className="select-none">
      <div 
        onClick={() => onSelect(folder.id)}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        className={cn(
          "group flex items-center justify-between py-2 pr-2 rounded-lg cursor-pointer transition-all",
          isActive ? "bg-indigo-50 text-indigo-700 font-bold" : "hover:bg-slate-50 text-slate-500"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div 
            onClick={handleToggle}
            className={cn(
              "w-4 h-4 flex items-center justify-center rounded transition-colors hover:bg-slate-200/50",
              children.length === 0 && "opacity-0 pointer-events-none"
            )}
          >
            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </div>
          <Folder size={16} className={cn(isActive ? "text-indigo-500 fill-indigo-50" : "text-slate-400")} />
          <span className="text-[13px] truncate tracking-tight">{folder.title}</span>
        </div>
      </div>
      
      {isOpen && children.length > 0 && (
        <div className="mt-0.5">
          {children.map(child => (
            <FolderTreeItem 
              key={child.id} 
              folder={child} 
              allFolders={allFolders} 
              currentFolderId={currentFolderId} 
              onSelect={onSelect} 
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function KnowledgePage() {
  const { t } = useTranslation()
  const { error: showError, success: showSuccess } = useMessage()
  const { confirm } = useConfirm()
  const { hasPermission } = usePermission()

  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<KnowledgeItem[]>([])
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // UI State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const newMenuRef = useRef<HTMLDivElement>(null)

  // Form State
  const [files, setFiles] = useState<File[]>([])
  const [fileNames, setFileNames] = useState<Record<number, string>>({})
  const [newFolderName, setNewFolderName] = useState('')
  const [uploadTargetFolder, setUploadTargetFolder] = useState<string>('current')
  
  // Permission Form State
  const [visibilityType, setVisibilityType] = useState<'everyone' | 'private' | 'specified'>('everyone')
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([])
  
  // Options Data
  const [allDepts, setAllDepts] = useState<any[]>([])
  const [allPositions, setAllPositions] = useState<any[]>([])
  const [allEmployees, setAllEmployees] = useState<any[]>([])

  const fetchFolders = async () => {
    try {
      const res = await apiClient.get<any>('/api/knowledge/tree')
      if (res.success && res.data) {
        // Flatten the tree for the sidebar folder view
        const flatten = (nodes: any[]): any[] => {
          return nodes.reduce((acc, node) => {
            if (node.isFolder) {
              acc.push(node);
              if (node.children) acc.push(...flatten(node.children));
            }
            return acc;
          }, []);
        };
        setFolders(flatten(res.data))
      }
    } catch (err) { console.error(err) }
  }

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<any>('/api/knowledge/tree')
      if (res.success && res.data) {
        // Simple client-side filtering based on currentFolderId
        const findInTree = (nodes: any[], targetId: string | null): any[] => {
          if (!targetId) return nodes;
          for (const node of nodes) {
            if (node.id === targetId) return node.children || [];
            if (node.children) {
              const found = findInTree(node.children, targetId);
              if (found.length > 0 || node.id === targetId) return found;
            }
          }
          return [];
        };

        const currentItems = findInTree(res.data, currentFolderId);
        setItems(currentItems.filter(item => {
          if (!searchTerm) return true;
          return item.title.toLowerCase().includes(searchTerm.toLowerCase());
        }))
      }
    } catch (error: any) {
      showError(error.message || t('knowledge.load_failed'))
    } finally { setLoading(false) }
  }

  const fetchPermissionOptions = async () => {
    try {
      const [depts, pos, emps] = await Promise.all([
        apiClient.get<any>('/api/organization/departments'),
        apiClient.get<any>('/api/organization/positions'),
        apiClient.get<any>('/api/personnel/employees', { params: { pageSize: 1000 } })
      ]);
      if (depts.success) setAllDepts(depts.data);
      if (pos.success) setAllPositions(pos.data);
      if (emps.success) setAllEmployees(emps.data || emps.result?.data || []);
    } catch (err) { console.error('Failed to fetch permission options:', err); }
  }

  useEffect(() => { 
    fetchFolders();
    fetchPermissionOptions();
  }, [])
  useEffect(() => { fetchItems() }, [currentFolderId, searchTerm])

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    try {
      const permissions = [
        ...selectedDepartments.map(id => ({ targetType: 'DEPT', targetId: id })),
        ...selectedPositions.map(id => ({ targetType: 'POST', targetId: id })),
        ...selectedPersonnel.map(id => ({ targetType: 'USER', targetId: id }))
      ];

      const res = await apiClient.post<any>('/api/knowledge', {
        title: newFolderName,
        type: 'Folder',
        isFolder: true,
        parentId: currentFolderId,
        visibilityType: visibilityType,
        permissions: visibilityType === 'specified' ? permissions : []
      })
      if (res.success) {
        showSuccess(t('knowledge.folder_create_success'))
        setIsFolderModalOpen(false)
        setNewFolderName('')
        setVisibilityType('everyone')
        setSelectedDepartments([])
        setSelectedPersonnel([])
        fetchFolders()
        fetchItems()
      }
    } catch (err: any) { showError(err.message) }
  }

  const handleDelete = async (item: KnowledgeItem) => {
    const ok = await confirm({
      title: t('knowledge.item_delete'),
      content: t('knowledge.folder_delete_confirm'),
      type: 'danger'
    })

    if (ok) {
      try {
        const res = await apiClient.delete(`/api/knowledge/${item.id}`)
        if (res.success) {
          showSuccess(t('common.delete_success'))
          fetchFolders()
          fetchItems()
        }
      } catch (err: any) { showError(err.message) }
    }
  }

  const handleBatchUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    try {
      const data = new FormData()
      files.forEach((file, idx) => {
        data.append('file', file) // Backend implementation expects 'file' for single upload in loop? 
                                  // Wait, my controller expects 'file'. I should check if I support batch.
      })
      const targetId = uploadTargetFolder === 'current' ? (currentFolderId || '') : uploadTargetFolder
      data.append('parentId', targetId)
      data.append('visibilityType', visibilityType)

      // Note: Backend currently only supports single file in 'upload' endpoint in my implementation.
      // I'll update the frontend to upload them one by one for now or update backend.
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('parentId', targetId);
        await apiClient.upload<any>('/api/knowledge/upload', formData);
      }

      showSuccess(t('knowledge.upload_success'))
      setIsUploadModalOpen(false)
      setFiles([])
      fetchItems()
    } catch (err: any) {
      showError(err.message || t('knowledge.upload_error'))
    } finally { setUploading(false) }
  }

  const breadcrumbs = useMemo(() => {
    const list = []
    let currId = currentFolderId
    while (currId) {
      const folder = folders.find(f => f.id === currId)
      if (folder) {
        list.unshift(folder)
        currId = folder.parentId
      } else break
    }
    return list
  }, [currentFolderId, folders])

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {/* Sidebar - Traditional Explorer style */}
      <aside className="w-64 bg-slate-50/50 border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-transparent">
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={20} />
            {t('knowledge.title')}
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <button 
            onClick={() => setCurrentFolderId(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all mb-1",
              currentFolderId === null ? "bg-indigo-50 text-indigo-700 font-bold" : "hover:bg-slate-100 text-slate-600"
            )}
          >
            <Home size={16} />
            <span className="text-[13px]">{t('knowledge.sidebar_root')}</span>
          </button>
          
          <div className="mt-4 space-y-1">
            <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('knowledge.sidebar_folders')}</p>
            {folders.filter(f => !f.parentId).map(folder => (
              <FolderTreeItem 
                key={folder.id} 
                folder={folder} 
                allFolders={folders} 
                currentFolderId={currentFolderId} 
                onSelect={setCurrentFolderId}
                level={0}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Main Explorer */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Unified Search & Nav Bar */}
        <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 text-slate-400 overflow-hidden">
            <button 
              onClick={() => setCurrentFolderId(null)}
              className="p-1.5 hover:bg-slate-100 rounded-md transition-colors shrink-0"
            >
              <Home size={18} />
            </button>
            {breadcrumbs.length > 0 && <ChevronRight size={14} className="shrink-0" />}
            <div className="flex items-center gap-1 overflow-hidden">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id}>
                  <button 
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className={cn(
                      "px-2 py-1 rounded-md hover:bg-slate-100 transition-colors text-sm font-bold truncate max-w-[120px]",
                      idx === breadcrumbs.length - 1 ? "text-slate-900" : "text-slate-500"
                    )}
                  >
                    {crumb.title}
                  </button>
                  {idx < breadcrumbs.length - 1 && <ChevronRight size={14} className="shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder={t('knowledge.search')}
                  className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all w-48 md:w-64"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Unified NEW Button */}
              {hasPermission('knowledge:manage') && (
                <div className="relative" ref={newMenuRef}>
                  <button 
                    onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    <Plus size={16} />
                    {t('knowledge.btn_new')}
                  </button>
                  
                  <AnimatePresence>
                    {isNewMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 ring-1 ring-black/5"
                      >
                        <button 
                          onClick={() => { setIsNewMenuOpen(false); setIsUploadModalOpen(true); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-left"
                        >
                          <FileUp size={16} /> {t('knowledge.action_upload')}
                        </button>
                        <button 
                          onClick={() => { setIsNewMenuOpen(false); setIsFolderModalOpen(true); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-left"
                        >
                          <FolderPlus size={16} /> {t('knowledge.action_new_folder')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
          </div>
        </div>

        {/* Table List View */}
        <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
           <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
                <tr>
                  <th className="py-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest">{t('knowledge.table_name')}</th>
                  <th className="py-4 px-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest hidden md:table-cell">{t('knowledge.table_date')}</th>
                  <th className="py-4 font-bold text-slate-400 text-[11px] uppercase tracking-widest text-right">{t('knowledge.table_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={3} className="py-6"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                           <FileText size={48} />
                        </div>
                        <div className="space-y-1">
                           <p className="text-base font-black text-slate-900 uppercase">{t('knowledge.no_assets')}</p>
                           <p className="text-xs text-slate-400 font-bold max-w-[200px] leading-relaxed uppercase tracking-tighter">{t('knowledge.no_assets_desc')}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr 
                      key={item.id}
                      className="group hover:bg-indigo-50/30 transition-all duration-200 border-transparent hover:border-indigo-100"
                    >
                     <td className="py-4">
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                             item.isFolder ? "bg-amber-50 text-amber-500" : "bg-indigo-50 text-indigo-500"
                           )}>
                             {item.isFolder ? <Folder size={20} className="fill-current bg-opacity-10" /> : <FileText size={20} />}
                           </div>
                           <span 
                             onClick={() => item.isFolder && setCurrentFolderId(item.id)}
                             className={cn(
                               "text-sm font-bold truncate max-w-[200px] md:max-w-md",
                               item.isFolder ? "cursor-pointer hover:text-indigo-600 transition-colors" : "text-slate-700"
                             )}
                           >
                             {item.title}
                           </span>
                        </div>
                     </td>
                     <td className="py-4 px-4 text-xs font-bold text-slate-400 hidden md:table-cell whitespace-nowrap">
                       {item.createTime ? new Date(item.createTime).toLocaleDateString() : '-'}
                     </td>
                     <td className="py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                           {!item.isFolder ? (
                             <>
                               <a href={item.fileUrl} target="_blank" className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-indigo-600 transition-all" title={t('knowledge.item_view')}>
                                  <FileText size={18} />
                               </a>
                               <a href={item.fileUrl} download className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-emerald-500 transition-all" title={t('knowledge.item_download')}>
                                  <Download size={18} />
                               </a>
                             </>
                           ) : null}
                            <button className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                               <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item)}
                              className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-all" title={t('knowledge.item_delete')}
                            >
                               <Trash2 size={18} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
           </table>
        </div>
      </main>

      {/* Modern Batch Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FileUp size={20} /></div>
                      {t('knowledge.upload_title')}
                   </h3>
                   <button onClick={() => { setIsUploadModalOpen(false); setFiles([]); setFileNames({}); }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition-all">
                      <X size={20} />
                   </button>
                </div>

                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                   <div className="relative group">
                      <input 
                        type="file" multiple 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={e => {
                          const newFiles = Array.from(e.target.files || [])
                          setFiles(prev => [...prev, ...newFiles])
                          const newNames: Record<number, string> = {}
                          newFiles.forEach((file, i) => {
                            newNames[files.length + i] = file.name
                          })
                          setFileNames(prev => ({ ...prev, ...newNames }))
                        }}
                      />
                      <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-12 flex flex-col items-center justify-center gap-3 group-hover:border-indigo-500/50 transition-all">
                         <Upload size={32} className="text-slate-300 group-hover:text-indigo-500" />
                         <span className="text-sm font-bold text-slate-500">{t('knowledge.upload_files')}</span>
                      </div>
                   </div>

                   {files.length > 0 && (
                     <div className="space-y-2">
                        {files.map((file, idx) => (
                           <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <div className="flex items-center gap-3 truncate flex-1 min-w-0">
                                <File size={14} className="text-slate-400 shrink-0" />
                                <input
                                  type="text"
                                  value={fileNames[idx] || file.name}
                                  onChange={e => setFileNames(prev => ({ ...prev, [idx]: e.target.value }))}
                                  className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-700 truncate"
                                />
                             </div>
                             <button onClick={() => {
                               setFiles(files.filter((_, i) => i !== idx))
                               setFileNames(prev => {
                                 const next = { ...prev }
                                 delete next[idx]
                                 return next
                               })
                             }} className="p-1 hover:text-rose-500 text-slate-300 ml-2">
                                <X size={14} />
                             </button>
                           </div>
                        ))}
                     </div>
                   )}
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.upload_folder')}</label>
                       <select
                         value={uploadTargetFolder}
                         onChange={e => setUploadTargetFolder(e.target.value)}
                         className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                       >
                          <option value="current">{currentFolderId ? folders.find(f => f.id === currentFolderId)?.title || t('knowledge.sidebar_root') : t('knowledge.sidebar_root')}</option>
                          {folders.filter(f => f.is_folder).map(folder => (
                            <option key={folder.id} value={folder.id}>{folder.title}</option>
                          ))}
                       </select>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.permissions_title') || 'Visibility'}</label>
                       <div className="flex gap-2">
                          {['everyone', 'private', 'specified'].map((mode) => (
                             <button
                                key={mode}
                                type="button"
                                onClick={() => setVisibilityType(mode as any)}
                                className={cn(
                                   "flex-1 py-2 px-1 rounded-xl text-[10px] font-black uppercase transition-all border",
                                   visibilityType === mode ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-100 text-slate-400"
                                )}
                             >
                                {t(`knowledge.visibility_${mode}`) || mode}
                             </button>
                          ))}
                       </div>

                       {visibilityType === 'specified' && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500">{t('knowledge.perm_depts') || 'Departments'}</label>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-lg">
                                   {allDepts.map(dept => (
                                      <button
                                         key={dept.id}
                                         type="button"
                                         onClick={() => setSelectedDepartments(prev => prev.includes(dept.id) ? prev.filter(i => i !== dept.id) : [...prev, dept.id])}
                                         className={cn(
                                            "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                                            selectedDepartments.includes(dept.id) ? "bg-indigo-600 text-white" : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-200"
                                         )}
                                      >
                                         {dept.name}
                                      </button>
                                   ))}
                                </div>
                             </div>
                             
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500">{t('knowledge.perm_users') || 'Personnel'}</label>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-lg">
                                   {allEmployees.map(emp => (
                                      <button
                                         key={emp.id}
                                         type="button"
                                         onClick={() => setSelectedPersonnel(prev => prev.includes(emp.id) ? prev.filter(i => i !== emp.id) : [...prev, emp.id])}
                                         className={cn(
                                            "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                                            selectedPersonnel.includes(emp.id) ? "bg-emerald-600 text-white" : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-200"
                                         )}
                                      >
                                         {emp.name}
                                      </button>
                                   ))}
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                   <button onClick={() => { setIsUploadModalOpen(false); setFiles([]); setFileNames({}); }} className="px-6 py-2.5 text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest">{t('common.cancel')}</button>
                   <button 
                     disabled={uploading || files.length === 0}
                     onClick={handleBatchUpload}
                     className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-300 transition-all active:scale-95 flex items-center gap-2"
                   >
                     {uploading && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                     {t('knowledge.upload_submit')}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Folder Modal */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
             >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="text-base font-bold text-slate-900">{t('knowledge.folder_new')}</h3>
                   <button onClick={() => setIsFolderModalOpen(false)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition-all">
                      <X size={20} />
                   </button>
                </div>
                <form onSubmit={handleCreateFolder} className="p-8 space-y-6">
                   <div className="space-y-2">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.folder_name')}</label>
                       <input 
                         autoFocus
                         type="text" 
                         value={newFolderName}
                         onChange={e => setNewFolderName(e.target.value)}
                         placeholder={t('knowledge.folder_placeholder')}
                         className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                       />
                   </div>

                   <div className="space-y-4 pt-4 border-t border-slate-100">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('knowledge.permissions_title') || 'Visibility'}</label>
                      <div className="flex gap-2">
                         {['everyone', 'private', 'specified'].map((mode) => (
                            <button
                               key={mode}
                               type="button"
                               onClick={() => setVisibilityType(mode as any)}
                               className={cn(
                                  "flex-1 py-2 px-1 rounded-xl text-[10px] font-black uppercase transition-all border",
                                  visibilityType === mode ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-100 text-slate-400"
                               )}
                            >
                               {t(`knowledge.visibility_${mode}`) || mode}
                            </button>
                         ))}
                      </div>

                      {visibilityType === 'specified' && (
                         <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-slate-500">{t('knowledge.perm_depts') || 'Departments'}</label>
                               <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-lg">
                                  {allDepts.map(dept => (
                                     <button
                                        key={dept.id}
                                        type="button"
                                        onClick={() => setSelectedDepartments(prev => prev.includes(dept.id) ? prev.filter(i => i !== dept.id) : [...prev, dept.id])}
                                        className={cn(
                                           "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                                           selectedDepartments.includes(dept.id) ? "bg-indigo-600 text-white" : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-200"
                                        )}
                                     >
                                        {dept.name}
                                     </button>
                                  ))}
                               </div>
                            </div>
                            
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-slate-500">{t('knowledge.perm_users') || 'Personnel'}</label>
                               <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-lg">
                                  {allEmployees.map(emp => (
                                     <button
                                        key={emp.id}
                                        type="button"
                                        onClick={() => setSelectedPersonnel(prev => prev.includes(emp.id) ? prev.filter(i => i !== emp.id) : [...prev, emp.id])}
                                        className={cn(
                                           "px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                                           selectedPersonnel.includes(emp.id) ? "bg-emerald-600 text-white" : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-200"
                                        )}
                                     >
                                        {emp.name}
                                     </button>
                                  ))}
                               </div>
                            </div>
                         </div>
                      )}
                   </div>

                   <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setIsFolderModalOpen(false)} className="flex-1 py-3 text-xs font-black uppercase text-slate-400 tracking-widest">{t('common.cancel')}</button>
                      <button type="submit" disabled={!newFolderName.trim()} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">{t('common.save')}</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
