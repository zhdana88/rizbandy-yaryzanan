import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Check, 
  Copy, 
  Calendar, 
  Receipt, 
  Table,
  Sparkles,
  FileText,
  Share2,
  ExternalLink,
  Eye,
  RefreshCw,
  AlertCircle,
  Palette,
  RotateCcw
} from 'lucide-react';
import { WeeklyFinanceSession, Player } from '../types';
import { computeSessionSummary, formatCurrency } from '../utils/financeUtils';
import { drawFinanceToCanvas } from '../utils/financeCanvasDrawer';
import { exportCanvasImageMobile, dataURLToBlob } from '../utils/mobileExportHelper';

const PRESET_PAGE_COLORS = [
  { name: 'سپی پوخت (White HD)', hex: '#ffffff' },
  { name: 'مرواری (Pearl)', hex: '#f8fafc' },
  { name: 'کرێمی (Cream)', hex: '#faf8f5' },
  { name: 'نەعنای کاڵ (Mint)', hex: '#ecfdf5' },
  { name: 'ئاسمانی کاڵ (Sky)', hex: '#f0f9ff' },
  { name: 'پەمەیی کاڵ (Rose)', hex: '#fff1f2' },
  { name: 'تاریک (Dark Slate)', hex: '#080c16' },
  { name: 'سەوزی تۆخ (Emerald)', hex: '#022c22' },
  { name: 'شینی شاهانە (Navy)', hex: '#0b132b' },
  { name: 'مۆری پاشایەتی (Purple)', hex: '#1e1035' },
];

interface ExportFinanceImageModalProps {
  session: WeeklyFinanceSession;
  sessions?: WeeklyFinanceSession[];
  players: Player[];
  matrixTuesdays?: string[];
  sessionMap?: Map<string, WeeklyFinanceSession>;
  playerMatrixStats?: Record<string, { totalPaid: number; totalDebt: number; matchCount: number }>;
  columnMatrixTotals?: Record<string, { totalCollected: number; pitchCost: number; net: number; attendedCount: number; payingCount?: number; exemptCount?: number; absentCount?: number }>;
  activeSummary?: {
    totalIncome: number;
    totalPitchRent: number;
    totalOtherExpenses: number;
    totalExpenses: number;
    netBalance: number;
    totalOutstandingDebt: number;
    sessionsCount?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  leagueTitle?: string;
  exportMode?: 'matrix' | 'single';
}

export const ExportFinanceImageModal: React.FC<ExportFinanceImageModalProps> = ({
  session,
  players,
  matrixTuesdays = [],
  sessionMap = new Map(),
  playerMatrixStats = {},
  columnMatrixTotals = {},
  activeSummary,
  isOpen,
  onClose,
  leagueTitle = 'ڕێزبەندی Rizbandy',
  exportMode = 'matrix',
}) => {
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [posterTheme, setPosterTheme] = useState<'white' | 'cream' | 'dark' | 'emerald' | 'navy' | 'custom'>('white');
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff');
  const [currentTab, setCurrentTab] = useState<'matrix' | 'single'>(exportMode);

  // Generate crisp canvas image whenever modal is open or options change
  useEffect(() => {
    if (!isOpen) {
      setGeneratedImageUrl(null);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);
    setErrorMessage(null);

    const generate = async () => {
      try {
        const canvas = await drawFinanceToCanvas({
          session,
          players,
          matrixTuesdays,
          sessionMap,
          playerMatrixStats,
          columnMatrixTotals,
          activeSummary,
          leagueTitle,
          theme: posterTheme,
          customBgColor,
          mode: currentTab,
        });

        if (!isMounted) return;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        setGeneratedImageUrl(dataUrl);
      } catch (err: any) {
        console.error('Failed to draw finance to canvas:', err);
        if (isMounted) {
          setErrorMessage('هەڵەیەک لە دروستکردنی وێنەکە دروستبوو، تکایە دووبارە هەوڵبدەرەوە.');
        }
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    };

    generate();

    return () => {
      isMounted = false;
    };
  }, [
    isOpen,
    session,
    players,
    matrixTuesdays,
    sessionMap,
    playerMatrixStats,
    columnMatrixTotals,
    activeSummary,
    leagueTitle,
    posterTheme,
    customBgColor,
    currentTab,
  ]);

  if (!isOpen) return null;

  // 1. Direct Download PNG with DOM Attachment & Fallbacks
  const handleDownloadImage = async () => {
    if (!generatedImageUrl || isGenerating) return;

    const fileName = currentTab === 'matrix' 
      ? `خشتەی_حیساباتی_دارایی_سێشەممەکان_${Date.now()}.png`
      : `پسوولەی_حیساباتی_${session.date || Date.now()}.png`;

    const res = await exportCanvasImageMobile({
      canvasOrDataUrl: generatedImageUrl,
      fileName,
      title: leagueTitle || 'ڕاپۆرتی دارایی سێشەممەکان',
      text: 'ڕاپۆرتی فەرمی حیساباتی دارایی و سندووقی یاریزانان',
      action: 'download',
    });

    if (res.success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } else {
      setErrorMessage('کێشەیەک لە داگرتنی وێنەکە دروست بوو');
    }
  };

  // 2. Mobile Native Share (Save to Gallery / WhatsApp / Viber)
  const handleNativeShare = async () => {
    if (!generatedImageUrl) return;

    const fileName = currentTab === 'matrix' 
      ? `خشتەی_حیساباتی_دارایی_سێشەممەکان_${Date.now()}.png`
      : `پسوولەی_حیساباتی_${session.date || Date.now()}.png`;

    const res = await exportCanvasImageMobile({
      canvasOrDataUrl: generatedImageUrl,
      fileName,
      title: leagueTitle || 'ڕاپۆرتی دارایی سێشەممەکان',
      text: 'ڕاپۆرتی فەرمی حیساباتی دارایی و سندووقی یاریزانان',
      action: 'share',
    });

    if (res.success) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  // 3. Copy Image to Clipboard
  const handleCopyToClipboard = async () => {
    if (!generatedImageUrl || isGenerating) return;

    try {
      const blob = dataURLToBlob(generatedImageUrl);

      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ [blob.type]: blob })
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } else {
        await handleDownloadImage();
      }
    } catch (err) {
      console.error('Failed to copy image to clipboard:', err);
      await handleDownloadImage();
    }
  };

