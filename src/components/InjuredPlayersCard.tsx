import React from 'react';
import { HeartPulse, CheckCircle2, Edit3, Trash2, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { Player, RankingConfig, ComputedPlayerStats } from '../types';
import { calculatePlayerStats } from '../utils/rankingCalculator';

interface InjuredPlayersCardProps {
  injuredPlayers: Player[];
  config: RankingConfig;
  isAdmin: boolean;
  onRestorePlayer: (id: string) => void;
  onSelectPlayer: (player: ComputedPlayerStats) => void;
  onEditPlayer: (player: Player) => void;
  onDeletePlayer: (id: string, name: string) => void;
}

export const InjuredPlayersCard: React.FC<InjuredPlayersCardProps> = ({
  injuredPlayers,
  config,
  isAdmin,
  onRestorePlayer,
  onSelectPlayer,
  onEditPlayer,
  onDeletePlayer,
}) => {
  if (injuredPlayers.length === 0) return null;

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
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-rose-50/80 via-white to-amber-50/40 border border-rose-200/80 p-4 sm:p-5 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-rose-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-800">
                یاریزانانی پێکراو (لە ڕیزبەندی سەرەکی دەرهێنراون)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
                {injuredPlayers.length} یاریزان
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ئەم یاریزانانە لە خشتەی ڕیزبەندی دەرکراون. هەر کات لە پێکان چاکبوونەوە، کلیک لەسەر «گەڕانەوە بۆ خول» بکە تا بگەڕێنەوە ڕیزبەندی.
            </p>
          </div>
        </div>
      </div>

      {/* Injured Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {injuredPlayers.map((player) => {
          const computed = calculatePlayerStats(player, config, 50);
          const fullComputed: ComputedPlayerStats = {
            ...computed,
            rank: 0,
            tier: 'danger',
          };

          return (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-rose-200/90 shadow-2xs hover:shadow-xs transition"
            >
              {/* Left Info: Avatar + Details */}
              <div 
                className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                onClick={() => onSelectPlayer(fullComputed)}
                title="کلیک بکە بۆ بینینی پرۆفایلی ئەم یاریزانە"
              >
                <div className="relative w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-full h-full object-cover grayscale opacity-80"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">
                      {player.name.slice(0, 2)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 text-xs">🩹</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800 truncate">
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span className="text-slate-600 font-semibold">{getPositionLabel(player.position)}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">{player.wins} بردنەوە</span>
                    <span>•</span>
                    <span className="text-slate-700 font-bold">{computed.totalPoints} خاڵ</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onRestorePlayer(player.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 transition shadow-2xs cursor-pointer active:scale-95"
                    title="چاکبوونەوە و گەڕاندنەوە بۆ خشتەی ڕیزبەندی"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>گەڕانەوە</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onEditPlayer(player)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    title="دەستکاری یاریزان"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onDeletePlayer(player.id, player.name)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                    title="سڕینەوەی یاریزان"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
