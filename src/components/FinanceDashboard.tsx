import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  TrendingUp, 
  Receipt, 
  Building, 
  FileSpreadsheet, 
  LayoutGrid, 
  CheckCircle, 
  ShieldCheck,
  Users, 
  Edit3, 
  X, 
  Save,
  Palette,
  RotateCcw,
  Type
} from 'lucide-react';
import { Player, WeeklyFinanceSession, ExpenseItem, PlayerFinanceRecord, PlayerAttendanceStatus } from '../types';
import { 
  getTuesdaysForYear, 
  getClosestTuesday, 
  getTuesdaysForMonth,
  formatKurdishDate, 
  formatDisplayDate, 
  formatCurrency, 
  createInitialSession, 
  computeSessionSummary, 
  computeMultiSessionSummary, 
  calculatePlayerDebtsUpToSession,
  isGoalkeeper,
  KURDISH_MONTHS 
} from '../utils/financeUtils';
import { getTodayLiveDetails } from '../utils/dateHelper';
import { loadFullAppState } from '../utils/persistentStorage';
import { ExportFinanceImageModal } from './ExportFinanceImageModal';

/**
 * Helper to determine if a HEX color is light or dark
 */
export function isColorDark(hex: string): boolean {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
  let c = hex.substring(1);
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return false;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 155;
}

export const FINANCE_PAGE_PRESETS = [
  { id: 'white', name: 'سپی (White HD)', hex: '#ffffff' },
  { id: 'pearl', name: 'مرواری (Pearl)', hex: '#f8fafc' },
  { id: 'cream', name: 'کرێمی نەرم (Cream)', hex: '#faf8f5' },
  { id: 'mint', name: 'نەعنای کاڵ (Mint)', hex: '#ecfdf5' },
  { id: 'sky', name: 'ئاسمانی کاڵ (Sky)', hex: '#f0f9ff' },
  { id: 'rose', name: 'پەمەیی کاڵ (Rose)', hex: '#fff1f2' },
  { id: 'slate_light', name: 'خۆڵەمێشی (Slate)', hex: '#f1f5f9' },
  { id: 'dark', name: 'تاریک (Dark Slate)', hex: '#0f172a' },
  { id: 'emerald', name: 'سەوز (Emerald)', hex: '#022c22' },
  { id: 'navy', name: 'شین (Navy)', hex: '#0b132b' },
  { id: 'purple', name: 'مۆر (Purple)', hex: '#1e1035' },
];

export const FINANCE_TEXT_PRESETS = [
  { id: 'auto', name: 'خودکار (Smart Auto)', hex: 'auto' },
  { id: 'black', name: 'ڕەشی تەواو (Pure Black)', hex: '#000000' },
  { id: 'slate', name: 'نیلی تۆخ (Deep Slate)', hex: '#0f172a' },
  { id: 'navy', name: 'شینی دەریایی (Navy)', hex: '#1e3a8a' },
  { id: 'emerald', name: 'سەوزی نەوتی (Emerald)', hex: '#064e3b' },
  { id: 'coffee', name: 'قاوەیی خەست (Espresso)', hex: '#38220f' },
  { id: 'purple', name: 'مۆری شاهانە (Purple)', hex: '#4a044e' },
  { id: 'white', name: 'سپی بەفری (Snow White)', hex: '#ffffff' },
];

