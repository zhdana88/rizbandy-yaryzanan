import React, { useRef, useMemo } from 'react';
import { 
  Trophy, 
  Shield, 
  Plus, 
  SlidersHorizontal, 
  Download, 
  Upload, 
  Search, 
  Lock, 
  Unlock, 
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Play,
  RotateCcw,
  FileSpreadsheet,
  Image as ImageIcon,
  BarChart3,
  Palette,
  Zap,
  ShieldCheck,
  Save,
  Calendar
} from 'lucide-react';
import { RankingConfig, ThemeConfig } from '../types';
import { getTodayLiveDetails } from '../utils/dateHelper';

interface NavbarProps {
  isAdmin: boolean;
  onAdminAction: () => void;
  authBusy: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  viewMode: 'table' | 'cards';
  setViewMode: (val: 'table' | 'cards') => void;
  activeTab: 'standings' | 'lineup' | 'finance';
  setActiveTab: (val: 'standings' | 'lineup' | 'finance') => void;
  config: RankingConfig;
  setConfig: React.Dispatch<React.SetStateAction<RankingConfig>>;
  themeConfig: ThemeConfig;
  onOpenAddPlayer: () => void;
  onOpenQuickRating?: () => void;
  onManualSaveAll?: () => void;
  onOpenMatchRecorder: () => void;
  onOpenConfigModal: () => void;
  onOpenLiveEditor: () => void;
  onOpenImageExport: () => void;
  onOpenLookerStudio: () => void;
  onOpenThemeCustomizer: () => void;
  onExportExcel: () => void;
  onImportExcel: (file: File) => void;
  onResetToDefault: () => void;
  totalPlayersCount: number;
  isLiveEditorOpen: boolean;
  onOpenStoryModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdmin,
  onAdminAction,
  authBusy,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  activeTab,
  setActiveTab,
  config,
  setConfig,
  themeConfig,
  onOpenAddPlayer,
  onOpenQuickRating,
  onManualSaveAll,
  onOpenMatchRecorder,
  onOpenConfigModal,
  onOpenLiveEditor,
  onOpenImageExport,
  onOpenLookerStudio,
  onOpenThemeCustomizer,
  onExportExcel,
  onImportExcel,
  onResetToDefault,
  totalPlayersCount,
  isLiveEditorOpen,
  onOpenStoryModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportExcel(file);
    }
  };

  const getThemeGradient = () => {
    switch (themeConfig.themeColor) {
      case 'amber': return 'from-amber-500 to-yellow-400';
      case 'blue': return 'from-blue-600 to-cyan-400';
      case 'purple': return 'from-purple-600 to-fuchsia-400';
      case 'crimson': return 'from-rose-600 to-red-400';
      default: return 'from-emerald-600 to-teal-400';
    }
  };

  const currentLogo = themeConfig.logoUrl || '/logo.jpg';
  const todayDetails = useMemo(() => getTodayLiveDetails(), []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          
          {/* Logo & Main Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                onClick={onOpenStoryModal}
                className="relative flex items-center justify-center w-12 h-12 rounded-2xl overflow-hidden shadow-md border-2 border-emerald-500/50 bg-slate-950 shrink-0 group cursor-pointer hover:scale-105 transition-transform"
                title="کلیک بکە بۆ بینینی ستۆری و لۆگۆی خول"
              >
                <img 
                  src={currentLogo} 
                  alt="Rizbandy Logo" 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to default
                    (e.currentTarget as HTMLImageElement).src = '/logo.jpg';
                  }}
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-slate-950 shadow ring-1 ring-white">
                  ★
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    {themeConfig.leagueTitle || 'ڕێزبەندی Rizbandy'}
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    سیستەمی WPI ({totalPlayersCount} یاریزان)
                  </span>
                  <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Calendar className="w-3 h-3 text-amber-600" />
                    <span>{todayDetails.fullKurdish}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {themeConfig.leagueSubtitle || 'فۆتبۆڵ یاریزان ڕێزبەندی • هاوسەنگی کواڵێتی و چەندایەتی'}
                </p>
              </div>
            </div>

            {/* Mobile Admin Authentication */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={onAdminAction}
                disabled={authBusy}
                className={`p-2 rounded-lg text-xs font-medium border flex items-center gap-1 transition ${
                  isAdmin
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
                title={isAdmin ? 'Sign out of admin account' : 'Admin sign in'}
                aria-label={isAdmin ? 'Sign out of admin account' : 'Admin sign in'}
              >
                {isAdmin ? <Unlock className="w-4 h-4 text-amber-600" /> : <Lock className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Controls: Search, View Mode, Actions & Admin Switch */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            
            {/* Primary Nav Switcher (Standings vs 6v6 Lineup vs Weekly Finance) */}
            <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 flex items-center gap-1 shadow-2xs">
              <button
                onClick={() => setActiveTab('standings')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeTab === 'standings'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>ڕیزبەندی</span>
              </button>

              <button
                onClick={() => setActiveTab('lineup')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeTab === 'lineup'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>⚽</span>
                <span>پێکهاتەی ٦v٦</span>
              </button>

              <button
                onClick={() => setActiveTab('finance')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeTab === 'finance'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span className="font-mono text-sm">💰</span>
                <span>سندوقی دارایی</span>
              </button>
            </div>

            {/* Search Input (Only when on standings tab) */}
            {activeTab === 'standings' && (
              <div className="relative flex-1 sm:flex-initial sm:w-40 lg:w-48">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="گەڕان بۆ یاریزان..."
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-lg pl-3 pr-9 py-1.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* View Mode Toggle (Table / Cards) */}
            {activeTab === 'standings' && (
              <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md text-xs transition flex items-center gap-1 ${
                    viewMode === 'table'
                      ? 'bg-white text-emerald-700 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="خشتە (Table)"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-md text-xs transition flex items-center gap-1 ${
                    viewMode === 'cards'
                      ? 'bg-white text-emerald-700 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="کارتەکان (Cards)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Live Grid Editor Toggle (Admin) */}
            {isAdmin && (
              <button
                onClick={onOpenLiveEditor}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border ${
                  isLiveEditorOpen
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-emerald-800 border-emerald-200'
                }`}
                title="دەستکاریکردنی ڕاستەوخۆ لەسەر شێوازی Google Sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">شێوازی Sheets</span>
              </button>
            )}

            {/* Quick Rating Button */}
            {isAdmin && onOpenQuickRating && (
              <button
                onClick={onOpenQuickRating}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-black px-2.5 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow-2xs"
                title="دیاریکردنی خێرای نمرە و ئاماری یاریزانان"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline">نمرەی خێرا</span>
              </button>
            )}

            {/* Manual Save All Button */}
            {isAdmin && onManualSaveAll && (
              <button
                onClick={onManualSaveAll}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-black px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow-2xs"
                title="پاشەکەوتکردنی دەستیی هەموو داتاکان"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden lg:inline">پاشەکەوتکردن</span>
              </button>
            )}

            {/* Record Match Button */}
            {isAdmin && (
              <button
                onClick={onOpenMatchRecorder}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 sm:px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>تۆماری یاری</span>
              </button>
            )}

            {/* Export Image / Poster Button */}
            <button
              onClick={onOpenImageExport}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
              title="دەرهێنانی وێنەی کوالێتی بەرز (PNG Image/Poster)"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden lg:inline">وێنەی خشتە</span>
            </button>

            {/* Looker Studio / Google Sheets Helper */}
            <button
              onClick={onOpenLookerStudio}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
              title="بەستنەوە بە Google Looker Studio و Google Sheets"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden xl:inline">Looker Studio</span>
            </button>

            {/* Theme & Design Customizer */}
            {isAdmin && (
              <button
                onClick={onOpenThemeCustomizer}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-2 rounded-lg text-xs transition"
                title="ڕێکخستنی دیزاین و ڕەنگەکان (Customization)"
              >
                <Palette className="w-3.5 h-3.5 text-purple-600" />
              </button>
            )}

            {/* Excel Export */}
            <button
              onClick={onExportExcel}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-2 rounded-lg text-xs transition"
              title="دابەزاندنی فایلی ئێکسڵ (Excel .xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
            </button>

            {/* Excel Import (Admin) */}
            {isAdmin && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-2 rounded-lg text-xs transition"
                  title="هاوردەکردنی فایلی اکسڵ (Import Excel)"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                </button>
              </>
            )}

            {/* Admin Authentication (Desktop) */}
            <button
              onClick={onAdminAction}
              disabled={authBusy}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                isAdmin
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
              title={isAdmin ? 'Sign out of admin account' : 'Admin sign in'}
            >
              {isAdmin ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{authBusy ? 'Wait…' : 'Sign out'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{authBusy ? 'Wait…' : 'Admin login'}</span>
                </>
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
