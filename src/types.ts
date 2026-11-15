export type PlayerPosition = 'all' | 'forward' | 'midfield' | 'defender' | 'goalkeeper';
export type PlayerStatus = 'active' | 'injured' | 'absent';

export interface Player {
  id: string;
  name: string;
  wins: number;
  draws: number;
  losses: number;
  position?: 'forward' | 'midfield' | 'defender' | 'goalkeeper';
  avatar?: string;
  notes?: string;
  goals?: number;
  assists?: number;
  matchRating?: number;
  customScore?: number;
  customRank?: number;
  form?: ('W' | 'D' | 'L')[];
  status?: PlayerStatus;
}

export type RankingSystem = 'fair_wpi' | 'win_rate' | 'total_points' | 'bayesian';

export interface ComputedPlayerStats extends Player {
  rank: number;
  prevRank?: number;
  totalMatches: number;
  basePoints: number; // Base points from wins and draws (wins*3 + draws*1)
  matchBonus: number; // Small bonus points awarded for total matches played
  totalPoints: number; // Total points including match participation bonus
  winRate: number; // Raw % e.g. 57.14
  rawRating: number; // e.g. 5.71
  fairScore: number; // WPI score e.g. 63.44
  fairRating: number; // WPI / 10 e.g. 6.34
  pointsPerMatch: number;
  tier: 'champions' | 'top' | 'mid' | 'danger';
}

export interface MatchRecord {
  id: string;
  date: string;
  teamAName: string;
  teamBName: string;
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
  scoreA: number;
  scoreB: number;
  notes?: string;
}

export interface RankingConfig {
  system: RankingSystem;
  bonusFactor: number; // default 0.3 (WPI bonus factor)
  matchBonusPoints: number; // default 0.25 (small bonus points per total match played)
  winPoints: number; // default 3
  drawPoints: number; // default 1
  lossPoints: number; // default 0
  minMatchesForRanking: number; // default 0
}

export type ThemeColor = 'emerald' | 'amber' | 'blue' | 'purple' | 'crimson';

export interface ThemeConfig {
  themeColor: ThemeColor;
  showSpotlight: boolean;
  showDangerZone: boolean;
  showFormulaExplainer: boolean;
  leagueTitle: string;
  leagueSubtitle: string;
  compactMode: boolean;
  logoUrl?: string; // Custom logo/story image URL or base64 data
  stories?: string[]; // Multiple story photos rotating automatically
  storyTitle?: string;
  storyWidgetWidth?: number; // Custom width in pixels (160 - 550)
  storyWidgetHeight?: number; // Custom height in pixels (120 - 450)
  storyWidgetSize?: 'small' | 'medium' | 'large' | 'xl' | 'custom';
}

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
}

export type PlayerAttendanceStatus = 'attended' | 'absent' | 'exempt';

export interface PlayerFinanceRecord {
  playerId: string;
  playerName: string;
  attended: boolean;
  status?: PlayerAttendanceStatus; // 'attended' (هاتووە), 'absent' (نەهاتووە), 'exempt' (بەخشراو / گۆڵچی)
  isExempt?: boolean; // بەخشراو لە پارەدان وەک گۆڵچییەکان
  standardFee: number; // standard per match fee e.g. 5000 (0 for absent or exempt)
  previousDebt: number; // unpaid balance carried from earlier weeks
  totalRequired: number; // required fee + previousDebt
  paidAmount: number; // amount paid by player today
  currentDebt: number; // remaining debt after payment
  isSettled: boolean;
  note?: string;
}

export interface WeeklyFinanceSession {
  id: string;
  date: string; // YYYY-MM-DD (Tuesday)
  sessionTitle: string;
  standardFeePerPlayer: number; // default 5000
  pitchCost: number; // کرێی یاریگا default 25000
  otherExpenses: ExpenseItem[];
  records: Record<string, PlayerFinanceRecord>;
  notes?: string;
  createdAt: string;
}

// 6v6 Football Lineup Builder Types
export type Formation6v6 = '1-2-2-1' | '1-3-1-1' | '1-2-1-2' | '2-2-1' | '1-3-2' | '1-1-3-1' | '1-2-3' | '1-1-2-2';
export type KitColor = 'yellow' | 'blue' | 'red' | 'emerald' | 'white' | 'black' | 'purple' | 'orange' | 'cyan';

export interface TacticalPosition {
  x: number; // 0 to 100 percentage on pitch half
  y: number; // 0 to 100 percentage on pitch half
  role: 'GK' | 'DEF' | 'MID' | 'FWD';
  label: string;
}

export interface TeamLineup {
  name: string;
  color: KitColor;
  formation: Formation6v6;
  starterIds: (string | null)[]; // length = 6
  substituteIds: (string | null)[]; // length = subCount (e.g. 2 or 1)
  customPositions?: TacticalPosition[]; // Custom drag-and-drop coordinates
}

export interface LineupMatchState {
  id: string;
  title: string;
  date: string;
  subCount: number; // default 2, can be 0, 1, 2, 3, 4
  teamA: TeamLineup;
  teamB: TeamLineup;
}
