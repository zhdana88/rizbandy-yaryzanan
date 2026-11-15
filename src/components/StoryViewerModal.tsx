import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  RotateCcw, 
  Sparkles, 
  Image as ImageIcon, 
  Check, 
  Camera, 
  ExternalLink,
  Shield,
  Trophy,
  Flame,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import { ThemeConfig } from '../types';

import { DEFAULT_STORY_WALLPAPERS } from './StoryCarouselWidget';

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig: ThemeConfig;
  setThemeConfig: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  totalPlayersCount: number;
}

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
          const maxDim = 1280; // keep sharp yet lightweight
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
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
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

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  onClose,
  themeConfig,
  setThemeConfig,
  totalPlayersCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Get stories list (fallback to themeConfig.logoUrl or DEFAULT_STORY_WALLPAPERS)
  const validSavedStories = themeConfig.stories && themeConfig.stories.length > 0
    ? themeConfig.stories.filter(s => s && s.trim() !== '' && s !== '/logo.jpg')
    : [];

  const stories: string[] = validSavedStories.length > 0
    ? validSavedStories
    : (themeConfig.logoUrl && themeConfig.logoUrl !== '/logo.jpg' ? [themeConfig.logoUrl] : DEFAULT_STORY_WALLPAPERS);

  useEffect(() => {
    if (activeStoryIndex >= stories.length) {
      setActiveStoryIndex(0);
    }
  }, [stories.length, activeStoryIndex]);

  // Auto-advance in modal
  useEffect(() => {
    if (!isOpen || !isPlaying || stories.length <= 1) return;
    const timer = setInterval(() => {
      setActiveStoryIndex((prev) => (prev + 1) % stories.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isOpen, isPlaying, stories.length]);

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

  const currentImage = stories[activeStoryIndex] || '/logo.jpg';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const optimizedImage = await processAndCompressImage(file);
          newImages.push(optimizedImage);
        }
      }

      if (newImages.length > 0) {
        setThemeConfig((prev) => {
          const currentList = prev.stories && prev.stories.length > 0
            ? [...prev.stories]
            : [prev.logoUrl || '/logo.jpg'];
          const updated = [...currentList, ...newImages];
          return {
            ...prev,
            stories: updated,
            logoUrl: updated[0] || prev.logoUrl,
          };
        });
        setActiveStoryIndex(stories.length);
        setFeedbackMsg(`${newImages.length} وێنەی نوێ بۆ ستۆری زیادکرا! ✅`);
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('کێشەیەک لە بارکردنی وێنەکان ڕوویدا');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    const newUrl = urlInput.trim();
    setThemeConfig((prev) => {
      const currentList = prev.stories && prev.stories.length > 0
        ? [...prev.stories]
        : [prev.logoUrl || '/logo.jpg'];
      return {
        ...prev,
        stories: [...currentList, newUrl],
      };
    });
    setUrlInput('');
    setIsUrlMode(false);
    setFeedbackMsg('لینک و وێنەکە بە سەرکەوتوویی زیادکرا! ✅');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDeleteStory = (indexToDelete: number) => {
    const updated = stories.filter((_, idx) => idx !== indexToDelete);
    const finalStories = updated.length > 0 ? updated : DEFAULT_STORY_WALLPAPERS;
    setThemeConfig((prev) => ({
      ...prev,
      stories: finalStories,
      logoUrl: finalStories[0] || DEFAULT_STORY_WALLPAPERS[0],
    }));
    setActiveStoryIndex((prev) => {
      if (prev >= finalStories.length) return Math.max(0, finalStories.length - 1);
      return prev;
    });
    setFeedbackMsg('وێنەکە لە ستۆری سڕایەوە 🗑️');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleResetToDefault = () => {
    setThemeConfig((prev) => ({
      ...prev,
      stories: DEFAULT_STORY_WALLPAPERS,
      logoUrl: DEFAULT_STORY_WALLPAPERS[0],
    }));
    setActiveStoryIndex(0);
    setFeedbackMsg('گەڕێندرایەوە بۆ وێنەی بنەڕەت 🔄');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `story-image-${activeStoryIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-6 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Hidden File Input (supports multiple files) */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          multiple
          className="hidden" 
          onChange={handleFileUpload} 
        />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              ستۆری و گەلەری وێنەکانی خول ({stories.length} وێنە)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                isPlaying ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={isPlaying ? 'وەستاندنی ئۆتۆپلەی' : 'کارپێکردنی ئۆتۆپلەی'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'وەستاندن' : 'پەخشکردن'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 bg-slate-950/60 border border-slate-800 transition flex items-center gap-1 text-xs font-bold"
            >
              <X className="w-4 h-4" />
              <span>داخستن</span>
            </button>
          </div>
        </div>

        {/* Story Viewer Centerpiece */}
        <div className="relative flex flex-col items-center justify-center my-2">
          
          {/* Segmented Story Indicators */}
          {stories.length > 1 && (
            <div className="flex items-center gap-1 w-full max-w-md mb-3 px-2">
              {stories.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveStoryIndex(idx)}
                  className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${
                    idx === activeStoryIndex ? 'bg-emerald-400 scale-y-125' : 'bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Large Glowing Story Frame */}
          <div className="relative group p-1 rounded-3xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-teal-300 shadow-2xl shadow-emerald-500/20">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-[22px] overflow-hidden bg-slate-950 flex items-center justify-center border-4 border-slate-900">
              <img 
                src={currentImage} 
                alt={`Tournament Story ${activeStoryIndex + 1}`} 
                className="w-full h-full object-contain transition-all duration-500"
                referrerPolicy="no-referrer"
              />

              {/* Prev / Next Chevrons on hover */}
              {stories.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveStoryIndex((prev) => (prev - 1 + stories.length) % stories.length);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/80 text-white hover:bg-emerald-500 hover:text-slate-950 border border-white/20 transition shadow-lg"
                    title="وێنەی پێشوو"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveStoryIndex((prev) => (prev + 1) % stories.length);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/80 text-white hover:bg-emerald-500 hover:text-slate-950 border border-white/20 transition shadow-lg"
                    title="وێنەی دواتر"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Top Right Live Badge */}
            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[11px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-slate-900 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 fill-slate-950" />
              <span>Story {activeStoryIndex + 1}/{stories.length}</span>
            </div>
          </div>

          {/* Thumbnails Row (to quickly click & manage all pictures) */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-full p-1.5 pb-2">
            {stories.map((imgUrl, idx) => (
              <div 
                key={idx}
                className="relative group/thumb shrink-0 cursor-pointer"
                onClick={() => setActiveStoryIndex(idx)}
              >
                <div className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                  idx === activeStoryIndex ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}>
                  <img src={imgUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>

                {/* Delete button on thumb */}
                {stories.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStory(idx);
                    }}
                    className="absolute -top-1.5 -left-1.5 p-0.5 rounded-full bg-rose-600 text-white opacity-0 group-hover/thumb:opacity-100 transition shadow hover:scale-110"
                    title="سڕینەوەی ئەم وێنەیە"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}

            {/* Add more button in thumbnails row */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-400 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 flex flex-col items-center justify-center gap-0.5 transition shrink-0"
              title="زیادکردنی وێنەی تر"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[8px] font-bold">زیادکردن</span>
            </button>
          </div>

          {/* Feedback Toast */}
          {feedbackMsg && (
            <div className="mt-2 px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{feedbackMsg}</span>
            </div>
          )}

        </div>

        {/* Action Controls */}
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* 1. Upload from Computer / Phone Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>زیادکردنی وێنە لە مۆبایل / کۆمپیوتەر</span>
            </button>

            {/* 2. Download Image Button */}
            <button
              onClick={handleDownloadImage}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition hover:scale-[1.02] active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>داگرتنی وێنەی ئەم ستۆرییە (HD)</span>
            </button>

          </div>

          {/* URL Mode Toggle & Input */}
          {isUrlMode ? (
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-700">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="لینکی وێنەکە (URL) لێرە دابنێ..."
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={handleApplyUrl}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shrink-0"
              >
                زیادکردن
              </button>
              <button
                onClick={() => setIsUrlMode(false)}
                className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
              >
                پاشگەزبوونەوە
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setIsUrlMode(true)}
                className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>زیادکردنی وێنە بەستەر (Image URL)</span>
              </button>

              <button
                onClick={handleResetToDefault}
                className="text-[11px] font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
                title="گەڕاندنەوە بۆ لۆگۆی سەرەکی"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>گەڕاندنەوە بۆ لۆگۆی بنەڕەت</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