interface FinanceDashboardProps {
  players: Player[];
  sessions: WeeklyFinanceSession[];
  onSaveSessions: (sessions: WeeklyFinanceSession[]) => void;
  leagueTitle?: string;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  players,
  sessions,
  onSaveSessions,
  leagueTitle = 'ڕێزبەندی Rizbandy',
}) => {
  const currentYear = new Date().getFullYear();
  const todayDetails = useMemo(() => getTodayLiveDetails(), []);
  const allTuesdays = useMemo(() => getTuesdaysForYear(currentYear), [currentYear]);
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const closest = getClosestTuesday();
    return closest;
  });

  const [viewMode, setViewMode] = useState<'matrix' | 'single'>('matrix');

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const todayMonth = new Date().getMonth() + 1;
    return todayMonth;
  });

  const [matrixRangeCount] = useState<number>(6);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportMode, setExportMode] = useState<'matrix' | 'single'>('matrix');
  const [showSheetsFormulaGuide, setShowSheetsFormulaGuide] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [saveBannerMessage, setSaveBannerMessage] = useState('');

  // Page background color state for Finance Dashboard
  const [financePageBg, setFinancePageBg] = useState<string>(() => {
    const saved = localStorage.getItem('finance_page_bg_color');
    // If previously dark/black was stored, clear it to pure white per user request
    if (!saved || saved === '#0f172a' || saved === '#000000' || saved === '#0b132b' || saved === '#022c22' || saved === '#1e1035') {
      return '#ffffff';
    }
    return saved;
  });

  // Font/text color state for Finance Dashboard
  const [financeTextColor, setFinanceTextColor] = useState<string>(() => {
    return localStorage.getItem('finance_text_color') || 'auto';
  });

  const isDark = useMemo(() => isColorDark(financePageBg), [financePageBg]);

  // Computed text color for sharp readability
  const activeTextColor = useMemo(() => {
    if (financeTextColor && financeTextColor !== 'auto') {
      return financeTextColor;
    }
    return isDark ? '#f8fafc' : '#0f172a';
  }, [financeTextColor, isDark]);

  // Derived subtext color for secondary labels
  const activeSubtextColor = useMemo(() => {
    if (financeTextColor && financeTextColor !== 'auto') {
      return financeTextColor;
    }
    return isDark ? '#94a3b8' : '#475569';
  }, [financeTextColor, isDark]);

  const handlePageColorChange = (newHex: string) => {
    setFinancePageBg(newHex);
    try {
      localStorage.setItem('finance_page_bg_color', newHex);
    } catch (e) {
      console.warn('Failed to save finance page color', e);
    }
  };

  const handleTextColorChange = (newHex: string) => {
    setFinanceTextColor(newHex);
    try {
      localStorage.setItem('finance_text_color', newHex);
    } catch (e) {
      console.warn('Failed to save finance text color', e);
    }
  };

  const handleResetToPureWhite = () => {
    handlePageColorChange('#ffffff');
    handleTextColorChange('auto');
  };

  // Editable Modals State for Pitch Rent & Other Expenses
  const [isEditPitchModalOpen, setIsEditPitchModalOpen] = useState(false);
  const [pitchEditMode, setPitchEditMode] = useState<'total' | 'per_session' | 'custom_sessions'>('total');
  const [customPitchTotalInput, setCustomPitchTotalInput] = useState<number>(150000);
  const [customPitchPerSessionInput, setCustomPitchPerSessionInput] = useState<number>(30000);
  const [customPitchSessionMap, setCustomPitchSessionMap] = useState<Record<string, number>>({});

  // Dynamic Player Fee Modal State
  const [isEditPlayerFeeModalOpen, setIsEditPlayerFeeModalOpen] = useState(false);
  const [customPlayerFeeInput, setCustomPlayerFeeInput] = useState<number>(5000);
  const [playerFeeApplyTarget, setPlayerFeeApplyTarget] = useState<'all' | 'single'>('all');

  const [isEditExpensesModalOpen, setIsEditExpensesModalOpen] = useState(false);
  const [tempExpenseItems, setTempExpenseItems] = useState<ExpenseItem[]>([]);

  const matrixTuesdays = useMemo(() => {
    if (selectedMonth > 0) {
      const monthTuesdays = getTuesdaysForMonth(currentYear, selectedMonth);
      if (monthTuesdays.length > 0) {
        return monthTuesdays;
      }
    }
    const idx = allTuesdays.indexOf(selectedDate);
    const start = Math.max(0, idx >= 0 ? idx - 2 : 0);
    return allTuesdays.slice(start, start + matrixRangeCount);
  }, [allTuesdays, selectedMonth, currentYear, selectedDate, matrixRangeCount]);

  const sessionMap = useMemo(() => {
    const map = new Map<string, WeeklyFinanceSession>();
    sessions.forEach((s) => map.set(s.date, s));

    allTuesdays.forEach((tDate) => {
      if (!map.has(tDate)) {
        map.set(tDate, createInitialSession(tDate, players, {}, 5000, 25000));
      }
    });

    return map;
  }, [sessions, allTuesdays, players]);

  const currentSession = useMemo(() => {
    const existing = sessions.find((s) => s.date === selectedDate);
    if (existing) {
      const updatedRecords = { ...existing.records };
      let changed = false;
      players.forEach((p) => {
        if (!updatedRecords[p.id]) {
          const isGK = isGoalkeeper(p);
          const isInjured = p.status === 'injured';
          const status: PlayerAttendanceStatus = isInjured ? 'absent' : isGK ? 'exempt' : 'attended';
          const baseFee = status === 'attended' ? (existing.standardFeePerPlayer || 5000) : 0;
          updatedRecords[p.id] = {
            playerId: p.id,
            playerName: p.name,
            attended: status === 'attended',
            status: status,
            isExempt: isGK,
            standardFee: baseFee,
            previousDebt: 0,
            totalRequired: baseFee,
            paidAmount: status === 'attended' ? baseFee : 0,
            currentDebt: 0,
            isSettled: true,
            note: isInjured ? '🩹 پێکان (دەرهێنراو لە حیسابات)' : isGK ? 'بەخشراو (گۆڵچی)' : ''
          };
          changed = true;
        }
      });
      return changed ? { ...existing, records: updatedRecords } : existing;
    }

    const prevDebts = calculatePlayerDebtsUpToSession(sessions, '', players);
    return createInitialSession(selectedDate, players, prevDebts, 5000, 25000);
  }, [sessions, selectedDate, players]);

  const singleSummary = useMemo(() => computeSessionSummary(currentSession), [currentSession]);

  const matrixSummary = useMemo(() => {
    const relevantSessions = matrixTuesdays.map((tDate) => sessionMap.get(tDate) || createInitialSession(tDate, players));
    return computeMultiSessionSummary(relevantSessions);
  }, [matrixTuesdays, sessionMap, players]);

  const activeSummary = viewMode === 'matrix' ? matrixSummary : {
    totalIncome: singleSummary.totalCollected,
    totalPitchRent: singleSummary.totalPitchCost,
    totalOtherExpenses: singleSummary.totalOtherExpenses,
    totalExpenses: singleSummary.totalExpenses,
    netBalance: singleSummary.remainingBalance,
    totalOutstandingDebt: singleSummary.totalOutstandingDebt,
    sessionsCount: 1
  };

  const triggerSaveBanner = () => {
    setSaveBannerMessage('پاشەکەوت کرا ✅');
    setTimeout(() => setSaveBannerMessage(''), 2000);
  };

  const updateSingleSession = (newSession: WeeklyFinanceSession) => {
    const index = sessions.findIndex((s) => s.date === newSession.date);
    let updatedSessions: WeeklyFinanceSession[];
    if (index >= 0) {
      updatedSessions = [...sessions];
      updatedSessions[index] = newSession;
    } else {
      updatedSessions = [...sessions, newSession];
    }
    onSaveSessions(updatedSessions);
    triggerSaveBanner();
  };

  const updateMultipleSessions = (updatedList: WeeklyFinanceSession[]) => {
    const newSessions = [...sessions];
    updatedList.forEach((upSess) => {
      const idx = newSessions.findIndex((s) => s.date === upSess.date);
      if (idx >= 0) {
        newSessions[idx] = upSess;
      } else {
        newSessions.push(upSess);
      }
    });
    onSaveSessions(newSessions);
    triggerSaveBanner();
  };

  const openEditPlayerFeeModal = () => {
    setCustomPlayerFeeInput(currentSession.standardFeePerPlayer || 5000);
    setIsEditPlayerFeeModalOpen(true);
  };

  const handleSavePlayerFeeModal = () => {
    const fee = Math.max(0, customPlayerFeeInput);
    const targetDates = playerFeeApplyTarget === 'all' 
      ? (matrixTuesdays.length > 0 ? matrixTuesdays : allTuesdays) 
      : [selectedDate];
    
    const updatedSessions: WeeklyFinanceSession[] = [];

    targetDates.forEach((tDate) => {
      const baseSession = sessionMap.get(tDate) || createInitialSession(tDate, players);
      const updatedRecords: Record<string, PlayerFinanceRecord> = {};

      (Object.entries(baseSession.records || {}) as [string, PlayerFinanceRecord][]).forEach(([pId, r]) => {
        const isAttended = r.status === 'attended' || (r.attended && !r.isExempt);
        const baseFee = isAttended ? fee : 0;
        const totalReq = baseFee + (r.previousDebt || 0);
        const paid = isAttended ? (r.paidAmount === baseSession.standardFeePerPlayer ? fee : r.paidAmount) : 0;
        const debt = Math.max(0, totalReq - paid);

        updatedRecords[pId] = {
          ...r,
          standardFee: baseFee,
          totalRequired: totalReq,
          paidAmount: paid,
          currentDebt: debt,
          isSettled: debt === 0,
        };
      });

      updatedSessions.push({
        ...baseSession,
        standardFeePerPlayer: fee,
        records: updatedRecords,
      });
    });

    updateMultipleSessions(updatedSessions);
    setIsEditPlayerFeeModalOpen(false);
  };

  const openEditPitchModal = () => {
    const currentTotal = activeSummary.totalPitchRent;
    setCustomPitchTotalInput(currentTotal > 0 ? currentTotal : 150000);

    const count = viewMode === 'matrix' ? (matrixTuesdays.length || 1) : 1;
    const perSession = viewMode === 'matrix' 
      ? Math.round(currentTotal / count) 
      : (currentSession.pitchCost || 25000);
    setCustomPitchPerSessionInput(perSession > 0 ? perSession : 30000);

    const initialMap: Record<string, number> = {};
    if (viewMode === 'matrix') {
      matrixTuesdays.forEach((tDate) => {
        const s = sessionMap.get(tDate);
        initialMap[tDate] = s ? Number(s.pitchCost) || 0 : perSession;
      });
    } else {
      initialMap[selectedDate] = Number(currentSession.pitchCost) || perSession;
    }
    setCustomPitchSessionMap(initialMap);
    setPitchEditMode('total');
    setIsEditPitchModalOpen(true);
  };

  const handleSavePitchModal = () => {
    if (viewMode === 'single') {
      const newCost = Math.max(0, customPitchTotalInput);
      updateSingleSession({
        ...currentSession,
        pitchCost: newCost
      });
      setIsEditPitchModalOpen(false);
      return;
    }

    const targetDates = matrixTuesdays.length > 0 ? matrixTuesdays : [selectedDate];
    const updatedSessions: WeeklyFinanceSession[] = [];

    if (pitchEditMode === 'total') {
      const total = Math.max(0, customPitchTotalInput);
      const perTuesday = Math.round(total / targetDates.length);
      targetDates.forEach((tDate, idx) => {
        const baseSession = sessionMap.get(tDate) || createInitialSession(tDate, players);
        const allocated = idx === targetDates.length - 1 ? (total - perTuesday * (targetDates.length - 1)) : perTuesday;
        updatedSessions.push({
          ...baseSession,
          pitchCost: Math.max(0, allocated)
        });
      });
    } else if (pitchEditMode === 'per_session') {
      const perTuesday = Math.max(0, customPitchPerSessionInput);
      targetDates.forEach((tDate) => {
        const baseSession = sessionMap.get(tDate) || createInitialSession(tDate, players);
        updatedSessions.push({
          ...baseSession,
          pitchCost: perTuesday
        });
      });
    } else {
      targetDates.forEach((tDate) => {
        const baseSession = sessionMap.get(tDate) || createInitialSession(tDate, players);
        const cost = customPitchSessionMap[tDate] !== undefined ? Math.max(0, customPitchSessionMap[tDate]) : (Number(baseSession.pitchCost) || 25000);
        updatedSessions.push({
          ...baseSession,
          pitchCost: cost
        });
      });
    }

    updateMultipleSessions(updatedSessions);
    setIsEditPitchModalOpen(false);
  };

  const openEditExpensesModal = () => {
    const currentTotal = activeSummary.totalOtherExpenses;
    const items: ExpenseItem[] = [];
    if (viewMode === 'single') {
      if (currentSession.otherExpenses && currentSession.otherExpenses.length > 0) {
        items.push(...currentSession.otherExpenses);
      } else if (currentTotal > 0) {
        items.push({ id: `exp_${Date.now()}`, title: 'کڕینی تۆپ و پێداویستی', amount: currentTotal });
      } else {
        items.push({ id: `exp_${Date.now()}`, title: 'کڕینی تۆپ', amount: 15000 });
        items.push({ id: `exp_${Date.now() + 1}`, title: 'ئاو و شەربەت', amount: 5000 });
      }
    } else {
      const existingExpenses: ExpenseItem[] = [];
      matrixTuesdays.forEach((tDate) => {
        const s = sessionMap.get(tDate);
        if (s?.otherExpenses && s.otherExpenses.length > 0) {
          existingExpenses.push(...s.otherExpenses);
        }
      });

      if (existingExpenses.length > 0) {
        items.push(...existingExpenses);
      } else {
        items.push({ id: `exp_1`, title: 'کڕینی تۆپی نوێ', amount: 15000 });
        items.push({ id: `exp_2`, title: 'ئاو و شەربەت بۆ یاریزانان', amount: 5000 });
      }
    }

    setTempExpenseItems(items);
    setIsEditExpensesModalOpen(true);
  };

  const handleSaveExpensesModal = () => {
    const targetDates = viewMode === 'matrix' ? (matrixTuesdays.length > 0 ? matrixTuesdays : [selectedDate]) : [selectedDate];
    const updatedSessions: WeeklyFinanceSession[] = [];
    const validItems = tempExpenseItems.filter((it) => it.title.trim() && it.amount > 0);

    if (viewMode === 'single') {
      updateSingleSession({
        ...currentSession,
        otherExpenses: validItems
      });
      setIsEditExpensesModalOpen(false);
      return;
    }

    targetDates.forEach((tDate, idx) => {
      const baseSession = sessionMap.get(tDate) || createInitialSession(tDate, players);
      if (idx === 0) {
        updatedSessions.push({
          ...baseSession,
          otherExpenses: validItems
        });
      } else {
        updatedSessions.push({
          ...baseSession,
          otherExpenses: []
        });
      }
    });

    updateMultipleSessions(updatedSessions);
    setIsEditExpensesModalOpen(false);
  };

  const handlePlayerStatusChange = (
    playerId: string, 
    tuesdayDate: string, 
    newStatus: PlayerAttendanceStatus
  ) => {
    const session = sessionMap.get(tuesdayDate) || createInitialSession(tuesdayDate, players);
    const existingRec = session.records[playerId] || {
      playerId,
      playerName: players.find((p) => p.id === playerId)?.name || '',
      attended: true,
      status: 'attended',
      isExempt: false,
      standardFee: session.standardFeePerPlayer || 5000,
      previousDebt: 0,
      totalRequired: session.standardFeePerPlayer || 5000,
      paidAmount: session.standardFeePerPlayer || 5000,
      currentDebt: 0,
      isSettled: true,
      note: ''
    };

    const stdFee = session.standardFeePerPlayer || 5000;
    const prevDebt = existingRec.previousDebt || 0;

    let baseFee = 0;
    let newPaid = 0;
    let isExempt = false;
    let attended = false;

    if (newStatus === 'attended') {
      attended = true;
      isExempt = false;
      baseFee = stdFee;
      newPaid = stdFee;
    } else if (newStatus === 'exempt') {
      attended = true;
      isExempt = true;
      baseFee = 0;
      newPaid = 0;
    } else {
      attended = false;
      isExempt = false;
      baseFee = 0;
      newPaid = 0;
    }

    const totalReq = baseFee + prevDebt;
    const currentDebt = Math.max(0, totalReq - newPaid);

    const updatedSession: WeeklyFinanceSession = {
      ...session,
      records: {
        ...session.records,
        [playerId]: {
          ...existingRec,
          attended,
          status: newStatus,
          isExempt,
          standardFee: baseFee,
          totalRequired: totalReq,
          paidAmount: newPaid,
          currentDebt,
          isSettled: currentDebt === 0,
          note: newStatus === 'exempt' ? 'بەخشراو (گۆڵچی)' : newStatus === 'absent' ? 'نەهاتووە' : ''
        }
      }
    };

    updateSingleSession(updatedSession);
  };

  const handleMatrixPaymentChange = (playerId: string, tuesdayDate: string, amount: number) => {
    const session = sessionMap.get(tuesdayDate) || createInitialSession(tuesdayDate, players);
    const existingRec = session.records[playerId];
    if (!existingRec) return;

    const newPaid = Math.max(0, amount);
    const totalReq = existingRec.totalRequired || (existingRec.standardFee + existingRec.previousDebt);
    const newDebt = Math.max(0, totalReq - newPaid);

    const updatedSession: WeeklyFinanceSession = {
      ...session,
      records: {
        ...session.records,
        [playerId]: {
          ...existingRec,
          paidAmount: newPaid,
          currentDebt: newDebt,
          isSettled: newDebt === 0
        }
      }
    };

    updateSingleSession(updatedSession);
  };

  const handleSet14AttendeesForTuesday = (tuesdayDate: string) => {
    const session = sessionMap.get(tuesdayDate) || createInitialSession(tuesdayDate, players);
    const updatedRecords: Record<string, PlayerFinanceRecord> = {};
    const stdFee = Number(session.standardFeePerPlayer) || 5000;

    const attendingPlayerIds = new Set<string>();
    const lineupGkIds = new Set<string>();

    try {
      const fullState = loadFullAppState();
      if (fullState && fullState.lineup) {
        const savedLineup = fullState.lineup;
        const teamAStarters = (savedLineup.teamA?.starterIds || []).filter(Boolean) as string[];
        const teamBStarters = (savedLineup.teamB?.starterIds || []).filter(Boolean) as string[];
        const teamASubs = (savedLineup.teamA?.substituteIds || []).filter(Boolean) as string[];
        const teamBSubs = (savedLineup.teamB?.substituteIds || []).filter(Boolean) as string[];

        const combined = [...teamAStarters, ...teamBStarters];
        for (const subId of [...teamASubs, ...teamBSubs]) {
          if (combined.length >= 14) break;
          if (!combined.includes(subId)) {
            combined.push(subId);
          }
        }

        if (combined.length > 0) {
          combined.forEach((id) => attendingPlayerIds.add(id));
          if (savedLineup.teamA?.starterIds?.[0]) lineupGkIds.add(savedLineup.teamA.starterIds[0]);
          if (savedLineup.teamB?.starterIds?.[0]) lineupGkIds.add(savedLineup.teamB.starterIds[0]);
        }
      }
    } catch (e) {
      console.warn('Error reading saved lineup for finance sync', e);
    }

    if (attendingPlayerIds.size === 0) {
      players.slice(0, 14).forEach((p) => attendingPlayerIds.add(p.id));
    }

    const globalGkIds = new Set(players.filter((p) => isGoalkeeper(p)).map((p) => p.id));

    players.forEach((p) => {
      const prevDebt = Number(session.records[p.id]?.previousDebt) || 0;
      const isAttending = attendingPlayerIds.has(p.id);
      const isGK = isAttending && (lineupGkIds.has(p.id) || globalGkIds.has(p.id));

      const status: PlayerAttendanceStatus = !isAttending
        ? 'absent'
        : isGK
        ? 'exempt'
        : 'attended';

      const baseFee = status === 'attended' ? stdFee : 0;
      const totalReq = baseFee + prevDebt;
      const paid = status === 'attended' ? stdFee : 0;
      const currentDebt = Math.max(0, totalReq - paid);

      updatedRecords[p.id] = {
        playerId: p.id,
        playerName: p.name,
        attended: status !== 'absent',
        status: status,
        isExempt: isGK,
        standardFee: baseFee,
        previousDebt: prevDebt,
        totalRequired: totalReq,
        paidAmount: paid,
        currentDebt: currentDebt,
        isSettled: currentDebt === 0,
        note: isGK ? 'بەخشراو (گۆڵچی)' : status === 'absent' ? 'نەهاتووە' : ''
      };
    });

    updateSingleSession({
      ...session,
      records: updatedRecords
    });
  };

  const handleExemptGoalkeepers = (tuesdayDate: string) => {
    const session = sessionMap.get(tuesdayDate) || createInitialSession(tuesdayDate, players);
    const updatedRecords = { ...session.records };

    players.forEach((p) => {
      if (isGoalkeeper(p)) {
        const prevDebt = session.records[p.id]?.previousDebt || 0;
        updatedRecords[p.id] = {
          ...(updatedRecords[p.id] || {
            playerId: p.id,
            playerName: p.name,
            attended: true,
            standardFee: 0,
            previousDebt: prevDebt,
            totalRequired: prevDebt,
            paidAmount: 0,
            currentDebt: prevDebt,
            isSettled: prevDebt === 0,
          }),
          status: 'exempt',
          isExempt: true,
          attended: true,
          standardFee: 0,
          totalRequired: prevDebt,
          paidAmount: 0,
          currentDebt: prevDebt,
          isSettled: prevDebt === 0,
          note: 'بەخشراو (گۆڵچی)'
        };
      }
    });

    updateSingleSession({
      ...session,
      records: updatedRecords
    });
  };

  const handlePitchCostChange = (val: number) => {
    updateSingleSession({
      ...currentSession,
      pitchCost: Math.max(0, val)
    });
  };

  const handleStandardFeeChange = (val: number) => {
    const newFee = Math.max(0, val);
    const updatedRecords: Record<string, PlayerFinanceRecord> = {};

    (Object.entries(currentSession.records) as [string, PlayerFinanceRecord][]).forEach(([pId, r]) => {
      const isAttended = r.status === 'attended';
      const baseFee = isAttended ? newFee : 0;
      const totalReq = baseFee + r.previousDebt;
      const currentDebt = Math.max(0, totalReq - r.paidAmount);
      updatedRecords[pId] = {
        ...r,
        standardFee: baseFee,
        totalRequired: totalReq,
        currentDebt: currentDebt,
        isSettled: currentDebt === 0
      };
    });

    updateSingleSession({
      ...currentSession,
      standardFeePerPlayer: newFee,
      records: updatedRecords
    });
  };

  const handleAddExpense = () => {
    const newExp: ExpenseItem = {
      id: `exp_${Date.now()}`,
      title: 'کڕینی تۆپ یان ئاو',
      amount: 5000
    };

    updateSingleSession({
      ...currentSession,
      otherExpenses: [...(currentSession.otherExpenses || []), newExp]
    });
  };

  const handleUpdateExpense = (id: string, title: string, amount: number) => {
    const updated = (currentSession.otherExpenses || []).map((exp) => 
      exp.id === id ? { ...exp, title, amount: Math.max(0, amount) } : exp
    );
    updateSingleSession({
      ...currentSession,
      otherExpenses: updated
    });
  };

  const handleDeleteExpense = (id: string) => {
    const updated = (currentSession.otherExpenses || []).filter((exp) => exp.id !== id);
    updateSingleSession({
      ...currentSession,
      otherExpenses: updated
    });
  };

  const handleStepTuesday = (direction: 'prev' | 'next') => {
    const currentIndex = allTuesdays.indexOf(selectedDate);
    if (currentIndex >= 0) {
      if (direction === 'prev' && currentIndex > 0) {
        setSelectedDate(allTuesdays[currentIndex - 1]);
      } else if (direction === 'next' && currentIndex < allTuesdays.length - 1) {
        setSelectedDate(allTuesdays[currentIndex + 1]);
      }
    } else {
      setSelectedDate(allTuesdays[0] || selectedDate);
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const isGKa = isGoalkeeper(a);
      const isGKb = isGoalkeeper(b);
      if (isGKa && !isGKb) return -1;
      if (!isGKa && isGKb) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [players, searchQuery]);

  const playerMatrixStats = useMemo(() => {
    const stats: Record<string, { totalPaid: number; totalDebt: number; matchCount: number; exemptCount: number; absentCount: number }> = {};
    
    players.forEach((p) => {
      stats[p.id] = { totalPaid: 0, totalDebt: 0, matchCount: 0, exemptCount: 0, absentCount: 0 };
    });

    matrixTuesdays.forEach((tDate) => {
      const session = sessionMap.get(tDate);
      if (session) {
        players.forEach((p) => {
          const rec = session.records[p.id];
          if (rec) {
            stats[p.id].totalPaid += Number(rec.paidAmount) || 0;
            stats[p.id].totalDebt += Number(rec.currentDebt) || 0;
            if (rec.status === 'exempt' || rec.isExempt) {
              stats[p.id].exemptCount += 1;
              stats[p.id].matchCount += 1;
            } else if (rec.status === 'absent' || (!rec.attended && !rec.isExempt)) {
              stats[p.id].absentCount += 1;
            } else {
              stats[p.id].matchCount += 1;
            }
          }
        });
      }
    });

    return stats;
  }, [players, matrixTuesdays, sessionMap]);

  const columnMatrixTotals = useMemo(() => {
    const totals: Record<string, { totalCollected: number; pitchCost: number; net: number; attendedCount: number; payingCount: number; exemptCount: number; absentCount: number }> = {};

    matrixTuesdays.forEach((tDate) => {
      const session = sessionMap.get(tDate) || createInitialSession(tDate, players);
      let collected = 0;
      let attended = 0;
      let paying = 0;
      let exempt = 0;
      let absent = 0;

      (Object.values(session.records || {}) as PlayerFinanceRecord[]).forEach((rec) => {
        const isEx = rec.status === 'exempt' || rec.isExempt;
        const isAb = rec.status === 'absent' || (!rec.attended && !isEx);

        if (isAb) {
          absent++;
        } else if (isEx) {
          attended++;
          exempt++;
        } else {
          attended++;
          paying++;
        }

        collected += Number(rec.paidAmount) || 0;
      });

      const pitch = Number(session.pitchCost) || 0;
      const other = (session.otherExpenses || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const totalExp = pitch + other;

      totals[tDate] = {
        totalCollected: collected,
        pitchCost: pitch,
        net: collected - totalExp,
        attendedCount: attended,
        payingCount: paying,
        exemptCount: exempt,
        absentCount: absent
      };
    });

    return totals;
  }, [matrixTuesdays, sessionMap, players]);

  const handleCopyTextReport = () => {
    let report = `⚽ *ڕاپۆرتی حیساباتی دارایی تیمی یاریزانان*\n`;
    report += `📅 *ماوە:* ${selectedMonth > 0 ? KURDISH_MONTHS[selectedMonth - 1] : 'سێشەممەکانی خول'}\n`;
    report += `----------------------------\n`;
    report += `💰 *کۆی گشتی پارەی کۆکراوەتەوە (Total Income):* ${formatCurrency(activeSummary.totalIncome)}\n`;
    report += `🏟️ *پارەی وەصڵی ساحە و یاریگا (Pitch Rent):* ${formatCurrency(activeSummary.totalPitchRent)}\n`;
    report += `🛒 *خەرجی تۆپ و پێداویستی (Expenses/Balls):* ${formatCurrency(activeSummary.totalOtherExpenses)}\n`;
    report += `📊 *ڕاپۆرتی کۆتایی (Net Balance):* ${activeSummary.netBalance >= 0 ? '+' : ''}${formatCurrency(activeSummary.netBalance)} (${activeSummary.netBalance >= 0 ? 'قازانج و ماوەتەوە لە سندووق' : 'کورتهێنان'})\n`;
    report += `⚠️ *کۆی قەرزە نەدراوەکان:* ${formatCurrency(activeSummary.totalOutstandingDebt)}\n`;
    report += `----------------------------\n`;
    report += `تیمی وەرزشی • Rizbandy Pro`;

    navigator.clipboard.writeText(report).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    });
  };

  return (
    <div 
      className={`space-y-6 rounded-3xl p-4 sm:p-6 transition-colors duration-300 border ${
        isDark ? 'border-slate-800 shadow-2xl' : 'border-slate-200/90 shadow-sm'
      }`}
      style={{ 
        backgroundColor: financePageBg,
        color: activeTextColor 
      }}
    >
      {/* 0. Page Background & Font Color Customizer Toolbar */}
      <div className={`p-4 rounded-3xl border flex flex-col gap-3.5 transition-all duration-200 ${
        isDark ? 'bg-slate-900/95 border-slate-800 shadow-xl' : 'bg-white/95 border-slate-200/90 shadow-sm'
      }`}>
        
        {/* Row 1: Background Color Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 font-black text-xs text-emerald-600 dark:text-emerald-400">
              <Palette className="w-4 h-4 text-emerald-500" />
              <span>ڕەنگی بارگراوند (پاشبنەما):</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {FINANCE_PAGE_PRESETS.map((preset) => {
                const isSelected = financePageBg.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePageColorChange(preset.hex)}
                    title={preset.name}
                    className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 font-black shadow-sm scale-105 ' + (isDark ? 'bg-slate-800 text-white border-white/60' : 'bg-slate-900 text-white border-slate-900')
                        : (isDark ? 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70')
                    }`}
                  >
                    <span 
                      className="w-3 h-3 rounded-full border border-slate-400/60 shrink-0" 
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span>{preset.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border cursor-pointer transition text-xs font-bold ${
              isDark ? 'bg-slate-950 border-slate-700 hover:border-emerald-500' : 'bg-slate-50 border-slate-300 hover:border-emerald-500 shadow-xs'
            }`}>
              <input
                type="color"
                value={financePageBg}
                onChange={(e) => handlePageColorChange(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                title="هەڵبژاردنی هەر ڕەنگێکی تر بۆ پاشبنەما"
              />
              <span className="font-mono text-[11px] font-black uppercase text-emerald-600" dir="ltr">
                {financePageBg}
              </span>
              <span className="text-[10px] text-slate-400">ڕەنگی تر</span>
            </label>
          </div>
        </div>

        {/* Row 2: Font / Text Color Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 font-black text-xs text-blue-600 dark:text-blue-400">
              <Type className="w-4 h-4 text-blue-500" />
              <span>ڕەنگی فۆنت و دەقەکان:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {FINANCE_TEXT_PRESETS.map((preset) => {
                const isSelected = financeTextColor.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleTextColorChange(preset.hex)}
                    title={preset.name}
                    className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-blue-500 font-black shadow-sm scale-105 ' + (isDark ? 'bg-slate-800 text-white border-white/60' : 'bg-slate-900 text-white border-slate-900')
                        : (isDark ? 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70')
                    }`}
                  >
                    {preset.hex === 'auto' ? (
                      <span className="text-[11px]">✨</span>
                    ) : (
                      <span 
                        className="w-3 h-3 rounded-full border border-slate-400/60 shrink-0" 
                        style={{ backgroundColor: preset.hex }}
                      />
                    )}
                    <span>{preset.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border cursor-pointer transition text-xs font-bold ${
              isDark ? 'bg-slate-950 border-slate-700 hover:border-blue-500' : 'bg-slate-50 border-slate-300 hover:border-blue-500 shadow-xs'
            }`}>
              <input
                type="color"
                value={financeTextColor === 'auto' ? activeTextColor : financeTextColor}
                onChange={(e) => handleTextColorChange(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                title="هەڵبژاردنی هەر ڕەنگێکی تر بۆ فۆنت و دەقەکان"
              />
              <span className="font-mono text-[11px] font-black uppercase text-blue-600" dir="ltr">
                {financeTextColor === 'auto' ? 'خودکار' : financeTextColor}
              </span>
              <span className="text-[10px] text-slate-400">فۆنتی تر</span>
            </label>

            {/* Quick Reset to White & Auto */}
            {(financePageBg.toLowerCase() !== '#ffffff' || financeTextColor !== 'auto') && (
              <button
                type="button"
                onClick={handleResetToPureWhite}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                  isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:text-white' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                }`}
                title="لابردنی ڕەش و گەڕانەوە بۆ لاپەڕەی سپی خاوێن"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-black">لابردنی ڕەش / سپی خاوێن</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 1. Header Banner & View Switcher */}
      <div className={`border rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-sm'
      }`}>
        
        {saveBannerMessage && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black shadow-lg animate-bounce">
            <Check className="w-3.5 h-3.5" />
            <span>{saveBannerMessage}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black shadow-sm">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 
                  className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 flex-wrap"
                  style={{ color: activeTextColor }}
                >
                  <span>سیستەمی حیساباتی دارایی تیمی یاریزانان</span>
                  <span className={`text-xs px-3 py-1 rounded-full border font-bold ${
                    isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    خشتەی سێشەممەکان • Weekly Tuesday Columns
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full border font-bold flex items-center gap-1 ${
                    isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    <Calendar className="w-3 h-3 text-amber-500" />
                    <span>ئەمڕۆ: {todayDetails.fullKurdish}</span>
                  </span>
                </h2>
                <p 
                  className="text-xs mt-1 font-medium"
                  style={{ color: activeSubtextColor }}
                >
                  تۆمارکردنی پارەی ١٤ یاریزانی ئامادەبوو، بەخشینی گۆڵچییەکان، یاریزانی نەهاتوو (بێ پارە)، وەصڵی ساحە و ڕاپۆرتی کۆتایی سندووق.
                </p>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 p-1.5 rounded-2xl border self-start lg:self-auto ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>خشتەی سێشەممەکان (Matrix)</span>
            </button>

            <button
              onClick={() => setViewMode('single')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>وردەکاری تاکە سێشەممە</span>
            </button>
          </div>

        </div>

      </div>

      {/* 2. Top Financial Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className={`border-2 rounded-3xl p-5 shadow-xl relative overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-emerald-500/40' : 'bg-white/95 border-emerald-500/50 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>کۆی گشتی پارە کۆکراوەتەوە</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl lg:text-3xl font-black font-mono tracking-tight ${
            isDark ? 'text-emerald-400' : 'text-emerald-600'
          }`}>
            {formatCurrency(activeSummary.totalIncome)}
          </div>
          <p className="text-[11px] text-emerald-500/80 font-bold mt-1.5 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>کۆی دراو لە لایەن یاریزانان (Total Income)</span>
          </p>
        </div>

        <div 
          onClick={openEditPitchModal}
          className={`border-2 rounded-3xl p-5 shadow-xl relative overflow-hidden transition-all duration-200 cursor-pointer group select-none ${
            isDark 
              ? 'bg-slate-900 border-blue-500/40 hover:border-blue-400/90 hover:shadow-blue-500/10' 
              : 'bg-white/95 border-blue-500/50 hover:border-blue-500 shadow-sm'
          }`}
          title="کلیک بکە بۆ گۆڕینی کرێی وەصڵی یاریگا"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold transition-colors ${
              isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-900'
            }`}>
              پارەی وەصڵی ساحە / یاریگا
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditPitchModal();
                }}
                className="px-2.5 py-1 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40 text-[11px] font-black flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <Edit3 className="w-3 h-3 text-blue-400" />
                <span>دەستکاری بڕ</span>
              </button>
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className={`text-2xl lg:text-3xl font-black font-mono tracking-tight transition-colors flex items-baseline gap-2 ${
            isDark ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600 group-hover:text-blue-700'
          }`}>
            <span>{formatCurrency(activeSummary.totalPitchRent)}</span>
            <span className="text-[10px] text-blue-400/60 font-sans font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              (گۆڕین ✏️)
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              کرێی بڕاوەی یاریگا (Pitch Rent)
            </p>
            <span className="text-[10px] text-blue-500/80 font-bold hidden sm:inline-block">
              بۆ دەستکاری کلیک بکە 👆
            </span>
          </div>
        </div>

        <div 
          onClick={openEditExpensesModal}
          className={`border-2 rounded-3xl p-5 shadow-xl relative overflow-hidden transition-all duration-200 cursor-pointer group select-none ${
            isDark 
              ? 'bg-slate-900 border-amber-500/40 hover:border-amber-400/90 hover:shadow-amber-500/10' 
              : 'bg-white/95 border-amber-500/50 hover:border-amber-500 shadow-sm'
          }`}
          title="کلیک بکە بۆ گۆڕینی خەرجی پێداویستی و تۆپ"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold transition-colors ${
              isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-900'
            }`}>
              کڕینی پێداویستی و تۆپ
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditExpensesModal();
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-[11px] font-black flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <Edit3 className="w-3 h-3 text-amber-400" />
                <span>دەستکاری بڕ</span>
              </button>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className={`text-2xl lg:text-3xl font-black font-mono tracking-tight transition-colors flex items-baseline gap-2 ${
            isDark ? 'text-amber-400 group-hover:text-amber-300' : 'text-amber-600 group-hover:text-amber-700'
          }`}>
            <span>{formatCurrency(activeSummary.totalOtherExpenses)}</span>
            <span className="text-[10px] text-amber-400/60 font-sans font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              (گۆڕین ✏️)
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              تۆپ، ئاو و مەساریف (Expenses)
            </p>
            <span className="text-[10px] text-amber-500/80 font-bold hidden sm:inline-block">
              بۆ دەستکاری کلیک بکە 👆
            </span>
          </div>
        </div>

        <div className={`rounded-3xl p-5 shadow-xl border-2 relative overflow-hidden transition-colors ${
          activeSummary.netBalance >= 0 
            ? (isDark ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300' : 'bg-emerald-50/95 border-emerald-500 text-emerald-900 shadow-sm')
            : (isDark ? 'bg-rose-950/50 border-rose-500 text-rose-300' : 'bg-rose-50/95 border-rose-500 text-rose-900 shadow-sm')
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black">ڕاپۆرتی کۆتایی لە سندووق (Net Balance)</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              activeSummary.netBalance >= 0 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono tracking-tight">
            {activeSummary.netBalance >= 0 ? '+' : ''}{formatCurrency(activeSummary.netBalance)}
          </div>
          <p className="text-[11px] font-extrabold mt-1.5 flex items-center gap-1">
            {activeSummary.netBalance >= 0 ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>قازانج و باڵانسی ماوەتەوە لە سندووق ✅</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>کورتهێنان و خەرجی زیاتر لە داهات ⚠️</span>
              </>
            )}
          </p>
        </div>

      </div>

      {/* 3. Matrix Controls */}
      <div className={`border rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white/95 border-slate-200/90 shadow-sm'
      }`}>
        
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>دیاریکردنی مانگ:</span>
          </span>

          <div className={`flex items-center gap-1 p-1 rounded-2xl border overflow-x-auto max-w-full ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setSelectedMonth(8)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedMonth === 8 
                  ? 'bg-emerald-600 text-slate-950 font-black shadow-sm' 
                  : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              ئاب (8) • 11/08 - 25/08
            </button>

            <button
              onClick={() => setSelectedMonth(9)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedMonth === 9 
                  ? 'bg-emerald-600 text-slate-950 font-black shadow-sm' 
                  : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              ئەیلوول (9) • 01/09 - 29/09
            </button>

            <button
              onClick={() => setSelectedMonth(10)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedMonth === 10 
                  ? 'bg-emerald-600 text-slate-950 font-black shadow-sm' 
                  : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              تشرینی یەکەم (10)
            </button>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className={`border rounded-xl px-2.5 py-1 text-xs font-bold cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value={0}>هەموو ڕۆژانی سێشەممە</option>
              {KURDISH_MONTHS.map((mName, idx) => (
                <option key={idx} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          
          <button
            onClick={openEditPlayerFeeModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            title="گۆڕینی بڕی پارەی یاریزان"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>بڕی پارەی یاریزان ({formatCurrency(currentSession.standardFeePerPlayer || 5000)})</span>
          </button>

          <button
            onClick={handleCopyTextReport}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isDark 
                ? 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="کۆپیکردنی دەقی ڕاپۆرتی دارایی"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>کۆپی کرا!</span>
              </>
            ) : (
              <>
                <Copy className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>کۆپیکردنی ڕاپۆرت</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setExportMode(viewMode);
              setIsExportModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            title="داگرتنی وێنەی PNG کوالیتی بەرز"
          >
            <Download className="w-4 h-4" />
            <span>داگرتنی وێنە (PNG HD)</span>
          </button>

        </div>

      </div>

      {/* 4. Main Content: Matrix View OR Single View */}
      {viewMode === 'matrix' ? (
        
        <div className="space-y-4">
          
          <div className={`border rounded-2xl p-3 flex items-center justify-between flex-wrap gap-3 text-xs transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-sm'
          }`}>
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>ڕێنمایی دۆخی یاریزان لە سێشەممەدا:</span>
              
              <button
                type="button"
                onClick={openEditPlayerFeeModal}
                className="flex items-center gap-1.5 text-emerald-400 font-bold px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 hover:bg-emerald-900 transition cursor-pointer"
                title="کلیک بکە بۆ گۆڕینی بڕی پارەی یاریزان"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>هاتووە ({formatCurrency(currentSession.standardFeePerPlayer || 5000)})</span>
                <Edit3 className="w-3 h-3 text-emerald-400 mr-1" />
              </button>

              <span className="flex items-center gap-1.5 text-cyan-300 font-bold px-2 py-0.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <span>بەخشراو 🧤 (گۆڵچی / ٠ د.ع)</span>
              </span>

              <span className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-lg border ${
                isDark ? 'text-slate-400 bg-slate-950 border-slate-800' : 'text-slate-600 bg-slate-100 border-slate-200'
              }`}>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <span>نەهاتووە (٠ د.ع - بێ قەرز)</span>
              </span>
            </div>

            <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              💡 تەنها ئەو ١٤ یاریزانەی هاتوون پارە دەدەن، گۆڵچییەکان بەخشراون لە پارەدان.
            </div>
          </div>

          <div className={`overflow-hidden rounded-3xl border transition-colors ${
            isDark ? 'border-slate-800 bg-slate-900 shadow-2xl' : 'border-slate-200/90 bg-white/95 shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                
                <thead>
                  <tr className={`border-b text-[11px] font-black ${
                    isDark ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    <th className={`py-4 px-3 w-10 text-center border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>#</th>
                    <th className={`py-4 px-4 min-w-[210px] border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      ناوی یاریزان (Player Profile)
                    </th>

                    {matrixTuesdays.map((tDate) => {
                      const colInfo = columnMatrixTotals[tDate] || { attendedCount: 0, payingCount: 0, exemptCount: 0, absentCount: 0 };
                      const s = sessionMap.get(tDate);
                      const currentFee = s?.standardFeePerPlayer || 5000;

                      return (
                        <th key={tDate} className={`py-3 px-3 text-center min-w-[150px] border-l ${
                          isDark ? 'border-slate-800 bg-slate-950/90' : 'border-slate-200 bg-slate-100/90'
                        }`}>
                          <div className="font-mono text-emerald-500 font-black text-xs">
                            {formatDisplayDate(tDate)}
                          </div>
                          <div className={`text-[10px] font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            سێشەممە ({tDate.split('-')[2]})
                          </div>

                          <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                              {colInfo.attendedCount} ئامادە
                            </span>
                            {colInfo.exemptCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50" title="گۆڵچی بەخشراو">
                                🧤 {colInfo.exemptCount}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-1.5 flex items-center justify-center gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleSet14AttendeesForTuesday(tDate)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
                              }`}
                            >
                              ١٤ یاریزان
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExemptGoalkeepers(tDate)}
                              className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[9px] font-bold border border-cyan-800/60 transition cursor-pointer"
                            >
                              بەخشینی گۆڵچی
                            </button>
                          </div>
                        </th>
                      );
                    })}

                    <th className={`py-4 px-4 text-center min-w-[130px] border-l font-black ${
                      isDark ? 'bg-emerald-950/40 text-emerald-300 border-slate-800' : 'bg-emerald-100 text-emerald-800 border-slate-200'
                    }`}>
                      کۆی گشتی (مجموع)
                    </th>

                    <th className={`py-4 px-4 text-center min-w-[110px] font-black ${
                      isDark ? 'bg-rose-950/40 text-rose-300' : 'bg-rose-100 text-rose-800'
                    }`}>
                      قەرز (Debt)
                    </th>
                  </tr>
                </thead>

                <tbody className={`divide-y font-sans ${isDark ? 'divide-slate-800/80' : 'divide-slate-200/80'}`}>
                  {filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={matrixTuesdays.length + 4} className={`py-8 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        هیچ یاریزانێک نەدۆزرایەوە.
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((player, idx) => {
                      const pStat = playerMatrixStats[player.id] || { totalPaid: 0, totalDebt: 0, matchCount: 0, exemptCount: 0, absentCount: 0 };
                      const isGK = isGoalkeeper(player);

                      return (
                        <tr key={player.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                          <td className={`py-3 px-3 text-center font-mono text-[11px] border-l ${
                            isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-200'
                          }`}>
                            {idx + 1}
                          </td>

                          <td className={`py-3 px-4 border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl overflow-hidden border flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm ${
                                isGK ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300' : (isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-700 border-slate-600')
                              }`}>
                                {player.avatar ? (
                                  <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  isGK ? '🧤' : player.name.slice(0, 2)
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-sm" style={{ color: activeTextColor }}>
                                    {player.name}
                                  </span>
                                  {isGK && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-black">
                                      گۆڵچی
                                    </span>
                                  )}
                                </div>
                                {player.position && !isGK && (
                                  <span className="text-[10px] font-medium" style={{ color: activeSubtextColor }}>
                                    {player.position}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {matrixTuesdays.map((tDate) => {
                            const session = sessionMap.get(tDate);
                            const rec = session?.records[player.id];
                            const status = rec?.status || (rec?.isExempt ? 'exempt' : rec?.attended ? 'attended' : 'absent');
                            const paidVal = rec ? Number(rec.paidAmount) || 0 : 0;
                            const stdFee = session?.standardFeePerPlayer || 5000;
                            const isPaidFull = status === 'attended' && paidVal >= stdFee;
                            const isExempt = status === 'exempt';
                            const isAbsent = status === 'absent';
                            const isUnpaidAttended = status === 'attended' && paidVal === 0;

                            return (
                              <td 
                                key={tDate} 
                                className={`py-2 px-2 text-center border-l transition-colors ${
                                  isDark ? 'border-slate-800' : 'border-slate-200'
                                } ${
                                  isExempt
                                    ? (isDark ? 'bg-cyan-950/20 hover:bg-cyan-950/35' : 'bg-cyan-50/40 hover:bg-cyan-50/70')
                                    : isAbsent
                                    ? (isDark ? 'bg-slate-950/40 hover:bg-slate-900/60' : 'bg-slate-50/60 hover:bg-slate-100/60')
                                    : isPaidFull
                                    ? (isDark ? 'bg-emerald-950/25 hover:bg-emerald-950/40' : 'bg-emerald-50/40 hover:bg-emerald-50/70')
                                    : isUnpaidAttended
                                    ? (isDark ? 'bg-rose-950/25 hover:bg-rose-950/40' : 'bg-rose-50/40 hover:bg-rose-50/70')
                                    : (isDark ? 'bg-amber-950/25 hover:bg-amber-950/40' : 'bg-amber-50/40 hover:bg-amber-50/70')
                                }`}
                              >
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <select
                                    value={status}
                                    onChange={(e) => handlePlayerStatusChange(player.id, tDate, e.target.value as PlayerAttendanceStatus)}
                                    className={`w-28 rounded-lg px-1.5 py-1 text-[11px] font-black border text-center cursor-pointer transition ${
                                      isExempt
                                        ? (isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-600/70' : 'bg-cyan-50 text-cyan-800 border-cyan-300')
                                        : isAbsent
                                        ? (isDark ? 'bg-slate-950 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-300')
                                        : isPaidFull
                                        ? (isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-600/70' : 'bg-emerald-50 text-emerald-800 border-emerald-300')
                                        : (isDark ? 'bg-rose-950 text-rose-300 border-rose-600/70' : 'bg-rose-50 text-rose-800 border-rose-300')
                                    }`}
                                  >
                                    <option value="attended">✅ هاتووە</option>
                                    <option value="exempt">🧤 بەخشراو (گۆڵچی)</option>
                                    <option value="absent">❌ نەهاتووە</option>
                                  </select>

                                  {status === 'attended' ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        step="500"
                                        min="0"
                                        value={paidVal}
                                        onChange={(e) => handleMatrixPaymentChange(player.id, tDate, Number(e.target.value))}
                                        className={`w-20 rounded-lg px-1.5 py-0.5 text-center font-mono font-black text-xs border focus:outline-none transition ${
                                          isPaidFull
                                            ? (isDark ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300' : 'bg-white border-emerald-400 text-emerald-700 shadow-xs')
                                            : (isDark ? 'bg-rose-950/80 border-rose-500/60 text-rose-300' : 'bg-white border-rose-400 text-rose-700 shadow-xs')
                                        }`}
                                      />
                                    </div>
                                  ) : isExempt ? (
                                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold font-mono">٠ د.ع (بەخشراو)</span>
                                  ) : (
                                    <span className={`text-[10px] font-medium font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>٠ د.ع (نەهاتوو)</span>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          <td className={`py-3 px-4 text-center font-mono font-black border-l text-sm ${
                            isDark ? 'border-slate-800 bg-emerald-950/20 text-emerald-300' : 'border-slate-200 bg-emerald-50/50 text-emerald-700'
                          }`}>
                            {formatCurrency(pStat.totalPaid)}
                          </td>

                          <td className={`py-3 px-4 text-center font-mono font-black ${
                            isDark ? 'bg-rose-950/20' : 'bg-rose-50/30'
                          }`}>
                            {pStat.totalDebt > 0 ? (
                              <span className={`px-2.5 py-1 rounded-xl border shadow-sm inline-block ${
                                isDark ? 'text-rose-400 bg-rose-950 border-rose-800/80' : 'text-rose-700 bg-rose-100 border-rose-300'
                              }`}>
                                {formatCurrency(pStat.totalDebt)}
                              </span>
                            ) : (
                              <span className="text-emerald-500 font-bold">0</span>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>

                <tfoot>
                  <tr className={`font-black border-t-2 ${
                    isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-300'
                  }`}>
                    <td colSpan={2} className={`py-4 px-4 border-l text-sm ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span style={{ color: activeTextColor }}>کۆی گشتی هەفتانە (Column Totals)</span>
                      </div>
                    </td>

                    {matrixTuesdays.map((tDate) => {
                      const colTotal = columnMatrixTotals[tDate]?.totalCollected || 0;
                      return (
                        <td key={tDate} className={`py-4 px-3 text-center border-l font-mono text-sm ${
                          isDark ? 'border-slate-800 text-emerald-400' : 'border-slate-200 text-emerald-700 font-black'
                        }`}>
                          {formatCurrency(colTotal)}
                        </td>
                      );
                    })}

                    <td className={`py-4 px-4 text-center border-l font-mono font-black text-base shadow-inner ${
                      isDark ? 'border-slate-800 bg-emerald-600 text-slate-950' : 'border-slate-200 bg-emerald-600 text-white'
                    }`}>
                      {formatCurrency(activeSummary.totalIncome)}
                    </td>

                    <td className={`py-4 px-4 text-center font-mono font-black text-sm ${
                      isDark ? 'bg-rose-950 text-rose-300' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {formatCurrency(activeSummary.totalOutstandingDebt)}
                    </td>
                  </tr>
                </tfoot>

              </table>
            </div>
          </div>

        </div>

      ) : (

        /* ================= SINGLE TUESDAY DETAIL VIEW ================= */
        <div className="space-y-6">
          
          <div className={`border rounded-3xl p-4 flex items-center justify-between flex-wrap gap-3 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white/95 border-slate-200/90 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStepTuesday('prev')}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border cursor-pointer transition ${
                  isDark ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span>سێشەممەی پێشوو</span>
              </button>

              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`border-2 rounded-xl px-4 py-2 text-xs font-black focus:outline-none cursor-pointer ${
                  isDark ? 'bg-slate-950 border-emerald-500/50 text-white' : 'bg-slate-50 border-emerald-500 text-slate-900'
                }`}
              >
                {allTuesdays.map((tDate) => (
                  <option key={tDate} value={tDate}>
                    {formatKurdishDate(tDate)} ({formatDisplayDate(tDate)})
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleStepTuesday('next')}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border cursor-pointer transition ${
                  isDark ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <span>سێشەممەی داهاتوو</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleSet14AttendeesForTuesday(selectedDate)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer transition ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>دیاریکردنی ١٤ یاریزانی ئەم هەفتەیە</span>
              </button>

              <button
                onClick={() => handleExemptGoalkeepers(selectedDate)}
                className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-bold border border-cyan-800 flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>بەخشینی ٢ گۆڵچی</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>تێچووی یاریزان:</span>
                <input
                  type="number"
                  step="500"
                  value={currentSession.standardFeePerPlayer}
                  onChange={(e) => handleStandardFeeChange(Number(e.target.value))}
                  className={`w-20 border rounded-lg px-2 py-1 text-xs font-bold text-center ${
                    isDark ? 'bg-slate-950 border-slate-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-600'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>کرێی یاریگا:</span>
                <input
                  type="number"
                  step="1000"
                  value={currentSession.pitchCost}
                  onChange={(e) => handlePitchCostChange(Number(e.target.value))}
                  className={`w-24 border rounded-lg px-2 py-1 text-xs font-bold text-center ${
                    isDark ? 'bg-slate-950 border-slate-700 text-blue-400' : 'bg-white border-slate-300 text-blue-600'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className={`border rounded-3xl p-4 space-y-3 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white/95 border-slate-200/90 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-black flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Receipt className="w-4 h-4 text-amber-500" />
                <span>خەرجییە زیادەکان بۆ ئەم سێشەممەیە:</span>
              </h3>
              <button
                onClick={handleAddExpense}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>زیادکردنی خەرجی</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(!currentSession.otherExpenses || currentSession.otherExpenses.length === 0) ? (
                <div className={`text-xs py-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>هیچ خەرجییەکی تر نییە.</div>
              ) : (
                currentSession.otherExpenses.map((exp) => (
                  <div key={exp.id} className={`flex items-center gap-2 p-2.5 rounded-2xl border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => handleUpdateExpense(exp.id, e.target.value, exp.amount)}
                      className={`flex-1 border rounded-lg px-2 py-1 text-xs ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                    <input
                      type="number"
                      value={exp.amount}
                      onChange={(e) => handleUpdateExpense(exp.id, exp.title, Number(e.target.value))}
                      className={`w-24 border rounded-lg px-2 py-1 text-xs font-bold text-center ${
                        isDark ? 'bg-slate-900 border-slate-700 text-amber-400' : 'bg-white border-slate-300 text-amber-600'
                      }`}
                    />
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`overflow-hidden rounded-3xl border transition-colors ${
            isDark ? 'border-slate-800 bg-slate-900 shadow-xl' : 'border-slate-200/90 bg-white/95 shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className={`border-b text-[11px] font-bold ${
                    isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">ناوی یاریزان</th>
                    <th className="py-3 px-3 text-center">دۆخی ئامادەبوون</th>
                    <th className="py-3 px-3 text-center">بڕی دراو</th>
                    <th className="py-3 px-3 text-center">قەرز</th>
                    <th className="py-3 px-3 text-center">دۆخ</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                  {players.map((p, idx) => {
                    const rec = currentSession.records[p.id];
                    const status = rec?.status || (rec?.isExempt ? 'exempt' : rec?.attended ? 'attended' : 'absent');
                    const paid = rec ? rec.paidAmount : 0;
                    const debt = rec ? rec.currentDebt : 0;
                    const isGK = isGoalkeeper(p);

                    return (
                      <tr key={p.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                        <td className={`py-3 px-4 text-center font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{idx + 1}</td>
                        <td className={`py-3 px-4 font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <div className={`w-7 h-7 rounded-lg overflow-hidden border flex items-center justify-center text-xs ${
                            isGK ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : (isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-700 border-slate-600 text-white')
                          }`}>
                            {p.avatar ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" /> : isGK ? '🧤' : p.name.slice(0, 2)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: activeTextColor }}>{p.name}</span>
                            {isGK && (
                              <span className="px-1 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-black">
                                گۆڵچی
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <select
                            value={status}
                            onChange={(e) => handlePlayerStatusChange(p.id, selectedDate, e.target.value as PlayerAttendanceStatus)}
                            className={`border rounded-xl px-2.5 py-1 text-xs font-bold cursor-pointer ${
                              isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'
                            }`}
                          >
                            <option value="attended">✅ هاتووە (پارە دەدات)</option>
                            <option value="exempt">🧤 بەخشراو (گۆڵچی / ٠ د.ع)</option>
                            <option value="absent">❌ نەهاتووە (٠ د.ع)</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-emerald-500">
                          {status === 'attended' ? (
                            <input
                              type="number"
                              step="500"
                              value={paid}
                              onChange={(e) => handleMatrixPaymentChange(p.id, selectedDate, Number(e.target.value))}
                              className={`w-24 border rounded-lg px-2 py-1 text-xs font-bold text-center ${
                                isDark ? 'bg-slate-950 border-slate-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-600'
                              }`}
                            />
                          ) : status === 'exempt' ? (
                            <span className="text-cyan-500 font-bold text-xs">٠ د.ع (بەخشراو)</span>
                          ) : (
                            <span className={`font-bold text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>٠ د.ع (نەهاتوو)</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black">
                          {debt > 0 ? <span className="text-rose-500">{formatCurrency(debt)}</span> : <span className="text-emerald-500">0</span>}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {status === 'exempt' ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                            }`}>بەخشراو 🧤</span>
                          ) : status === 'absent' ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>نەهاتووە</span>
                          ) : debt > 0 ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}>قەرزارە</span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}>پاکی کردۆتەوە</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      )}

      {/* 5. Google Sheets / Excel Formula Guide */}
      <div className={`border rounded-3xl p-5 transition-colors ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/95 border-slate-200/90 shadow-sm'
      }`}>
        <button
          onClick={() => setShowSheetsFormulaGuide(!showSheetsFormulaGuide)}
          className={`w-full flex items-center justify-between text-xs font-bold transition cursor-pointer ${
            isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>هاوکێشەی ئەکسڵ و گۆگڵ شیتس بۆ خشتەی سێشەممەکان (Excel / Sheets Formulas)</span>
          </div>
          <span className="text-[11px] text-emerald-500 underline">
            {showSheetsFormulaGuide ? 'داخستنی ڕێنمایی' : 'پیشاندانی هاوکێشەکان'}
          </span>
        </button>

        {showSheetsFormulaGuide && (
          <div className={`mt-4 pt-4 border-t text-xs space-y-3 font-mono ${isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-emerald-500 font-bold block mb-1">کۆی گشتی یاریزان (Row Total):</span>
              <code>=SUM(C2:G2)</code>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-emerald-500 font-bold block mb-1">کۆی گشتی هەفتانە (Column Total):</span>
              <code>=SUM(C2:C15)</code>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-emerald-500 font-bold block mb-1">باڵانسی ماوەتەوە لە سندووق (Net Balance):</span>
              <code>=SUM(C16:G16) - (SUM(کرێی_یاریگا) + SUM(خەرجی_تۆپ))</code>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Player Fee Editor Modal */}
      {isEditPlayerFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto" dir="rtl">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl my-4 text-right">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    دیاریکردنی بڕی پارەی بەشداری یاریزان
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    بڕی پارەی دانراو بۆ هەر یاریزانێکی ئامادەبوو
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditPlayerFeeModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPlayerFeeApplyTarget('all')}
                  className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                    playerFeeApplyTarget === 'all' ? 'bg-emerald-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  هەموو سێشەممەکان (گشتی)
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerFeeApplyTarget('single')}
                  className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                    playerFeeApplyTarget === 'single' ? 'bg-emerald-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  تەنها ئەم سێشەممەیە ({formatDisplayDate(selectedDate)})
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-300">
                  بڕی پارەی پێویست بۆ هەر یاریزانێک (دینار):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={customPlayerFeeInput}
                    onChange={(e) => setCustomPlayerFeeInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-2xl px-4 py-3 text-xl font-mono font-black text-emerald-300 focus:outline-none tracking-wide"
                    placeholder="5000"
                    autoFocus
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    د.ع
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-bold text-slate-400">بڕی خێرا:</span>
                  {[3000, 4000, 5000, 6000, 7000, 8000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomPlayerFeeInput(amt)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        customPlayerFeeInput === amt
                          ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditPlayerFeeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                پەشیمانبوونەوە
              </button>
              <button
                type="button"
                onClick={handleSavePlayerFeeModal}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>پاشەکەوتکردنی بڕەکە</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Pitch Rent Editor Modal */}
      {isEditPitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto" dir="rtl">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-blue-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl my-4 text-right">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    دەستکاریکردنی پارەی وەصڵی ساحە / یاریگا
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {viewMode === 'matrix' 
                      ? `بۆ مانگی ${selectedMonth > 0 ? KURDISH_MONTHS[selectedMonth - 1] : 'سێشەممەکان'} (${matrixTuesdays.length} سێشەممە)`
                      : `بۆ سێشەممەی: ${formatKurdishDate(selectedDate)}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditPitchModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {viewMode === 'matrix' && (
              <div className="mt-4 flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPitchEditMode('total')}
                  className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                    pitchEditMode === 'total' ? 'bg-blue-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  کۆی گشتی مانگانە (Total)
                </button>
                <button
                  type="button"
                  onClick={() => setPitchEditMode('per_session')}
                  className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                    pitchEditMode === 'per_session' ? 'bg-blue-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  بۆ هەر سێشەممەیەک (Per Week)
                </button>
                <button
                  type="button"
                  onClick={() => setPitchEditMode('custom_sessions')}
                  className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                    pitchEditMode === 'custom_sessions' ? 'bg-blue-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  دەستکاری سێشەممەکان (Custom)
                </button>
              </div>
            )}

            <div className="mt-4 space-y-4">
              
              {pitchEditMode === 'total' && (
                <div className="space-y-3">
                  <label className="block text-xs font-black text-slate-300">
                    بڕی پارەی کۆی گشتی کرێی یاریگا (دینار):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={customPitchTotalInput}
                      onChange={(e) => setCustomPitchTotalInput(Number(e.target.value))}
                      className="w-full bg-slate-950 border-2 border-blue-500/50 focus:border-blue-400 rounded-2xl px-4 py-3 text-xl font-mono font-black text-blue-300 focus:outline-none tracking-wide"
                      placeholder="150000"
                      autoFocus
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      د.ع
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] font-bold text-slate-400">بڕی خێرا:</span>
                    {[150000, 120000, 100000, 80000, 60000, 30000, 25000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCustomPitchTotalInput(amt)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          customPitchTotalInput === amt
                            ? 'bg-blue-500 text-slate-950 font-black border-blue-400'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {formatCurrency(amt)}
                      </button>
                    ))}
                  </div>

                  {viewMode === 'matrix' && matrixTuesdays.length > 0 && (
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                      <span>دابەشکراو بەسەر {matrixTuesdays.length} سێشەممە:</span>
                      <span className="font-mono font-black text-blue-400">
                        {formatCurrency(Math.round(customPitchTotalInput / matrixTuesdays.length))} / هەفتە
                      </span>
                    </div>
                  )}
                </div>
              )}

              {pitchEditMode === 'per_session' && (
                <div className="space-y-3">
                  <label className="block text-xs font-black text-slate-300">
                    کرێی یاریگا بۆ هەر یەک سێشەممە (دینار):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="2500"
                      min="0"
                      value={customPitchPerSessionInput}
                      onChange={(e) => setCustomPitchPerSessionInput(Number(e.target.value))}
                      className="w-full bg-slate-950 border-2 border-blue-500/50 focus:border-blue-400 rounded-2xl px-4 py-3 text-xl font-mono font-black text-blue-300 focus:outline-none tracking-wide"
                      placeholder="30000"
                      autoFocus
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      د.ع / هەفتە
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] font-bold text-slate-400">بڕی خێرا:</span>
                    {[37500, 30000, 25000, 20000, 40000, 50000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCustomPitchPerSessionInput(amt)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          customPitchPerSessionInput === amt
                            ? 'bg-blue-500 text-slate-950 font-black border-blue-400'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {formatCurrency(amt)}
                      </button>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                    <span>کۆی گشتی بۆ {matrixTuesdays.length} سێشەممە دەبێتە:</span>
                    <span className="font-mono font-black text-blue-400 text-sm">
                      {formatCurrency(customPitchPerSessionInput * matrixTuesdays.length)}
                    </span>
                  </div>
                </div>
              )}

              {pitchEditMode === 'custom_sessions' && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <span className="block text-xs font-bold text-slate-400 mb-2">
                    دەستکاریکردنی کرێی یاریگا بە جیا بۆ هەر سێشەممەیەک:
                  </span>
                  {matrixTuesdays.map((tDate) => (
                    <div key={tDate} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                      <span className="text-xs font-bold text-slate-300">
                        سێشەممە {formatDisplayDate(tDate)}
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="1000"
                          value={customPitchSessionMap[tDate] !== undefined ? customPitchSessionMap[tDate] : 25000}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomPitchSessionMap((prev) => ({ ...prev, [tDate]: val }));
                          }}
                          className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-blue-400 font-mono font-bold text-center"
                        />
                        <span className="text-[11px] text-slate-500">د.ع</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditPitchModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                پەشیمانبوونەوە
              </button>
              <button
                type="button"
                onClick={handleSavePitchModal}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>پاشەکەوتکردنی بڕەکە</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. Expenses & Balls Editor Modal */}
      {isEditExpensesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto" dir="rtl">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl my-4 text-right">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    دەستکاریکردنی کڕینی پێداویستی و تۆپ
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تۆپ، ئاو، درێس، فریاگوزاری و مەساریفی زیادەی تیم
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditExpensesModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-300">
                    کۆی خەرجییەکان (Total Expenses):
                  </label>
                  <span className="text-sm font-mono font-black text-amber-400">
                    {formatCurrency(tempExpenseItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0))}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-bold text-slate-400">دانانی خێرا:</span>
                  {[20000, 15000, 25000, 30000, 50000, 0].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        if (amt === 0) {
                          setTempExpenseItems([]);
                        } else {
                          setTempExpenseItems([
                            { id: `exp_${Date.now()}`, title: 'کڕینی تۆپ و پێداویستی', amount: amt }
                          ]);
                        }
                      }}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-950 text-slate-300 border border-slate-800 hover:border-amber-500/50 hover:text-amber-300 transition cursor-pointer"
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">
                    لیستی بابەتەکانی خەرجکراو:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTempExpenseItems((prev) => [
                        ...prev,
                        { id: `exp_${Date.now()}`, title: 'بابەتی نوێ', amount: 5000 }
                      ]);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>زیادکردنی خەرجی</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {tempExpenseItems.length === 0 ? (
                    <div className="text-center py-6 bg-slate-950 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500">
                      هیچ خەرجییەک دانەنراوە (٠ دینار).
                    </div>
                  ) : (
                    tempExpenseItems.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTempExpenseItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, title: val } : it))
                            );
                          }}
                          placeholder="ناوی خەرجی (بۆ نموونە: تۆپ)"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={item.amount}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              setTempExpenseItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, amount: val } : it))
                              );
                            }}
                            className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-amber-400 font-mono font-bold text-center"
                          />
                          <span className="text-[11px] text-slate-500">د.ع</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTempExpenseItems((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="سڕینەوە"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  <span className="text-[10px] text-slate-500">پێشنیارەکان:</span>
                  {[
                    { title: 'کڕینی تۆپ', amount: 15000 },
                    { title: 'ئاو و شەربەت', amount: 5000 },
                    { title: 'درێس / یەکپۆشی', amount: 25000 },
                    { title: 'فریاگوزاری یاریزانان', amount: 5000 }
                  ].map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => {
                        setTempExpenseItems((prev) => [
                          ...prev,
                          { id: `exp_${Date.now()}_${sIdx}`, title: sug.title, amount: sug.amount }
                        ]);
                      }}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                    >
                      + {sug.title} ({formatCurrency(sug.amount)})
                    </button>
                  ))}
                </div>

              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditExpensesModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                پەشیمانبوونەوە
              </button>
              <button
                type="button"
                onClick={handleSaveExpensesModal}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-600/30 transition active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>پاشەکەوتکردنی خەرجییەکان</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 8. Export Image Modal */}
      {isExportModalOpen && (
        <ExportFinanceImageModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          session={currentSession}
          sessions={sessions}
          players={players}
          matrixTuesdays={matrixTuesdays}
          sessionMap={sessionMap}
          playerMatrixStats={playerMatrixStats}
          columnMatrixTotals={columnMatrixTotals}
          activeSummary={activeSummary}
          leagueTitle={leagueTitle}
          exportMode={exportMode}
        />
      )}

    </div>
  );
};
