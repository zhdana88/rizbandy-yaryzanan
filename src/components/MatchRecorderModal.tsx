import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Users, 
  Trophy, 
  Check, 
  AlertCircle, 
  Sparkles,
  Calendar,
  History,
  Home,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ComputedPlayerStats, MatchRecord } from '../types';
import { getTodayISODate, formatLiveKurdishFullDate } from '../utils/dateHelper';

interface MatchRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: ComputedPlayerStats[];
  onRecordMatch: (match: Omit<MatchRecord, 'id'>) => void;
  matchHistory: MatchRecord[];
}

export const MatchRecorderModal: React.FC<MatchRecorderModalProps> = ({
  isOpen,
  onClose,
  players,
  onRecordMatch,
  matchHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'teams' | 'history'>('teams');
  
  // Teams State
  const [teamAName, setTeamAName] = useState('تیپی سپی (Team A)');
  const [teamBName, setTeamBName] = useState('تیپی سوور (Team B)');
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [teamAPlayerIds, setTeamAPlayerIds] = useState<string[]>([]);
  const [teamBPlayerIds, setTeamBPlayerIds] = useState<string[]>([]);
  const [matchDate, setMatchDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Reset to today whenever opened
  useEffect(() => {
    if (isOpen) {
      setMatchDate(getTodayISODate());
    }
  }, [isOpen]);

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

  const togglePlayerForTeamA = (playerId: string) => {
    if (teamBPlayerIds.includes(playerId)) {
      setTeamBPlayerIds((prev) => prev.filter((id) => id !== playerId));
    }
    setTeamAPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const togglePlayerForTeamB = (playerId: string) => {
    if (teamAPlayerIds.includes(playerId)) {
      setTeamAPlayerIds((prev) => prev.filter((id) => id !== playerId));
    }
    setTeamBPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamAPlayerIds.length === 0 || teamBPlayerIds.length === 0) {
      setError('تکایە یاریزان بۆ هەردوو تیپەکە دیاری بکە');
      return;
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (_) {}

    onRecordMatch({
      date: matchDate,
      teamAName,
      teamBName,
      scoreA: Number(scoreA) || 0,
      scoreB: Number(scoreB) || 0,
      teamAPlayerIds,
      teamBPlayerIds,
      notes,
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-6"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Actions Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
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

        {/* Modal Title & Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">تۆمارکردنی یاری نوێ</h3>
              <p className="text-xs text-slate-400">
                بەشداربووان دیاریبکە تا بردنەوە، دۆڕان و یەکسانبوون بە خۆکاری نوێببنەوە
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'teams'
                  ? 'bg-emerald-600 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              یاری نوێ
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>مێژوو ({matchHistory.length})</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'teams' ? (
          <form onSubmit={handleSaveMatch} className="space-y-5 text-xs">
            
            {/* Score & Teams Header */}
            <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-4">
              <div className="grid grid-cols-5 items-center gap-2 text-center">
                
                {/* Team A */}
                <div className="col-span-2 space-y-1.5">
                  <input
                    type="text"
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-center font-bold text-white text-xs"
                    placeholder="ناوی تیپی A"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[11px] text-slate-400">گۆڵ:</span>
                    <input
                      type="number"
                      min="0"
                      value={scoreA}
                      onChange={(e) => setScoreA(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 h-12 bg-slate-900 border border-emerald-500/40 rounded-xl text-center text-xl font-black text-emerald-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {teamAPlayerIds.length} یاریزان دیاریکراوە
                  </div>
                </div>

                {/* VS Badge */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <span className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-black flex items-center justify-center text-xs">
                    VS
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    {scoreA > scoreB
                      ? 'بردنەوەی تیپی A'
                      : scoreB > scoreA
                      ? 'بردنەوەی تیپی B'
                      : 'یەکسانبوون'}
                  </span>
                </div>

                {/* Team B */}
                <div className="col-span-2 space-y-1.5">
                  <input
                    type="text"
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-center font-bold text-white text-xs"
                    placeholder="ناوی تیپی B"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[11px] text-slate-400">گۆڵ:</span>
                    <input
                      type="number"
                      min="0"
                      value={scoreB}
                      onChange={(e) => setScoreB(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 h-12 bg-slate-900 border border-rose-500/40 rounded-xl text-center text-xl font-black text-rose-400 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {teamBPlayerIds.length} یاریزان دیاریکراوە
                  </div>
                </div>

              </div>
            </div>

            {/* Players Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Select for Team A */}
              <div className="bg-slate-950/60 rounded-2xl border border-emerald-500/30 p-3.5">
                <div className="flex items-center justify-between font-bold text-emerald-400 mb-2.5">
                  <span>یاریزانانی تیپی ۱ (A)</span>
                  <span className="text-[11px] text-slate-400">کلیک بکە بۆ دیاریکردن</span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                  {players.map((player) => {
                    const isSelected = teamAPlayerIds.includes(player.id);
                    return (
                      <button
                        type="button"
                        key={player.id}
                        onClick={() => togglePlayerForTeamA(player.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                            : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-emerald-500/50'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{player.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Select for Team B */}
              <div className="bg-slate-950/60 rounded-2xl border border-rose-500/30 p-3.5">
                <div className="flex items-center justify-between font-bold text-rose-400 mb-2.5">
                  <span>یاریزانانی تیپی ۲ (B)</span>
                  <span className="text-[11px] text-slate-400">کلیک بکە بۆ دیاریکردن</span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                  {players.map((player) => {
                    const isSelected = teamBPlayerIds.includes(player.id);
                    return (
                      <button
                        type="button"
                        key={player.id}
                        onClick={() => togglePlayerForTeamB(player.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                          isSelected
                            ? 'bg-rose-500 text-white font-bold shadow-sm'
                            : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-rose-500/50'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{player.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Date & Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-medium text-xs">
                    بەرواری یاری:
                  </label>
                  <button
                    type="button"
                    onClick={() => setMatchDate(getTodayISODate())}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>ئەمڕۆ</span>
                  </button>
                </div>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <div className="mt-1 text-[11px] text-emerald-400/90 font-medium">
                  {formatLiveKurdishFullDate(matchDate)}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 text-xs">
                  تێبینی یان ناوی یاریگا (ئارەزوومەندانە):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نموونە: یاریگای شاری وەرزشی..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>تۆمارکردن و نوێکردنەوەی ڕیزبەندی</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                پاشگەزبوونەوە
              </button>
            </div>

          </form>
        ) : (
          /* Match History Tab */
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {matchHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                تا ئێستا هیچ یارییەکی تۆمارکراو لە مێژوودا نییە
              </div>
            ) : (
              matchHistory.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-2">
                    <span className="flex items-center gap-1 font-semibold text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      {m.date}
                    </span>
                    {m.notes && <span className="text-slate-500">{m.notes}</span>}
                  </div>

                  <div className="flex items-center justify-between font-bold text-sm">
                    <span className="text-emerald-400">{m.teamAName}</span>
                    <span className="px-3 py-1 rounded-lg bg-slate-900 text-white font-black font-display border border-slate-800">
                      {m.scoreA} - {m.scoreB}
                    </span>
                    <span className="text-rose-400">{m.teamBName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};
