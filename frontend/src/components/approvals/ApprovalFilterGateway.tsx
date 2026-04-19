import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ApprovalFilter } from '../../hooks/useMyApprovals';

interface ApprovalFilterGatewayProps {
  filter: ApprovalFilter;
  setFilter: (filter: ApprovalFilter) => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  onSearchChange: () => void;
}

export default function ApprovalFilterGateway({
  filter,
  setFilter,
  searchKeyword,
  setSearchKeyword,
  onSearchChange
}: ApprovalFilterGatewayProps) {
  const { t } = useTranslation();

  const tabs: { key: ApprovalFilter; label: string }[] = [
    { key: 'all', label: t('common.all') },
    { key: 'pending', label: t('workflow.status.normal') },
    { key: 'approved', label: t('workflow.status.success') },
    { key: 'rejected', label: t('workflow.status.rejected') }
  ];

  return (
    <div className="premium-card p-5 bg-white/70 backdrop-blur-xl border-none flex flex-wrap items-center gap-6 shadow-sm ring-1 ring-slate-100 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex bg-slate-100/60 p-1.5 rounded-2xl gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilter(tab.key);
              onSearchChange();
            }}
            className={cn(
              "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300",
              filter === tab.key 
                ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-100" 
                : "text-slate-400 hover:text-slate-600 hover:bg-white/40"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-[300px] relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
          <Search size={18} strokeWidth={2.5} />
        </div>
        <input
          type="text"
          placeholder={t('workflow.placeholder.search_requests') || t('common.search')}
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value);
            onSearchChange();
          }}
          className="input-standard pl-12 !py-3 !rounded-2xl border-none bg-slate-100/40 focus:bg-white ring-1 ring-transparent focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm tracking-tight w-full shadow-inner"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-100 flex items-center gap-2 group-focus-within:text-indigo-200 transition-colors">
          <div className="w-px h-4 bg-slate-200" />
          <Filter size={16} />
        </div>
      </div>
    </div>
  );
}
