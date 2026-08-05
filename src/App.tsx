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
import { ProximityDialogModal } from './components/ProximityDialogModal';
import { CheckInNoticeModal, NoticeModalData } from './components/CheckInNoticeModal';
import { SplashScreen } from './components/SplashScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { soundFx } from './utils/audio';
import { calculateHaversineDistance, findNearbySpot50m } from './utils/geo';
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
  getDocs,
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
  const [isHomeScreenOpen, setIsHomeScreenOpen] = useState<boolean>(false);
  const [isBadgesOpen, setIsBadgesOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isScanlinesOn, setIsScanlinesOn] = useState<boolean>(true);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [editingSpot, setEditingSpot] = useState<BaksoSpot | null>(null);
  const [gpsConfirmCoords, setGpsConfirmCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbySpotDialog, setNearbySpotDialog] = useState<{ spot: BaksoSpot; distance: number } | null>(null);
  const [checkInNotice, setCheckInNotice] = useState<NoticeModalData | null>(null);
  const [lastCheckInTargetSpot, setLastCheckInTargetSpot] = useState<BaksoSpot | null>(null);
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
  // Ref agar addXp bisa dipanggil dari useEffect tanpa stale closure
  const addXpRef = React.useRef<(amount: number) => void>(() => {});

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]);
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
            const userLevel = uData.level || 1;
            setProfile((prev) => ({
              ...prev,
              name: uData.name || user.displayName || prev.name,
              level: userLevel,
              xp: uData.xp || 0,
              nextLevelXp: uData.nextLevelXp || prev.nextLevelXp || userLevel * 100 + 200,
              title: getTitleForLevel(userLevel),
              favoriteType: uData.favoriteType || prev.favoriteType,
              avatarExpression: uData.avatarExpression || prev.avatarExpression,
              // Sync data anti-farming lokasi dari Firestore
              earnedXpLocations: uData.earnedXpLocations || prev.earnedXpLocations || [],
            }));
          } else {
            await setDoc(userRef, {
              uid: user.uid,
              name: user.displayName || profile.name,
              level: profile.level,
              xp: profile.xp,
              nextLevelXp: profile.nextLevelXp || 300,
              createdAt: new Date().toISOString(),
            });
          }

          // Realtime user doc listener (tracks party changes & profile changes)
          userUnsub = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const uData = docSnap.data();
              const userLevel = uData.level || 1;
              setProfile((prev) => ({
                ...prev,
                name: uData.name || prev.name,
                level: userLevel,
                xp: uData.xp || 0,
                nextLevelXp: uData.nextLevelXp || prev.nextLevelXp || userLevel * 100 + 200,
                title: getTitleForLevel(userLevel),
                // Sync data anti-farming dari Firestore secara realtime
                earnedXpLocations: uData.earnedXpLocations || prev.earnedXpLocations || [],
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
      // Load all global public BaksoSpots across Indonesia
      const q = query(spotsRef);

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
              // Award +50 XP (setengah dari penambah spot) ke anggota squad lainnya
              addXpRef.current(50);
              setSquadNotice({
                id: newlyAdded.id,
                type: 'spot',
                title: '🍲 SPOT BAKSO BARU DISINKRONKAN!',
                message: `${newlyAdded.addedByName || 'Teman Squad'} menambahkan "${newlyAdded.name}"! +50 XP untukmu! 🎉`,
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
            const data = docSnap.data();
            const msgs = (data && Array.isArray(data.messages) ? data.messages : []) as ChatMessage[];
            if (knownGlobalMsgIdsRef.current.size > 0) {
              const newMsg = msgs.find(
                (m) =>
                  m &&
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
            knownGlobalMsgIdsRef.current = new Set(msgs.filter((m) => m && (m.id || m.senderName)).map((m) => m.id || `${m.senderName}-${m.createdAt}`));
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
      if (err?.code === 'auth/popup-blocked') {
        alert('Popup Google terblokir oleh browser. Harap izinkan popup (allow popups) pada browser Anda untuk dapat login Google.');
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        alert(`Gagal login Google: ${err?.message || 'Pastikan koneksi internet stabil dan izinkan popup browser.'}`);
      }
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

  const handleJoinPartyByCode = async (rawCode: string): Promise<boolean> => {
    // Auto-authenticate as guest if currentUser is not set yet
    let activeUser = currentUser;
    if (!activeUser) {
      try {
        const res = await signInAnonymously(auth);
        activeUser = {
          uid: res.user.uid,
          isAnonymous: true,
          displayName: res.user.displayName,
        };
        setCurrentUser(activeUser);
      } catch (err) {
        console.warn('Auto sign-in during party join failed:', err);
        throw new Error('Gagal mengautentikasi akun. Pastikan koneksi internet aktif.');
      }
    }

    if (!activeUser) {
      throw new Error('Akun belum siap. Silakan coba beberapa detik lagi.');
    }

    try {
      // 1. Clean input code (extract code if full URL was pasted, strip spaces/hyphens)
      let cleanCode = rawCode.trim();
      if (cleanCode.includes('party=')) {
        cleanCode = cleanCode.split('party=')[1].split('&')[0];
      }
      // Remove all non-alphanumeric characters (spaces, hyphens, etc.)
      cleanCode = cleanCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();

      if (!cleanCode) {
        throw new Error('Kode invite tidak boleh kosong.');
      }

      // 2. Query Firestore with multi-fallbacks
      let targetDocId: string | null = null;
      let targetPartyData: Party | null = null;

      // Direct query by inviteCode
      let partyQuery = query(collection(db, 'parties'), where('inviteCode', '==', cleanCode));
      let partyDocs = await getDocs(partyQuery);

      if (!partyDocs.empty) {
        targetDocId = partyDocs.docs[0].id;
        targetPartyData = partyDocs.docs[0].data() as Party;
      }

      // Fallback 1: Try legacy 8-char code (BKSO...)
      if (!targetDocId && !cleanCode.startsWith('BKSO') && cleanCode.length === 6) {
        const legacyCode = 'BKSO' + cleanCode.slice(2);
        partyQuery = query(collection(db, 'parties'), where('inviteCode', '==', legacyCode));
        partyDocs = await getDocs(partyQuery);
        if (!partyDocs.empty) {
          targetDocId = partyDocs.docs[0].id;
          targetPartyData = partyDocs.docs[0].data() as Party;
        }
      }

      // Fallback 2: Check direct Document ID (if rawCode is a Firestore document ID)
      if (!targetDocId) {
        try {
          const directSnap = await getDoc(doc(db, 'parties', rawCode.trim()));
          if (directSnap.exists()) {
            targetDocId = directSnap.id;
            targetPartyData = directSnap.data() as Party;
          }
        } catch {
          // ignore
        }
      }

      // Fallback 3: Case-insensitive scan across all party documents
      if (!targetDocId) {
        const allPartiesSnap = await getDocs(collection(db, 'parties'));
        const matchedDoc = allPartiesSnap.docs.find((d) => {
          const code = (d.data().inviteCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
          return (
            code === cleanCode ||
            (cleanCode.length >= 4 && code.endsWith(cleanCode.slice(-4))) ||
            d.id === rawCode.trim()
          );
        });
        if (matchedDoc) {
          targetDocId = matchedDoc.id;
          targetPartyData = matchedDoc.data() as Party;
        }
      }

      if (!targetDocId || !targetPartyData) {
        throw new Error(`Kode invite "${cleanCode}" tidak ditemukan di database server. Pastikan kodenya benar.`);
      }

      const userName = profile.name || activeUser.displayName || 'Hunter Pentol';

      // 3. Update User doc FIRST so userUnsub listener won't overwrite currentParty to null
      await setDoc(doc(db, 'users', activeUser.uid), { currentPartyId: targetDocId }, { merge: true });

      // 4. Update Party doc
      await updateDoc(doc(db, 'parties', targetDocId), {
        memberIds: arrayUnion(activeUser.uid),
        [`memberNames.${activeUser.uid}`]: userName,
      });

      // 5. Update local state
      setCurrentParty({
        ...targetPartyData,
        id: targetDocId,
        memberIds: Array.from(new Set([...(targetPartyData.memberIds || []), activeUser.uid])),
        memberNames: { ...(targetPartyData.memberNames || {}), [activeUser.uid]: userName },
      });

      return true;
    } catch (err: any) {
      console.error('Error joining party:', err);
      throw new Error(err?.message || 'Gagal bergabung ke Squad. Silakan periksa koneksi internet.');
    }
  };

  // Check-in at a spot (verifies GPS distance <= 150m, adds user to visitedUserIds, opens Fog of War, awards +100 XP)
  const handleCheckInSpot = async (spotToVisit: BaksoSpot, skipGpsCheck: boolean = false) => {
    if (!currentUser) return;

    const isAlreadyVisited = Boolean(
      spotToVisit.ownerId === currentUser.uid ||
        (spotToVisit.visitedUserIds && spotToVisit.visitedUserIds.includes(currentUser.uid)) ||
        (profile.visitedSpotIds && profile.visitedSpotIds.includes(spotToVisit.id))
    );

    if (isAlreadyVisited) {
      soundFx.playClick();
      setSelectedSpot(spotToVisit);
      setIsDetailModalOpen(true);
      return;
    }

    const performCheckIn = async () => {
      try {
        const updatedVisitedUserIds = Array.from(
          new Set([...(spotToVisit.visitedUserIds || []), currentUser.uid])
        );

        const updatedSpot: BaksoSpot = {
          ...spotToVisit,
          visitedUserIds: updatedVisitedUserIds,
        };

        // 1. Update Firestore spot document with arrayUnion
        try {
          await updateDoc(doc(db, 'spots', spotToVisit.id), {
            visitedUserIds: arrayUnion(currentUser.uid),
          });
        } catch (e) {
          console.warn('Firestore updateDoc warning:', e);
        }

        // 2. Award +100 XP for checking in / revealing Fog of War
        addXp(100);

        // 3. Update profile visitedSpotIds locally & in storage
        setProfile((prev) => ({
          ...prev,
          visitedSpotIds: Array.from(new Set([...(prev.visitedSpotIds || []), spotToVisit.id])),
        }));

        // 4. Update local spots list & selectedSpot
        setSpots((prev) =>
          prev.map((s) => (s.id === spotToVisit.id ? updatedSpot : s))
        );
        setSelectedSpot(updatedSpot);

        soundFx.playSuccess();
        setCheckInNotice({
          type: 'success',
          title: 'CHECK-IN BERHASIL!',
          subtitle: 'Status Fog of War: VISITED 🍲',
          spotName: spotToVisit.name,
          message: `Selamat! Kedai "${spotToVisit.name}" kini telah resmi kamu kunjungi. Status lokasi di peta berubah dari Fog of War 🌫️ menjadi Visited penuh warna!`,
          xpGained: 100,
        });

        setIsDetailModalOpen(true);
      } catch (err) {
        console.warn('Error checking in at spot:', err);
      }
    };

    if (skipGpsCheck) {
      await performCheckIn();
      return;
    }

    const spotLat = Number(spotToVisit.lat);
    const spotLng = Number(spotToVisit.lng);

    if (isNaN(spotLat) || isNaN(spotLng)) {
      await performCheckIn();
      return;
    }

    if (!navigator.geolocation) {
      await performCheckIn();
      return;
    }

    const processPosition = async (userLat: number, userLng: number) => {
      const distanceMeters = Math.round(
        calculateHaversineDistance(userLat, userLng, spotLat, spotLng)
      );

      const MAX_CHECKIN_RADIUS = 250; // Increased buffer radius to 250m for GPS/Wi-Fi drift

      if (distanceMeters <= MAX_CHECKIN_RADIUS) {
        await performCheckIn();
      } else {
        soundFx.playClick();
        const distanceStr =
          distanceMeters >= 1000
            ? `${(distanceMeters / 1000).toFixed(1)} km`
            : `${distanceMeters} meter`;

        setLastCheckInTargetSpot(spotToVisit);

        setCheckInNotice({
          type: 'error',
          title: 'TERLALU JAUH DARI KEDAI!',
          subtitle: 'Verifikasi Lokasi GPS',
          spotName: spotToVisit.name,
          distanceStr,
          message: `Posisi GPS kamu saat ini berjarak ${distanceStr} dari kedai ini.\n\nUntuk melakukan Check-in (+100 XP), kamu disarankan berada di sekitar lokasi kedai (maksimal ${MAX_CHECKIN_RADIUS} meter). Jika GPS kamu kurang akurat, kamu dapat mengklik tombol "Check-in di Titik Ini" di bawah.`,
        });
      }
    };

    // Dual-stage geolocation check (High Accuracy -> Low Accuracy Fallback)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        processPosition(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // Fallback to low accuracy (Wi-Fi/Cellular IP) if high accuracy times out/fails
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            processPosition(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            // If GPS is disabled or blocked, allow check-in with fallback option
            setLastCheckInTargetSpot(spotToVisit);
            setCheckInNotice({
              type: 'warning',
              title: 'AKSES GPS TERKUNCI / TIMEOUT',
              subtitle: 'Verifikasi Lokasi',
              spotName: spotToVisit.name,
              message: 'Gagal membaca posisi GPS dari browser/HP. Kamu dapat mengklik tombol "Check-in di Titik Ini" di bawah untuk tetap melanjutkan Check-in.',
            });
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleLeaveParty = async () => {
    if (!currentUser || !currentParty) return;
    const partyId = currentParty.id;
    const myUid = currentUser.uid;

    try {
      // 1. Clear active party ID from user document immediately
      await setDoc(doc(db, 'users', myUid), { currentPartyId: null }, { merge: true });

      // 2. Read fresh party data from Firestore to avoid stale memberIds
      const freshPartySnap = await getDoc(doc(db, 'parties', partyId));
      if (!freshPartySnap.exists()) {
        // Party already deleted — nothing to do
        setCurrentParty(null);
        return;
      }

      const freshPartyData = freshPartySnap.data();
      const freshMemberIds: string[] = freshPartyData.memberIds || [];
      const remainingMembers = freshMemberIds.filter((uid) => uid !== myUid);

      // 3. Auto Cleanup: If NO members left, delete the empty party document
      if (remainingMembers.length === 0) {
        await deleteDoc(doc(db, 'parties', partyId));
      } else {
        // Remove user from memberIds AND memberNames
        const updates: Record<string, any> = {
          memberIds: arrayRemove(myUid),
          [`memberNames.${myUid}`]: null, // delete from map
        };

        // Auto Ownership Transfer: If Leader left, assign leader role to next remaining member
        if (freshPartyData.ownerId === myUid && remainingMembers.length > 0) {
          updates.ownerId = remainingMembers[0];
        }

        await updateDoc(doc(db, 'parties', partyId), updates);
      }
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
      const currentLevel = typeof prev?.level === 'number' && !isNaN(prev.level) && prev.level > 0 ? prev.level : 1;
      const currentXp = typeof prev?.xp === 'number' && !isNaN(prev.xp) ? prev.xp : 0;
      const currentNextXp =
        typeof prev?.nextLevelXp === 'number' && !isNaN(prev.nextLevelXp) && prev.nextLevelXp > 0
          ? prev.nextLevelXp
          : currentLevel * 100 + 200;

      let newXp = currentXp + (typeof amount === 'number' && !isNaN(amount) ? amount : 100);
      let newLevel = currentLevel;
      let nextXp = currentNextXp;
      let leveledUp = false;

      while (newXp >= nextXp) {
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
            nextLevelXp: updated.nextLevelXp,
            title: updated.title,
          },
          { merge: true }
        ).catch(() => {});
      }

      return updated;
    });
  };
  // Selalu sync ref ke fungsi terbaru agar closure di useEffect tidak stale
  addXpRef.current = addXp;

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
      // Fingerprint lokasi dengan presisi ~100m (3 desimal = ~111m di ekuator)
      const locKey = `${newSpot.lat.toFixed(3)}_${newSpot.lng.toFixed(3)}`;
      const alreadyEarned = profile.earnedXpLocations?.includes(locKey);

      if (!alreadyEarned) {
        // Award +100 XP hanya jika lokasi ini belum pernah menghasilkan XP
        addXp(100);

        // Catat fingerprint ke profile lokal
        setProfile((prev) => ({
          ...prev,
          earnedXpLocations: Array.from(new Set([...(prev.earnedXpLocations || []), locKey])),
        }));

        // Simpan ke Firestore agar persisten (tidak bisa di-reset dengan hapus spot)
        if (currentUser) {
          updateDoc(doc(db, 'users', currentUser.uid), {
            earnedXpLocations: arrayUnion(locKey),
          }).catch(() => {});
        }
      }
      // Jika alreadyEarned: diam-diam skip XP — tidak ada notifikasi error, hanya tidak bertambah
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
      // Cek radius 100m sebelum membuka form tambah — jika sudah ada spot, blokir
      const nearby = findNearbySpot50m(lat, lng, spots, undefined, 100);
      if (nearby) {
        setIsAddingMode(false);
        setNearbySpotDialog(nearby);
        return;
      }
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
          // Cek radius 100m: jika sudah ada spot dekat lokasi GPS, blokir tambah
          const nearbyFromGps = findNearbySpot50m(userLat, userLng, spots, undefined, 100);
          if (nearbyFromGps) {
            setMapCenter([userLat, userLng]);
            setNearbySpotDialog(nearbyFromGps);
            soundFx.playClick();
            return;
          }
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
      visitedSpotIds: [],
      earnedXpLocations: [], // Reset anti-farming: bisa dapat XP lagi di lokasi lama
    };

    setSpots([]);
    setProfile(defaultProfile);
    localStorage.removeItem(STORAGE_KEY_SPOTS);
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    setMapCenter([-6.2088, 106.8456]);
    setSelectedSpot(null);

    if (currentUser) {
      // setDoc tanpa merge agar earnedXpLocations & visitedSpotIds benar-benar terhapus di Firestore
      setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        name: defaultProfile.name,
        level: 1,
        xp: 0,
        nextLevelXp: 100,
        title: defaultProfile.title,
        visitedSpotIds: [],
        earnedXpLocations: [],
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    }
  };

  // Hitung spot yang dapat diakses user (milik sendiri / sudah check-in / spot squad)
  const myUid = currentUser?.uid;
  const accessibleSpotCount = spots.filter((spot) => {
    if (!myUid) return true;
    const isOwner = spot.ownerId === myUid || !spot.ownerId;
    const isVisitedViaSpot = spot.visitedUserIds?.includes(myUid);
    const isVisitedViaProfile = profile?.visitedSpotIds?.includes(spot.id);
    const isSquadSpot = currentParty?.id && spot.partyId === currentParty.id;
    return isOwner || isVisitedViaSpot || isVisitedViaProfile || isSquadSpot;
  }).length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#120e17] font-sans-clean select-none">
      
      {/* Splash Screen on Application Load */}
      {showSplash && (
        <SplashScreen
          onFinish={() => {
            setShowSplash(false);
            setIsHomeScreenOpen(true);
          }}
        />
      )}

      {/* Scanlines Overlay Effect for CRT Retro Feel */}
      {isScanlinesOn && <div className="absolute inset-0 scanlines z-20 pointer-events-none opacity-40" />}

      {/* Top HUD Navigation Bar */}
      <BaksoHudNavbar
        profile={profile}
        spotCount={accessibleSpotCount}
        partyName={currentParty?.name}
        currentUser={currentUser}
        onOpenMultiplayer={() => setIsMultiplayerModalOpen(true)}
        onOpenHomeScreen={() => {
          console.log('[BaksoQuest] Opening Home Screen...');
          setIsAddModalOpen(false);
          setIsDetailModalOpen(false);
          setIsProfileModalOpen(false);
          setIsJournalOpen(false);
          setIsSettingsOpen(false);
          setIsBadgesOpen(false);
          setIsMultiplayerModalOpen(false);
          setIsHomeScreenOpen(true);
          console.log('[BaksoQuest] isHomeScreenOpen set to true');
        }}
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
          currentUser={currentUser}
          profile={profile}
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
          onCheckInSpot={handleCheckInSpot}
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
      <ErrorBoundary key={isAddModalOpen ? 'add-open' : 'add-closed'} componentName="Tambah Tempat Bakso" onClose={() => setIsAddModalOpen(false)}>
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
          onProximityDetected={(nearby) => setNearbySpotDialog(nearby)}
        />
      </ErrorBoundary>

      {/* Proximity Anti-Duplication Check-in Modal */}
      <ProximityDialogModal
        isOpen={Boolean(nearbySpotDialog)}
        onClose={() => setNearbySpotDialog(null)}
        nearbySpot={nearbySpotDialog}
        onCheckIn={(spot) => {
          handleCheckInSpot(spot, true);
          setNearbySpotDialog(null);
        }}
      />

      {/* In-App RPG Check-In Notice Modal (Replaces browser alert) */}
      <CheckInNoticeModal
        isOpen={Boolean(checkInNotice)}
        onClose={() => {
          setCheckInNotice(null);
          setLastCheckInTargetSpot(null);
        }}
        notice={checkInNotice}
        onForceCheckIn={
          lastCheckInTargetSpot
            ? () => {
                handleCheckInSpot(lastCheckInTargetSpot, true);
              }
            : undefined
        }
      />

      {/* "Lihat Detail Kunjungan" Modal */}
      <SpotDetailModal
        spot={selectedSpot}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onDeleteSpot={handleDeleteSpot}
        currentUser={currentUser}
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

      {/* Hunter Profile Modal */}
      <ErrorBoundary key={isProfileModalOpen ? 'profile-open' : 'profile-closed'} componentName="Profil Hunter" onClose={() => setIsProfileModalOpen(false)}>
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
      </ErrorBoundary>

      {/* Journal / Spot List Drawer */}
      <SpotListDrawer
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        spots={spots}
        onDeleteSpot={handleDeleteSpot}
        currentUser={currentUser}
        profile={profile}
        currentPartyId={currentParty?.id}
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
      {isHomeScreenOpen && (
        <HomeScreenModal
          isOpen={true}
          onClose={() => setIsHomeScreenOpen(false)}
          profile={profile}
          spots={spots}
          currentUser={currentUser}
          onLoginGoogle={handleLoginGoogle}
          onOpenMultiplayer={() => { setIsHomeScreenOpen(false); setIsMultiplayerModalOpen(true); }}
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
      )}

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

      {/* Multiplayer Party / Squad Modal */}
      <ErrorBoundary key={isMultiplayerModalOpen ? 'multi-open' : 'multi-closed'} componentName="Kelola Squad" onClose={() => setIsMultiplayerModalOpen(false)}>
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
      </ErrorBoundary>

      {/* Level Up Celebratory Modal */}
      {levelUpInfo && (
        <ErrorBoundary componentName="Level Up Modal" onClose={() => setLevelUpInfo(null)}>
          <LevelUpModal
            isOpen={!!levelUpInfo}
            onClose={() => setLevelUpInfo(null)}
            newLevel={levelUpInfo.newLevel}
            newTitle={levelUpInfo.newTitle}
            profileName={profile?.name || 'Hunter'}
            avatarExpression={profile?.avatarExpression || 'happy'}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
