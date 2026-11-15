/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {lazy, Suspense, useState, useEffect, useMemo, useRef} from 'react';
import { 
  Trophy, 
  Users, 
  SlidersHorizontal, 
  Download, 
  Upload, 
  Share2, 
  Sparkles, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Plus,
  Play,
  Filter,
  FileSpreadsheet,
  Image as ImageIcon,
  BarChart3,
  Palette,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { Player, ComputedPlayerStats, RankingConfig, MatchRecord, PlayerPosition, ThemeConfig, WeeklyFinanceSession } from './types';
import { INITIAL_PLAYERS } from './data/initialPlayers';
import { rankPlayers, DEFAULT_CONFIG } from './utils/rankingCalculator';
import { ensurePlayerAvatars } from './utils/avatarHelper';
import type {Session} from '@supabase/supabase-js';
import {
  fetchCloudAppState,
  getCloudStateFingerprint,
  insertCloudAppState,
  parseCloudAppState,
  subscribeToCloudAppState,
  updateCloudAppState,
} from './lib/cloudState';
import {getSupabaseSetupError, supabase} from './lib/supabase';
import { 
  loadFullAppState, 
  saveFullAppState, 
  savePlayersToStorage, 
  saveConfigToStorage, 
  saveThemeToStorage, 
  saveMatchesToStorage, 
  saveFinanceToStorage, 
  clearAllStoredData, 
  registerBackgroundSaveHooks,
  GLOBAL_APP_STATE_KEY,
  PLAYERS_STORAGE_KEY,
  CONFIG_STORAGE_KEY,
  THEME_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  FINANCE_STORAGE_KEY,
  DEFAULT_THEME 
} from './utils/persistentStorage';
import type {FullAppState} from './utils/persistentStorage';

import { Navbar } from './components/Navbar';
import { StatsBanner } from './components/StatsBanner';
import { QuickBonusToolbar } from './components/QuickBonusToolbar';
import { FormulaExplainer } from './components/FormulaExplainer';
import { RankingTable } from './components/RankingTable';
import { PlayerCardGrid } from './components/PlayerCardGrid';
import { TopSpotlightCards } from './components/TopSpotlightCards';
import { DangerZoneAlert } from './components/DangerZoneAlert';
import { HomeVisualHub } from './components/HomeVisualHub';
import { InjuredPlayersCard } from './components/InjuredPlayersCard';

const PlayerProfileModal = lazy(() => import('./components/PlayerProfileModal').then(({PlayerProfileModal}) => ({default: PlayerProfileModal})));
const PlayerEditModal = lazy(() => import('./components/PlayerEditModal').then(({PlayerEditModal}) => ({default: PlayerEditModal})));
const MatchRecorderModal = lazy(() => import('./components/MatchRecorderModal').then(({MatchRecorderModal}) => ({default: MatchRecorderModal})));
const FormulaConfigModal = lazy(() => import('./components/FormulaConfigModal').then(({FormulaConfigModal}) => ({default: FormulaConfigModal})));
const ShareSummaryModal = lazy(() => import('./components/ShareSummaryModal').then(({ShareSummaryModal}) => ({default: ShareSummaryModal})));
const LiveSpreadsheetEditor = lazy(() => import('./components/LiveSpreadsheetEditor').then(({LiveSpreadsheetEditor}) => ({default: LiveSpreadsheetEditor})));
const LookerStudioSyncModal = lazy(() => import('./components/LookerStudioSyncModal').then(({LookerStudioSyncModal}) => ({default: LookerStudioSyncModal})));
const ExportLeaderboardImageModal = lazy(() => import('./components/ExportLeaderboardImageModal').then(({ExportLeaderboardImageModal}) => ({default: ExportLeaderboardImageModal})));
const ThemeCustomizerModal = lazy(() => import('./components/ThemeCustomizerModal').then(({ThemeCustomizerModal}) => ({default: ThemeCustomizerModal})));
const QuickRatingModal = lazy(() => import('./components/QuickRatingModal').then(({QuickRatingModal}) => ({default: QuickRatingModal})));
const DeleteConfirmationModal = lazy(() => import('./components/DeleteConfirmationModal').then(({DeleteConfirmationModal}) => ({default: DeleteConfirmationModal})));
const StoryViewerModal = lazy(() => import('./components/StoryViewerModal').then(({StoryViewerModal}) => ({default: StoryViewerModal})));
const ResetConfirmationModal = lazy(() => import('./components/ResetConfirmationModal').then(({ResetConfirmationModal}) => ({default: ResetConfirmationModal})));
const AdminLoginModal = lazy(() => import('./components/AdminLoginModal').then(({AdminLoginModal}) => ({default: AdminLoginModal})));
const FinanceDashboard = lazy(() => import('./components/FinanceDashboard').then(({FinanceDashboard}) => ({default: FinanceDashboard})));
const LineupBuilder = lazy(() => import('./components/LineupBuilder').then(({LineupBuilder}) => ({default: LineupBuilder})));

export default function App() {
  // Load master persisted state initially
  const initialLoadedState = useMemo(() => loadFullAppState(), []);

  // 1. Players State
  const [players, setPlayers] = useState<Player[]>(() => initialLoadedState.players);

  // 2. Ranking Configuration State
  const [config, setConfig] = useState<RankingConfig>(() => initialLoadedState.config);

  // 3. Theme Configuration State
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => initialLoadedState.themeConfig);

  // 4. Match History State
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>(() => initialLoadedState.matchHistory);

  // 5. Weekly Finance Sessions State
  const [financeSessions, setFinanceSessions] = useState<WeeklyFinanceSession[]>(() => initialLoadedState.financeSessions);

  // UI States
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const isAdmin = Boolean(authReady && session && adminUserId === session.user.id);
  const [cloudLoading, setCloudLoading] = useState(Boolean(supabase));
  const [cloudMissing, setCloudMissing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'setup' | 'loading' | 'empty' | 'live' | 'saving' | 'error'>(
    supabase ? 'loading' : 'setup',
  );
  const [cloudError, setCloudError] = useState('');
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [realtimeConnected, setRealtimeConnected] = useState(!supabase);
  const [cloudRevision, setCloudRevision] = useState(0);
  const lastCloudStateKey = useRef<string | null>(null);
  const cloudSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const hasReceivedRealtimeUpdate = useRef(false);
  const hasStartedCloudInitialization = useRef(false);
  const [activeTab, setActiveTab] = useState<'standings' | 'lineup' | 'finance'>('standings');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<PlayerPosition>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'injured'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('');

  // Modals & Panels
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<ComputedPlayerStats | null>(null);
  const [playerToEdit, setPlayerToEdit] = useState<ComputedPlayerStats | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMatchRecorderOpen, setIsMatchRecorderOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLookerStudioOpen, setIsLookerStudioOpen] = useState(false);
  const [isImageExportOpen, setIsImageExportOpen] = useState(false);
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
  const [isLiveEditorOpen, setIsLiveEditorOpen] = useState(false);
  const [isQuickRatingOpen, setIsQuickRatingOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const toastTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    window.clearTimeout(toastTimeoutRef.current);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let active = true;
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setAdminUserId(null);
        setSession(nextSession);
      }
    });

    void supabase.auth.getSession().then(({data, error}) => {
      if (error) throw error;
      if (active) {
        setSession(data.session);
        setAuthReady(true);
      }
    }).catch((error: unknown) => {
      if (active) {
        setCloudError(error instanceof Error ? error.message : 'Unable to restore the admin session.');
        setCloudStatus('error');
        setAuthReady(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !authReady || !session) {
      setAdminUserId(null);
      return;
    }

    let active = true;
    setAdminUserId(null);
    void (async () => {
      try {
        const {data, error} = await supabase
          .from('app_admins')
          .select('user_id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (error) throw error;
        if (active) {
          setAdminUserId(data ? session.user.id : null);
          if (!data) {
            setAuthMessage('This signed-in account is not authorized to edit this app.');
          }
        }
      } catch (error) {
        if (active) {
          setAdminUserId(null);
          setCloudError(error instanceof Error ? error.message : 'Unable to verify admin permissions.');
          setCloudStatus('error');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [authReady, session]);

  useEffect(() => {
    if (isAdmin) return;

    setIsEditModalOpen(false);
    setIsMatchRecorderOpen(false);
    setIsConfigModalOpen(false);
    setIsThemeCustomizerOpen(false);
    setIsLiveEditorOpen(false);
    setIsQuickRatingOpen(false);
    setIsStoryModalOpen(false);
    setIsResetModalOpen(false);
    setPlayerToEdit(null);
    setPlayerToDelete(null);
  }, [isAdmin]);

  useEffect(() => {
    if (!supabase) {
      setCloudLoading(false);
      return;
    }

    let active = true;
    let unsubscribe = () => {};
    setRealtimeConnected(false);
    hasReceivedRealtimeUpdate.current = false;

    const applyRemoteState = (remoteState: FullAppState) => {
      const normalizedState: FullAppState = {
        ...remoteState,
        players: ensurePlayerAvatars(remoteState.players),
        config: {...DEFAULT_CONFIG, ...remoteState.config},
        themeConfig: {...DEFAULT_THEME, ...remoteState.themeConfig},
      };
      lastCloudStateKey.current = getCloudStateFingerprint(normalizedState);
      saveFullAppState(normalizedState);
      setPlayers(normalizedState.players);
      setConfig(normalizedState.config);
      setThemeConfig(normalizedState.themeConfig);
      setMatchHistory(normalizedState.matchHistory);
      setFinanceSessions(normalizedState.financeSessions);
      setCloudRevision((revision) => revision + 1);
      setCloudMissing(false);
      setCloudError('');
      setCloudStatus('live');
    };

    unsubscribe = subscribeToCloudAppState(
      supabase,
      (remoteState) => {
        if (!active) return;
        hasReceivedRealtimeUpdate.current = true;
        applyRemoteState(remoteState);
      },
      (message) => {
        if (active) {
          setCloudError(message);
          setCloudStatus('error');
        }
      },
      (connected) => {
        if (active) setRealtimeConnected(connected);
      },
    );

    void fetchCloudAppState(supabase).then((remoteState) => {
      if (!active) return;
      if (!hasReceivedRealtimeUpdate.current && remoteState) {
        applyRemoteState(remoteState);
      } else if (!hasReceivedRealtimeUpdate.current) {
        setCloudMissing(true);
        setCloudStatus('empty');
      }
      setCloudLoading(false);
    }).catch((error: unknown) => {
      if (active) {
        setCloudError(error instanceof Error ? error.message : 'Unable to load public app data.');
        setCloudStatus('error');
        setCloudLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !authReady || !cloudMissing || !isAdmin || hasStartedCloudInitialization.current) return;

    hasStartedCloudInitialization.current = true;
    const initialCloudState = loadFullAppState();
    void insertCloudAppState(supabase, initialCloudState).then(() => {
      lastCloudStateKey.current = getCloudStateFingerprint(initialCloudState);
      setCloudMissing(false);
      setCloudError('');
      setCloudStatus('live');
    }).catch(async (error: unknown) => {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        try {
          const currentState = await fetchCloudAppState(supabase);
          if (currentState) {
            lastCloudStateKey.current = getCloudStateFingerprint(currentState);
            saveFullAppState(currentState);
            setPlayers(currentState.players);
            setConfig(currentState.config);
            setThemeConfig(currentState.themeConfig);
            setMatchHistory(currentState.matchHistory);
            setFinanceSessions(currentState.financeSessions);
            setCloudRevision((revision) => revision + 1);
            setCloudMissing(false);
            setCloudError('');
            setCloudStatus('live');
            return;
          }
        } catch (readError) {
          error = readError;
        }
      }

      setCloudError(error instanceof Error ? error.message : 'Unable to initialize the shared app state.');
      setCloudStatus('error');
    });
  }, [authReady, cloudMissing, isAdmin]);

  useEffect(() => {
    if (!supabase || !authReady || cloudLoading || cloudMissing || !isAdmin) return;

    let saveTimer: number | undefined;
    const handleLocalStateSaved = (event: Event) => {
      try {
        const savedState = parseCloudAppState((event as CustomEvent<unknown>).detail);
        const fingerprint = getCloudStateFingerprint(savedState);
        if (fingerprint === lastCloudStateKey.current) return;

        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(() => {
          cloudSaveQueue.current = cloudSaveQueue.current.then(async () => {
            setCloudStatus('saving');
            try {
              await updateCloudAppState(supabase, savedState);
              lastCloudStateKey.current = fingerprint;
              setCloudError('');
              setCloudStatus('live');
            } catch (error) {
              setCloudError(error instanceof Error ? error.message : 'Unable to save changes to the cloud.');
              setCloudStatus('error');
            }
          });
        }, 400);
      } catch (error) {
        setCloudError(error instanceof Error ? error.message : 'Unable to prepare cloud state.');
        setCloudStatus('error');
      }
    };

    window.addEventListener('app_state_saved', handleLocalStateSaved);
    return () => {
      window.clearTimeout(saveTimer);
      window.removeEventListener('app_state_saved', handleLocalStateSaved);
    };
  }, [authReady, cloudLoading, cloudMissing, isAdmin]);

  // Bulletproof Auto-Save: commit to localStorage whenever state changes
  useEffect(() => {
    savePlayersToStorage(players);
  }, [players]);

  useEffect(() => {
    saveConfigToStorage(config);
  }, [config]);

  useEffect(() => {
    saveThemeToStorage(themeConfig);
  }, [themeConfig]);

  useEffect(() => {
    saveMatchesToStorage(matchHistory);
  }, [matchHistory]);

  useEffect(() => {
    saveFinanceToStorage(financeSessions);
  }, [financeSessions]);

  // Android WebView & Browser Background lifecycle hook: guaranteed flush
  useEffect(() => {
    const unregister = registerBackgroundSaveHooks(() => ({
      players,
      config,
      themeConfig,
      matchHistory,
      financeSessions,
    }));
    return unregister;
  }, [players, config, themeConfig, matchHistory, financeSessions]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 3000);
  };

  const requireAdmin = () => {
    if (isAdmin) return true;
    showToast('Sign in with the authorized admin account to make changes.', 'error');
    return false;
  };

  const updateConfig: React.Dispatch<React.SetStateAction<RankingConfig>> = (nextConfig) => {
    if (requireAdmin()) setConfig(nextConfig);
  };

  const updateThemeConfig: React.Dispatch<React.SetStateAction<ThemeConfig>> = (nextTheme) => {
    if (requireAdmin()) setThemeConfig(nextTheme);
  };

  const updateFinanceSessions: React.Dispatch<React.SetStateAction<WeeklyFinanceSession[]>> = (nextSessions) => {
    if (requireAdmin()) setFinanceSessions(nextSessions);
  };

  const handleAdminSignIn = async (email: string) => {
    if (!supabase) {
      setAuthMessage(getSupabaseSetupError() ?? 'Complete the Supabase setup before signing in.');
      return;
    }
    if (!email) {
      setAuthMessage('Enter the email address authorized for admin access.');
      return;
    }

    setAuthBusy(true);
    setAuthMessage('');
    try {
      const {error} = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          shouldCreateUser: false,
        },
      });
      if (error) throw error;
      setAuthMessage(`If the account is authorized, a sign-in link will arrive at ${email}.`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Unable to send the sign-in link.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAdminAction = () => {
    if (isAdmin) {
      void handleAdminSignOut();
      return;
    }
    setAuthMessage('');
    setIsAdminLoginOpen(true);
  };

  const handleAdminSignOut = async () => {
    if (!supabase) return;

    setAuthBusy(true);
    setAuthMessage('');
    try {
      const {error} = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Unable to sign out.');
    } finally {
      setAuthBusy(false);
    }
  };

  // Manual 1-click Save All Handler with visual confirmation
  const handleManualSaveAll = () => {
    if (!requireAdmin()) return;
    try {
      saveFullAppState({
        players,
        config,
        themeConfig,
        matchHistory,
        financeSessions,
      });
      showToast('هەموو داتاکان (یاریزانان، نمرەکان، پێکهاتە و دارایی) بە مسۆگەری لە مۆبایل و براوزەر پاشەکەوت کران! ✅');
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
    } catch (e) {
      showToast('هەڵە لە پاشەکەوتکردنی داتاکان', 'error');
    }
  };

  // Batch Rating Save Handler
  const handleSaveBatchRatings = (updatedPlayers: Player[]) => {
    if (!requireAdmin()) return;
    const safePlayers = ensurePlayerAvatars(updatedPlayers);
    setPlayers(safePlayers);
    savePlayersToStorage(safePlayers);
    showToast('نمرە و ئاماری یاریزانەکان پاشەکەوت کران و ناگەڕێتەوە سەر دۆخی کۆن! ✅');
    confetti({ particleCount: 40, spread: 65, origin: { y: 0.8 } });
  };

  // Export JSON Backup
  const handleExportBackupJSON = () => {
    if (!requireAdmin()) return;
    try {
      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        players,
        config,
        themeConfig,
        matchHistory,
        financeSessions,
        lineup: localStorage.getItem('fair_football_lineup_6v6_v1')
          ? JSON.parse(localStorage.getItem('fair_football_lineup_6v6_v1')!)
          : null,
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rizbandy-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('فایلی کۆپی یەدەگ (JSON Backup) دابەزێنرا!');
    } catch (e) {
      showToast('نەتوانرا فایلی باکئەپ دابەزێنرێت', 'error');
    }
  };

  // Import JSON Backup
  const handleImportBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!requireAdmin()) {
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!requireAdmin()) return;
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (data.players && Array.isArray(data.players)) {
          setPlayers(data.players);
          localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(data.players));
        }
        if (data.config) {
          setConfig(data.config);
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(data.config));
        }
        if (data.themeConfig) {
          setThemeConfig(data.themeConfig);
          localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(data.themeConfig));
        }
        if (data.matchHistory && Array.isArray(data.matchHistory)) {
          setMatchHistory(data.matchHistory);
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(data.matchHistory));
        }
        if (data.financeSessions && Array.isArray(data.financeSessions)) {
          setFinanceSessions(data.financeSessions);
          localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(data.financeSessions));
        }
        if (data.lineup) {
          localStorage.setItem('fair_football_lineup_6v6_v1', JSON.stringify(data.lineup));
        }

        showToast('هەموو داتاکانی فایلی باکئەپ بە سەرکەوتوویی گەڕێندرانەوە! ✅');
        confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
      } catch (err) {
        showToast('فایلی باکئەپ هەڵەیە یان تێکچووە!', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Compute and rank active players (injured players excluded)
  const rankedPlayers = useMemo(() => {
    return rankPlayers(players, config);
  }, [players, config]);

  // Injured players list
  const injuredPlayers = useMemo(() => {
    return players.filter((p) => p.status === 'injured');
  }, [players]);

  // Top 1 & Top 2 Spotlight players (Only Active players)
  const top2Players = useMemo(() => {
    return rankedPlayers.slice(0, 2);
  }, [rankedPlayers]);

  // Danger / Relegation zone bottom 2 players (Active players only)
  const dangerZonePlayers = useMemo(() => {
    if (rankedPlayers.length <= 2) return [];
    return rankedPlayers.slice(-2);
  }, [rankedPlayers]);

  // Filtered players based on search query and position
  const filteredPlayers = useMemo(() => {
    return rankedPlayers.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesPosition = selectedPosition === 'all' || p.position === selectedPosition;
      return matchesSearch && matchesPosition;
    });
  }, [rankedPlayers, searchQuery, selectedPosition]);

  // Handler: Restore Injured Player back to Active
  const handleRestorePlayerFromInjury = (id: string) => {
    if (!requireAdmin()) return;
    const targetPlayer = players.find((p) => p.id === id);
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'active' } : p))
    );
    showToast(`یاریزان "${targetPlayer?.name || ''}" چاکبووەوە و گەڕایەوە ناو ڕیزبەندی سەرەکی`, 'success');
  };

  // Handler: Quick Update (+1 Win, +1 Draw, +1 Loss)
  const handleQuickUpdate = (id: string, type: 'win' | 'draw' | 'loss', delta: number) => {
    if (!requireAdmin()) return;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedWins = type === 'win' ? Math.max(0, p.wins + delta) : p.wins;
          const updatedDraws = type === 'draw' ? Math.max(0, p.draws + delta) : p.draws;
          const updatedLosses = type === 'loss' ? Math.max(0, p.losses + delta) : p.losses;
          const resultForm = type === 'win' ? 'W' : type === 'draw' ? 'D' : 'L';
          const updatedForm = [...(p.form || []), resultForm as 'W' | 'D' | 'L'].slice(-5);

          return {
            ...p,
            wins: updatedWins,
            draws: updatedDraws,
            losses: updatedLosses,
            form: updatedForm,
          };
        }
        return p;
      })
    );
    showToast(`ئاماری یاریزان بە سەرکەوتوویی نوێکرایەوە`);
  };

  const handleMovePlayer = (id: string, direction: 'up' | 'down') => {
    if (!requireAdmin()) return;

    const orderedPlayers = [...rankedPlayers];
    const currentIndex = orderedPlayers.findIndex((player) => player.id === id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedPlayers.length) return;

    [orderedPlayers[currentIndex], orderedPlayers[targetIndex]] = [
      orderedPlayers[targetIndex],
      orderedPlayers[currentIndex],
    ];
    const ranksByPlayerId = new Map(
      orderedPlayers.map((player, index) => [player.id, index + 1]),
    );

    setPlayers((previousPlayers) =>
      previousPlayers.map((player) => {
        const customRank = ranksByPlayerId.get(player.id);
        return customRank === undefined ? player : { ...player, customRank };
      }),
    );
    showToast('ڕیزبەندیی دەستی پاشەکەوت کرا');
  };

  // Handler: Save All from Live Spreadsheet Editor
  const handleSaveLiveSpreadsheet = (updatedPlayers: Player[]) => {
    if (!requireAdmin()) return;
    setPlayers(ensurePlayerAvatars(updatedPlayers));
    showToast(`هەموو گۆڕانکارییەکانی خشتە بە سەرکەوتوویی پاشەکەوت کران!`);
  };

  // Handler: Save Player (Add or Edit)
  const handleSavePlayer = (playerData: Partial<Player>) => {
    if (!requireAdmin()) return;
    if (playerData.id) {
      // Edit
      setPlayers((prev) =>
        ensurePlayerAvatars(prev.map((p) => (p.id === playerData.id ? ({ ...p, ...playerData } as Player) : p)))
      );
      showToast(`زانیارییەکانی ${playerData.name} نوێکرانەوە`);
    } else {
      // Add
      const newPlayer: Player = {
        id: `p-${Date.now()}`,
        name: playerData.name || 'یاریزانی نوێ',
        avatar: playerData.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(playerData.name || 'player')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
        wins: playerData.wins || 0,
        draws: playerData.draws || 0,
        losses: playerData.losses || 0,
        position: playerData.position || 'midfield',
        status: playerData.status || 'active',
        goals: playerData.goals || 0,
        assists: playerData.assists || 0,
        form: [],
      };
      setPlayers((prev) => [...prev, newPlayer]);
      showToast(`یاریزان ${newPlayer.name} بە سەرکەوتوویی زیادکرا`);
    }
  };

  // Handler: Open Delete Confirmation Modal
  const handleDeletePlayer = (id: string, name: string) => {
    if (!requireAdmin()) return;
    const targetPlayer = players.find((p) => p.id === id);
    setPlayerToDelete({
      id,
      name,
      avatar: targetPlayer?.avatar,
    });
  };

  // Handler: Actually Confirm & Execute Deletion
  const handleConfirmDelete = () => {
    if (!requireAdmin()) return;
    if (!playerToDelete) return;
    const { id, name } = playerToDelete;

    // Filter out from players array
    setPlayers((prev) => prev.filter((p) => p.id !== id));

    // Clear any opened modals viewing this player
    if (selectedPlayerForProfile?.id === id) {
      setSelectedPlayerForProfile(null);
    }
    if (playerToEdit?.id === id) {
      setPlayerToEdit(null);
      setIsEditModalOpen(false);
    }

    setPlayerToDelete(null);
    showToast(`یاریزان "${name}" بە سەرکەوتوویی لە سیستم سڕایەوە`, 'error');
  };

  // Handler: Record Match
  const handleRecordMatch = (matchData: Omit<MatchRecord, 'id'>) => {
    if (!requireAdmin()) return;
    const matchId = `match-${Date.now()}`;
    const newMatch: MatchRecord = {
      ...matchData,
      id: matchId,
    };

    setMatchHistory((prev) => [newMatch, ...prev]);

    // Apply match results to players
    const isTeamAWinner = matchData.scoreA > matchData.scoreB;
    const isTeamBWinner = matchData.scoreB > matchData.scoreA;
    const isDraw = matchData.scoreA === matchData.scoreB;

    setPlayers((prev) =>
      prev.map((p) => {
        if (matchData.teamAPlayerIds.includes(p.id)) {
          return {
            ...p,
            wins: isTeamAWinner ? p.wins + 1 : p.wins,
            draws: isDraw ? p.draws + 1 : p.draws,
            losses: isTeamBWinner ? p.losses + 1 : p.losses,
            form: [...(p.form || []), (isTeamAWinner ? 'W' : isDraw ? 'D' : 'L') as 'W' | 'D' | 'L'].slice(-5),
          };
        }
        if (matchData.teamBPlayerIds.includes(p.id)) {
          return {
            ...p,
            wins: isTeamBWinner ? p.wins + 1 : p.wins,
            draws: isDraw ? p.draws + 1 : p.draws,
            losses: isTeamAWinner ? p.losses + 1 : p.losses,
            form: [...(p.form || []), (isTeamBWinner ? 'W' : isDraw ? 'D' : 'L') as 'W' | 'D' | 'L'].slice(-5),
          };
        }
        return p;
      })
    );

    showToast(`یارییەکە تۆمارکرا و ڕیزبەندی نوێکرایەوە!`);
  };

  // Handler: Excel Export
  const handleExportExcel = async () => {
    try {
      const {exportPlayersToExcel} = await import('./utils/excelHelper');
      exportPlayersToExcel(rankedPlayers, config);
      showToast(`فایلی Excel بە سەرکەوتوویی دابەزێنرا`);
    } catch (e) {
      console.error(e);
      showToast(`کێشەیەک ڕوویدا لە دابەزاندنی فایل`, 'error');
    }
  };

  // Handler: Excel Import
  const handleImportExcel = async (file: File) => {
    if (!requireAdmin()) return;
    try {
      const {parseExcelFile} = await import('./utils/excelHelper');
      const imported = await parseExcelFile(file);
      if (imported.length > 0 && requireAdmin()) {
        setPlayers(ensurePlayerAvatars(imported));
        showToast(`${imported.length} یاریزان لە فایلی Excel هاوردە کران`);
      }
    } catch (e: any) {
      showToast(e.message || 'هەڵە لە خوێندنەوەی فایلی Excel', 'error');
    }
  };

  // Handler: Reset to initial players (Protected with confirmation modal)
  const handleResetToDefault = () => {
    if (!requireAdmin()) return;
    setIsResetModalOpen(true);
  };

  const handleConfirmResetToDefault = () => {
    if (!requireAdmin()) return;
    const fresh = clearAllStoredData();
    setPlayers(fresh.players);
    setConfig(fresh.config);
    setThemeConfig(fresh.themeConfig);
    setMatchHistory(fresh.matchHistory);
    setFinanceSessions(fresh.financeSessions);
    setIsResetModalOpen(false);
    showToast('داتاکان و وێنەی هەموو یاریزانەکان بە سەرکەوتوویی گەڕێنرانەوە بۆ دۆخی بنەڕەتی خولەکە');
  };

  const positions: { key: PlayerPosition; label: string }[] = [
    { key: 'all', label: 'هەموو یاریزانان' },
    { key: 'forward', label: 'هێرشبەر' },
    { key: 'midfield', label: 'ناوەڕاست' },
    { key: 'defender', label: 'بەرگریکار' },
    { key: 'goalkeeper', label: 'گۆڵپارێز' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pitch-pattern flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold backdrop-blur-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-600 shadow-emerald-900/30'
              : 'bg-rose-900 text-white border-rose-600 shadow-rose-900/30'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Hidden JSON Backup File Input */}
      <input
        ref={backupFileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportBackupJSON}
        className="hidden"
      />

      {/* Top Navbar */}
      <Navbar
        isAdmin={isAdmin}
        onAdminAction={handleAdminAction}
        authBusy={authBusy || !authReady}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        setConfig={updateConfig}
        themeConfig={themeConfig}
        onOpenAddPlayer={() => {
          setPlayerToEdit(null);
          setIsEditModalOpen(true);
        }}
        onOpenQuickRating={() => setIsQuickRatingOpen(true)}
        onManualSaveAll={handleManualSaveAll}
        onOpenMatchRecorder={() => setIsMatchRecorderOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        onOpenLiveEditor={() => setIsLiveEditorOpen(!isLiveEditorOpen)}
        onOpenImageExport={() => setIsImageExportOpen(true)}
        onOpenLookerStudio={() => setIsLookerStudioOpen(true)}
        onOpenThemeCustomizer={() => setIsThemeCustomizerOpen(true)}
        onExportExcel={handleExportExcel}
        onImportExcel={handleImportExcel}
        onResetToDefault={handleResetToDefault}
        totalPlayersCount={players.length}
        isLiveEditorOpen={isLiveEditorOpen}
        onOpenStoryModal={isAdmin ? () => setIsStoryModalOpen(true) : undefined}
      />

      {(getSupabaseSetupError() || cloudError || cloudMissing || cloudLoading || authMessage || cloudStatus === 'saving' || !isOnline || (!realtimeConnected && !cloudLoading && !cloudError && Boolean(supabase))) && (
        <div className="mx-auto mt-3 w-full max-w-7xl px-4 sm:px-6 lg:px-8" aria-live="polite">
          <div className={`rounded-xl border px-4 py-3 text-sm ${
            !isOnline || cloudError || getSupabaseSetupError()
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-sky-200 bg-sky-50 text-sky-900'
          }`}>
            {!isOnline && <p>You are offline. Showing saved data; live updates and cloud saves are paused.</p>}
            {isOnline && !realtimeConnected && !cloudLoading && !cloudError && Boolean(supabase) && (
              <p>Reconnecting to live updates…</p>
            )}
            {getSupabaseSetupError() && <p>{getSupabaseSetupError()}</p>}
            {cloudLoading && <p>Loading the latest shared data…</p>}
            {cloudMissing && (
              <p>
                Shared data has not been initialized yet.
                {isAdmin ? ' The current local data will be published when admin access is ready.' : ' The admin must sign in once to publish the app data.'}
              </p>
            )}
            {cloudStatus === 'saving' && <p>Saving shared changes…</p>}
            {cloudError && <p>{cloudError}</p>}
            {authMessage && <p>{authMessage}</p>}
          </div>
        </div>
      )}

      {/* Main Container */}
      <main
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6"
        inert={cloudLoading}
      >
        
        {/* Visual Sports Feature Hub (Always visible or in standings) */}
        <HomeVisualHub
          isAdmin={isAdmin}
          players={rankedPlayers}
          config={config}
          themeConfig={themeConfig}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenQuickRating={() => setIsQuickRatingOpen(true)}
          onOpenMatchRecorder={() => setIsMatchRecorderOpen(true)}
          onOpenLiveEditor={() => setIsLiveEditorOpen(true)}
          onOpenImageExport={() => setIsImageExportOpen(true)}
          onOpenConfigModal={() => setIsConfigModalOpen(true)}
          onOpenThemeCustomizer={() => setIsThemeCustomizerOpen(true)}
          onManualSaveAll={handleManualSaveAll}
          onExportBackupJSON={handleExportBackupJSON}
          onImportBackupJSON={() => backupFileInputRef.current?.click()}
          onOpenStoryModal={isAdmin ? () => setIsStoryModalOpen(true) : undefined}
          onUpdateLogo={(newLogo) => {
            if (!requireAdmin()) return;
            setThemeConfig((prev) => ({ ...prev, logoUrl: newLogo }));
            showToast('وێنەی لۆگۆ و ستۆری بە سەرکەوتوویی نوێکرایەوە! ⚽');
          }}
          onAddStory={(newImg) => {
            if (!requireAdmin()) return;
            setThemeConfig((prev) => {
              const currentStories = prev.stories && prev.stories.length > 0
                ? [...prev.stories]
                : [prev.logoUrl || '/logo.jpg'];
              return {
                ...prev,
                stories: [...currentStories, newImg],
                logoUrl: prev.logoUrl || newImg,
              };
            });
            showToast('وێنەیەکی نوێ بۆ ستۆری خول زیادکرا! 📸');
          }}
          onRemoveStory={(indexToRemove) => {
            if (!requireAdmin()) return;
            setThemeConfig((prev) => {
              const currentStories = prev.stories && prev.stories.length > 0
                ? [...prev.stories]
                : [prev.logoUrl || '/logo.jpg'];
              const updated = currentStories.filter((_, idx) => idx !== indexToRemove);
              return {
                ...prev,
                stories: updated.length > 0 ? updated : ['/logo.jpg'],
                logoUrl: updated[0] || '/logo.jpg',
              };
            });
            showToast('وێنەکە لە ستۆری سڕایەوە');
          }}
          onUpdateStorySize={(w, h, preset) => {
            if (!requireAdmin()) return;
            setThemeConfig((prev) => ({
              ...prev,
              storyWidgetWidth: w,
              storyWidgetHeight: h,
              storyWidgetSize: preset || 'custom',
            }));
          }}
        />

        {activeTab === 'finance' ? (
          <fieldset disabled={!isAdmin} className="contents" aria-label="Finance admin controls">
            <Suspense fallback={<p className="p-4 text-sm text-slate-500" role="status">Loading finance dashboard…</p>}>
              <FinanceDashboard
                players={players}
                sessions={financeSessions}
                onSaveSessions={updateFinanceSessions}
                leagueTitle={themeConfig.leagueTitle}
              />
            </Suspense>
          </fieldset>
        ) : activeTab === 'lineup' ? (
          <div className={!isAdmin ? 'pointer-events-none' : undefined} aria-disabled={!isAdmin}>
          <fieldset disabled={!isAdmin} className="contents" aria-label="Lineup admin controls">
            <Suspense fallback={<p className="p-4 text-sm text-slate-500" role="status">Loading lineup builder…</p>}>
              <LineupBuilder
                key={cloudRevision}
                isAdmin={isAdmin}
                players={rankedPlayers}
                rawPlayers={players}
                leagueTitle={themeConfig.leagueTitle}
                onRecordMatch={handleRecordMatch}
                matchHistory={matchHistory}
                onDeleteMatchHistory={(matchId) => {
                  if (!requireAdmin()) return;
                  const matchToRevert = matchHistory.find((m) => m.id === matchId);
                  if (matchToRevert) {
                    const isTeamAWinner = matchToRevert.scoreA > matchToRevert.scoreB;
                    const isTeamBWinner = matchToRevert.scoreB > matchToRevert.scoreA;
                    const isDraw = matchToRevert.scoreA === matchToRevert.scoreB;

                    setPlayers((prev) =>
                      prev.map((p) => {
                        if (matchToRevert.teamAPlayerIds.includes(p.id)) {
                          return {
                            ...p,
                            wins: isTeamAWinner ? Math.max(0, p.wins - 1) : p.wins,
                            draws: isDraw ? Math.max(0, p.draws - 1) : p.draws,
                            losses: isTeamBWinner ? Math.max(0, p.losses - 1) : p.losses,
                            form: p.form && p.form.length > 0 ? p.form.slice(0, -1) : [],
                          };
                        }
                        if (matchToRevert.teamBPlayerIds.includes(p.id)) {
                          return {
                            ...p,
                            wins: isTeamBWinner ? Math.max(0, p.wins - 1) : p.wins,
                            draws: isDraw ? Math.max(0, p.draws - 1) : p.draws,
                            losses: isTeamAWinner ? Math.max(0, p.losses - 1) : p.losses,
                            form: p.form && p.form.length > 0 ? p.form.slice(0, -1) : [],
                          };
                        }
                        return p;
                      })
                    );
                    setMatchHistory((prev) => prev.filter((m) => m.id !== matchId));
                    showToast('ئەنجامی یارییەکە گەڕێندرایەوە و نمرەکان چاککرانەوە! ↩️');
                  }
                }}
              />
            </Suspense>
          </fieldset>
          </div>
        ) : (
          <>
            {/* Top 1 & Top 2 Spotlight Cards */}
        {themeConfig.showSpotlight && top2Players.length >= 2 && (
          <TopSpotlightCards
            topPlayers={top2Players}
            onSelectPlayer={(p) => setSelectedPlayerForProfile(p)}
          />
        )}

        {/* Relegation / Danger Zone Alert */}
        {themeConfig.showDangerZone && dangerZonePlayers.length > 0 && (
          <DangerZoneAlert
            dangerPlayers={dangerZonePlayers}
            onSelectPlayer={(p) => setSelectedPlayerForProfile(p)}
          />
        )}

        {/* Live Google Sheets Styled Grid Editor (Collapsible) */}
        {isAdmin && isLiveEditorOpen && (
          <Suspense fallback={null}>
            <LiveSpreadsheetEditor
              players={players}
              config={config}
              onSaveAll={handleSaveLiveSpreadsheet}
              onClose={() => setIsLiveEditorOpen(false)}
            />
          </Suspense>
        )}

        {/* Dedicated Quick Bonus Toolbar */}
        <fieldset disabled={!isAdmin} className="contents" aria-label="Ranking admin controls">
          <QuickBonusToolbar config={config} setConfig={updateConfig} />
        </fieldset>

        {/* High-level Statistics Banner */}
        <StatsBanner
          players={rankedPlayers}
          config={config}
          onSelectPlayer={(p) => setSelectedPlayerForProfile(p)}
        />

        {/* Interactive Formula Explainer */}
        {themeConfig.showFormulaExplainer && (
          <fieldset disabled={!isAdmin} className="contents" aria-label="Formula admin controls">
            <FormulaExplainer config={config} setConfig={updateConfig} />
          </fieldset>
        )}

        {/* Filter & Action Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          
          {/* Position Filters & Injured Count */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 font-bold ml-1 shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>پێگە:</span>
              </span>
              {positions.map((pos) => (
                <button
                  key={pos.key}
                  onClick={() => setSelectedPosition(pos.key)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedPosition === pos.key
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>

            {injuredPlayers.length > 0 && (
              <>
                <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  <span>🩹</span>
                  <span>{injuredPlayers.length} یاریزان پێکراوە (دەرهێنراو لە ڕیزبەندی)</span>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            <button
              onClick={() => setIsImageExportOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
              <span>داگرتنی وێنەی خشتە</span>
            </button>

            <button
              onClick={() => setIsLookerStudioOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-700" />
              <span>Looker Studio</span>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>هاوبەشکردن</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setPlayerToEdit(null);
                  setIsEditModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>یاریزانی نوێ</span>
              </button>
            )}
          </div>

        </div>

        {/* Main Content: Table or Cards View */}
        {viewMode === 'table' ? (
          <RankingTable
            players={filteredPlayers}
            totalPlayerCount={rankedPlayers.length}
            config={config}
            isAdmin={isAdmin}
            onSelectPlayer={(p) => setSelectedPlayerForProfile(p)}
            onEditPlayer={(p) => {
              setPlayerToEdit(p);
              setIsEditModalOpen(true);
            }}
            onDeletePlayer={handleDeletePlayer}
            onQuickUpdate={handleQuickUpdate}
            onMovePlayer={handleMovePlayer}
          />
        ) : (
          <PlayerCardGrid
            players={filteredPlayers}
            config={config}
            isAdmin={isAdmin}
            onSelectPlayer={(p) => setSelectedPlayerForProfile(p)}
            onEditPlayer={(p) => {
              setPlayerToEdit(p);
              setIsEditModalOpen(true);
            }}
            onDeletePlayer={handleDeletePlayer}
            onQuickUpdate={handleQuickUpdate}
          />
        )}

        {/* Injured Players Section (Completely removed from standings ranking) */}
        {injuredPlayers.length > 0 && (
          <InjuredPlayersCard
            injuredPlayers={injuredPlayers}
            config={config}
            isAdmin={isAdmin}
            onRestorePlayer={handleRestorePlayerFromInjury}
            onSelectPlayer={(p) => setSelectedPlayerForProfile(p)}
            onEditPlayer={(p) => {
              setPlayerToEdit(p as any);
              setIsEditModalOpen(true);
            }}
            onDeletePlayer={handleDeletePlayer}
          />
        )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.jpg" 
              alt="Rizbandy" 
              className="w-7 h-7 rounded-lg object-cover border border-emerald-500/40 shadow-xs"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-black text-slate-800">{themeConfig.leagueTitle}</span>
            <span>•</span>
            <span className="text-slate-600 font-medium">سیستەمی دادپەروەرانەی WPI + Google Sheets & Looker Sync</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span>کۆی یاریزانان: {players.length}</span>
            <span>•</span>
            {isAdmin && (
              <button
                onClick={handleResetToDefault}
                className="hover:text-rose-600 transition underline underline-offset-2"
              >
                گەڕاندنەوە بۆ بنەڕەت
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <Suspense fallback={null}>
        {selectedPlayerForProfile && (
          <PlayerProfileModal
            player={selectedPlayerForProfile}
            allPlayers={rankedPlayers}
            config={config}
            isAdmin={isAdmin}
            onClose={() => setSelectedPlayerForProfile(null)}
            onEditPlayer={(p) => {
              setSelectedPlayerForProfile(null);
              setPlayerToEdit(p);
              setIsEditModalOpen(true);
            }}
            onDeletePlayer={handleDeletePlayer}
          />
        )}

        {isEditModalOpen && (
          <PlayerEditModal
            playerToEdit={playerToEdit}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setPlayerToEdit(null);
            }}
            onSave={handleSavePlayer}
            onDelete={handleDeletePlayer}
          />
        )}

        {isMatchRecorderOpen && (
          <MatchRecorderModal
            isOpen={isMatchRecorderOpen}
            onClose={() => setIsMatchRecorderOpen(false)}
            players={rankedPlayers}
            onRecordMatch={handleRecordMatch}
            matchHistory={matchHistory}
          />
        )}

        {isConfigModalOpen && (
          <FormulaConfigModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
            config={config}
            setConfig={updateConfig}
            onResetToDefault={handleResetToDefault}
          />
        )}

        {isShareModalOpen && (
          <ShareSummaryModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            players={rankedPlayers}
            config={config}
          />
        )}

        {isLookerStudioOpen && (
          <LookerStudioSyncModal
            isOpen={isLookerStudioOpen}
            onClose={() => setIsLookerStudioOpen(false)}
            players={rankedPlayers}
            config={config}
          />
        )}

        {isImageExportOpen && (
          <ExportLeaderboardImageModal
            isOpen={isImageExportOpen}
            onClose={() => setIsImageExportOpen(false)}
            players={rankedPlayers}
            config={config}
            themeConfig={themeConfig}
          />
        )}

        {isThemeCustomizerOpen && (
          <ThemeCustomizerModal
            isOpen={isThemeCustomizerOpen}
            onClose={() => setIsThemeCustomizerOpen(false)}
            themeConfig={themeConfig}
            setThemeConfig={updateThemeConfig}
          />
        )}

        {isQuickRatingOpen && (
          <QuickRatingModal
            isOpen={isQuickRatingOpen}
            onClose={() => setIsQuickRatingOpen(false)}
            players={players}
            config={config}
            onSaveBatchRatings={handleSaveBatchRatings}
          />
        )}

        {isStoryModalOpen && (
          <StoryViewerModal
            isOpen={isStoryModalOpen}
            onClose={() => setIsStoryModalOpen(false)}
            themeConfig={themeConfig}
            setThemeConfig={updateThemeConfig}
            totalPlayersCount={players.length}
          />
        )}

        {playerToDelete && (
          <DeleteConfirmationModal
            isOpen
            playerName={playerToDelete.name}
            playerAvatar={playerToDelete.avatar}
            onConfirm={handleConfirmDelete}
            onCancel={() => setPlayerToDelete(null)}
          />
        )}

        {isResetModalOpen && (
          <ResetConfirmationModal
            isOpen
            onClose={() => setIsResetModalOpen(false)}
            onConfirmReset={handleConfirmResetToDefault}
          />
        )}

        {isAdminLoginOpen && (
          <AdminLoginModal
            isOpen
            isBusy={authBusy}
            message={authMessage}
            onClose={() => setIsAdminLoginOpen(false)}
            onSubmit={handleAdminSignIn}
          />
        )}
      </Suspense>

    </div>
  );
}
