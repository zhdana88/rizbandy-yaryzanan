import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  HelpCircle,
  Table as TableIcon,
  AlertCircle
} from 'lucide-react';
import { Player, ComputedPlayerStats, RankingConfig } from '../types';
import { calculatePlayerStats, rankPlayers } from '../utils/rankingCalculator';

interface LiveSpreadsheetEditorProps {
  players: Player[];
  config: RankingConfig;
  onSaveAll: (updatedPlayers: Player[]) => void;
  onClose?: () => void;
}

export const LiveSpreadsheetEditor: React.FC<LiveSpreadsheetEditorProps> = ({
  players,
  config,
  onSaveAll,
  onClose,
}) => {
  // Local editable copy of players
  const [draftPlayers, setDraftPlayers] = useState<Player[]>(() => JSON.parse(JSON.stringify(players)));
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setDraftPlayers(JSON.parse(JSON.stringify(players)));
    setHasChanges(false);
  }, [players]);

  // Compute live rankings on the draft data in real-time
  const liveComputedStats = useMemo(() => {
    return rankPlayers(draftPlayers, config);
  }, [draftPlayers, config]);

  const handleCellChange = (id: string, field: keyof Player, value: any) => {
    setDraftPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            [field]: value,
          };
        }
        return p;
      })
    );
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleAddRow = () => {
    const newPlayer: Player = {
      id: `p-${Date.now()}`,
      name: `یاریزانی نوێ ${draftPlayers.length + 1}`,
      wins: 0,
      draws: 0,
      losses: 0,
      position: 'midfield',
      goals: 0,
      assists: 0,
      status: 'active',
    };
    setDraftPlayers((prev) => [...prev, newPlayer]);
    setHasChanges(true);
  };

  const handleDeleteRow = (id: string) => {
    setDraftPlayers((prev) => prev.filter((p) => p.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSaveAll(draftPlayers);
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    setDraftPlayers(JSON.parse(JSON.stringify(players)));
    setHasChanges(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl mb-8">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">
                دەستکاریکردنی ڕاستەوخۆ هاوشێوەی Google Sheets (Live Grid Editor)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Auto-Calculated Standings
              </span>
            </div>
            <p className="text-xs text-slate-400">
              خانەکان ڕاستەوخۆ دەستکاری بکە، خاڵ، WPI و ڕیزبەندییەکان لە هەمان ساتدا هەژمار دەکرێنەوە
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAddRow}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>زیادکردنی یاریزان</span>
          </button>

          {hasChanges && (
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>گەڕاندنەوە</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!hasChanges && !saveSuccess}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg ${
              saveSuccess
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                : hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-600/30 animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>پاشەکەوت کرا! (Saved)</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>پاشەکەوتکردن (Save Changes)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
        <table className="w-full text-right text-xs">
          
          {/* Header */}
          <thead className="bg-slate-900/90 text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3 text-center w-12">ڕیزبەندی</th>
              <th className="py-2.5 px-3">ناوی یاریزان (Name)</th>
              <th className="py-2.5 px-2 text-center w-28">پێگە (Position)</th>
              <th className="py-2.5 px-2 text-center w-24">دۆخ (Status)</th>
              <th className="py-2.5 px-2 text-center w-20 text-emerald-400">بردنەوە (W)</th>
              <th className="py-2.5 px-2 text-center w-20 text-slate-300">یەکسان (D)</th>
              <th className="py-2.5 px-2 text-center w-20 text-rose-400">دۆڕان (L)</th>
              <th className="py-2.5 px-2 text-center w-16 text-slate-400">کۆی یاری</th>
              <th className="py-2.5 px-2 text-center w-16 text-amber-400 font-black">خاڵ</th>
              <th className="py-2.5 px-2 text-center w-20 text-emerald-400 font-bold">ڕێژەی %</th>
              <th className="py-2.5 px-2 text-center w-20 text-amber-400 font-extrabold">WPI Score</th>
              <th className="py-2.5 px-2 text-center w-20 text-emerald-400 font-black">ڕێتینگ /10</th>
              <th className="py-2.5 px-2 text-center w-10">سڕینەوە</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {liveComputedStats.map((p, idx) => {
              const isTop1 = p.rank === 1;
              const isTop2 = p.rank === 2;
              const isDanger = p.tier === 'danger';

              return (
                <tr
                  key={p.id}
                  className={`transition-colors ${
                    isTop1
                      ? 'bg-amber-500/[0.08]'
                      : isTop2
                      ? 'bg-emerald-500/[0.06]'
                      : isDanger
                      ? 'bg-rose-500/[0.06]'
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  
                  {/* Auto Rank Badge */}
                  <td className="py-2 px-2 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black font-display ${
                        isTop1
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : isTop2
                          ? 'bg-slate-300 text-slate-950 font-black'
                          : isDanger
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p.rank}
                    </span>
                  </td>

                  {/* Player Name Input */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handleCellChange(p.id, 'name', e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1 text-white font-bold text-xs focus:outline-none focus:border-emerald-500 focus:bg-slate-950"
                    />
                  </td>

                  {/* Position Selector */}
                  <td className="py-2 px-2 text-center">
                    <select
                      value={p.position || 'midfield'}
                      onChange={(e) => handleCellChange(p.id, 'position', e.target.value)}
                      className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-slate-300 text-[11px] focus:outline-none focus:border-emerald-500"
                    >
                      <option value="forward">هێرشبەر</option>
                      <option value="midfield">ناوەڕاست</option>
                      <option value="defender">بەرگریکار</option>
                      <option value="goalkeeper">گۆڵپارێز</option>
                    </select>
                  </td>

                  {/* Status Selector */}
                  <td className="py-2 px-2 text-center">
                    <select
                      value={p.status || 'active'}
                      onChange={(e) => handleCellChange(p.id, 'status', e.target.value)}
                      className="bg-slate-900 border border-slate-700/80 rounded-lg px-1.5 py-1 text-slate-300 text-[11px] focus:outline-none focus:border-emerald-500"
                    >
                      <option value="active">چالاک</option>
                      <option value="injured">🩹 پێکان</option>
                      <option value="absent">ئامادەنەبوو</option>
                    </select>
                  </td>

                  {/* Wins Input */}
                  <td className="py-2 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      value={p.wins}
                      onChange={(e) => handleCellChange(p.id, 'wins', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 mx-auto text-center bg-slate-900/90 border border-emerald-500/40 rounded-lg py-1 font-black text-emerald-400 text-xs focus:outline-none focus:border-emerald-400 focus:bg-slate-950"
                    />
                  </td>

                  {/* Draws Input */}
                  <td className="py-2 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      value={p.draws}
                      onChange={(e) => handleCellChange(p.id, 'draws', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 mx-auto text-center bg-slate-900/90 border border-slate-700 rounded-lg py-1 font-bold text-slate-200 text-xs focus:outline-none focus:border-slate-500 focus:bg-slate-950"
                    />
                  </td>

                  {/* Losses Input */}
                  <td className="py-2 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      value={p.losses}
                      onChange={(e) => handleCellChange(p.id, 'losses', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 mx-auto text-center bg-slate-900/90 border border-rose-500/40 rounded-lg py-1 font-black text-rose-400 text-xs focus:outline-none focus:border-rose-400 focus:bg-slate-950"
                    />
                  </td>

                  {/* Calculated Matches with bonus */}
                  <td className="py-2 px-2 text-center">
                    <span className="font-display font-semibold text-slate-300">{p.totalMatches}</span>
                    <span className="block text-[9px] text-amber-400 font-mono">+{p.matchBonus}خ</span>
                  </td>

                  {/* Calculated Points */}
                  <td className="py-2 px-2 text-center font-display font-black text-amber-400">
                    <div>{p.totalPoints}</div>
                    <div className="text-[9px] text-slate-400 font-normal font-sans">({p.basePoints}+{p.matchBonus})</div>
                  </td>

                  {/* Calculated Win Rate % */}
                  <td className="py-2 px-2 text-center font-display font-bold text-emerald-400">
                    {p.winRate}%
                  </td>

                  {/* Calculated WPI Score */}
                  <td className="py-2 px-2 text-center font-display font-extrabold text-amber-300">
                    {p.fairScore}
                  </td>

                  {/* Calculated Rating */}
                  <td className="py-2 px-2 text-center font-display font-black text-emerald-400">
                    {p.fairRating}
                  </td>

                  {/* Delete Action */}
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(p.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                      title="سڕینەوەی یاریزان"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Helper Footer */}
      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>هاوکێشەی خاڵ: `(Wins * 3) + (Draws * 1)` • هاوکێشەی WPI: `(Points / (Matches * 3) * 100) + (Matches * 0.3)`</span>
        </div>
        <div className="text-slate-500">
          کۆی یاریزانان: {draftPlayers.length}
        </div>
      </div>

    </div>
  );
};
