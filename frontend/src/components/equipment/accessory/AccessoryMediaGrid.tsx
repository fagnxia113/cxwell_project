import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon 
} from 'lucide-react';
import { AccessoryImage } from '../../../hooks/useAccessoryDetail';

interface AccessoryMediaGridProps {
  images: AccessoryImage[];
  uploading: boolean;
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function AccessoryMediaGrid({
  images,
  uploading,
  onUpload,
  onDelete,
  fileInputRef
}: AccessoryMediaGridProps) {
  const { t } = useTranslation();

  return (
    <div className="premium-card p-10 bg-white border-none shadow-sm rounded-[40px] animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
        <div className="space-y-1">
           <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
             <ImageIcon size={20} className="text-emerald-500" />
             {t('equipment.action.upload_img')}
           </h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none pl-8">Visual technical logs</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={(e) => e.target.files && onUpload(e.target.files)} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading} 
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-xl shadow-indigo-500/10 active:scale-95 disabled:opacity-30"
          >
            {uploading ? (
              <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={14} strokeWidth={4} />
            )}
            {uploading ? t('equipment.action.uploading') : t('equipment.action.upload_img')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
        {images.length > 0 ? (
          images.map((img) => (
            <div 
              key={img.id} 
              className="group aspect-square rounded-[32px] overflow-hidden border border-slate-100 relative shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer"
            >
              <img 
                src={img.image_url} 
                alt="technical_log" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                 <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(img.id); }} 
                  className="w-12 h-12 bg-white/20 text-white rounded-[18px] flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-xl border border-white/10 active:scale-90"
                 >
                    <Trash2 size={20} />
                 </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100 items-center grayscale opacity-30">
            <div className="p-8 bg-white rounded-[32px] shadow-inner mb-6">
               <ImageIcon size={64} className="text-slate-200" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em]">{t('equipment.empty.no_docs')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
