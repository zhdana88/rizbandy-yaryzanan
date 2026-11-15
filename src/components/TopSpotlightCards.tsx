import React from 'react';
import { Trophy, Crown, Sparkles, TrendingUp, ShieldCheck, Award } from 'lucide-react';
import { ComputedPlayerStats } from '../types';
import { BallonDorTrophy, SilverStarTrophy } from './Trophies';

interface TopSpotlightCardsProps {
  topPlayers: ComputedPlayerStats[];
  onSelectPlayer: (player: ComputedPlayerStats) => void;
}

export const TopSpotlightCards: React.FC<TopSpotlightCardsProps> = ({
  topPlayers,
  onSelectPlayer,
}) => {
  const champ1 = topPlayers[0];
  const champ2 = topPlayers[1];

  if (!champ1) return null;

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">
                پێشەنگەکانی هەفتە (Top 1 & Top 2 Spotlight)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                لوتکەی خشتە
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              ئەستێرە و یاریزانە باڵاکان بەپێی نمرەی کواڵێتی و بۆنۆسی WPI
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 2 Top Players */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Top 1 Champion Card - Gold Ballon d'Or Edition */}
        {champ1 && (
          <div 
            onClick={() => onSelectPlayer(champ1)}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/60 border-2 border-amber-300 hover:border-amber-400 p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
          >
            {/* Ambient Gold Glow Corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/15 rounded-full blur-2xl pointer-events-none" />

            {/* Top Row: Crown Tag & WPI Score */}
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-xs">
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                  <span>تۆپ ٠١ • ئەستێرەی زێڕین</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>ڕیزبەندی #1</span>
                </span>
              </div>

              <div className="text-left bg-white px-3 py-1 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] text-amber-700 font-bold block">نمرەی WPI</span>
                <span className="text-xl font-black text-amber-800 font-display">
                  {champ1.fairScore}
                </span>
              </div>
            </div>

            {/* Main Player Info with Ballon d'Or Trophy Showcase */}
            <div className="flex items-center justify-between gap-3 my-3 relative z-10">
              <div className="flex items-center gap-3.5 min-w-0">
                
                {/* Player Avatar */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 p-0.5 shadow-sm">
                    <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                      {champ1.avatar ? (
                        <img 
                          src={champ1.avatar} 
                          alt={champ1.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-2xl font-black text-amber-600">{champ1.name.slice(0, 1)}</span>
                      )}
                    </div>
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-sm border border-white">
                    🥇
                  </span>
                </div>

                {/* Player Details */}
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-800 transition truncate">
                    {champ1.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-0.5 flex-wrap">
                    <span className="font-bold text-slate-800">
                      {champ1.position === 'forward' ? 'هێرشبەر' : champ1.position === 'midfield' ? 'ناوەڕاست' : champ1.position === 'defender' ? 'بەرگریکار' : 'گۆڵپارێز'}
                    </span>
                    <span>•</span>
                    <span className="text-amber-700 font-extrabold">{champ1.totalPoints} خاڵ</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-extrabold">{champ1.winRate}% بردنەوە</span>
                  </div>
                </div>

              </div>

              {/* Dedicated Ballon d'Or Trophy Display */}
              <div className="shrink-0 flex flex-col items-center justify-center bg-amber-100/60 hover:bg-amber-100/90 border border-amber-300/80 rounded-2xl px-2.5 py-1.5 shadow-2xs transition group-hover:scale-105">
                <BallonDorTrophy size={48} />
                <span className="text-[9px] font-black text-amber-900 mt-0.5 tracking-tight flex items-center gap-0.5">
                  <Award className="w-2.5 h-2.5 text-amber-600" />
                  <span>باڵۆن دۆر ⚽</span>
                </span>
              </div>
            </div>

            {/* 4 Stats Pills */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-amber-200/80 text-center relative z-10">
              <div className="bg-white rounded-xl py-1.5 px-1 border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-bold">یارییەکان</div>
                <div className="text-xs font-black text-slate-900 font-display">{champ1.totalMatches}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl py-1.5 px-1 border border-emerald-200 shadow-2xs">
                <div className="text-[10px] text-emerald-800 font-bold">بردنەوە</div>
                <div className="text-xs font-black text-emerald-700 font-display">{champ1.wins}</div>
              </div>
              <div className="bg-white rounded-xl py-1.5 px-1 border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-bold">یەکسان</div>
                <div className="text-xs font-black text-slate-700 font-display">{champ1.draws}</div>
              </div>
              <div className="bg-rose-50 rounded-xl py-1.5 px-1 border border-rose-200 shadow-2xs">
                <div className="text-[10px] text-rose-700 font-bold">دۆڕان</div>
                <div className="text-xs font-black text-rose-700 font-display">{champ1.losses}</div>
              </div>
            </div>

          </div>
        )}

        {/* Top 2 Runner-Up Card - Silver Star Edition */}
        {champ2 && (
          <div 
            onClick={() => onSelectPlayer(champ2)}
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 border-2 border-emerald-300 hover:border-emerald-400 p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
          >
            {/* Ambient Emerald Glow Corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-300/15 rounded-full blur-2xl pointer-events-none" />

            {/* Top Row: Silver Tag & WPI Score */}
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-xs shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>تۆپ ٠٢ • ئەستێرەی زیوین</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>ڕیزبەندی #2</span>
                </span>
              </div>

              <div className="text-left bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[10px] text-emerald-700 font-bold block">نمرەی WPI</span>
                <span className="text-xl font-black text-emerald-800 font-display">
                  {champ2.fairScore}
                </span>
              </div>
            </div>

            {/* Main Player Info */}
            <div className="flex items-center justify-between gap-3 my-3 relative z-10">
              <div className="flex items-center gap-3.5 min-w-0">
                
                {/* Player Avatar */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 p-0.5 shadow-sm">
                    <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                      {champ2.avatar ? (
                        <img 
                          src={champ2.avatar} 
                          alt={champ2.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-2xl font-black text-emerald-600">{champ2.name.slice(0, 1)}</span>
                      )}
                    </div>
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-800 font-black text-xs shadow-sm border border-white">
                    🥈
                  </span>
                </div>

                {/* Player Details */}
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-800 transition truncate">
                    {champ2.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-0.5 flex-wrap">
                    <span className="font-bold text-slate-800">
                      {champ2.position === 'forward' ? 'هێرشبەر' : champ2.position === 'midfield' ? 'ناوەڕاست' : champ2.position === 'defender' ? 'بەرگریکار' : 'گۆڵپارێز'}
                    </span>
                    <span>•</span>
                    <span className="text-amber-700 font-extrabold">{champ2.totalPoints} خاڵ</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-extrabold">{champ2.winRate}% بردنەوە</span>
                  </div>
                </div>

              </div>

              {/* Silver Star Trophy Showcase */}
              <div className="shrink-0 flex flex-col items-center justify-center bg-emerald-100/60 hover:bg-emerald-100/90 border border-emerald-300/80 rounded-2xl px-2.5 py-1.5 shadow-2xs transition group-hover:scale-105">
                <SilverStarTrophy size={46} />
                <span className="text-[9px] font-black text-emerald-900 mt-0.5 tracking-tight flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                  <span>ئەستێرەی زیوین ⭐</span>
                </span>
              </div>
            </div>

            {/* 4 Stats Pills */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-emerald-200/80 text-center relative z-10">
              <div className="bg-white rounded-xl py-1.5 px-1 border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-bold">یارییەکان</div>
                <div className="text-xs font-black text-slate-900 font-display">{champ2.totalMatches}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl py-1.5 px-1 border border-emerald-200 shadow-2xs">
                <div className="text-[10px] text-emerald-800 font-bold">بردنەوە</div>
                <div className="text-xs font-black text-emerald-700 font-display">{champ2.wins}</div>
              </div>
              <div className="bg-white rounded-xl py-1.5 px-1 border border-slate-200 shadow-2xs">
                <div className="text-[10px] text-slate-500 font-bold">یەکسان</div>
                <div className="text-xs font-black text-slate-700 font-display">{champ2.draws}</div>
              </div>
              <div className="bg-rose-50 rounded-xl py-1.5 px-1 border border-rose-200 shadow-2xs">
                <div className="text-[10px] text-rose-700 font-bold">دۆڕان</div>
                <div className="text-xs font-black text-rose-700 font-display">{champ2.losses}</div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

