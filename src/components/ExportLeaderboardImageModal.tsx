import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Image as ImageIcon, 
  Check, 
  Share2, 
  Copy,
  ExternalLink,
  Smartphone,
  Eye,
  Palette,
  RotateCcw
} from 'lucide-react';
import { ComputedPlayerStats, RankingConfig, ThemeConfig } from '../types';
import { drawLeaderboardToCanvas } from '../utils/leaderboardCanvasDrawer';
import { exportCanvasImageMobile, dataURLToBlob } from '../utils/mobileExportHelper';

const PRESET_BG_COLORS = [
  { name: 'سپی (White)', hex: '#ffffff' },
  { name: 'مرواری (Pearl)', hex: '#f8fafc' },
  { name: 'کرێمی (Cream)', hex: '#faf8f5' },
  { name: 'نەعنای کاڵ (Mint)', hex: '#ecfdf5' },
  { name: 'ئاسمانی کاڵ (Sky)', hex: '#f0f9ff' },
  { name: 'پەمەیی کاڵ (Rose)', hex: '#fff1f2' },
  { name: 'خۆڵەمێشی کاڵ', hex: '#f1f5f9' },
];

interface ExportLeaderboardImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: ComputedPlayerStats[];
  config: RankingConfig;
  themeConfig: ThemeConfig;
}

export const ExportLeaderboardImageModal: React.FC<ExportLeaderboardImageModalProps> = ({
  isOpen,
  onClose,
  players,
  config,
  themeConfig,
}) => {
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff');

  // Generate crisp canvas image when modal opens or players change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsExporting(true);
    setErrorMessage(null);

    (async () => {
      try {
        const canvas = await drawLeaderboardToCanvas(players, config, themeConfig, customBgColor);
        if (!isMounted) return;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        setGeneratedImageUrl(dataUrl);
      } catch (err: any) {
        console.error('Canvas generation error:', err);
        if (isMounted) setErrorMessage('هەڵەیەک ڕوویدا لە دروستکردنی وێنەکە');
      } finally {
        if (isMounted) setIsExporting(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, players, config, themeConfig, customBgColor]);

  if (!isOpen) return null;

  // 1. Download PNG with direct Blob Object URL and Android/iOS resilience
  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `rizbandy-leaderboard-${dateStr}.png`;

    const res = await exportCanvasImageMobile({
      canvasOrDataUrl: generatedImageUrl,
      fileName,
      title: themeConfig.leagueTitle || 'ڕێزبەندی Rizbandy',
      text: 'وێنەی نوێترین خشتەی ڕیزبەندی یاریزانان',
      action: 'download',
    });

    if (res.success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } else {
      setErrorMessage('کێشەیەک لە داگرتنی وێنەکە دروست بوو');
    }
  };

  // 2. Native Mobile Share (iPhone / Android Save Image to Photos & Share)
  const handleNativeShare = async () => {
    if (!generatedImageUrl) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `rizbandy-${dateStr}.png`;

    const res = await exportCanvasImageMobile({
      canvasOrDataUrl: generatedImageUrl,
      fileName,
      title: themeConfig.leagueTitle || 'ڕێزبەندی Rizbandy',
      text: 'وێنەی نوێترین خشتەی ڕیزبەندی یاریزانان',
      action: 'share',
    });

    if (res.success) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  // 3. Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!generatedImageUrl) return;
    try {
      const blob = dataURLToBlob(generatedImageUrl);
      if (navigator.clipboard && window.ClipboardItem && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
        return;
      }
    } catch (err) {
      console.error('Error copying image:', err);
    }
    handleDownload();
  };

  // 4. Open in New Tab
  const handleOpenInNewTab = () => {
    if (!generatedImageUrl) return;
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>وێنەی ڕیزبەندی</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { margin: 0; background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui; }
              img { max-width: 95%; height: auto; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); margin: 20px auto; }
            </style>
          </head>
          <body>
            <img src="${generatedImageUrl}" alt="Rizbandy Leaderboard" />
          </body>
        </html>
      `);
    }
  };

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl my-6 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              title="گەڕانەوە بۆ پەڕەی سەرەکی"
            >
              <span>گەڕانەوە بۆ سەرەکی ↩️</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  داگرتنی وێنەی خشتەی ڕیزبەندی (Poster Export)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  وێنەی کوالێتی بەرز و باکگراوندی سپی لەگەڵ هێڵی جیاکەرەوە
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center gap-1 text-xs font-bold"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">داخستن</span>
          </button>
        </div>

        {/* Mobile Guidance Banner */}
        <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-900 font-bold">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>بۆ مۆبایل: دوگمەی سەوز دابگرە، یان دەست لەسەر وێنەکە ڕابگرە (Long Press) و هەڵیبژێرە "Save to Photos".</span>
          </div>
          <button
            onClick={handleNativeShare}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black shrink-0 transition flex items-center gap-1 shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>ناردن بۆ مۆبایل</span>
          </button>
        </div>

        {/* Page Background Color Customizer Bar */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-slate-700">ڕەنگی پۆستەر و لاپەڕە بەدڵی خۆت:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Swatches */}
            <div className="flex items-center gap-1.5">
              {PRESET_BG_COLORS.map((c) => {
                const isSelected = customBgColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setCustomBgColor(c.hex)}
                    title={c.name}
                    style={{ backgroundColor: c.hex }}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 scale-125 border-emerald-600 shadow-xs'
                        : 'border-slate-300 hover:scale-110 opacity-85 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>

            {/* Custom Color Input */}
            <label className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-300 rounded-xl cursor-pointer hover:border-emerald-500 transition shadow-2xs">
              <input
                type="color"
                value={customBgColor}
                onChange={(e) => setCustomBgColor(e.target.value)}
                className="w-5 h-5 rounded-md cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="font-mono text-[11px] text-emerald-700 font-bold uppercase" dir="ltr">
                {customBgColor}
              </span>
            </label>

            {customBgColor.toLowerCase() !== '#ffffff' && (
              <button
                type="button"
                onClick={() => setCustomBgColor('#ffffff')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition flex items-center gap-1 text-[11px] font-bold"
                title="گەڕانەوە بۆ سپی"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>سپی</span>
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
            {errorMessage}
          </div>
        )}

        {/* Generated Image Preview Area */}
        <div className="max-h-[58vh] overflow-y-auto rounded-2xl border-2 border-slate-200 bg-slate-100 p-2 sm:p-4 text-center">
          {generatedImageUrl ? (
            <div className="inline-block shadow-lg rounded-xl overflow-hidden bg-white">
              <img 
                src={generatedImageUrl} 
                alt="Leaderboard Poster" 
                className="max-w-full h-auto block select-auto"
              />
            </div>
          ) : (
            <div className="py-16 text-slate-400 font-bold text-xs flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>خەریکی دروستکردنی وێنەکەیە...</span>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition border border-slate-200"
            >
              <ExternalLink className="w-4 h-4" />
              <span>کردنەوە لە پەڕەی نوێ</span>
            </button>

            <button
              onClick={handleCopyImage}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition border border-slate-200"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>کۆپی کرا!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کۆپیکردنی وێنە</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 transition shadow-md"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>داگیرا! (Downloaded)</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>داگرتنی وێنە بۆ مۆبایل / کۆمپیوتەر</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