  // 4. Open in New Tab
  const handleOpenInNewTab = () => {
    if (!generatedImageUrl) return;
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
          <head>
            <title>ڕاپۆرتی دارایی - Rizbandy</title>
            <style>
              body {
                margin: 0;
                background-color: #030712;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 20px;
                color: #fff;
                font-family: system-ui, sans-serif;
              }
              img {
                max-width: 100%;
                height: auto;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
                border: 1px solid #1e293b;
              }
              p {
                margin-top: 16px;
                font-size: 14px;
                color: #94a3b8;
              }
            </style>
          </head>
          <body>
            <img src="${generatedImageUrl}" alt="Finance Report" />
            <p>کلیکی ڕاست بکە لەسەر وێنەکە و "Save image as..." هەڵبژێرە بۆ پاشەکەوتکردن.</p>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl my-4">
        
        {/* Modal Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800 gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
                <span>داگرتنی ڕاپۆرتی حیسابات و دارایی بە وێنە</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ڕوونی بەرز 1080p HD
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                پۆستەری فەرمی حیساباتی سێشەممەکان بە شێوەیەکی ئامادەکراو بۆ واتسئەپ و ڤایبەر
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
            
            {/* Format Toggle: Matrix vs Single */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setCurrentTab('matrix')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  currentTab === 'matrix' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>خشتەی سێشەممەکان</span>
              </button>
              <button
                onClick={() => setCurrentTab('single')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  currentTab === 'single' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>پسوولەی تاکە هەفتە</span>
              </button>
            </div>

            {/* Native Mobile Share */}
            <button
              onClick={handleNativeShare}
              disabled={isGenerating || !generatedImageUrl}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
              title="ناردن بۆ واتسئەپ یان ڤایبەر"
            >
              {shareSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>نێردرا!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>ناردن (Share)</span>
                </>
              )}
            </button>

            {/* Copy to Clipboard */}
            <button
              onClick={handleCopyToClipboard}
              disabled={isGenerating || !generatedImageUrl}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>کۆپی کرا!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کۆپیکردن</span>
                </>
              )}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating || !generatedImageUrl}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>خەریکی ئامادەکردنە...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>داگیرا!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>داگرتنی PNG</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Background Color & Theme Customization Bar */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Preset Theme Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold ml-1 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span>ڕووکار و شێواز:</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setPosterTheme('white');
                setCustomBgColor('#ffffff');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                posterTheme === 'white'
                  ? 'bg-white text-slate-950 border-white shadow-sm ring-2 ring-emerald-400 font-black'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400" />
              <span>سپی (White HD)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPosterTheme('cream');
                setCustomBgColor('#faf8f5');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                posterTheme === 'cream'
                  ? 'bg-[#faf8f5] text-amber-950 border-amber-300 shadow-sm ring-2 ring-emerald-400 font-black'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#faf8f5] border border-amber-300" />
              <span>کرێمی نەرم</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPosterTheme('dark');
                setCustomBgColor('#080c16');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                posterTheme === 'dark'
                  ? 'bg-slate-800 text-white border-slate-600 shadow-sm ring-2 ring-emerald-400 font-black'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#080c16] border border-slate-700" />
              <span>تاریک</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPosterTheme('emerald');
                setCustomBgColor('#022c22');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                posterTheme === 'emerald'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm ring-2 ring-emerald-400 font-black'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#022c22] border border-emerald-600" />
              <span>سەوز</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPosterTheme('navy');
                setCustomBgColor('#0b132b');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border ${
                posterTheme === 'navy'
                  ? 'bg-blue-950 text-blue-300 border-blue-500 shadow-sm ring-2 ring-emerald-400 font-black'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#0b132b] border border-blue-600" />
              <span>شین</span>
            </button>
          </div>

          {/* Custom Background Color Picker & Quick Swatches */}
          <div className="flex items-center gap-2 flex-wrap self-stretch lg:self-auto justify-between lg:justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
            <span className="text-slate-400 font-bold text-xs">ڕەنگی لاپەڕە بەدڵی خۆت:</span>
            
            {/* Quick Swatch Circles */}
            <div className="flex items-center gap-1.5">
              {PRESET_PAGE_COLORS.map((c) => {
                const isSelected = customBgColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      setCustomBgColor(c.hex);
                      if (c.hex === '#ffffff') setPosterTheme('white');
                      else if (c.hex === '#faf8f5') setPosterTheme('cream');
                      else if (c.hex === '#080c16') setPosterTheme('dark');
                      else if (c.hex === '#022c22') setPosterTheme('emerald');
                      else if (c.hex === '#0b132b') setPosterTheme('navy');
                      else setPosterTheme('custom');
                    }}
                    title={c.name}
                    style={{ backgroundColor: c.hex }}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      isSelected
                        ? 'ring-2 ring-emerald-400 scale-125 border-white shadow-md'
                        : 'border-slate-600 hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>

            {/* Native Color Picker for Any Custom Hex */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1">
              <input
                type="color"
                value={customBgColor}
                onChange={(e) => {
                  setCustomBgColor(e.target.value);
                  setPosterTheme('custom');
                }}
                className="w-5 h-5 rounded-md cursor-pointer border-0 bg-transparent p-0"
                title="هەڵبژاردنی ڕەنگی دڵخواز"
              />
              <span className="font-mono text-[11px] text-emerald-400 font-bold uppercase" dir="ltr">
                {customBgColor}
              </span>
            </div>

            {/* Reset button if not white */}
            {customBgColor.toLowerCase() !== '#ffffff' && (
              <button
                type="button"
                onClick={() => {
                  setPosterTheme('white');
                  setCustomBgColor('#ffffff');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1"
                title="گەڕانەوە بۆ سپی"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[11px]">سپی</span>
              </button>
            )}
          </div>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Canvas Preview Area */}
        <div className="max-h-[68vh] overflow-y-auto overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-2 sm:p-4 flex flex-col items-center justify-center min-h-[300px]">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-sm font-bold">خەریکی دروستکردنی وێنەی ڕوونی بەرزی حیساباتە...</p>
              <p className="text-xs text-slate-500">بە کواڵیتی باڵای 1080p و گرافیکی ورد</p>
            </div>
          ) : generatedImageUrl ? (
            <div className="relative group w-full flex flex-col items-center">
              <img 
                src={generatedImageUrl} 
                alt="Finance Report Export" 
                className="w-full max-w-4xl h-auto rounded-2xl border border-slate-800 shadow-2xl object-contain"
              />
              
              {/* Quick Hover Action Bar */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={handleOpenInNewTab}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>کردنەوە لە پەڕەی نوێ</span>
                </button>
                <span className="text-xs text-slate-500">
                  تکایە کلیک لە دوگمەی سەوزی «داگرتنی PNG» بکە بۆ پاشەکەوتکردنی ڕاستەوخۆ
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer Tips */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-slate-800 mt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>وێنەکە بە کواڵیتی و تایبەتمەندی تەواوی واتسئەپ و تۆڕە کۆمەڵایەتییەکان داڕێژراوە.</span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Rizbandy Pro HD • 1080p Crisp Canvas Engine
          </div>
        </div>

      </div>
    </div>
  );
};
