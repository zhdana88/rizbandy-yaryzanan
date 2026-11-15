import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  BarChart3, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  Code,
  Home
} from 'lucide-react';
import { ComputedPlayerStats, RankingConfig } from '../types';

interface LookerStudioSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: ComputedPlayerStats[];
  config: RankingConfig;
}

export const LookerStudioSyncModal: React.FC<LookerStudioSyncModalProps> = ({
  isOpen,
  onClose,
  players,
  config,
}) => {
  const [copiedData, setCopiedData] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

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

  // Generate TSV data for Google Sheets
  const generateGoogleSheetsTSV = () => {
    const headers = [
      'Player_ID',
      'Player_Name',
      'Avatar_URL',
      'Wins',
      'Draws',
      'Losses',
      'Total_Matches',
      'Total_Points',
      'Win_Rate_Percent',
      'Final_Score_WPI',
      'Rating_10',
      'Rank',
      'Position',
      'Status'
    ].join('\t');

    const rows = players.map((p) => {
      const avatarUrl = p.avatar || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${encodeURIComponent(p.name)}`;
      return [
        p.id,
        p.name,
        avatarUrl,
        p.wins,
        p.draws,
        p.losses,
        p.totalMatches,
        p.totalPoints,
        p.winRate,
        p.fairScore,
        p.fairRating,
        p.rank,
        p.position || 'midfield',
        p.status || 'active'
      ].join('\t');
    }).join('\n');

    return `${headers}\n${rows}`;
  };

  const handleCopyTSV = () => {
    navigator.clipboard.writeText(generateGoogleSheetsTSV());
    setCopiedData(true);
    setTimeout(() => setCopiedData(false), 2500);
  };

  const handleCopyFormula = (key: string, formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(key);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl my-6"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Actions Bar */}
        <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-800/80">
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

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              ڕێنمایی تەکنیکی بەستنەوە بە Google Looker Studio و Google Sheets
            </h3>
            <p className="text-xs text-slate-400">
              چۆنیەتی کۆپیکردنی داتا، ڕێکخستنی ستوونەکان و دروستکردنی داشبۆردی ڕاستەوخۆ
            </p>
          </div>
        </div>

        {/* 1-Click Copy Data Banner */}
        <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-950 border border-blue-500/30 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <span>داتای ئامادەکراوی ۲٤ یاریزانەکە بۆ Google Sheets</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              ئەم دوگمەیە دابگرە، پاشان لە Google Sheetsـدا ڕاستەوخۆ `Ctrl + V` بکە
            </p>
          </div>

          <button
            onClick={handleCopyTSV}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition shrink-0 shadow-md shadow-blue-600/30"
          >
            {copiedData ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>کۆپی کرا بۆ Google Sheets!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>کۆپیکردنی هەموو داتاکان (Copy for Sheets)</span>
              </>
            )}
          </button>
        </div>

        {/* 3 Step Guides */}
        <div className="space-y-4 text-xs font-sans">
          
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">١</span>
              <span>گام ۱: ڕێکخستنی Google Sheets (سەرچاوەی زانیارییەکان)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              شیتێک لە Google Sheets دروستبکە. ستوونەکانی خشتەکە پێکهاتوون لە:
              <code className="mx-1 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-emerald-300 text-[11px]">
                Player_ID | Player_Name | Avatar_URL | Wins | Draws | Losses
              </code>
            </p>

            {/* Formulas Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">هاوکێشەی خاڵەکان (Points):</span>
                  <code className="text-amber-400 font-mono text-[11px] font-bold">=(Wins * 3) + (Draws * 1)</code>
                </div>
                <button
                  onClick={() => handleCopyFormula('points', '=(D2*3)+(E2*1)')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  {copiedFormula === 'points' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">هاوکێشەی نمرەی WPI:</span>
                  <code className="text-emerald-400 font-mono text-[11px] font-bold">=((Points/(Matches*3))*100)+(Matches*0.3)</code>
                </div>
                <button
                  onClick={() => handleCopyFormula('wpi', '=((H2/(G2*3))*100)+(G2*0.3)')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  {copiedFormula === 'wpi' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-blue-400">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">٢</span>
              <span>گام ۲: بەستنەوە بە Google Looker Studio</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              سەردانی <a href="https://lookerstudio.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold">Google Looker Studio</a> بکە، 
              پڕۆژەیەکی نوێ (Blank Report) بکەرەوە و لە بەشی Data Source فایلی Google Sheetsـەکەت هەڵبژێرە.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">٣</span>
              <span>گام ۳: جێبەجێکردنی دیزاین، وێنە و ڕەنگەکان لە Looker Studio</span>
            </div>
            <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px] mr-2">
              <li><strong>ستونی وێنە (Avatar_URL):</strong> جۆری خانەکە (Field Type) بگۆڕە بۆ <span className="text-emerald-300">URL ➔ Image URL</span> تا وێنەی یاریزانەکان بە کوالێتی دەربکەون.</li>
              <li><strong>هایلایتی Top 1 & Top 2:</strong> لە ڕێگەی Scorecard لە سەرەوەی داشبۆرد بە ڕەنگی زێڕین و سەوز دیارییان بکە.</li>
              <li><strong>هێڵی سوور (ناوچەی مەترسی):</strong> لە بەشی Style ➔ Conditional Formatting مەرجێک دابنێ: <code className="bg-slate-900 px-1 py-0.5 rounded text-rose-300">Rank &gt; 22</code> بە پاشبنەمای سوور.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="text-slate-400">
            ئەپەکە بە تەواوی ئامادەکراوە بۆ هاوکاتکردن لەگەڵ هەموو سەکۆکانی گووگڵ
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            داخستن
          </button>
        </div>

      </div>
    </div>
  );
};
