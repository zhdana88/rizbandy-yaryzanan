import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  Sparkles, 
  Download, 
  RotateCcw, 
  Shuffle, 
  Shirt, 
  Shield, 
  Check, 
  X, 
  ChevronDown, 
  Plus, 
  ArrowRightLeft, 
  SlidersHorizontal,
  Flame,
  Swords,
  UserCheck,
  Search,
  CheckCircle2,
  Trash2,
  Share2,
  Save,
  ShieldCheck,
  CheckCircle,
  Trophy,
  Medal,
  Undo2,
  AlertCircle,
  History,
  TrendingUp,
  Move,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ComputedPlayerStats, LineupMatchState, TeamLineup, KitColor, Formation6v6, Player, MatchRecord } from '../types';
import { FORMATIONS_6V6, KIT_COLORS } from '../utils/formations6v6';
import { evaluateMatchBalance, autoBalanceTeams } from '../utils/teamBalanceCalculator';
import { ExportLineupImageModal } from './ExportLineupImageModal';
import { getTodayISODate, formatLiveKurdishFullDate } from '../utils/dateHelper';
import { saveLineupToStorage, LINEUP_STORAGE_KEY } from '../utils/persistentStorage';

interface LineupBuilderProps {
  isAdmin: boolean;
  players: ComputedPlayerStats[];
  rawPlayers?: Player[];
  leagueTitle?: string;
  onRecordMatch?: (match: Omit<MatchRecord, 'id'>) => void;
  matchHistory?: MatchRecord[];
  onDeleteMatchHistory?: (matchId: string) => void;
}

// Subcomponent for Football Jersey Vector
const FootballJersey: React.FC<{
  hex: string;
  darkHex?: string;
  textColor?: string;
  squadNumber?: number | string;
  className?: string;
}> = ({ hex, darkHex, textColor, squadNumber, className = 'w-9 h-7 sm:w-11 sm:h-8.5' }) => {
  const isLightText = textColor === 'text-white' || textColor === '#ffffff';
  const strokeTrim = isLightText ? '#ffffff' : '#0f172a';
  const textFill = isLightText ? '#ffffff' : '#0f172a';

  return (
    <div className={`relative ${className} flex items-center justify-center select-none shrink-0 drop-shadow-md`}>
      <svg viewBox="0 0 100 85" className="w-full h-full">
        <path
          d="M32 4 L12 14 L0 32 L16 42 L22 30 L22 80 Q50 85 78 80 L78 30 L84 42 L100 32 L88 14 L68 4 Q50 18 32 4 Z"
          fill={hex}
          stroke={darkHex || '#000000'}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Collar V-Trim */}
        <path d="M32 4 Q50 20 68 4" fill="none" stroke={strokeTrim} strokeWidth="4" strokeLinecap="round" />
        {/* Left Sleeve Cuff */}
        <line x1="0" y1="32" x2="16" y2="42" stroke={strokeTrim} strokeWidth="3.5" />
        {/* Right Sleeve Cuff */}
        <line x1="100" y1="32" x2="84" y2="42" stroke={strokeTrim} strokeWidth="3.5" />
        {/* Left Chest Gold Star / Badge */}
        <circle cx="70" cy="30" r="3.5" fill="#facc15" />
        {/* Chest Squad Number */}
        {squadNumber !== undefined && (
          <text
            x="50"
            y="56"
            textAnchor="middle"
            dominantBaseline="central"
            fill={textFill}
            fontSize="26"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
          >
            {squadNumber}
          </text>
        )}
      </svg>
    </div>
  );
};

