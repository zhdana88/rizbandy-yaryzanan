import React, { useState } from 'react';
import { RotateCcw, AlertOctagon, X, Check, ShieldAlert } from 'lucide-react';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [confirmWord, setConfirmWord] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirmReset();
    setConfirmWord('');
    setError(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center relative overflow-hidden animate-scale-up">
        
        {/* Glowing warning ambient */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon Header */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">گەڕاندنەوە بۆ باری بنەڕەت (Reset to Default)</h3>
            <p className="text-xs font-semibold text-amber-400 mt-1">
              ئەم بەشە پارێزراوە و تایبەتە بە بەڕێوەبەر (Admin)
            </p>
          </div>
        </div>

        {/* Informational Message */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-xs text-slate-300 space-y-2 text-right">
          <p className="font-bold text-slate-200">
            ⚠️ ئایا دڵنیایت دەتەوێت داتاکان بگەڕێنیتەوە بۆ باری بنەڕەتی خولەکە؟
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
            <li>لیستی سەرەتایی یاریزانەکان دەگەڕێتەوە.</li>
            <li>ڕێکخستنەکانی هاوکێشەی WPI و ڕەنگەکان نوێ دەبنەوە.</li>
            <li>تۆمارەکانی پێشوو لە یادگەی مۆبایل و براوزەرەکە خاوێن دەکرێنەوە.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleConfirm}
            className="py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>بەڵێ، بگەڕێنەوە</span>
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
