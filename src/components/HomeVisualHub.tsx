import React, { useRef, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  Sparkles, 
  Star, 
  ShieldCheck, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  BarChart3, 
  Wallet, 
  Play, 
  Sliders, 
  Zap, 
  Download, 
  Upload, 
  ArrowLeft,
  Crown,
  CheckCircle2,
  TrendingUp,
  Flame,
  ChevronLeft,
  Camera,
  Eye,
  Maximize2,
  Calendar
} from 'lucide-react';
import { ComputedPlayerStats, RankingConfig, ThemeConfig } from '../types';
import { BallonDorTrophy } from './Trophies';
import { StoryCarouselWidget } from './StoryCarouselWidget';
import { getTodayLiveDetails } from '../utils/dateHelper';

interface HomeVisualHubProps {
  isAdmin: boolean;
  players: ComputedPlayerStats[];
  config: RankingConfig;
  themeConfig: ThemeConfig;
  activeTab: 'standings' | 'lineup' | 'finance';
  setActiveTab: (tab: 'standings' | 'lineup' | 'finance') => void;
  onOpenQuickRating: () => void;
  onOpenMatchRecorder: () => void;
  onOpenLiveEditor: () => void;
  onOpenImageExport: () => void;
  onOpenConfigModal: () => void;
  onOpenThemeCustomizer: () => void;
  onManualSaveAll: () => void;
  onExportBackupJSON: () => void;
  onImportBackupJSON: () => void;
  onOpenStoryModal?: () => void;
  onUpdateLogo?: (newLogo: string) => void;
  onAddStory?: (newImg: string) => void;
  onRemoveStory?: (index: number) => void;
  onUpdateStorySize?: (w: number, h: number, sizePreset?: 'small' | 'medium' | 'large' | 'xl' | 'custom') => void;
}

