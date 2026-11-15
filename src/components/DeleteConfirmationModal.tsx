import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  playerName: string;
  playerAvatar?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  playerName,
  playerAvatar,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center relative overflow-hidden animate-scale-up">
        
        {/* Background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Avatar */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-rose-500/40 overflow-hidden flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-rose-950/40">
              {playerAvatar ? (
                <img src={playerAvatar} alt={playerName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                playerName.slice(0, 2)
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-rose-600 text-white shadow-md">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-white">سڕینەوەی یاریزان</h3>
            <p className="text-sm font-bold text-rose-400 mt-0.5">{playerName}</p>
          </div>
        </div>

        {/* Confirmation text */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          ئایا دڵنیایت لە سڕینەوەی هەمیشەیی ئەم یاریزانە؟ هەموو تۆمار و ئامارەکانی لە خشتەی ڕیزبەندی، پێکهاتە و دارایی دەسڕێنەوە.
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>بەڵێ، بیسڕەوە</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            پەشیمانبوونەوە
          </button>
        </div>

      </div>
    </div>
  );
};
