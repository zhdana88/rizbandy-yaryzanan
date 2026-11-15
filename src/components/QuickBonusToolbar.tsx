import React, { useState } from 'react';
import { Sliders, Sparkles, Plus, Minus, Check, Scale, Save, CheckCircle } from 'lucide-react';
import { RankingConfig } from '../types';

interface QuickBonusToolbarProps {
  config: RankingConfig;
  setConfig: React.Dispatch<React.SetStateAction<RankingConfig>>;
}

export const QuickBonusToolbar: React.FC<QuickBonusToolbarProps> = ({
  config,
  setConfig,
}) => {
  const [isSavedConfirmed, setIsSavedConfirmed] = useState(false);

  const bonusPresets = [
    { value: 0.0, label: '0.0 (بێ بۆنۆس)' },
    { value: 0.05, label: '+0.05' },
    { value: 0.1, label: '+0.10' },
    { value: 0.15, label: '+0.15' },
    { value: 0.2, label: '+0.20' },
    { value: 0.25, label: '+0.25' },
    { value: 0.3, label: '+0.30' },
  ];

  const currentBonus = config.bonusFactor ?? 0.15;

  const handleSelectBonus = (val: number) => {
    setConfig((prev) => ({
      ...prev,
      bonusFactor: val,
      matchBonusPoints: val,
    }));
    setIsSavedConfirmed(true);
    setTimeout(() => setIsSavedConfirmed(false), 2000);
  };

  const handleAdjustStep = (delta: number) => {
    const nextVal = Math.max(0, Math.min(1.0, parseFloat((currentBonus + delta).toFixed(2))));
    handleSelectBonus(nextVal);
  };

  // 20 match example calculation
  const examplePoints = (20 * currentBonus).toFixed(1);

  return (
    <div className="mb-6 rounded-2xl bg-white border border-slate-200 p-3.5 sm:p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        
        {/* Left / Title section with live impact pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>دیاریکردنی خێرای نمرەی یارییەکان (Match Bonus Factor)</span>
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-extrabold border border-amber-300">
                ئێستا: +{currentBonus} خاڵ/یاری
              </span>
              {isSavedConfirmed && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center gap-1 animate-pulse">
                  <CheckCircle className="w-3 h-3" />
                  <span>پاشەکەوتکرا ✅</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 inline" />
              <span>کاریگەری لەسەر ۲۰ یاری: </span>
              <strong className="text-emerald-700 font-mono">+{examplePoints} خاڵی زیادە</strong>
              <span className="text-slate-400 mr-1">(ڕێژەی سەرکەوتن هێزی سەرەکییە)</span>
            </p>
          </div>
        </div>

        {/* Right / Quick Buttons & Step Controls */}
        <div className="flex items-center flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          
          {/* Minus button */}
          <button
            onClick={() => handleAdjustStep(-0.05)}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition shadow-xs"
            title="کەمکردنەوە بە بڕی 0.05-"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Quick preset buttons */}
          {bonusPresets.map((preset) => {
            const isSelected = Math.abs(currentBonus - preset.value) < 0.01;
            return (
              <button
                key={preset.value}
                onClick={() => handleSelectBonus(preset.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black scale-105'
                    : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                <span>{preset.label}</span>
              </button>
            );
          })}

          {/* Plus button */}
          <button
            onClick={() => handleAdjustStep(0.05)}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition shadow-xs"
            title="زیادکردن بە بڕی 0.05+"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>
    </div>
  );
};
