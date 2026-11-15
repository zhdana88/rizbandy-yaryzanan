import { 
  Player, 
  RankingConfig, 
  ThemeConfig, 
  MatchRecord, 
  WeeklyFinanceSession, 
  LineupMatchState 
} from '../types';
import { INITIAL_PLAYERS } from '../data/initialPlayers';
import { DEFAULT_CONFIG } from './rankingCalculator';
import { ensurePlayerAvatars } from './avatarHelper';

// Master unified storage key as requested
export const GLOBAL_APP_STATE_KEY = 'FOOTBALL_APP_STATE_V1';

// Modular legacy/sub-keys for maximum backward and component compatibility
export const PLAYERS_STORAGE_KEY = 'fair_football_players_v1';
export const CONFIG_STORAGE_KEY = 'fair_football_config_v1';
export const THEME_STORAGE_KEY = 'fair_football_theme_v1';
export const HISTORY_STORAGE_KEY = 'fair_football_matches_v1';
export const FINANCE_STORAGE_KEY = 'fair_football_finance_v1';
export const LINEUP_STORAGE_KEY = 'fair_football_lineup_6v6_v1';

export const DEFAULT_THEME: ThemeConfig = {
  themeColor: 'emerald',
  showSpotlight: true,
  showDangerZone: true,
  showFormulaExplainer: true,
  leagueTitle: 'ئەپی ریزبەندی یاریزان',
  leagueSubtitle: 'سیستەمی دادپەروەرانەی تۆپی پێ • WPI',
  compactMode: false,
};

export interface FullAppState {
  version: string;
  lastSavedAt: string;
  players: Player[];
  config: RankingConfig;
  themeConfig: ThemeConfig;
  matchHistory: MatchRecord[];
  financeSessions: WeeklyFinanceSession[];
  lineup: LineupMatchState | null;
}

/**
 * Safely parse JSON from localStorage with error logging
 */
function safeGetJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[PersistentStorage] Error reading key "${key}"`, err);
    return null;
  }
}

/**
 * Safely write JSON to localStorage with quota check and error handling
 */
function safeSetJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[PersistentStorage] Failed to write key "${key}" to localStorage`, err);
    return false;
  }
}

/**
 * Load complete application state:
 * 1. Checks GLOBAL_APP_STATE_KEY first
 * 2. Falls back to individual modular keys
 * 3. Only falls back to INITIAL_PLAYERS / defaults if storage is completely empty
 */
export function loadFullAppState(): FullAppState {
  // 1. Try unified master state first
  const master = safeGetJSON<FullAppState>(GLOBAL_APP_STATE_KEY);
  if (master && Array.isArray(master.players) && master.players.length > 0) {
    return {
      version: master.version || '1.0',
      lastSavedAt: master.lastSavedAt || new Date().toISOString(),
      players: ensurePlayerAvatars(master.players),
      config: master.config ? { ...DEFAULT_CONFIG, ...master.config } : DEFAULT_CONFIG,
      themeConfig: master.themeConfig ? { ...DEFAULT_THEME, ...master.themeConfig } : DEFAULT_THEME,
      matchHistory: Array.isArray(master.matchHistory) ? master.matchHistory : [],
      financeSessions: Array.isArray(master.financeSessions) ? master.financeSessions : [],
      lineup: master.lineup || null,
    };
  }

  // 2. Check modular keys
  const modularPlayers = safeGetJSON<Player[]>(PLAYERS_STORAGE_KEY);
  const modularConfig = safeGetJSON<RankingConfig>(CONFIG_STORAGE_KEY);
  const modularTheme = safeGetJSON<ThemeConfig>(THEME_STORAGE_KEY);
  const modularHistory = safeGetJSON<MatchRecord[]>(HISTORY_STORAGE_KEY);
  const modularFinance = safeGetJSON<WeeklyFinanceSession[]>(FINANCE_STORAGE_KEY);
  const modularLineup = safeGetJSON<LineupMatchState>(LINEUP_STORAGE_KEY);

  const hasModularData = Array.isArray(modularPlayers) && modularPlayers.length > 0;

  const resolvedPlayers = hasModularData
    ? ensurePlayerAvatars(modularPlayers)
    : ensurePlayerAvatars(INITIAL_PLAYERS);

  const resolvedConfig = modularConfig
    ? { ...DEFAULT_CONFIG, ...modularConfig }
    : DEFAULT_CONFIG;

  const resolvedTheme = modularTheme
    ? { ...DEFAULT_THEME, ...modularTheme }
    : DEFAULT_THEME;

  const resolvedHistory = Array.isArray(modularHistory) ? modularHistory : [];
  const resolvedFinance = Array.isArray(modularFinance) ? modularFinance : [];
  const resolvedLineup = modularLineup || null;

  const state: FullAppState = {
    version: '1.0',
    lastSavedAt: new Date().toISOString(),
    players: resolvedPlayers,
    config: resolvedConfig,
    themeConfig: resolvedTheme,
    matchHistory: resolvedHistory,
    financeSessions: resolvedFinance,
    lineup: resolvedLineup,
  };

  // If this was first time or had modular data, write to master key for fast next boot
  safeSetJSON(GLOBAL_APP_STATE_KEY, state);

  return state;
}

