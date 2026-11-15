import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UserPlus, 
  Save, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  Camera, 
  Link as LinkIcon, 
  Sparkles,
  Check
} from 'lucide-react';
import { Player, ComputedPlayerStats } from '../types';

interface PlayerEditModalProps {
  playerToEdit: ComputedPlayerStats | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (playerData: Partial<Player>) => void;
  onDelete?: (id: string, name: string) => void;
}

export const PlayerEditModal: React.FC<PlayerEditModalProps> = ({
  playerToEdit,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [wins, setWins] = useState(0);
  const [draws, setDraws] = useState(0);
  const [losses, setLosses] = useState(0);
  const [position, setPosition] = useState<'forward' | 'midfield' | 'defender' | 'goalkeeper'>('midfield');
  const [status, setStatus] = useState<'active' | 'injured' | 'absent'>('active');
  const [goals, setGoals] = useState(0);
  const [assists, setAssists] = useState(0);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (playerToEdit) {
      setName(playerToEdit.name || '');
      setAvatar(playerToEdit.avatar || '');
      setWins(playerToEdit.wins || 0);
      setDraws(playerToEdit.draws || 0);
      setLosses(playerToEdit.losses || 0);
      setPosition(playerToEdit.position || 'midfield');
      setStatus(playerToEdit.status || 'active');
      setGoals(playerToEdit.goals || 0);
      setAssists(playerToEdit.assists || 0);
      setShowUrlInput(Boolean(playerToEdit.avatar && playerToEdit.avatar.startsWith('http')));
    } else {
      setName('');
      setAvatar('');
      setWins(0);
      setDraws(0);
      setLosses(0);
      setPosition('midfield');
      setStatus('active');
      setGoals(0);
      setAssists(0);
      setShowUrlInput(false);
    }
    setError('');
    setIsDragOver(false);
  }, [playerToEdit, isOpen]);

  if (!isOpen) return null;

  // Process & compress uploaded image file into lightweight base64 Data URL
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('تکایە تەنها فایلی وێنە هەڵبژێرە (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize to maximum 256x256 for optimal performance & compact storage
        const canvas = document.createElement('canvas');
        const MAX_DIM = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(compressedDataUrl);
          setError('');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('تکایە ناوی یاریزان بنووسە');
      return;
    }

    onSave({
      id: playerToEdit ? playerToEdit.id : undefined,
      name: name.trim(),
      avatar: avatar.trim() || undefined,
      wins: Number(wins) || 0,
      draws: Number(draws) || 0,
      losses: Number(losses) || 0,
      position,
      status,
      goals: Number(goals) || 0,
      assists: Number(assists) || 0,
    });

    onClose();
  };

  // Close on Escape key
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl my-6 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Actions */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 transition active:scale-95"
            title="گەڕانەوە بۆ پەڕەی سەرەکی"
          >
            <span>گەڕانەوە بۆ سەرەکی ↩️</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center gap-1 text-xs font-bold"
          >
            <X className="w-4 h-4" />
            <span>داخستن</span>
          </button>
        </div>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
            {playerToEdit ? <Save className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {playerToEdit ? 'دەستکاریکردنی زانیاری یاریزان' : 'زیادکردنی یاریزانی نوێ'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              زانیارییەکان و وێنەی یاریزان بنووسە یان باربکە
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* PHOTO UPLOAD & PREVIEW SECTION */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <label className="block text-slate-900 font-bold mb-2.5">
              وێنەی یاریزان (Player Photo):
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              
              {/* Circular Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500 bg-white shadow-sm flex items-center justify-center">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 text-[11px] font-bold">
                      <Camera className="w-6 h-6 mb-1 text-slate-400" />
                      <span>{name ? name.slice(0, 2) : 'بێ وێنە'}</span>
                    </div>
                  )}
                </div>

                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow transition"
                    title="سڕینەوەی وێنە"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Upload Drop Zone & Actions */}
              <div className="flex-1 w-full space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div 
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                    isDragOver 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/40'
                  }`}
                >
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <span className="text-slate-900 font-bold text-[11px]">
                    کلیک بکە بۆ هەڵبژاردنی وێنە لە مۆبایل یان کۆمپیوتەر
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    یان ڕایکێشە ئێرە (Drag & Drop) • پشتگیری هەموو جۆرەکانی وێنە دەکات
                  </span>
                </div>

                {/* Toggle URL input */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium flex items-center gap-1 transition"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{showUrlInput ? 'داخستنی لینکی وێنە' : 'یان دانانی بەستەر (Image URL)...'}</span>
                  </button>

                  {avatar && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> وێنە دیاری کرا
                    </span>
                  )}
                </div>

                {showUrlInput && (
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://... لینکی وێنەی سەر ئینتەرنێت"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>

            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              ناوی یاریزان:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نموونە: ئاراس، هێمن، ڕێبین..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm font-bold focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          {/* Position & Status */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                پێگەی یاریکردن:
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="forward">هێرشبەر (Forward)</option>
                <option value="midfield">ناوەڕاست (Midfielder)</option>
                <option value="defender">بەرگریکار (Defender)</option>
                <option value="goalkeeper">گۆڵپارێز (Goalkeeper)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                دۆخی یاریزان:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="active">چالاک (Active)</option>
                <option value="injured">🩹 تووشبوو بە پێکان (Injured)</option>
                <option value="absent">ئامادەنەبوو (Absent)</option>
              </select>
            </div>
          </div>

          {/* Results: Wins, Draws, Losses */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-emerald-800 font-bold mb-1">
                بردنەوە (Wins):
              </label>
              <input
                type="number"
                min="0"
                value={wins}
                onChange={(e) => setWins(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3 py-2 text-center text-sm font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                یەکسانبوون (Draws):
              </label>
              <input
                type="number"
                min="0"
                value={draws}
                onChange={(e) => setDraws(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-center text-sm font-bold text-slate-800 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-rose-800 font-bold mb-1">
                دۆڕان (Losses):
              </label>
              <input
                type="number"
                min="0"
                value={losses}
                onChange={(e) => setLosses(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-rose-50/50 border border-rose-300 rounded-xl px-3 py-2 text-center text-sm font-bold text-rose-800 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Extra Optional Stats */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-slate-600 font-bold mb-1">
                گۆڵ (ئارەزوومەندانە):
              </label>
              <input
                type="number"
                min="0"
                value={goals}
                onChange={(e) => setGoals(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">
                ئاسیست (ئارەزوومەندانە):
              </label>
              <input
                type="number"
                min="0"
                value={assists}
                onChange={(e) => setAssists(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>پاشەکەوتکردن (Save Player)</span>
            </button>

            {playerToEdit && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(playerToEdit.id, playerToEdit.name);
                }}
                className="px-4 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200 flex items-center gap-1 cursor-pointer"
                title="سڕینەوەی ئەم یاریزانە"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">سڕینەوە</span>
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
            >
              پاشگەزبوونەوە
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
