import React from 'react';
import { Trophy, Award, Flame, Activity, Users, ArrowUpRight } from 'lucide-react';
import { ComputedPlayerStats, RankingConfig } from '../types';

interface StatsBannerProps {
  players: ComputedPlayerStats[];
  config: RankingConfig;
  onSelectPlayer: (player: ComputedPlayerStats) => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  players,
  config,
  onSelectPlayer,
}) => {
  if (players.length === 0) return null;

  const champion = players[0];
  const runnerUp = players[1];
  const totalMatchesSum = players.reduce((sum, p) => sum + p.totalMatches, 0);
  const totalWinsSum = players.reduce((sum, p) => sum + p.wins, 0);
  const avgWinRate = (
    players.reduce((sum, p) => sum + p.winRate, 0) / players.length
  ).toFixed(1);
  const avgRating = (
    players.reduce((sum, p) => sum + p.fairRating, 0) / players.length
  ).toFixed(2);

  // Most active player
  const mostActive = [...players].sort((a, b) => b.totalMatches - a.totalMatches)[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6 select-none">
      
      {/* 1. Champion #1 Player Card */}
      <div 
        onClick={() => champion && onSelectPlayer(champion)}
        className="cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-50/80 to-white border-2 border-amber-300/80 p-4 transition-all duration-300 hover:border-amber-500 hover:shadow-lg group"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            پلەی یەکەم (باڵۆن دۆر)
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-2xs">
            #1
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-200 overflow-hidden shrink-0 border border-amber-300 shadow-xs">
            {champion?.avatar ? (
              <img src={champion.avatar} alt={champion.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-amber-900 text-sm">
                {champion?.name.slice(0, 2)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-slate-900 truncate group-hover:text-amber-700 transition">
              {champion?.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {champion?.wins} بردنەوە • {champion?.totalMatches} یاری
            </p>
          </div>

          <div className="text-left shrink-0">
            <div className="text-xl font-black text-amber-700 font-display">
              {champion?.fairRating}
            </div>
            <div className="text-[10px] text-amber-800/80 font-bold font-mono">
              WPI {champion?.fairScore}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Runner-up & Top Tier */}
      <div 
        onClick={() => runnerUp && onSelectPlayer(runnerUp)}
        className="cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-50/60 to-white border-2 border-emerald-300/80 p-4 transition-all duration-300 hover:border-emerald-500 hover:shadow-lg group"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-900 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
            <Award className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
            پلەی دووەم (ئەستێرەی زیوین)
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-200 text-emerald-900 border border-emerald-300 shadow-2xs">
            #2
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 overflow-hidden shrink-0 border border-emerald-300 shadow-xs">
            {runnerUp?.avatar ? (
              <img src={runnerUp.avatar} alt={runnerUp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-emerald-900 text-sm">
                {runnerUp?.name.slice(0, 2)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-slate-900 truncate group-hover:text-emerald-700 transition">
              {runnerUp?.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {runnerUp?.wins} بردنەوە • {runnerUp?.totalMatches} یاری
            </p>
          </div>

          <div className="text-left shrink-0">
            <div className="text-xl font-black text-emerald-700 font-display">
              {runnerUp?.fairRating}
            </div>
            <div className="text-[10px] text-emerald-800/80 font-bold font-mono">
              WPI {runnerUp?.fairScore}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Most Active Player */}
      <div 
        onClick={() => mostActive && onSelectPlayer(mostActive)}
        className="cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-b from-blue-50/60 to-white border-2 border-blue-200/80 p-4 transition-all duration-300 hover:border-blue-500 hover:shadow-lg group"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-blue-900 bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-300">
            <Flame className="w-3.5 h-3.5 text-blue-600 fill-blue-500" />
            چالاکترین یاریزان
          </span>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            {mostActive?.totalMatches} یاری
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 overflow-hidden shrink-0 border border-blue-300 shadow-xs">
            {mostActive?.avatar ? (
              <img src={mostActive.avatar} alt={mostActive.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-blue-900 text-sm">
                {mostActive?.name.slice(0, 2)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-slate-900 truncate group-hover:text-blue-700 transition">
              {mostActive?.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {mostActive?.totalPoints} خاڵ کۆکراوە
            </p>
          </div>

          <div className="text-left shrink-0">
            <div className="text-xl font-black text-blue-700 font-display">
              {mostActive?.winRate}%
            </div>
            <div className="text-[10px] text-blue-800/80 font-bold">
              ڕێژەی سەرکەوتن
            </div>
          </div>
        </div>
      </div>

      {/* 4. League Overview & Average */}
      <div className="rounded-2xl bg-gradient-to-b from-purple-50/60 to-white border-2 border-purple-200/80 p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-purple-900 bg-purple-100/90 px-2.5 py-0.5 rounded-full border border-purple-300">
            <Activity className="w-3.5 h-3.5 text-purple-600" />
            ئاماری گشتی خولەکە
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full">
            <Users className="w-3.5 h-3.5 text-purple-700" />
            {players.length} یاریزان
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-100">
          <div>
            <div className="text-lg font-black text-slate-900 font-display">{avgWinRate}%</div>
            <div className="text-[10px] text-slate-500 font-medium">تێکڕای بردنەوە</div>
          </div>
          <div className="text-left">
            <div className="text-lg font-black text-purple-800 font-display">{avgRating}</div>
            <div className="text-[10px] text-slate-500 font-medium">تێکڕای ڕێتینگ</div>
          </div>
        </div>
      </div>

    </div>
  );
};
