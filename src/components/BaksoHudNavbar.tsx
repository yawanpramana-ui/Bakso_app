import React, { useState } from 'react';
import { HunterProfile } from '../types';
import { soundFx } from '../utils/audio';
import { Shield, BookOpen, Plus, Volume2, VolumeX, Tv, Compass, Settings, Award, Maximize2, Minimize2, Users, Home } from 'lucide-react';

interface BaksoHudNavbarProps {
  profile: HunterProfile;
  spotCount: number;
  partyName?: string | null;
  currentUser?: { uid: string; isAnonymous: boolean; email?: string | null; displayName?: string | null } | null;
  onOpenMultiplayer: () => void;
  onOpenHomeScreen: () => void;
  onOpenBadges: () => void;
  onOpenProfile: () => void;
  onOpenJournal: () => void;
  onOpenAddSpot: () => void;
  onOpenSettings: () => void;
  onToggleScanlines: () => void;
  isScanlinesOn: boolean;
  onResetView: () => void;
}

export const BaksoHudNavbar: React.FC<BaksoHudNavbarProps> = ({
  profile,
  spotCount,
  partyName,
  currentUser,
  onOpenMultiplayer,
  onOpenHomeScreen,
  onOpenBadges,
  onOpenProfile,
  onOpenJournal,
  onOpenAddSpot,
  onOpenSettings,
  onToggleScanlines,
  isScanlinesOn,
  onResetView,
}) => {
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleFullscreen = () => {
    soundFx.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {});
      }
    }
  };

  const isGoogleConnected = currentUser && !currentUser.isAnonymous;

  return (
    <header className="absolute top-0 left-0 right-0 z-40 p-1.5 sm:p-3 pointer-events-auto">
      {/* Single compact row — flex-nowrap, no wrapping */}
      <div className="flex flex-row items-center justify-between gap-1.5 sm:gap-2 pointer-events-auto overflow-hidden">

        {/* Brand / Home button — compact on mobile */}
        <button
          onClick={() => { soundFx.playClick(); onOpenHomeScreen(); }}
          className="bg-[#800000] hover:bg-[#a00000] border-2 sm:border-[3px] border-[#5d4037] shadow-[3px_3px_0px_#2d1b15] rounded-xl p-1.5 sm:p-2.5 flex items-center gap-1.5 sm:gap-3 transition-all cursor-pointer group shrink-0"
          title="Buka Layar Utama Bakso Quest"
        >
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-[#ffd700] border-2 border-[#5d4037] flex items-center justify-center text-base sm:text-2xl shadow-inner group-hover:scale-105 transition-transform shrink-0">
            🍲
          </div>
          <div className="hidden xs:block">
            <div className="flex items-center gap-1">
              <h1 className="text-xs sm:text-base font-pixel text-[#ffd700] tracking-wider drop-shadow-[1px_1px_0px_#000] whitespace-nowrap">
                BAKSO QUEST
              </h1>
              <span className="bg-[#2d1b15] text-[#ffd700] text-[8px] font-pixel px-1 py-0.5 rounded border border-[#ffd700] hidden sm:inline">
                v1.0
              </span>
            </div>
          </div>
        </button>

        {/* Right side — ALL buttons in single scrollable/nowrap row */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-[#800000] border-2 sm:border-[3px] border-[#5d4037] shadow-[3px_3px_0px_#2d1b15] rounded-xl p-1 sm:p-1.5 overflow-x-auto max-w-[calc(100vw-110px)] sm:max-w-none scrollbar-none">

          {/* Home Icon — mobile only shortcut */}
          <button
            onClick={() => { soundFx.playClick(); onOpenHomeScreen(); }}
            title="Layar Utama"
            className="p-1.5 sm:p-2 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-[#ffd700] transition-all active:scale-95 flex items-center gap-1 shrink-0"
          >
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ffd700]" />
            <span className="font-pixel text-[9px] hidden xl:inline">Layar Utama</span>
          </button>

          {/* Multiplayer Squad Button */}
          <button
            onClick={() => { soundFx.playClick(); onOpenMultiplayer(); }}
            title="Grup Squad & Share Lokasi Invite"
            className={`p-1.5 sm:p-2 rounded-lg border transition-all active:scale-95 flex items-center gap-1 shrink-0 ${
              partyName
                ? 'bg-emerald-800 hover:bg-emerald-700 border-emerald-300 text-white shadow-md'
                : 'bg-[#5d4037] hover:bg-[#725146] border-[#ffd700] text-[#ffd700]'
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-pixel text-[9px] hidden lg:inline whitespace-nowrap">
              {partyName ? `Squad` : '⚔️ Squad'}
            </span>
          </button>

          {/* Auth Status Badge — dot indicator only on mobile */}
          <button
            onClick={() => { soundFx.playClick(); onOpenMultiplayer(); }}
            title={isGoogleConnected ? `Google: ${currentUser?.email}` : 'Akun Tamu — klik untuk hubungkan Google'}
            className={`p-1.5 sm:p-2 rounded-lg border transition-all active:scale-95 flex items-center gap-1 shrink-0 ${
              isGoogleConnected
                ? 'bg-emerald-950 hover:bg-emerald-900 border-emerald-500 text-emerald-300'
                : 'bg-amber-950 hover:bg-amber-900 border-amber-600 text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full animate-pulse bg-current shrink-0" />
            <span className="font-pixel text-[9px] hidden xl:inline whitespace-nowrap">
              {isGoogleConnected ? `Google` : 'Tamu'}
            </span>
          </button>

          {/* Fullscreen — hidden on small mobile */}
          <button
            onClick={handleToggleFullscreen}
            title="Layar Penuh"
            className="p-1.5 sm:p-2 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-emerald-400 transition-all active:scale-95 shrink-0 hidden sm:flex items-center"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Badges */}
          <button
            onClick={() => { soundFx.playClick(); onOpenBadges(); }}
            title="Badges & Achievements"
            className="p-1.5 sm:p-2 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-[#ffd700] transition-all active:scale-95 flex items-center gap-1 shrink-0"
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            <span className="font-pixel text-[9px] hidden lg:inline">Badges</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => { soundFx.playClick(); onOpenSettings(); }}
            title="Pengaturan Game"
            className="p-1.5 sm:p-2 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-[#ffd700] transition-all active:scale-95 flex items-center gap-1 shrink-0"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ffd700]" />
            <span className="font-pixel text-[9px] hidden xl:inline">Setting</span>
          </button>

          {/* Reset Map — hidden on small mobile */}
          <button
            onClick={() => { soundFx.playClick(); onResetView(); }}
            title="Reset Posisi Peta"
            className="p-1.5 sm:p-2 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-[#ffd700] transition-all active:scale-95 shrink-0 hidden sm:flex items-center"
          >
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ffd700]" />
          </button>

          {/* Hunter Level Badge */}
          <button
            onClick={() => { soundFx.playClick(); onOpenProfile(); }}
            className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-amber-100 flex items-center gap-1 sm:gap-2 transition-all active:scale-95 shrink-0"
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ffd700]" />
            <div className="text-left">
              <span className="text-[9px] font-pixel text-[#ffd700] block whitespace-nowrap">LVL {profile.level}</span>
              <span className="text-[9px] font-pixel text-white hidden sm:block max-w-[60px] truncate">{profile.name}</span>
            </div>
          </button>

          {/* Journal */}
          <button
            onClick={() => { soundFx.playClick(); onOpenJournal(); }}
            className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-amber-100 flex items-center gap-1 sm:gap-2 transition-all active:scale-95 relative shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ffd700]" />
            <span className="font-pixel text-[9px] hidden md:inline">Jurnal</span>
            <span className="bg-[#ffd700] text-[#2d1b15] font-pixel font-bold text-[9px] px-1 py-0.5 rounded border border-[#5d4037]">
              {spotCount}
            </span>
          </button>

          {/* Scanlines Toggle — hidden on small mobile */}
          <button
            onClick={() => { soundFx.playClick(); onToggleScanlines(); }}
            title="Toggle Scanline CRT"
            className={`p-1.5 sm:p-2 rounded-lg border transition-all shrink-0 hidden sm:flex items-center ${
              isScanlinesOn
                ? 'bg-[#ffd700] border-[#5d4037] text-[#2d1b15]'
                : 'bg-[#5d4037] border-[#ffd700] text-[#ffd700]'
            }`}
          >
            <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Mute Toggle */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Nyalakan Suara' : 'Mute Suara'}
            className="p-1.5 sm:p-2 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-[#ffd700] transition-colors shrink-0 flex items-center"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-300" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />}
          </button>

          {/* Add Spot CTA */}
          <button
            onClick={() => { soundFx.playClick(); onOpenAddSpot(); }}
            className="px-2 sm:px-3 py-1.5 sm:py-2 btn-3d font-pixel text-[9px] sm:text-xs rounded-lg flex items-center gap-1 active:translate-y-0.5 shadow-md shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" />
            <span className="hidden xs:inline">+ TAMBAH</span>
            <span className="xs:hidden">+</span>
          </button>
        </div>
      </div>
    </header>
  );
};
