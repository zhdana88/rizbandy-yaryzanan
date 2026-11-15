import React from 'react';
import { ShieldAlert, AlertTriangle, Flame, TrendingDown } from 'lucide-react';
import { ComputedPlayerStats } from '../types';
import { TapiroDoroTrophy } from './Trophies';

interface DangerZoneAlertProps {
  dangerPlayers: ComputedPlayerStats[];
  safePlayerScore?: number;
  onSelectPlayer: (player: ComputedPlayerStats) => void;
}

export const DangerZoneAlert: React.FC<DangerZoneAlertProps> = ({
  dangerPlayers,
  onSelectPlayer,
}) => {
  if (!dangerPlayers || dangerPlayers.length === 0) return null;

  // Identify the absolute last place player (lowest score / highest rank number)
  const maxRank = Math.max(...dangerPlayers.map((p) => p.rank));

  return (
    <div className="mb-8 rounded-3xl bg-gradient-to-br from-rose-50/90 via-white to-rose-50/50 border-2 border-rose-200 p-5 shadow-xs">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-rose-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-rose-950">
                ناوچەی مەترسی دابەزین (Relegation & Danger Zone)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 border border-rose-300">
                ۲ یاریزانی کۆتایی
              </span>
            </div>
            <p className="text-xs text-rose-700 font-medium mt-0.5">
              ئەم یاریزانانە لە خوارەوەی ڕیزبەندین و پێویستیان بە بردنەوەیە بۆ دەربازبوون لە دابەزین
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Danger Zone Player Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dangerPlayers.map((player) => {
          const isLastPlace = player.rank === maxRank;

          return (
            <div
              key={player.id}
              onClick={() => onSelectPlayer(player)}
              className={`group relative overflow-hidden rounded-3xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                isLastPlace 
                  ? 'bg-gradient-to-br from-amber-50/40 via-white to-rose-50/70 border-2 border-rose-300 hover:border-rose-400' 
                  : 'bg-white hover:bg-rose-50/40 border-2 border-rose-200 hover:border-rose-300'
              }`}
            >
              {/* Top row with Tag and Score */}
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-xl font-black text-xs border flex items-center gap-1 ${
                    isLastPlace 
                      ? 'bg-rose-600 text-white border-rose-700 shadow-2xs' 
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}>
                    <span>⚠️ پلەی #{player.rank}</span>
                  </span>
                  
                  {isLastPlace ? (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black flex items-center gap-1">
                      <span>خەڵاتی بەرازی زێڕین 🐗</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-rose-700 font-bold">
                      مەترسی دابەزین
                    </span>
                  )}
                </div>

                <div className="text-left bg-rose-50/80 px-2.5 py-1 rounded-xl border border-rose-200 shadow-2xs">
                  <span className="text-[10px] text-rose-700 font-bold block">نمرەی WPI</span>
                  <span className="text-lg font-black text-rose-900 font-display">
                    {player.fairScore}
                  </span>
                </div>
              </div>

              {/* Middle row: Avatar, Info, and Tapiro D'oro Trophy */}
              <div className="flex items-center justify-between gap-3 my-2 relative z-10">
                <div className="flex items-center gap-3.5 min-w-0">
                  
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-2xl p-0.5 shadow-2xs ${
                      isLastPlace 
                        ? 'bg-gradient-to-tr from-rose-400 via-amber-400 to-rose-300 ring-2 ring-rose-300' 
                        : 'bg-rose-100 border-2 border-rose-300'
                    }`}>
                      <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden font-black text-base text-rose-900">
                        {player.avatar ? (
                          <img 
                            src={player.avatar} 
                            alt={player.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span>{player.name.slice(0, 2)}</span>
                        )}
                      </div>
                    </div>

                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white font-black text-[10px] shadow border border-white">
                      🔻
                    </span>
                  </div>

                  {/* Player Name & Meta */}
                  <div className="min-w-0">
                    <h4 className="text-base font-black text-slate-900 group-hover:text-rose-900 transition truncate">
                      {player.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-0.5 flex-wrap">
                      <span className="font-bold text-slate-800">
                        {player.position === 'forward' ? 'هێرشبەر' : player.position === 'midfield' ? 'ناوەڕاست' : player.position === 'defender' ? 'بەرگریکار' : 'گۆڵپارێز'}
                      </span>
                      <span>•</span>
                      <span className="text-amber-700 font-extrabold">{player.totalPoints} خاڵ</span>
                      <span>•</span>
                      <span className="text-slate-700 font-bold">{player.winRate}% بردنەوە</span>
                    </div>
                  </div>

                </div>

                {/* Right Trophy Showcase for Last Place Player (Tapiro d'Oro) */}
                {isLastPlace ? (
                  <div 
                    title="خەڵاتی تەنزی ئامێزی بەرازی زێڕین بۆ پلەی کۆتایی هەفتە (Tapiro d'Oro Award)"
                    className="shrink-0 flex flex-col items-center justify-center bg-amber-100/70 hover:bg-amber-100 border border-amber-300 rounded-2xl px-2 py-1 shadow-2xs transition group-hover:scale-105"
                  >
                    <TapiroDoroTrophy size={46} />
                    <span className="text-[8.5px] font-black text-amber-950 mt-0.5 tracking-tight">
                      Tapiro d'Oro 🐗
                    </span>
                  </div>
                ) : (
                  <div className="shrink-0 flex flex-col items-center justify-center bg-rose-50 border border-rose-200 rounded-2xl px-2.5 py-1 text-center">
                    <AlertTriangle className="w-5 h-5 text-rose-500 mb-0.5 animate-bounce" />
                    <span className="text-[9px] font-black text-rose-700">مەترسی</span>
                  </div>
                )}
              </div>

              {/* Bottom row: Match stats */}
              <div className="grid grid-cols-4 gap-2 pt-3 mt-2 border-t border-rose-100 text-center text-xs relative z-10">
                <div className="bg-slate-50 rounded-xl py-1 px-1 border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 block text-[9px] font-bold">یاری</span>
                  <span className="font-black text-slate-800 font-display">{player.totalMatches}</span>
                </div>
                <div className="bg-emerald-50 rounded-xl py-1 px-1 border border-emerald-200 shadow-2xs">
                  <span className="text-emerald-800 block text-[9px] font-bold">بردنەوە</span>
                  <span className="font-black text-emerald-700 font-display">{player.wins}</span>
                </div>
                <div className="bg-slate-50 rounded-xl py-1 px-1 border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 block text-[9px] font-bold">یەکسان</span>
                  <span className="font-black text-slate-700 font-display">{player.draws}</span>
                </div>
                <div className="bg-rose-50 rounded-xl py-1 px-1 border border-rose-200 shadow-2xs">
                  <span className="text-rose-700 block text-[9px] font-bold">دۆڕان</span>
                  <span className="font-black text-rose-700 font-display">{player.losses}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

