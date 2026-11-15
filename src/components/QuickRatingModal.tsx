import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  Star, 
  Trophy, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Check, 
  ShieldCheck, 
  Plus, 
  Minus,
  RotateCcw,
  Zap
} from 'lucide-react';
import { ComputedPlayerStats, Player, RankingConfig } from '../types';

interface QuickRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: ComputedPlayerStats[];
  config: RankingConfig;
  onSaveBatchRatings: (updatedPlayers: Player[]) => void;
}

interface PlayerDraftRating {
  id: string;
  rating: number; // 1 to 10
  goals: number;
  assists: number;
  result: 'W' | 'D' | 'L' | 'none';
  customBonus: number;
}

export const QuickRatingModal: React.FC<QuickRatingModalProps> = ({
  isOpen,
  onClose,
  players,
  config,
  onSaveBatchRatings,
}) => {
  const [search, setSearch] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [appliedPresetBonus, setAppliedPresetBonus] = useState<number>(0.15);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Draft ratings dictionary
  const [drafts, setDrafts] = useState<Record<string, PlayerDraftRating>>(() => {
    const initial: Record<string, PlayerDraftRating> = {};
    players.forEach((p) => {
      initial[p.id] = {
        id: p.id,
        rating: Math.min(10, Math.max(5.0, Number((p.fairScore / 10).toFixed(1)))),
        goals: 0,
        assists: 0,
        result: 'none',
        customBonus: 0,
      };
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleRatingChange = (id: string, delta: number) => {
    setDrafts((prev) => {
      const current = prev[id] || { id, rating: 7.0, goals: 0, assists: 0, result: 'none', customBonus: 0 };
      const nextRating = Math.max(1.0, Math.min(10.0, parseFloat((current.rating + delta).toFixed(1))));
      return {
        ...prev,
        [id]: { ...current, rating: nextRating },
      };
    });
  };

  const handleDirectRatingSet = (id: string, value: number) => {
    setDrafts((prev) => {
      const current = prev[id] || { id, rating: 7.0, goals: 0, assists: 0, result: 'none', customBonus: 0 };
      return {
        ...prev,
        [id]: { ...current, rating: value },
      };
    });
  };

  const handleStatChange = (id: string, field: 'goals' | 'assists' | 'customBonus', delta: number) => {
    setDrafts((prev) => {
      const current = prev[id] || { id, rating: 7.0, goals: 0, assists: 0, result: 'none', customBonus: 0 };
      const nextVal = Math.max(0, (current[field] || 0) + delta);
      return {
        ...prev,
        [id]: { ...current, [field]: nextVal },
      };
    });
  };

  const handleResultChange = (id: string, result: 'W' | 'D' | 'L' | 'none') => {
    setDrafts((prev) => {
      const current = prev[id] || { id, rating: 7.0, goals: 0, assists: 0, result: 'none', customBonus: 0 };
      return {
        ...prev,
        [id]: { ...current, result },
      };
    });
  };

  // Quick Apply to All Filtered
  const handleApplyResultToAll = (result: 'W' | 'D' | 'L') => {
    setDrafts((prev) => {
      const updated = { ...prev };
      filteredPlayers.forEach((p) => {
        if (updated[p.id]) {
          updated[p.id].result = result;
        }
      });
      return updated;
    });
  };

  const handleSaveAll = () => {
    const updatedPlayersList: Player[] = players.map((p) => {
      const draft = drafts[p.id];
      if (!draft) return p;

      let wins = p.wins;
      let draws = p.draws;
      let losses = p.losses;
      let form = p.form ? [...p.form] : [];

      if (draft.result === 'W') {
        wins += 1;
        form = [...form, 'W'].slice(-5);
      } else if (draft.result === 'D') {
        draws += 1;
        form = [...form, 'D'].slice(-5);
      } else if (draft.result === 'L') {
        losses += 1;
        form = [...form, 'L'].slice(-5);
      }

      const goals = (p.goals || 0) + (draft.goals || 0);
      const assists = (p.assists || 0) + (draft.assists || 0);

      return {
        ...p,
        wins,
        draws,
        losses,
        goals,
        assists,
        matchRating: draft.rating,
        form: form as ('W' | 'D' | 'L')[],
      };
    });

    onSaveBatchRatings(updatedPlayersList);
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const filteredPlayers = players.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchPos = selectedPosition === 'all' || p.position === selectedPosition;
    return matchSearch && matchPos;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  دیاریکردنی خێرای نمرە و خاڵی یاریزانان
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                  پاشەکەوتی دەستبەجێ
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                نمرەی یاری، بردنەوە/دۆڕان و گۆڵ و ئەسیست بە یەک کلیک پاشەکەوت بکە و هەرگیز نافەوتێت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="گەڕان بۆ یاریزان..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Position Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { key: 'all', label: 'هەموو' },
              { key: 'forward', label: 'هێرشبەر' },
              { key: 'midfield', label: 'ناوەڕاست' },
              { key: 'defender', label: 'بەرگری' },
              { key: 'goalkeeper', label: 'گۆڵپارێز' },
            ].map((pos) => (
              <button
                key={pos.key}
                onClick={() => setSelectedPosition(pos.key)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedPosition === pos.key
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>

          {/* Quick Apply Outcomes */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-[11px] font-bold text-slate-500">هەموو:</span>
            <button
              onClick={() => handleApplyResultToAll('W')}
              className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-[11px] border border-emerald-300"
            >
              +بردنەوە (W)
            </button>
            <button
              onClick={() => handleApplyResultToAll('D')}
              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-extrabold text-[11px] border border-amber-300"
            >
              +یەکسان (D)
            </button>
            <button
              onClick={() => handleApplyResultToAll('L')}
              className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-[11px] border border-rose-300"
            >
              +دۆڕان (L)
            </button>
          </div>

        </div>

        {/* Players List Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-slate-100/60">
          {filteredPlayers.map((player) => {
            const draft = drafts[player.id] || {
              id: player.id,
              rating: 7.0,
              goals: 0,
              assists: 0,
              result: 'none',
              customBonus: 0,
            };

            return (
              <div
                key={player.id}
                className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-emerald-400 transition"
              >
                {/* Player Identity */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-black text-slate-800 shrink-0">
                    {player.avatar ? (
                      <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      player.name.slice(0, 2)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">{player.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                        WPI: {player.fairScore}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      یارییەکان: {player.matchesPlayed} • W:{player.wins} D:{player.draws} L:{player.losses}
                    </p>
                  </div>
                </div>

                {/* Star Match Rating Slider / Buttons */}
                <div className="flex items-center gap-2 bg-amber-50/70 border border-amber-200/80 px-3 py-1.5 rounded-xl">
                  <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>نمرەی یاری:</span>
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRatingChange(player.id, -0.5)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-amber-100 text-slate-800 flex items-center justify-center font-black text-sm border border-amber-300"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-sm w-9 text-center text-amber-950 bg-white py-0.5 rounded-md border border-amber-300">
                      {draft.rating.toFixed(1)}
                    </span>
                    <button
                      onClick={() => handleRatingChange(player.id, 0.5)}
                      className="w-6 h-6 rounded-lg bg-white hover:bg-amber-100 text-slate-800 flex items-center justify-center font-black text-sm border border-amber-300"
                    >
                      +
                    </button>
                  </div>

                  {/* Preset quick pills */}
                  <div className="hidden sm:flex items-center gap-1 mr-1">
                    {[6.0, 7.5, 8.5, 9.5].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleDirectRatingSet(player.id, val)}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          draft.rating === val
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-white text-slate-600 border border-amber-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Match Result Selector */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => handleResultChange(player.id, draft.result === 'W' ? 'none' : 'W')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      draft.result === 'W'
                        ? 'bg-emerald-600 text-white font-black shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>بردنەوە</span>
                    <span className="text-[10px] opacity-80">(+3)</span>
                  </button>
                  <button
                    onClick={() => handleResultChange(player.id, draft.result === 'D' ? 'none' : 'D')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      draft.result === 'D'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>یەکسان</span>
                    <span className="text-[10px] opacity-80">(+1)</span>
                  </button>
                  <button
                    onClick={() => handleResultChange(player.id, draft.result === 'L' ? 'none' : 'L')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      draft.result === 'L'
                        ? 'bg-rose-600 text-white font-black shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>دۆڕان</span>
                    <span className="text-[10px] opacity-80">(+0)</span>
                  </button>
                </div>

                {/* Goals & Assists Counters */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">⚽ گۆڵ:</span>
                    <button
                      onClick={() => handleStatChange(player.id, 'goals', -1)}
                      className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-xs w-4 text-center text-slate-900">
                      {draft.goals}
                    </span>
                    <button
                      onClick={() => handleStatChange(player.id, 'goals', 1)}
                      className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">🎯 ئەسیست:</span>
                    <button
                      onClick={() => handleStatChange(player.id, 'assists', -1)}
                      className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-xs w-4 text-center text-slate-900">
                      {draft.assists}
                    </span>
                    <button
                      onClick={() => handleStatChange(player.id, 'assists', 1)}
                      className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Modal Footer with Instant Save Button */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>پاشەکەوت دەستبەجێ لە مۆبایل و کۆمپیوتەرەکەت دەمێنێتەوە و پارێزراوە</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              داخستن
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSavedSuccess}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition shadow-md ${
                isSavedSuccess
                  ? 'bg-emerald-500 text-slate-950 scale-105'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isSavedSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-slate-950" />
                  <span>پاشەکەوت کرا! ✅</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>پاشەکەوتکردنی هەموو نمرەکان ئێستا</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
