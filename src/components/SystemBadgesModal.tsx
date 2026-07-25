import React, { useState } from 'react';
import { BaksoSpot, HunterProfile, Achievement } from '../types';
import { soundFx } from '../utils/audio';
import { X, Trophy, Award, Shield, Star, Flame, Sparkles, CheckCircle2, Lock, Medal } from 'lucide-react';

interface SystemBadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HunterProfile;
  spots: BaksoSpot[];
}

export interface SystemBadge {
  id: string;
  name: string;
  category: 'rank' | 'achievement' | 'special';
  description: string;
  icon: string;
  color: string;
  reqLevel?: number;
  unlocked: boolean;
  progressText: string;
}

export const SystemBadgesModal: React.FC<SystemBadgesModalProps> = ({
  isOpen,
  onClose,
  profile,
  spots,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'rank' | 'achievement'>('all');

  if (!isOpen) return null;

  // Stats calculation
  const totalSpots = spots.length;
  const perfectSpots = spots.filter((s) => s.rating === 5).length;
  const spicySpots = spots.filter((s) => s.sambalLevel >= 4).length;
  const detailedReviews = spots.filter((s) => s.review && s.review.length >= 25).length;
  const uniqueTags = new Set(spots.flatMap((s) => s.tags || [])).size;

  // System Rank Badges (Tier System)
  const systemRankBadges: SystemBadge[] = [
    {
      id: 'rank-1',
      name: 'Pentol Bronze Hunter',
      category: 'rank',
      description: 'Gelar awal untuk penjelajah bakso pemula (Level 1+).',
      icon: '🥉',
      color: '#CD7F32',
      reqLevel: 1,
      unlocked: profile.level >= 1,
      progressText: `Level ${profile.level} / Req Lv 1`,
    },
    {
      id: 'rank-2',
      name: 'Silver Mangkok Sejati',
      category: 'rank',
      description: 'Gelar Hunter berpengalaman yang telah mencicipi banyak kuah (Level 3+).',
      icon: '🥈',
      color: '#C0C0C0',
      reqLevel: 3,
      unlocked: profile.level >= 3,
      progressText: `Level ${profile.level} / Req Lv 3`,
    },
    {
      id: 'rank-3',
      name: 'Gold Sambal Setan',
      category: 'rank',
      description: 'Master ketahanan pedas dan pencari rasa autentik (Level 5+).',
      icon: '🥇',
      color: '#FFD700',
      reqLevel: 5,
      unlocked: profile.level >= 5,
      progressText: `Level ${profile.level} / Req Lv 5`,
    },
    {
      id: 'rank-4',
      name: 'Platinum Kaldu Legend',
      category: 'rank',
      description: 'Penguasa cita rasa kuah gurih berkaldu melimpah (Level 8+).',
      icon: '💎',
      color: '#E5E4E2',
      reqLevel: 8,
      unlocked: profile.level >= 8,
      progressText: `Level ${profile.level} / Req Lv 8`,
    },
    {
      id: 'rank-5',
      name: 'Godlike Kuliner Master',
      category: 'rank',
      description: 'Legenda tertinggi pemburu bakso Nusantara (Level 10+).',
      icon: '👑',
      color: '#A855F7',
      reqLevel: 10,
      unlocked: profile.level >= 10,
      progressText: `Level ${profile.level} / Req Lv 10`,
    },
  ];

  // Achievement System Badges
  const achievementsList: Achievement[] = [
    {
      id: 'ach-1',
      title: 'Pemula Pentol',
      description: 'Catat minimal 1 tempat bakso di peta.',
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
    {
      id: 'ach-5',
      title: 'Kritikus Kuliner Handal',
      description: 'Tulis review lengkap mendalam (25+ karakter) untuk 3 kedai.',
      icon: '📜',
      badgeColor: '#3B82F6',
      unlocked: detailedReviews >= 3,
      currentValue: Math.min(detailedReviews, 3),
      targetValue: 3,
    },
    {
      id: 'ach-6',
      title: 'Eksplor Varian Bakso',
      description: 'Coba 3 variasi tag berbeda (misal: Urat, Beranak, Malang, dll).',
      icon: '🍡',
      badgeColor: '#EC4899',
      unlocked: uniqueTags >= 3,
      currentValue: Math.min(uniqueTags, 3),
      targetValue: 3,
    },
  ];

  const totalUnlockedRank = systemRankBadges.filter((b) => b.unlocked).length;
  const totalUnlockedAch = achievementsList.filter((a) => a.unlocked).length;
  const totalUnlockedAll = totalUnlockedRank + totalUnlockedAch;
  const totalAllBadges = systemRankBadges.length + achievementsList.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#1e1726] border-4 border-[#ffd700] rounded-2xl shadow-2xl p-4 sm:p-6 text-amber-100 my-auto max-h-[92vh] overflow-y-auto pixel-border-gold">
        
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b-2 border-amber-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffd700] border-2 border-amber-900 flex items-center justify-center text-2xl shadow-md">
              🎖️
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-pixel text-[#ffd700] tracking-wide">
                SYSTEM BADGE & ACHIEVEMENTS
              </h2>
              <p className="text-xs font-arcade text-amber-200">
                Pencapaian Hunter & Lencana Gelar Kuliner
              </p>
            </div>
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

        {/* Unlocked Summary Card */}
        <div className="bg-[#281f33] p-4 rounded-xl border-2 border-amber-700/80 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#ffd700] animate-pulse" />
            <div>
              <span className="text-[10px] font-pixel text-amber-400 block">TOTAL BADGE TERBUKA:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-pixel text-[#ffd700]">
                  {totalUnlockedAll} / {totalAllBadges}
                </span>
                <span className="text-xs font-pixel text-amber-300">
                  ({Math.round((totalUnlockedAll / totalAllBadges) * 100)}% Terbuka)
                </span>
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="w-full sm:w-64 space-y-1">
            <div className="flex justify-between text-[10px] font-pixel text-amber-300">
              <span>PROGRESS PENCAPAIAN</span>
              <span>{totalUnlockedAll} TERBUKA</span>
            </div>
            <div className="w-full h-3.5 bg-black/60 rounded-full border border-amber-700 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-[#ffd700] to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${(totalUnlockedAll / totalAllBadges) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('all');
            }}
            className={`px-3.5 py-2 rounded-xl font-pixel text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[#ffd700] text-[#2d1b15] font-bold border-2 border-white shadow-md'
                : 'bg-[#32233f] hover:bg-[#432f54] text-amber-200 border border-amber-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Semua ({totalAllBadges})</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('rank');
            }}
            className={`px-3.5 py-2 rounded-xl font-pixel text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'rank'
                ? 'bg-[#ffd700] text-[#2d1b15] font-bold border-2 border-white shadow-md'
                : 'bg-[#32233f] hover:bg-[#432f54] text-amber-200 border border-amber-700'
            }`}
          >
            <Medal className="w-4 h-4" />
            <span>System Rank ({systemRankBadges.length})</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('achievement');
            }}
            className={`px-3.5 py-2 rounded-xl font-pixel text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'achievement'
                ? 'bg-[#ffd700] text-[#2d1b15] font-bold border-2 border-white shadow-md'
                : 'bg-[#32233f] hover:bg-[#432f54] text-amber-200 border border-amber-700'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Achievements ({achievementsList.length})</span>
          </button>
        </div>

        {/* SECTION 1: SYSTEM RANK BADGES */}
        {(activeTab === 'all' || activeTab === 'rank') && (
          <div className="mb-6">
            <h3 className="text-xs font-pixel text-[#ffd700] mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              LENCANA GELAR HUNTER (SYSTEM RANK)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {systemRankBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    badge.unlocked
                      ? 'bg-[#281f33] border-amber-400 shadow-md'
                      : 'bg-[#181320]/60 border-amber-900/40 opacity-60'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border-2 border-amber-500 shadow-inner"
                    style={{ backgroundColor: badge.unlocked ? badge.color : '#2d1b15' }}
                  >
                    {badge.unlocked ? badge.icon : <Lock className="w-5 h-5 text-amber-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold font-pixel text-amber-200 truncate">
                        {badge.name}
                      </h4>
                      {badge.unlocked ? (
                        <span className="text-[9px] font-pixel text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> AKTIFF
                        </span>
                      ) : (
                        <span className="text-[9px] font-pixel text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                          REQ LV {badge.reqLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-200/80 font-sans-clean leading-tight mt-0.5">
                      {badge.description}
                    </p>
                    <span className="text-[10px] font-pixel text-amber-400/90 block mt-1">
                      {badge.progressText}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: ACHIEVEMENTS BADGES */}
        {(activeTab === 'all' || activeTab === 'achievement') && (
          <div>
            <h3 className="text-xs font-pixel text-[#ffd700] mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              PENCAPAIAN TUGAS (ACHIEVEMENTS)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievementsList.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    ach.unlocked
                      ? 'bg-[#281f33] border-emerald-400 shadow-md'
                      : 'bg-[#181320]/60 border-amber-900/40 opacity-60'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border-2 border-amber-500 shadow-inner"
                    style={{ backgroundColor: ach.unlocked ? ach.badgeColor : '#2d1b15' }}
                  >
                    {ach.unlocked ? ach.icon : <Lock className="w-5 h-5 text-amber-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold font-pixel text-amber-200 truncate">
                        {ach.title}
                      </h4>
                      {ach.unlocked ? (
                        <span className="text-[9px] font-pixel text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-700">
                          TERBUKA
                        </span>
                      ) : (
                        <span className="text-[9px] font-pixel text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                          {ach.currentValue}/{ach.targetValue}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-200/80 font-sans-clean leading-tight my-1">
                      {ach.description}
                    </p>
                    <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-amber-900">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                        style={{ width: `${(ach.currentValue / ach.targetValue) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-amber-800/80 flex justify-end">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-pixel font-bold text-xs rounded-xl border-2 border-amber-200 shadow-md active:translate-y-0.5"
          >
            TUTUP LENCANA
          </button>
        </div>
      </div>
    </div>
  );
};
