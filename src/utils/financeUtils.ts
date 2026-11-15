import { WeeklyFinanceSession, Player, PlayerFinanceRecord, ExpenseItem } from '../types';

// Format numbers in Kurdish/Arabic digits or standard localized format
export const formatCurrency = (amount: number): string => {
  return (amount || 0).toLocaleString('en-US') + ' دینار';
};

// Format date as DD/MM/YYYY (e.g. 11/08/2026)
export const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const yyyy = parts[0];
  const mm = parts[1];
  const dd = parts[2];
  return `${dd}/${mm}/${yyyy}`;
};

// Generate list of all Tuesdays for a given year (e.g. 2026) or month
export const getTuesdaysForYear = (year: number = new Date().getFullYear()): string[] => {
  const tuesdays: string[] = [];
  const date = new Date(year, 0, 1);

  // Move to the first Tuesday of the year (Day 2 in JS getDay() is Tuesday)
  while (date.getDay() !== 2) {
    date.setDate(date.getDate() + 1);
  }

  // Collect all Tuesdays of the year
  while (date.getFullYear() === year) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    tuesdays.push(`${yyyy}-${mm}-${dd}`);
    date.setDate(date.getDate() + 7);
  }

  return tuesdays;
};

// Get Tuesdays for a specific month (1-12) of a year
export const getTuesdaysForMonth = (year: number, month: number): string[] => {
  const allYear = getTuesdaysForYear(year);
  const mm = String(month).padStart(2, '0');
  const prefix = `${year}-${mm}`;
  return allYear.filter((d) => d.startsWith(prefix));
};

// Find the closest Tuesday to today
export const getClosestTuesday = (): string => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, ...
  
  // Calculate distance to Tuesday (day 2)
  let diff = 2 - currentDay;
  if (diff < -3) {
    diff += 7;
  }
  
  const targetTuesday = new Date(today);
  targetTuesday.setDate(today.getDate() + diff);

  const yyyy = targetTuesday.getFullYear();
  const mm = String(targetTuesday.getMonth() + 1).padStart(2, '0');
  const dd = String(targetTuesday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Kurdish Month Names
export const KURDISH_MONTHS = [
  'کانوونی دووەم (1)',
  'شوبات (2)',
  'ئازار (3)',
  'نیسان (4)',
  'ئایار (5)',
  'حوزەیران (6)',
  'تەممووز (7)',
  'ئاب (8)',
  'ئەیلوول (9)',
  'تشرینی یەکەم (10)',
  'تشرینی دووەم (11)',
  'کانوونی یەکەم (12)'
];

// Kurdish friendly date string with dynamic accurate day of week
export const formatKurdishDate = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;

  const yyyy = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10) - 1;
  const dd = parseInt(parts[2], 10);
  const date = new Date(yyyy, mm, dd);

  const KURDISH_DAYS = [
    'یەکشەممە',
    'دووشەممە',
    'سێشەممە',
    'چوارشەممە',
    'پێنجشەممە',
    'هەینی',
    'شەممە',
  ];

  const dayName = !isNaN(date.getTime()) ? KURDISH_DAYS[date.getDay()] : '';
  const monthName = KURDISH_MONTHS[mm]?.split(' ')[0] || `مانگی ${mm + 1}`;
  return dayName ? `${dayName}، ${dd}ی ${monthName}ی ${yyyy}` : `${dd}ی ${monthName}ی ${yyyy}`;
};

// Helper to check if a player is typically a goalkeeper
export const isGoalkeeper = (player: Player): boolean => {
  if (!player) return false;
  const pos = (player.position || '').toUpperCase();
  const name = player.name || '';
  return pos === 'GK' || pos.includes('GOAL') || name.includes('گۆڵچی') || name.includes('گۆلچی');
};

// Compute cumulative previous debts for all players across all recorded sessions up to a specific date
export const calculatePlayerDebtsUpToSession = (
  sessions: WeeklyFinanceSession[],
  currentSessionId: string,
  players: Player[]
): Record<string, number> => {
  // Sort sessions chronologically
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const debts: Record<string, number> = {};

  // Initialize for all players
  players.forEach((p) => {
    debts[p.id] = 0;
  });

  for (const session of sorted) {
    if (session.id === currentSessionId) {
      break; // stop at current session
    }

    // Process record for each player in this past session
    for (const [playerId, record] of Object.entries(session.records)) {
      if (record) {
        debts[playerId] = (debts[playerId] || 0) + (record.currentDebt || 0);
      }
    }
  }

  return debts;
};

