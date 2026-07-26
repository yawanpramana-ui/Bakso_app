import React, { useState, useEffect, useRef } from 'react';
import { Party, HunterProfile, BaksoSpot, ChatMessage } from '../types';
import { EXPRESSIONS } from '../data/expressions';
import { soundFx } from '../utils/audio';
import { db, doc, onSnapshot, collection, setDoc, updateDoc, arrayUnion, query, limit } from '../lib/firebase';
import {
  Users,
  UserCheck,
  Plus,
  LogIn,
  Copy,
  Check,
  LogOut,
  X,
  Sparkles,
  Share2,
  Globe,
  Lock,
  ShieldAlert,
  Trophy,
  Crown,
  Medal,
  Flame,
  Zap,
  Award,
  MapPin,
  TrendingUp,
  MessageSquare,
  Send,
} from 'lucide-react';

interface MultiplayerPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { uid: string; isAnonymous: boolean; email?: string | null; displayName?: string | null } | null;
  currentParty: Party | null;
  profile: HunterProfile;
  spots?: BaksoSpot[];
  onLoginGoogle: () => void;
  onCreateParty: (partyName: string) => Promise<void>;
  onJoinPartyByCode: (inviteCode: string) => Promise<boolean>;
  onLeaveParty: () => Promise<void>;
  onOpenAddModal?: () => void;
}

interface MemberProfileData {
  level: number;
  xp: number;
  name?: string;
  avatarExpression?: string;
}

interface RankedMember {
  uid: string;
  name: string;
  level: number;
  xp: number;
  spotsCount: number;
  totalScore: number;
  isOwner: boolean;
  isMe: boolean;
  avatarExpression?: string;
  rank: number;
}

