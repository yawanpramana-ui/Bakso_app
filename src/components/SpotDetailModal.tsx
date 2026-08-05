import React from 'react';
import { BaksoSpot } from '../types';
import { EXPRESSIONS } from '../data/expressions';
import { CharacterAvatar } from './CharacterAvatar';
import { BaksoRating } from './BaksoRating';
import { soundFx } from '../utils/audio';
import { X, MapPin, Calendar, Trash2, Award, Share2, Edit3 } from 'lucide-react';

interface SpotDetailModalProps {
  spot: BaksoSpot | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteSpot?: (id: string) => void;
  onEditSpot?: (spot: BaksoSpot) => void;
  onFlyToMap?: (lat: number, lng: number) => void;
  currentUser?: { uid: string } | null;
}

export const SpotDetailModal: React.FC<SpotDetailModalProps> = ({
  spot,
  isOpen,
  onClose,
  onDeleteSpot,
  onEditSpot,
  onFlyToMap,
  currentUser,
}) => {
  // Hanya pemilik spot (ownerId === uid) atau spot tanpa owner yang boleh hapus
  const canDelete = onDeleteSpot && spot && (spot.ownerId === currentUser?.uid || !spot.ownerId);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [copiedToast, setCopiedToast] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
      setCopiedToast(false);
    }
  }, [isOpen, spot?.id]);

  if (!isOpen || !spot) return null;

  const exprData = EXPRESSIONS[spot.characterExpression] || EXPRESSIONS.happy;

  const handleShare = () => {
    soundFx.playClick();
    const shareText = `🍲 Bakso Quest: ${spot.name} - Rating ${spot.rating}/5 Bowls (${exprData.name})!\n📍 ${spot.address}\n"${spot.review}"`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1e1726] border-4 border-amber-500 rounded-2xl shadow-2xl p-4 sm:p-6 text-amber-100 my-auto max-h-[92vh] overflow-y-auto pixel-border-gold">
        
        {/* RPG Character Status Frame Header */}
        <div className="flex items-center justify-between border-b-2 border-amber-800 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <CharacterAvatar expression={spot.characterExpression} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span
                  className="text-[10px] font-pixel font-bold uppercase px-2 py-0.5 rounded border shadow-sm shrink-0"
                  style={{
                    backgroundColor: exprData.bgHex,
                    borderColor: exprData.borderColor,
                    color: '#FEF3C7',
                  }}
                >
                  {exprData.emoji} {exprData.name}
                </span>
                <span className="text-xs font-arcade text-amber-300 shrink-0">
                  Price: <strong className="text-amber-200">{spot.priceRange}</strong>
                </span>
                <span className="text-[10px] bg-amber-950 text-amber-200 border border-amber-700 px-2 py-0.5 rounded font-pixel flex items-center gap-1 shrink-0">
                  <span>👤 Oleh:</span>
                  <strong className="text-[#ffd700]">{spot.addedByName || 'Hunter'}</strong>
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-pixel text-amber-300 tracking-tight leading-tight break-words">
                {spot.name}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-amber-950 hover:bg-red-950 border border-amber-700 text-amber-300 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Location & Date Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#281f33] p-3 rounded-xl border border-amber-900/80 text-xs">
            <div className="flex items-start gap-1.5 text-amber-200 min-w-0 flex-1 break-words">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="break-words">{spot.address}</span>
            </div>
            <div className="flex items-center gap-3 text-amber-300 font-arcade text-sm shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-amber-900/60">
              <span className="flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> {spot.visitDate}
              </span>
              {onFlyToMap && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onFlyToMap(spot.lat, spot.lng);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 text-amber-950 font-bold font-pixel text-[10px] rounded border border-amber-300 transition-all shrink-0 whitespace-nowrap"
                >
                  🗺️ Tampilkan di Peta
                </button>
              )}
            </div>
          </div>

          {/* Photo Gallery Box */}
          {spot.photoUrl && (
            <div className="relative w-full h-56 sm:h-72 rounded-xl border-2 border-amber-700 overflow-hidden bg-black/60 shadow-lg">
              <img
                src={spot.photoUrl}
                alt={spot.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-amber-950/90 text-amber-300 text-[11px] font-pixel px-2.5 py-1 rounded border border-amber-600">
                📸 Dokumentasi Kuliner
              </div>
            </div>
          )}

          {/* RPG Stats Grid (Flavor, Pentol, Sambal) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#281f33] p-4 rounded-xl border border-amber-900">
            <div className="bg-[#181320] p-3 rounded-xl border border-amber-900/60">
              <BaksoRating
                rating={spot.rating}
                type="bowl"
                size="lg"
                label="RATING MANGKUK UTAMA"
              />
            </div>

            <div className="bg-[#181320] p-3 rounded-xl border border-amber-900/60">
              <BaksoRating
                rating={spot.flavorRating}
                type="star"
                size="md"
                label="GURIH KUAH KALDU"
              />
            </div>

            <div className="bg-[#181320] p-3 rounded-xl border border-amber-900/60">
              <BaksoRating
                rating={spot.meatballRating}
                type="star"
                size="md"
                label="TEKSTUR & KUALITAS PENTOL"
              />
            </div>

            <div className="bg-[#181320] p-3 rounded-xl border border-amber-900/60">
              <BaksoRating
                rating={spot.sambalLevel}
                type="chili"
                size="md"
                label="TINGKAT KEPEDASAN SAMBAL"
              />
            </div>
          </div>

          {/* Atmosphere & Extra Info */}
          <div className="bg-[#281f33] p-3.5 rounded-xl border border-amber-900/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-pixel text-amber-400 block mb-0.5">
                SUASANA KEDAI
              </span>
              <span className="text-amber-100 font-bold">
                🏛️ {spot.atmosphere || 'Sangat Nyaman'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-pixel text-amber-400 block mb-0.5">
                KATEGORI HARGA
              </span>
              <span className="text-amber-300 font-pixel font-bold">
                {spot.priceRange} ({spot.priceRange === '$' ? 'Terjangkau' : spot.priceRange === '$$' ? 'Standar' : 'Sultan'})
              </span>
            </div>
          </div>

          {/* Full Review Box */}
          <div className="bg-[#281f33] p-4 rounded-xl border border-amber-800">
            <h4 className="text-xs font-pixel text-amber-300 mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              CATATAN PETUALANG (REVIEW)
            </h4>
            <p className="text-sm text-amber-100/95 leading-relaxed font-sans-clean bg-[#181320] p-3.5 rounded-xl border border-amber-900 italic break-words whitespace-pre-line overflow-hidden">
              "{spot.review}"
            </p>
          </div>

          {/* Tags */}
          {spot.tags && spot.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-pixel text-amber-400">TAGS:</span>
              {spot.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-amber-950 text-amber-300 text-xs rounded-lg border border-amber-700 font-arcade"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="border-t border-amber-800/80 pt-3 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {/* Left: Edit + Delete */}
            <div className="flex items-center gap-2 flex-wrap">
              {onEditSpot && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onClose();
                    onEditSpot(spot);
                  }}
                  className="px-3 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 font-pixel text-xs rounded-xl border border-amber-500 flex items-center gap-1.5 transition-colors shadow whitespace-nowrap"
                >
                  <Edit3 className="w-4 h-4 text-amber-300" />
                  <span>Edit Spot</span>
                </button>
              )}

              {canDelete ? (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-2 bg-red-950 p-2 rounded-xl border-2 border-red-500 animate-fadeIn flex-wrap">
                    <span className="text-xs text-red-200 font-pixel font-bold whitespace-nowrap">Hapus Spot Ini?</span>
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onDeleteSpot!(spot.id);
                        setShowDeleteConfirm(false);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-pixel text-xs rounded-lg border border-white transition-all shadow whitespace-nowrap"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-amber-200 font-pixel text-xs rounded-lg transition-all whitespace-nowrap"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 font-pixel text-xs rounded-xl border border-red-700 flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus</span>
                  </button>
                )
              ) : null}
            </div>

            {/* Right: Share + Close */}
            <div className="flex items-center gap-2 relative flex-wrap">
              {copiedToast && (
                <span className="absolute -top-8 right-0 bg-amber-400 text-amber-950 text-[10px] font-pixel font-bold px-2 py-1 rounded shadow border border-amber-200 animate-bounce whitespace-nowrap">
                  ✨ Berhasil Disalin!
                </span>
              )}
              <button
                onClick={handleShare}
                className="px-3 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 font-pixel text-xs rounded-xl border border-amber-500 flex items-center gap-1.5 transition-all active:translate-y-0.5 whitespace-nowrap"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Bagikan</span>
                <span className="sm:hidden">Share</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-pixel font-bold text-xs rounded-xl border-2 border-amber-200 shadow-md active:translate-y-0.5 whitespace-nowrap"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
