import React, { useState, useEffect } from 'react';
import { BaksoSpot, HunterProfile } from './types';
import { INITIAL_BAKSO_SPOTS } from './data/initialSpots';
import { BaksoMap } from './components/BaksoMap';
import { BaksoHudNavbar } from './components/BaksoHudNavbar';
import { AddSpotModal } from './components/AddSpotModal';
import { SpotDetailModal } from './components/SpotDetailModal';
import { HunterProfileModal } from './components/HunterProfileModal';
import { SpotListDrawer } from './components/SpotListDrawer';
import { GameSettingsModal } from './components/GameSettingsModal';
import { HomeScreenModal } from './components/HomeScreenModal';
import { SystemBadgesModal } from './components/SystemBadgesModal';
import { LevelUpModal } from './components/LevelUpModal';
import { soundFx } from './utils/audio';
import { Navigation } from 'lucide-react';

const STORAGE_KEY_SPOTS = 'bakso_quest_spots_v1';
const STORAGE_KEY_PROFILE = 'bakso_quest_profile_v1';

export default function App() {
  // Load Spots from LocalStorage or Fallback to Initial Dataset
  const [spots, setSpots] = useState<BaksoSpot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPOTS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (s: any) =>
              s &&
              typeof s.lat === 'number' &&
              typeof s.lng === 'number' &&
              !isNaN(s.lat) &&
              !isNaN(s.lng) &&
              isFinite(s.lat) &&
              isFinite(s.lng)
          );
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_BAKSO_SPOTS;
  });

  // Load Hunter Profile from LocalStorage or Default
  const [profile, setProfile] = useState<HunterProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      name: 'Hunter Pentol #1',
      title: 'Suhu Kuah Kaldu',
      avatarExpression: 'star',
      level: 3,
      xp: 250,
      nextLevelXp: 400,
      favoriteType: 'Bakso Urat Jumbo',
    };
  });

  // UI States
  const [selectedSpot, setSelectedSpot] = useState<BaksoSpot | null>(null);
  const [isHomeScreenOpen, setIsHomeScreenOpen] = useState<boolean>(true);
  const [isBadgesOpen, setIsBadgesOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isScanlinesOn, setIsScanlinesOn] = useState<boolean>(true);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [gpsConfirmCoords, setGpsConfirmCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number; newTitle: string } | null>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAddingMode, setIsAddingMode] = useState<boolean>(false);

  // Helper for checking valid coordinates
  const isValidCoord = (latVal: any, lngVal: any): boolean => {
    return (
      typeof latVal === 'number' &&
      typeof lngVal === 'number' &&
      !isNaN(latVal) &&
      !isNaN(lngVal) &&
      isFinite(latVal) &&
      isFinite(lngVal)
    );
  };

  // Save Spots to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SPOTS, JSON.stringify(spots));
    } catch {
      // ignore
    }
  }, [spots]);

  // Save Profile to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  // Title Generator based on Level
  const getTitleForLevel = (lvl: number): string => {
    if (lvl <= 1) return 'Petualang Pentol Pemula';
    if (lvl === 2) return 'Pemburu Bakso Urat';
    if (lvl === 3) return 'Suhu Kuah Kaldu';
    if (lvl === 4) return 'Master Sambal Setan';
    return 'Legenda Bakso Nusantara 👑';
  };

  // Add XP and handle Level Up
  const addXp = (amount: number) => {
    setProfile((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let nextXp = prev.nextLevelXp;
      let leveledUp = false;

      if (newXp >= nextXp) {
        newLevel += 1;
        nextXp += 300;
        leveledUp = true;
      }

      const updatedTitle = getTitleForLevel(newLevel);

      if (leveledUp) {
        setLevelUpInfo({
          newLevel,
          newTitle: updatedTitle,
        });
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp: nextXp,
        title: updatedTitle,
      };
    });
  };

  // Save new spot
  const handleSaveSpot = (newSpotData: Omit<BaksoSpot, 'id' | 'createdAt'>) => {
    const newSpot: BaksoSpot = {
      ...newSpotData,
      id: `spot-${Date.now()}`,
      createdAt: Date.now(),
    };

    setSpots((prev) => [newSpot, ...prev]);
    setSelectedSpot(newSpot);

    if (isValidCoord(newSpot.lat, newSpot.lng)) {
      setMapCenter([newSpot.lat, newSpot.lng]);
    }

    setPendingCoords(null);
    setIsAddingMode(false);

    // Award +100 XP
    addXp(100);
  };

  // Delete spot
  const handleDeleteSpot = (id: string) => {
    setSpots((prev) => {
      const nextSpots = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_SPOTS, JSON.stringify(nextSpots));
      } catch {
        // ignore
      }
      return nextSpots;
    });
    if (selectedSpot?.id === id) {
      setSelectedSpot(null);
    }
  };

  // Handle Pick Location on Map
  const handleMapClickLocation = (lat: number, lng: number) => {
    if (isAddingMode && isValidCoord(lat, lng)) {
      setPendingCoords({ lat, lng });
      setIsAddingMode(false);
      setIsAddModalOpen(true);
    }
  };

  // Trigger Pick Location mode
  const handleStartPickFromMap = () => {
    setIsAddModalOpen(false);
    setIsAddingMode(true);
  };

  // Reset View to Indonesia center
  const handleResetView = () => {
    setMapCenter([-6.2088, 106.8456]);
    setSelectedSpot(null);
  };

  // Handle GPS Auto Location Trigger
  const handleTriggerGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsNotice('Browser Anda tidak mendukung Geolocation GPS. Pilih titik lokasi pada peta.');
      setTimeout(() => setGpsNotice(null), 4000);
      return;
    }

    soundFx.playClick();
    setGpsNotice('Mendeteksi posisi GPS lokasi Anda...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        if (isValidCoord(userLat, userLng)) {
          setGpsNotice(null);
          // 1. Pan map directly to current location
          setMapCenter([userLat, userLng]);
          setPendingCoords({ lat: userLat, lng: userLng });
          // 2. Open small confirmation dialog instead of big modal directly
          setGpsConfirmCoords({ lat: userLat, lng: userLng });
          soundFx.playSuccess();
        } else {
          setGpsNotice('Gagal mendapatkan koordinat lokasi yang valid.');
          setTimeout(() => setGpsNotice(null), 4000);
        }
      },
      (err) => {
        setGpsNotice(`GPS: ${err.message || 'Izin lokasi ditolak'}. Silakan pilih titik lokasi pada peta.`);
        setTimeout(() => setGpsNotice(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle Data Import
  const handleImportData = (importedSpots: BaksoSpot[], importedProfile?: HunterProfile) => {
    if (Array.isArray(importedSpots) && importedSpots.length > 0) {
      setSpots(importedSpots);
    }
    if (importedProfile) {
      setProfile(importedProfile);
    }
  };

  // Handle Data Reset
  const handleResetData = () => {
    setSpots(INITIAL_BAKSO_SPOTS);
    localStorage.removeItem(STORAGE_KEY_SPOTS);
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    setMapCenter([-6.2088, 106.8456]);
    setSelectedSpot(null);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#120e17] font-sans-clean select-none">
      
      {/* Scanlines Overlay Effect for CRT Retro Feel */}
      {isScanlinesOn && <div className="absolute inset-0 scanlines z-20 pointer-events-none opacity-40" />}

      {/* Top HUD Navigation Bar */}
      <BaksoHudNavbar
        profile={profile}
        spotCount={spots.length}
        onOpenHomeScreen={() => setIsHomeScreenOpen(true)}
        onOpenBadges={() => setIsBadgesOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenJournal={() => setIsJournalOpen(!isJournalOpen)}
        onOpenAddSpot={() => {
          setPendingCoords(null);
          setIsAddModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleScanlines={() => setIsScanlinesOn(!isScanlinesOn)}
        isScanlinesOn={isScanlinesOn}
        onResetView={handleResetView}
      />

      {/* GPS Notice Toast Banner */}
      {gpsNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-[#800000] text-[#ffd700] border-2 border-[#ffd700] px-4 py-2 rounded-xl shadow-[4px_4px_0px_#2d1b15] text-xs font-pixel animate-bounce max-w-md text-center">
          ⚠️ {gpsNotice}
        </div>
      )}

      {/* Main Fullscreen Interactive Map */}
      <main className="w-full h-full relative z-0">
        <BaksoMap
          spots={spots}
          selectedSpot={selectedSpot}
          onSelectSpot={(spot) => {
            setSelectedSpot(spot);
            if (isValidCoord(spot.lat, spot.lng)) {
              setMapCenter([spot.lat, spot.lng]);
            }
          }}
          onViewSpotDetail={(spot) => {
            setSelectedSpot(spot);
            setIsDetailModalOpen(true);
          }}
          onDeleteSpot={handleDeleteSpot}
          onMapClickLocation={handleMapClickLocation}
          isAddingMode={isAddingMode}
          pendingCoords={pendingCoords}
          center={mapCenter}
        />

        {/* Floating GPS Button on Map */}
        <button
          onClick={handleTriggerGpsLocation}
          title="Tambah Bakso Berdasarkan GPS Lokasi Saya Sekarang"
          className="absolute bottom-6 left-4 sm:left-6 z-20 px-3.5 py-2.5 bg-[#800000] hover:bg-[#a00000] text-[#ffd700] border-2 border-[#ffd700] rounded-xl shadow-[4px_4px_0px_#2d1b15] font-pixel text-xs flex items-center gap-2 active:translate-y-0.5 transition-transform"
        >
          <Navigation className="w-4 h-4 fill-current text-emerald-400" />
          <span className="hidden sm:inline">📍 LOKASI GPS SAYA</span>
        </button>
      </main>

      {/* Game Settings & Halaman Utama Modal */}
      <GameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isScanlinesOn={isScanlinesOn}
        onToggleScanlines={() => setIsScanlinesOn(!isScanlinesOn)}
        onSelectCityCenter={(lat, lng) => {
          if (isValidCoord(lat, lng)) {
            setMapCenter([lat, lng]);
          }
        }}
        onTriggerGpsLocation={handleTriggerGpsLocation}
        spots={spots}
        profile={profile}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />

      {/* Log / Add New Spot Modal */}
      <AddSpotModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsAddingMode(false);
        }}
        onSaveSpot={handleSaveSpot}
        initialCoords={pendingCoords}
        onPickFromMap={handleStartPickFromMap}
      />

      {/* "Lihat Detail Kunjungan" Modal */}
      <SpotDetailModal
        spot={selectedSpot}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onDeleteSpot={handleDeleteSpot}
        onFlyToMap={(lat, lng) => {
          if (isValidCoord(lat, lng)) {
            setMapCenter([Number(lat), Number(lng)]);
          }
        }}
      />

      {/* Hunter Status & Achievements Profile Modal */}
      <HunterProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onUpdateProfile={(updated) => setProfile((p) => ({ ...p, ...updated }))}
        spots={spots}
      />

      {/* Journal / Spot List Drawer */}
      <SpotListDrawer
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        spots={spots}
        onDeleteSpot={handleDeleteSpot}
        onSelectSpot={(spot) => {
          setSelectedSpot(spot);
          if (spot && isValidCoord(spot.lat, spot.lng)) {
            setMapCenter([Number(spot.lat), Number(spot.lng)]);
          }
        }}
        onViewSpotDetail={(spot) => {
          setSelectedSpot(spot);
          setIsDetailModalOpen(true);
        }}
        onAddNewSpotClick={() => {
          setIsJournalOpen(false);
          setPendingCoords(null);
          setIsAddModalOpen(true);
        }}
      />

      {/* Layar Utama / Home Screen Modal */}
      <HomeScreenModal
        isOpen={isHomeScreenOpen}
        onClose={() => setIsHomeScreenOpen(false)}
        profile={profile}
        spots={spots}
        onOpenAddSpot={() => {
          setPendingCoords(null);
          setIsAddModalOpen(true);
        }}
        onOpenJournal={() => setIsJournalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenBadges={() => setIsBadgesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectSpot={(spot) => {
          setSelectedSpot(spot);
          if (spot && isValidCoord(spot.lat, spot.lng)) {
            setMapCenter([Number(spot.lat), Number(spot.lng)]);
          }
        }}
      />

      {/* System Badges & Achievements Modal */}
      <SystemBadgesModal
        isOpen={isBadgesOpen}
        onClose={() => setIsBadgesOpen(false)}
        profile={profile}
        spots={spots}
      />

      {/* Small GPS Location Confirmation Dialog */}
      {gpsConfirmCoords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#1e1726] border-4 border-[#ffd700] rounded-2xl p-5 text-amber-100 shadow-2xl text-center font-pixel space-y-4 pixel-border-gold">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#800000] border-2 border-[#ffd700] flex items-center justify-center text-2xl shadow">
              📍
            </div>
            <div>
              <h3 className="text-sm text-[#ffd700] font-bold">LOKASI SAYA TERDETEKSI!</h3>
              <p className="text-[11px] font-arcade text-amber-200 mt-1">
                Peta telah diarahkan ke koordinat lokasi Anda ({gpsConfirmCoords.lat.toFixed(4)}, {gpsConfirmCoords.lng.toFixed(4)}).
              </p>
              <p className="text-xs font-pixel text-amber-300 mt-2">
                Ingin menambahkan tempat Bakso baru di lokasi ini?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setGpsConfirmCoords(null);
                }}
                className="px-4 py-2 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 rounded-xl text-xs font-pixel active:translate-y-0.5"
              >
                Hanya Lihat
              </button>
              <button
                onClick={() => {
                  soundFx.playSuccess();
                  setPendingCoords(gpsConfirmCoords);
                  setGpsConfirmCoords(null);
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white border-2 border-emerald-300 rounded-xl text-xs font-pixel font-bold shadow-lg active:translate-y-0.5 flex items-center gap-1"
              >
                <span>Ya, Tambah</span>
                <span>➕</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Celebratory Modal */}
      {levelUpInfo && (
        <LevelUpModal
          isOpen={!!levelUpInfo}
          onClose={() => setLevelUpInfo(null)}
          newLevel={levelUpInfo.newLevel}
          newTitle={levelUpInfo.newTitle}
          profileName={profile.name}
          avatarExpression={profile.avatarExpression}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
      )}
    </div>
  );
}
