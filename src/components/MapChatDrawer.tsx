import React, { useState, useEffect, useRef } from 'react';
import { Party, HunterProfile, ChatMessage } from '../types';
import { EXPRESSIONS } from '../data/expressions';
import { soundFx } from '../utils/audio';
import { db, doc, collection, setDoc, addDoc, updateDoc, arrayUnion, onSnapshot } from '../lib/firebase';
import { MessageSquare, Send, X, Users, Globe, Sparkles } from 'lucide-react';

interface MapChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentParty: Party | null;
  currentUser: { uid: string; isAnonymous?: boolean; displayName?: string | null } | null;
  profile: HunterProfile;
  onOpenMultiplayerModal: () => void;
}

export const MapChatDrawer: React.FC<MapChatDrawerProps> = ({
  isOpen,
  onClose,
  currentParty,
  currentUser,
  profile,
  onOpenMultiplayerModal,
}) => {
  const [activeChannel, setActiveChannel] = useState<'global' | 'squad'>('global');
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>([]);
  const [squadMessages, setSquadMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Listen to Realtime Global Public Messages via Single Document Room (Index-Free & Instant)
  useEffect(() => {
    if (!isOpen) return;

    let unsubGlobal: (() => void) | null = null;
    try {
      const roomRef = doc(db, 'global_chat', 'room');
      unsubGlobal = onSnapshot(
        roomRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const msgs: ChatMessage[] = (data.messages || []) as ChatMessage[];
            msgs.sort((a, b) => a.createdAt - b.createdAt);
            setGlobalMessages(msgs);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
        },
        (err) => console.warn('Global chat room listener error:', err)
      );
    } catch (err) {
      console.warn('Error initiating global chat room listener:', err);
    }

    return () => {
      if (unsubGlobal) unsubGlobal();
    };
  }, [isOpen]);

  // 2. Listen to Realtime Squad Messages
  useEffect(() => {
    if (!isOpen || !currentParty?.id) return;

    if (currentParty.messages && Array.isArray(currentParty.messages)) {
      setSquadMessages((prev) => {
        const map = new Map<string, ChatMessage>();
        prev.forEach((m) => map.set(m.id || `${m.senderName}-${m.createdAt}`, m));
        currentParty.messages!.forEach((m) => map.set(m.id || `${m.senderName}-${m.createdAt}`, m));
        return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
      });
    }

    let unsubSquad: (() => void) | null = null;
    try {
      const msgRef = collection(db, 'parties', currentParty.id, 'messages');
      unsubSquad = onSnapshot(
        msgRef,
        (snapshot) => {
          const msgs: ChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            msgs.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
          });
          msgs.sort((a, b) => a.createdAt - b.createdAt);
          setSquadMessages((prev) => {
            const map = new Map<string, ChatMessage>();
            prev.forEach((m) => map.set(m.id || `${m.senderName}-${m.createdAt}`, m));
            msgs.forEach((m) => map.set(m.id || `${m.senderName}-${m.createdAt}`, m));
            return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
          });
          if (activeChannel === 'squad') {
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
        },
        (err) => console.warn('Squad chat listener error:', err)
      );
    } catch {
      // ignore
    }

    return () => {
      if (unsubSquad) unsubSquad();
    };
  }, [isOpen, currentParty?.id, currentParty?.messages, activeChannel]);

  if (!isOpen) return null;

  const activeMessages = activeChannel === 'global' ? globalMessages : squadMessages;

  const handleSendMessage = async (textToSend?: string) => {
    const msgText = (textToSend || chatInput).trim();
    if (!msgText) return;

    soundFx.playClick();
    setChatInput('');

    const senderUid = currentUser?.uid || 'guest-' + Date.now();
    const senderName = profile.name || 'Hunter';
    const createdAt = Date.now();
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newMsgObj: Record<string, any> = {
      id: msgId,
      senderUid,
      senderName,
      senderAvatar: profile.avatarExpression || 'happy',
      text: msgText,
      createdAt,
      channel: activeChannel,
    };

    if (activeChannel === 'squad' && currentParty?.id) {
      newMsgObj.partyId = currentParty.id;
    }

    // Optimistic local state update
    if (activeChannel === 'global') {
      setGlobalMessages((prev) => {
        const exists = prev.some(
          (m) => m.id === msgId || (m.text === msgText && m.senderName === senderName && Math.abs(m.createdAt - createdAt) < 2000)
        );
        if (exists) return prev;
        return [...prev, newMsgObj];
      });
    } else {
      setSquadMessages((prev) => {
        const exists = prev.some(
          (m) => m.id === msgId || (m.text === msgText && m.senderName === senderName && Math.abs(m.createdAt - createdAt) < 2000)
        );
        if (exists) return prev;
        return [...prev, newMsgObj];
      });
    }

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    // Save to Firestore Database
    if (activeChannel === 'global') {
      try {
        await setDoc(
          doc(db, 'global_chat', 'room'),
          {
            messages: arrayUnion(newMsgObj),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Error saving global chat message to room doc:', err);
      }
      try {
        await addDoc(collection(db, 'global_messages'), newMsgObj);
      } catch {
        // ignore
      }
    } else if (currentParty) {
      try {
        await updateDoc(doc(db, 'parties', currentParty.id), {
          messages: arrayUnion(newMsgObj),
        });
      } catch {
        // ignore
      }
      try {
        await setDoc(doc(db, 'parties', currentParty.id, 'messages', msgId), newMsgObj);
      } catch {
        // ignore
      }
    }
  };

  const globalPresets = [
    '🌐 Hai Hunter Bakso Nusantara!',
    '🍲 Rekomendasi bakso daerah mana guys?',
    '📍 Cari squad hunting bakso nih!',
    '🔥 Sambal level 5 tidak ada lawan!',
  ];

  const squadPresets = [
    '🍲 Yuk gass bakso!',
    '📍 Ada spot enak baru!',
    '🔥 Sambalnya mantap!',
    '⚔️ OTW ke lokasi!',
  ];

  const currentPresets = activeChannel === 'global' ? globalPresets : squadPresets;

  return (
    <div className="absolute bottom-20 left-3 sm:left-6 z-30 w-80 sm:w-96 max-h-[58vh] bg-[#1e1726]/95 backdrop-blur-md border-3 border-amber-500 rounded-2xl shadow-2xl p-3 flex flex-col text-amber-100 font-pixel animate-fadeIn">
      {/* Header with Close */}
      <div className="flex items-center justify-between border-b border-amber-800 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-xs text-[#ffd700] font-bold truncate">
            OBROLAN REALTIME
          </span>
        </div>
        <button
          onClick={() => {
            soundFx.playClick();
            onClose();
          }}
          className="p-1 rounded-lg bg-amber-950 hover:bg-red-950 border border-amber-700 text-amber-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Channel Switcher Tabs: SEMUA (GLOBAL) vs SQUAD */}
      <div className="flex items-center gap-1.5 p-1 bg-[#181320] rounded-xl border border-amber-900 mb-2">
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveChannel('global');
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeChannel === 'global'
              ? 'bg-[#800000] text-[#ffd700] border border-[#ffd700] shadow'
              : 'text-amber-300 hover:text-amber-100 hover:bg-amber-950/50'
          }`}
        >
          <Globe className="w-3 h-3 text-sky-400 shrink-0" />
          <span>🌐 SEMUA (GLOBAL)</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveChannel('squad');
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeChannel === 'squad'
              ? 'bg-[#800000] text-[#ffd700] border border-[#ffd700] shadow'
              : 'text-amber-300 hover:text-amber-100 hover:bg-amber-950/50'
          }`}
        >
          <Users className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>⚔️ SQUAD {currentParty ? `(${currentParty.name})` : ''}</span>
        </button>
      </div>

      {/* Body Content */}
      {activeChannel === 'squad' && !currentParty ? (
        /* Prompt when user is on Squad tab but not in a party */
        <div className="py-6 px-3 text-center space-y-3 bg-[#181320] rounded-xl border border-amber-900 my-auto">
          <span className="text-3xl block">⚔️</span>
          <p className="text-xs text-amber-200">Anda belum bergabung ke Squad!</p>
          <p className="text-[10px] font-sans-clean text-amber-400/80">
            Buat squad atau masukkan kode invite untuk chatting khusus dengan teman squad Anda.
          </p>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
              onOpenMultiplayerModal();
            }}
            className="px-4 py-2 bg-[#800000] hover:bg-red-800 text-[#ffd700] border-2 border-[#ffd700] rounded-xl text-xs font-bold shadow active:scale-95 inline-flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>BUAT / GABUNG SQUAD</span>
          </button>
        </div>
      ) : (
        /* Active Channel Messages View */
        <div className="flex flex-col h-full space-y-2 min-h-0 flex-1">
          {/* Preset RPG Quick Messages */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[9px] shrink-0">
            {currentPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => handleSendMessage(preset)}
                className="px-2 py-0.5 bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700 rounded shrink-0 font-arcade transition-all active:scale-95"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Message List Box */}
          <div className="bg-[#181320] border border-amber-800/80 rounded-xl p-2.5 h-44 overflow-y-auto space-y-2 flex-1 min-h-0">
            {activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-amber-400/60 space-y-1">
                <span className="text-xl">{activeChannel === 'global' ? '🌐' : '💬'}</span>
                <p className="text-[10px]">
                  {activeChannel === 'global'
                    ? 'Belum ada obrolan di saluran Global.'
                    : 'Belum ada obrolan di Obrolan Squad.'}
                </p>
                <p className="text-[9px] font-sans-clean text-amber-400/50">
                  Jadilah pengelana pertama yang mengirim pesan!
                </p>
              </div>
            ) : (
              activeMessages.map((msg) => {
                const isMe = (currentUser?.uid && msg.senderUid === currentUser.uid) || msg.senderName === profile.name;
                const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const exprData = EXPRESSIONS[msg.senderAvatar] || EXPRESSIONS.happy;

                return (
                  <div key={msg.id} className={`flex items-start gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs border shadow shrink-0"
                      style={{ backgroundColor: exprData.bgHex, borderColor: exprData.borderColor }}
                    >
                      {exprData.emoji}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-xl px-2.5 py-1.5 text-[11px] border ${
                        isMe
                          ? 'bg-[#800000] text-[#ffd700] border-[#ffd700] rounded-tr-none'
                          : 'bg-[#281f33] text-amber-100 border-amber-700 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5 text-[8px]">
                        <span className={isMe ? 'font-bold text-[#ffd700]' : 'font-bold text-amber-300'}>
                          {msg.senderName}
                        </span>
                        <span className="opacity-60 font-arcade">{timeStr}</span>
                      </div>
                      <p className="break-words font-sans-clean leading-snug">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-1.5 shrink-0 pt-1"
          >
            <input
              type="text"
              placeholder={activeChannel === 'global' ? 'Ketik pesan ke seluruh Hunter...' : 'Ketik pesan squad...'}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-[#181320] border border-amber-800 focus:border-amber-400 rounded-xl px-2.5 py-1.5 text-xs text-amber-100 placeholder-amber-400/40 outline-none font-sans-clean"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-amber-950 font-bold text-xs rounded-xl border border-amber-200 shadow flex items-center gap-1 active:translate-y-0.5"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
