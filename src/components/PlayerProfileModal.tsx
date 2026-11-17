import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Award, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Shield, 
  Activity, 
  Scale, 
  Sparkles,
  ArrowRightLeft,
  Calendar,
  Home,
  ArrowRight,
  Edit3,
  Trash2
} from 'lucide-react';
import { ComputedPlayerStats, RankingConfig } from '../types';

interface PlayerProfileModalProps {
  player: ComputedPlayerStats | null;
  allPlayers: ComputedPlayerStats[];
  config: RankingConfig;
  isAdmin?: boolean;
  onClose: () => void;
  onSelectComparePlayer?: (player: ComputedPlayerStats) => void;
  onEditPlayer?: (player: ComputedPlayerStats) => void;
  onDeletePlayer?: (id: string, name: string) => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player,
  allPlayers,
  config,
  isAdmin = false,
  onClose,
  onEditPlayer,
  onDeletePlayer,
}) => {
  const [comparePlayerId, setComparePlayerId] = useState<string>('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!player) return null;

  const comparePlayer = allPlayers.find((p) => p.id === comparePlayerId);

  const getPositionLabel = (pos?: string) => {
    switch (pos) {
      case 'forward': return 'هێرشبەر';
      case 'midfield': return 'ناوەڕاست';
      case 'defender': return 'بەرگریکار';
      case 'goalkeeper': return 'گۆڵپارێز';
      default: return 'یاریزان';
    }
  };

  const isChampion = player.rank <= 2;
  const isDanger = player.tier === 'danger';

  // Win, Draw, Loss percentage calculation
  const total = Math.max(player.totalMatches, 1);
  const winPercent = Math.round((player.wins / total) * 100);
  const drawPercent = Math.round((player.draws / total) * 100);
  const lossPercent = Math.round((player.losses / total) * 100);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-6 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Sticky Header Bar with Clear "Back to Main Page" & Close Buttons */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80 shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            title="گەڕانەوە بۆ پەڕەی سەرەکی"
          >
            <Home className="w-4 h-4" />
            <span>گەڕانەوە بۆ پەڕەی سەرەکی</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              پرۆفایلی یاریزان
            </span>
            <button
              onClick={onClose}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 bg-slate-950/60 border border-slate-800 transition flex items-center gap-1 text-xs font-bold"
              title="داخستنی پەڕە"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">داخستن</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-5">

          {/* Modal Header */}
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0 border overflow-hidden ${
              isChampion
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : isDanger
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}>
              {player.avatar ? (
                <img 
                  src={player.avatar} 
                  alt={player.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                player.name.slice(0, 1)
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">{player.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isChampion
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  پلەی #{player.rank}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  {getPositionLabel(player.position)}
                </span>
                {player.status === 'injured' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                    🩹 تووشبوو بە پێکان (پارێزراو)
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-1">
                بەشدار لە {player.totalMatches} یاری • {player.totalPoints} خاڵی بەدەستهاتوو
              </p>
            </div>
          </div>

          {/* Performance High Level Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400 mb-1">ڕێتینگی دادپەروەرانە</div>
              <div className="text-2xl font-black text-emerald-400 font-display">{player.fairRating}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">لە ۱۰</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400 mb-1">نمرەی WPI</div>
              <div className="text-2xl font-black text-white font-display">{player.fairScore}</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">بە بۆنۆسی +{config.bonusFactor}</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400 mb-1">ڕێژەی بردنەوە</div>
              <div className="text-2xl font-black text-blue-400 font-display">{player.winRate}%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">خاڵی خاو</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-center">
              <div className="text-xs text-slate-400 mb-1">کۆی گشتی خاڵ</div>
              <div className="text-2xl font-black text-amber-400 font-display">{player.totalPoints}</div>
              <div className="text-[10px] text-amber-300 mt-0.5">بۆنۆسی یاری: +{player.matchBonus}</div>
            </div>

          </div>

          {/* Detailed Points & Match Bonus Calculation */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2.5">
              <Sparkles className="w-4 h-4" />
              <span>وردەکاری هەژمارکردنی خاڵ و پۆینتی یارییەکان (Points Formula):</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">خاڵی بردنەوە و یەکسان:</span>
                <span className="font-bold text-white text-sm">
                  ({player.wins} × ٣) + ({player.draws} × ١) = {player.basePoints} خاڵ
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.03]">
                <span className="text-amber-400/90 block text-[11px]">پۆینتی بەشداریکردنی یارییەکان:</span>
                <span className="font-bold text-amber-300 text-sm">
                  {player.totalMatches} یاری × {config.matchBonusPoints ?? 0.25} = +{player.matchBonus} خاڵ
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03]">
                <span className="text-emerald-400/90 block text-[11px]">کۆی گشتی خاڵی کۆتایی:</span>
                <span className="font-black text-emerald-300 text-sm">
                  {player.basePoints} + {player.matchBonus} = {player.totalPoints} خاڵ
                </span>
              </div>
            </div>
          </div>

          {/* Matches Breakdown Bar */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span>دابەشبوونی ئەنجامەکان:</span>
              <span>{player.totalMatches} یاری</span>
            </div>

            {/* Progress Multi-Bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-800">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${winPercent}%` }}
                title={`بردنەوە: ${player.wins} (${winPercent}%)`}
              />
              <div
                className="bg-slate-500 h-full transition-all"
                style={{ width: `${drawPercent}%` }}
                title={`یەکسانبوون: ${player.draws} (${drawPercent}%)`}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${lossPercent}%` }}
                title={`دۆڕان: ${player.losses} (${lossPercent}%)`}
              />
            </div>

            <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-slate-800/60">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {player.wins} بردنەوە ({winPercent}%)
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                {player.draws} یەکسان ({drawPercent}%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                {player.losses} دۆڕان ({lossPercent}%)
              </span>
            </div>
          </div>

          {/* Head-to-Head Comparison Tool */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                <span>بەراوردکردنی ڕاستەوخۆ لەگەڵ یاریزانێکی تر:</span>
              </div>

              <select
                value={comparePlayerId}
                onChange={(e) => setComparePlayerId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
              >
                <option value="">هەڵبژاردنی یاریزان...</option>
                {allPlayers
                  .filter((p) => p.id !== player.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.rank} {p.name}
                    </option>
                  ))}
              </select>
            </div>

            {comparePlayer ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-bold text-emerald-400">{player.name}</span>
                  <span className="text-slate-500 font-medium">بەشی بەراوردکاری</span>
                  <span className="font-bold text-blue-400">{comparePlayer.name}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-1 border-b border-slate-800/60">
                  <span className="font-bold text-white font-display">#{player.rank}</span>
                  <span className="text-slate-400">پلەی ڕیزبەندی</span>
                  <span className="font-bold text-white font-display">#{comparePlayer.rank}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-1 border-b border-slate-800/60">
                  <span className="font-bold text-emerald-400 font-display">{player.fairRating}</span>
                  <span className="text-slate-400">ڕێتینگ (Rating)</span>
                  <span className="font-bold text-blue-400 font-display">{comparePlayer.fairRating}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-1 border-b border-slate-800/60">
                  <span className="font-bold text-white font-display">{player.totalMatches}</span>
                  <span className="text-slate-400">کۆی یاری</span>
                  <span className="font-bold text-white font-display">{comparePlayer.totalMatches}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-1">
                  <span className="font-bold text-white font-display">{player.winRate}%</span>
                  <span className="text-slate-400">ڕێژەی سەرکەوتن</span>
                  <span className="font-bold text-white font-display">{comparePlayer.winRate}%</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">
                یاریزانێک لە لیستەکە هەڵبژێرە بۆ بەراوردکردنی ڕێتینگ و خاڵەکانیان پێکەوە
              </p>
            )}
          </div>

        </div>

        {/* Big Bottom Action Bar - Always Visible and Prominent */}
        <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-98 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>داخستن و گەڕانەوە</span>
          </button>

          {isAdmin && onEditPlayer && (
            <button
              onClick={() => {
                onClose();
                onEditPlayer(player);
              }}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition border border-slate-700 cursor-pointer"
              title="دەستکاری کردنی زانیارییەکان"
            >
              <Edit3 className="w-4 h-4 text-emerald-400" />
              <span>دەستکاری</span>
            </button>
          )}

          {isAdmin && onDeletePlayer && (
            <button
              onClick={() => {
                onClose();
                onDeletePlayer(player.id, player.name);
              }}
              className="py-3 px-4 rounded-2xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-rose-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition border border-rose-800/60 cursor-pointer"
              title="سڕینەوەی ئەم یاریزانە"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>سڕینەوە</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
