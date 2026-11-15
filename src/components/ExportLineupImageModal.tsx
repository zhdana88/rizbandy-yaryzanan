import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Check, 
  Copy, 
  Sparkles, 
  AlertCircle, 
  Shield, 
  Smartphone,
  Eye
} from 'lucide-react';
import { ComputedPlayerStats, LineupMatchState } from '../types';
import { drawLineupToCanvas } from '../utils/lineupCanvasDrawer';
import { exportCanvasImageMobile, dataURLToBlob } from '../utils/mobileExportHelper';

interface ExportLineupImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchState: LineupMatchState;
  players: ComputedPlayerStats[];
  leagueTitle?: string;
}

export const ExportLineupImageModal: React.FC<ExportLineupImageModalProps> = ({
  isOpen,
  onClose,
  matchState,
  players,
  leagueTitle,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setDataUrl(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);
    setError(null);

    (async () => {
      try {
        const canvas = await drawLineupToCanvas(matchState, players, leagueTitle);
        if (!isMounted) return;
        const url = canvas.toDataURL('image/png', 1.0);
        setDataUrl(url);
      } catch (err: any) {
        console.error('Error generating lineup image', err);
        if (isMounted) setError('کێشەیەک ڕوویدا لە دروستکردنی وێنەی پێکهاتەکە');
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, matchState, players, leagueTitle]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!dataUrl) return;
    const dateStr = matchState.date || new Date().toISOString().split('T')[0];
    const fileName = `Lineup-6v6-${matchState.teamA.name}-vs-${matchState.teamB.name}-${dateStr}.png`;

    const res = await exportCanvasImageMobile({
      canvasOrDataUrl: dataUrl,
      fileName,
      title: `پێکهاتەی یاریگای ٦ بەرامبەر ٦`,
      text: `پێکهاتەی فەرمی یاری ٦ بەرامبەر ٦: ${matchState.teamA.name} بەرامبەر ${matchState.teamB.name}`,
      action: 'download',
    });

    if (res.success) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  const handleCopyImage = async () => {
    if (!dataUrl) return;
    try {
      const blob = dataURLToBlob(dataUrl);
      if (navigator.clipboard && (window as any).ClipboardItem && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ [blob.type]: blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      }
    } catch (e) {
      console.warn('Clipboard copy failed, fallback to download', e);
    }
    handleDownload();
  };

  const handleShareMobile = async () => {
    if (!dataUrl) return;
    const dateStr = matchState.date || new Date().toISOString().split('T')[0];
    const fileName = `Lineup-6v6-${matchState.teamA.name}-vs-${matchState.teamB.name}-${dateStr}.png`;

    const res = await exportCanvasImageMobile({
      canvasOrDataUrl: dataUrl,
      fileName,
      title: `پێکهاتەی یاریگای ٦ بەرامبەر ٦`,
      text: `پێکهاتەی فەرمی یاری ٦ بەرامبەر ٦: ${matchState.teamA.name} بەرامبەر ${matchState.teamB.name}`,
      action: 'share',
    });

    if (res.success) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-2xl my-auto text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-black shadow-xs shrink-0">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  داونلۆدکردنی وێنەی پێکهاتەی ٦ بەرامبەر ٦
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  HD Quality
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                وێنەی فەرمی یاریگاکە لەگەڵ وێنەی یاریزانەکان و یەدەگەکان بۆ مۆبایل ئامادەیە
              </p>
            </div>
          </div>

          {/* Action Buttons for Desktop / Mobile */}
          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleShareMobile}
                disabled={!dataUrl || isGenerating}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>{shareSuccess ? 'هاوبەشکرا!' : 'هاوبەشکردن (مۆبایل)'}</span>
              </button>
            )}

            <button
              onClick={handleCopyImage}
              disabled={!dataUrl || isGenerating}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'کۆپی کرا!' : 'کۆپیکردنی وێنە'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={!dataUrl || isGenerating}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition shadow-md disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>داگرتن بۆ مۆبایل (PNG)</span>
            </button>
          </div>
        </div>

        {/* Mobile Quick Tip */}
        <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
          <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">
            <strong>بۆ مۆبایل:</strong> دەتوانیت پەنجەت لەسەر وێنەکە ڕابگریت (Long-Press) و «Save to Photos» یان «داگرتن» هەڵبژێریت.
          </span>
        </div>

        {/* Preview Container */}
        <div 
          ref={containerRef}
          className="relative w-full max-h-[62vh] overflow-y-auto bg-slate-100 rounded-2xl border border-slate-200 p-2 sm:p-4 flex items-center justify-center shadow-inner"
        >
          {isGenerating ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-bold text-slate-700">دروستکردنی وێنەی پێکهاتە بە کوالێتی بەرز...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-rose-600 flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8" />
              <span className="text-sm font-bold">{error}</span>
            </div>
          ) : dataUrl ? (
            <div className="relative max-w-full flex justify-center">
              <img 
                src={dataUrl} 
                alt="6v6 Lineup Poster" 
                className="max-h-[60vh] w-auto rounded-xl shadow-lg border border-slate-300 select-all cursor-pointer hover:shadow-xl transition"
                title="کلیک لە وێنەکە بکە یان پەنجەی لەسەر ڕابگرە بۆ داگرتن"
              />
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>کوالێتی تەواو: 2400 x 3120 پیکسل (Retina Ready)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
          >
            داخستن
          </button>
        </div>

      </div>
    </div>
  );
};
