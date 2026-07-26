import React, { useState } from 'react';
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
  Play,
  Maximize2,
  Minimize2,
  Monitor,
  LogIn,
  UserCheck,
  Users,
  ShieldAlert,
  Crown
} from 'lucide-react';

interface HomeScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HunterProfile;
  spots: BaksoSpot[];
  currentUser: { uid: string; isAnonymous: boolean; email?: string | null; displayName?: string | null } | null;
  onLoginGoogle: () => void;
  onOpenMultiplayer: () => void;
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
  currentUser,
  onLoginGoogle,
  onOpenMultiplayer,
  onOpenAddSpot,
  onOpenJournal,
  onOpenProfile,
  onOpenBadges,
  onOpenSettings,
  onSelectSpot,
}) => {
  const [isFullScreenView, setIsFullScreenView] = useState<boolean>(true);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalSpots = spots.length;
  const topSpots = spots.filter((s) => s.rating >= 4).slice(0, 3);

  const toggleBrowserFullscreen = () => {
    soundFx.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsBrowserFullscreen(true);
      }).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsBrowserFullscreen(false);
        }).catch(() => {});
      }
    }
  };

  const isGoogleConnected = currentUser && !currentUser.isAnonymous;

  return (
    <div
      className={
        isFullScreenView
          ? 'fixed inset-0 z-50 bg-[#140f1a] overflow-y-auto p-3 sm:p-6 text-amber-100 font-pixel animate-fade-in'
          : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto font-pixel animate-fade-in'
      }
    >
      {/* Background Retro Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#800000_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none" />

      <div
        className={
          isFullScreenView
            ? 'relative w-full max-w-5xl mx-auto space-y-5 pb-12 z-10'
            : 'relative w-full max-w-4xl bg-[#1e1726] border-4 border-[#ffd700] rounded-3xl shadow-2xl p-4 sm:p-6 text-amber-100 my-auto max-h-[95vh] overflow-y-auto pixel-border-gold space-y-5 z-10'
        }
      >
        {/* Top Header Controls */}
        <div className="flex flex-wrap items-center justify-between border-b-2 border-amber-800/80 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#ffd700] text-[#2d1b15] font-pixel text-[10px] px-2.5 py-1 rounded font-bold border border-amber-900 shadow">
              GAME TITLE SCREEN V2.0
            </span>
            <span className="text-xs font-arcade text-amber-300 hidden sm:inline">
              Bakso Quest RPG Nusantara
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Fullscreen Layout */}
            <button
              onClick={() => {
                soundFx.playClick();
                setIsFullScreenView(!isFullScreenView);
              }}
              title={isFullScreenView ? 'Ubah ke Mode Jendela Modal' : 'Ubah ke Layar Utama Full Screen'}
              className="px-3 py-1.5 rounded-xl bg-[#281f33] hover:bg-amber-900 border border-amber-600 text-amber-200 font-pixel text-xs flex items-center gap-1.5 transition-colors"
            >
              <Monitor className="w-4 h-4 text-[#ffd700]" />
              <span className="hidden sm:inline">
                {isFullScreenView ? 'Mode Jendela' : 'Full Screen'}
              </span>
            </button>

            {/* Toggle Real Browser Fullscreen */}
            <button
              onClick={toggleBrowserFullscreen}
              title="Layar Penuh Browser (Fullscreen API)"
              className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 font-pixel text-xs flex items-center gap-1.5 transition-colors"
            >
              {isBrowserFullscreen ? (
                <Minimize2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="hidden sm:inline">Browser Fullscreen</span>
            </button>

            {/* Close / Return to Map */}
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#800000] hover:bg-red-900 border-2 border-[#ffd700] text-[#ffd700] font-pixel text-xs font-bold flex items-center gap-1 transition-colors shadow"
            >
              <span>Ke Peta</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HERO TITLE BANNER (RETRO ARCADE GAME TITLE) */}
        <div className="relative bg-gradient-to-br from-[#800000] via-[#4a1c1c] to-[#25101a] border-4 border-[#ffd700] p-5 sm:p-7 rounded-3xl shadow-[0_0_40px_rgba(255,215,0,0.25)] text-center sm:text-left overflow-hidden">
          <div className="absolute -right-8 -bottom-8 text-9xl opacity-20 pointer-events-none select-none">
            🍜
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-[#ffd700] text-[#2d1b15] px-3 py-1 rounded-full font-pixel text-[10px] font-bold shadow animate-pulse">
                <Sparkles className="w-3.5 h-3.5" /> RETRO RPG ADVENTURE
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-[#ffd700] drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-widest uppercase">
                BAKSO QUEST
              </h1>

              <p className="text-xs sm:text-sm font-bold text-amber-200 tracking-wider">
                LEGENDA SAMBAL & BURONAN KULINER NUSANTARA
              </p>

              <p className="text-[11px] font-arcade text-amber-100/90 max-w-xl leading-relaxed pt-1">
                Lakukan autentikasi akun, jelajahi peta warung bakso dari Sabang sampai Merauke, bagikan lokasi ke squad multiplayer, dan naikkan level Hunter milikmu!
              </p>
            </div>

            {/* BIG START GAME BUTTON */}
            <button
              onClick={() => {
                soundFx.playSuccess();
                onClose();
              }}
              className="px-8 py-4 bg-[#ffd700] hover:bg-amber-300 text-[#2d1b15] font-pixel font-black text-base rounded-2xl border-4 border-[#800000] shadow-[0_6px_0_#800000] active:translate-y-1 active:shadow-none transition-all flex items-center gap-3 shrink-0 group cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current text-[#800000] group-hover:scale-125 transition-transform" />
              <span>MULAI PETUALANGAN!</span>
            </button>
          </div>
        </div>

        {/* AUTHENTICATION & LOGIN BOX (PRIORITY AUTH FOR USER) */}
        <div className="bg-[#1e1726] p-4 sm:p-5 rounded-2xl border-2 border-amber-600 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center text-xl shadow ${
                  isGoogleConnected
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-amber-950 border-amber-600 text-amber-300'
                }`}
              >
                {isGoogleConnected ? '🔑' : '👤'}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-[#ffd700]">
                    AUTENTIKASI AKUN HUNTER
                  </h3>
                  {isGoogleConnected ? (
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Google Terhubung
                    </span>
                  ) : (
                    <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-600 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Akun Tamu (Anonim)
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-amber-300/80 mt-0.5 break-all sm:break-words">
                  {isGoogleConnected
                    ? `Terhubung sebagai: ${currentUser?.email || currentUser?.displayName || 'Google User'}`
                    : 'Login dengan akun Google Anda untuk menyimpan progress & membuka fitur Squad Multiplayer Cloud.'}
                </p>
              </div>
            </div>

            {/* GOOGLE LOGIN / ACCOUNT BUTTON */}
            {!isGoogleConnected ? (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onLoginGoogle();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#4285F4] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 border border-blue-300 active:translate-y-0.5 shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>MASUK AKUN GOOGLE</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onOpenMultiplayer();
                }}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Kelola Akun / Squad</span>
              </button>
            )}
          </div>

          {!isGoogleConnected && (
            <div className="p-2.5 bg-amber-950/40 border border-amber-800/80 rounded-xl text-[10px] text-amber-300/90 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Catatan:</strong> Anda tetap bisa bermain langsung sebagai Akun Tamu (Level 1). Login Google disarankan agar data tidak hilang.
              </span>
            </div>
          )}
        </div>

        {/* CHARACTER PROFILE CARD (STARTS AT LEVEL 1) */}
        <div className="bg-[#281f33] p-4 rounded-2xl border-2 border-amber-600/80 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <CharacterAvatar expression={profile.avatarExpression} size="lg" />

            <div className="flex-1 text-center sm:text-left w-full space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="text-base sm:text-lg font-pixel text-[#ffd700] font-bold">
                    {profile.name}
                  </h3>
                  <p className="text-[10px] text-amber-300/80">
                    Gelar RPG: <strong className="text-amber-200">{profile.title}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 justify-center sm:justify-end">
                  <span className="text-xs font-pixel text-[#ffd700] bg-[#800000] px-3 py-1 rounded-lg border border-[#ffd700] font-bold shadow">
                    LEVEL {profile.level}
                  </span>
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onClose();
                      onOpenProfile();
                    }}
                    className="text-[10px] bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 px-2.5 py-1 rounded-lg cursor-pointer active:scale-95 transition-all"
                  >
                    Edit Profil 👤
                  </button>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-pixel text-amber-300 font-bold">
                  <span>EXPERIENCE (XP)</span>
                  <span>
                    {profile.xp} / {profile.nextLevelXp} XP
                  </span>
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

        {/* MAIN GAME MENU GRID (ARCADE RPG BUTTONS) */}
        <div className="space-y-2">
          <h3 className="text-xs text-amber-300 font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ffd700]" />
            <span>MENU UTAMA GAME</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Play Map */}
            <button
              onClick={() => {
                soundFx.playSuccess();
                onClose();
              }}
              className="p-3.5 bg-[#2d1b15] hover:bg-[#3d271e] rounded-2xl border-2 border-[#ffd700] text-left transition-all hover:scale-[1.02] group shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-[#800000] border border-[#ffd700] flex items-center justify-center text-xl mb-2 group-hover:rotate-6 transition-transform">
                🗺️
              </div>
              <h4 className="font-pixel text-xs text-[#ffd700] font-bold">Jelajah Peta RPG</h4>
              <p className="text-[10px] font-arcade text-amber-200/80 mt-0.5">
                Buka lokasi warung bakso Nusantara.
              </p>
            </button>

            {/* Squad Multiplayer & Leaderboard */}
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenMultiplayer();
              }}
              className="p-3.5 bg-[#2d1b15] hover:bg-[#3d271e] rounded-2xl border-2 border-emerald-500 text-left transition-all hover:scale-[1.02] group shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-400 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
                ⚔️
              </div>
              <h4 className="font-pixel text-xs text-emerald-300 font-bold">Squad & Ranking</h4>
              <p className="text-[10px] font-arcade text-amber-200/80 mt-0.5">
                Multiplayer & papan peringkat top hunter.
              </p>
            </button>

            {/* Add New Spot */}
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
                onOpenAddSpot();
              }}
              className="p-3.5 bg-[#2d1b15] hover:bg-[#3d271e] rounded-2xl border-2 border-[#ffd700] text-left transition-all hover:scale-[1.02] group shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-900 border border-amber-400 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
                ➕
              </div>
              <h4 className="font-pixel text-xs text-amber-300 font-bold">Tambah Spot (+100 XP)</h4>
              <p className="text-[10px] font-arcade text-amber-200/80 mt-0.5">
                Tandai warung favorit baru di peta.
              </p>
            </button>

            {/* Journal */}
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
                onOpenJournal();
              }}
              className="p-3.5 bg-[#2d1b15] hover:bg-[#3d271e] rounded-2xl border-2 border-[#ffd700] text-left transition-all hover:scale-[1.02] group shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-400 flex items-center justify-center text-xl mb-2 group-hover:-rotate-6 transition-transform">
                📜
              </div>
              <h4 className="font-pixel text-xs text-purple-300 font-bold">Jurnal Kedai ({totalSpots})</h4>
              <p className="text-[10px] font-arcade text-amber-200/80 mt-0.5">
                Koleksi resensi & daftar rating.
              </p>
            </button>

            {/* Badges */}
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
                onOpenBadges();
              }}
              className="p-3.5 bg-[#2d1b15] hover:bg-[#3d271e] rounded-2xl border-2 border-[#ffd700] text-left transition-all hover:scale-[1.02] group shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform">
                🎖️
              </div>
              <h4 className="font-pixel text-xs text-amber-200 font-bold">Badges & Piala</h4>
              <p className="text-[10px] font-arcade text-amber-200/80 mt-0.5">
                Koleksi lencana pencapaian.
              </p>
            </button>

            {/* Settings */}
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
              <h4 className="font-pixel text-xs text-gray-200 font-bold">Pengaturan Audio</h4>
              <p className="text-[10px] font-arcade text-amber-200/80 mt-0.5">
                Pengaturan suara & efek visual.
              </p>
            </button>
          </div>
        </div>

        {/* Quick Top Spots Highlight */}
        {topSpots.length > 0 && (
          <div className="bg-[#281f33] p-4 rounded-2xl border-2 border-amber-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-pixel text-xs text-[#ffd700] flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                SPOT KULINER REKOMENDASI TERATAS
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
                      Buka Peta 🗺️
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-amber-800/80 flex items-center justify-between flex-col sm:flex-row gap-3">
          <p className="text-[10px] font-arcade text-amber-200/70 text-center sm:text-left">
            💡 Tekan tombol &quot;BAKSO QUEST&quot; di bagian kiri atas kapan saja untuk kembali ke Layar Utama ini.
          </p>
          <button
            onClick={() => {
              soundFx.playSuccess();
              onClose();
            }}
            className="px-6 py-2.5 bg-[#800000] hover:bg-red-900 text-[#ffd700] font-pixel font-bold text-xs rounded-xl border-2 border-[#ffd700] shadow-md active:translate-y-0.5 whitespace-nowrap"
          >
            JELAJAH PETA GAME
          </button>
        </div>
      </div>
    </div>
  );
};