export const MultiplayerPartyModal: React.FC<MultiplayerPartyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentParty,
  profile,
  spots = [],
  onLoginGoogle,
  onCreateParty,
  onJoinPartyByCode,
  onLeaveParty,
  onOpenAddModal,
}) => {
  const [activeTab, setActiveTab] = useState<'ranking' | 'members' | 'chat'>('ranking');
  const [newPartyName, setNewPartyName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Realtime profiles for all squad members
  const [memberProfiles, setMemberProfiles] = useState<Record<string, MemberProfileData>>({});

  // Realtime Squad Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentParty || !isOpen) return;

    const unsubs: (() => void)[] = [];
    const profilesMap: Record<string, MemberProfileData> = {};

    currentParty.memberIds.forEach((uid) => {
      // Set default for current user immediately
      if (uid === currentUser?.uid) {
        profilesMap[uid] = {
          level: profile.level,
          xp: profile.xp,
          name: profile.name,
          avatarExpression: profile.avatarExpression,
        };
      }

      try {
        const uRef = doc(db, 'users', uid);
        const unsub = onSnapshot(uRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            profilesMap[uid] = {
              level: data.level || 1,
              xp: data.xp || 0,
              name: data.name || currentParty.memberNames?.[uid],
              avatarExpression: data.avatarExpression,
            };
            setMemberProfiles((prev) => ({ ...prev, [uid]: profilesMap[uid] }));
          }
        });
        unsubs.push(unsub);
      } catch {
        // ignore
      }
    });

    setMemberProfiles((prev) => ({ ...profilesMap, ...prev }));

    // Merge currentParty.messages if available
    if (currentParty.messages && Array.isArray(currentParty.messages)) {
      setMessages((prev) => {
        const map = new Map<string, ChatMessage>();
        prev.forEach((m) => map.set(m.id || `${m.senderName}-${m.createdAt}`, m));
        currentParty.messages!.forEach((m) => map.set(m.id || `${m.senderName}-${m.createdAt}`, m));
        return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
      });
    }

    // Listen to realtime chat subcollection
    try {
      const msgRef = collection(db, 'parties', currentParty.id, 'messages');
      const chatUnsub = onSnapshot(
        msgRef,
        (snapshot) => {
          const msgs: ChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            msgs.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
          });
          // Sort by timestamp ascending locally (index-free realtime sync)
          msgs.sort((a, b) => a.createdAt - b.createdAt);
          setMessages((prev) => {
            const map = new Map<string, ChatMessage>();
            prev.forEach((m) => map.set(m.id || `${m.senderName}-${m.createdAt}`, m));
            msgs.forEach((m) => map.set(m.id || `${m.senderName}-${m.createdAt}`, m));
            return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
          });
          setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        },
        (err) => {
          console.warn('Realtime chat listener error:', err);
        }
      );
      unsubs.push(chatUnsub);
    } catch (err) {
      console.warn('Error initiating chat listener:', err);
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [currentParty?.id, currentParty?.memberIds, currentParty?.messages, isOpen, currentUser?.uid, profile.level, profile.xp, profile.name]);

  const handleSendMessage = async (textToSend?: string) => {
    const msgText = (textToSend || chatInput).trim();
    if (!msgText || !currentParty) return;

    soundFx.playClick();
    setChatInput('');

    const senderUid = currentUser?.uid || 'guest-' + Date.now();
    const senderName = profile.name || 'Hunter';
    const createdAt = Date.now();
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newMsgObj: ChatMessage = {
      id: msgId,
      partyId: currentParty.id,
      senderUid,
      senderName,
      senderAvatar: profile.avatarExpression || 'happy',
      text: msgText,
      createdAt,
    };

    // Optimistic UI update so message shows up IMMEDIATELY locally
    setMessages((prev) => {
      const exists = prev.some(
        (m) => m.id === msgId || (m.text === msgText && m.senderName === senderName && Math.abs(m.createdAt - createdAt) < 2000)
      );
      if (exists) return prev;
      return [...prev, newMsgObj];
    });

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      // 1. Update party doc directly so App.tsx snapshot listener receives instant update for ALL members
      await updateDoc(doc(db, 'parties', currentParty.id), {
        messages: arrayUnion(newMsgObj),
      });
    } catch (e) {
      // ignore
    }

    try {
      // 2. Also save to subcollection as backup
      await setDoc(doc(db, 'parties', currentParty.id, 'messages', msgId), newMsgObj);
    } catch (err) {
      console.warn('Error sending chat message to Firestore subcollection:', err);
    }
  };

  if (!isOpen) return null;

  // Compute Ranked Members
  const rankedMembers: RankedMember[] = currentParty
    ? currentParty.memberIds
        .map((uid) => {
          const uData = memberProfiles[uid] || {
            level: uid === currentUser?.uid ? profile.level : 1,
            xp: uid === currentUser?.uid ? profile.xp : 0,
            name: currentParty.memberNames?.[uid] || `Hunter #${uid.slice(0, 4)}`,
          };
          const name = uData.name || currentParty.memberNames?.[uid] || 'Hunter';

          // Count spots contributed by this member
          const spotsCount = spots.filter(
            (s) => s.ownerId === uid || (s.addedByName && s.addedByName.toLowerCase() === name.toLowerCase())
          ).length;

          const level = uData.level || 1;
          const xp = uData.xp || 0;
          const totalScore = level * 1000 + xp + spotsCount * 150;

          return {
            uid,
            name,
            level,
            xp,
            spotsCount,
            totalScore,
            isOwner: uid === currentParty.ownerId,
            isMe: uid === currentUser?.uid,
            avatarExpression: uData.avatarExpression,
            rank: 0,
          };
        })
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((item, idx) => ({ ...item, rank: idx + 1 }))
    : [];

  const myRank = rankedMembers.find((m) => m.isMe);

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;
    soundFx.playClick();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onCreateParty(newPartyName.trim());
      setNewPartyName('');
      soundFx.playSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal membuat Squad Party.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    soundFx.playClick();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const success = await onJoinPartyByCode(joinCodeInput.trim());
      if (success) {
        setJoinCodeInput('');
        soundFx.playSuccess();
      } else {
        setErrorMsg('Kode invite tidak ditemukan. Pastikan 6 karakter kode sudah benar.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal bergabung ke Squad.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (!currentParty) return;
    soundFx.playClick();
    navigator.clipboard.writeText(currentParty.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const copyInviteLink = () => {
    if (!currentParty) return;
    soundFx.playClick();
    const url = `${window.location.origin}?party=${currentParty.inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-pixel">
      <div className="relative w-full max-w-2xl bg-[#1e1726] border-4 border-[#ffd700] rounded-3xl p-5 sm:p-7 text-amber-100 shadow-2xl space-y-5 pixel-border-gold max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-amber-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#800000] border-2 border-[#ffd700] flex items-center justify-center text-xl shadow">
              ⚔️
            </div>
            <div>
              <h2 className="text-sm sm:text-base text-[#ffd700] font-bold flex items-center gap-2">
                <span>SQUAD MULTIPLAYER & RANKING</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h2>
              <p className="text-[10px] text-amber-300/80">
                Berbagi Lokasi Bakso & Adu Peringkat Pemburu Terbaik!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-amber-950 hover:bg-red-900 border border-amber-700 text-amber-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Auth Status Banner */}
        <div className="bg-[#181320] p-3.5 rounded-2xl border border-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#281f33] border border-amber-600 flex items-center justify-center text-amber-300">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-amber-200 font-bold flex flex-wrap items-center gap-1.5">
                <span className="truncate max-w-[160px] sm:max-w-[240px]">Pemain: {profile.name}</span>
                {currentUser?.isAnonymous ? (
                  <span className="text-[9px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800 shrink-0">
                    Akun Tamu (Anonim)
                  </span>
                ) : (
                  <span className="text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700 shrink-0">
                    Google Connected
                  </span>
                )}
              </div>
              <p className="text-[10px] text-amber-400/80 mt-0.5 break-all sm:break-words">
                {currentUser?.email || 'Progress tersimpan di cloud database secara otomatis.'}
              </p>
            </div>
          </div>

          {currentUser?.isAnonymous && (
            <button
              onClick={() => {
                soundFx.playClick();
                onLoginGoogle();
              }}
              className="px-3 py-1.5 bg-[#4285F4] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 shrink-0 self-end sm:self-auto active:translate-y-0.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Hubungkan Google</span>
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-600 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ACTIVE PARTY SECTION OR CREATE / JOIN FORM */}
        {currentParty ? (
          /* ACTIVE SQUAD HUD WITH RANKING TABS */
          <div className="bg-[#281f33] p-4 sm:p-5 rounded-2xl border-2 border-[#ffd700] shadow-lg space-y-4">
            {/* Squad Header Info & Leave Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-800 pb-3">
              <div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-2.5 py-0.5 rounded-full font-bold">
                  🟢 SQUAD AKTIF: {currentParty.name}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-base sm:text-lg text-[#ffd700] font-bold">
                    {currentParty.name}
                  </h3>
                  {myRank && (
                    <span className="text-xs bg-[#800000] text-[#ffd700] border border-[#ffd700] px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-300" />
                      <span>Rank #{myRank.rank} Anda</span>
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={async () => {
                  soundFx.playClick();
                  await onLeaveParty();
                }}
                className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 rounded-xl text-xs flex items-center gap-1 self-end sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Squad</span>
              </button>
            </div>

            {/* TAB SWITCHER: PERINGKAT vs ANGGOTA vs CHAT */}
            <div className="flex items-center gap-1.5 p-1 bg-[#181320] rounded-xl border border-amber-900">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab('ranking');
                }}
                className={`flex-1 py-2 px-2 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'ranking'
                    ? 'bg-[#800000] text-[#ffd700] border border-[#ffd700] shadow-md'
                    : 'text-amber-300 hover:text-amber-100 hover:bg-amber-950/50'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-[#ffd700] shrink-0" />
                <span>🏆 PERINGKAT</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab('members');
                }}
                className={`flex-1 py-2 px-2 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'members'
                    ? 'bg-[#800000] text-[#ffd700] border border-[#ffd700] shadow-md'
                    : 'text-amber-300 hover:text-amber-100 hover:bg-amber-950/50'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>👥 ANGGOTA ({currentParty.memberIds.length})</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab('chat');
                }}
                className={`flex-1 py-2 px-2 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
                  activeTab === 'chat'
                    ? 'bg-[#800000] text-[#ffd700] border border-[#ffd700] shadow-md'
                    : 'text-amber-300 hover:text-amber-100 hover:bg-amber-950/50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>💬 CHAT SQUAD</span>
              </button>
            </div>

            {/* TAB 1: PERINGKAT SQUAD (PARTY RANKING VIEW) */}
            {activeTab === 'ranking' && (
              <div className="space-y-4 animate-fade-in">
                {/* Ranking Top Banner */}
                <div className="bg-gradient-to-r from-amber-950/80 via-[#2d1b15] to-amber-950/80 p-3.5 rounded-xl border border-amber-600/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[#ffd700] animate-bounce" />
                    <div>
                      <span className="text-[#ffd700] font-bold block text-xs">
                        LEADERBOARD PEMBURU BAKSO SQUAD
                      </span>
                      <p className="text-[10px] text-amber-200/80">
                        Peringkat dihitung dari Level, XP, dan Jumlah Spot Bakso yang dibagikan.
                      </p>
                    </div>
                  </div>

                  {onOpenAddModal && (
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onOpenAddModal();
                      }}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-400 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Spot (+100 XP)</span>
                    </button>
                  )}
                </div>

                {/* PODIUM TOP 3 PLAYERS (IF MULTIPLE MEMBERS) */}
                {rankedMembers.length > 1 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {/* 2nd Place */}
                    {rankedMembers[1] ? (
                      <div className="bg-[#1c2230] p-3 rounded-2xl border-2 border-slate-400 text-center flex flex-col justify-between space-y-1 shadow-lg">
                        <div className="text-xl">🥈</div>
                        <span className="text-[10px] text-slate-300 font-bold uppercase truncate block">
                          {rankedMembers[1].name}
                        </span>
                        <div className="text-[11px] text-amber-300 font-bold">
                          Lv.{rankedMembers[1].level}
                        </div>
                        <div className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">
                          📍 {rankedMembers[1].spotsCount} Spot
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/30 rounded-2xl border border-dashed border-amber-900/50 p-2 text-center text-[10px] text-amber-600/60 my-auto">
                        Slot 2 Kosong
                      </div>
                    )}

                    {/* 1st Place */}
                    {rankedMembers[0] && (
                      <div className="bg-gradient-to-b from-[#4a3400] to-[#2a1c00] p-3 rounded-2xl border-2 border-[#ffd700] text-center flex flex-col justify-between space-y-1 shadow-xl -translate-y-1">
                        <div className="text-2xl animate-pulse">👑</div>
                        <span className="text-xs text-[#ffd700] font-bold uppercase truncate block">
                          {rankedMembers[0].name}
                        </span>
                        <div className="text-xs text-amber-200 font-bold">
                          Lv.{rankedMembers[0].level}
                        </div>
                        <div className="text-[10px] bg-[#800000] px-2 py-0.5 rounded text-[#ffd700] font-bold border border-[#ffd700]">
                          📍 {rankedMembers[0].spotsCount} Spot
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {rankedMembers[2] ? (
                      <div className="bg-[#2d1e18] p-3 rounded-2xl border-2 border-amber-700 text-center flex flex-col justify-between space-y-1 shadow-lg">
                        <div className="text-xl">🥉</div>
                        <span className="text-[10px] text-amber-300 font-bold uppercase truncate block">
                          {rankedMembers[2].name}
                        </span>
                        <div className="text-[11px] text-amber-300 font-bold">
                          Lv.{rankedMembers[2].level}
                        </div>
                        <div className="text-[9px] bg-amber-950 px-1.5 py-0.5 rounded text-amber-400 border border-amber-900">
                          📍 {rankedMembers[2].spotsCount} Spot
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/30 rounded-2xl border border-dashed border-amber-900/50 p-2 text-center text-[10px] text-amber-600/60 my-auto">
                        Slot 3 Kosong
                      </div>
                    )}
                  </div>
                )}

                {/* FULL RANKED MEMBERS LIST */}
                <div className="space-y-2">
                  <h4 className="text-xs text-amber-300 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#ffd700]" />
                      <span>DAFTAR PERINGKAT SEMUA PEMBURU</span>
                    </span>
                    <span className="text-[10px] text-amber-400/80 font-normal">
                      {rankedMembers.length} Pemburu
                    </span>
                  </h4>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {rankedMembers.map((member) => {
                      const isTop3 = member.rank <= 3;
                      const medalEmoji =
                        member.rank === 1 ? '🥇' : member.rank === 2 ? '🥈' : member.rank === 3 ? '🥉' : `#${member.rank}`;

                      return (
                        <div
                          key={member.uid}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                            member.isMe
                              ? 'bg-[#3b281c] border-[#ffd700] ring-2 ring-[#ffd700]/50 shadow-md'
                              : isTop3
                              ? 'bg-[#221a2c] border-amber-700/80'
                              : 'bg-[#181320] border-amber-900/60'
                          }`}
                        >
                          {/* Rank & Name */}
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${
                                member.rank === 1
                                  ? 'bg-[#ffd700] text-black border-[#ffd700]'
                                  : member.rank === 2
                                  ? 'bg-slate-300 text-black border-slate-300'
                                  : member.rank === 3
                                  ? 'bg-amber-700 text-amber-100 border-amber-700'
                                  : 'bg-amber-950 text-amber-300 border-amber-800'
                              }`}
                            >
                              {medalEmoji}
                            </span>

                            <div>
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className={member.isMe ? 'text-[#ffd700]' : 'text-amber-100'}>
                                  {member.name}
                                </span>
                                {member.isMe && (
                                  <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-600 px-1.5 py-0.2 rounded font-normal">
                                    Anda
                                  </span>
                                )}
                                {member.isOwner && (
                                  <span className="text-[9px] bg-[#800000] text-[#ffd700] border border-[#ffd700] px-1.5 py-0.2 rounded">
                                    Leader 👑
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-amber-400/80 mt-0.5">
                                <span className="text-amber-300 font-bold">Level {member.level}</span>
                                <span>•</span>
                                <span>{member.xp} XP</span>
                              </div>
                            </div>
                          </div>

                          {/* Stats Badge */}
                          <div className="flex items-center gap-2 text-right">
                            <div className="bg-[#181320] px-2.5 py-1 rounded-lg border border-amber-800 text-[11px] text-amber-200">
                              <span className="font-bold text-[#ffd700]">📍 {member.spotsCount}</span>
                              <span className="text-[9px] text-amber-400 ml-1">Spot</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ANGGOTA & INVITE LINK */}
            {activeTab === 'members' && (
              <div className="space-y-4 animate-fade-in">
                {/* Invite Code & Share Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#181320] p-3 rounded-xl border border-amber-900">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold block mb-1">
                      KODE INVITE SQUAD:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="bg-black/60 px-3 py-1.5 rounded-lg border border-amber-600 text-[#ffd700] font-mono text-base font-bold tracking-widest">
                        {currentParty.inviteCode}
                      </span>
                      <button
                        onClick={copyInviteCode}
                        className="p-2 bg-amber-900 hover:bg-amber-800 text-amber-200 rounded-lg border border-amber-700 active:scale-95"
                        title="Salin Kode Invite"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-amber-400 font-bold block mb-1">
                      BAGIKAN LINK INVITE TEMAN:
                    </span>
                    <button
                      onClick={copyInviteLink}
                      className="w-full py-2 px-3 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 border border-emerald-500 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 shadow"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link Undangan'}</span>
                    </button>
                  </div>
                </div>

                {/* Members Grid */}
                <div>
                  <h4 className="text-xs text-amber-300 font-bold mb-2 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#ffd700]" />
                    <span>ANGGOTA SQUAD TERDAFTAR ({currentParty.memberIds.length} PEMBURU)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentParty.memberIds.map((memberId, idx) => {
                      const name = currentParty.memberNames?.[memberId] || `Hunter #${idx + 1}`;
                      const isOwner = memberId === currentParty.ownerId;
                      const isMe = memberId === currentUser?.uid;

                      return (
                        <div
                          key={memberId}
                          className="p-2.5 bg-[#181320] rounded-xl border border-amber-900/80 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-950 border border-amber-700 flex items-center justify-center text-[10px] font-bold text-amber-300">
                              {idx + 1}
                            </span>
                            <span className="text-amber-100 font-bold">
                              {name} {isMe && '(Anda)'}
                            </span>
                          </div>
                          {isOwner && (
                            <span className="text-[9px] bg-[#800000] text-[#ffd700] px-2 py-0.5 rounded border border-[#ffd700] font-bold">
                              LEADER 👑
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Multiplayer Behavior Explanation */}
                <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl text-[11px] text-amber-200/90 leading-relaxed">
                  💡 <strong>INFO MULTIPLAYER:</strong> Semua titik bakso baru yang Anda atau anggota squad tambahkan akan otomatis muncul secara real-time di peta teman-teman squad Anda!
                </div>
              </div>
            )}

            {/* TAB 3: OBROLAN SQUAD (LIVE CHAT VIEW) */}
            {activeTab === 'chat' && (
              <div className="space-y-3 animate-fade-in">
                {/* Preset RPG Quick Messages */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                  <span className="text-amber-400 font-pixel text-[9px] shrink-0">Pesan Cepat:</span>
                  {[
                    '🍲 Yuk gass mampir makan bakso!',
                    '📍 Ada spot bakso enak baru nih!',
                    '🔥 Sambalnya pedas gila!',
                    '🏆 Siapa top hunter minggu ini?',
                    '⚔️ Siap meluncur ke lokasi!',
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleSendMessage(preset)}
                      className="px-2 py-1 bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700 rounded-lg shrink-0 font-arcade transition-all active:scale-95"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Message Log Box */}
                <div className="bg-[#181320] border-2 border-amber-800 rounded-2xl p-3 h-64 overflow-y-auto space-y-2.5 shadow-inner">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-amber-300/50 space-y-1">
                      <span className="text-2xl">💬</span>
                      <p className="text-xs font-pixel">Belum ada pesan di Obrolan Squad.</p>
                      <p className="text-[10px] font-sans-clean text-amber-400/60">
                        Kirim pesan pertama atau gunakan tombol Pesan Cepat di atas!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe =
                        (currentUser?.uid && msg.senderUid === currentUser.uid) ||
                        (msg.senderName && msg.senderName === profile.name);
                      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const exprData = EXPRESSIONS[msg.senderAvatar] || EXPRESSIONS.happy;

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-sm border shadow shrink-0"
                            style={{ backgroundColor: exprData.bgHex, borderColor: exprData.borderColor }}
                          >
                            {exprData.emoji}
                          </div>

                          <div
                            className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs border shadow ${
                              isMe
                                ? 'bg-[#800000] text-[#ffd700] border-[#ffd700] rounded-tr-none'
                                : 'bg-[#281f33] text-amber-100 border-amber-700 rounded-tl-none'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5 text-[9px]">
                              <span className={isMe ? 'font-bold text-[#ffd700]' : 'font-bold text-amber-300'}>
                                {msg.senderName}
                              </span>
                              <span className="opacity-60 text-[8px] font-arcade">{timeStr}</span>
                            </div>
                            <p className="break-words font-sans-clean text-xs leading-snug">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Tulis pesan ke squad..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-[#181320] border-2 border-amber-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-amber-100 placeholder-amber-400/40 outline-none transition-colors font-sans-clean"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-amber-950 font-bold text-xs rounded-xl border border-amber-200 shadow flex items-center gap-1 active:translate-y-0.5 transition-all font-pixel"
                  >
                    <span>Kirim</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* CREATE OR JOIN SQUAD FORM */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Party */}
            <form
              onSubmit={handleCreateParty}
              className="bg-[#281f33] p-4 sm:p-5 rounded-2xl border border-amber-700 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#ffd700]">
                  <Plus className="w-5 h-5" />
                  <h3 className="text-sm font-bold">BUAT SQUAD BAKSO BARU</h3>
                </div>
                <p className="text-[10px] text-amber-300/80 leading-relaxed">
                  Buat grup hunter kuliner baru dan dapatkan Kode Invite unik untuk mengundang teman-teman Anda.
                </p>
                <div>
                  <label className="text-[10px] text-amber-400 block mb-1">NAMA SQUAD / GRUP:</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Squad Bakso Jakarta"
                    value={newPartyName}
                    onChange={(e) => setNewPartyName(e.target.value)}
                    className="w-full p-2.5 bg-[#181320] border border-[#ffd700] rounded-xl text-xs text-amber-100 placeholder-amber-600/70 focus:border-[#ffd700] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#800000] hover:bg-red-800 text-[#ffd700] border-2 border-[#ffd700] rounded-xl text-xs font-bold shadow-lg active:translate-y-0.5 flex items-center justify-center gap-1.5"
              >
                <span>BUAT SQUAD BAKSO</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </button>
            </form>

            {/* Join Party */}
            <form
              onSubmit={handleJoinParty}
              className="bg-[#281f33] p-4 sm:p-5 rounded-2xl border border-amber-700 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <LogIn className="w-5 h-5" />
                  <h3 className="text-sm font-bold">GABUNG SQUAD LEWAT KODE</h3>
                </div>
                <p className="text-[10px] text-amber-300/80 leading-relaxed">
                  Punya Kode Invite dari teman? Masukkan 6 karakter kode di bawah untuk langsung bergabung & adu ranking!
                </p>
                <div>
                  <label className="text-[10px] text-amber-400 block mb-1">MASUKKAN KODE INVITE:</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="misal: BK9X82"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="w-full p-2.5 bg-[#181320] border border-amber-700 rounded-xl text-xs text-center font-mono font-bold tracking-widest text-[#ffd700] placeholder-amber-600/70 focus:border-[#ffd700] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white border-2 border-emerald-300 rounded-xl text-xs font-bold shadow-lg active:translate-y-0.5 flex items-center justify-center gap-1.5"
              >
                <span>GABUNG SQUAD SEKARANG</span>
                <Users className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Solo vs Multiplayer Guarantee Note */}
        <div className="bg-[#181320] p-3 rounded-2xl border border-amber-900/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-amber-300 font-bold block">Progress Pribadi Mandiri</span>
              <p className="text-amber-200/80 text-[10px]">
                Jika Anda tidak join Squad / Invite siapa pun, semua titik Bakso & level progress Anda bersifat privat & eksklusif hanya untuk Anda.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-emerald-300 font-bold block">Kolaborasi Berbagi Peta</span>
              <p className="text-amber-200/80 text-[10px]">
                Begitu di-invite ke Squad, semua anggota dapat menambah & menandai warung bakso favorit bersama di satu peta terintegrasi!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
