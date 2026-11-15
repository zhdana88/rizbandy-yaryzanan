import React from 'react';
import { 
  Trophy, 
  Award, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Flame, 
  Check, 
  Activity,
  Plus
} from 'lucide-react';
import { ComputedPlayerStats, RankingConfig } from '../types';

interface PlayerCardGridProps {
  players: ComputedPlayerStats[];
  config: RankingConfig;
  isAdmin: boolean;
  onSelectPlayer: (player: ComputedPlayerStats) => void;
  onEditPlayer: (player: ComputedPlayerStats) => void;
  onDeletePlayer: (id: string, name: string) => void;
  onQuickUpdate: (id: string, type: 'win' | 'draw' | 'loss', delta: number) => void;
}

export const PlayerCardGrid: React.FC<PlayerCardGridProps> = ({
  players,
  config,
  isAdmin,
  onSelectPlayer,
  onEditPlayer,
  onDeletePlayer,
  onQuickUpdate,
}) => {
  const getPositionLabel = (pos?: string) => {
    switch (pos) {
      case 'forward': return 'هێرشبەر';
      case 'midfield': return 'ناوەڕاست';
      case 'defender': return 'بەرگریکار';
      case 'goalkeeper': return 'گۆڵپارێز';
      default: return 'یاریزان';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {players.map((player, index) => {
        const isChampion = player.rank <= 2;
        const isDanger = player.tier === 'danger';

        return (
          <div
            key={player.id}
            style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
            className={`animate-card-slide-in relative flex flex-col justify-between rounded-2xl p-4 transition-all duration-300 border ${
              isChampion
                ? 'bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-900 border-amber-500/30 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10'
                : isDanger
                ? 'bg-gradient-to-b from-red-950/20 via-slate-900 to-slate-900 border-red-500/30 hover:border-red-400'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Top Card Bar: Rank & Rating */}
            <div className="flex items-center justify-between mb-3">
              
              {/* Rank Badge */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black font-display shadow-sm ${
                    player.rank === 1
                      ? 'bg-amber-400 text-slate-950'
                      : player.rank === 2
                      ? 'bg-slate-300 text-slate-950'
                      : player.rank === 3
                      ? 'bg-amber-700 text-amber-100'
                      : isDanger
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  #{player.rank}
                </span>

                {isChampion && (
                  <span className="flex items-center text-amber-400 text-xs font-bold gap-0.5">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>تۆپ</span>
                  </span>
                )}
              </div>

              {/* Fair Rating Badge */}
              <div className="text-left">
                <div className="text-lg font-black text-white font-display flex items-baseline gap-1">
                  <span className={player.fairRating >= 6 ? 'text-emerald-400' : 'text-slate-200'}>
                    {player.fairRating}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">/ 10</span>
                </div>
              </div>

            </div>

            {/* Player Info (Clickable) */}
            <div 
              onClick={() => onSelectPlayer(player)}
              className="cursor-pointer mb-3 group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-black shrink-0 border overflow-hidden ${
                  isChampion
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
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

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition truncate">
                      {player.name}
                    </h3>
                    {player.status === 'injured' && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800/50">
                        🩹 پێکان
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{getPositionLabel(player.position)}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">{player.totalPoints} خاڵ</span>
                    <span className="text-[10px] text-amber-300/80 bg-amber-400/10 px-1 rounded font-mono">
                      +{player.matchBonus} پۆینت یاری
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-1 py-2 px-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center mb-3">
              <div>
                <div className="text-[10px] text-slate-400">یاری</div>
                <div className="text-xs font-bold text-white font-display">{player.totalMatches}</div>
              </div>
              <div>
                <div className="text-[10px] text-emerald-400">بردنەوە</div>
                <div className="text-xs font-bold text-emerald-400 font-display">{player.wins}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">یەکسان</div>
                <div className="text-xs font-bold text-slate-300 font-display">{player.draws}</div>
              </div>
              <div>
                <div className="text-[10px] text-rose-400">دۆڕان</div>
                <div className="text-xs font-bold text-rose-400 font-display">{player.losses}</div>
              </div>
            </div>

            {/* Score & Rating Bar */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">نمرەی دادپەروەرانە (WPI):</span>
                <span className="font-extrabold text-emerald-300 font-display">{player.fairScore}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{ width: `${Math.min(player.fairRating * 10, 100)}%` }}
                />
              </div>
            </div>

            {/* Card Footer: Quick Actions or Details */}
            {isAdmin ? (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => onQuickUpdate(player.id, 'win', 1)}
                    className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-800 text-[10px] font-bold border border-emerald-800"
                    title="+1 بردنەوە"
                  >
                    +ب
                  </button>
                  <button
                    onClick={() => onQuickUpdate(player.id, 'draw', 1)}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] font-bold border border-slate-700"
                    title="+1 یەکسانبوون"
                  >
                    +ی
                  </button>
                  <button
                    onClick={() => onQuickUpdate(player.id, 'loss', 1)}
                    className="px-2 py-1 rounded bg-rose-950 text-rose-300 hover:bg-rose-800 text-[10px] font-bold border border-rose-800"
                    title="+1 دۆڕان"
                  >
                    +د
                  </button>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => onEditPlayer(player)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                    title="دەستکاری"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeletePlayer(player.id, player.name)}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded"
                    title="سڕینەوە"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onSelectPlayer(player)}
                className="w-full py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                بینینی هەموو ئامارەکان
              </button>
            )}

          </div>
        );
      })}
    </div>
  );
};
