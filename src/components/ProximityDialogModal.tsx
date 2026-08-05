import React from 'react';
import { BaksoSpot } from '../types';
import { soundFx } from '../utils/audio';
import { MapPin, Sparkles, X, CheckCircle2, Ban } from 'lucide-react';

interface ProximityDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  nearbySpot: { spot: BaksoSpot; distance: number } | null;
  onCheckIn: (spot: BaksoSpot) => void;
}

export const ProximityDialogModal: React.FC<ProximityDialogModalProps> = ({
  isOpen,
  onClose,
  nearbySpot,
  onCheckIn,
}) => {
  if (!isOpen || !nearbySpot) return null;

  const { spot, distance } = nearbySpot;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-pixel">
      <div className="relative w-full max-w-md bg-[#1e1726] border-4 border-red-500 rounded-3xl p-5 sm:p-6 text-amber-100 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-red-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-950 border-2 border-red-500 flex items-center justify-center text-xl shadow">
              🚫
            </div>
            <div>
              <h3 className="text-sm sm:text-base text-red-400 font-bold tracking-tight">
                PENAMBAHAN DIBLOKIR!
              </h3>
              <p className="text-[10px] text-red-300/80 font-arcade">
                Sudah ada spot bakso dalam radius 100 meter
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message body */}
        <div className="bg-[#281f33] p-4 rounded-2xl border border-red-800/60 space-y-3 text-xs leading-relaxed">
          <div className="flex items-start gap-2 text-amber-200">
            <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="font-sans-clean">
              Kedai <strong className="text-[#ffd700] font-pixel text-sm block my-1">"{spot.name}"</strong>
              sudah terdaftar di titik ini, hanya berjarak{' '}
              <span className="text-red-400 font-bold font-pixel">{distance} meter</span>!
            </p>
          </div>

          {/* Rule explanation box */}
          <div className="bg-red-950/50 border border-red-700 rounded-xl p-3 flex items-start gap-2">
            <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-200 font-sans-clean">
              <strong className="font-pixel text-red-300">ATURAN RADIUS 100M:</strong> Tidak boleh menambahkan tempat bakso baru
              jika sudah ada spot terdaftar dalam radius <strong>100 meter</strong>, baik milik kamu, squad, maupun pemain lain.
            </p>
          </div>

          <p className="text-[11px] text-amber-300/90 font-sans-clean bg-[#181320] p-2.5 rounded-xl border border-amber-900/80 italic">
            ✅ Kamu bisa melakukan <strong className="text-emerald-400">Check-in</strong> di spot ini untuk membuka Fog of War dan mendapatkan <strong className="text-[#ffd700]">+100 XP</strong>!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-950 hover:bg-amber-900 text-amber-300 font-pixel text-xs rounded-xl border border-amber-700 active:scale-95 transition-all"
          >
            Tutup
          </button>

          <button
            onClick={() => {
              soundFx.playSuccess();
              onCheckIn(spot);
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-pixel font-bold text-xs rounded-xl border-2 border-emerald-300 shadow-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Check-in di Spot Ini (+100 XP)</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
