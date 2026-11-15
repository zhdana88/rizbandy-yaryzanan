import React, { useEffect } from 'react';
import { X, Sliders, RotateCcw, Check, Sparkles, Scale, Info, Home } from 'lucide-react';
import { RankingConfig, RankingSystem } from '../types';

interface FormulaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RankingConfig;
  setConfig: React.Dispatch<React.SetStateAction<RankingConfig>>;
  onResetToDefault: () => void;
}

export const FormulaConfigModal: React.FC<FormulaConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  setConfig,
  onResetToDefault,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSystemSelect = (system: RankingSystem) => {
    setConfig((prev) => ({ ...prev, system }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-6"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Actions Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            title="گەڕانەوە بۆ پەڕەی سەرەکی"
          >
            <Home className="w-4 h-4" />
            <span>گەڕانەوە بۆ پەڕەی سەرەکی</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 bg-slate-950/60 border border-slate-800 transition flex items-center gap-1 text-xs font-bold"
          >
            <X className="w-4 h-4" />
            <span>داخستن</span>
          </button>
        </div>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">ڕێکخستنی سیستەمی خاڵبەندی و ڕیزبەندی</h3>
            <p className="text-xs text-slate-400">
              دیاریکردنی هاوکێشەی دادپەروەرانە و پێوەرەکانی خولەکە
            </p>
          </div>
        </div>

        <div className="space-y-5 text-xs">
          
          {/* Ranking Algorithm Selection */}
          <div>
            <label className="block text-slate-300 font-bold mb-2">
              جۆری سیستەمی ریزبەندی:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              
              {/* Option 1: WPI */}
              <div
                onClick={() => handleSystemSelect('fair_wpi')}
                className={`cursor-pointer p-3 rounded-2xl border transition ${
                  config.system === 'fair_wpi'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-white mb-1">
                  <span>سیستەمی دادپەروەرانە (WPI)</span>
                  {config.system === 'fair_wpi' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  ڕێژەی خاڵەکان لەگەڵ کێشی متمانەی ژمارەی یاری
                </p>
              </div>

              {/* Option 2: Pure Win Rate */}
              <div
                onClick={() => handleSystemSelect('win_rate')}
                className={`cursor-pointer p-3 rounded-2xl border transition ${
                  config.system === 'win_rate'
                    ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-white mb-1">
                  <span>ڕێژەی بردنەوەی سادە (%)</span>
                  {config.system === 'win_rate' && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  تەنها ڕێژەی بردنەوە (کۆن وەک فایلی ئێکسڵ)
                </p>
              </div>

              {/* Option 3: Total Points */}
              <div
                onClick={() => handleSystemSelect('total_points')}
                className={`cursor-pointer p-3 rounded-2xl border transition ${
                  config.system === 'total_points'
                    ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-white mb-1">
                  <span>کۆی خاڵەکان (تەقلیدی)</span>
                  {config.system === 'total_points' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  کۆی خاڵی بردنەوە و یەکسان (وەک خولی گشتی تۆپی پێ)
                </p>
              </div>

              {/* Option 4: Bayesian Fair */}
              <div
                onClick={() => handleSystemSelect('bayesian')}
                className={`cursor-pointer p-3 rounded-2xl border transition ${
                  config.system === 'bayesian'
                    ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-white mb-1">
                  <span>تێکڕای بیزیایی (Bayesian)</span>
                  {config.system === 'bayesian' && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  ڕێژەی ئەگەری دەرئەنجامەکان بە پێوانەی بەشداری
                </p>
              </div>

            </div>
          </div>

          {/* Points Rules */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-emerald-400 font-bold mb-1">خاڵی بردنەوە</div>
              <div className="text-lg font-black text-white font-display">٣ خاڵ</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-slate-300 font-semibold mb-1">خاڵی یەکسان</div>
              <div className="text-lg font-black text-white font-display">١ خاڵ</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-rose-400 font-bold mb-1">خاڵی دۆڕان</div>
              <div className="text-lg font-black text-white font-display">٠ خاڵ</div>
            </div>
          </div>

          {/* Reset button */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                onResetToDefault();
              }}
              className="px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>گەڕاندنەوە بۆ داتای سەرەتایی (Reset)</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition"
            >
              جێبەجێکردن
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
