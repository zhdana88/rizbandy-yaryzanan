import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Camera, 
  Layers,
  RefreshCw,
  Check,
  Image as ImageIcon,
  UploadCloud
} from 'lucide-react';

interface StoryCarouselWidgetProps {
  stories?: string[];
  onAddStory: (newImageUrl: string) => void;
  onRemoveStory: (index: number) => void;
  onOpenStoryModal: () => void;
  width?: number;
  height?: number;
  onUpdateSize?: (width: number, height: number, sizePreset?: 'small' | 'medium' | 'large' | 'xl' | 'custom') => void;
}

const STORY_DURATION_MS = 5000; // 5 seconds per story

export const DEFAULT_STORY_WALLPAPERS = [
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=1200&auto=format&fit=crop&q=85'
];

// Helper function to compress and resize image so it uploads cleanly without memory or base64 freeze
const processAndCompressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('هەڵە لە خوێندنەوەی پەڕگە'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('هەڵە لە بارکردنی وێنە'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1400; // keep sharp yet lightweight
          let w = img.width;
          let h = img.height;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.90);
          resolve(compressedDataUrl);
        } catch (e) {
          resolve(readerEvent.target?.result as string);
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const StoryCarouselWidget: React.FC<StoryCarouselWidgetProps> = ({
  stories = [],
  onAddStory,
  onRemoveStory,
  onOpenStoryModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter out invalid/empty strings or fallback to rich default wallpapers
  const validStories = stories && stories.length > 0 
    ? stories.filter(s => s && s.trim() !== '' && s !== '/logo.jpg') 
    : [];

  const displayStories = validStories.length > 0 ? validStories : DEFAULT_STORY_WALLPAPERS;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; type: 'success' | 'delete' } | null>(null);

  // Keep index within bounds if stories array changes
  useEffect(() => {
    if (currentIndex >= displayStories.length) {
      setCurrentIndex(Math.max(0, displayStories.length - 1));
      setProgress(0);
    }
  }, [displayStories.length, currentIndex]);

  // Story Timer Effect
  useEffect(() => {
    if (isPaused || displayStories.length <= 1) return;

    const intervalStep = 50; // ms
    const stepIncrement = (intervalStep / STORY_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((curr) => (curr + 1) % displayStories.length);
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, displayStories.length]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((curr) => (curr + 1) % displayStories.length);
    setProgress(0);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((curr) => (curr - 1 + displayStories.length) % displayStories.length);
    setProgress(0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const optimizedImage = await processAndCompressImage(file);
          onAddStory(optimizedImage);
        }
      }

      // Switch to newly added story
      setCurrentIndex(displayStories.length);
      setProgress(0);
      setFeedbackToast({ text: 'وێنەی نوێ زیادکرا! ✨', type: 'success' });
      setTimeout(() => setFeedbackToast(null), 2500);
    } catch (err) {
      console.error('Upload error:', err);
      setFeedbackToast({ text: 'هەڵە لە بارکردنی وێنە', type: 'delete' });
      setTimeout(() => setFeedbackToast(null), 2500);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Safe and instant delete handler
  const handleDeleteCurrent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (validStories.length > 0) {
      onRemoveStory(currentIndex);
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(0);
    }
    setProgress(0);
    setFeedbackToast({ text: 'وێنەکە سڕایەوە 🗑️', type: 'delete' });
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const currentImage = displayStories[currentIndex] || DEFAULT_STORY_WALLPAPERS[0];

  return (
    <div className="flex flex-col items-start select-none relative w-full lg:w-[410px] xl:w-[450px] shrink-0">
      
      {/* Top Title Label strictly matching reference screenshot */}
      <div className="flex items-center justify-between w-full pb-1.5 px-1 text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ستۆری و لۆگۆ (ئاسۆیی)</span>
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        {displayStories.length > 1 && (
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
            {currentIndex + 1} / {displayStories.length}
          </span>
        )}
      </div>

      {/* Main Story Container Frame with Neon Border Glow (Large & Crisp Display) */}
      <div 
        className="relative w-full rounded-[24px] p-[2.5px] bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300/90 shadow-[0_0_30px_rgba(16,185,129,0.3)] select-none overflow-hidden transition-all duration-300 group/story"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          multiple
          className="hidden" 
          onChange={handleFileUpload} 
        />

        {/* Main Inner Story Card Box */}
        <div 
          className="relative w-full h-[185px] sm:h-[210px] lg:h-[225px] rounded-[21px] overflow-hidden bg-slate-950 flex flex-col justify-between"
        >
          
          {/* Story Background Image (Cover to prevent empty black areas) */}
          <div 
            className="absolute inset-0 cursor-pointer overflow-hidden bg-slate-950 flex items-center justify-center"
            onClick={onOpenStoryModal}
            title="کلیک بکە بۆ گەورەکردنی ستۆری و وێنەکان"
          >
            <img 
              key={currentImage} 
              src={currentImage} 
              alt={`Story ${currentIndex + 1}`} 
              className="w-full h-full object-cover object-center transition-all duration-700 group-hover/story:scale-105"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_STORY_WALLPAPERS[0];
              }}
            />

            {/* Subtle Gradient Overlays for top & bottom contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/60 pointer-events-none" />

            {/* If hovering, prompt overlay */}
            <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/story:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-[11px] font-bold border border-white/20 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>بینین و گۆڕینی ستۆری</span>
              </span>
            </div>

            {/* Uploading Spinner Indicator */}
            {isUploading && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center z-30 text-white">
                <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mb-1.5" />
                <span className="text-xs font-bold text-emerald-300">وێنەکە باردەکرێت...</span>
              </div>
            )}

            {/* Dynamic Toast Feedback Overlay */}
            {feedbackToast && (
              <div className={`absolute inset-0 backdrop-blur-xs flex items-center justify-center z-30 gap-1.5 animate-fade-in font-black text-xs ${
                feedbackToast.type === 'success' ? 'bg-emerald-950/85 text-emerald-300' : 'bg-rose-950/85 text-rose-300'
              }`}>
                {feedbackToast.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <Trash2 className="w-4 h-4 text-rose-400" />}
                <span>{feedbackToast.text}</span>
              </div>
            )}
          </div>

          {/* Top Section: Segmented Progress + Header Badges */}
          <div className="relative z-20 p-2.5 sm:p-3 space-y-1.5">
            
            {/* Segmented Instagram-style progress bars */}
            {displayStories.length > 1 && (
              <div className="flex items-center gap-1 w-full pb-0.5">
                {displayStories.map((_, idx) => {
                  let barWidth = '0%';
                  if (idx < currentIndex) barWidth = '100%';
                  else if (idx === currentIndex) barWidth = `${progress}%`;

                  return (
                    <div 
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(idx);
                        setProgress(0);
                      }}
                      className="h-1 flex-1 bg-white/40 rounded-full overflow-hidden cursor-pointer backdrop-blur-xs transition-all hover:h-1.5"
                    >
                      <div 
                        className="h-full bg-emerald-400 transition-all duration-75"
                        style={{ width: barWidth }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Header Row: Right has [ستۆری ✨], Left has [+ وێنە] & [⤢] */}
            <div className="flex items-center justify-between">
              
              {/* Right in RTL: Story Badge */}
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-black bg-slate-900/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  <span>ستۆری</span>
                </span>
              </div>

              {/* Left in RTL: [+ وێنە] and [Maximize] */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-2.5 py-1 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[10px] sm:text-xs flex items-center gap-1 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="زیادکردنی وێنەی نوێ"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>وێنە</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStoryModal();
                  }}
                  className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/20 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                  title="بینینی گەلەری بە گەورەیی"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>

          {/* Left/Right Click Nav Arrows on Hover */}
          {displayStories.length > 1 && (
            <div className="absolute inset-y-12 inset-x-0 z-10 flex items-center justify-between px-2 opacity-0 group-hover/story:opacity-100 transition-opacity pointer-events-none">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-full bg-slate-950/85 text-white hover:bg-emerald-500 hover:text-slate-950 border border-white/20 transition shadow-xl pointer-events-auto cursor-pointer"
                title="وێنەی پێشوو"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleNext}
                className="p-1.5 rounded-full bg-slate-950/85 text-white hover:bg-emerald-500 hover:text-slate-950 border border-white/20 transition shadow-xl pointer-events-auto cursor-pointer"
                title="وێنەی دواتر"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Bottom Bar: [دانانی وێنە 📷], [وێنەکان (X) 🗂️], and Delete Button [🗑️] */}
          <div className="relative z-20 p-2 sm:p-2.5 px-3 flex items-center justify-between gap-1.5 border-t border-white/10 bg-slate-950/90 backdrop-blur-md">
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-slate-950" />
                <span>دانانی وێنە</span>
              </button>

              <button
                type="button"
                onClick={onOpenStoryModal}
                className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-[10px] sm:text-xs font-bold flex items-center gap-1 border border-slate-700/80 transition-all active:scale-95 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>وێنەکان ({displayStories.length})</span>
              </button>
            </div>

            {/* Instant Delete Button */}
            <button
              type="button"
              onClick={handleDeleteCurrent}
              className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition-all hover:scale-105 active:scale-95 shadow cursor-pointer"
              title="سڕینەوەی ئەم وێنەیە لە ستۆری"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};