export const LineupBuilder: React.FC<LineupBuilderProps> = ({
  isAdmin,
  players,
  rawPlayers,
  leagueTitle = 'ڕێزبەندی Rizbandy',
  onRecordMatch,
  matchHistory = [],
  onDeleteMatchHistory,
}) => {
  // 1. Lineup Match State with persistence
  const [matchState, setMatchState] = useState<LineupMatchState>(() => {
    const today = getTodayISODate();
    const saved = localStorage.getItem(LINEUP_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.teamA && parsed.teamB) {
          // Always ensure the match date reflects today's real date unless explicitly kept
          return {
            ...parsed,
            date: parsed.date && parsed.date.length === 10 && parsed.date >= today ? parsed.date : today,
          };
        }
      } catch (e) {
        console.error('Error loading lineup', e);
      }
    }

    // Default: Initial 6v6 setup with top available players
    const activePlayers = players.filter((p) => p.status !== 'injured');
    const auto = autoBalanceTeams(activePlayers, 2);

    return {
      id: `lineup-${Date.now()}`,
      title: 'یاریگای ٦ بەرامبەر ٦',
      date: today,
      subCount: 2,
      teamA: {
        name: 'تیمی زەرد 🟡',
        color: 'yellow',
        formation: '1-2-2-1',
        starterIds: auto.startersA.length === 6 ? auto.startersA : [null, null, null, null, null, null],
        substituteIds: auto.subsA.length === 2 ? auto.subsA : [null, null],
      },
      teamB: {
        name: 'تیمی شین 🔵',
        color: 'blue',
        formation: '1-2-2-1',
        starterIds: auto.startersB.length === 6 ? auto.startersB : [null, null, null, null, null, null],
        substituteIds: auto.subsB.length === 2 ? auto.subsB : [null, null],
      },
    };
  });

  const updateMatchState = (nextState: React.SetStateAction<LineupMatchState>) => {
    if (!isAdmin) return;
    setMatchState(nextState);
  };

  // UI Interactive States
  const [selectedSlot, setSelectedSlot] = useState<{
    team: 'A' | 'B';
    type: 'starter' | 'sub';
    index: number;
  } | null>(null);

  const [isPlayerPickerOpen, setIsPlayerPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerPosition, setPickerPosition] = useState<string>('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [swapSource, setSwapSource] = useState<{
    team: 'A' | 'B';
    type: 'starter' | 'sub';
    index: number;
    playerId: string | null;
  } | null>(null);

  // Drag and Drop state & Mouse Position Moving
  const pitchRef = useRef<HTMLDivElement>(null);
  const [draggingSlot, setDraggingSlot] = useState<{
    team: 'A' | 'B';
    index: number;
    startX: number;
    startY: number;
    hasMoved: boolean;
  } | null>(null);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [isSaveConfirmed, setIsSaveConfirmed] = useState(false);

  // Smart Match Outcome & Direct Points Allocation State
  const [selectedOutcome, setSelectedOutcome] = useState<'A' | 'draw' | 'B' | null>(null);
  const [scoreA, setScoreA] = useState<number>(3);
  const [scoreB, setScoreB] = useState<number>(1);
  const [customScoreMode, setCustomScoreMode] = useState(false);
  const [matchNotes, setMatchNotes] = useState('');
  const [lastRecordedMatchId, setLastRecordedMatchId] = useState<string | null>(null);
  const [outcomeSuccessMessage, setOutcomeSuccessMessage] = useState<string | null>(null);
  const [isOutcomePanelOpen, setIsOutcomePanelOpen] = useState(true);

  // Save changes to localStorage
  useEffect(() => {
    if (isAdmin) saveLineupToStorage(matchState);
  }, [isAdmin, matchState]);

  const handleManualSave = () => {
    if (!isAdmin) return;
    saveLineupToStorage(matchState);
    setIsSaveConfirmed(true);
    setTimeout(() => setIsSaveConfirmed(false), 2000);
  };

  const playerMap = useMemo(() => {
    return new Map(players.map((p) => [p.id, p]));
  }, [players]);

  // List of assigned player IDs for Team A & Team B
  const teamAPlayerIds = useMemo(() => {
    return [...matchState.teamA.starterIds, ...matchState.teamA.substituteIds].filter(
      (id): id is string => Boolean(id)
    );
  }, [matchState.teamA]);

  const teamBPlayerIds = useMemo(() => {
    return [...matchState.teamB.starterIds, ...matchState.teamB.substituteIds].filter(
      (id): id is string => Boolean(id)
    );
  }, [matchState.teamB]);

  const teamAPlayers = useMemo(() => {
    return teamAPlayerIds.map((id) => playerMap.get(id)).filter(Boolean) as ComputedPlayerStats[];
  }, [teamAPlayerIds, playerMap]);

  const teamBPlayers = useMemo(() => {
    return teamBPlayerIds.map((id) => playerMap.get(id)).filter(Boolean) as ComputedPlayerStats[];
  }, [teamBPlayerIds, playerMap]);

  // Quick 1-Click Outcome Selector
  const handleSelectOutcome = (outcome: 'A' | 'draw' | 'B') => {
    setSelectedOutcome(outcome);
    if (!customScoreMode) {
      if (outcome === 'A') {
        setScoreA(3);
        setScoreB(1);
      } else if (outcome === 'B') {
        setScoreA(1);
        setScoreB(3);
      } else {
        setScoreA(2);
        setScoreB(2);
      }
    }
  };

  // Record / Apply Match Outcome Directly
  const handleApplyMatchOutcome = () => {
    if (!isAdmin) return;
    if (!onRecordMatch) {
      alert('ببورە، توانای تۆمارکردنی یاری لەبەردەستدا نییە');
      return;
    }

    if (teamAPlayerIds.length === 0 || teamBPlayerIds.length === 0) {
      alert('تکایە سەرەتا یاریزان بۆ هەردوو تیم لەسەر یاریگاکە دیاری بکە پێش تۆمارکردنی ئەنجام.');
      return;
    }

    if (!selectedOutcome) {
      alert('تکایە یەکێک لە هەڵبژاردنەکان (بردنەوەی تیمی یەکەم، یەکسانبوون، یان بردنەوەی تیمی دووەم) هەڵبژێرە.');
      return;
    }

    let finalScoreA = Number(scoreA) || 0;
    let finalScoreB = Number(scoreB) || 0;

    if (selectedOutcome === 'A' && finalScoreA <= finalScoreB) {
      finalScoreA = finalScoreB + 1;
    } else if (selectedOutcome === 'B' && finalScoreB <= finalScoreA) {
      finalScoreB = finalScoreA + 1;
    } else if (selectedOutcome === 'draw' && finalScoreA !== finalScoreB) {
      finalScoreB = finalScoreA;
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    const generatedId = `lineup-match-${Date.now()}`;
    setLastRecordedMatchId(generatedId);

    onRecordMatch({
      date: matchState.date || new Date().toISOString().split('T')[0],
      teamAName: matchState.teamA.name,
      teamBName: matchState.teamB.name,
      scoreA: finalScoreA,
      scoreB: finalScoreB,
      teamAPlayerIds,
      teamBPlayerIds,
      notes: matchNotes || `تۆمارکرا لە پێکهاتەی ٦ بەرامبەر ٦ (${matchState.title || 'یاریگای ٦v٦'})`,
    });

    const winnerName =
      selectedOutcome === 'A'
        ? matchState.teamA.name
        : selectedOutcome === 'B'
        ? matchState.teamB.name
        : 'بەرامبەربوون';

    const outcomeMsg =
      selectedOutcome === 'draw'
        ? `ئەنجامی بەرامبەربوون بە سەرکەوتوویی پاشەکەوت کرا! +١ خاڵ و +١ بەرامبەربوون بۆ هەموو (${teamAPlayerIds.length + teamBPlayerIds.length}) یاریزانی هەردوو تیم هەژمارکرا. ✅`
        : `پیرۆزە! بردنەوەی ${winnerName} پاشەکەوت کرا! +٣ خاڵ و +١ بردنەوە بۆ هەموو (${selectedOutcome === 'A' ? teamAPlayerIds.length : teamBPlayerIds.length}) یاریزانی ${winnerName} هەژمارکرا، و دۆڕان (٠ خاڵ) بۆ تیمی بەرامبەر تۆمارکرا. ✅`;

    setOutcomeSuccessMessage(outcomeMsg);
    setTimeout(() => {
      setOutcomeSuccessMessage(null);
    }, 10000);
  };

  // Evaluate Dynamic Match Balance
  const balanceResult = useMemo(() => {
    return evaluateMatchBalance(matchState.teamA, matchState.teamB, players);
  }, [matchState, players]);

  // List of assigned player IDs
  const assignedPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    matchState.teamA.starterIds.forEach((id) => id && ids.add(id));
    matchState.teamA.substituteIds.forEach((id) => id && ids.add(id));
    matchState.teamB.starterIds.forEach((id) => id && ids.add(id));
    matchState.teamB.substituteIds.forEach((id) => id && ids.add(id));
    return ids;
  }, [matchState]);

  // Unassigned available players in the league
  const unassignedPlayers = useMemo(() => {
    return players.filter((p) => !assignedPlayerIds.has(p.id));
  }, [players, assignedPlayerIds]);

  // Handle Changing Number of Substitutes (e.g. 0, 1, 2, 3, 4)
  const handleSubCountChange = (newCount: number) => {
    updateMatchState((prev) => {
      const resizeSubs = (currentSubs: (string | null)[]) => {
        if (newCount > currentSubs.length) {
          const added = Array(newCount - currentSubs.length).fill(null);
          return [...currentSubs, ...added];
        } else {
          return currentSubs.slice(0, newCount);
        }
      };

      return {
        ...prev,
        subCount: newCount,
        teamA: {
          ...prev.teamA,
          substituteIds: resizeSubs(prev.teamA.substituteIds),
        },
        teamB: {
          ...prev.teamB,
          substituteIds: resizeSubs(prev.teamB.substituteIds),
        },
      };
    });
  };

  // Assign Player to Slot
  const handleAssignPlayer = (playerId: string | null) => {
    if (!selectedSlot) return;
    const { team, type, index } = selectedSlot;

    updateMatchState((prev) => {
      const teamKey = team === 'A' ? 'teamA' : 'teamB';
      const targetTeam = prev[teamKey];
      let updated: LineupMatchState;

      if (type === 'starter') {
        const newStarters = [...targetTeam.starterIds];
        newStarters[index] = playerId;
        updated = {
          ...prev,
          [teamKey]: {
            ...targetTeam,
            starterIds: newStarters,
          },
        };
      } else {
        const newSubs = [...targetTeam.substituteIds];
        newSubs[index] = playerId;
        updated = {
          ...prev,
          [teamKey]: {
            ...targetTeam,
            substituteIds: newSubs,
          },
        };
      }
      saveLineupToStorage(updated);
      return updated;
    });

    setIsPlayerPickerOpen(false);
    setSelectedSlot(null);
  };

  // Swap Two Slots
  const handleSlotClick = (team: 'A' | 'B', type: 'starter' | 'sub', index: number) => {
    if (swapSource) {
      // Complete Swap
      if (
        swapSource.team === team &&
        swapSource.type === type &&
        swapSource.index === index
      ) {
        // Cancel swap if clicked same
        setSwapSource(null);
        return;
      }

      updateMatchState((prev) => {
        const next: LineupMatchState = {
          ...prev,
          teamA: {
            ...prev.teamA,
            starterIds: [...prev.teamA.starterIds],
            substituteIds: [...prev.teamA.substituteIds],
          },
          teamB: {
            ...prev.teamB,
            starterIds: [...prev.teamB.starterIds],
            substituteIds: [...prev.teamB.substituteIds],
          },
        };

        const srcTeamKey = swapSource.team === 'A' ? 'teamA' : 'teamB';
        const targetTeamKey = team === 'A' ? 'teamA' : 'teamB';

        const srcList =
          swapSource.type === 'starter'
            ? next[srcTeamKey].starterIds
            : next[srcTeamKey].substituteIds;

        const targetList =
          type === 'starter'
            ? next[targetTeamKey].starterIds
            : next[targetTeamKey].substituteIds;

        const temp = srcList[swapSource.index];
        srcList[swapSource.index] = targetList[index];
        targetList[index] = temp;

        saveLineupToStorage(next);
        return next;
      });

      setSwapSource(null);
      setIsSaveConfirmed(true);
      setTimeout(() => setIsSaveConfirmed(false), 2000);
    } else {
      // Start slot picker
      setSelectedSlot({ team, type, index });
      setPickerSearch('');
      setIsPlayerPickerOpen(true);
    }
  };

  // AI Auto-Balance
  const handleAutoBalance = () => {
    const available = players.filter((p) => p.status !== 'injured');
    const balanced = autoBalanceTeams(available, matchState.subCount);

    updateMatchState((prev) => ({
      ...prev,
      teamA: {
        ...prev.teamA,
        starterIds: balanced.startersA,
        substituteIds: balanced.subsA,
      },
      teamB: {
        ...prev.teamB,
        starterIds: balanced.startersB,
        substituteIds: balanced.subsB,
      },
    }));
  };

  // Clear All Players from Pitch
  const handleClearPitch = () => {
    if (window.confirm('ئایا دڵنیایت لە بەتاڵکردنەوەی هەموو شوێنەکانی یاریگاکە؟')) {
      updateMatchState((prev) => ({
        ...prev,
        teamA: {
          ...prev.teamA,
          starterIds: [null, null, null, null, null, null],
          substituteIds: Array(prev.subCount).fill(null),
        },
        teamB: {
          ...prev.teamB,
          starterIds: [null, null, null, null, null, null],
          substituteIds: Array(prev.subCount).fill(null),
        },
      }));
    }
  };

  // Kits styling
  const kitA = KIT_COLORS[matchState.teamA.color] || KIT_COLORS.yellow;
  const kitB = KIT_COLORS[matchState.teamB.color] || KIT_COLORS.blue;

  const formationA = FORMATIONS_6V6[matchState.teamA.formation] || FORMATIONS_6V6['1-2-2-1'];
  const formationB = FORMATIONS_6V6[matchState.teamB.formation] || FORMATIONS_6V6['1-2-2-1'];

  // Current dynamic positions for pitch rendering (Preset or Custom Dragged)
  const currentPositionsA = useMemo(() => {
    if (matchState.teamA.customPositions && matchState.teamA.customPositions.length === 6) {
      return matchState.teamA.customPositions;
    }
    return formationA.positionsA;
  }, [matchState.teamA.customPositions, formationA]);

  const currentPositionsB = useMemo(() => {
    if (matchState.teamB.customPositions && matchState.teamB.customPositions.length === 6) {
      return matchState.teamB.customPositions;
    }
    return formationB.positionsB;
  }, [matchState.teamB.customPositions, formationB]);

  // Reset positions back to preset formation
  const handleResetPositions = (team: 'A' | 'B') => {
    updateMatchState((prev) => {
      const teamKey = team === 'A' ? 'teamA' : 'teamB';
      const formKey = prev[teamKey].formation;
      const defaultPositions = team === 'A'
        ? (FORMATIONS_6V6[formKey] || FORMATIONS_6V6['1-2-2-1']).positionsA
        : (FORMATIONS_6V6[formKey] || FORMATIONS_6V6['1-2-2-1']).positionsB;
      return {
        ...prev,
        [teamKey]: {
          ...prev[teamKey],
          customPositions: defaultPositions,
        },
      };
    });
  };

  // Change formation preset and update positions accordingly
  const handleFormationChange = (team: 'A' | 'B', newFormation: Formation6v6) => {
    const formPreset = FORMATIONS_6V6[newFormation] || FORMATIONS_6V6['1-2-2-1'];
    const newPositions = team === 'A' ? formPreset.positionsA : formPreset.positionsB;
    updateMatchState((prev) => {
      const teamKey = team === 'A' ? 'teamA' : 'teamB';
      return {
        ...prev,
        [teamKey]: {
          ...prev[teamKey],
          formation: newFormation,
          customPositions: newPositions,
        },
      };
    });
  };

  // Drag & Move Event Handlers (Mouse + Touch)
  const handleTokenPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    team: 'A' | 'B',
    index: number
  ) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    setDraggingSlot({
      team,
      index,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
    });
  };

  const handleTokenPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingSlot || !pitchRef.current) return;

    const deltaX = Math.abs(e.clientX - draggingSlot.startX);
    const deltaY = Math.abs(e.clientY - draggingSlot.startY);

    if (deltaX > 3 || deltaY > 3 || draggingSlot.hasMoved) {
      if (!draggingSlot.hasMoved) {
        setDraggingSlot((prev) => (prev ? { ...prev, hasMoved: true } : null));
      }

      const rect = pitchRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const rawX = ((e.clientX - rect.left) / rect.width) * 100;
      const rawY = ((e.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.max(5, Math.min(95, Math.round(rawX)));
      const clampedY = draggingSlot.team === 'B'
        ? Math.max(5, Math.min(48, Math.round(rawY)))
        : Math.max(52, Math.min(95, Math.round(rawY)));

      updateMatchState((prev) => {
        const teamKey = draggingSlot.team === 'A' ? 'teamA' : 'teamB';
        const teamObj = prev[teamKey];
        const currentList = teamKey === 'teamA' ? currentPositionsA : currentPositionsB;

        const updated = currentList.map((p, idx) => {
          if (idx === draggingSlot.index) {
            return { ...p, x: clampedX, y: clampedY };
          }
          return p;
        });

        return {
          ...prev,
          [teamKey]: {
            ...teamObj,
            customPositions: updated,
          },
        };
      });
    }
  };

  const handleTokenPointerUp = (
    e: React.PointerEvent<HTMLDivElement>,
    team: 'A' | 'B',
    index: number
  ) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (draggingSlot) {
      if (!draggingSlot.hasMoved) {
        // It was a pure click/tap
        handleSlotClick(team, 'starter', index);
      }
      setDraggingSlot(null);
    }
  };

  const handleTokenPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    setDraggingSlot(null);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  سیستەمی ڕێکخستنی پێکهاتەی یاریگای ٦ بەرامبەر ٦
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  6-v-6 Tactical Board
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                پێکهاتەی ٦ سەرەکی + یەدەگەکان دابنێ، ڕەنگی جلەکان بگۆڕە و بە وێنەی کوالێتی بەرز دایبەزێنە
              </p>
            </div>
          </div>

          {/* Quick Actions & Export */}
          <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
            
            {/* Explicit Save Lineup Button */}
            <button
              onClick={handleManualSave}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-sm ${
                isSaveConfirmed
                  ? 'bg-emerald-500 text-slate-950 scale-105 shadow-emerald-500/20'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
              title="پاشەکەوتکردنی هەموو شوێنەکان و گۆڕانکارییەکانی پێکهاتە"
            >
              {isSaveConfirmed ? (
                <>
                  <CheckCircle className="w-4 h-4 text-slate-950" />
                  <span>پاشەکەوت کرا! ✅</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-emerald-700" />
                  <span>پاشەکەوتکردنی پێکهاتە</span>
                </>
              )}
            </button>

            {/* Auto-Balance Button */}
            <button
              onClick={handleAutoBalance}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black flex items-center gap-1.5 transition shadow-2xs"
              title="دابەشکردنی یاریزانان بە شێوەیەکی دادپەروەرانە بەپێی نمرەی WPI"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>هاوسەنگکردنی زیرەکانە (50/50)</span>
            </button>

            {/* Clear Button */}
            <button
              onClick={handleClearPitch}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-bold transition"
              title="سڕینەوەی هەموو یاریزانەکان لەسەر یاریگا"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Export As Image Button */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>داگرتنی وێنەی پێکهاتە (PNG)</span>
            </button>

          </div>

        </div>

        {/* Match Settings Strip (Substitutes count, Match Title, Date) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-200 text-xs">
          
          {/* Match Title */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">
              ناونیشانی یاری:
            </label>
            <input
              type="text"
              value={matchState.title}
              onChange={(e) => updateMatchState({ ...matchState, title: e.target.value })}
              placeholder="نموونە: یاری دۆستانەی سێشەممە"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Match Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 font-bold text-xs">
                بەرواری یاری:
              </label>
              <button
                type="button"
                onClick={() => updateMatchState({ ...matchState, date: getTodayISODate() })}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Calendar className="w-3 h-3" />
                <span>ئەمڕۆ</span>
              </button>
            </div>
            <input
              type="date"
              value={matchState.date}
              onChange={(e) => updateMatchState({ ...matchState, date: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-500 text-sm"
            />
            <div className="mt-1 text-[11px] text-emerald-700 font-medium">
              {formatLiveKurdishFullDate(matchState.date)}
            </div>
          </div>

          {/* Substitutes Count Selector (Customizable: 0, 1, 2, 3, 4 subs) */}
          <div>
            <label className="block text-slate-600 font-bold mb-1 flex items-center justify-between">
              <span>ژمارەی یاریزانە یەدەگەکان (Substitutes):</span>
              <span className="text-emerald-700 font-extrabold">{matchState.subCount} یەدەگ</span>
            </label>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => handleSubCountChange(count)}
                  className={`flex-1 py-1.5 rounded-xl font-bold text-xs border transition ${
                    matchState.subCount === count
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {count === 0 ? 'بێ یەدەگ' : `${count} یەدەگ`}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 2. Team Customization Bar (Names, Colors, Formations) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Team A Customizer */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full ${kitA.bg} border ${kitA.border}`} />
              <h3 className="font-black text-slate-900 text-sm">
                تیمی یەکەم (Team A)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              ٦ سەرەکی + {matchState.subCount} یەدەگ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Team Name */}
            <div>
              <label className="block text-slate-600 font-bold mb-1">ناوی تیم:</label>
              <input
                type="text"
                value={matchState.teamA.name}
                onChange={(e) =>
                  updateMatchState({
                    ...matchState,
                    teamA: { ...matchState.teamA, name: e.target.value },
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
              />
            </div>

            {/* Kit Color */}
            <div>
              <label className="block text-slate-600 font-bold mb-1">ڕەنگی جلی یاریزان:</label>
              <select
                value={matchState.teamA.color}
                onChange={(e) =>
                  updateMatchState({
                    ...matchState,
                    teamA: { ...matchState.teamA, color: e.target.value as KitColor },
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
              >
                {Object.entries(KIT_COLORS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Formation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-600 font-bold">پێکهاتەی تەکتیکی:</label>
                {matchState.teamA.customPositions && (
                  <button
                    type="button"
                    onClick={() => handleResetPositions('A')}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-black flex items-center gap-0.5"
                    title="گەڕانەوە بۆ نەخشەی ستانداردی ئەم پێکهاتەیە"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>ڕێکخستنەوە</span>
                  </button>
                )}
              </div>
              <select
                value={matchState.teamA.formation}
                onChange={(e) => handleFormationChange('A', e.target.value as Formation6v6)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
              >
                {Object.entries(FORMATIONS_6V6).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Team B Customizer */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full ${kitB.bg} border ${kitB.border}`} />
              <h3 className="font-black text-slate-900 text-sm">
                تیمی دووەم (Team B)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              ٦ سەرەکی + {matchState.subCount} یەدەگ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Team Name */}
            <div>
              <label className="block text-slate-600 font-bold mb-1">ناوی تیم:</label>
              <input
                type="text"
                value={matchState.teamB.name}
                onChange={(e) =>
                  updateMatchState({
                    ...matchState,
                    teamB: { ...matchState.teamB, name: e.target.value },
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
              />
            </div>

            {/* Kit Color */}
            <div>
              <label className="block text-slate-600 font-bold mb-1">ڕەنگی جلی یاریزان:</label>
              <select
                value={matchState.teamB.color}
                onChange={(e) =>
                  updateMatchState({
                    ...matchState,
                    teamB: { ...matchState.teamB, color: e.target.value as KitColor },
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
              >
                {Object.entries(KIT_COLORS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Formation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-600 font-bold">پێکهاتەی تەکتیکی:</label>
                {matchState.teamB.customPositions && (
                  <button
                    type="button"
                    onClick={() => handleResetPositions('B')}
                    className="text-[10px] text-blue-700 hover:text-blue-800 font-black flex items-center gap-0.5"
                    title="گەڕانەوە بۆ نەخشەی ستانداردی ئەم پێکهاتەیە"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>ڕێکخستنەوە</span>
                  </button>
                )}
              </div>
              <select
                value={matchState.teamB.formation}
                onChange={(e) => handleFormationChange('B', e.target.value as Formation6v6)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:bg-white focus:border-emerald-500"
              >
                {Object.entries(FORMATIONS_6V6).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* 3. AI Dynamic Team Balance Score Banner */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          
          {/* Team B Snapshot */}
          <div className="flex items-center gap-3 order-2 md:order-1">
            <div className={`w-10 h-10 rounded-2xl ${kitB.bg} text-white flex items-center justify-center font-black text-sm border-2 ${kitB.border} shadow-2xs`}>
              B
            </div>
            <div>
              <div className="text-sm font-black text-slate-900">{matchState.teamB.name}</div>
              <div className="text-xs text-slate-600 font-bold flex items-center gap-2">
                <span>تێکڕای WPI: {balanceResult.teamBStats.avgWpi}</span>
                <span>•</span>
                <span>ڕەیتینگ: {balanceResult.teamBStats.avgRating}/10</span>
              </div>
            </div>
          </div>

          {/* Dynamic Match Balance Ratio Gauge (Center) */}
          <div className="flex-1 w-full max-w-md text-center order-1 md:order-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-800 mb-1.5">
              <span>{matchState.teamB.name}: {balanceResult.percentageB}%</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-black border border-slate-300">
                هاوسەنگی: {balanceResult.balanceIndex}%
              </span>
              <span>{matchState.teamA.name}: {balanceResult.percentageA}%</span>
            </div>

            {/* Split Progress Meter */}
            <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-300">
              <div
                style={{ width: `${balanceResult.percentageB}%`, backgroundColor: kitB.hex }}
                className="h-full transition-all duration-300"
              />
              <div
                style={{ width: `${balanceResult.percentageA}%`, backgroundColor: kitA.hex }}
                className="h-full transition-all duration-300"
              />
            </div>

            <div className={`mt-2 p-1.5 rounded-xl border text-[11px] font-bold ${balanceResult.verdict.color}`}>
              {balanceResult.verdict.title} — {balanceResult.verdict.message}
            </div>
          </div>

          {/* Team A Snapshot */}
          <div className="flex items-center gap-3 order-3">
            <div className="text-left">
              <div className="text-sm font-black text-slate-900">{matchState.teamA.name}</div>
              <div className="text-xs text-slate-600 font-bold flex items-center gap-2">
                <span>تێکڕای WPI: {balanceResult.teamAStats.avgWpi}</span>
                <span>•</span>
                <span>ڕەیتینگ: {balanceResult.teamAStats.avgRating}/10</span>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-2xl ${kitA.bg} text-slate-950 flex items-center justify-center font-black text-sm border-2 ${kitA.border} shadow-2xs`}>
              A
            </div>
          </div>

        </div>

        {/* Swap Mode Indicator */}
        {swapSource && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900 animate-pulse">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-700" />
              <span>
                <strong>دۆخی گۆڕینەوە چالاکە:</strong> کلیک لە شوێنێکی تر بکە لەسەر یاریگاکە یان لەناو یەدەگەکان تا شوێنی ئەم یاریزانەی لەگەڵ بگۆڕیتەوە.
              </span>
            </div>
            <button
              onClick={() => setSwapSource(null)}
              className="px-2.5 py-1 bg-white border border-amber-300 rounded-xl text-amber-900 font-bold hover:bg-amber-100 transition"
            >
              هەڵوەشاندنەوە
            </button>
          </div>
        )}

      </div>

      {/* 4. SMART MATCH OUTCOME & AUTOMATIC POINTS ALLOCATOR */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl border-2 border-emerald-500/40 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Strip */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shrink-0">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  ئەنجامی کۆتایی یاری و هەژمارکردنی خۆکارانەی نمرەکان
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Smart Result Allocator • ١-کلیک
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                تەنها تیمی براوە یان بەرامبەربوون دیاری بکە، ڕاستەوخۆ نمرەکان بۆ هەموو یاریزانەکان هەژمار دەکرێن و پاشەکەوت دەبن
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOutcomePanelOpen(!isOutcomePanelOpen)}
            className="self-end sm:self-auto px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
          >
            <span>{isOutcomePanelOpen ? 'داخستنی بەشەکە' : 'پیشاندانی خشتەی ئەنجام'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOutcomePanelOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isOutcomePanelOpen && (
          <div className="relative z-10 mt-5 space-y-5">
            
            {/* Success Feedback Banner with Instant Undo */}
            {outcomeSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400/80 text-emerald-200 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{outcomeSuccessMessage}</span>
                </div>
                {lastRecordedMatchId && onDeleteMatchHistory && (
                  <button
                    onClick={() => {
                      onDeleteMatchHistory(lastRecordedMatchId);
                      setLastRecordedMatchId(null);
                      setOutcomeSuccessMessage(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 transition shrink-0 shadow-md"
                  >
                    <Undo2 className="w-4 h-4" />
                    <span>پاشگەزبوونەوە (Undo)</span>
                  </button>
                )}
              </div>
            )}

            {/* Warning if no players assigned */}
            {(teamAPlayers.length === 0 || teamBPlayers.length === 0) && (
              <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  تکایە سەرەتا یاریزان بۆ {teamAPlayers.length === 0 ? matchState.teamA.name : ''} {teamBPlayers.length === 0 ? matchState.teamB.name : ''} لەسەر یاریگاکە دابنێ تاوەکو نمرەکانیان بۆ هەژمار بکرێت.
                </span>
              </div>
            )}

            {/* THE 3 DIRECT 1-CLICK OUTCOME CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Outcome 1: Team A Wins */}
              <div
                onClick={() => handleSelectOutcome('A')}
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedOutcome === 'A'
                    ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10 scale-[1.02]'
                    : 'bg-slate-800/60 hover:bg-slate-800/90 border-slate-700/80 hover:border-amber-400/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${kitA.bg} border ${kitA.border}`} />
                    <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wide">
                      بردنەوەی تیمی یەکەم
                    </span>
                  </div>
                  {selectedOutcome === 'A' && (
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                      ✓
                    </div>
                  )}
                </div>

                <div className="text-base font-black text-white mb-2">
                  🏆 {matchState.teamA.name} بردیەوە
                </div>

                {/* Benefits Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                    <span>{matchState.teamA.name} ({teamAPlayers.length} یاریزان)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 font-black">+٣ خاڵ (W)</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/40 text-slate-400 font-medium">
                    <span>{matchState.teamB.name} ({teamBPlayers.length} یاریزان)</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 font-bold">دۆڕان • ٠ خاڵ</span>
                  </div>
                </div>
              </div>

              {/* Outcome 2: Draw / Tie */}
              <div
                onClick={() => handleSelectOutcome('draw')}
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedOutcome === 'draw'
                    ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                    : 'bg-slate-800/60 hover:bg-slate-800/90 border-slate-700/80 hover:border-emerald-400/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🤝</span>
                    <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wide">
                      بەرامبەربوون
                    </span>
                  </div>
                  {selectedOutcome === 'draw' && (
                    <div className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center font-black text-xs">
                      ✓
                    </div>
                  )}
                </div>

                <div className="text-base font-black text-white mb-2">
                  🤝 بەرامبەربوون (یەکسانبوون)
                </div>

                {/* Benefits Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                    <span>هەردوو تیم ({teamAPlayers.length + teamBPlayers.length} یاریزان)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 font-black">+١ خاڵ (D)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 p-1 font-medium text-center">
                    هەموو یاریزانەکان خاڵی یەکسانبوون بەدەست دەهێنن
                  </div>
                </div>
              </div>

              {/* Outcome 3: Team B Wins */}
              <div
                onClick={() => handleSelectOutcome('B')}
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedOutcome === 'B'
                    ? 'bg-blue-500/15 border-blue-400 ring-2 ring-blue-400/40 shadow-lg shadow-blue-500/10 scale-[1.02]'
                    : 'bg-slate-800/60 hover:bg-slate-800/90 border-slate-700/80 hover:border-blue-400/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${kitB.bg} border ${kitB.border}`} />
                    <span className="text-xs font-extrabold text-blue-300 uppercase tracking-wide">
                      بردنەوەی تیمی دووەم
                    </span>
                  </div>
                  {selectedOutcome === 'B' && (
                    <div className="w-5 h-5 rounded-full bg-blue-400 text-slate-950 flex items-center justify-center font-black text-xs">
                      ✓
                    </div>
                  )}
                </div>

                <div className="text-base font-black text-white mb-2">
                  🏆 {matchState.teamB.name} بردیەوە
                </div>

                {/* Benefits Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                    <span>{matchState.teamB.name} ({teamBPlayers.length} یاریزان)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 font-black">+٣ خاڵ (W)</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/40 text-slate-400 font-medium">
                    <span>{matchState.teamA.name} ({teamAPlayers.length} یاریزان)</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 font-bold">دۆڕان • ٠ خاڵ</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Optional Goal Score Adjustment & Notes */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                
                {/* Score Controls */}
                <div className="flex items-center gap-3 w-full lg:w-auto justify-center">
                  
                  {/* Team A Score */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 whitespace-nowrap">{matchState.teamA.name}:</span>
                    <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => {
                          setCustomScoreMode(true);
                          setScoreA(Math.max(0, scoreA - 1));
                        }}
                        className="px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 font-black"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 font-black text-amber-300 text-sm">{scoreA}</span>
                      <button
                        onClick={() => {
                          setCustomScoreMode(true);
                          setScoreA(scoreA + 1);
                        }}
                        className="px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <span className="text-slate-500 font-black text-sm">:</span>

                  {/* Team B Score */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => {
                          setCustomScoreMode(true);
                          setScoreB(Math.max(0, scoreB - 1));
                        }}
                        className="px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 font-black"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 font-black text-blue-300 text-sm">{scoreB}</span>
                      <button
                        onClick={() => {
                          setCustomScoreMode(true);
                          setScoreB(scoreB + 1);
                        }}
                        className="px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 font-black"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs font-bold text-slate-300 whitespace-nowrap">{matchState.teamB.name}</span>
                  </div>

                </div>

                {/* Match Notes / Subtitle */}
                <div className="flex-1 w-full max-w-sm">
                  <input
                    type="text"
                    value={matchNotes}
                    onChange={(e) => setMatchNotes(e.target.value)}
                    placeholder="تێبینی یاری (ئارەزوومەندانە)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* BIG SAVE & APPLY ACTION BUTTON */}
                <button
                  onClick={handleApplyMatchOutcome}
                  disabled={!selectedOutcome || teamAPlayers.length === 0 || teamBPlayers.length === 0}
                  className={`w-full lg:w-auto px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 ${
                    !selectedOutcome || teamAPlayers.length === 0 || teamBPlayers.length === 0
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20 hover:scale-105 active:scale-95'
                  }`}
                >
                  <Save className="w-5 h-5 text-slate-950" />
                  <span>💾 پاشەکەوتکردنی ئەنجام و زیادکردنی نمرەکان بۆ ڕیزبەندی</span>
                </button>

              </div>
            </div>

            {/* LIVE PREVIEW OF AFFECTED PLAYERS & NEW SCORES */}
            {selectedOutcome && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                
                {/* Team A Players Live Status */}
                <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-3.5">
                  <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${kitA.bg} border ${kitA.border}`} />
                      <span className="text-xs font-bold text-slate-200">
                        یاریزانانی {matchState.teamA.name} ({teamAPlayers.length})
                      </span>
                    </div>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                      selectedOutcome === 'A'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : selectedOutcome === 'draw'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {selectedOutcome === 'A' ? '+٣ نمرە و +١ بردنەوە' : selectedOutcome === 'draw' ? '+١ نمرە و +١ بەرامبەر' : '٠ نمرە (دۆڕاو)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {teamAPlayers.map((p) => (
                      <div key={p.id} className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-800 shrink-0">
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-[9px] font-bold">{p.name.slice(0, 2)}</span>
                          )}
                        </div>
                        <span className="font-bold text-slate-200 truncate flex-1">{p.name}</span>
                        <span className={`text-[10px] font-black shrink-0 ${
                          selectedOutcome === 'A' ? 'text-emerald-400' : selectedOutcome === 'draw' ? 'text-amber-400' : 'text-slate-500'
                        }`}>
                          {selectedOutcome === 'A' ? '+3' : selectedOutcome === 'draw' ? '+1' : '0'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team B Players Live Status */}
                <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-3.5">
                  <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${kitB.bg} border ${kitB.border}`} />
                      <span className="text-xs font-bold text-slate-200">
                        یاریزانانی {matchState.teamB.name} ({teamBPlayers.length})
                      </span>
                    </div>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                      selectedOutcome === 'B'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : selectedOutcome === 'draw'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {selectedOutcome === 'B' ? '+٣ نمرە و +١ بردنەوە' : selectedOutcome === 'draw' ? '+١ نمرە و +١ بەرامبەر' : '٠ نمرە (دۆڕاو)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {teamBPlayers.map((p) => (
                      <div key={p.id} className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-800 shrink-0">
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-[9px] font-bold">{p.name.slice(0, 2)}</span>
                          )}
                        </div>
                        <span className="font-bold text-slate-200 truncate flex-1">{p.name}</span>
                        <span className={`text-[10px] font-black shrink-0 ${
                          selectedOutcome === 'B' ? 'text-emerald-400' : selectedOutcome === 'draw' ? 'text-amber-400' : 'text-slate-500'
                        }`}>
                          {selectedOutcome === 'B' ? '+3' : selectedOutcome === 'draw' ? '+1' : '0'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* RECENT MATCHES LOG IN LINEUP */}
            {matchHistory && matchHistory.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>دوایین یارییە تۆمارکراوەکان ({matchHistory.length} یاری)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  {matchHistory.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 shrink-0"
                    >
                      <span className="font-bold text-slate-300 truncate max-w-[100px]">{m.teamAName}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 font-black text-amber-400 text-[11px] border border-slate-700">
                        {m.scoreA} - {m.scoreB}
                      </span>
                      <span className="font-bold text-slate-300 truncate max-w-[100px]">{m.teamBName}</span>
                      {onDeleteMatchHistory && (
                        <button
                          onClick={() => onDeleteMatchHistory(m.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="سڕینەوە و گەڕاندنەوەی خاڵەکان"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* 5. THE INTERACTIVE TACTICAL FOOTBALL PITCH */}
      <div className="relative bg-slate-900 rounded-3xl p-3 sm:p-5 shadow-xl border-4 border-slate-800 overflow-hidden">
        
        {/* Active Swap Mode Alert Banner */}
        {swapSource && (
          <div className="mb-3 p-3.5 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-between gap-3 shadow-lg animate-pulse border border-amber-300">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <ArrowRightLeft className="w-5 h-5 shrink-0 text-slate-950" />
              <span>باری گۆڕینەوە چالاکە: کلیک لەسەر هەر یاریزانێکی تر یان یەدەگ بکە بۆ جێگۆڕکێ</span>
            </div>
            <button
              onClick={() => setSwapSource(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shrink-0"
            >
              پاشگەزبوونەوە ✕
            </button>
          </div>
        )}

        {/* Tactical Drag & Drop Info Banner */}
        <div className="mb-3.5 flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Move className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <span>دەتوانیت بە ماوس شوێنی هەر یاریزانێک لەسەر یاریگاکە بە دڵی خۆت ڕابکێشیت و بگوازیتەوە</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>(کلیک بکە بۆ گۆڕین یان ڕایکێشە بۆ دانانی شوێن)</span>
          </div>
        </div>

        {/* Pitch Container with Grass Pattern */}
        <div 
          ref={pitchRef}
          onPointerMove={handleTokenPointerMove}
          onPointerCancel={handleTokenPointerCancel}
          className="relative w-full aspect-[9/13] sm:aspect-[4/5] md:aspect-[3/4] max-w-4xl mx-auto rounded-2xl overflow-hidden bg-emerald-700 border-2 border-white/80 shadow-2xl select-none touch-none"
        >
          
          {/* Alternate Grass Stripes */}
          <div className="absolute inset-0 flex flex-col pointer-events-none opacity-30">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black/20' : 'bg-white/10'}`} />
            ))}
          </div>

          {/* Pitch Markings */}
          {/* Center Halfway Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/80 -translate-y-1/2" />
          
          {/* Center Circle & Spot */}
          <div className="absolute top-1/2 left-1/2 w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-white/80 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white -translate-x-1/2 -translate-y-1/2" />

          {/* Top Penalty Area (Team B Defense) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-80 h-24 sm:h-28 border-b-2 border-x-2 border-white/80 rounded-b-xl" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 sm:w-40 h-10 sm:h-12 border-b-2 border-x-2 border-white/80 rounded-b-md" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />

          {/* Bottom Penalty Area (Team A Defense) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 sm:w-80 h-24 sm:h-28 border-t-2 border-x-2 border-white/80 rounded-t-xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 sm:w-40 h-10 sm:h-12 border-t-2 border-x-2 border-white/80 rounded-t-md" />
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />

          {/* Team B Formation Label (Top) */}
          <div className="absolute top-2.5 right-3 bg-black/50 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold border border-white/20 flex items-center gap-1.5 z-10">
            <span className={`w-2.5 h-2.5 rounded-full ${kitB.bg}`} />
            <span>{matchState.teamB.name} ({formationB.name.split(' ')[0]})</span>
            {matchState.teamB.customPositions && (
              <span className="px-1.5 py-0.2 rounded-md bg-blue-500/30 text-blue-200 text-[9px] border border-blue-400/40">
                دەستکارییکراو ✍️
              </span>
            )}
          </div>

          {/* Team A Formation Label (Bottom) */}
          <div className="absolute bottom-2.5 left-3 bg-black/50 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold border border-white/20 flex items-center gap-1.5 z-10">
            <span className={`w-2.5 h-2.5 rounded-full ${kitA.bg}`} />
            <span>{matchState.teamA.name} ({formationA.name.split(' ')[0]})</span>
            {matchState.teamA.customPositions && (
              <span className="px-1.5 py-0.2 rounded-md bg-yellow-500/30 text-yellow-200 text-[9px] border border-yellow-400/40">
                دەستکارییکراو ✍️
              </span>
            )}
          </div>

          {/* RENDER TEAM B PLAYERS (TOP HALF - BLUE THEME) */}
          {currentPositionsB.map((pos, idx) => {
            const playerId = matchState.teamB.starterIds[idx];
            const player = playerId ? playerMap.get(playerId) || null : null;
            const isSwapTarget = swapSource?.team === 'B' && swapSource?.type === 'starter' && swapSource?.index === idx;
            const isDragging = draggingSlot?.team === 'B' && draggingSlot?.index === idx;

            return (
              <div
                key={`b-starter-${idx}`}
                style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
                onPointerDown={(e) => handleTokenPointerDown(e, 'B', idx)}
                onPointerUp={(e) => handleTokenPointerUp(e, 'B', idx)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none ${
                  isDragging 
                    ? 'z-40 scale-115 transition-none drop-shadow-2xl' 
                    : 'transition-all duration-500 ease-out z-20 hover:scale-105'
                } ${isSwapTarget ? 'scale-110 animate-bounce' : ''}`}
              >
                <div className="flex flex-col items-center">
                  
                  {/* Player Avatar Head & Dynamic Team Jersey */}
                  <div className="flex flex-col items-center relative">
                    {/* Head Avatar */}
                    <div className={`relative z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black shadow-md transition-all ${
                      player 
                        ? `${kitB.bg} text-white ring-2 ring-white border border-slate-900 overflow-hidden` 
                        : 'bg-emerald-950/80 border-2 border-dashed border-white/60 text-white/60 hover:border-white hover:text-white'
                    } ${isDragging ? 'ring-4 ring-blue-400 shadow-xl' : ''}`}>
                      {player ? (
                        player.avatar ? (
                          <img 
                            src={player.avatar} 
                            alt={player.name} 
                            className="w-full h-full object-cover rounded-full pointer-events-none" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs sm:text-sm font-bold">{player.name.slice(0, 2)}</span>
                        )
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>

                    {/* Dynamic Team Jersey with Squad Number */}
                    <div className="-mt-2 sm:-mt-2.5 z-0 pointer-events-none">
                      <FootballJersey
                        hex={kitB.hex}
                        darkHex={kitB.darkHex}
                        textColor={kitB.text}
                        squadNumber={idx + 1}
                        className="w-10 h-8 sm:w-12 sm:h-9.5"
                      />
                    </div>
                  </div>

                  {/* Player Name Pill (Blue Style) */}
                  <div className="mt-0.5 px-2 py-0.5 rounded-lg bg-slate-950/90 backdrop-blur-xs text-blue-300 text-[10px] sm:text-xs font-black border border-blue-400 whitespace-nowrap shadow-sm text-center max-w-[95px] sm:max-w-[115px] truncate pointer-events-none">
                    {player ? player.name : pos.label}
                  </div>

                  {/* Rating / Position Pill */}
                  <div className="text-[9px] sm:text-[10px] font-extrabold text-blue-200 drop-shadow-md pointer-events-none">
                    {player ? `★ ${player.fairScore} (${pos.label})` : `(${pos.label})`}
                  </div>

                </div>
              </div>
            );
          })}

          {/* RENDER TEAM A PLAYERS (BOTTOM HALF - YELLOW THEME) */}
          {currentPositionsA.map((pos, idx) => {
            const playerId = matchState.teamA.starterIds[idx];
            const player = playerId ? playerMap.get(playerId) || null : null;
            const isSwapTarget = swapSource?.team === 'A' && swapSource?.type === 'starter' && swapSource?.index === idx;
            const isDragging = draggingSlot?.team === 'A' && draggingSlot?.index === idx;

            return (
              <div
                key={`a-starter-${idx}`}
                style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
                onPointerDown={(e) => handleTokenPointerDown(e, 'A', idx)}
                onPointerUp={(e) => handleTokenPointerUp(e, 'A', idx)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none ${
                  isDragging 
                    ? 'z-40 scale-115 transition-none drop-shadow-2xl' 
                    : 'transition-all duration-500 ease-out z-20 hover:scale-105'
                } ${isSwapTarget ? 'scale-110 animate-bounce' : ''}`}
              >
                <div className="flex flex-col items-center">
                  
                  {/* Player Avatar Head & Dynamic Team Jersey */}
                  <div className="flex flex-col items-center relative">
                    {/* Head Avatar */}
                    <div className={`relative z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black shadow-md transition-all ${
                      player 
                        ? `${kitA.bg} text-slate-950 ring-2 ring-white border border-slate-900 overflow-hidden` 
                        : 'bg-emerald-950/80 border-2 border-dashed border-white/60 text-white/60 hover:border-white hover:text-white'
                    } ${isDragging ? 'ring-4 ring-yellow-400 shadow-xl' : ''}`}>
                      {player ? (
                        player.avatar ? (
                          <img 
                            src={player.avatar} 
                            alt={player.name} 
                            className="w-full h-full object-cover rounded-full pointer-events-none" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs sm:text-sm font-bold">{player.name.slice(0, 2)}</span>
                        )
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>

                    {/* Dynamic Team Jersey with Squad Number */}
                    <div className="-mt-2 sm:-mt-2.5 z-0 pointer-events-none">
                      <FootballJersey
                        hex={kitA.hex}
                        darkHex={kitA.darkHex}
                        textColor={kitA.text}
                        squadNumber={idx + 1}
                        className="w-10 h-8 sm:w-12 sm:h-9.5"
                      />
                    </div>
                  </div>

                  {/* Player Name Pill (Yellow Style) */}
                  <div className="mt-0.5 px-2 py-0.5 rounded-lg bg-slate-950/90 backdrop-blur-xs text-yellow-300 text-[10px] sm:text-xs font-black border border-yellow-400 whitespace-nowrap shadow-sm text-center max-w-[95px] sm:max-w-[115px] truncate pointer-events-none">
                    {player ? player.name : pos.label}
                  </div>

                  {/* Rating / Position Pill */}
                  <div className="text-[9px] sm:text-[10px] font-extrabold text-yellow-200 drop-shadow-md pointer-events-none">
                    {player ? `★ ${player.fairScore} (${pos.label})` : `(${pos.label})`}
                  </div>

                </div>
              </div>
            );
          })}

        </div>

      </div>

      {/* 5. Substitutes Bench Area (یاریزانانی یەدەگ) */}
      {matchState.subCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Team A Substitutes Bench */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full ${kitA.bg} border ${kitA.border}`} />
                <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                  یەدەگەکانی {matchState.teamA.name} ({matchState.subCount} یاریزان)
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">
                کلیک بکە بۆ دیاریکردن یان گۆڕینەوە
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {matchState.teamA.substituteIds.map((id, idx) => {
                const player = id ? playerMap.get(id) || null : null;
                const isSwapTarget = swapSource?.team === 'A' && swapSource?.type === 'sub' && swapSource?.index === idx;

                return (
                  <div
                    key={`a-sub-${idx}`}
                    onClick={() => handleSlotClick('A', 'sub', idx)}
                    className={`flex items-center gap-2 p-2 rounded-2xl border-2 cursor-pointer transition ${
                      isSwapTarget
                        ? 'border-yellow-500 bg-yellow-100 shadow-md animate-pulse'
                        : player
                        ? 'bg-yellow-50/60 hover:bg-yellow-100/60 border-yellow-300'
                        : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-yellow-50 hover:border-yellow-400'
                    }`}
                  >
                    <div className="relative shrink-0 flex items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs overflow-hidden ring-2 ring-yellow-400 border border-white ${
                        player ? `${kitA.bg} text-slate-950` : 'bg-slate-200 text-slate-500'
                      }`}>
                        {player ? (
                          player.avatar ? (
                            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            player.name.slice(0, 2)
                          )
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </div>
                      {player && (
                        <div className="-mr-2 z-10">
                          <FootballJersey
                            hex={kitA.hex}
                            darkHex={kitA.darkHex}
                            textColor={kitA.text}
                            squadNumber={idx + 7}
                            className="w-6 h-5"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-amber-900 truncate">
                        {player ? player.name : `یەدەگ ${idx + 1}`}
                      </div>
                      <div className="text-[10px] text-amber-700 font-bold">
                        {player ? `WPI: ${player.fairScore}` : 'شوێنی بەتاڵ'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team B Substitutes Bench */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full ${kitB.bg} border ${kitB.border}`} />
                <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                  یەدەگەکانی {matchState.teamB.name} ({matchState.subCount} یاریزان)
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">
                کلیک بکە بۆ دیاریکردن یان گۆڕینەوە
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {matchState.teamB.substituteIds.map((id, idx) => {
                const player = id ? playerMap.get(id) || null : null;
                const isSwapTarget = swapSource?.team === 'B' && swapSource?.type === 'sub' && swapSource?.index === idx;

                return (
                  <div
                    key={`b-sub-${idx}`}
                    onClick={() => handleSlotClick('B', 'sub', idx)}
                    className={`flex items-center gap-2 p-2 rounded-2xl border-2 cursor-pointer transition ${
                      isSwapTarget
                        ? 'border-blue-500 bg-blue-100 shadow-md animate-pulse'
                        : player
                        ? 'bg-blue-50/60 hover:bg-blue-100/60 border-blue-300'
                        : 'border-dashed border-slate-300 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-400'
                    }`}
                  >
                    <div className="relative shrink-0 flex items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs overflow-hidden ring-2 ring-blue-500 border border-white ${
                        player ? `${kitB.bg} text-white` : 'bg-slate-200 text-slate-500'
                      }`}>
                        {player ? (
                          player.avatar ? (
                            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            player.name.slice(0, 2)
                          )
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </div>
                      {player && (
                        <div className="-mr-2 z-10">
                          <FootballJersey
                            hex={kitB.hex}
                            darkHex={kitB.darkHex}
                            textColor={kitB.text}
                            squadNumber={idx + 7}
                            className="w-6 h-5"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-blue-900 truncate">
                        {player ? player.name : `یەدەگ ${idx + 1}`}
                      </div>
                      <div className="text-[10px] text-blue-700 font-bold">
                        {player ? `WPI: ${player.fairScore}` : 'شوێنی بەتاڵ'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 6. Unassigned Available Players Pool */}
      {unassignedPlayers.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>یاریزانە بەردەستەکانی تر لە خولەکەدا ({unassignedPlayers.length} یاریزان)</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              دەتوانیت هەر یاریزانێک دیاری بکەیت و لەسەر یاریگاکە دایبنێیت
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {unassignedPlayers.map((player) => (
              <div
                key={player.id}
                onClick={() => {
                  // If slot is selected, assign directly
                  if (selectedSlot) {
                    handleAssignPlayer(player.id);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 cursor-pointer transition shrink-0"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center overflow-hidden">
                  {player.avatar ? (
                    <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    player.name.slice(0, 1)
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800">{player.name}</span>
                <span className="text-[10px] text-slate-500">★{player.fairScore}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Quick Player Picker Modal */}
      {isPlayerPickerOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto text-slate-900 max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                  ⚽
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    هەڵبژاردنی یاریزان بۆ {selectedSlot.team === 'A' ? matchState.teamA.name : matchState.teamB.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedSlot.type === 'starter' ? `یاریزانی سەرەکی #${selectedSlot.index + 1}` : `یاریزانی یەدەگ #${selectedSlot.index + 1}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsPlayerPickerOpen(false);
                  setSelectedSlot(null);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions in Picker */}
            <div className="flex items-center gap-2 my-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="گەڕان بەپێی ناو..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-9 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {/* Start Slot Swap Mode */}
              <button
                onClick={() => {
                  const currentId =
                    selectedSlot.team === 'A'
                      ? selectedSlot.type === 'starter'
                        ? matchState.teamA.starterIds[selectedSlot.index]
                        : matchState.teamA.substituteIds[selectedSlot.index]
                      : selectedSlot.type === 'starter'
                      ? matchState.teamB.starterIds[selectedSlot.index]
                      : matchState.teamB.substituteIds[selectedSlot.index];

                  setSwapSource({
                    team: selectedSlot.team,
                    type: selectedSlot.type,
                    index: selectedSlot.index,
                    playerId: currentId,
                  });
                  setIsPlayerPickerOpen(false);
                  setSelectedSlot(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1 transition"
                title="گۆڕینەوەی شوێن لەگەڵ یاریزانێکی تر"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                <span>گۆڕینەوە</span>
              </button>

              {/* Remove / Empty Slot */}
              <button
                onClick={() => handleAssignPlayer(null)}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
                title="بەتاڵکردنەوەی شوێنەکە"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Players List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {/* Active eligible players */}
              {players
                .filter((p) => p.status !== 'injured')
                .filter((p) =>
                  p.name.toLowerCase().includes(pickerSearch.toLowerCase().trim())
                )
                .map((player) => {
                  const isAssigned = assignedPlayerIds.has(player.id);
                  const isCurrentlyInThisSlot =
                    selectedSlot.team === 'A'
                      ? selectedSlot.type === 'starter'
                        ? matchState.teamA.starterIds[selectedSlot.index] === player.id
                        : matchState.teamA.substituteIds[selectedSlot.index] === player.id
                      : selectedSlot.type === 'starter'
                      ? matchState.teamB.starterIds[selectedSlot.index] === player.id
                      : matchState.teamB.substituteIds[selectedSlot.index] === player.id;

                  return (
                    <div
                      key={player.id}
                      onClick={() => handleAssignPlayer(player.id)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition ${
                        isCurrentlyInThisSlot
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-black'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs overflow-hidden">
                          {player.avatar ? (
                            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            player.name.slice(0, 2)
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{player.name}</span>
                            {player.rank <= 3 && (
                              <span className="text-[10px]">👑</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {player.position === 'goalkeeper' ? 'گۆڵپارێز' : player.position === 'defender' ? 'بەرگریکار' : player.position === 'forward' ? 'هێرشبەر' : 'ناوەڕاست'} • {player.totalMatches} یاری • {player.winRate}% بردنەوە
                          </div>
                        </div>
                      </div>

                      <div className="text-left flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-black text-xs border border-emerald-200">
                          WPI: {player.fairScore}
                        </span>
                        {isCurrentlyInThisSlot && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                    </div>
                  );
                })}

              {/* Injured players section (Disabled / Excluded) */}
              {players.some((p) => p.status === 'injured') && (
                <div className="pt-3 mt-2 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-rose-600 mb-1.5 flex items-center gap-1 px-1">
                    <span>🩹</span>
                    <span>یاریزانانی پێکراو (ناچالاک - دەرهێنراو لە پێکهاتە):</span>
                  </div>
                  {players
                    .filter((p) => p.status === 'injured')
                    .filter((p) =>
                      p.name.toLowerCase().includes(pickerSearch.toLowerCase().trim())
                    )
                    .map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 opacity-60 cursor-not-allowed mb-1"
                        title="ئەم یاریزانە تووشی پێکان بووە و ناتوانرێت لە پێکهاتە دابنرێت"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden">
                            {player.avatar ? (
                              <img src={player.avatar} alt={player.name} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
                            ) : (
                              player.name.slice(0, 2)
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-700">{player.name}</span>
                            <div className="text-[10px] text-rose-600 font-semibold">توشی پێکان بووە</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                          دەرهێنراو
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Close */}
            <div className="pt-3 border-t border-slate-200 mt-2 flex justify-end">
              <button
                onClick={() => {
                  setIsPlayerPickerOpen(false);
                  setSelectedSlot(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                داخستن
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 2: High Quality Image Export Modal */}
      {isExportModalOpen && (
        <ExportLineupImageModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          matchState={matchState}
          players={players}
          leagueTitle={leagueTitle}
        />
      )}

    </div>
  );
};
