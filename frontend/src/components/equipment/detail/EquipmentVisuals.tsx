import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  PlusCircle, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  X
} from 'lucide-react';
import { EquipmentImage } from '../../../hooks/useEquipmentDetail';

interface EquipmentVisualsProps {
  images: EquipmentImage[];
  uploading: boolean;
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
}

export default function EquipmentVisuals({
  images,
  uploading,
  onUpload,
  onDelete
}: EquipmentVisualsProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="premium-card p-4 bg-white border-none shadow-sm rounded-[32px] overflow-hidden group/card animate-in fade-in duration-700">
      <div className="aspect-[4/5] rounded-[24px] overflow-hidden bg-slate-50 relative border border-slate-100 shadow-inner group/master">
        {images.length > 0 ? (
          <>
            <img 
              src={images[0].image_url} 
              alt="Master Asset" 
              className="w-full h-full object-cover group-hover/master:scale-110 transition-transform duration-1000" 
            />
            <button 
              onClick={() => onDelete(images[0].id)} 
              className="absolute top-4 right-4 bg-rose-500 text-white rounded-full p-2 opacity-0 group-hover/master:opacity-100 transition-opacity shadow-lg hover:bg-rose-600 active:scale-90"
            >
              <Trash2 size={16} />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 p-8">
            <div className="p-8 bg-white rounded-[32px] shadow-inner mb-4">
               <ImageIcon size={64} strokeWidth={1} className="text-slate-100" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{t('common.noData')}</p>
          </div>
        )}
        
        {/* Gallery Label */}
        <div className="absolute top-4 left-4">
          <div className="px-3 py-1 bg-slate-900/40 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
            {t('equipment.fields.technical_archives')}
          </div>
        </div>

        {/* Upload Overlay */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover/card:opacity-100 transition-opacity translate-y-2 group-hover/card:translate-y-0 duration-300">
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
            className="bg-indigo-600 text-white rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all outline-none"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload size={14} strokeWidth={3} />
            )}
            {uploading ? t('equipment.action.uploading') : t('equipment.action.upload_img')}
          </button>
        </div>
      </div>

      {/* Thumbnails Grid */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        {images.slice(1, 4).map((img) => (
          <div 
            key={img.id} 
            className="aspect-square rounded-2xl overflow-hidden border border-slate-100 relative group/thumb shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <img src={img.image_url} alt="technical_thumb" className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform" />
            <button 
              onClick={() => onDelete(img.id)} 
              className="absolute top-1 right-1 bg-rose-500 text-white rounded-lg p-1.5 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
            >
              <X size={10} strokeWidth={4} />
            </button>
          </div>
        ))}
        {images.length < 4 && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-2xl bg-slate-50 border-2 border-slate-100 border-dashed flex items-center justify-center text-slate-200 hover:text-indigo-400 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all group/add"
          >
            <PlusCircle size={24} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        )}
      </div>
    </div>
  );
}
