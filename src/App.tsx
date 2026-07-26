import React, { useState, useEffect } from 'react';
import { BaksoSpot, HunterProfile, Party } from './types';
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
import { MultiplayerPartyModal } from './components/MultiplayerPartyModal';
import { SplashScreen } from './components/SplashScreen';
import { soundFx } from './utils/audio';
import {
  auth,
  db,
  signInAnonymously,
  signInWithPopup,
  googleProvider,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from './lib/firebase';
import { MapChatDrawer } from './components/MapChatDrawer';
import { Navigation, MessageSquare } from 'lucide-react';


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
    return [];
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
      name: 'Hunter Pentol Baru',
      title: 'Pemburu Amatir',
      avatarExpression: 'star',
      level: 1,
      xp: 0,
      nextLevelXp: 100,
      favoriteType: 'Bakso Urat Jumbo',
    };
  });

  // UI States
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [selectedSpot, setSelectedSpot] = useState<BaksoSpot | null>(null);
  const [isHomeScreenOpen, setIsHomeScreenOpen] = useState<boolean>(true);
  const [isBadgesOpen, setIsBadgesOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [editingSpot, setEditingSpot] = useState<BaksoSpot | null>(null);
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isScanlinesOn, setIsScanlinesOn] = useState<boolean>(true);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [gpsConfirmCoords, setGpsConfirmCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number; newTitle: string } | null>(null);
  const [isMapChatOpen, setIsMapChatOpen] = useState<boolean>(false);

  // Firebase Auth & Multiplayer Party States
  const [currentUser, setCurrentUser] = useState<{
    uid: string;
    isAnonymous: boolean;
    email?: string | null;
    displayName?: string | null;
  } | null>(null);
  const [currentParty, setCurrentParty] = useState<Party | null>(null);
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState<boolean>(false);

  // Realtime Squad Toast Notification State
  const [squadNotice, setSquadNotice] = useState<{
    id: string;
    type: 'spot' | 'chat';
    title: string;
    message: string;
    spot?: BaksoSpot;
    timestamp: number;
  } | null>(null);
  const initialMountTimeRef = React.useRef<number>(Date.now());
  const knownSpotIdsRef = React.useRef<Set<string>>(new Set());
  const knownMsgIdsRef = React.useRef<Set<string>>(new Set());
  const knownGlobalMsgIdsRef = React.useRef<Set<string>>(new Set());

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAddingMode, setIsAddingMode] = useState<boolean>(false);
  const isAddingModeRef = React.useRef(isAddingMode);

  useEffect(() => {
    isAddingModeRef.current = isAddingMode;
  }, [isAddingMode]);

  // Firebase Auth Listener & User Sync
  useEffect(() => {
    let partyUnsub: (() => void) | null = null;
    let userUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (user) => {
      if (partyUnsub) {
        partyUnsub();
        partyUnsub = null;
      }
      if (userUnsub) {
        userUnsub();
        userUnsub = null;
      }

      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn('Anonymous auth sign-in error:', err);
        }
        return;
      }

      if (user) {
        setCurrentUser({
          uid: user.uid,
          isAnonymous: user.isAnonymous,
          email: user.email,
          displayName: user.displayName,
        });

        // Sync profile document in Firestore and listen to user updates
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const uData = userSnap.data();
            setProfile((prev) => ({
              ...prev,
              name: uData.name || user.displayName || prev.name,
              level: uData.level || prev.level,
              xp: uData.xp || prev.xp,
              title: getTitleForLevel(uData.level || prev.level),
              favoriteType: uData.favoriteType || prev.favoriteType,
              avatarExpression: uData.avatarExpression || prev.avatarExpression,
            }));
          } else {
            await setDoc(userRef, {
              uid: user.uid,
              name: user.displayName || profile.name,
              level: profile.level,
              xp: profile.xp,
              createdAt: new Date().toISOString(),
            });
          }

          // Realtime user doc listener (tracks party changes & profile changes)
          userUnsub = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const uData = docSnap.data();
              setProfile((prev) => ({
                ...prev,
                name: uData.name || prev.name,
                level: uData.level || prev.level,
                xp: uData.xp || prev.xp,
                title: getTitleForLevel(uData.level || prev.level),
              }));

              if (uData.currentPartyId) {
                if (partyUnsub) partyUnsub();
                partyUnsub = onSnapshot(doc(db, 'parties', uData.currentPartyId), (pSnap) => {
                  if (pSnap.exists()) {
                    setCurrentParty({ id: pSnap.id, ...pSnap.data() } as Party);
                  } else {
                    setCurrentParty(null);
                  }
                });
              } else {
                if (partyUnsub) {
                  partyUnsub();
                  partyUnsub = null;
                }
                setCurrentParty(null);
              }
            }
          });
        } catch {
          // ignore
        }
      } else {
        setCurrentUser(null);
        setCurrentParty(null);
        signInAnonymously(auth).catch(() => {});
      }
    });

    return () => {
      authUnsub();
      if (userUnsub) userUnsub();
      if (partyUnsub) partyUnsub();
    };
  }, []);

  // Handle URL invite code parameters (e.g., ?party=BKSO7X)
  useEffect(() => {
    if (!currentUser) return;
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCodeParam = urlParams.get('party');
    if (inviteCodeParam) {
      handleJoinPartyByCode(inviteCodeParam);
    }
  }, [currentUser?.uid]);

  // Real-time Firestore Spots Synchronization
  useEffect(() => {
    if (!currentUser) return;

    try {
      const spotsRef = collection(db, 'spots');
      const q = currentParty?.id
        ? query(spotsRef, where('partyId', '==', currentParty.id))
        : query(spotsRef, where('ownerId', '==', currentUser.uid));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const firestoreSpots: BaksoSpot[] = [];
          snapshot.forEach((docSnap) => {
            firestoreSpots.push({ id: docSnap.id, ...docSnap.data() } as BaksoSpot);
          });

          // Detect new spot added by another squad member
          if (knownSpotIdsRef.current.size > 0 && currentUser) {
            const newlyAdded = firestoreSpots.find(
              (s) =>
                !knownSpotIdsRef.current.has(s.id) &&
                s.ownerId !== currentUser.uid &&
                s.addedByName !== profile.name &&
                (s.createdAt || 0) > initialMountTimeRef.current - 10000
            );

            if (newlyAdded) {
              soundFx.playSuccess();
              setSquadNotice({
                id: newlyAdded.id,
                type: 'spot',
                title: '🍲 SPOT BAKSO BARU DISINKRONKAN!',
                message: `${newlyAdded.addedByName || 'Teman Squad'} menambahkan "${newlyAdded.name}"!`,
                spot: newlyAdded,
                timestamp: Date.now(),
              });
            }
          }

          knownSpotIdsRef.current = new Set(firestoreSpots.map((s) => s.id));
          setSpots(firestoreSpots);
        },
        (err) => {
          console.warn('Firestore subscription error:', err);
        }
      );

      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, [currentUser?.uid, currentParty?.id]);

  // Realtime Chat Message Notification Detection
  useEffect(() => {
    if (!currentParty?.messages || !Array.isArray(currentParty.messages) || !currentUser) return;

    if (knownMsgIdsRef.current.size > 0) {
      const newMsg = currentParty.messages.find(
        (m) =>
          !knownMsgIdsRef.current.has(m.id || `${m.senderName}-${m.createdAt}`) &&
          m.senderUid !== currentUser.uid &&
          m.senderName !== profile.name &&
          m.createdAt > initialMountTimeRef.current - 10000
      );

      if (newMsg) {
        soundFx.playClick();
        setSquadNotice({
          id: newMsg.id || `msg-${Date.now()}`,
          type: 'chat',
          title: `💬 PESAN SQUAD DARI ${newMsg.senderName.toUpperCase()}`,
          message: `"${newMsg.text}"`,
          timestamp: Date.now(),
        });
      }
    }

    knownMsgIdsRef.current = new Set(currentParty.messages.map((m) => m.id || `${m.senderName}-${m.createdAt}`));
  }, [currentParty?.messages, currentUser?.uid, profile.name]);

  // Realtime Global Chat Toast Notification Listener
  useEffect(() => {
    if (!currentUser) return;
    try {
      const roomRef = doc(db, 'global_chat', 'room');
      const unsub = onSnapshot(
        roomRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const msgs = (docSnap.data().messages || []) as ChatMessage[];
            if (knownGlobalMsgIdsRef.current.size > 0) {
              const newMsg = msgs.find(
                (m) =>
                  !knownGlobalMsgIdsRef.current.has(m.id || `${m.senderName}-${m.createdAt}`) &&
                  m.senderUid !== currentUser.uid &&
                  m.senderName !== profile.name &&
                  (m.createdAt || 0) > initialMountTimeRef.current - 10000
              );
              if (newMsg) {
                soundFx.playClick();
                setSquadNotice({
                  id: newMsg.id || `global-${Date.now()}`,
                  type: 'chat',
                  title: `🌐 PESAN GLOBAL DARI ${(newMsg.senderName || 'Hunter').toUpperCase()}`,
                  message: `"${newMsg.text}"`,
                  timestamp: Date.now(),
                });
              }
            }
            knownGlobalMsgIdsRef.current = new Set(msgs.map((m) => m.id || `${m.senderName}-${m.createdAt}`));
          }
        },
        (err) => console.warn('App global chat listener error:', err)
      );
      return () => unsub();
    } catch {
      // ignore
    }
  }, [currentUser?.uid, profile.name]);

  // Auto-dismiss squad toast notification after 6 seconds
  useEffect(() => {
    if (!squadNotice) return;
    const timer = setTimeout(() => {
      setSquadNotice(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [squadNotice?.id, squadNotice?.timestamp]);

  // Multiplayer Party Functions
  const handleLoginGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      soundFx.playSuccess();

      // Migrate existing local spots to the newly logged-in Google account
      if (res?.user && spots.length > 0) {
        for (const s of spots) {
          try {
            await setDoc(
              doc(db, 'spots', s.id),
              {
                ...s,
                ownerId: res.user.uid,
                addedByName: res.user.displayName || profile.name,
              },
              { merge: true }
            );
          } catch (e) {
            console.warn('Migration error for spot:', s.id, e);
          }
        }
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
    }
  };

  const handleCreateParty = async (partyName: string) => {
    if (!currentUser) {
      throw new Error('Anda belum login. Silakan klik Login terlebih dahulu.');
    }
    try {
      // 6-character clean invite code (e.g., BK9X82)
      const inviteCode = 'BK' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const userName = profile.name || currentUser.displayName || 'Hunter Pentol';
      const partyData = {
        name: partyName.trim(),
        ownerId: currentUser.uid,
        memberIds: [currentUser.uid],
        memberNames: { [currentUser.uid]: userName },
        inviteCode,
        createdAt: Date.now(),
      };

      const partyRef = await addDoc(collection(db, 'parties'), partyData);
      await setDoc(doc(db, 'users', currentUser.uid), { currentPartyId: partyRef.id }, { merge: true });

      setCurrentParty({
        id: partyRef.id,
        ...partyData,
      });
    } catch (err: any) {
      console.error('Error creating party:', err);
      throw new Error(err?.message || 'Gagal membuat Squad Party di database server.');
    }
  };

  const handleJoinPartyByCode = async (inviteCode: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const cleanCode = inviteCode.toUpperCase().trim();
      let partyQuery = query(collection(db, 'parties'), where('inviteCode', '==', cleanCode));
      let partyDocs = await getDocs(partyQuery);

      // Fallback search if user typed 6 chars of an older 8-char code starting with BKSO
      if (partyDocs.empty && !cleanCode.startsWith('BKSO') && cleanCode.length === 6) {
        const legacyCode = 'BKSO' + cleanCode.slice(2);
        partyQuery = query(collection(db, 'parties'), where('inviteCode', '==', legacyCode));
        partyDocs = await getDocs(partyQuery);
      }

      if (partyDocs.empty) return false;

      const partyDoc = partyDocs.docs[0];
      const partyData = partyDoc.data() as Party;
      const userName = profile.name || currentUser.displayName || 'Hunter Pentol';

      await updateDoc(doc(db, 'parties', partyDoc.id), {
        memberIds: arrayUnion(currentUser.uid),
        [`memberNames.${currentUser.uid}`]: userName,
      });

      await setDoc(doc(db, 'users', currentUser.uid), { currentPartyId: partyDoc.id }, { merge: true });

      setCurrentParty({
        ...partyData,
        id: partyDoc.id,
        memberIds: Array.from(new Set([...partyData.memberIds, currentUser.uid])),
        memberNames: { ...partyData.memberNames, [currentUser.uid]: userName },
      });

      return true;
    } catch (err) {
      console.error('Error joining party:', err);
      return false;
    }
  };

  const handleLeaveParty = async () => {
    if (!currentUser || !currentParty) return;
    try {
      await updateDoc(doc(db, 'parties', currentParty.id), {
        memberIds: arrayRemove(currentUser.uid),
      });
      await setDoc(doc(db, 'users', currentUser.uid), { currentPartyId: null }, { merge: true });
    } catch (err) {
      console.warn('Error leaving party:', err);
    }
    setCurrentParty(null);
  };


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

      const updated = {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp: nextXp,
        title: updatedTitle,
      };

      if (currentUser) {
        setDoc(
          doc(db, 'users', currentUser.uid),
          {
            level: updated.level,
            xp: updated.xp,
            title: updated.title,
          },
          { merge: true }
        ).catch(() => {});
      }

      return updated;
    });
  };

  // Save new spot or update existing spot
  const handleSaveSpot = async (
    spotData: Omit<BaksoSpot, 'id' | 'createdAt'> & { id?: string; createdAt?: number; isGpsLocated?: boolean }
  ) => {
    const isEdit = Boolean(spotData.id);
    const isGps = Boolean(spotData.isGpsLocated);
    const spotId = spotData.id || `spot-${Date.now()}`;
    const createdAt = spotData.createdAt || Date.now();

    const newSpot: BaksoSpot = {
      ...spotData,
      id: spotId,
      createdAt,
      ownerId: spotData.ownerId || currentUser?.uid || 'local',
      partyId: spotData.partyId || currentParty?.id,
      addedByName: spotData.addedByName || profile.name,
    };

    setSpots((prev) => {
      const exists = prev.some((s) => s.id === spotId);
      if (exists) {
        return prev.map((s) => (s.id === spotId ? newSpot : s));
      }
      return [newSpot, ...prev];
    });

    setSelectedSpot(newSpot);

    if (isValidCoord(newSpot.lat, newSpot.lng)) {
      setMapCenter([newSpot.lat, newSpot.lng]);
    }

    setPendingCoords(null);
    setIsAddingMode(false);
    setEditingSpot(null);

    // Save to Firestore Database using matching doc ID
    if (currentUser) {
      try {
        await setDoc(
          doc(db, 'spots', spotId),
          {
            ...newSpot,
            ownerId: currentUser.uid,
            partyId: currentParty?.id || null,
            addedByName: profile.name,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Error saving spot to Firestore:', err);
      }
    }

    if (!isEdit && isGps) {
      // Award +100 XP only for new spots added via authentic GPS location
      addXp(100);
    }
  };

  // Delete spot
  const handleDeleteSpot = async (id: string) => {
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
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'spots', id));
      } catch (err) {
        console.warn('Error deleting spot from Firestore:', err);
      }
    }
  };

  // Handle Pick Location on Map
  const handleMapClickLocation = (lat: number, lng: number) => {
    if (isAddingModeRef.current && isValidCoord(lat, lng)) {
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
    const defaultProfile: HunterProfile = {
      name: currentUser?.displayName || 'Hunter Pentol Baru',
      title: 'Petualang Pentol Pemula',
      avatarExpression: 'star',
      level: 1,
      xp: 0,
      nextLevelXp: 100,
      favoriteType: 'Bakso Urat Jumbo',
    };

    setSpots([]);
    setProfile(defaultProfile);
    localStorage.removeItem(STORAGE_KEY_SPOTS);
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    setMapCenter([-6.2088, 106.8456]);
    setSelectedSpot(null);

    if (currentUser) {
      setDoc(
        doc(db, 'users', currentUser.uid),
        {
          name: defaultProfile.name,
          level: 1,
          xp: 0,
          title: defaultProfile.title,
        },
        { merge: true }
      ).catch(() => {});
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#120e17] font-sans-clean select-none">
      
      {/* Splash Screen on Application Load */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Scanlines Overlay Effect for CRT Retro Feel */}
      {isScanlinesOn && <div className="absolute inset-0 scanlines z-20 pointer-events-none opacity-40" />}

      {/* Top HUD Navigation Bar */}
      <BaksoHudNavbar
        profile={profile}
        spotCount={spots.length}
        partyName={currentParty?.name}
        currentUser={currentUser}
        onOpenMultiplayer={() => setIsMultiplayerModalOpen(true)}
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

      {/* Realtime Squad Event Toast Banner */}
      {squadNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-[#1e1726]/95 backdrop-blur-md border-3 border-[#ffd700] text-amber-100 px-4 py-3 rounded-2xl shadow-2xl font-pixel animate-bounce max-w-lg w-[90vw] flex items-center justify-between gap-3 pixel-border-gold">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0">
              {squadNotice.type === 'spot' ? '🍲' : '💬'}
            </span>
            <div className="min-w-0">
              <h4 className="text-xs text-[#ffd700] font-bold truncate">
                {squadNotice.title}
              </h4>
              <p className="text-[11px] font-sans-clean text-amber-200 truncate leading-snug">
                {squadNotice.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {squadNotice.type === 'spot' && squadNotice.spot && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  const targetSpot = squadNotice.spot!;
                  setSelectedSpot(targetSpot);
                  if (isValidCoord(targetSpot.lat, targetSpot.lng)) {
                    setMapCenter([targetSpot.lat, targetSpot.lng]);
                  }
                  setIsDetailModalOpen(true);
                  setSquadNotice(null);
                }}
                className="px-2.5 py-1 bg-[#800000] hover:bg-red-800 text-[#ffd700] border border-[#ffd700] rounded-xl text-[10px] font-bold shadow active:scale-95 whitespace-nowrap"
              >
                📍 LIHAT DI PETA
              </button>
            )}

            {squadNotice.type === 'chat' && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setIsMapChatOpen(true);
                  setSquadNotice(null);
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-amber-950 border border-amber-200 rounded-xl text-[10px] font-bold shadow active:scale-95 whitespace-nowrap"
              >
                💬 BALAS CHAT
              </button>
            )}

            <button
              onClick={() => setSquadNotice(null)}
              className="p-1 text-amber-400 hover:text-red-400 text-xs font-bold"
            >
              ×
            </button>
          </div>
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
          onCancelPickFromMap={() => {
            setIsAddingMode(false);
            setIsAddModalOpen(true);
          }}
          isAddingMode={isAddingMode}
          pendingCoords={pendingCoords}
          center={mapCenter}
        />

        {/* Floating Controls at Bottom Left of Map */}
        <div className="absolute bottom-6 left-3 sm:left-6 z-20 flex items-center gap-2">
          {/* Floating GPS Button */}
          <button
            onClick={handleTriggerGpsLocation}
            title="Tambah Bakso Berdasarkan GPS Lokasi Saya Sekarang"
            className="px-2.5 py-2 sm:px-3.5 sm:py-2.5 bg-[#800000] hover:bg-[#a00000] text-[#ffd700] border-2 border-[#ffd700] rounded-xl shadow-[4px_4px_0px_#2d1b15] font-pixel text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2 active:translate-y-0.5 transition-transform max-w-[170px] sm:max-w-none"
          >
            <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-emerald-400 shrink-0" />
            <span className="truncate">📍 LOKASI GPS SAYA</span>
          </button>

          {/* Floating Squad Chat Toggle Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsMapChatOpen(!isMapChatOpen);
            }}
            title="Buka Obrolan Squad Realtime di Peta"
            className={`px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border-2 font-pixel text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2 active:translate-y-0.5 transition-transform shadow-[4px_4px_0px_#2d1b15] ${
              isMapChatOpen
                ? 'bg-[#ffd700] text-amber-950 border-white font-bold'
                : 'bg-[#800000] hover:bg-[#a00000] text-[#ffd700] border-[#ffd700]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-300 shrink-0" />
            <span>💬 CHAT SQUAD</span>
          </button>
        </div>

        {/* Floating Map Squad Live Chat Drawer */}
        <MapChatDrawer
          isOpen={isMapChatOpen}
          onClose={() => setIsMapChatOpen(false)}
          currentParty={currentParty}
          currentUser={currentUser}
          profile={profile}
          onOpenMultiplayerModal={() => setIsMultiplayerModalOpen(true)}
        />
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

      {/* Log / Add / Edit Spot Modal */}
      <AddSpotModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsAddingMode(false);
          setEditingSpot(null);
        }}
        onSaveSpot={handleSaveSpot}
        initialCoords={pendingCoords}
        onPickFromMap={handleStartPickFromMap}
        editingSpot={editingSpot}
        existingSpots={spots}
      />

      {/* "Lihat Detail Kunjungan" Modal */}
      <SpotDetailModal
        spot={selectedSpot}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onDeleteSpot={handleDeleteSpot}
        onEditSpot={(spot) => {
          setEditingSpot(spot);
          setIsDetailModalOpen(false);
          setIsAddModalOpen(true);
        }}
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
        onUpdateProfile={(updated) => {
          setProfile((p) => {
            const next = { ...p, ...updated };
            if (currentUser) {
              setDoc(doc(db, 'users', currentUser.uid), next, { merge: true }).catch(() => {});
            }
            return next;
          });
        }}
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

      {/* Layar Utama / Home Screen Modal (Game Title Screen) */}
      <HomeScreenModal
        isOpen={isHomeScreenOpen}
        onClose={() => setIsHomeScreenOpen(false)}
        profile={profile}
        spots={spots}
        currentUser={currentUser}
        onLoginGoogle={handleLoginGoogle}
        onOpenMultiplayer={() => setIsMultiplayerModalOpen(true)}
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

      {/* Multiplayer Party & Auth Modal */}
      <MultiplayerPartyModal
        isOpen={isMultiplayerModalOpen}
        onClose={() => setIsMultiplayerModalOpen(false)}
        currentUser={currentUser}
        currentParty={currentParty}
        profile={profile}
        spots={spots}
        onLoginGoogle={handleLoginGoogle}
        onCreateParty={handleCreateParty}
        onJoinPartyByCode={handleJoinPartyByCode}
        onLeaveParty={handleLeaveParty}
        onOpenAddModal={() => {
          setIsMultiplayerModalOpen(false);
          setIsAddModalOpen(true);
        }}
      />

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
