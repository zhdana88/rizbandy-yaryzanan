import React, { useEffect, useRef } from 'react';
import { 
  X, 
  Palette, 
  Eye, 
  Sliders, 
  Type, 
  Layout, 
  Check, 
  Sparkles, 
  RotateCcw, 
  Home,
  Image as ImageIcon,
  Upload,
  Camera
} from 'lucide-react';
import { ThemeConfig, ThemeColor } from '../types';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig: ThemeConfig;
  setThemeConfig: React.Dispatch<React.SetStateAction<ThemeConfig>>;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  themeConfig,
  setThemeConfig,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const currentLogo = themeConfig.logoUrl || '/logo.jpg';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setThemeConfig(prev => ({ ...prev, logoUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const colorThemes: { key: ThemeColor; name: string; class: string; border: string }[] = [
    { key: 'emerald', name: 'سەوزی وەرزشی (Emerald)', class: 'bg-emerald-500', border: 'border-emerald-500' },
    { key: 'amber', name: 'زێڕینی پێشەنگ (Gold)', class: 'bg-amber-400', border: 'border-amber-400' },
    { key: 'blue', name: 'شینی شاهانە (Royal Blue)', class: 'bg-blue-500', border: 'border-blue-500' },
    { key: 'purple', name: 'مۆری مۆدێرن (Purple Neon)', class: 'bg-purple-500', border: 'border-purple-500' },
    { key: 'crimson', name: 'سووری ئاگرین (Crimson)', class: 'bg-rose-500', border: 'border-rose-500' },
  ];

  const handleResetDefaults = () => {
    setThemeConfig({
      themeColor: 'emerald',
      showSpotlight: true,
      showDangerZone: true,
      showFormulaExplainer: true,
      leagueTitle: 'ئەپی ریزبەندی یاریزان',
      leagueSubtitle: 'سیستەمی دادپەروەرانەی تۆپی پێ • WPI',
      compactMode: false,
      logoUrl: '/logo.jpg',
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleLogoUpload} 
        />
        
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

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              کۆنترۆڵکردنی دیزاین و ڕووکار (Full Customization)
            </h3>
            <p className="text-xs text-slate-400">
              گۆڕانکاری لە لۆگۆ، وێنەی ستۆری، ڕەنگە سەرەکییەکان و بەشەکانی داشبۆرد
            </p>
          </div>
        </div>

        <div className="space-y-5 text-xs">
          
          {/* Logo & Story Badge Setting */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-200">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>لۆگۆ و وێنەی ستۆری خولەکە:</span>
              </div>
              <span className="text-[10px] text-slate-400">دەتوانیت وێنەی خۆت دابنێیت</span>
            </div>

            <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-xl border border-slate-800">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/40 shrink-0 flex items-center justify-center p-0.5">
                <img 
                  src={currentLogo} 
                  alt="Current Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>گۆڕینی وێنە لە ئامێرەکەت</span>
                  </button>

                  {themeConfig.logoUrl && themeConfig.logoUrl !== '/logo.jpg' && (
                    <button
                      type="button"
                      onClick={() => setThemeConfig(prev => ({ ...prev, logoUrl: '/logo.jpg' }))}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>لۆگۆی بنەڕەت</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  وێنەکە لەسەر هێرۆ، ستۆری و بارگەی سەرەوە دەردەکەوێت
                </p>
              </div>
            </div>

            {/* Story Frame Size Selector */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">قەبارەی چوارچێوەی ئاسۆیی ستۆری (Horizontal Frame Size):</span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">{themeConfig.storyWidgetWidth || 340}px</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'بچووک (S)', w: 240, h: 120, key: 'small' },
                  { label: 'مامناوەند (M)', w: 320, h: 135, key: 'medium' },
                  { label: 'گەورە (L)', w: 400, h: 170, key: 'large' },
                  { label: 'زۆر گەورە (XL)', w: 480, h: 200, key: 'xl' },
                ].map(preset => {
                  const isSelected = (themeConfig.storyWidgetWidth || 340) === preset.w || themeConfig.storyWidgetSize === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => {
                        setThemeConfig(prev => ({
                          ...prev,
                          storyWidgetWidth: preset.w,
                          storyWidgetHeight: preset.h,
                          storyWidgetSize: preset.key as any,
                        }));
                      }}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Slider */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-500 font-mono">220px</span>
                <input
                  type="range"
                  min={220}
                  max={520}
                  step={10}
                  value={themeConfig.storyWidgetWidth || 340}
                  onChange={(e) => {
                    const newW = Number(e.target.value);
                    const newH = Math.max(120, Math.min(220, Math.round(newW * 0.42)));
                    setThemeConfig(prev => ({
                      ...prev,
                      storyWidgetWidth: newW,
                      storyWidgetHeight: newH,
                      storyWidgetSize: 'custom',
                    }));
                  }}
                  className="flex-1 accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-500 font-mono">520px</span>
              </div>
            </div>
          </div>

          {/* League Title & Subtitle */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Type className="w-4 h-4 text-emerald-400" />
              <span>ناونیشانی فەرمی خول / گرووپ:</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">ناونیشانی سەرەکی:</label>
              <input
                type="text"
                value={themeConfig.leagueTitle}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, leagueTitle: e.target.value }))}
                placeholder="ئەپی ریزبەندی یاریزان"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">ناونیشانی لاوەکی:</label>
              <input
                type="text"
                value={themeConfig.leagueSubtitle}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, leagueSubtitle: e.target.value }))}
                placeholder="سیستەمی دادپەروەرانەی تۆپی پێ"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Accent Color Themes */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>ڕەنگی پاشبنەما و شریتی سەرەکی:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {colorThemes.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setThemeConfig(prev => ({ ...prev, themeColor: c.key }))}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-right transition ${
                    themeConfig.themeColor === c.key
                      ? `bg-slate-800 ${c.border} text-white font-bold`
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${c.class} shrink-0`} />
                  <span className="text-[11px] truncate">{c.name}</span>
                  {themeConfig.themeColor === c.key && <Check className="w-3.5 h-3.5 mr-auto text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Toggles */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>پیشاندانی بەشە تایبەتەکان:</span>
            </div>

            {/* Toggle 1: Top Spotlight Cards */}
            <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-900 cursor-pointer transition">
              <span className="text-slate-300">کارتی پێشەنگەکان (Top 1 & Top 2 Spotlight)</span>
              <input
                type="checkbox"
                checked={themeConfig.showSpotlight}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, showSpotlight: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            {/* Toggle 2: Danger Zone Alert */}
            <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-900 cursor-pointer transition">
              <span className="text-slate-300">ئاگاداری ناوچەی مەترسی / دابەزین (Red Zone)</span>
              <input
                type="checkbox"
                checked={themeConfig.showDangerZone}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, showDangerZone: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            {/* Toggle 3: Formula Explainer */}
            <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-900 cursor-pointer transition">
              <span className="text-slate-300">ڕوونکردنەوەی هاوکێشەی دادپەروەرانە (WPI Formula)</span>
              <input
                type="checkbox"
                checked={themeConfig.showFormulaExplainer}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, showFormulaExplainer: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>گەڕاندنەوە بۆ بنەڕەت</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition"
          >
            جێبەجێکردن (Save Theme)
          </button>
        </div>

      </div>
    </div>
  );
};
