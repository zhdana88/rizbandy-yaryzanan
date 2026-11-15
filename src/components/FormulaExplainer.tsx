import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Scale, Sparkles, CheckCircle2 } from 'lucide-react';
import { RankingConfig, RankingSystem } from '../types';

interface FormulaExplainerProps {
  config: RankingConfig;
  setConfig: React.Dispatch<React.SetStateAction<RankingConfig>>;
}

export const FormulaExplainer: React.FC<FormulaExplainerProps> = ({
  config,
  setConfig,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSystemChange = (system: RankingSystem) => {
    setConfig((prev) => ({ ...prev, system }));
  };

  return (
    <div className="mb-6 rounded-2xl bg-white border border-slate-200 p-4 transition-all shadow-xs">
      
      {/* Header with quick system pills and expand button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900">
                سیستەمی ریزبەندی دادپەروەرانە (Fair Ranking Algorithm)
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                کێشی متمانەی ژمارەی یاری
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              هەژمارکردنی ڕێژەی خاڵەکان لەگەڵ کێشی متمانەی ژمارەی یاری
            </p>
          </div>
        </div>

        {/* System Selector Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => handleSystemChange('fair_wpi')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
              config.system === 'fair_wpi'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            دادپەروەرانە (WPI)
          </button>
          <button
            onClick={() => handleSystemChange('win_rate')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              config.system === 'win_rate'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ڕێژەی بردنەوە (سادە)
          </button>
          <button
            onClick={() => handleSystemChange('total_points')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              config.system === 'total_points'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            کۆی خاڵەکان
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-500 hover:text-slate-900 transition mr-1"
            title={isExpanded ? 'داخستنی ڕوونکردنەوە' : 'بینینی ڕوونکردنەوەی فورمووڵەکە'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Expanded formula explanation */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          
          {/* Formula Display */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <div className="flex items-center gap-1.5 text-emerald-800 font-black mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>فورمووڵی هاوکێشەکە (Mathematical Formula):</span>
            </div>
            
            <div className="bg-white p-2.5 rounded-lg font-mono text-[11px] text-emerald-800 font-bold border border-emerald-200 text-center select-all my-2 shadow-2xs">
              WPI = (BasePoints / (Matches × 3)) × 100 × (1 − 1 / √(Matches + 3))
            </div>

            <ul className="space-y-1.5 text-slate-600 mt-2 font-medium">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">خاڵی بنەڕەتی:</strong> بردنەوە ٣ خاڵ، یەکسان ١ خاڵ، دۆڕان ٠ خاڵ؛ دواتر ڕێژەی خاڵەکان لە کۆی خاڵی ممکن هەژمار دەکرێت.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">کێشی متمانە:</strong> کەمتر یاری کراوە کێشی کەمتر دەگرێت؛ بە زیادبوونی یارییەکان کێشەکە بەرەو ١ دەچێت.</span>
              </li>
            </ul>
          </div>

          {/* Real World Comparison & Bonus Selector */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-black text-amber-800 mb-2 block">
                کێشەی سیستەمی کۆن بەرامبەر چارەسەر:
              </span>
              
              <div className="space-y-2 text-[11px]">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                  <strong>کێشی ژمارەی یاری:</strong> نمرەی یاریزانانی کەم‌یاری بە کێشی متمانە ڕێکدەخرێت؛ نمرەی هەر یاریزانێک لەسەر بنەمای کارایی و ژمارەی یارییەکانییەتی.
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
