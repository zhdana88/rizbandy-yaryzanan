import React, { useEffect } from 'react';
import { X, Trophy, Share2, Copy, Check, Printer, Sparkles, Home } from 'lucide-react';
import { ComputedPlayerStats, RankingConfig } from '../types';
import { formatLiveKurdishFullDate, getTodayISODate } from '../utils/dateHelper';

interface ShareSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: ComputedPlayerStats[];
  config: RankingConfig;
}

export const ShareSummaryModal: React.FC<ShareSummaryModalProps> = ({
  isOpen,
  onClose,
  players,
  config,
}) => {
  const [copied, setCopied] = React.useState(false);

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

  const topPlayers = players.slice(0, 10);

  const generateShareText = () => {
    const today = getTodayISODate();
    let text = `🏆 خشتەی ریزبەندی دادپەروەرانەی تۆپی پێ 🏆\n`;
    text += `سیستەمی WPI • بەروار: ${today} (${formatLiveKurdishFullDate(today)})\n\n`;
    
    players.forEach((p) => {
      const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `${p.rank}.`;
      text += `${medal} ${p.name} | ڕێتینگ: ${p.fairRating} (WPI: ${p.fairScore}) | ب: ${p.wins} ی: ${p.draws} د: ${p.losses}\n`;
    });

    text += `\n⚽ سیستەمی دادپەروەرانە بەپێی کارایی و پاداشتی بەشداری`;
    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
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
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80 no-print">
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

        <div className="flex items-center gap-3 mb-5 no-print">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">هاوبەشکردن و چاپکردنی ڕیزبەندی</h3>
            <p className="text-xs text-slate-400">
              کۆپیکردنی دەقی فەرمی بۆ گرووپەکانی ڤایبەر، واتسئاپ و تێلێگرام
            </p>
          </div>
        </div>

        {/* Preview Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-kurdish text-xs space-y-2 mb-5">
          <div className="text-center pb-2 border-b border-slate-800/80">
            <div className="text-sm font-bold text-amber-400 flex items-center justify-center gap-1.5">
              <Trophy className="w-4 h-4" />
              <span>خشتەی فەرمی ریزبەندی یاریزانان</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              سیستەمی دادپەروەرانەی WPI (+{config.bonusFactor})
            </div>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pt-1">
            {topPlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-900/60 border border-slate-800/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 w-5">#{p.rank}</span>
                  <span className="font-bold text-white">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    ({p.wins}ب - {p.draws}ی - {p.losses}د)
                  </span>
                  <span className="font-extrabold text-emerald-400 font-display">
                    {p.fairRating}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {players.length > 10 && (
            <div className="text-center text-[10px] text-slate-500 pt-1">
              + {players.length - 10} یاریزانی تر لە خشتەی تەواودا...
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-600/20"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>کۆپی کرا!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>کۆپیکردنی دەقی ڕیزبەندی</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>چاپکردن (Print)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
