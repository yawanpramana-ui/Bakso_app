import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { BaksoSpot, ExpressionId, HunterProfile } from '../types';
import { CharacterAvatar } from './CharacterAvatar';
import { soundFx } from '../utils/audio';
import {
  Sparkles,
  Star,
  ChevronRight,
  X,
  Play,
  Maximize2,
  Minimize2,
  Monitor,
  LogIn,
  UserCheck,
  ShieldAlert,
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

  const VALID_EXPRS: ExpressionId[] = ['happy','spicy','star','shocked','cool','greedy'];
  const safeLevel = (typeof profile?.level === 'number' && !isNaN(profile.level) && profile.level > 0) ? profile.level : 1;
  const safeXp = (typeof profile?.xp === 'number' && !isNaN(profile.xp)) ? profile.xp : 0;
  const safeNextLvlXp = (typeof profile?.nextLevelXp === 'number' && !isNaN(profile.nextLevelXp) && profile.nextLevelXp > 0) ? profile.nextLevelXp : safeLevel * 100 + 200;
  const safeExpr: ExpressionId = VALID_EXPRS.includes(profile?.avatarExpression as ExpressionId) ? profile.avatarExpression as ExpressionId : 'happy';
  const safeName = profile?.name || 'Hunter Bakso';
  const safeTitle = profile?.title || 'Pemburu Amatir';
  const xpPct = Math.min(100, Math.round((safeXp / safeNextLvlXp) * 100));
  const totalSpots = Array.isArray(spots) ? spots.length : 0;
  const topSpots = (Array.isArray(spots) ? spots : []).filter((s) => s && typeof s.rating === 'number' && s.rating >= 4).slice(0, 3);
  const isGoogleConnected = !!(currentUser && !currentUser.isAnonymous);

  const toggleBrowserFullscreen = () => {
    soundFx.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsBrowserFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsBrowserFullscreen(false);
    }
  };

  const modal = (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999, overflowY: 'auto',
        backgroundColor: '#160d1f', display: 'flex', flexDirection: 'column',
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      {/* Retro dot grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(#ffd700 1px, transparent 1px)', backgroundSize:'24px 24px', opacity:0.12, pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(42,8,21,0.7), transparent 50%, rgba(13,7,20,0.9))', pointerEvents:'none' }} />

      {/* Floating emojis */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', opacity:0.3 }}>
        <span style={{ position:'absolute', top:48, left:'5%', fontSize:28 }}>🥣</span>
        <span style={{ position:'absolute', top:'22%', right:'7%', fontSize:28 }}>🌟</span>
        <span style={{ position:'absolute', bottom:'30%', left:'3%', fontSize:22 }}>🔥</span>
        <span style={{ position:'absolute', bottom:48, right:'5%', fontSize:28 }}>🏆</span>
      </div>

      {/* Scrollable content */}
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:900, margin:'0 auto', padding: isFullScreenView ? '20px 16px 56px' : '16px', boxSizing:'border-box' }}>

        {/* Header controls */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'2px solid rgba(146,64,14,0.5)', paddingBottom:10, marginBottom:18, gap:8, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ background:'#ffd700', color:'#2d1b15', fontSize:10, padding:'3px 8px', borderRadius:4, fontWeight:700, border:'1px solid #78350f' }}>GAME TITLE SCREEN</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <button onClick={() => { soundFx.playClick(); setIsFullScreenView(v => !v); }}
              style={{ padding:'5px 10px', borderRadius:10, background:'#281f33', border:'1px solid #92400e', color:'#fcd34d', fontSize:10, display:'flex', alignItems:'center', gap:5, cursor:'pointer' }}>
              <Monitor style={{ width:13, height:13 }} />
              {isFullScreenView ? 'Jendela' : 'Full Screen'}
            </button>
            <button onClick={toggleBrowserFullscreen}
              style={{ padding:'5px 10px', borderRadius:10, background:'#052e16', border:'1px solid #16a34a', color:'#6ee7b7', fontSize:10, display:'flex', alignItems:'center', gap:5, cursor:'pointer' }}>
              {isBrowserFullscreen ? <Minimize2 style={{ width:13, height:13 }} /> : <Maximize2 style={{ width:13, height:13 }} />}
              Fullscreen
            </button>
            <button onClick={() => { soundFx.playClick(); onClose(); }}
              style={{ padding:'5px 12px', borderRadius:10, background:'#800000', border:'2px solid #ffd700', color:'#ffd700', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', gap:5, cursor:'pointer' }}>
              Ke Peta <X style={{ width:13, height:13 }} />
            </button>
          </div>
        </div>

        {/* Hero banner */}
        <div style={{ background:'linear-gradient(135deg, #800000, #521319, #25101a)', border:'4px solid #ffd700', padding:'20px 24px', borderRadius:24, position:'relative', overflow:'hidden', marginBottom:16, boxShadow:'0 0 50px rgba(255,215,0,0.2)' }}>
          <span style={{ position:'absolute', right:-20, bottom:-20, fontSize:100, opacity:0.1, pointerEvents:'none' }}>🍜</span>
          {/* Character parade */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-around', background:'rgba(0,0,0,0.4)', padding:'10px 16px', borderRadius:16, border:'1px solid rgba(146,64,14,0.5)', marginBottom:16 }}>
            {([
              { expr:'happy' as ExpressionId, label:'"Kuah Gurih!"', bg:'#052e16', col:'#6ee7b7', bd:'#16a34a' },
              { expr:'spicy' as ExpressionId, label:'"Sambal Setan!"', bg:'#450a0a', col:'#fca5a5', bd:'#dc2626' },
              { expr:'star' as ExpressionId, label:'"Bintang 5!"', bg:'#451a03', col:'#fcd34d', bd:'#ffd700' },
              { expr:'cool' as ExpressionId, label:'"Squad Ready!"', bg:'#082f49', col:'#7dd3fc', bd:'#0284c7' },
            ]).map(({ expr, label, bg, col, bd }) => (
              <div key={expr} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <span style={{ background:bg, color:col, fontSize:8, padding:'2px 6px', borderRadius:6, border:`1px solid ${bd}`, fontWeight:700, whiteSpace:'nowrap' }}>💬 {label}</span>
                <CharacterAvatar expression={expr} size="md" />
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', gap:16 }}>
            <div style={{ textAlign:'center', width:'100%' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#ffd700', color:'#2d1b15', padding:'4px 14px', borderRadius:20, fontSize:9, fontWeight:700, marginBottom:10 }}>
                <Sparkles style={{ width:12, height:12 }} /> ⚔️ RETRO RPG BAKSO ADVENTURE
              </div>
              <h1 style={{ fontSize:'clamp(26px,5vw,48px)', fontWeight:900, color:'#ffd700', textShadow:'0 4px 0 #000', letterSpacing:6, margin:'4px 0 8px' }}>BAKSO QUEST</h1>
              <p style={{ fontSize:11, color:'#fde68a', fontWeight:700, letterSpacing:2, marginBottom:6 }}>LEGENDA SAMBAL & BURONAN KULINER NUSANTARA</p>
            </div>
            <button
              onClick={() => { soundFx.playSuccess(); onClose(); }}
              style={{ padding:'14px 32px', background:'#ffd700', color:'#2d1b15', fontWeight:900, fontSize:14, borderRadius:16, border:'4px solid #800000', boxShadow:'0 6px 0 #800000', cursor:'pointer', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}
            >
              <Play style={{ width:22, height:22, fill:'#800000', color:'#800000' }} />
              MULAI PETUALANGAN!
            </button>
          </div>
        </div>

        {/* Auth box */}
        <div style={{ background:'#1e1726', border:'2px solid #92400e', borderRadius:16, padding:'14px 16px', marginBottom:14 }}>
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:10, borderBottom:'1px solid rgba(146,64,14,0.4)', paddingBottom:10, marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:12, border:`2px solid ${isGoogleConnected ? '#16a34a' : '#92400e'}`, background: isGoogleConnected ? '#052e16' : '#451a03', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{isGoogleConnected ? '🔑' : '👤'}</div>
              <div>
                <h3 style={{ fontSize:11, fontWeight:700, color:'#ffd700', margin:0 }}>AUTENTIKASI HUNTER</h3>
                <p style={{ fontSize:9, color:'rgba(253,211,77,0.65)', marginTop:2 }}>
                  {isGoogleConnected ? `Login: ${currentUser?.email || 'Google User'}` : 'Login Google untuk menyimpan progress.'}
                </p>
              </div>
            </div>
            {!isGoogleConnected ? (
              <button onClick={() => { soundFx.playClick(); onLoginGoogle(); }}
                style={{ padding:'7px 16px', background:'#4285F4', color:'#fff', borderRadius:10, fontSize:10, fontWeight:700, border:'1px solid #93c5fd', cursor:'pointer', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                <LogIn style={{ width:13, height:13 }} /> MASUK GOOGLE
              </button>
            ) : (
              <button onClick={() => { soundFx.playClick(); onOpenMultiplayer(); }}
                style={{ padding:'7px 16px', background:'#052e16', color:'#6ee7b7', borderRadius:10, fontSize:10, fontWeight:700, border:'1px solid #16a34a', cursor:'pointer', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                <UserCheck style={{ width:13, height:13 }} /> Kelola Akun / Squad
              </button>
            )}
          </div>
          {!isGoogleConnected && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(120,53,15,0.2)', border:'1px solid rgba(146,64,14,0.5)', borderRadius:10, padding:'7px 10px', fontSize:9, color:'rgba(253,211,77,0.75)' }}>
              <ShieldAlert style={{ width:13, height:13, color:'#fbbf24', flexShrink:0 }} />
              <span><strong>Catatan:</strong> Anda bisa bermain sebagai Tamu. Login Google disarankan agar data tidak hilang.</span>
            </div>
          )}
        </div>

        {/* Profile card */}
        <div style={{ background:'#281f33', border:'2px solid rgba(146,64,14,0.7)', borderRadius:16, padding:'14px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <CharacterAvatar expression={safeExpr} size="lg" />
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:8 }}>
              <div>
                <h3 style={{ fontSize:14, fontWeight:700, color:'#ffd700', margin:0 }}>{safeName}</h3>
                <p style={{ fontSize:9, color:'rgba(253,211,77,0.65)', marginTop:2 }}>Gelar: <strong style={{ color:'#fde68a' }}>{safeTitle}</strong></p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:10, fontWeight:700, color:'#ffd700', background:'#800000', padding:'4px 10px', borderRadius:8, border:'1px solid #ffd700' }}>LEVEL {safeLevel}</span>
                <button onClick={() => { soundFx.playClick(); onClose(); onOpenProfile(); }}
                  style={{ fontSize:9, background:'#451a03', color:'#fcd34d', border:'1px solid #92400e', padding:'4px 8px', borderRadius:8, cursor:'pointer' }}>
                  Edit 👤
                </button>
              </div>
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'#fcd34d', fontWeight:700, marginBottom:4 }}>
                <span>EXP (XP)</span><span>{safeXp} / {safeNextLvlXp}</span>
              </div>
              <div style={{ width:'100%', height:8, background:'rgba(0,0,0,0.6)', borderRadius:20, border:'1px solid #92400e', overflow:'hidden', padding:1 }}>
                <div style={{ height:'100%', width:`${xpPct}%`, background:'linear-gradient(to right, #d97706, #ffd700, #34d399)', borderRadius:20, transition:'width 0.5s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Menu grid */}
        <div style={{ marginBottom:14 }}>
          <h3 style={{ fontSize:10, color:'#fcd34d', fontWeight:700, display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
            <Sparkles style={{ width:13, height:13, color:'#ffd700' }} /> MENU UTAMA GAME
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:10 }}>
            {[
              { emoji:'🗺️', label:'Jelajah Peta RPG', sub:'Buka lokasi bakso.', col:'#ffd700', bg:'#800000', action: () => { soundFx.playSuccess(); onClose(); } },
              { emoji:'⚔️', label:'Squad & Ranking', sub:'Multiplayer & ranking.', col:'#6ee7b7', bg:'#052e16', action: () => { soundFx.playClick(); onClose(); onOpenMultiplayer(); } },
              { emoji:'➕', label:'Tambah Spot', sub:'+XP via GPS.', col:'#fcd34d', bg:'#451a03', action: () => { soundFx.playClick(); onClose(); onOpenAddSpot(); } },
              { emoji:'📜', label:`Jurnal (${totalSpots})`, sub:'Resensi & rating.', col:'#c4b5fd', bg:'#2e1065', action: () => { soundFx.playClick(); onClose(); onOpenJournal(); } },
              { emoji:'🎖️', label:'Badges & Piala', sub:'Lencana pencapaian.', col:'#fcd34d', bg:'#451a03', action: () => { soundFx.playClick(); onClose(); onOpenBadges(); } },
              { emoji:'⚙️', label:'Pengaturan', sub:'Audio & visual.', col:'#e2e8f0', bg:'#1e293b', action: () => { soundFx.playClick(); onClose(); onOpenSettings(); } },
            ].map(({ emoji, label, sub, col, bg, action }) => (
              <button key={label} onClick={action}
                style={{ background:'#2d1b15', border:`2px solid ${col}`, borderRadius:14, padding:'12px 10px', textAlign:'left', cursor:'pointer', display:'flex', flexDirection:'column', gap:3 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:bg, border:`1px solid ${col}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, marginBottom:4 }}>{emoji}</div>
                <span style={{ fontSize:9, fontWeight:700, color:col }}>{label}</span>
                <span style={{ fontSize:8, color:'rgba(253,211,77,0.65)' }}>{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Top spots */}
        {topSpots.length > 0 && (
          <div style={{ background:'#281f33', border:'2px solid #78350f', borderRadius:16, padding:'12px 14px', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <h3 style={{ fontSize:10, color:'#ffd700', fontWeight:700, display:'flex', alignItems:'center', gap:6, margin:0 }}>
                <Star style={{ width:13, height:13, fill:'#fbbf24', color:'#fbbf24' }} /> TOP SPOTS
              </h3>
              <button onClick={() => { soundFx.playClick(); onClose(); onOpenJournal(); }}
                style={{ fontSize:9, color:'#fcd34d', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                Lihat Semua <ChevronRight style={{ width:11, height:11 }} />
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:8 }}>
              {topSpots.map((spot) => (
                <div key={spot.id} onClick={() => { soundFx.playClick(); onSelectSpot(spot); onClose(); }}
                  style={{ background:'#181320', borderRadius:10, border:'1px solid rgba(146,64,14,0.6)', padding:'10px', cursor:'pointer' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:9, fontWeight:700, color:'#fde68a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:110 }}>{spot.name}</span>
                    <span style={{ fontSize:9, color:'#ffd700' }}>{'⭐'.repeat(Math.max(0, Math.min(5, Math.round(spot.rating || 0))))}</span>
                  </div>
                  <p style={{ fontSize:8, color:'rgba(253,211,77,0.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:'0 0 6px' }}>📍 {spot.address}</p>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, color:'#fbbf24', borderTop:'1px solid rgba(120,53,15,0.7)', paddingTop:4 }}>
                    <span>{spot.priceRange}</span><span style={{ color:'#34d399' }}>Buka Peta 🗺️</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop:'1px solid rgba(146,64,14,0.5)', paddingTop:12, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <p style={{ fontSize:9, color:'rgba(253,211,77,0.55)' }}>
            💡 Tekan tombol BAKSO QUEST di kiri atas kapan saja.
          </p>
          <button onClick={() => { soundFx.playSuccess(); onClose(); }}
            style={{ padding:'8px 20px', background:'#800000', color:'#ffd700', fontWeight:700, fontSize:10, borderRadius:10, border:'2px solid #ffd700', cursor:'pointer' }}>
            JELAJAH PETA GAME
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};
