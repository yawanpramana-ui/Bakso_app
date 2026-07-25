import React from 'react';
import { BaksoSpot, HunterProfile } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { soundFx } from '../utils/audio';
import {
  MapPin,
  Plus,
  BookOpen,
  Shield,
  Award,
  Settings,
  Sparkles,
  Compass,
  Trophy,
  Flame,
  Star,
  ChevronRight,
  X,
  Play
} from 'lucide-react';

interface HomeScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HunterProfile;
  spots: BaksoSpot[];
  onOpenAddSpot: () => void;
  onOpenJournal: () => void;
  onOpenProfile: () => void;
  onOpenBadges: () => void;
  onOpenSettings: () => void;
  onSelectSpot: (spot: BaksoSpot) => void;
}

export const HomeScreenModal: React.FC<HomeScreenModalProps> = ({
  isOpen,
  onClose,
  profile,
  spots,
  onOpenAddSpot,
  onOpenJournal,
  onOpenProfile,
  onOpenBadges,
  onOpenSettings,
  onSelectSpot,
}) => {
  if (!isOpen) return null;

  const totalSpots = spots.length;
  const perfectSpots = spots.filter((s) => s.rating === 5).length;
  const spicySpots = spots.filter((s) => s.sambalLevel >= 4).length;

  // Recommended / Top 5-star spots
  const topSpots = spots.filter((s) => s.rating >= 4).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#1e1726] border-4 border-[#ffd700] rounded-3xl shadow-2xl p-4 sm:p-6 text-amber-100 my-auto max-h-[95vh] overflow-y-auto pixel-border-gold">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between border-b-2 border-amber-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="bg-[#ffd700] text-[#2d1b15] font-pixel text-[10px] px-2 py-0.5 rounded font-bold border border-amber-900">
              LAYAR UTAMA
            </span>
            <span className="text-xs font-arcade text-amber-300">
              Bakso Quest RPG Hub
            </span>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-950 hover:bg-red-950 border border-amber-700 text-amber-300 font-pixel text-xs flex items-center gap-1 transition-colors"
          >
            <span>Tutup & Peta</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Banner Section */}
        <div className="relative bg-gradient-to-r from-[#800000] via-[#5d4037] to-[#2d1b15] border-3 border-[#ffd700] p-4 sm:p-6 rounded-2xl shadow-xl mb-5 overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-8xl opacity-20 pointer-events-none select-none">
            🍲
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-[#ffd700] text-[#2d1b15] px-3 py-1 rounded-full font-pixel text-[10px] font-bold mb-2 shadow">
                <Sparkles className="w-3.5 h-3.5" /> PETUALANGAN KULINER NUSANTARA
              </div>
              <h1 className="text-2xl sm:text-3xl font-pixel text-[#ffd700] drop-shadow-[2px_2px_0px_#000] tracking-wider mb-2">
                BAKSO QUEST
              </h1>
              <p className="text-xs sm:text-sm font-arcade text-amber-100 max-w-lg leading-relaxed">
                Selamat datang di Layar Utama! Temukan, catat rating mangkuk, koleksi badge pencapaian, dan petakan tempat bakso favoritmu di seluruh peta Indonesia.
              </p>
            </div>

            {/* Direct Play / Start Explore Button */}
            <button
              onClick={() => {
                soundFx.playSuccess();
                onClose();
              }}
              className="px-6 py-3.5 btn-3d font-pixel text-sm rounded-2xl flex items-center gap-2 shadow-2xl hover:scale-105 transition-all shrink-0 active:translate-y-1"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>MULAI JELAJAH PETA</span>
            </button>
          </div>
        </div>

        {/* Hunter Status Summary Card */}
        <div className="bg-[#281f33] p-4 rounded-2xl border-2 border-amber-600/80 mb-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <CharacterAvatar expression={profile.avatarExpression} size="lg" />

            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h3 className="text-lg font-pixel text-[#ffd700]">
                  {profile.name}
                </h3>
                <span className="text-xs font-pixel text-amber-300 bg-amber-950 px-3 py-1 rounded-lg border border-amber-700 shrink-0">
                  LEVEL {profile.level} • {profile.title}
                </span>
              </div>

              {/* XP Progress */}
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-[10px] font-pixel text-amber-300">
                  <span>EXPERIENCE (XP)</span>
                  <span>{profile.xp} / {profile.nextLevelXp} XP</span>
                </div>
                <div className="w-full h-3 bg-black/60 rounded-full border border-amber-700 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 via-[#ffd700] to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min(100, (profile.xp / profile.nextLevelXp) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Action Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-3.5 bg-[#2d1b15] hover:bg-[#3d271e] rounded-2xl border-2 border-[#ffd700] text-left transition-all hover:scale-[1.02] group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-[#800000] border border-[#ffd700] flex items-center justify-center text-xl mb-2 group-hover:rotate-6 transition-transform">
              🗺️
            </div>
            <h4 className="font-pixel text-xs text-[#ffd700]">Jelajah Peta</h4>
            <p className="text-[10px] font-arcade text-amber-200/80 mt-0.5">
              Lihat peta Indonesia & penanda lokasi.
            </p>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
              onOpenAddSpot();
            }}
            className="p-3.5 bg-[#2d1b15] hover:bg-[#3d271e] rounded-2xl border-2 border-[#ffd700] text-left transition-all hover:scale-[1.02] group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-900 border border-emerald-400 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
              ➕
            </div>
            <h4 className="font-pixel text-xs text-emerald-300">Tambah Spot</h4>
            <p className="text-[10px] font-arcade text-amber-200/80 mt-0.5">
              Catat tempat bakso favorit baru.
            </p>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
              onOpenJournal();
            }}
            className="p-3.5 bg-[#2d1b15] hover:bg-[#3d271e] rounded-2xl border-2 border-[#ffd700] text-left transition-all hover:scale-[1.02] group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-900 border border-amber-400 flex items-center justify-center text-xl mb-2 group-hover:-rotate-6 transition-transform">
              📜
            </div>
            <h4 className="font-pixel text-xs text-amber-300">Jurnal Kedai</h4>
            <p className="text-[10px] font-arcade text-amber-200/80 mt-0.5">
              Daftar {totalSpots} kedai bakso yang tercatat.
            </p>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
              onOpenBadges();
            }}
            className="p-3.5 bg-[#2d1b15] hover:bg-[#3d271e] rounded-2xl border-2 border-[#ffd700] text-left transition-all hover:scale-[1.02] group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-400 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
              🎖️
            </div>
            <h4 className="font-pixel text-xs text-purple-300">System Badges</h4>
            <p className="text-[10px] font-arcade text-amber-200/80 mt-0.5">
              Lencana gelar & achievements.
            </p>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
              onOpenProfile();
            }}
            className="p-3.5 bg-[#2d1b15] hover:bg-[#3d271e] rounded-2xl border-2 border-[#ffd700] text-left transition-all hover:scale-[1.02] group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-400 flex items-center justify-center text-xl mb-2 group-hover:rotate-6 transition-transform">
              🛡️
            </div>
            <h4 className="font-pixel text-xs text-blue-300">Status Hunter</h4>
            <p className="text-[10px] font-arcade text-amber-200/80 mt-0.5">
              Ganti avatar, statistik, & title.
            </p>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
              onOpenSettings();
            }}
            className="p-3.5 bg-[#2d1b15] hover:bg-[#3d271e] rounded-2xl border-2 border-[#ffd700] text-left transition-all hover:scale-[1.02] group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-400 flex items-center justify-center text-xl mb-2 group-hover:rotate-12 transition-transform">
              ⚙️
            </div>
            <h4 className="font-pixel text-xs text-gray-200">Pengaturan</h4>
            <p className="text-[10px] font-arcade text-amber-200/80 mt-0.5">
              Navigasi kota, audio, & data backup.
            </p>
          </button>
        </div>

        {/* Quick Recommended Spots Highlight */}
        {topSpots.length > 0 && (
          <div className="bg-[#281f33] p-4 rounded-2xl border-2 border-amber-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-pixel text-xs text-[#ffd700] flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                REKOMENDASI BAKSO TERATAS KAMU
              </h3>
              <button
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                  onOpenJournal();
                }}
                className="text-[10px] font-pixel text-amber-300 hover:underline flex items-center gap-1"
              >
                Lihat Semua <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topSpots.map((spot) => (
                <div
                  key={spot.id}
                  onClick={() => {
                    soundFx.playClick();
                    onSelectSpot(spot);
                    onClose();
                  }}
                  className="bg-[#181320] p-3 rounded-xl border border-amber-700/80 hover:border-[#ffd700] transition-all cursor-pointer group shadow"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-pixel text-xs text-amber-200 truncate max-w-[140px]">
                      {spot.name}
                    </h4>
                    <span className="text-xs text-[#ffd700]">{'⭐'.repeat(spot.rating)}</span>
                  </div>
                  <p className="text-[10px] font-arcade text-amber-300/80 truncate mb-2">
                    📍 {spot.address}
                  </p>
                  <div className="flex items-center justify-between text-[9px] font-pixel text-amber-400 pt-1 border-t border-amber-900">
                    <span>{spot.priceRange}</span>
                    <span className="text-emerald-400 group-hover:translate-x-1 transition-transform">
                      Lihat Peta 🗺️
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-6 pt-4 border-t border-amber-800/80 flex items-center justify-between flex-col sm:flex-row gap-3">
          <p className="text-[11px] font-arcade text-amber-200/70 text-center sm:text-left">
            💡 Tips: Tekan tombol &quot;BAKSO QUEST&quot; di bagian kiri atas peta untuk kembali ke Layar Utama kapan saja!
          </p>
          <button
            onClick={() => {
              soundFx.playSuccess();
              onClose();
            }}
            className="px-6 py-2.5 bg-[#800000] hover:bg-red-900 text-[#ffd700] font-pixel font-bold text-xs rounded-xl border-2 border-[#ffd700] shadow-md active:translate-y-0.5 whitespace-nowrap"
          >
            MASUK KE PETA GAME
          </button>
        </div>

      </div>
    </div>
  );
};
