import React, { useEffect } from 'react';
import { CharacterAvatar } from './CharacterAvatar';
import { soundFx } from '../utils/audio';
import { Trophy, Sparkles, Zap, Award, Flame, ChevronRight, Star } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  newTitle: string;
  profileName: string;
  avatarExpression?: string;
  onOpenProfile?: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  newLevel,
  newTitle,
  profileName,
  avatarExpression = 'happy',
  onOpenProfile,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundFx.playLevelUp();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const previousLevel = Math.max(1, newLevel - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Background Pixel Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/10 text-amber-300 text-2xl animate-bounce">✨</div>
        <div className="absolute top-1/3 right-1/8 text-yellow-400 text-3xl animate-pulse">🌟</div>
        <div className="absolute bottom-1/4 left-1/5 text-amber-200 text-xl animate-ping">⭐</div>
        <div className="absolute bottom-1/3 right-1/4 text-emerald-400 text-2xl animate-bounce">✨</div>
        <div className="absolute top-1/6 right-1/3 text-yellow-300 text-3xl animate-spin">❇️</div>
      </div>

      <div className="relative w-full max-w-md bg-[#1e1726] border-4 border-[#ffd700] rounded-2xl p-6 text-amber-100 shadow-[0_0_50px_rgba(255,215,0,0.4)] font-pixel text-center space-y-5 pixel-border-gold overflow-hidden">
        {/* Top Header Banner */}
        <div className="relative inline-block bg-[#800000] border-2 border-[#ffd700] px-6 py-2 rounded-xl text-[#ffd700] shadow-lg transform -rotate-1 scale-105">
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-bold tracking-wider">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            <span>🎉 LEVEL UP! 🎉</span>
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          </div>
        </div>

        {/* Level Banner Transformation */}
        <div className="flex items-center justify-center gap-3 bg-[#181320] p-3 rounded-xl border border-amber-800">
          <div className="bg-amber-950/80 px-3 py-1.5 rounded-lg border border-amber-700 text-amber-400 text-xs font-bold opacity-75">
            LVL {previousLevel}
          </div>
          <ChevronRight className="w-5 h-5 text-[#ffd700] animate-pulse" />
          <div className="bg-[#800000] px-4 py-2 rounded-xl border-2 border-[#ffd700] text-[#ffd700] text-base font-bold shadow-md scale-110 flex items-center gap-1.5">
            <Zap className="w-4 h-4 fill-[#ffd700]" />
            <span>LVL {newLevel}</span>
          </div>
        </div>

        {/* Character Avatar & Hunter Name */}
        <div className="flex flex-col items-center justify-center gap-2 py-1">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 via-[#ffd700] to-emerald-400 rounded-full blur-sm animate-pulse opacity-75" />
            <div className="relative bg-[#281f33] p-3 rounded-2xl border-2 border-[#ffd700]">
              <CharacterAvatar expression={avatarExpression} size="lg" />
            </div>
            <div className="absolute -top-2 -right-2 bg-[#ffd700] text-[#800000] rounded-full p-1 border-2 border-[#800000] shadow">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xs text-amber-200/90 font-bold tracking-wide mt-1 break-words max-w-full">
            PEMBURU BAKSO: <span className="text-white break-words">{profileName}</span>
          </span>
        </div>

        {/* Unlocked New Title Box */}
        <div className="bg-[#281f33] p-4 rounded-xl border-2 border-[#ffd700] shadow-inner space-y-2">
          <div className="text-[10px] text-amber-400 uppercase tracking-widest font-bold flex items-center justify-center gap-1">
            <Award className="w-3.5 h-3.5 text-[#ffd700]" />
            <span>GELAR DIBUKA / UNLOCKED TITLE</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-[#ffd700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex flex-wrap items-center justify-center gap-2 break-words">
            <Star className="w-5 h-5 text-amber-300 fill-amber-300 animate-bounce shrink-0" />
            <span className="break-words max-w-full">{newTitle}</span>
            <Star className="w-5 h-5 text-amber-300 fill-amber-300 animate-bounce shrink-0" />
          </div>
        </div>

        {/* Unlocked Benefits & Stats */}
        <div className="bg-[#181320] p-3 rounded-xl border border-amber-900 text-left space-y-1.5 text-[11px]">
          <div className="text-amber-400 font-bold text-[10px] border-b border-amber-900/80 pb-1 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>PERKS & BONUS LEVEL UP:</span>
          </div>
          <ul className="space-y-1 text-amber-200">
            <li className="flex items-center gap-2">
              <span className="text-[#ffd700]">✓</span> Cap XP Next Tier diperluas (+300 XP)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#ffd700]">✓</span> Title Badge Emas aktif di Profil Hunter
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#ffd700]">✓</span> Reputasi Kuliner Kuah Kaldu Meningkat!
            </li>
          </ul>
        </div>

        {/* Quote */}
        <p className="text-[10px] text-amber-300/80 italic bg-[#281f33]/60 p-2 rounded-lg border border-amber-900">
          "Aroma kuah kaldu makin pekat, lidah makin kebal sambal. Perburuan bakso nusantara terus berlanjut!"
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          {onOpenProfile && (
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
                onOpenProfile();
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-600 rounded-xl text-xs font-pixel active:translate-y-0.5 flex items-center justify-center gap-1.5"
            >
              <Award className="w-4 h-4 text-[#ffd700]" />
              <span>Cek Profil & Tier</span>
            </button>
          )}

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-full sm:w-auto flex-1 px-5 py-2.5 bg-[#800000] hover:bg-red-800 text-[#ffd700] border-2 border-[#ffd700] rounded-xl text-xs font-pixel font-bold shadow-lg active:translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span>MANTAP! LANJUTKAN</span>
            <span>🍢</span>
          </button>
        </div>
      </div>
    </div>
  );
};