/**
 * Save complete application state to both unified and modular storage keys
 */
export function saveFullAppState(partialState: Partial<FullAppState>): void {
  const current = loadFullAppState();
  const nextState: FullAppState = {
    ...current,
    ...partialState,
    lastSavedAt: new Date().toISOString(),
  };

  // 1. Write unified master key
  safeSetJSON(GLOBAL_APP_STATE_KEY, nextState);

  // 2. Write modular keys
  if (partialState.players !== undefined) {
    safeSetJSON(PLAYERS_STORAGE_KEY, nextState.players);
  }
  if (partialState.config !== undefined) {
    safeSetJSON(CONFIG_STORAGE_KEY, nextState.config);
  }
  if (partialState.themeConfig !== undefined) {
    safeSetJSON(THEME_STORAGE_KEY, nextState.themeConfig);
  }
  if (partialState.matchHistory !== undefined) {
    safeSetJSON(HISTORY_STORAGE_KEY, nextState.matchHistory);
  }
  if (partialState.financeSessions !== undefined) {
    safeSetJSON(FINANCE_STORAGE_KEY, nextState.financeSessions);
  }
  if (partialState.lineup !== undefined) {
    safeSetJSON(LINEUP_STORAGE_KEY, nextState.lineup);
  }

  // Dispatch event for UI reactivity
  try {
    window.dispatchEvent(new CustomEvent('app_state_saved', { detail: nextState }));
  } catch (e) {
    // Ignore event dispatch failure in non-browser envs
  }
}

/**
 * Directly save players array and trigger master sync
 */
export function savePlayersToStorage(players: Player[]): void {
  const safePlayers = ensurePlayerAvatars(players);
  safeSetJSON(PLAYERS_STORAGE_KEY, safePlayers);
  saveFullAppState({ players: safePlayers });
}

/**
 * Directly save config and trigger master sync
 */
export function saveConfigToStorage(config: RankingConfig): void {
  safeSetJSON(CONFIG_STORAGE_KEY, config);
  saveFullAppState({ config });
}

/**
 * Directly save theme and trigger master sync
 */
export function saveThemeToStorage(themeConfig: ThemeConfig): void {
  safeSetJSON(THEME_STORAGE_KEY, themeConfig);
  saveFullAppState({ themeConfig });
}

/**
 * Directly save match history and trigger master sync
 */
export function saveMatchesToStorage(matchHistory: MatchRecord[]): void {
  safeSetJSON(HISTORY_STORAGE_KEY, matchHistory);
  saveFullAppState({ matchHistory });
}

/**
 * Directly save finance sessions and trigger master sync
 */
export function saveFinanceToStorage(financeSessions: WeeklyFinanceSession[]): void {
  safeSetJSON(FINANCE_STORAGE_KEY, financeSessions);
  saveFullAppState({ financeSessions });
}

/**
 * Directly save lineup state and trigger master sync
 */
export function saveLineupToStorage(lineup: LineupMatchState): void {
  safeSetJSON(LINEUP_STORAGE_KEY, lineup);
  saveFullAppState({ lineup });
}

/**
 * Clear all stored data and reset to initial state
 */
export function clearAllStoredData(): FullAppState {
  try {
    localStorage.removeItem(GLOBAL_APP_STATE_KEY);
    localStorage.removeItem(PLAYERS_STORAGE_KEY);
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    localStorage.removeItem(FINANCE_STORAGE_KEY);
    localStorage.removeItem(LINEUP_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing localStorage', e);
  }

  const freshState: FullAppState = {
    version: '1.0',
    lastSavedAt: new Date().toISOString(),
    players: ensurePlayerAvatars(INITIAL_PLAYERS),
    config: DEFAULT_CONFIG,
    themeConfig: DEFAULT_THEME,
    matchHistory: [],
    financeSessions: [],
    lineup: null,
  };

  safeSetJSON(GLOBAL_APP_STATE_KEY, freshState);
  safeSetJSON(PLAYERS_STORAGE_KEY, freshState.players);
  safeSetJSON(CONFIG_STORAGE_KEY, freshState.config);
  safeSetJSON(THEME_STORAGE_KEY, freshState.themeConfig);
  safeSetJSON(HISTORY_STORAGE_KEY, freshState.matchHistory);
  safeSetJSON(FINANCE_STORAGE_KEY, freshState.financeSessions);

  return freshState;
}

/**
 * Android WebView / Mobile / Browser Lifecycle Hooks:
 * Flushes state synchronously when app is backgrounded or tab is closed.
 */
export function registerBackgroundSaveHooks(getState: () => Partial<FullAppState>): () => void {
  const flushState = () => {
    try {
      const state = getState();
      saveFullAppState(state);
    } catch (e) {
      console.warn('[PersistentStorage] Background flush failed', e);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      flushState();
    }
  };

  window.addEventListener('beforeunload', flushState);
  window.addEventListener('pagehide', flushState);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('beforeunload', flushState);
    window.removeEventListener('pagehide', flushState);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