export const HomeVisualHub: React.FC<HomeVisualHubProps> = ({
  isAdmin,
  players,
  config,
  themeConfig,
  activeTab,
  setActiveTab,
  onOpenQuickRating,
  onOpenMatchRecorder,
  onOpenLiveEditor,
  onOpenImageExport,
  onOpenConfigModal,
  onOpenThemeCustomizer,
  onManualSaveAll,
  onExportBackupJSON,
  onImportBackupJSON,
  onOpenStoryModal,
  onUpdateLogo,
  onAddStory,
  onRemoveStory,
  onUpdateStorySize,
}) => {
  const topPlayer = players[0];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const todayDetails = useMemo(() => getTodayLiveDetails(), []);

  return (
    <section className="mb-7 space-y-4 select-none">
      {/* 1. Main Hero Sports Hub Card with Neon Border Glow */}
      <div className="relative rounded-[28px] p-[2.5px] bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400/90 shadow-[0_0_40px_rgba(16,185,129,0.28)] overflow-hidden transition-all duration-300">
        
        {/* Main Inner Dark Hero Card */}
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/90 text-white p-5 sm:p-7 backdrop-blur-2xl">
          
          {/* Ambient Decorative Lighting */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start justify-between gap-6 lg:gap-8">
            
            {/* 1. Main Title, Badges, Subtitle & Action Buttons (Right Area in RTL) */}
            <div className="space-y-4 flex-1 order-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 backdrop-blur-md shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rizbandy Pro • خولی فەرمی</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-200 border border-white/15 backdrop-blur-md">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{players.length} یاریزان</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>پاشەکەوتی مسۆگەر</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 backdrop-blur-md shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>ئەمڕۆ: {todayDetails.fullKurdish}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
                {themeConfig.leagueTitle && themeConfig.leagueTitle !== 'ڕێزبەندی و پێکهاتەی یاریزانان' 
                  ? themeConfig.leagueTitle 
                  : 'ئەپی ڕیزبەندی یاریزان'}
              </h1>
              
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
                سیستەمی دادپەروەرانەی تۆپی پێ بە هاوکێشەی WPI: دروستکردنی پێکهاتەی ٦ بەرامبەر ٦، خێرا، و بەڕێوەبردنی سندوقی دارایی.
              </p>

              {/* Quick Action Buttons inside Hero */}
              <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                {isAdmin && (
                  <>
                    <button
                      onClick={onOpenMatchRecorder}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>تۆمارکردنی یاری نوێ</span>
                    </button>

                    <button
                      onClick={onOpenQuickRating}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-black text-xs flex items-center gap-1.5 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>نمرەدانانی خێرا</span>
                    </button>
                  </>
                )}

                <button
                  onClick={onOpenImageExport}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold text-xs flex items-center gap-1.5 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-slate-300" />
                  <span>داگرتنی وێنەی خول (HD)</span>
                </button>
              </div>

              {/* Top Leader Trophy Showcase Banner Strip strictly formatted */}
              {topPlayer && (
                <div className="pt-2">
                  <div className="inline-flex items-center gap-3.5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-emerald-950/40 backdrop-blur-xl border border-white/15 p-2.5 sm:p-3 shadow-xl transition-transform hover:scale-[1.02]">
                    <div className="space-y-1 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-sm">
                          <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>خاوەنی باڵۆن دۆر (Top 1)</span>
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                        <span>{topPlayer.name}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-300 font-mono">({topPlayer.wins}W • {topPlayer.totalMatches}M)</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-emerald-400 font-mono font-black">WPI: {topPlayer.fairScore}</span>
                      </div>
                    </div>

                    {/* Player Avatar on Right with Ballon d'Or Trophy */}
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-200 p-0.5 shadow-lg shrink-0">
                      <div className="w-full h-full rounded-[10px] overflow-hidden bg-slate-900 flex items-center justify-center font-black text-sm">
                        {topPlayer.avatar ? (
                          <img src={topPlayer.avatar} alt={topPlayer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-amber-400">{topPlayer.name.slice(0, 2)}</span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -left-1 bg-slate-900 border border-amber-400/90 rounded-full p-0.5 shadow-md">
                        <BallonDorTrophy size={18} glow={false} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* 2. Story & Photo Frame (Left Side in RTL, Horizontal Wide Frame with Glowing Border) */}
            <div className="flex flex-col items-start lg:items-end justify-start shrink-0 order-2 w-full lg:w-auto">
              <StoryCarouselWidget
                stories={themeConfig.stories && themeConfig.stories.length > 0 ? themeConfig.stories : (themeConfig.logoUrl && themeConfig.logoUrl !== '/logo.jpg' ? [themeConfig.logoUrl] : undefined)}
                width={themeConfig.storyWidgetWidth || 410}
                height={themeConfig.storyWidgetHeight || 215}
                onAddStory={isAdmin ? onAddStory : undefined}
                onRemoveStory={isAdmin ? onRemoveStory : undefined}
                onOpenStoryModal={onOpenStoryModal || (() => {})}
                onUpdateSize={isAdmin ? onUpdateStorySize : undefined}
              />
            </div>

          </div>

        </div>

      </div>

      {/* 2. Interactive Feature Navigation Grid (4 Modern Sports Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: 6v6 Lineup Studio */}
        <div 
          onClick={() => setActiveTab('lineup')}
          className={`group relative overflow-hidden rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
            activeTab === 'lineup'
              ? 'bg-gradient-to-br from-emerald-900/90 via-slate-900 to-emerald-950 text-white border-emerald-500 shadow-emerald-900/20'
              : 'bg-white hover:border-emerald-500 border-slate-200 text-slate-900 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md transition-transform group-hover:scale-110 ${
              activeTab === 'lineup' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              ⚽
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'lineup' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-emerald-100 text-emerald-800'
            }`}>
              یاریگای ٦×٦
            </span>
          </div>

          <h3 className="text-sm font-black mb-1 group-hover:text-emerald-600 transition-colors">
            پێکهاتە و درێسی یاریزانان
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            ڕێکخستنی تیپی شین و سوور، دیاریکردنی ڕەنگی درێس و هاوسەنگکردنی هێزی تیپەکان.
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-emerald-600">
            <span>کردنەوەی پێکهاتە</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Standings & Leaderboard */}
        <div 
          onClick={() => setActiveTab('standings')}
          className={`group relative overflow-hidden rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
            activeTab === 'standings'
              ? 'bg-gradient-to-br from-blue-900/90 via-slate-900 to-blue-950 text-white border-blue-500 shadow-blue-900/20'
              : 'bg-white hover:border-blue-500 border-slate-200 text-slate-900 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md transition-transform group-hover:scale-110 ${
              activeTab === 'standings' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              🏆
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'standings' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40' : 'bg-blue-100 text-blue-800'
            }`}>
              خشتەی فەرمی
            </span>
          </div>

          <h3 className="text-sm font-black mb-1 group-hover:text-blue-600 transition-colors">
            ڕیزبەندی و خەڵاتەکان
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            باڵۆن دۆر، ئەستێرەی زیوین، بەرازی زێڕین، خاڵی WPI، ئاست و ڕێژەی سەرکەوتن.
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-blue-600">
            <span>بینینی خشتەکە</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Finance & Fund */}
        <div 
          onClick={() => setActiveTab('finance')}
          className={`group relative overflow-hidden rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
            activeTab === 'finance'
              ? 'bg-gradient-to-br from-purple-900/90 via-slate-900 to-purple-950 text-white border-purple-500 shadow-purple-900/20'
              : 'bg-white hover:border-purple-500 border-slate-200 text-slate-900 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md transition-transform group-hover:scale-110 ${
              activeTab === 'finance' ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}>
              💰
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'finance' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40' : 'bg-purple-100 text-purple-800'
            }`}>
              دارایی و سندوق
            </span>
          </div>

          <h3 className="text-sm font-black mb-1 group-hover:text-purple-600 transition-colors">
            سندوق و خەرجی یارییەکان
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            کۆکردنەوەی پارەی یاریزانان، خەرجی کرێی یاریگا و دابەزاندنی ڕاپۆرتی وێنەیی.
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-purple-600">
            <span>سندوقی دارایی</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Live Excel & Quick Sync */}
        <div 
          onClick={isAdmin ? onOpenLiveEditor : undefined}
          className={`group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 p-4 transition-all duration-300 hover:shadow-md text-slate-900 ${
            isAdmin ? 'hover:border-emerald-500 cursor-pointer' : 'opacity-70'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              ئەکسڵی ڕاستەوخۆ
            </span>
          </div>

          <h3 className="text-sm font-black mb-1 group-hover:text-emerald-600 transition-colors">
            خشتەی دەستکاری خێرا
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            دەستکاریکردنی یاری، بردنەوە، دۆڕان و نمرەی هەموو یاریزانەکان بە یەکجار و پاشەکەوتکردن.
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-emerald-600">
            <span>کردنەوەی ئەکسڵ</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* 3. Sleek Floating Utilities Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-xs">
        
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              <button
                onClick={onOpenConfigModal}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>ڕێکخستنی هاوکێشەی WPI</span>
              </button>

              <button
                onClick={onManualSaveAll}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>پاشەکەوتکردنی هەموو داتاکان</span>
              </button>
            </>
          )}
        </div>

        {/* JSON Backup export/import */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportBackupJSON}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
            title="داگرتنی فایلێکی باکئەپ لە هەموو یاریزانان و داتاکان"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>داگرتنی باکئەپ</span>
          </button>

          {isAdmin && (
            <button
              onClick={onImportBackupJSON}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              title="گەڕاندنەوەی فایلی باکئەپ"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>گەڕاندنەوە</span>
            </button>
          )}
        </div>

      </div>

    </section>
  );
};
