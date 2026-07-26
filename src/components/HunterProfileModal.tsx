import React from 'react';
import { HunterProfile, Achievement, BaksoSpot } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { EXPRESSION_LIST } from '../data/expressions';
import { soundFx } from '../utils/audio';
import { X, Award, Shield, Trophy, Sparkles, Zap, ChevronRight, TrendingUp } from 'lucide-react';

interface HunterProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HunterProfile;
  onUpdateProfile: (updated: Partial<HunterProfile>) => void;
  spots: BaksoSpot[];
}

export const HunterProfileModal: React.FC<HunterProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  spots,
}) => {
  if (!isOpen) return null;

  // Title Generator helper based on level
  const getTitleForLevel = (lvl: number): string => {
    if (lvl <= 1) return 'Petualang Pentol Pemula';
    if (lvl === 2) return 'Pemburu Bakso Urat';
    if (lvl === 3) return 'Suhu Kuah Kaldu';
    if (lvl === 4) return 'Master Sambal Setan';
    if (lvl === 5) return 'Platinum Kaldu Legend';
    return 'Legenda Bakso Nusantara 👑';
  };

  // Calculate stats & XP dynamically with full null safety
  const safeSpots = spots || [];
  const safeProfile = profile || { level: 1, xp: 0, nextLevelXp: 100, name: 'Hunter', title: 'Pemburu Amatir' };
  const totalSpots = safeSpots.length;
  const perfectSpots = safeSpots.filter((s) => s && s.rating === 5).length;
  const spicySpots = safeSpots.filter((s) => s && (s.sambalLevel || 0) >= 4).length;
  const totalXp = safeProfile.xp || 0;
  const nextLevelXp = safeProfile.nextLevelXp || (safeProfile.level || 1) * 100 + 200;
  const xpNeeded = Math.max(0, nextLevelXp - totalXp);
  const xpProgressPercent = nextLevelXp > 0 ? Math.min(100, Math.max(0, Math.round((totalXp / nextLevelXp) * 100))) : 0;

  const currentLevelTitle = safeProfile.title || getTitleForLevel(safeProfile.level || 1);
  const nextLevelTitle = getTitleForLevel((safeProfile.level || 1) + 1);

  const achievements: Achievement[] = [
    {
      id: 'ach-1',
      title: 'Pemula Pentol',
      description: 'Catat minimal 1 tempat bakso.',
      icon: '🥣',
      badgeColor: '#10B981',
      unlocked: totalSpots >= 1,
      currentValue: Math.min(totalSpots, 1),
      targetValue: 1,
    },
    {
      id: 'ach-2',
      title: 'Sambal Iblis Slayer',
      description: 'Review 3 tempat bakso dengan tingkat kepedasan 4 atau 5.',
      icon: '🌶️',
      badgeColor: '#EF4444',
      unlocked: spicySpots >= 3,
      currentValue: Math.min(spicySpots, 3),
      targetValue: 3,
    },
    {
      id: 'ach-3',
      title: 'Master Bintang 5',
      description: 'Temukan & review 3 tempat bakso dengan rating 5 Mangkuk.',
      icon: '⭐',
      badgeColor: '#F59E0B',
      unlocked: perfectSpots >= 3,
      currentValue: Math.min(perfectSpots, 3),
      targetValue: 3,
    },
    {
      id: 'ach-4',
      title: 'Kolektor Pentol Legend',
      description: 'Catat total 10 tempat bakso di peta.',
      icon: '🏆',
      badgeColor: '#8B5CF6',
      unlocked: totalSpots >= 10,
      currentValue: Math.min(totalSpots, 10),
      targetValue: 10,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1e1726] border-4 border-amber-500 rounded-2xl shadow-2xl p-4 sm:p-6 text-amber-100 my-auto max-h-[92vh] overflow-y-auto pixel-border-gold">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-amber-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-pixel text-amber-300">
              STATUS KARAKTER HUNTER
            </h2>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-amber-950 hover:bg-red-950 border border-amber-700 text-amber-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Character Card Main Frame */}
        <div className="bg-[#281f33] p-4 rounded-xl border-2 border-amber-700/80 mb-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <CharacterAvatar expression={safeProfile.avatarExpression || 'star'} size="xl" />

            <div className="flex-1 text-center sm:text-left w-full min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <input
                  type="text"
                  value={safeProfile.name || 'Hunter'}
                  onChange={(e) => onUpdateProfile({ name: e.target.value })}
                  className="bg-transparent text-xl font-pixel text-amber-300 border-b border-dashed border-amber-600 focus:border-amber-300 outline-none w-full sm:max-w-[280px] truncate"
                />
                <span className="text-xs font-pixel text-[#ffd700] bg-[#800000] px-3 py-1 rounded-lg border-2 border-[#ffd700] shrink-0 font-bold shadow-md self-center sm:self-auto">
                  LEVEL {safeProfile.level || 1}
                </span>
              </div>

              <p className="text-xs font-pixel text-amber-200/90 mb-3 break-words">
                GELAR / TITLE: <strong className="text-[#ffd700]">{currentLevelTitle}</strong>
              </p>

              {/* Dynamic XP Progress Bar & Next Level Target */}
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center justify-between text-[11px] font-pixel text-amber-300">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Zap className="w-3.5 h-3.5 text-[#ffd700] fill-[#ffd700] animate-bounce" />
                    <span>EXPERIENCE (XP)</span>
                  </span>
                  <span className="text-[#ffd700] font-bold">
                    {totalXp} / {nextLevelXp} XP ({xpProgressPercent}%)
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="relative w-full h-4 bg-black/80 rounded-full border-2 border-amber-600/90 overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 via-[#ffd700] to-emerald-400 rounded-full transition-all duration-500 shadow-md relative"
                    style={{
                      width: `${xpProgressPercent}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  </div>
                </div>

                {/* Target & Remaining XP Banner */}
                <div className="bg-[#181320] p-2.5 rounded-xl border border-amber-800/90 mt-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-pixel">
                  <div className="flex items-center gap-2">
                    <span className="text-[#ffd700] bg-amber-950 px-2 py-0.5 rounded border border-amber-700 font-bold shrink-0">
                      TARGET NEXT TIER
                    </span>
                    <span className="text-amber-200">
                      Butuh <strong className="text-[#ffd700] text-xs font-bold">{xpNeeded} XP</strong> lagi untuk naik level!
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#281f33] px-2.5 py-1 rounded-lg border border-amber-500 text-[#ffd700] font-bold shadow-sm self-end sm:self-auto">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{nextLevelTitle}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Avatar Expression */}
          <div className="mt-4 pt-3 border-t border-amber-900/80">
            <span className="text-[10px] font-pixel text-amber-400 block mb-2">
              UBAH AVATAR HUNTER UTAMA:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {EXPRESSION_LIST.map((expr) => (
                <button
                  key={expr.id}
                  onClick={() => {
                    soundFx.playClick();
                    onUpdateProfile({ avatarExpression: expr.id });
                  }}
                  className={`p-1 rounded-xl border transition-all ${
                    (safeProfile.avatarExpression || 'star') === expr.id
                      ? 'bg-amber-950 border-amber-400 scale-110'
                      : 'bg-[#181320] border-amber-900 opacity-70 hover:opacity-100'
                  }`}
                >
                  <CharacterAvatar expression={expr.id} size="sm" showFrame={false} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Title Tier Roadmap */}
        <div className="bg-[#281f33] p-4 rounded-xl border border-amber-800 mb-5">
          <h3 className="text-xs font-pixel text-[#ffd700] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            ROADMAP PROGRESI GELAR & TIER
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-pixel">
            {[
              { lvl: 1, title: 'Petualang Pentol Pemula', icon: '🥣' },
              { lvl: 2, title: 'Pemburu Bakso Urat', icon: '🍡' },
              { lvl: 3, title: 'Suhu Kuah Kaldu', icon: '🍲' },
              { lvl: 4, title: 'Master Sambal Setan', icon: '🌶️' },
              { lvl: 5, title: 'Legenda Bakso Nusantara', icon: '👑' },
            ].map((tier) => {
              const isPassed = profile.level > tier.lvl;
              const isCurrent = profile.level === tier.lvl;
              const isNext = profile.level + 1 === tier.lvl;

              return (
                <div
                  key={tier.lvl}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all ${
                    isCurrent
                      ? 'bg-[#800000] border-[#ffd700] shadow-lg scale-105 z-10'
                      : isNext
                      ? 'bg-[#281f33] border-amber-500/80 animate-pulse'
                      : isPassed
                      ? 'bg-[#181320] border-emerald-600/60 opacity-80'
                      : 'bg-[#181320]/40 border-amber-950 opacity-50'
                  }`}
                >
                  <div className="text-xl mb-1">{tier.icon}</div>
                  <span className="text-[9px] text-amber-400 font-bold block mb-0.5">
                    LVL {tier.lvl}{tier.lvl === 5 ? '+' : ''}
                  </span>
                  <span className="text-[10px] text-amber-100 font-bold leading-tight line-clamp-2">
                    {tier.title}
                  </span>
                  <div className="mt-2">
                    {isCurrent && (
                      <span className="text-[8px] bg-[#ffd700] text-[#2d1b15] font-bold px-1.5 py-0.5 rounded border border-amber-900 block">
                        GELAR SAYA
                      </span>
                    )}
                    {isNext && (
                      <span className="text-[8px] bg-amber-950 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-700 block">
                        NEXT TIER
                      </span>
                    )}
                    {isPassed && (
                      <span className="text-[8px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 block">
                        TERLEWATI
                      </span>
                    )}
                    {!isCurrent && !isNext && !isPassed && (
                      <span className="text-[8px] text-amber-600 font-bold block">TERKUNCI</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hunter Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#181320] p-3 rounded-xl border border-amber-900 text-center">
            <span className="text-2xl mb-1 block">🍲</span>
            <span className="text-xl font-pixel text-amber-300 block">{totalSpots}</span>
            <span className="text-[10px] font-pixel text-amber-200/70">TOTAL KEDAI</span>
          </div>

          <div className="bg-[#181320] p-3 rounded-xl border border-amber-900 text-center">
            <span className="text-2xl mb-1 block">⭐</span>
            <span className="text-xl font-pixel text-amber-300 block">{perfectSpots}</span>
            <span className="text-[10px] font-pixel text-amber-200/70">BINTANG 5</span>
          </div>

          <div className="bg-[#181320] p-3 rounded-xl border border-amber-900 text-center">
            <span className="text-2xl mb-1 block">🌶️</span>
            <span className="text-xl font-pixel text-amber-300 block">{spicySpots}</span>
            <span className="text-[10px] font-pixel text-amber-200/70">PEDAS MELEDAK</span>
          </div>

          <div className="bg-[#181320] p-3 rounded-xl border border-amber-900 text-center">
            <span className="text-2xl mb-1 block">✨</span>
            <span className="text-xl font-pixel text-amber-300 block">{totalXp}</span>
            <span className="text-[10px] font-pixel text-amber-200/70">TOTAL XP</span>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-[#281f33] p-4 rounded-xl border border-amber-800">
          <h3 className="text-xs font-pixel text-amber-300 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            PENCAPAIAN / ACHIEVEMENTS ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  ach.unlocked
                    ? 'bg-[#181320] border-amber-500 shadow-md'
                    : 'bg-[#181320]/50 border-amber-900/40 opacity-60'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-amber-600 shadow-inner"
                  style={{ backgroundColor: ach.unlocked ? ach.badgeColor : '#3f3f46' }}
                >
                  {ach.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-amber-200 font-pixel truncate">
                      {ach.title}
                    </h4>
                    {ach.unlocked && (
                      <span className="text-[9px] font-pixel text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-700">
                        OPEN
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-200/70 font-sans-clean leading-tight mb-1">
                    {ach.description}
                  </p>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{
                        width: `${(ach.currentValue / ach.targetValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close button */}
        <div className="mt-5 text-right">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-pixel font-bold text-xs rounded-xl border-2 border-amber-200 shadow-md active:translate-y-0.5"
          >
            TUTUP STATUS
          </button>
        </div>
      </div>
    </div>
  );
};