// Create a new blank or initialized weekly session for a given Tuesday
export const createInitialSession = (
  date: string,
  players: Player[],
  previousDebts: Record<string, number> = {},
  standardFee: number = 5000,
  pitchCost: number = 25000
): WeeklyFinanceSession => {
  const records: Record<string, PlayerFinanceRecord> = {};

  // Sort: Goalkeepers or first 14 players
  players.forEach((p, idx) => {
    const prevDebt = previousDebts[p.id] || 0;
    const isGK = isGoalkeeper(p);
    const isInjured = p.status === 'injured';
    
    // First 14 active players attend by default
    const isAttending = !isInjured && idx < 14;
    
    // Goalkeepers or injured players are exempt from weekly fee
    const isExempt = isGK;
    const status: 'attended' | 'absent' | 'exempt' = isInjured
      ? 'absent'
      : isExempt
      ? 'exempt'
      : isAttending
      ? 'attended'
      : 'absent';

    const baseFee = status === 'attended' ? standardFee : 0;
    const totalReq = baseFee + prevDebt;
    const paid = status === 'attended' ? baseFee : 0;
    const currentDebt = Math.max(0, totalReq - paid);

    records[p.id] = {
      playerId: p.id,
      playerName: p.name,
      attended: status === 'attended',
      status: status,
      isExempt: isExempt,
      standardFee: baseFee,
      previousDebt: prevDebt,
      totalRequired: totalReq,
      paidAmount: paid,
      currentDebt: currentDebt,
      isSettled: currentDebt === 0,
      note: isInjured ? '🩹 پێکان (دەرهێنراو لە حیسابات)' : isExempt ? 'بەخشراو (گۆڵچی)' : status === 'absent' ? 'ئامادەنەبوو' : ''
    };
  });

  return {
    id: `finance_session_${date}_${Date.now()}`,
    date: date,
    sessionTitle: formatKurdishDate(date),
    standardFeePerPlayer: standardFee,
    pitchCost: pitchCost,
    otherExpenses: [
      { id: 'exp_ball', title: 'کڕینی تۆپ یان ئاو', amount: 5000 }
    ],
    records: records,
    notes: 'حیساباتی یاری سێشەممە',
    createdAt: new Date().toISOString()
  };
};

// Calculate summary totals for a session
export interface SessionFinancialSummary {
  totalAttendees: number;
  totalAbsent: number;
  totalExempt: number; // ژمارەی بەخشراوەکان (گۆڵچی)
  totalPayingAttendees: number; // ئەوانەی پارە دەدەن (١٢ یاریزان کاتێک ١٤ یاریزانن و ٢ گۆڵچی بەخشراون)
  totalCollected: number; // بڕی پارەی کۆکراوە
  totalPitchCost: number; // کرێی یاریگا
  totalOtherExpenses: number; // مەساریفی تر
  totalExpenses: number; // کۆی خەرجییەکان
  remainingBalance: number; // باقی پارەی ماوەتەوە (Total Collected - Total Expenses)
  totalOutstandingDebt: number; // کۆی گشتی قەرزی نەدراو
  debtorsCount: number; // ژمارەی قەرزارەکان
  settledCount: number; // ژمارەی ئەوانەی پاکیان کردۆتەوە
}

export const computeSessionSummary = (session: WeeklyFinanceSession): SessionFinancialSummary => {
  let totalAttendees = 0;
  let totalAbsent = 0;
  let totalExempt = 0;
  let totalPayingAttendees = 0;
  let totalCollected = 0;
  let totalOutstandingDebt = 0;
  let debtorsCount = 0;
  let settledCount = 0;

  Object.values(session.records || {}).forEach((rec) => {
    const isExempt = rec.status === 'exempt' || rec.isExempt;
    const isAbsent = rec.status === 'absent' || (!rec.attended && !isExempt);

    if (isAbsent) {
      totalAbsent++;
    } else if (isExempt) {
      totalAttendees++;
      totalExempt++;
    } else {
      totalAttendees++;
      totalPayingAttendees++;
    }

    totalCollected += Number(rec.paidAmount) || 0;
    const debt = Number(rec.currentDebt) || 0;
    if (debt > 0) {
      totalOutstandingDebt += debt;
      debtorsCount++;
    } else {
      settledCount++;
    }
  });

  const totalPitchCost = Number(session.pitchCost) || 0;
  const totalOtherExpenses = (session.otherExpenses || []).reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const totalExpenses = totalPitchCost + totalOtherExpenses;
  const remainingBalance = totalCollected - totalExpenses;

  return {
    totalAttendees,
    totalAbsent,
    totalExempt,
    totalPayingAttendees,
    totalCollected,
    totalPitchCost,
    totalOtherExpenses,
    totalExpenses,
    remainingBalance,
    totalOutstandingDebt,
    debtorsCount,
    settledCount
  };
};

export interface MultiSessionSummary {
  totalIncome: number; // کۆی گشتی پارەی کۆکراوەتەوە
  totalPitchRent: number; // پارەی وەصلی ساحە / یاریگای مانگانە
  totalOtherExpenses: number; // پارەی کڕینی پێداویستی / تۆپ و مەساریف
  totalExpenses: number; // کۆی گشتی خەرجییەکان
  netBalance: number; // باقی پارەی ماوەتەوە (Total Income - Total Expenses)
  totalOutstandingDebt: number; // کۆی قەرزە نەدراوەکان
  sessionsCount: number;
}

export const computeMultiSessionSummary = (
  sessions: WeeklyFinanceSession[],
  tuesdayDates?: string[]
): MultiSessionSummary => {
  const targetSessions = tuesdayDates
    ? sessions.filter((s) => tuesdayDates.includes(s.date))
    : sessions;

  let totalIncome = 0;
  let totalPitchRent = 0;
  let totalOtherExpenses = 0;
  let totalOutstandingDebt = 0;

  targetSessions.forEach((s) => {
    totalPitchRent += Number(s.pitchCost) || 0;
    (s.otherExpenses || []).forEach((exp) => {
      totalOtherExpenses += Number(exp.amount) || 0;
    });

    Object.values(s.records || {}).forEach((rec) => {
      totalIncome += Number(rec.paidAmount) || 0;
      totalOutstandingDebt += Number(rec.currentDebt) || 0;
    });
  });

  const totalExpenses = totalPitchRent + totalOtherExpenses;
  const netBalance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalPitchRent,
    totalOtherExpenses,
    totalExpenses,
    netBalance,
    totalOutstandingDebt,
    sessionsCount: targetSessions.length,
  };
};

