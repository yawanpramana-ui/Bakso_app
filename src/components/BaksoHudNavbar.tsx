import React, { useState } from 'react';
import { HunterProfile } from '../types';
import { soundFx } from '../utils/audio';
import { Shield, BookOpen, Plus, Volume2, VolumeX, Tv, Compass, Settings, Home, Award, Maximize2, Minimize2, Users } from 'lucide-react';

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

  return (
    <header className="absolute top-0 left-0 right-0 z-40 p-2 sm:p-4 pointer-events-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 pointer-events-auto">
        
        {/* Brand Title RPG Badge (Clicking opens Layar Utama) */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenHomeScreen();
          }}
          className="bg-[#800000] hover:bg-[#a00000] border-3 border-[#5d4037] shadow-[4px_4px_0px_#2d1b15] rounded-xl p-2 sm:p-3 flex items-center gap-3 transition-all cursor-pointer group text-left"
          title="Buka Layar Utama Bakso Quest"
        >
          <div className="w-10 h-10 rounded-lg bg-[#ffd700] border-2 border-[#5d4037] flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
            🍲
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-pixel text-[#ffd700] tracking-wider drop-shadow-[1px_1px_0px_#000]">
                BAKSO QUEST
              </h1>
              <span className="bg-[#2d1b15] text-[#ffd700] text-[9px] font-pixel px-1.5 py-0.5 rounded border border-[#ffd700]">
                v1.0
              </span>
            </div>
            <p className="text-[11px] font-arcade text-amber-100 hidden sm:block">
              Layar Utama & Hub RPG 🏠
            </p>
          </div>
        </button>

        {/* HUD Controls & Actions */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5 sm:gap-2 bg-[#800000] border-3 border-[#5d4037] shadow-[4px_4px_0px_#2d1b15] rounded-xl p-1.5 sm:p-2">
          
          {/* Layar Utama Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenHomeScreen();
            }}
            title="Buka Layar Utama Full Screen"
            className="p-2 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-[#ffd700] transition-all active:scale-95 flex items-center gap-1 text-xs font-bold"
          >
            <Home className="w-4 h-4 text-[#ffd700]" />
            <span className="font-pixel text-[10px] hidden lg:inline">Layar Utama</span>
          </button>

          {/* Multiplayer Squad Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenMultiplayer();
            }}
            title="Grup Squad & Share Lokasi Invite"
            className={`p-2 rounded-lg border transition-all active:scale-95 flex items-center gap-1 text-xs font-bold ${
              partyName
                ? 'bg-emerald-800 hover:bg-emerald-700 border-emerald-300 text-white shadow-md'
                : 'bg-[#5d4037] hover:bg-[#725146] border-[#ffd700] text-[#ffd700]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="font-pixel text-[10px] hidden md:inline">
              {partyName ? `Squad: ${partyName}` : '⚔️ Squad Multiplayer'}
            </span>
          </button>

          {/* User Auth Status Badge */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenMultiplayer();
            }}
            title={
              currentUser && !currentUser.isAnonymous
                ? `Terhubung Akun Google: ${currentUser.email || currentUser.displayName || 'Google ID'}`
                : 'Masih Akun Tamu (Klik untuk Hubungkan Akun Google)'
            }
            className={`px-2.5 py-1.5 rounded-lg border transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold ${
              currentUser && !currentUser.isAnonymous
                ? 'bg-emerald-950 hover:bg-emerald-900 border-emerald-500 text-emerald-300'
                : 'bg-amber-950 hover:bg-amber-900 border-amber-600 text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full animate-pulse bg-current" />
            <span className="font-pixel text-[10px] hidden lg:inline">
              {currentUser && !currentUser.isAnonymous
                ? `Google: ${currentUser.email?.split('@')[0] || 'Logged In'}`
                : 'Akun Tamu'}
            </span>
          </button>

          {/* Toggle Fullscreen Browser */}
          <button
            onClick={handleToggleFullscreen}
            title="Layar Penuh Aplikasi (Browser Fullscreen)"
            className="p-2 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-emerald-400 transition-all active:scale-95 flex items-center gap-1 text-xs font-bold"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="font-pixel text-[10px] hidden xl:inline">Full Screen</span>
          </button>

          {/* System Badges & Achievements Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenBadges();
            }}
            title="System Badges & Achievements"
            className="p-2 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-[#ffd700] transition-all active:scale-95 flex items-center gap-1 text-xs font-bold"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span className="font-pixel text-[10px] hidden md:inline">Badges</span>
          </button>

          {/* Game Settings Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenSettings();
            }}
            title="Pengaturan Game & Kota"
            className="p-2 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-[#ffd700] transition-all active:scale-95 flex items-center gap-1 text-xs font-bold"
          >
            <Settings className="w-4 h-4 text-[#ffd700]" />
            <span className="font-pixel text-[10px] hidden lg:inline">Pengaturan</span>
          </button>

          {/* Reset Map View */}
          <button
            onClick={() => {
              soundFx.playClick();
              onResetView();
            }}
            title="Reset Posisi Peta Indonesia"
            className="p-2 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-[#ffd700] transition-all active:scale-95 flex items-center gap-1 text-xs font-bold"
          >
            <Compass className="w-4 h-4 text-[#ffd700]" />
            <span className="font-pixel text-[10px] hidden xl:inline">Peta Utama</span>
          </button>

          {/* Hunter Profile Level Badge */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenProfile();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-amber-100 flex items-center gap-2 transition-all active:scale-95 group"
          >
            <Shield className="w-4 h-4 text-[#ffd700] group-hover:rotate-12 transition-transform" />
            <div className="text-left">
              <span className="text-[9px] font-pixel text-[#ffd700] block">
                LVL {profile.level}
              </span>
              <span className="text-[10px] font-pixel text-white hidden sm:block max-w-[70px] truncate">
                {profile.name}
              </span>
            </div>
          </button>

          {/* Journal Spots Drawer Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenJournal();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-amber-100 flex items-center gap-2 transition-all active:scale-95 relative"
          >
            <BookOpen className="w-4 h-4 text-[#ffd700]" />
            <span className="font-pixel text-[10px] hidden md:inline">Jurnal Spot</span>
            <span className="bg-[#ffd700] text-[#2d1b15] font-pixel font-bold text-[10px] px-1.5 py-0.5 rounded border border-[#5d4037]">
              {spotCount}
            </span>
          </button>

          {/* Retro Scanlines Toggle */}
          <button
            onClick={() => {
              soundFx.playClick();
              onToggleScanlines();
            }}
            title="Toggle Scanline Filter CRT Retro"
            className={`p-2 rounded-lg border transition-all ${
              isScanlinesOn
                ? 'bg-[#ffd700] border-[#5d4037] text-[#2d1b15] font-bold'
                : 'bg-[#5d4037] border-[#ffd700] text-[#ffd700]'
            }`}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Nyalakan Musik 8-Bit' : 'Mute Suara'}
            className="p-2 rounded-lg bg-[#5d4037] hover:bg-[#725146] border border-[#ffd700] text-[#ffd700] transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-300" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
          </button>

          {/* Add New Spot CTA Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenAddSpot();
            }}
            className="px-3 py-2 btn-3d font-pixel text-xs rounded-lg flex items-center gap-1.5 active:translate-y-0.5 shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>TAMBAH BAKSO</span>
          </button>
        </div>
      </div>
    </header>
  );
};
