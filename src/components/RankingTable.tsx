import React from 'react';
import { 
  Trophy, 
  Award, 
  Flame, 
  AlertTriangle, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Plus, 
  TrendingUp, 
  Minus,
  Sparkles,
  User,
  Crown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ComputedPlayerStats, RankingConfig } from '../types';
import { BallonDorTrophy, SilverStarTrophy, BronzeMedalTrophy, TapiroDoroTrophy } from './Trophies';

interface RankingTableProps {
  players: ComputedPlayerStats[];
  totalPlayerCount: number;
  config: RankingConfig;
  isAdmin: boolean;
  onSelectPlayer: (player: ComputedPlayerStats) => void;
  onEditPlayer: (player: ComputedPlayerStats) => void;
  onDeletePlayer: (id: string, name: string) => void;
  onQuickUpdate: (id: string, type: 'win' | 'draw' | 'loss', delta: number) => void;
  onMovePlayer: (id: string, direction: 'up' | 'down') => void;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  players,
  totalPlayerCount,
  config,
  isAdmin,
  onSelectPlayer,
  onEditPlayer,
  onDeletePlayer,
  onQuickUpdate,
  onMovePlayer,
}) => {
  if (players.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center text-slate-400">
        <User className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <p className="text-base font-semibold text-slate-300">هیچ یاریزانێک نەدۆزرایەوە</p>
        <p className="text-xs text-slate-500 mt-1">تکایە گەڕانەکەت بگۆڕە یان یاریزانی نوێ زیاد بکە</p>
      </div>
    );
  }

  const maxRankNumber = Math.max(...players.map((p) => p.rank));

  const getPositionLabel = (pos?: string) => {
    switch (pos) {
      case 'forward': return 'هێرشبەر';
      case 'midfield': return 'ناوەڕاست';
      case 'defender': return 'بەرگریکار';
      case 'goalkeeper': return 'گۆڵپارێز';
      default: return 'یاریزان';
    }
  };

  const getTierBadge = (player: ComputedPlayerStats) => {
    const isFirst = player.rank === 1;
    const isSecond = player.rank === 2;
    const isThird = player.rank === 3;
    const isLastPlace = player.rank === maxRankNumber && players.length >= 4;

    if (isFirst) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-200 to-yellow-100 text-amber-900 border border-amber-400 shadow-xs">
          <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
          باڵۆن دۆر 🏆
        </span>
      );
    }
    if (isSecond) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-slate-200 to-slate-100 text-slate-800 border border-slate-300 shadow-xs">
          <span>🥈</span>
          ئەستێرەی زیوین
        </span>
      );
    }
    if (isThird) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <span>🥉</span>
          پلەی سێیەم
        </span>
      );
    }
    if (isLastPlace) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-orange-200 to-amber-100 text-orange-950 border border-orange-400 shadow-xs animate-pulse">
          <span>🐗</span>
          بەرازی زێڕین
        </span>
      );
    }
    if (player.tier === 'danger') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          مەترسی
        </span>
      );
    }
    if (player.tier === 'top' || player.rank <= 6) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
          <Award className="w-3 h-3 text-emerald-600" />
          پێشەنگ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        ناوەڕاست
      </span>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md transition-all mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-50 text-slate-700 text-xs font-bold border-b-2 border-slate-200 uppercase tracking-wider select-none divide-x divide-x-reverse divide-slate-200">
              <th className="py-3.5 px-3 text-center w-16">پلە</th>
              <th className="py-3.5 px-4 min-w-[230px] bg-slate-100/90 text-slate-900 border-x border-slate-200 font-extrabold">ناوی یاریزان و خەڵاتەکان</th>
              <th className="py-3.5 px-2 text-center w-14 text-emerald-700 font-bold" title="بردنەوە (٣ خاڵ)">ب (W)</th>
              <th className="py-3.5 px-2 text-center w-14 text-slate-600 font-bold" title="یەکسانبوون (١ خاڵ)">ی (D)</th>
              <th className="py-3.5 px-2 text-center w-14 text-rose-600 font-bold" title="دۆڕان (٠ خاڵ)">د (L)</th>
              <th className="py-3.5 px-2 text-center min-w-[75px] text-slate-700" title="کۆی گشتی یارییەکان (لەگەڵ پۆینتی بۆنۆسی بەشداری)">
                <span>یارییەکان</span>
                <span className="block text-[10px] text-amber-600 font-bold">+{config.matchBonusPoints ?? 0.1} خ/یاری</span>
              </th>
              <th className="py-3.5 px-2 text-center min-w-[75px] text-amber-700 font-black bg-amber-50/60 border-x border-amber-100" title="کۆی گشتی خاڵەکان (خاڵی بنەڕەت + پۆینتی بەشداریکردنی یارییەکان)">
                <span>کۆی خاڵ</span>
              </th>
              <th className="py-3.5 px-3 text-center min-w-[100px] text-slate-700" title="ڕێژەی سەرکەوتن بەپێی خاڵی بەدەستهاتوو">
                ڕێژەی بردنەوە
              </th>
              <th className="py-3.5 px-3 text-center min-w-[110px] bg-emerald-50 text-emerald-800 font-black border-x border-emerald-200" title="نمرەی WPI (ڕێژەی سەرکەوتن + بۆنۆسی ئەزموون و یارییەکان)">
                نمرەی دادپەروەرانە
              </th>
              <th className="py-3.5 px-3 text-center min-w-[120px] text-slate-700">ڕێتینگ (لە ١٠)</th>
              <th className="py-3.5 px-3 text-center min-w-[125px]">خەڵات و ئاست</th>
              {isAdmin && <th className="py-3.5 px-3 text-center min-w-[190px]">ڕیزبەندی و دەستکاری خێرا</th>}
            </tr>
          </thead>

          {/* Table Body with explicit high-contrast horizontal dividers */}
          <tbody className="divide-y-2 divide-slate-200 text-xs sm:text-sm">
            {players.map((player, idx) => {
              const isFirst = player.rank === 1;
              const isSecond = player.rank === 2;
              const isThird = player.rank === 3;
              const isElite = player.rank >= 4 && player.rank <= 6;
              const isLastPlace = player.rank === maxRankNumber && players.length >= 4;
              const isDanger = !isLastPlace && player.rank >= players.length - 2 && players.length >= 4;

              // Compute distinct row background and border styles
              const rowClass = isFirst
                ? 'bg-amber-50/90 hover:bg-amber-100/80 border-b-2 border-amber-300'
                : isSecond
                ? 'bg-emerald-50/70 hover:bg-emerald-100/80 border-b-2 border-emerald-300'
                : isThird
                ? 'bg-amber-50/40 hover:bg-amber-100/60 border-b-2 border-amber-200'
                : isElite
                ? 'bg-teal-50/40 hover:bg-teal-100/60 border-b border-teal-200'
                : isLastPlace
                ? 'bg-orange-50/80 hover:bg-orange-100/90 border-b-2 border-orange-400'
                : isDanger
                ? 'bg-rose-50/70 hover:bg-rose-100/80 border-b-2 border-rose-300'
                : idx % 2 === 1
                ? 'bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-300'
                : 'bg-white hover:bg-slate-50/90 border-b border-slate-300';

              return (
                <tr
                  key={player.id}
                  className={`group transition-colors duration-150 divide-x divide-x-reverse divide-slate-200/90 ${rowClass}`}
                >
                  
                  {/* Rank Number & Mini Trophy Display */}
                  <td className="py-3.5 px-2 text-center font-display font-bold">
                    {isFirst ? (
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <BallonDorTrophy size={26} glow={false} />
                        <span className="text-[10px] font-black text-amber-800">#1</span>
                      </div>
                    ) : isSecond ? (
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <SilverStarTrophy size={24} glow={false} />
                        <span className="text-[10px] font-black text-slate-700">#2</span>
                      </div>
                    ) : isThird ? (
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <BronzeMedalTrophy size={22} glow={false} />
                        <span className="text-[10px] font-black text-amber-800">#3</span>
                      </div>
                    ) : isElite ? (
                      <div className="flex flex-col items-center justify-center">
                        <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 border border-teal-300 flex items-center justify-center text-xs font-black shadow-2xs">
                          {player.rank}
                        </span>
                      </div>
                    ) : isLastPlace ? (
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <TapiroDoroTrophy size={26} glow={false} />
                        <span className="text-[10px] font-black text-orange-900">#{player.rank}</span>
                      </div>
                    ) : isDanger ? (
                      <div className="flex flex-col items-center justify-center">
                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center justify-center text-xs font-black shadow-2xs">
                          {player.rank}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-700">
                        #{player.rank}
                      </span>
                    )}
                  </td>

                  {/* Player Name, Avatar & Custom Award Pill */}
                  <td className="py-3 px-3.5 bg-white/95 border-x-2 border-slate-200">
                    <div 
                      onClick={() => onSelectPlayer(player)}
                      className="cursor-pointer flex items-center gap-3 group-hover:translate-x-[-2px] transition-transform"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden shadow-xs relative ${
                        isFirst
                          ? 'bg-amber-100 text-amber-800 border-2 border-amber-400 ring-2 ring-amber-200'
                          : isSecond
                          ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-400'
                          : isLastPlace
                          ? 'bg-orange-100 text-orange-800 border-2 border-orange-400 ring-2 ring-orange-200'
                          : isDanger
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
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

                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-black">{player.name}</span>
                          
                          {/* Award Badges next to name */}
                          {isFirst && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold flex items-center gap-0.5">
                              🏆 باڵۆن دۆر
                            </span>
                          )}
                          {isSecond && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-800 border border-slate-300 font-extrabold flex items-center gap-0.5">
                              🥈 ئەستێرەی زیوین
                            </span>
                          )}
                          {isLastPlace && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-orange-100 text-orange-900 border border-orange-300 font-extrabold flex items-center gap-0.5">
                              🐗 بەرازی زێڕین
                            </span>
                          )}

                          {player.status === 'injured' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-semibold" title="یاریزانی تووشبوو بە پێکان - پارێزراو لە دابەزین">
                              🩹 پێکان
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span>{getPositionLabel(player.position)}</span>
                          {player.form && player.form.length > 0 && (
                            <span className="flex items-center gap-0.5 mr-1.5">
                              {player.form.slice(-3).map((f, i) => (
                                <span
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-slate-400' : 'bg-rose-500'
                                  }`}
                                />
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Wins */}
                  <td className="py-3 px-2 text-center font-bold text-emerald-700 bg-emerald-50/20">
                    {player.wins}
                  </td>

                  {/* Draws */}
                  <td className="py-3 px-2 text-center font-semibold text-slate-600">
                    {player.draws}
                  </td>

                  {/* Losses */}
                  <td className="py-3 px-2 text-center font-semibold text-rose-600">
                    {player.losses}
                  </td>

                  {/* Total Matches with bonus badge */}
                  <td className="py-3 px-2 text-center font-medium text-slate-700">
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-bold text-slate-900 font-display text-sm">{player.totalMatches}</span>
                      <span 
                        className="text-[10px] text-amber-700 font-mono font-bold px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 mt-0.5"
                        title={`پۆینتی بۆنۆسی یارییەکان: ${player.totalMatches} یاری × ${config.matchBonusPoints ?? 0.1} = +${player.matchBonus} خاڵ`}
                      >
                        +{player.matchBonus}خ
                      </span>
                    </div>
                  </td>

                  {/* Total Points with breakdown */}
                  <td className="py-3 px-2 text-center bg-amber-50/30 border-x border-amber-100">
                    <div className="flex flex-col items-center justify-center" title={`خاڵی بنەڕەتی بردنەوە/یەکسان: ${player.basePoints} + پۆینتی بەشداری یارییەکان: +${player.matchBonus}`}>
                      <span className="font-black text-amber-700 font-display text-base leading-none">
                        {player.totalPoints}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                        ({player.basePoints}+{player.matchBonus})
                      </span>
                    </div>
                  </td>

                  {/* Raw Win Rate % */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-semibold text-slate-700 font-display">
                      {player.winRate}%
                    </span>
                  </td>

                  {/* Fair Score (WPI) */}
                  <td className="py-3 px-3 text-center bg-emerald-50/60 border-x border-emerald-200">
                    <span className="font-black text-emerald-800 font-display text-sm">
                      {player.fairScore}
                    </span>
                  </td>

                  {/* Fair Rating / 10 with visual progress bar */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            player.fairRating >= 7
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                              : player.fairRating >= 5
                              ? 'bg-gradient-to-r from-blue-600 to-emerald-500'
                              : player.fairRating >= 3.5
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                              : 'bg-gradient-to-r from-rose-600 to-red-500'
                          }`}
                          style={{ width: `${Math.min(player.fairRating * 10, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800 font-display text-xs w-7 shrink-0 text-left">
                        {player.fairRating}
                      </span>
                    </div>
                  </td>

                  {/* Tier & Award Badge */}
                  <td className="py-3 px-3 text-center">
                    {getTierBadge(player)}
                  </td>

                  {/* Admin Quick Actions */}
                  {isAdmin && (
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">

                        {/* Manual leaderboard ordering */}
                        <button
                          onClick={() => onMovePlayer(player.id, 'up')}
                          disabled={player.rank === 1}
                          className="p-1 rounded text-slate-600 hover:text-emerald-800 hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="بەرزکردنەوەی پلەی یاریزان"
                          aria-label={`Move ${player.name} up in the leaderboard`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onMovePlayer(player.id, 'down')}
                          disabled={player.rank === totalPlayerCount}
                          className="p-1 rounded text-slate-600 hover:text-emerald-800 hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="نزمکردنەوەی پلەی یاریزان"
                          aria-label={`Move ${player.name} down in the leaderboard`}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        
                        {/* Quick +1 Win */}
                        <button
                          onClick={() => onQuickUpdate(player.id, 'win', 1)}
                          className="p-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] font-bold border border-emerald-300 transition"
                          title="زیادکردنی ۱ بردنەوە"
                        >
                          +ب
                        </button>

                        {/* Quick +1 Draw */}
                        <button
                          onClick={() => onQuickUpdate(player.id, 'draw', 1)}
                          className="p-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-bold border border-slate-300 transition"
                          title="زیادکردنی ۱ یەکسانبوون"
                        >
                          +ی
                        </button>

                        {/* Quick +1 Loss */}
                        <button
                          onClick={() => onQuickUpdate(player.id, 'loss', 1)}
                          className="p-1 rounded bg-rose-100 text-rose-800 hover:bg-rose-200 text-[10px] font-bold border border-rose-300 transition"
                          title="زیادکردنی ۱ دۆڕان"
                        >
                          +د
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => onEditPlayer(player)}
                          className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="دەستکاری کردنی زانیاری یاریزان"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeletePlayer(player.id, player.name)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="سڕینەوەی یاریزان"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>
                  )}

                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
      
      {/* Table Footer with quick notes & awards legend */}
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-4 font-medium flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
            <span className="font-bold text-slate-800">پلەی ۱: باڵۆن دۆر (Ballon d'Or)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-xs" />
            <span className="font-bold text-slate-800">پلەی ۲: ئەستێرەی زیوین</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-xs" />
            <span className="font-bold text-slate-800">دواین پلە: خەڵاتی بەرازی زێڕین (Tapiro d'Oro)</span>
          </span>
        </div>
        <div className="text-slate-500">
          کلیک لەسەر هەر یاریزانێک بکە بۆ بینینی تەواوی پرۆفایل و ئامارەکانی
        </div>
      </div>

    </div>
  );
};
