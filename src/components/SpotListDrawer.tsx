import React, { useState } from 'react';
import { BaksoSpot } from '../types';
import { EXPRESSIONS } from '../data/expressions';
import { CharacterAvatar } from './CharacterAvatar';
import { BaksoRating } from './BaksoRating';
import { soundFx } from '../utils/audio';
import { Search, Filter, MapPin, ChevronRight, X, Sparkles, SortAsc, Trash2 } from 'lucide-react';

interface SpotListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  spots: BaksoSpot[];
  onSelectSpot: (spot: BaksoSpot) => void;
  onViewSpotDetail: (spot: BaksoSpot) => void;
  onAddNewSpotClick: () => void;
  onDeleteSpot?: (id: string) => void;
}

export const SpotListDrawer: React.FC<SpotListDrawerProps> = ({
  isOpen,
  onClose,
  spots,
  onSelectSpot,
  onViewSpotDetail,
  onAddNewSpotClick,
  onDeleteSpot,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'spicy'>('newest');
  const [deletingSpotId, setDeletingSpotId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Extract all unique tags
  const allTags = Array.from(new Set(spots.flatMap((s) => s.tags || [])));

  // Filter & Sort Spots
  const filteredSpots = spots
    .filter((spot) => {
      const matchesSearch =
        spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.review.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag =
        selectedTag === 'all' || (spot.tags && spot.tags.includes(selectedTag));

      const matchesRating = spot.rating >= minRating;

      return matchesSearch && matchesTag && matchesRating;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'spicy') return b.sambalLevel - a.sambalLevel;
      return b.createdAt - a.createdAt; // default newest
    });

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-[#1a1422] border-l-4 border-amber-600 shadow-2xl flex flex-col text-amber-100 transition-all">
      
      {/* Header */}
      <div className="p-4 bg-[#261d30] border-b-2 border-amber-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📜</span>
          <h3 className="text-sm font-pixel text-amber-300">
            JURNAL SPOT BAKSO ({filteredSpots.length})
          </h3>
        </div>
        <button
          onClick={() => {
            soundFx.playClick();
            onClose();
          }}
          className="p-1.5 rounded-lg bg-amber-950 hover:bg-red-950 border border-amber-700 text-amber-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter & Controls Panel */}
      <div className="p-3 bg-[#1e1726] border-b border-amber-900/80 space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kedai, lokasi, atau rasa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#120d18] border border-amber-800 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs text-amber-100 placeholder-amber-200/40 outline-none"
          />
        </div>

        {/* Sorting & Filter row */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 text-amber-300">
            <SortAsc className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'rating' | 'spicy')}
              className="bg-[#120d18] border border-amber-800 rounded-lg p-1 text-[11px] text-amber-200 outline-none"
            >
              <option value="newest">Terbaru</option>
              <option value="rating">Rating Tertinggi</option>
              <option value="spicy">Paling Pedas</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-amber-300">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="bg-[#120d18] border border-amber-800 rounded-lg p-1 text-[11px] text-amber-200 outline-none"
            >
              <option value={0}>Semua Rating</option>
              <option value={4}>Min 🥣 4 Mangkuk</option>
              <option value={5}>Hanya 🥣 5 Mangkuk</option>
            </select>
          </div>
        </div>

        {/* Tags filter pill row */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2 py-0.5 rounded-lg border font-arcade shrink-0 ${
                selectedTag === 'all'
                  ? 'bg-amber-600 text-amber-950 border-amber-300 font-bold'
                  : 'bg-[#120d18] text-amber-300 border-amber-900'
              }`}
            >
              #Semua
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2 py-0.5 rounded-lg border font-arcade shrink-0 ${
                  selectedTag === tag
                    ? 'bg-amber-600 text-amber-950 border-amber-300 font-bold'
                    : 'bg-[#120d18] text-amber-300 border-amber-900'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spot Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredSpots.length === 0 ? (
          <div className="text-center py-10 px-4 text-amber-200/60 space-y-2">
            <span className="text-3xl block">🔍</span>
            <p className="text-xs font-pixel">Tidak ada spot bakso ditemukan!</p>
            <p className="text-xs font-sans-clean">Coba ubah kata kunci pencarian atau filter.</p>
          </div>
        ) : (
          filteredSpots.map((spot) => {
            const exprData = EXPRESSIONS[spot.characterExpression] || EXPRESSIONS.happy;

            return (
              <div
                key={spot.id}
                onClick={() => {
                  soundFx.playClick();
                  onSelectSpot(spot);
                }}
                className="group relative bg-[#261d30] hover:bg-[#32263f] border-2 border-amber-900/80 hover:border-amber-500 rounded-xl p-3 shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <CharacterAvatar expression={spot.characterExpression} size="md" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[9px] font-pixel px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                        {exprData.emoji} {exprData.name}
                      </span>
                      <BaksoRating rating={spot.rating} size="sm" type="bowl" />
                    </div>

                    <h4 className="text-sm font-bold font-pixel text-amber-200 group-hover:text-amber-300 truncate">
                      {spot.name}
                    </h4>

                    <p className="text-xs text-amber-300/80 flex items-center gap-1 truncate mb-1">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      {spot.address}
                    </p>

                    <p className="text-[11px] text-amber-100/80 italic line-clamp-1">
                      "{spot.review}"
                    </p>
                  </div>
                </div>

                {/* Bottom Action Footer inside card */}
                <div className="mt-2.5 pt-2 border-t border-amber-900/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-300/80 shrink-0 flex-wrap">
                    <span className="text-amber-200 font-pixel font-bold">👤 {spot.addedByName || 'Hunter'}</span>
                    <span>•</span>
                    <span>Harga: {spot.priceRange}</span>
                    <span>•</span>
                    <span>Pedas: {spot.sambalLevel}🌶️</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onDeleteSpot && (
                      deletingSpotId === spot.id ? (
                        <div className="flex items-center gap-1 bg-red-950 p-1 rounded-lg border border-red-500">
                          <span className="text-[9px] text-red-200 font-pixel">Hapus?</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              soundFx.playClick();
                              onDeleteSpot(spot.id);
                              setDeletingSpotId(null);
                            }}
                            className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white font-pixel text-[9px] rounded"
                          >
                            Ya
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSpotId(null);
                            }}
                            className="px-1.5 py-0.5 bg-gray-800 hover:bg-gray-700 text-amber-200 font-pixel text-[9px] rounded"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFx.playClick();
                            setDeletingSpotId(spot.id);
                          }}
                          className="p-1 bg-red-950/80 hover:bg-red-900 text-red-300 rounded border border-red-800 transition-colors"
                          title="Hapus Spot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFx.playClick();
                        onViewSpotDetail(spot);
                      }}
                      className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 text-amber-950 font-bold font-pixel text-[9px] rounded border border-amber-300 transition-all flex items-center gap-1"
                    >
                      Detail <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Add New Spot Button at bottom */}
      <div className="p-3 bg-[#1e1726] border-t-2 border-amber-800">
        <button
          onClick={() => {
            soundFx.playClick();
            onAddNewSpotClick();
          }}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-pixel font-bold text-xs rounded-xl border-2 border-amber-200 shadow-xl btn-retro flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          + CATAT SPOT BAKSO BARU
        </button>
      </div>
    </div>
  );
};
